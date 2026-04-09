/**
 * @file Boatman routing with URL hash or filepath
 * @author Giordano de Brito | Grok
 */
"use strict";

class Routes {
    static #registered = [];
    static #fallback = '';
    static #exception = '';
    static #basePath = '';

    static setBasePath(base) {
        this.#basePath = (base || '').replace(/\/+$/, '');
    }

    static getBasePath() {
        return this.#basePath;
    }

    static addRoute(path, callback, middlewares = []) {
        const schema = path.split('/').filter(Boolean);
        this.#registered.push({ path, callback, schema, middlewares });
    }

    static setFallBackRoute(path) {
        this.#fallback = path;
    }

    static getFallBackRoute() {
        return this.#fallback;
    }

    static setExceptionRoute(path) {
        this.#exception = path;
    }

    static getExceptionRoute() {
        return this.#exception;
    }

    static getMatchingRoute(response) {
        return this.#registered.find(x => this.routeCompare(x.schema, response.schema));
    }

    static getRouteParameters(routeSchema, routeArray) {
        const obj = {};
        routeSchema.forEach((x, i) => {
            if (x.startsWith('?')) {
                obj[x.replace('?', '')] = routeArray[i];
            }
        });
        return obj;
    }

    static routeCompare(routeArray, routeArrayCompare) {
        if (routeArray.length !== routeArrayCompare.length) {
            return false;
        }
        for (let i = 0; i < routeArray.length; i++) {
            const a = routeArray[i];
            const b = routeArrayCompare[i];
            if (a.startsWith('?') || b.startsWith('?')) {
                continue;
            }
            if (a !== b) {
                return false;
            }
        }
        return true;
    }
}

class Response {
    #path;
    #pathArray;
    #args = {};
    #query = {};

    constructor(path, pathArray, args) {
        this.#path = path;
        this.#pathArray = pathArray;
        this.#args = args ?? {};
    }

    setQuery(obj) {
        this.#query = obj;
    }

    get path() {
        return this.#path;
    }

    get schema() {
        return this.#pathArray;
    }

    get args() {
        return this.#args;
    }

    get query() {
        return this.#query;
    }
}

class Middlewares {
    static #registeredMiddlewares = [];

    static getMiddlewares() {
        return this.#registeredMiddlewares;
    }

    static addMiddleware(callback) {
        this.#registeredMiddlewares.push(callback);
    }
}

class Router {
    static #args;
    static #currentPath;
    static useHash = true;
    static #basePath = '';

    static setBasePath(base) {
        Routes.setBasePath(base);
        this.#basePath = Routes.getBasePath();
    }

    static setEvents() {
        if (this.useHash) {
            window.addEventListener('hashchange', () => this.routeParsing());
        } else {
            window.addEventListener('popstate', () => this.routeParsing());
        }
        this.routeParsing();
    }

    static goTo(path, args = {}) {
        this.#args = args;
        const fullPath = this.#basePath
            ? this.#basePath + (path === '/' ? '' : path)
            : path;
        if (this.useHash) {
            window.location.hash = fullPath;
        } else {
            window.history.pushState(null, '', fullPath);
            this.routeParsing();
        }
    }

    static getHash() {
        let raw;
        if (this.useHash) {
            raw = window.location.hash.replace('#', '').trim() || '/';
        } else {
            raw = window.location.pathname.trim() || '/';
        }
        if (!this.useHash && this.#basePath && raw.startsWith(this.#basePath)) {
            raw = raw.slice(this.#basePath.length) || '/';
        }
        return raw;
    }

    static routeParsing() {
        let hash = this.getHash();
        if (!hash) {
            hash = '/';
        }

        const pathArray = hash.split('/').filter(Boolean);
        const response = new Response(hash, pathArray, this.#args);
        this.#args = {};

        const routeItem = Routes.getMatchingRoute(response);
        if (!routeItem) {
            this.goTo(Routes.getFallBackRoute() || '/');
            return;
        }

        const queryParams = Routes.getRouteParameters(routeItem.schema, response.schema);
        response.setQuery(queryParams);
        this.#currentPath = response.path;

        this.runRoute(routeItem, response);
    }

    static runRoute(route, response) {
        let queue = [...Middlewares.getMiddlewares(), ...route.middlewares, (...args) => route.callback(response)];
        let next = queue.pop();
        while (queue.length) {
            next = queue.pop().bind(null, next);
        }
        next();
    }

    static getPath() {
        return this.#currentPath;
    }
}

export default new class {
    constructor() {
        console.log('Instantiated boatman');
    }

    getCurrentHash() {
        return Router.getHash();
    }

    getCurrentPath() {
        return Router.getPath();
    }

    route(path, callback = () => {}, options = {}) {
        Routes.addRoute(path, callback, options.middlewares ?? []);
        if (options.exception) {
            this.exception(path);
        }
        if (options.fallback) {
            this.fallback(path);
        }
    }

    fallback(path) {
        Routes.setFallBackRoute(path);
    }

    exception(path) {
        Routes.setExceptionRoute(path);
    }

    use(callback) {
        Middlewares.addMiddleware(callback);
    }

    useHash() {
        Router.useHash = true;
    }

    useFilePath() {
        Router.useHash = false;
    }

    setBasePath(base) {
        Router.setBasePath(base);
    }

    goto(path, args = {}) {
        Router.goTo(path, args);
    }

    throw(message = "An unexpected error occurred") {
        Router.goTo(Routes.getExceptionRoute() || '', { message });
        throw new Error(message);
    }

    reload() {
        Router.routeParsing();
    }

    run() {
        console.log('Running boatman');
        Router.setEvents();
    }
}();