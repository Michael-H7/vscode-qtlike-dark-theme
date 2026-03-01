// sample.ts — Theme fixture: TypeScript (4.x / 5.x)
//
// Open in Extension Development Host (F5) and use
// "Developer: Inspect Editor Tokens and Scopes" to verify colours.
//
// Key things to check:
//   interface / type names    → coral red      (#ff8080)
//   @Decorator names          → hot pink       (#ff6aad)
//   generic type params <T>   → coral red italic (#ff8080)
//   satisfies keyword         → teal italic    (#45c6d6)
//   using declaration         → teal italic    (#45c6d6)
//   template literal ${...}   → teal italic    (#45c6d6)

import { EventEmitter } from "events";
import * as path from "path";

// ── Type aliases and unions ───────────────────────────────────────────────────

type ID          = string | number;
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Result<T, E extends Error = Error> = { ok: true; value: T } | { ok: false; error: E };
type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };
type Awaited<T>  = T extends Promise<infer U> ? U : T;

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PAGE_SIZE = 100 as const;
const BASE_URL      = "https://api.example.com" as const;
const RETRY_DELAYS  = [100, 500, 1000, 5000] as const;

// ── Enums ─────────────────────────────────────────────────────────────────────

enum HttpMethod {
    GET    = "GET",
    POST   = "POST",
    PUT    = "PUT",
    DELETE = "DELETE",
    PATCH  = "PATCH",
}

