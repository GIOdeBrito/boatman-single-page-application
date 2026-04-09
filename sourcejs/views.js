/**
 * @file View and View Renderer classes.
 * Always caches fetched HTML views in memory.
 */

class ViewRenderer
{
    static #body;
    static #cachedViews = {};  // name -> {html: string, elements: Node[]}
    static #currentView;
    static #dataTagName = 'data-view';

    static setViewTagName(value) { this.#dataTagName = value; }
    static getViewTagName() { return this.#dataTagName; }

    static setBody(body) { this.#body = body; }
    static getBody() { return this.#body; }
    static getCurrentRenderedView() { return this.#currentView; }

    static clearBody() {
        this.#body.innerHTML = "";
    }

    static async render(view) {
        const name = view.getName();

        // Use cached version if available
        if (this.#cachedViews[name]) {
            view.setElements(this.#cachedViews[name].elements);
        }
        // Fetch and cache otherwise
        else {
            await view.fetchHTML();
            this.#cachedViews[name] = {
                html: view.getHTML(),
                elements: view.getElements()
            };
        }

        const previousView = this.#currentView;
        this.#currentView = view;

        previousView?._onbeforeunloadExec();
        this.clearBody();

        view.getElements().forEach(el => this.#body.appendChild(el));

        view._onloadExec();
        previousView?._onafterunloadExec();
    }
}

class View
{
    #name;
    #html = '';
    #elements = [];
    #onloadfunc = () => {};
    #onbeforeunloadfunc = () => {};
    #onafterunloadfunc = () => {};
    #isRendered = false;

    constructor(name) {
        this.#name = name;
    }

    async fetchHTML() {
        const res = await fetch(`${this.#name}`);
        if (!res.ok) throw new Error(`Failed to fetch view: ${this.#name}`);
        this.#html = await res.text();
        this.#parseHTML();
    }

    #parseHTML() {
        const template = document.createElement('template');
        template.innerHTML = this.#html;
        this.#elements = [...template.content.children].map(x => x.cloneNode(true));
    }

    getName() { return this.#name; }
    getElements() { return this.#elements; }
    getHTML() { return this.#html; }

    setElements(elements) { this.#elements = elements; }

    isRendered() { return this.#isRendered; }

    onload(callback) { this.#onloadfunc = callback; return this; }
    onbeforeunload(callback) { this.#onbeforeunloadfunc = callback; return this; }
    onafterunload(callback) { this.#onafterunloadfunc = callback; return this; }

    async render() {
        await ViewRenderer.render(this);
        this.#isRendered = true;
    }

	_onloadExec() {
		this.#onloadfunc?.(ViewRenderer.getBody());
	}

    _onbeforeunloadExec() {
        this.#onbeforeunloadfunc?.();
        this.#isRendered = false;
    }

    _onafterunloadExec() {
        this.#onafterunloadfunc?.();
        this.#isRendered = false;
    }
}

export default new class {

	view (name)
	{
		return new View(name);
	}

	renderer ()
	{
		return ViewRenderer;
	}

}();