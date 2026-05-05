/**
 * @file Boatman routing with URL hash or filepath
 * @author Giordano de Brito 
 */

class NavigationCancelled
{
    constructor(reason)
    {
        this.reason = reason ?? 'Navigation cancelled by middleware.';
    }
}

class Routes
{
    static #registered = [];
    static #fallback = '';
    static #exception = '';
    static #basePath = '';

    static setBasePath(base)
    {
        this.#basePath = (base || '').replace(/\/+$/, '');
    }

    static getBasePath()
    {
        return this.#basePath;
    }

    static addRoute(path, callback, middlewares = [])
    {
        const existingIndex = this.#registered.findIndex(x => x.path === path);

        if (existingIndex !== -1)
        {
            console.warn(`Boatman: route '${path}' already registered, replacing.`);
            this.#registered[existingIndex] = { path, callback, schema: this.#registered[existingIndex].schema, middlewares };
            return;
        }

        const schema = path.split('/').filter(Boolean);
        this.#registered.push({ path, callback, schema, middlewares });
    }

    static setFallbackRoute(path)
    {
        this.#fallback = path;
    }

    static getFallbackRoute()
    {
        return this.#fallback;
    }

    static setExceptionRoute(path)
    {
        this.#exception = path;
    }

    static getExceptionRoute()
    {
        return this.#exception;
    }

    static getMatchingRoute(response)
    {
        return this.#registered.find(x => this.routeCompare(x.schema, response.schema));
    }

    static getRouteParameters(routeSchema, routeArray)
    {
        const obj = {};
        routeSchema.forEach((x, i) =>
        {
            if (x.startsWith(':'))
            {
                obj[x.replace(':', '')] = routeArray[i];
            }
        });
        return obj;
    }

    static routeCompare(routeArray, routeArrayCompare)
    {
        for (let i = 0; i < routeArray.length; i++)
        {
            if (routeArray[i] === '**')
            {
                return true;
            }
        }

        if (routeArray.length !== routeArrayCompare.length)
        {
            return false;
        }

        for (let i = 0; i < routeArray.length; i++)
        {
            const a = routeArray[i];

            if (a.startsWith(':'))
            {
                continue;
            }

            if (a !== routeArrayCompare[i])
            {
                return false;
            }
        }

        return true;
    }
}

class Response
{
    #path;
    #pathArray;
    #args;
    #query;
    #cancelled = false;

    constructor(path, pathArray, args)
    {
        this.#path = path;
        this.#pathArray = pathArray;
        this.#args = args ?? {};
        this.#query = {};
    }

    setQuery(obj)
    {
        this.#query = { ...this.#query, ...obj };
    }

    get path()
    {
        return this.#path;
    }

    get schema()
    {
        return this.#pathArray;
    }

    get args()
    {
        return this.#args;
    }

    get query()
    {
        return this.#query;
    }

    get cancelled()
    {
        return this.#cancelled;
    }

    cancel(reason)
    {
        this.#cancelled = true;
        throw new NavigationCancelled(reason);
    }
}

class Middlewares
{
    static #registeredMiddlewares = [];

    static getMiddlewares()
    {
        return this.#registeredMiddlewares;
    }

    static addMiddleware(callback)
    {
        this.#registeredMiddlewares.push(callback);
    }
}

class Router
{
    static #args;
    static #currentPath;
    static useHash = true;
    static #basePath = '';
    static #isRunning = false;

    static setBasePath(base)
    {
        Routes.setBasePath(base);
        this.#basePath = Routes.getBasePath();
    }