const enum LogLevel {
    Trace   = 0,
    Debug   = 1,
    Info    = 2,
    Warning = 3,
    Error   = 4,
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Identifiable {
    readonly id: ID;
}

interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

interface Pageable {
    page:     number;
    pageSize: number;
    total:    number;
}

interface Repository<T extends Identifiable> {
    findById(id: ID): Promise<Nullable<T>>;
    findAll(options?: Partial<Pageable>): Promise<T[]>;
    save(entity: Omit<T, "id">): Promise<T>;
    update(id: ID, patch: Partial<T>): Promise<Nullable<T>>;
    delete(id: ID): Promise<boolean>;
}

// ── Classes with decorators ───────────────────────────────────────────────────

function injectable(target: new (...args: unknown[]) => unknown): void {
    Reflect.defineMetadata("injectable", true, target);
}

function log(level: LogLevel = LogLevel.Info) {
    return function <T extends object, K extends keyof T>(
        target: T,
        propertyKey: K,
        descriptor: TypedPropertyDescriptor<(...args: unknown[]) => unknown>
    ): TypedPropertyDescriptor<(...args: unknown[]) => unknown> {
        const original = descriptor.value!;
        descriptor.value = function (...args: unknown[]) {
            console.log(`[${LogLevel[level]}] ${String(propertyKey)}(${args.join(", ")})`);
            return original.apply(this, args);
        };
        return descriptor;
    };
}

interface User extends Identifiable, Timestamped {
    name:     string;
    email:    string;
    role:     "admin" | "user" | "guest";
    metadata: Record<string, unknown>;
}

@injectable
class UserService {
    private readonly cache = new Map<ID, User>();

    constructor(
        private readonly repo: Repository<User>,
        private readonly emitter: EventEmitter
    ) {}

    @log(LogLevel.Debug)
    async getUser(id: ID): Promise<Nullable<User>> {
        if (this.cache.has(id)) {
            return this.cache.get(id) ?? null;
        }
        const user = await this.repo.findById(id);
        if (user) this.cache.set(id, user);
        return user;
    }

    async createUser(input: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
        const user = await this.repo.save({
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.emitter.emit("user:created", user);
        return user;
    }

    clearCache(): void {
        this.cache.clear();
    }
}

// ── Generics ──────────────────────────────────────────────────────────────────

class Stack<T> {
    private items: T[] = [];

    push(item: T): void     { this.items.push(item); }
    pop(): T | undefined    { return this.items.pop(); }
    peek(): T | undefined   { return this.items[this.items.length - 1]; }
    get size(): number      { return this.items.length; }
    isEmpty(): boolean      { return this.items.length === 0; }

    [Symbol.iterator](): Iterator<T> {
        let index = this.items.length - 1;
        const items = this.items;
        return {
            next(): IteratorResult<T> {
                if (index >= 0) return { value: items[index--], done: false };
                return { value: undefined as unknown as T, done: true };
            }
        };
    }
}

function zip<A, B>(a: A[], b: B[]): [A, B][] {
    const len = Math.min(a.length, b.length);
    return Array.from({ length: len }, (_, i) => [a[i], b[i]]);
}

function groupBy<T, K extends string | number | symbol>(
    items: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return items.reduce((acc, item) => {
        const key = keyFn(item);
        (acc[key] ??= []).push(item);
        return acc;
    }, {} as Record<K, T[]>);
}

// ── satisfies operator (TS 4.9) ───────────────────────────────────────────────

const palette = {
    red:   [255, 0, 0],
    green: [0, 255, 0],
    blue:  [0, 0, 255],
} satisfies Record<string, [number, number, number]>;

// red, green, blue are typed as [number, number, number], not number[]
const [r, g, b] = palette.red;

// ── using declaration (TS 5.2 / ES2023) ──────────────────────────────────────

class FileHandle {
    constructor(readonly name: string) {
        console.log(`opened ${name}`);
    }
    [Symbol.dispose](): void {
        console.log(`closed ${this.name}`);
    }
}

async function withFile(name: string): Promise<void> {
    using handle = new FileHandle(name);
    console.log(`working with ${handle.name}`);
    // handle is automatically disposed at end of scope
}

// ── Template literals and tagged templates ────────────────────────────────────

type Route = `/api/${string}`;
type EventName = `on${Capitalize<string>}`;

function css(strings: TemplateStringsArray, ...values: (string | number)[]): string {
    return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
}

const color = "#ff8080";
const size  = 16;
const style = css`
    color: ${color};
    font-size: ${size}px;
    padding: ${size / 2}px;
`;

// ── Conditional / mapped / infer types ───────────────────────────────────────

type NonNullable2<T> = T extends null | undefined ? never : T;
type ReturnType2<T extends (...args: unknown[]) => unknown> =
    T extends (...args: unknown[]) => infer R ? R : never;

type Flatten<T> = T extends Array<infer Item> ? Item : T;

type ReadonlyUser = DeepReadonly<User>;

// Mapped type with template literal key remapping
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// ── Async / Promises ──────────────────────────────────────────────────────────

async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = MAX_PAGE_SIZE,
    delays = RETRY_DELAYS
): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (i < delays.length) {
                await new Promise(resolve => setTimeout(resolve, delays[i]));
            }
        }
    }
    throw lastError ?? new Error("All attempts failed");
}

async function fetchJson<T>(url: string): Promise<Result<T>> {
    try {
        const res  = await fetch(url);
        const data = await res.json() as T;
        return { ok: true, value: data };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
}

// ── Discriminated unions ──────────────────────────────────────────────────────

type Shape =
    | { kind: "circle";    radius: number }
    | { kind: "rect";      width: number; height: number }
    | { kind: "triangle";  base: number;  height: number };

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle":   return Math.PI * shape.radius ** 2;
        case "rect":     return shape.width * shape.height;
        case "triangle": return 0.5 * shape.base * shape.height;
    }
}

// ── String utilities ──────────────────────────────────────────────────────────

function buildUrl(base: string, ...segments: string[]): string {
    const joined = segments.map(s => s.replace(/^\/+|\/+$/g, "")).join("/");
    return `${base}/${joined}`;
}

// ── Export ────────────────────────────────────────────────────────────────────

export { UserService, Stack, zip, groupBy, area, buildUrl, withRetry, fetchJson };
export type { User, Repository, Result, Nullable, ID, Shape, HttpMethod };
