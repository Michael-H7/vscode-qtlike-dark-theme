// sample.js — Theme fixture: JavaScript (ES2022+)
//
// Open in Extension Development Host (F5) and use
// "Developer: Inspect Editor Tokens and Scopes" to verify colours.
//
// Pure JS (no types) — verifies the theme works without TypeScript LSP.

"use strict";

// ── Constants / module-level ─────────────────────────────────────────────────

const MAX_RETRIES  = 3;
const BASE_URL     = "https://api.example.com";
const EMPTY_ARRAY  = Object.freeze([]);

// ── Classes ───────────────────────────────────────────────────────────────────

class EventEmitter {
    #listeners = new Map();

    on(event, handler) {
        const list = this.#listeners.get(event) ?? [];
        list.push(handler);
        this.#listeners.set(event, list);
        return this;
    }

    off(event, handler) {
        const list = this.#listeners.get(event);
        if (list) {
            const idx = list.indexOf(handler);
            if (idx !== -1) list.splice(idx, 1);
        }
        return this;
    }

    emit(event, ...args) {
        const list = this.#listeners.get(event) ?? EMPTY_ARRAY;
        for (const handler of list) {
            handler(...args);
        }
    }

    once(event, handler) {
        const wrapper = (...args) => {
            handler(...args);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }
}

class Store extends EventEmitter {
    #state;
    #history = [];

    constructor(initialState) {
        super();
        this.#state = structuredClone(initialState);
    }

    get state() { return structuredClone(this.#state); }

    dispatch(action) {
        const prevState = this.#state;
        this.#state = this.#reduce(this.#state, action);
        this.#history.push({ action, prevState });
        this.emit("change", this.#state, action);
    }

    #reduce(state, action) {
        switch (action.type) {
            case "SET":   return { ...state, [action.key]: action.value };
            case "RESET": return {};
            default:      return state;
        }
    }

    undo() {
        const last = this.#history.pop();
        if (last) {
            this.#state = last.prevState;
            this.emit("change", this.#state, { type: "UNDO" });
        }
    }
}

// ── Prototype / old-style class ────────────────────────────────────────────────

function LinkedList() {
    this.head = null;
    this.size = 0;
}

LinkedList.prototype.push = function push(value) {
    const node = { value, next: this.head };
    this.head  = node;
    this.size++;
};

LinkedList.prototype[Symbol.iterator] = function* () {
    let cur = this.head;
    while (cur !== null) {
        yield cur.value;
        cur = cur.next;
    }
};

// ── Generators ────────────────────────────────────────────────────────────────

function* range(start, stop, step = 1) {
    for (let i = start; i < stop; i += step) yield i;
}

async function* streamLines(asyncIterable) {
    let buffer = "";
    for await (const chunk of asyncIterable) {
        buffer += chunk;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
            yield buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
        }
    }
    if (buffer) yield buffer;
}

// ── Destructuring and spread ──────────────────────────────────────────────────

function mergeOptions(defaults, ...overrides) {
    return Object.assign({}, defaults, ...overrides);
}

function pick(obj, ...keys) {
    return Object.fromEntries(keys.map(k => [k, obj[k]]));
}

function omit(obj, ...keys) {
    const set = new Set(keys);
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !set.has(k)));
}

// ── Promises / async ─────────────────────────────────────────────────────────

async function fetchWithRetry(url, options = {}) {
    const { retries = MAX_RETRIES, timeout = 5000 } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return await res.json();
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 2 ** attempt * 100));
        } finally {
            clearTimeout(timer);
        }
    }
}

// ── Proxy / Reflect ───────────────────────────────────────────────────────────

function observable(target, onChange) {
    return new Proxy(target, {
        set(obj, prop, value) {
            const oldValue = obj[prop];
            obj[prop] = value;
            if (oldValue !== value) onChange(prop, value, oldValue);
            return true;
        },
        deleteProperty(obj, prop) {
            const hadProp = prop in obj;
            delete obj[prop];
            if (hadProp) onChange(prop, undefined, obj[prop]);
            return true;
        }
    });
}

// ── WeakRef / FinalizationRegistry ───────────────────────────────────────────

const registry = new FinalizationRegistry(key => {
    console.log(`${key} was garbage collected`);
});

function trackObject(obj, key) {
    const ref = new WeakRef(obj);
    registry.register(obj, key);
    return ref;
}

// ── Regular expressions ───────────────────────────────────────────────────────

const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE  = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/;
const HEX_COLOR = /#(?:[0-9a-fA-F]{3}){1,2}/g;

function parseDate(str) {
    const match = ISO_DATE.exec(str);
    if (!match) return null;
    const { year, month, day } = match.groups;
    return new Date(+year, +month - 1, +day);
}

// ── Template literals ─────────────────────────────────────────────────────────

function html(strings, ...values) {
    const escape = v => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return strings.reduce((acc, str, i) => acc + str + (i < values.length ? escape(values[i]) : ""), "");
}

const userName = "<script>alert(1)</script>";
const safe = html`<p>Hello, ${userName}!</p>`;

// ── Symbols and well-known symbols ────────────────────────────────────────────

const TYPE_TAG   = Symbol("typeTag");
const VALIDATOR  = Symbol.for("validator");

class MyCollection {
    #items;
    [TYPE_TAG] = "MyCollection";

    constructor(...items) { this.#items = [...items]; }

    [Symbol.iterator]()   { return this.#items[Symbol.iterator](); }
    get [Symbol.toStringTag]() { return "MyCollection"; }
}

// ── Nullish coalescing / optional chaining ────────────────────────────────────

function getNestedValue(obj, path, defaultVal = null) {
    return path.split(".").reduce((cur, key) => cur?.[key], obj) ?? defaultVal;
}

// ── Logical assignment ────────────────────────────────────────────────────────

function ensureDefaults(config) {
    config.timeout   ??= 5000;
    config.retries   ??= 3;
    config.debug     ||= false;
    config.verbose   &&= config.debug;
    return config;
}

// ── Entry point ───────────────────────────────────────────────────────────────

const store = new Store({ count: 0 });
store.on("change", (state, action) => {
    console.log(`[${action.type}]`, state);
});

store.dispatch({ type: "SET", key: "count", value: 1 });
store.dispatch({ type: "SET", key: "name",  value: "test" });
store.undo();

const ll = new LinkedList();
for (const n of range(1, 6)) ll.push(n);
console.log([...ll]);

console.log(safe);
console.log(parseDate("2024-01-15"));
console.log(EMAIL_RE.test("user@example.com"));