    static setEvents()
    {
        if (this.#isRunning)
        {
            return;
        }

        this.#isRunning = true;

        const listener = () => this.routeParsing();

        if (this.useHash)
        {
            window.addEventListener('hashchange', listener);
        }
        else
        {
            window.addEventListener('popstate', listener);
        }

        this.routeParsing();
    }

    static goTo(path, args = {})
    {
        this.#args = args;
        const fullPath = this.#basePath
            ? this.#basePath + (path === '/' ? '' : path)
            : path;

        if (this.useHash)
        {
            window.location.hash = fullPath;
        }
        else
        {
            window.history.pushState(null, '', fullPath);
        }

        this.routeParsing();
    }

    static getHash()
    {
        let raw;
        let queryString = '';

        if (this.useHash)
        {
            const hash = window.location.hash.replace('#', '').trim();
            const qIndex = hash.indexOf('?');

            if (qIndex !== -1)
            {
                raw = hash.slice(0, qIndex) || '/';
                queryString = hash.slice(qIndex + 1);
            }
            else
            {
                raw = hash || '/';
            }
        }
        else
        {
            raw = window.location.pathname.trim() || '/';
            queryString = window.location.search.replace('?', '');

            if (this.#basePath && raw.startsWith(this.#basePath))
            {
                raw = raw.slice(this.#basePath.length) || '/';
            }
        }

        return { raw, queryString };
    }

    static parseQueryString(queryString)
    {
        const params = {};

        if (!queryString)
        {
            return params;
        }

        queryString.split('&').forEach(part =>
        {
            const [key, value = ''] = part.split('=');

            if (key)
            {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
        });

        return params;
    }

    static routeParsing()
    {
        const { raw, queryString } = this.getHash();
        let hash = raw || '/';

        const pathArray = hash.split('/').filter(Boolean);
        const response = new Response(hash, pathArray, this.#args);
        this.#args = {};

        const urlQuery = this.parseQueryString(queryString);
        response.setQuery(urlQuery);

        const routeItem = Routes.getMatchingRoute(response);

        if (!routeItem)
        {
            this.goTo(Routes.getFallbackRoute() || '/');
            return;
        }

        const schemaParams = Routes.getRouteParameters(routeItem.schema, response.schema);
        response.setQuery(schemaParams);

        this.#currentPath = response.path;

        this.runRoute(routeItem, response);
    }

    static async runRoute(route, response)
    {
        const queue = [...Middlewares.getMiddlewares(), ...route.middlewares, () => route.callback(response)];
        let next = queue.pop();

        while (queue.length)
        {
            next = queue.pop().bind(null, next);
        }

        try
        {
            await next();
        }
        catch (error)
        {
            if (error instanceof NavigationCancelled)
            {
                return;
            }

            console.error('Boatman: route error:', error);
            const exceptionPath = Routes.getExceptionRoute();

            if (exceptionPath)
            {
                this.goTo(exceptionPath, { message: error.message });
            }
            else
            {
                throw error;
            }
        }
    }

    static getPath()
    {
        return this.#currentPath;
    }
}

export default new class
{
    constructor()
    {
        console.log('Instantiated boatman');
    }

    getCurrentHash()
    {
        return Router.getHash().raw;
    }

    getCurrentPath()
    {
        return Router.getPath();
    }

    route(path, callback = () => {}, options = {})
    {
        Routes.addRoute(path, callback, options.middlewares ?? []);

        if (options.exception)
        {
            this.exception(path);
        }

        if (options.fallback)
        {
            this.fallback(path);
        }
    }

    fallback(path)
    {
        Routes.setFallbackRoute(path);
    }

    exception(path)
    {
        Routes.setExceptionRoute(path);
    }

    use(callback)
    {
        Middlewares.addMiddleware(callback);
    }

    useHash()
    {
        Router.useHash = true;
    }

    useFilePath()
    {
        Router.useHash = false;
    }

    setBasePath(base)
    {
        Router.setBasePath(base);
    }

    goto(path, args = {})
    {
        Router.goTo(path, args);
    }

    throw(message = 'An unexpected error occurred')
    {
        const exceptionPath = Routes.getExceptionRoute();

        if (exceptionPath)
        {
            Router.goTo(exceptionPath, { message });
        }

        throw new Error(message);
    }

    reload()
    {
        Router.routeParsing();
    }

    run()
    {
        console.log('Running boatman');
        Router.setEvents();
    }
}();
