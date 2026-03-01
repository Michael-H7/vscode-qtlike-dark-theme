/**
 * Qt Creator-Like Dark Theme — Build Script
 *
 * Generates `themes/qtlike-dark-theme.json` from TypeScript source.
 *
 * Usage:
 *   npm run build-theme        (via package.json script)
 *   npx tsx scripts/build.ts   (directly)
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 * VS Code syntax highlighting works in two independent layers that compose:
 *
 *  1. TextMate layer  (`tokenColors`)
 *     Regex-based tokenisation driven by grammar files (.tmLanguage / .json).
 *     Always present, runs instantly. Coverage depends on the grammar quality.
 *     Scope naming follows the Sublime Text Scope Naming Guide (de-facto
 *     standard), which extends the original TextMate spec.
 *     → https://www.sublimetext.com/docs/scope_naming.html
 *     → https://macromates.com/manual/en/language_grammars
 *
 *  2. Semantic layer  (`semanticTokenColors`)
 *     Produced by the language server (LSP / language extension). Runs after
 *     the LSP has fully resolved the file's symbols, so it knows whether `x`
 *     is a parameter, a field, or a local variable. Overrides TextMate where
 *     both match. Enabled by `"semanticHighlighting": true` in the theme.
 *     The 22 standard token types and 10 modifiers are documented at:
 *     → https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide
 *
 * When both rules exist for the same token the semantic rule wins.
 * If a semantic token has no matching semantic rule VS Code falls back to
 * predefined TextMate scope mappings (e.g. `property` → `variable.other.property`).
 *
 * ─── Inspecting scopes ───────────────────────────────────────────────────────
 * To see which TextMate scopes and semantic token types apply to any token:
 *   F1 → "Developer: Inspect Editor Tokens and Scopes"
 * This is the primary debugging tool when adding rules for a new language.
 *
 * ─── Reference themes consulted ──────────────────────────────────────────────
 *   VS Code Dark+ (built-in reference implementation)
 *     — github.com/microsoft/vscode/tree/main/extensions/theme-defaults
 *   Vitesse (build-script pattern reference — Anthony Fu)
 *     — github.com/antfu/vscode-theme-vitesse
 *   Catppuccin (modern multi-language semantic token reference)
 *     — github.com/catppuccin/vscode
 *
 * See docs/REFERENCES.md for the full source catalogue.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import * as p from "./palette";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenSettings {
  foreground?: string;
  fontStyle?: string;
}

interface TokenColor {
  name: string;
  scope: string | string[];
  settings: TokenSettings;
}

type SemanticValue =
  | string
  | { foreground?: string; fontStyle?: string };

interface Theme {
  name: string;
  type: "dark" | "light";
  semanticHighlighting: boolean;
  semanticTokenColors: Record<string, SemanticValue>;
  tokenColors: TokenColor[];
  colors: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shorthand: rule with foreground colour only */
function fg(
  name: string,
  scope: string | string[],
  foreground: string
): TokenColor {
  return { name, scope, settings: { foreground } };
}

/** Shorthand: rule with both foreground colour and font style */
function fgs(
  name: string,
  scope: string | string[],
  foreground: string,
  fontStyle: string
): TokenColor {
  return { name, scope, settings: { foreground, fontStyle } };
}

/** Shorthand: font-style override only (no foreground change) */
function fs(
  name: string,
  scope: string | string[],
  fontStyle: string
): TokenColor {
  return { name, scope, settings: { fontStyle } };
}

/** Semantic token shorthand: colour only */
function sc(foreground: string): SemanticValue {
  return foreground;
}

/** Semantic token shorthand: colour + font style */
function scs(foreground: string, fontStyle: string): SemanticValue {
  return { foreground, fontStyle };
}

/** Semantic token shorthand: font style only (no colour change) */
function sfs(fontStyle: string): SemanticValue {
  return { fontStyle };
}

// ─── Semantic Token Colours ───────────────────────────────────────────────────
//
// These rules are applied by the language server and override TextMate when
// both match. The standard token types are documented at:
//   https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide
//
// Language servers that emit semantic tokens for priority languages:
//   TypeScript / JavaScript  — built-in tsserver / vscode
//   Python                   — Pylance (ms-python.vscode-pylance)
//   C / C++                  — clangd (llvm-vs-code-extensions.vscode-clangd)
//                              or ms-vscode.cpptools
//   C#                       — C# Dev Kit / OmniSharp (ms-dotnettools.*)
//   Rust                     — rust-analyzer (rust-lang.rust-analyzer)
//   Go                       — gopls (golang.go)  requires opt-in:
//                              "gopls": { "ui.semanticTokens": true }
//
// Selector syntax: (tokenType)(.modifier)*(:language)?
//   "property"               — all languages
//   "property.readonly"      — readonly modifier, all languages
//   "variable:java"          — variables in Java only
//   "*.declaration"          — any token with the declaration modifier

const semanticTokenColors: Record<string, SemanticValue> = {

  // ── Preserved from original theme ─────────────────────────────────────────
  // enumMember maps to the DOC_TAG green (italic) to match Qt Creator's
  // convention of giving enum values a distinct "annotation-like" colour.
  "enumMember":                 scs(p.DOC_TAG, "italic"),
  "variable.constant":          sc(p.CONSTANT),
  "variable.defaultLibrary":    sc(p.TYPE),
  "variable.global":            sc(p.GLOBAL_VAR),

  // ── Type system ───────────────────────────────────────────────────────────
  // namespace / class / interface / struct / enum → TYPE (coral red)
  // These are the "named type" tokens emitted by every major language server.
  // A single rule covers C++ classes, C# interfaces, Python class defs,
  // TypeScript interfaces, Rust structs, Go types, etc.
  "namespace":                  sc(p.TYPE),
  "class":                      sc(p.TYPE),
  "class.defaultLibrary":       sc(p.TYPE),
  "interface":                  sc(p.TYPE),
  "struct":                     sc(p.TYPE),
  "enum":                       sc(p.TYPE),
  // `type` covers type aliases and typedefs — STORAGE (dusty mauve) to
  // visually distinguish them from concrete class/struct names.
  "type":                       sc(p.STORAGE),
  // Type parameters / generics (T, K, V, TResult, …) — italic TYPE
  "typeParameter":              scs(p.TYPE, "italic"),

  // ── Variables & properties ────────────────────────────────────────────────
  // `property` is the cross-language member-field token.
  // One rule covers: C++ fields (clangd), C# fields/properties (OmniSharp),
  // Python instance attributes (Pylance), TypeScript class fields,
  // Rust struct fields (rust-analyzer), Go struct fields (gopls).
  "property":                   sc(p.MEMBER),
  // C++ override: field access via . or -> must be bright yellow (Qt Creator
  // convention). The language-scoped rule beats the generic `property` above.
  "property:cpp":               sc(p.MEMBER_CPP),
  "property.readonly":          sc(p.CONSTANT),
  "property.static":            sc(p.MEMBER),
  "variable":                   sc(p.MEMBER),
  "variable.readonly":          sc(p.CONSTANT),
  // Parameters get their own colour — distinct from numeric constants (brown)
  // and from member variables (sandy orange).
  "parameter":                  sc(p.PARAMETER),
  // Pylance emits selfParameter / clsParameter for Python's `self` and `cls`.
  // These are not ordinary parameters — they're implicit receivers and should
  // read as keywords (teal italic) just like `this` in C++/C#/JS/TS.
  "selfParameter":              scs(p.KEYWORD, "italic"),
  "clsParameter":               scs(p.KEYWORD, "italic"),

  // ── Functions & methods ───────────────────────────────────────────────────
  "function":                   sc(p.DEFAULT_FG),
  "function.defaultLibrary":    sc(p.DEFAULT_FG),
  "method":                     sc(p.DEFAULT_FG),
  "method.static":              sc(p.DEFAULT_FG),

  // ── Decorators / annotations / macros ────────────────────────────────────
  // Python @decorator, TypeScript @Decorator, Rust #[attribute] macros,
  // Java @Annotation all map to PREPROCESSOR (hot pink) — they share
  // the "meta / compile-time" colour with C preprocessor directives.
  "decorator":                  sc(p.PREPROCESSOR),
  "macro":                      sc(p.PREPROCESSOR),

  // ── Other standard token types ────────────────────────────────────────────
  "label":                      sc(p.TYPE),
  "event":                      sc(p.MEMBER),
  "keyword":                    scs(p.KEYWORD, "italic"),
  "operator":                   sc(p.DEFAULT_FG),
  "comment":                    scs(p.COMMENT, "italic"),
  "string":                     sc(p.STRING),
  "number":                     sc(p.CONSTANT),
  "regexp":                     sc(p.STRING),
};

// ─── TextMate Token Colours ───────────────────────────────────────────────────
//
// Scope names follow the Sublime Text Scope Naming Guide (de-facto standard):
//   https://www.sublimetext.com/docs/scope_naming.html
//
// The original 11 TextMate root-group spec:
//   https://macromates.com/manual/en/language_grammars
//
// Use "Developer: Inspect Editor Tokens and Scopes" (F1 command palette) to
// see the exact scopes emitted for any token in an open file.
//
// Organisation: rules are grouped by concept, then by language. Later rules
// override earlier ones for the same scope, so language-specific rules that
// appear after the universal rules take priority.

const tokenColors: TokenColor[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // FONT-STYLE OVERRIDES
  // These rules change only the style (italic / bold), not the colour.
  // They are intentionally early so language-specific colour rules override
  // the colour while still inheriting the style.
  // ═══════════════════════════════════════════════════════════════════════════

  fs("Italic — attributes and special vars", [
    // JS/TS/JSX/TSX attribute names in JSX expressions  (<Foo bar={…} />)
    "entity.other.attribute-name.js",
    "entity.other.attribute-name.ts",
    "entity.other.attribute-name.jsx",
    "entity.other.attribute-name.tsx",
    // `super` reference
    "variable.language.super",
    // Block & line comments — the colour rule is below; this sets italic
    "comment.line.double-slash",
    "comment.block.documentation",
    // Python import / flow keywords are italic (colour still from keyword rule)
    "keyword.control.import.python",
    "keyword.control.flow.python",
    // Markdown emphasis
    "markup.italic.markdown",
  ], "italic"),

  fs("Bold — C++ function definitions", [
    // Function *definitions* in C++ are bold to distinguish them from calls.
    // Calls remain DEFAULT_FG weight via entity.name.function below.
    "entity.name.function.definition.cpp",
    "entity.name.scope-resolution.function.definition",
  ], "bold"),

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYWORDS  (KEYWORD — teal, italic)
  //
  // Covers: language control keywords, word-operator keywords, storage
  // modifiers, `this`/`self`, CSS selectors, template-expression braces.
  //
  // Scope roots used:
  //   keyword.*              — all keyword sub-types (Sublime naming guide §2)
  //   storage.modifier.*     — access/qualifier modifiers (public, const, …)
  //   storage.type.class     — `class` keyword itself (not the class *name*)
  //   storage.type.enum.*    — `enum` keyword variants
  //   storage.type.template  — C++ `template` keyword
  // ═══════════════════════════════════════════════════════════════════════════

  fgs("Keywords — universal", [
    "keyword",
    "keyword.control",
    "token.package.keyword",
    "token.debug-token",
  ], p.KEYWORD, "italic"),

  fgs("Keywords — word operators (instanceof, typeof, …)", [
    // These read like keywords but are classified under keyword.operator.*
    // by most grammars. We keep them KEYWORD-coloured and italic.
    "keyword.operator.expression.instanceof",
    "keyword.operator.expression.typeof",
    "keyword.operator.expression.keyof",
    "keyword.operator.expression.void",
    "keyword.operator.expression.in",
    "keyword.operator.expression.of",
    "keyword.operator.expression.delete",
    "keyword.operator.new",
    "keyword.operator.delete",
    "keyword.operator.ternary",
    "keyword.operator.optional",
    "keyword.operator.instanceof.java",
    // Python logical keywords
    "keyword.operator.logical.python",
    // Go — these operators are written as punctuation but are conceptually keywords
    "keyword.operator.arithmetic.go",
    "keyword.operator.address.go",
    // Rust sigil operators (* & as raw pointer / reference)
    "keyword.operator.sigil.rust",
    // Template literal expression delimiters ${ }
    "punctuation.definition.template-expression.begin",
    "punctuation.definition.template-expression.end",
    "punctuation.section.embedded",
    // CSS/SCSS meta selectors
    "meta.selector",
    // Markup (for italic emphasis in Markdown)
    "markup.italic",
    "punctuation.definition.italic",
    // Markdown links treated as keyword-class accents
    "markup.underline.link.markdown",
    "markup.underline.link.image.markdown",
    // Laravel Blade template tags
    "text.html.laravel-blade source.php.embedded.line.html entity.name.tag.laravel-blade",
    "text.html.laravel-blade source.php.embedded.line.html support.constant.laravel-blade",
    // XI theme tokens (pass-through from original)
    "constant.regexp.xi",
  ], p.KEYWORD, "italic"),

  fgs("Keywords — C++ storage modifiers and class keywords", [
    "storage.type.enum.cpp",
    "storage.type.enum.enum-key.class.cpp",
    "storage.modifier.specifier.functional.pre-parameters",
    "storage.modifier.specifier.functional.post-parameters",
    "storage.modifier.specifier.static.cpp",
    "storage.modifier.specifier.const.cpp",
    "storage.modifier.const.cpp",
    "storage.modifier.constexpr.cpp",
    "storage.modifier.virtual.cpp",
    "storage.type.template.cpp",
    "storage.type.template.argument.typename.cpp",
    "storage.type.namespace.definition.cpp",
    "storage.type.namespace.directive.cpp",
    "keyword.other.namespace.definition.cpp",
    "keyword.other.namespace.directive.cpp",
    "keyword.operator.override.cpp",
    "storage.type.modifier",
    "storage.type.class",
    // C++ `this` keyword (language variable)
    "variable.language.this.cpp",
    // Python `self` — semantic layer also covers this via variable.language
    "variable.parameter.function.language.special.self.python",
    // Misc original pass-through
    "support.constant.edge",
  ], p.KEYWORD, "italic"),

  fgs("Keywords — C++20 new keywords (concepts, modules, coroutines)", [
    // C++20 modules (export module / import)
    "keyword.control.directive.module.cpp",
    "keyword.other.module.cpp",
    // C++20 concepts
    "storage.type.concept.cpp",
    "keyword.other.concept.cpp",
    // C++20 coroutines
    "keyword.control.coroutine.cpp",
    "keyword.operator.co_await.cpp",
    "keyword.operator.co_yield.cpp",
    "keyword.operator.co_return.cpp",
    // C++20 spaceship operator <=> (as keyword-class)
    "keyword.operator.three_way_comparison.cpp",
  ], p.KEYWORD, "italic"),

  fgs("Keywords — TypeScript/JavaScript modern", [
    // TS 4.9 `satisfies` operator
    "keyword.operator.expression.satisfies.ts",
    "keyword.operator.expression.satisfies.tsx",
    // ES2023 `using` / `await using` declarations
    "keyword.declaration.using.ts",
    "keyword.declaration.using.tsx",
    "keyword.declaration.using.js",
    // TS import keyword operator
    "keyword.operator.expression.import",
  ], p.KEYWORD, "italic"),

  fgs("Keywords — Python 3.10+ match/case and walrus", [
    // Python 3.10 structural pattern matching
    "keyword.control.flow.match.python",
    "keyword.control.flow.case.python",
    // Python 3.8 walrus operator :=
    "keyword.operator.walrus.python",
    // Python wildcard in match patterns
    "keyword.other.wildcard.python",
  ], p.KEYWORD, "italic"),

  fgs("Keywords — Rust async/await and trait bounds", [
    "keyword.control.async.rust",
    "keyword.operator.await.rust",
    "keyword.other.where.rust",
  ], p.KEYWORD, "italic"),

  fgs("Keywords — C# async/await, init, with, record", [
    "keyword.other.await.cs",
    "keyword.other.async.cs",
    "keyword.other.init.cs",
    "keyword.operator.with.cs",
    // C# 9+ `is` pattern variable declaration / `not` pattern
    "keyword.operator.pattern.cs",
  ], p.KEYWORD, "italic"),

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPES  (TYPE — coral red #ff8080)
  //
  // Class names, type names, namespace names, interface names, built-in
  // support types (support.class / support.type).
  //
  // Scope roots:
  //   entity.name.type.*    — named type declarations
  //   entity.name.class     — class name at declaration site
  //   entity.name.namespace — namespace identifier
  //   support.class         — library-provided class names
  //   support.type.*        — library-provided type names / primitives
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Types — universal type & class names", [
    "entity.name.type",
    "entity.name.type.class",
    "entity.name.type.interface",
    "entity.name.type.enum",
    "entity.name.type.module",
    "entity.name.type.namespace",
    "entity.name.class",
    "entity.name.namespace",
    "entity.name.class.identifier.namespace.type",
    "entity.other.inherited-class",
    // Support types (library-provided)
    "support.class",
    "support.type",
    // TypeScript primitives — these are technically keywords but look like types
    "support.type.primitive.ts",
    "support.type.builtin.ts",
    "support.type.primitive.tsx",
    "support.type.builtin.tsx",
    "support.type.primitive",
    // `variable.language` covers this/self/super/Self when NOT handled by
    // the keyword rule (some grammars classify these differently)
    "variable.language",
    // JS/TS class-reference variables
    "variable.other.class.js",
    "variable.other.class.ts",
    // Math constants (Math.PI, etc.) act as type-namespace references
    "support.constant.math",
  ], p.TYPE),

  fg("Types — Java", [
    "storage.type.annotation.java",
    "storage.type.object.array.java",
    "storage.modifier.import.java",
    "storage.type.java",
    "storage.type.generic.java",
    "import.storage.java",
    "token.storage.type.java",
    "support.module.node",           // Node.js module references
    "support.type.object.module",
  ], p.TYPE),

  fg("Types — Go", [
    "entity.name.package.go",
    // := short variable declaration (acts as a type-assignment operator)
    "keyword.operator.assignment.go",
  ], p.TYPE),

  fg("Types — Rust", [
    "entity.name.lifetime.rust",     // 'a lifetime names (declaration)
    "storage.modifier.lifetime.rust", // 'a lifetime names (use sites)
    "entity.name.type.trait.rust",
    "entity.name.impl.rust",
  ], p.TYPE),

  fg("Types — C#", [
    "storage.type.cs",
    "entity.name.type.class.cs",
    "entity.name.type.interface.cs",
    "entity.name.type.enum.cs",
    "keyword.declaration.record.cs",  // `record` type declarations
  ], p.TYPE),

  fg("Types — PHP namespaces and interfaces", [
    "support.other.namespace.use.php",
    "support.other.namespace.use-as.php",
    "support.other.namespace.php",
    "entity.other.alias.php",
    "meta.interface.php",
    "storage.type.php",
    "meta.other.type.phpdoc.php",
    "keyword.other.type.php",
    "keyword.other.array.phpdoc.php",
  ], p.TYPE),

  fg("Types — misc (Clojure globals, Makefile, HLSL semantic, Swift, VB)", [
    "entity.global.clojure",
    "source.makefile",
    "support.variable.semantic.hlsl",
    "support.type.swift",
    "support.type.vb.asp",
    // Groovy imports
    "storage.modifier.import.groovy",
    // Xi theme pass-through
    "entity.name.function.xi",
    "entity.name.scope-resolution.function.call",
    "entity.name.scope-resolution.function.definition",
  ], p.TYPE),

  // ═══════════════════════════════════════════════════════════════════════════
  // STORAGE TYPES  (STORAGE — dusty mauve #d69aa7)
  //
  // The primitive storage-type keywords: int, float, bool, char, void, …
  // Also type-alias keywords, Haskell generic types, HLSL object types.
  //
  // Scope roots:
  //   storage.type   — all storage type keywords
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Storage types", [
    "storage.type",
    "token.storage",
    // Haskell generic-type annotations
    "variable.other.generic-type.haskell",
    // HLSL shader type keywords
    "support.type.texture.hlsl",
    "support.type.sampler.hlsl",
    "support.type.object.hlsl",
    "support.type.object.rw.hlsl",
    "support.type.fx.hlsl",
  ], p.STORAGE),

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCTIONS  (DEFAULT_FG — warm tan #d6cf9a)
  //
  // Function and method call sites, support functions, console, DOM objects.
  // Function *definitions* in C++ are handled above (bold font-style override).
  //
  // Scope roots:
  //   entity.name.function   — function name at definition site
  //   support.function       — library-provided functions
  //   variable.function      — function used as a value / called as expression
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Functions — universal", [
    "entity.name.function",
    "support.function",
    "support.function.any-method",
    "support.function.console",
    "variable.function",
    "keyword.other.special-method",
    // meta.require covers Node.js require() calls
    "meta.require",
    // Rust standard-library functions
    "support.function.std.rust",
  ], p.DEFAULT_FG),

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBER VARIABLES / PROPERTIES  (MEMBER — sandy orange #c19a7a)
  //
  // Local/global variables, object properties, object-literal keys,
  // HTML/XML tag names, JSON property names, Markdown headings.
  //
  // The semantic layer's `property` token provides precise coverage;
  // the TextMate rules below act as a universal fallback.
  //
  // Scope roots (Sublime naming guide §10):
  //   variable.other.readwrite     — general variables
  //   variable.other.property      — member property access
  //   meta.object-literal.key      — JS/TS object key
  //   support.variable.property    — library-provided property
  //   entity.name.tag              — HTML/XML tag name
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Members — variables, properties, object keys", [
    "variable.other.readwrite",
    "variable.other.property",
    "variable.other.local",
    "meta.object-literal.key",
    "meta.property.object",
    // Support variables (library-provided)
    "support.variable.property",
    "support.variable.object.process",
    "support.variable.object.node",
    "support.type.object.console",
    "support.variable.dom",
    "support.variable.property.dom",
    // Python magic variables (__name__, __file__, etc.)
    "support.variable.magic.python",
    // Rust `self` at the TextMate layer
    "variable.language.rust",
  ], p.MEMBER),

  fg("Members — HTML/XML tag names (entity.name.tag)", [
    "entity.name.tag",
  ], p.MEMBER),

  fg("Members — Markdown headings and list markers", [
    "markup.heading",
    "entity.name.section.markdown",
    "punctuation.definition.heading.markdown",
    "punctuation.definition.list.begin.markdown",
    "punctuation.definition.list.markdown",
    "punctuation.definition.string.begin.markdown",
    "punctuation.definition.string.end.markdown",
    "punctuation.definition.metadata.markdown",
    "beginning.punctuation.definition.list.markdown",
    "markup.heading.setext.1.markdown",
    "markup.heading.setext.2.markdown",
  ], p.MEMBER),

  fg("Members — JSON property names", [
    "source.json meta.structure.dictionary.json > string.quoted.json",
    "source.json meta.structure.dictionary.json > string.quoted.json > punctuation.string",
    "support.type.property-name.json",
    "support.type.property-name.json punctuation",
  ], p.MEMBER),

  fg("Members — YAML keys", [
    // YAML mapping keys in block style (entity.name.tag.yaml)
    "entity.name.tag.yaml",
    // Alias references (*anchor)
    "variable.other.alias.yaml",
  ], p.MEMBER),

  fg("Members — TOML keys and section headers", [
    // TOML property keys
    "keyword.key.toml",
    "variable.other.key.toml",
    // TOML inline key (used by some TOML grammars)
    "support.type.property-name.toml",
  ], p.MEMBER),

  fg("Members — C# local variables and labels", [
    "entity.name.variable.local.cs",
    "entity.name.label.cs",
    "variable.other.readwrite.cs",
  ], p.MEMBER),

  fg("Members — Java source body and variable definitions", [
    // Java source files default to MEMBER as base variable colour
    "source.java",
    "meta.definition.variable.name.java",
  ], p.MEMBER),

  fg("Members — JavaScript parameter, C++ function body, misc", [
    "variable.parameter.function.js",
    // Note: variable.parameter.cpp is intentionally absent — C++ parameters
    // are coloured PARAMETER (terracotta) via the rule below / semantic layer.
    // C/C++ function body — provides the base colour for C/C++ content
    "meta.function.c",
    "meta.function.cpp",
    // Groovy variable/method definitions
    "meta.definition.variable.name.groovy",
    "meta.method.groovy",
    // Clojure symbols
    "meta.symbol.clojure",
    // CoffeeScript arguments
    "meta.arguments.coffee",
    "variable.parameter.function.coffee",
    // SQL text variables
    "text.variable",
    "text.bracketed",
    // Unison language punctuation
    "punctuation.definition.delayed.unison",
    "punctuation.definition.list.begin.unison",
    "punctuation.definition.list.end.unison",
    "punctuation.definition.ability.begin.unison",
    "punctuation.definition.ability.end.unison",
    "punctuation.operator.assignment.as.unison",
    "punctuation.separator.pipe.unison",
    "punctuation.separator.delimiter.unison",
    "punctuation.definition.hash.unison",
    // Makefile prerequisites
    "meta.scope.prerequisites.makefile",
    // PHP class variables
    "variable.other.class.php",
    // Regexp character class
    "constant.other.character-class.regexp",
    // Diff deleted content shown in MEMBER colour
    "markup.deleted.diff",
    // CSS selector (SASS selector gets MEMBER)
    "selector.sass",
    // XI theme pass-through
    "constant.character.character-class.regexp.xi",
    "entity.name.class.xi",
  ], p.MEMBER),

  fg("Members — keyword.other.unit (CSS/SCSS units: px, em, …)", [
    "keyword.other.unit",
  ], p.MEMBER),

  fg("Members — variable interpolation", [
    "variable.interpolation",
  ], p.MEMBER),

  // ═══════════════════════════════════════════════════════════════════════════
  // C++ MEMBER VARIABLE ACCESS  (MEMBER_CPP — bright yellow #fee45d)
  //
  // Member variable access via `.` or `->` in C++ is given a distinct
  // bright-yellow colour (matching Qt Creator) to make member-access
  // expressions immediately visible during code review.
  // ═══════════════════════════════════════════════════════════════════════════

  fg("C++ member variable access (bright yellow)", [
    "variable.other.property.cpp",
    "variable.other.object.access.cpp",
  ], p.MEMBER_CPP),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS  (CONSTANT — dark sienna #8a602c)
  //
  // Numeric literals, named language constants (true, false, null),
  // function parameters, CSS property values, Elm/PHP/Rust constants.
  //
  // Scope roots:
  //   constant.numeric.*     — all number literals
  //   constant.language.*    — boolean/nil/null language constants
  //   constant.other.*       — other named constants
  //   variable.parameter.*   — function/method parameters
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Constants — universal numeric and language literals", [
    "constant.numeric",
    "constant",
    "punctuation.definition.constant",
    "constant.character.escape",      // escape sequences in strings
    "constant.character.entity",      // HTML &amp; etc.
  ], p.CONSTANT),

  fg("Parameters — function parameters (universal)", [
    // Parameters get PARAMETER (warm terracotta) — distinct from numeric
    // constants (CONSTANT brown) and from member variables (MEMBER orange).
    // The semantic `parameter` token overrides these at the LSP layer, but
    // these TextMate rules act as a universal fallback.
    "variable.parameter",
    "variable.parameter.function",
    "variable.parameter.function.language.python",
    "variable.parameter.function.python",
    "variable.parameter.cpp",
    "variable.parameter.cs",
    "token.variable.parameter.java",
  ], p.PARAMETER),

  fg("Constants — CSS and SCSS property values", [
    "support.constant.property-value.scss",
    "support.constant.property-value.css",
    "support.constant.color.w3c-standard-color-name.css",
    "support.constant.color.w3c-standard-color-name.scss",
    "support.constant.font-name",
    "support.constant.json",
    // process.env and similar
    "support.variable.property.process",
  ], p.CONSTANT),

  fg("Constants — HTML / CSS attribute names", [
    "entity.other.attribute-name",
    "entity.other.attribute-name.class.css",
    "entity.other.attribute-name.pseudo-element",
    "entity.other.attribute-name.pseudo-class",
  ], p.CONSTANT),

  fg("Constants — Markdown bold text and bold punctuation", [
    "markup.bold",
    "todo.bold",
    "punctuation.definition.bold.markdown",
    "punctuation.definition.bold",
  ], p.CONSTANT),

  fg("Constants — Haskell storage types", [
    "storage.type.haskell",
  ], p.CONSTANT),

  fg("Constants — regexp quantifiers", [
    "keyword.operator.quantifier.regexp",
  ], p.CONSTANT),

  fg("Constants — Math and property math", [
    "support.constant.property.math",
  ], p.CONSTANT),

  fg("Constants — Elm, Rust, PHP named constants", [
    "support.constant.core.rust",
    "support.constant.ext.php",
    "support.constant.std.php",
    "support.constant.core.php",
    "support.constant.parser-token.php",
    "support.constant.elm",
  ], p.CONSTANT),

  fg("Constants — Python format placeholders", [
    "constant.character.format.placeholder.other.python",
  ], p.CONSTANT),

  fg("Constants — token warnings", [
    "token.warn-token",
  ], p.CONSTANT),

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL / MODULE-LEVEL VARIABLES  (GLOBAL_VAR — blue-purple #9aa7d6)
  //
  // ALL_CAPS Python constants follow the convention of being module-level,
  // so they share this colour with the `variable.global` semantic token.
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Global / module-level variables", [
    "constant.other.caps.python",
  ], p.GLOBAL_VAR),

  // ═══════════════════════════════════════════════════════════════════════════
  // STRINGS  (STRING — amber #d69545)
  //
  // All string literals, template-literal delimiters, INI file text,
  // Markdown inline code, diff insertions.
  //
  // Scope roots (Sublime naming guide §8):
  //   string.*                  — all string types
  //   punctuation.definition.string.*  — opening/closing quotes
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Strings — universal", [
    "string",
    "punctuation.definition.string.begin",
    "punctuation.definition.string.end",
    // Markdown inline code
    "markup.inline.raw.markdown",
    "markup.inline.raw.string.markdown",
    // Diff inserted lines
    "markup.inserted.diff",
    // INI files — entire content is string-coloured
    "source.ini",
    // Groovy inherited class (rendered as a string-type token)
    "meta.definition.class.inherited.classes.groovy",
    // Xi theme pass-through
    "beginning.punctuation.definition.quote.markdown.xi",
  ], p.STRING),

  fg("Strings — JSON values (as opposed to JSON keys)", [
    "source.json meta.structure.dictionary.json > value.json > string.quoted.json",
    "source.json meta.structure.array.json > value.json > string.quoted.json",
    "source.json meta.structure.dictionary.json > value.json > string.quoted.json > punctuation",
    "source.json meta.structure.array.json > value.json > string.quoted.json > punctuation",
  ], p.STRING),

  fg("Strings — template literal / heredoc delimiters", [
    "keyword.other.template.begin",
    "keyword.other.template.end",
    "keyword.other.substitution.begin",
    "keyword.other.substitution.end",
  ], p.STRING),

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENTS  (COMMENT — cool grey #a8abb0, italic)
  //
  // Scope roots:
  //   comment.*                      — all comment types
  //   punctuation.definition.comment — // /* */ # etc.
  // ═══════════════════════════════════════════════════════════════════════════

  fgs("Comments — universal", [
    "comment",
    "punctuation.definition.comment",
    // Markdown blockquotes are visually comment-like
    "markup.quote.markdown",
    // Xi theme pass-through
    "beginning.punctuation.definition.list.markdown.xi",
    "punctuation.definition.tag.xi",
  ], p.COMMENT, "italic"),

  // ═══════════════════════════════════════════════════════════════════════════
  // DOXYGEN / JSDOC / DOC-COMMENT TAGS  (DOC_TAG — muted green #66a334)
  //
  // @param, @return, @brief, @see, … in Doxygen, JSDoc, Python docstrings.
  // C++ enum member identifiers share this colour (Qt Creator convention).
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Doc-comment tags and C++ enum members", [
    "storage.type.class.doxygen",
    "variable.other.enummember.cpp",
  ], p.DOC_TAG),

  // ═══════════════════════════════════════════════════════════════════════════
  // PREPROCESSOR / DIRECTIVES / DECORATORS  (PREPROCESSOR — hot pink #ff6aad)
  //
  // C/C++ preprocessor directives (#include, #define, #pragma, …),
  // Python and TypeScript decorators, Rust attribute macros.
  //
  // Scope roots:
  //   keyword.control.directive.*     — preprocessor directive keywords
  //   entity.name.function.preprocessor — macro names
  //   meta.attribute.rust             — Rust #[…] attributes
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Preprocessor directives and decorator names", [
    "keyword.control.directive",
    "entity.name.function.preprocessor",
    // HTML DOCTYPE and XML processing instructions
    "entity.name.tag.doctype.html",
    "meta.tag.preprocessor.xml",
    "meta.tag.sgml.html",
    // Rust attribute macros #[derive(…)], #[cfg(…)], etc.
    "meta.attribute.rust",
    "punctuation.definition.attribute.rust",
    // Python decorator identifier (the function name after @)
    "meta.function.decorator.python",
    "support.token.decorator.python",
    "meta.function.decorator.identifier.python",
  ], p.PREPROCESSOR),

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATORS & PUNCTUATION  (DEFAULT_FG — warm tan #d6cf9a)
  //
  // Arithmetic, comparison, bitwise, assignment operators; brackets,
  // semicolons, commas — everything that "connects" other tokens but
  // should not draw attention to itself.
  //
  // fontStyle: "normal" explicitly resets italic on any of these that
  // might have been italicised by an earlier rule.
  // ═══════════════════════════════════════════════════════════════════════════

  fgs("Operators — C / C++", [
    "keyword.operator.assignment.c",
    "keyword.operator.arithmetic.cpp",
    "keyword.operator.comparison.c",
    "keyword.operator.c",
    "keyword.operator.increment.c",
    "keyword.operator.decrement.c",
    "keyword.operator.bitwise.shift.c",
    "keyword.operator.assignment.cpp",
    "keyword.operator.comparison.cpp",
    "keyword.operator.cpp",
    "keyword.operator.increment.cpp",
    "keyword.operator.decrement.cpp",
    "keyword.operator.bitwise.shift.cpp",
    "punctuation.separator.c",
    "punctuation.separator.cpp",
    "keyword.operator.assignment.compound",
  ], p.DEFAULT_FG, "normal"),

  fgs("Operators — PHP", [
    "keyword.operator.error-control.php",
    "keyword.operator.type.php",
    "keyword.operator.regexp.php",
    "keyword.operator.heredoc.php",
    "keyword.operator.nowdoc.php",
    "keyword.operator.logical.php",
    "keyword.operator.bitwise.php",
    "keyword.operator.arithmetic.php",
    "keyword.operator.comparison.php",
  ], p.DEFAULT_FG, "normal"),

  fgs("Operators — general / universal", [
    "keyword.operator",
    "keyword.operator.logical",
    "keyword.operator.bitwise",
    "keyword.operator.channel",
    "keyword.operator.css",
    "keyword.operator.scss",
    "keyword.operator.less",
    "keyword.operator.arithmetic",
    "keyword.operator.comparison",
    "keyword.operator.decrement",
    "keyword.operator.increment",
    "keyword.operator.relational",
    "keyword.operator.assignment",
    "keyword.operator.assignment.compound.js",
    "keyword.operator.assignment.compound.ts",
    "keyword.operator.misc.rust",
    // Module import operator
    "keyword.operator.module",
    // Quasi-element (tagged templates)
    "punctuation.quasi.element",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — embedded section delimiters", [
    "punctuation.section.embedded.begin",
    "punctuation.section.embedded.end",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — C / C++ brackets and terminators", [
    "punctuation.section.block.begin.bracket.curly.cpp",
    "punctuation.section.block.end.bracket.curly.cpp",
    "punctuation.terminator.statement.c",
    "punctuation.section.block.begin.bracket.curly.c",
    "punctuation.section.block.end.bracket.curly.c",
    "punctuation.section.parens.begin.bracket.round.c",
    "punctuation.section.parens.end.bracket.round.c",
    "punctuation.section.parameters.begin.bracket.round.c",
    "punctuation.section.parameters.end.bracket.round.c",
    "punctuation.separator.c",
    "punctuation.separator.cpp",
    "support.type.posix-reserved.c",
    "support.type.posix-reserved.cpp",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — Python", [
    "punctuation.separator.period.python",
    "punctuation.separator.element.python",
    "punctuation.parenthesis.begin.python",
    "punctuation.parenthesis.end.python",
    "punctuation.definition.arguments.begin.python",
    "punctuation.definition.arguments.end.python",
    "punctuation.separator.arguments.python",
    "punctuation.definition.list.begin.python",
    "punctuation.definition.list.end.python",
    "meta.function-call.generic.python",
    "support.type.python",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — Java", [
    "punctuation.section.block.begin.java",
    "punctuation.section.block.end.java",
    "punctuation.definition.method-parameters.begin.java",
    "punctuation.definition.method-parameters.end.java",
    "meta.method.identifier.java",
    "punctuation.section.method.begin.java",
    "punctuation.section.method.end.java",
    "punctuation.terminator.java",
    "punctuation.section.class.begin.java",
    "punctuation.section.class.end.java",
    "punctuation.section.inner-class.begin.java",
    "punctuation.section.inner-class.end.java",
    "meta.method-call.java",
    "punctuation.section.class.begin.bracket.curly.java",
    "punctuation.section.class.end.bracket.curly.java",
    "punctuation.section.method.begin.bracket.curly.java",
    "punctuation.section.method.end.bracket.curly.java",
    "punctuation.separator.period.java",
    "punctuation.bracket.angle.java",
    "punctuation.definition.annotation.java",
    "meta.method.body.java",
    "meta.method.java",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — PHP brackets and delimiters", [
    "punctuation.section.array.begin.php",
    "punctuation.section.array.end.php",
    "meta.function-call.php",
    "meta.function-call.object.php",
    "meta.function-call.static.php",
    "punctuation.definition.parameters.begin.bracket.round.php",
    "punctuation.definition.parameters.end.bracket.round.php",
    "punctuation.separator.delimiter.php",
    "punctuation.section.scope.begin.php",
    "punctuation.section.scope.end.php",
    "punctuation.terminator.expression.php",
    "punctuation.definition.arguments.begin.bracket.round.php",
    "punctuation.definition.arguments.end.bracket.round.php",
    "punctuation.definition.storage-type.begin.bracket.round.php",
    "punctuation.definition.storage-type.end.bracket.round.php",
    "punctuation.definition.array.begin.bracket.round.php",
    "punctuation.definition.array.end.bracket.round.php",
    "punctuation.definition.begin.bracket.round.php",
    "punctuation.definition.end.bracket.round.php",
    "punctuation.definition.begin.bracket.curly.php",
    "punctuation.definition.end.bracket.curly.php",
    "punctuation.definition.section.switch-block.end.bracket.curly.php",
    "punctuation.definition.section.switch-block.start.bracket.curly.php",
    "punctuation.definition.section.switch-block.begin.bracket.curly.php",
    "entity.name.goto-label.php",
    "support.other.php",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — HTML/XML tag angle brackets", [
    // The < > / characters in HTML and XML tags
    "punctuation.definition.tag.begin.html",
    "punctuation.definition.tag.end.html",
    "punctuation.definition.tag.html",
    "punctuation.definition.tag.begin.xml",
    "punctuation.definition.tag.end.xml",
    "punctuation.definition.tag.xml",
    // JSX angle brackets
    "punctuation.definition.tag.begin.jsx",
    "punctuation.definition.tag.end.jsx",
    "punctuation.definition.tag.begin.tsx",
    "punctuation.definition.tag.end.tsx",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — YAML sequence items, TOML tables", [
    "punctuation.definition.block.sequence.item.yaml",
    "punctuation.definition.anchor.yaml",
    "punctuation.definition.alias.yaml",
    "punctuation.definition.table.toml",
    "punctuation.definition.array.toml",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — CSS comma separators and vendor prefixes", [
    "punctuation.separator.list.comma.css",
    "support.type.vendored.property-name.css",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — general separators and delimiters", [
    "punctuation.separator.key-value",
    "punctuation.separator.delimiter",
    "punctuation.separator.period.java",
  ], p.DEFAULT_FG, "normal"),

  fgs("Punctuation — diff headers", [
    "meta.diff.header.from-file",
    "meta.diff.header.to-file",
    "punctuation.definition.from-file.diff",
    "punctuation.definition.to-file.diff",
  ], p.DEFAULT_FG, "normal"),

  fgs("Default foreground — DOM types, meta tags, templates", [
    "support.type.object.dom",
    "meta.tag",
    // Template expression content
    "meta.template.expression",
    // Flow types
    "support.type.type.flowtype",
    // Groovy method meta
    "meta.method.groovy",
    // Other support types
    "support.type.property-name",
    "support.constant.property-value",
    // Markup section headings
    "entity.name.section",
    "entity.other.attribute-name.id",
    "markup.heading.setext",
    // Markdown link text
    "string.other.link.title.markdown",
    "string.other.link.description.markdown",
    // String regexp (not a string — used as pattern)
    "string.regexp",
    // Ruby symbol constants
    "constant.language.symbol.ruby",
    // Elixir language symbols
    "constant.language.symbol.elixir",
    // Misc pass-through
    "token.info-token",
    "entity.other.attribute-name.pseudo-element",
    "entity.other.attribute-name.pseudo-class",
    "constant.keyword.clojure",
    "support.constant.elm",   // Elm prelude types
    "support.type.prelude.elm",
    "entity.name.class.xi",
    "keyword.control.xi",
    "invalid.xi",
    "constant.character.xi",
    "accent.xi",
    "entity.name.function.operator.member.cpp",
    "invalid.illegal.bad-ampersand.html",
    // JSON language constants (true/false/null) shown in DEFAULT_FG
    "source.json meta.structure.dictionary.json > constant.language.json",
    "source.json meta.structure.array.json > constant.language.json",
    // C variable tokens
    "variable.c",
    "token.package",
  ], p.DEFAULT_FG, "normal"),

  // ═══════════════════════════════════════════════════════════════════════════
  // ERRORS AND INVALID TOKENS  (ERROR — bright red #f44747)
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Errors and invalid tokens", [
    "invalid.illegal.non-null-typehinted.php",
    "token.error-token",
    "invalid.illegal",
    "invalid.broken",
    "invalid.deprecated",
    "invalid.unimplemented",
    "constant.other.color.rgb-value.xi",
  ], p.ERROR),

  // ═══════════════════════════════════════════════════════════════════════════
  // DIFF  (colour mapping for diff/patch files)
  // ═══════════════════════════════════════════════════════════════════════════

  fg("Diff — changed lines", [
    "markup.changed.diff",
  ], p.TYPE),

  fg("Diff — inserted lines", [
    "markup.inserted.diff",
  ], p.STRING),

  // markup.deleted.diff handled above in Members section (MEMBER colour)

];

// ─── Workbench / UI Colours ───────────────────────────────────────────────────
//
// These control the VS Code chrome: editor background, sidebar, status bar,
// tabs, widgets, terminal colours, git decoration, etc.
//
// The full list of available keys is documented at:
//   https://code.visualstudio.com/api/references/theme-color

const colors: Record<string, string> = {
  "foreground":                                  p.UI.FG_DEFAULT,
  "focusBorder":                                 p.UI.ACCENT_GOLD,
  "selection.background":                        p.UI.ACCENT_TEAL_SEL,
  "scrollbar.shadow":                            "#00000000",

  // ── Activity bar ──────────────────────────────────────────────────────────
  "activityBar.foreground":                      "#ffffff",
  "activityBar.background":                      p.UI.BG_ACTIVITY,
  "activityBar.inactiveForeground":              "#ffffff66",
  "activityBarBadge.foreground":                 "#ffffff",
  "activityBarBadge.background":                 p.UI.ACCENT_BLUE,

  // ── Side bar ───────────────────────────────────────────────────────────────
  "sideBar.background":                          p.UI.BG_SIDEBAR,
  "sideBar.foreground":                          p.UI.FG_SIDEBAR,
  "sideBarSectionHeader.background":             p.UI.BG_DARKER,
  "sideBarSectionHeader.foreground":             p.UI.FG_SIDEBAR,
  "sideBarTitle.foreground":                     p.UI.FG_SIDEBAR,
  "sideBar.border":                              "#000000",
  "sideBar.dropBackground":                      "#383b3d",

  // ── Lists ──────────────────────────────────────────────────────────────────
  "list.inactiveSelectionBackground":            "#37373d",
  "list.inactiveSelectionForeground":            p.UI.FG_DEFAULT,
  "list.hoverBackground":                        "#2a2d2e",
  "list.hoverForeground":                        p.UI.FG_DEFAULT,
  "list.activeSelectionBackground":              p.UI.ACCENT_TEAL_SEL,
  "list.activeSelectionForeground":              "#ffffff",
  "tree.indentGuidesStroke":                     "#585858",
  "list.dropBackground":                         "#383b3d",
  "list.highlightForeground":                    "#0097fb",
  "list.focusBackground":                        "#062f4a",
  "list.focusForeground":                        p.UI.FG_DEFAULT,
  "listFilterWidget.background":                 "#653723",
  "listFilterWidget.outline":                    "#00000000",
  "listFilterWidget.noMatchesOutline":           "#be1100",

  // ── Status bar ─────────────────────────────────────────────────────────────
  "statusBar.foreground":                        "#ffffff",
  "statusBar.background":                        p.UI.ACCENT_BLUE,
  "statusBarItem.hoverBackground":               "#ffffff1f",
  "statusBarItem.activeBackground":              "#FFFFFF25",
  "statusBar.debuggingBackground":               "#cc6633",
  "statusBar.debuggingForeground":               "#ffffff",
  "statusBar.noFolderBackground":                "#68217a",
  "statusBar.noFolderForeground":                "#ffffff",
  "statusBarItem.remoteBackground":              "#16825d",
  "statusBarItem.remoteForeground":              "#ffffff",

  // ── Title bar ──────────────────────────────────────────────────────────────
  "titleBar.activeBackground":                   p.UI.BG_TITLE,
  "titleBar.activeForeground":                   p.UI.FG_DEFAULT,
  "titleBar.inactiveBackground":                 "#3c3c3c99",
  "titleBar.inactiveForeground":                 "#cccccc99",
  "titleBar.border":                             "#00000000",

  // ── Menu ───────────────────────────────────────────────────────────────────
  "menubar.selectionForeground":                 p.UI.FG_DEFAULT,
  "menubar.selectionBackground":                 "#ffffff1a",
  "menu.foreground":                             p.UI.FG_DEFAULT,
  "menu.background":                             p.UI.BG_MENU,
  "menu.selectionForeground":                    "#ffffff",
  "menu.selectionBackground":                    "#094771",
  "menu.selectionBorder":                        "#00000000",
  "menu.separatorBackground":                    "#bbbbbb",
  "menu.border":                                 "#00000085",

  // ── Buttons ────────────────────────────────────────────────────────────────
  "button.background":                           "#0e639c",
  "button.foreground":                           "#ffffff",
  "button.hoverBackground":                      "#1177bb",
  "button.secondaryForeground":                  "#ffffff",
  "button.secondaryBackground":                  "#3a3d41",
  "button.secondaryHoverBackground":             "#45494e",

  // ── Input ──────────────────────────────────────────────────────────────────
  "input.background":                            p.UI.BG_INPUT,
  "input.border":                                "#00000000",
  "input.foreground":                            p.UI.FG_DEFAULT,
  "inputOption.activeBackground":                "#007fd466",
  "inputOption.activeBorder":                    "#007acc00",
  "inputOption.activeForeground":                "#ffffff",
  "input.placeholderForeground":                 "#a6a6a6",

  // ── Text ───────────────────────────────────────────────────────────────────
  "textLink.foreground":                         p.UI.ACCENT_LINK,

  // ── Editor ─────────────────────────────────────────────────────────────────
  "editor.background":                           p.UI.BG_EDITOR,
  "editor.foreground":                           p.DEFAULT_FG,
  "editorLineNumber.foreground":                 "#858585",
  "editorLineNumber.activeForeground":           "#c6c6c6",
  "editorCursor.foreground":                     "#aeafad",
  "editorCursor.background":                     "#000000",
  "editor.selectionBackground":                  p.UI.ACCENT_TEAL_SEL,
  "editor.inactiveSelectionBackground":          "#3a3d41",
  "editorWhitespace.foreground":                 "#bec0c254",
  "editor.selectionHighlightBackground":         "#add6ff26",
  "editor.selectionHighlightBorder":             "#495F77",
  "editor.findMatchBackground":                  "#403331",
  "editor.findMatchBorder":                      "#c0bd00",
  "editor.findMatchHighlightBackground":         "#403331",
  "editor.findMatchHighlightBorder":             "#7e3e2d",
  "editor.findRangeHighlightBackground":         "#3a3d4166",
  "editor.findRangeHighlightBorder":             "#ffffff00",
  "editor.rangeHighlightBackground":             "#ffffff0b",
  "editor.rangeHighlightBorder":                 "#ffffff00",
  "editor.hoverHighlightBackground":             "#264f7840",
  "editor.wordHighlightStrongBackground":        "#004972b8",
  "editor.wordHighlightBackground":              "#575757b8",
  "editor.lineHighlightBackground":              "#ffffff0A",
  "editor.lineHighlightBorder":                  "#28282800",
  "editorLink.activeForeground":                 "#d6c540",
  "editorIndentGuide.background":                "#404040",
  "editorIndentGuide.activeBackground":          "#707070",
  "editorRuler.foreground":                      "#5a5a5a",
  "editorBracketMatch.background":               "#0064001a",
  "editorBracketMatch.border":                   "#888888",
  "editor.foldBackground":                       "#264f784d",

  // ── Editor overview ruler ─────────────────────────────────────────────────
  "editorOverviewRuler.background":              "#25252500",
  "editorOverviewRuler.border":                  "#7f7f7f4d",

  // ── Editor diagnostics ────────────────────────────────────────────────────
  "editorError.foreground":                      p.UI.ERR_FG,
  "editorError.background":                      "#B73A3400",
  "editorError.border":                          "#ffffff00",
  "editorWarning.foreground":                    p.UI.WARN_FG,
  "editorWarning.background":                    "#A9904000",
  "editorWarning.border":                        "#ffffff00",
  "editorInfo.foreground":                        p.UI.INFO_FG,
  "editorInfo.background":                       "#4590bf00",
  "editorInfo.border":                           "#4490BF00",

  // ── Gutter ─────────────────────────────────────────────────────────────────
  "editorGutter.background":                     p.UI.BG_DARK,
  "editorGutter.modifiedBackground":             p.UI.GIT_GUTTER_MOD,
  "editorGutter.addedBackground":                p.UI.GIT_GUTTER_ADD,
  "editorGutter.deletedBackground":              p.UI.GIT_GUTTER_DEL,
  "editorGutter.foldingControlForeground":       "#c5c5c5",
  "editorGutter.commentRangeForeground":         "#757575",

  // ── CodeLens ───────────────────────────────────────────────────────────────
  "editorCodeLens.foreground":                   "#999999",

  // ── Editor groups and tabs ────────────────────────────────────────────────
  "editorGroup.border":                          "#444444",
  "editorGroup.emptyBackground":                 p.UI.BG_EDITOR,
  "editorGroupHeader.tabsBackground":            p.UI.BG_PANEL,
  "tab.activeForeground":                        "#ffffff",
  "tab.border":                                  p.UI.BG_PANEL,
  "tab.activeBackground":                        p.UI.BG_DARK,
  "tab.activeBorder":                            "#00000000",
  "tab.activeBorderTop":                         "#00000000",
  "tab.inactiveBackground":                      "#2d2d2d",
  "tab.inactiveForeground":                      "#ffffff80",

  // ── Diff editor ────────────────────────────────────────────────────────────
  "diffEditor.insertedTextBackground":           "#9bb95533",
  "diffEditor.removedTextBackground":            "#ff000033",
  "diffEditor.border":                           "#444444",

  // ── Panel ──────────────────────────────────────────────────────────────────
  "panel.background":                            p.UI.BG_DARK,
  "panel.border":                                "#80808059",
  "panelTitle.activeBorder":                     "#e7e7e7",
  "panelTitle.activeForeground":                 "#e7e7e7",
  "panelTitle.inactiveForeground":               "#e7e7e799",
  "panelSection.border":                         "#80808059",

  // ── Badges ─────────────────────────────────────────────────────────────────
  "badge.background":                            "#4d4d4d",
  "badge.foreground":                            "#ffffff",

  // ── Terminal ───────────────────────────────────────────────────────────────
  "terminal.foreground":                         p.UI.FG_DEFAULT,
  "terminal.selectionBackground":                "#ffffff40",
  "terminalCursor.background":                   "#0087FF",
  "terminalCursor.foreground":                   "#ffffff",
  "terminal.border":                             "#80808059",
  "terminal.ansiBlack":                          "#000000",
  "terminal.ansiBlue":                           "#2472c8",
  "terminal.ansiBrightBlack":                    "#666666",
  "terminal.ansiBrightBlue":                     "#3b8eea",
  "terminal.ansiBrightCyan":                     "#29b8db",
  "terminal.ansiBrightGreen":                    "#23d18b",
  "terminal.ansiBrightMagenta":                  "#d670d6",
  "terminal.ansiBrightRed":                      "#f14c4c",
  "terminal.ansiBrightWhite":                    "#e5e5e5",
  "terminal.ansiBrightYellow":                   "#f5f543",
  "terminal.ansiCyan":                           "#11a8cd",
  "terminal.ansiGreen":                          "#0dbc79",
  "terminal.ansiMagenta":                        "#bc3fbc",
  "terminal.ansiRed":                            "#cd3131",
  "terminal.ansiWhite":                          "#e5e5e5",
  "terminal.ansiYellow":                         "#e5e510",

  // ── Breadcrumbs ────────────────────────────────────────────────────────────
  "breadcrumb.background":                       p.UI.BG_DARK,
  "breadcrumb.foreground":                       "#cccccccc",
  "breadcrumb.focusForeground":                  "#e0e0e0",
  "breadcrumb.activeSelectionForeground":        "#e0e0e0",

  // ── Scrollbar ──────────────────────────────────────────────────────────────
  "scrollbarSlider.background":                  "#79797966",
  "scrollbarSlider.hoverBackground":             "#646464b3",
  "scrollbarSlider.activeBackground":            "#bfbfbf66",

  // ── Progress bar ───────────────────────────────────────────────────────────
  "progressBar.background":                      p.UI.ACCENT_AMBER,

  // ── Widgets ────────────────────────────────────────────────────────────────
  "widget.shadow":                               "#0000005c",
  "editorWidget.foreground":                     p.UI.FG_DEFAULT,
  "editorWidget.background":                     p.UI.BG_PANEL,
  "editorWidget.resizeBorder":                   "#5F5F5F",

  // ── Picker / quick open ────────────────────────────────────────────────────
  "pickerGroup.border":                          "#3f3f46",
  "pickerGroup.foreground":                      p.UI.ACCENT_LINK,

  // ── Debug toolbar ──────────────────────────────────────────────────────────
  "debugToolBar.background":                     p.UI.BG_ACTIVITY,
  "debugToolBar.border":                         "#474747",
  "debugExceptionWidget.background":             p.UI.BG_ACTIVITY,
  "debugExceptionWidget.border":                 "#474747",

  // ── Notifications ──────────────────────────────────────────────────────────
  "notifications.foreground":                    p.UI.FG_DEFAULT,
  "notifications.background":                    p.UI.BG_PANEL,
  "notificationToast.border":                    "#474747",
  "notificationsErrorIcon.foreground":           "#f48771",
  "notificationsWarningIcon.foreground":         p.UI.WARN_FG,
  "notificationsInfoIcon.foreground":            p.UI.INFO_FG,
  "notificationCenter.border":                   "#474747",
  "notificationCenterHeader.foreground":         p.UI.FG_DEFAULT,
  "notificationCenterHeader.background":         "#303031",
  "notifications.border":                        "#303031",

  // ── Git decorations ────────────────────────────────────────────────────────
  "gitDecoration.addedResourceForeground":       p.UI.GIT_ADDED,
  "gitDecoration.conflictingResourceForeground": p.UI.GIT_CONFLICT,
  "gitDecoration.deletedResourceForeground":     p.UI.GIT_DELETED,
  "gitDecoration.ignoredResourceForeground":     p.UI.GIT_IGNORED,
  "gitDecoration.modifiedResourceForeground":    p.UI.GIT_MODIFIED,
  "gitDecoration.stageDeletedResourceForeground": p.UI.GIT_DELETED,
  "gitDecoration.stageModifiedResourceForeground": p.UI.GIT_MODIFIED,
  "gitDecoration.submoduleResourceForeground":   p.UI.GIT_SUBMODULE,
  "gitDecoration.untrackedResourceForeground":   p.UI.GIT_UNTRACKED,

  // ── Editor marker navigation ───────────────────────────────────────────────
  "editorMarkerNavigation.background":           "#2d2d30",
  "editorMarkerNavigationError.background":      "#f48771",
  "editorMarkerNavigationWarning.background":    p.UI.WARN_FG,
  "editorMarkerNavigationInfo.background":       p.UI.INFO_FG,

  // ── Merge conflict ─────────────────────────────────────────────────────────
  "merge.currentHeaderBackground":               "#367366",
  "merge.currentContentBackground":              "#27403B",
  "merge.incomingHeaderBackground":              "#395F8F",
  "merge.incomingContentBackground":             "#28384B",
  "merge.commonHeaderBackground":                "#383838",
  "merge.commonContentBackground":               "#282828",

  // ── Suggest widget ─────────────────────────────────────────────────────────
  "editorSuggestWidget.background":              p.UI.BG_PANEL,
  "editorSuggestWidget.border":                  p.UI.ACCENT_GOLD,
  "editorSuggestWidget.foreground":              p.UI.FG_SIDEBAR,
  "editorSuggestWidget.highlightForeground":     p.UI.ACCENT_CYAN,
  "editorSuggestWidget.selectedBackground":      p.UI.ACCENT_TEAL_SEL,

  // ── Hover widget ───────────────────────────────────────────────────────────
  "editorHoverWidget.foreground":                p.UI.FG_SIDEBAR,
  "editorHoverWidget.background":                p.UI.BG_PANEL,
  "editorHoverWidget.border":                    "#454545",

  // ── Peek view ──────────────────────────────────────────────────────────────
  "peekView.border":                             p.UI.ACCENT_GOLD,
  "peekViewEditor.background":                   p.UI.BG_PEEK,
  "peekViewEditorGutter.background":             p.UI.BG_PEEK_GUTTER,
  "peekViewEditor.matchHighlightBackground":     "#ff8f001e",
  "peekViewEditor.matchHighlightBorder":         "#ee931e68",
  "peekViewResult.background":                   "#262525",
  "peekViewResult.fileForeground":               p.UI.FG_SIDEBAR,
  "peekViewResult.lineForeground":               p.UI.FG_DIM,
  "peekViewResult.matchHighlightBackground":     "#ea5c004d",
  "peekViewResult.selectionBackground":          "#3399ff33",
  "peekViewResult.selectionForeground":          p.UI.FG_SIDEBAR,
  "peekViewTitle.background":                    p.UI.BG_DARK,
  "peekViewTitleDescription.foreground":         p.UI.FG_SIDEBAR,
  "peekViewTitleLabel.foreground":               p.UI.FG_SIDEBAR,

  // ── Icons ──────────────────────────────────────────────────────────────────
  "icon.foreground":                             p.UI.FG_DEFAULT,

  // ── Checkbox / dropdown ────────────────────────────────────────────────────
  "checkbox.background":                         p.UI.BG_INPUT,
  "checkbox.foreground":                         p.UI.FG_DEFAULT,
  "checkbox.border":                             "#00000000",
  "dropdown.background":                         p.UI.BG_INPUT,
  "dropdown.foreground":                         p.UI.FG_DEFAULT,
  "dropdown.border":                             "#00000000",

  // ── Minimap ────────────────────────────────────────────────────────────────
  "minimapGutter.addedBackground":               p.UI.GIT_GUTTER_ADD,
  "minimapGutter.modifiedBackground":            p.UI.GIT_GUTTER_MOD,
  "minimapGutter.deletedBackground":             p.UI.GIT_GUTTER_DEL,
  "minimap.findMatchHighlight":                  "#403331",
  "minimap.selectionHighlight":                  p.UI.ACCENT_TEAL_SEL,
  "minimap.errorHighlight":                      p.UI.ERR_FG,
  "minimap.warningHighlight":                    p.UI.WARN_FG,
  "minimap.background":                          p.UI.BG_EDITOR,

  // ── Settings editor ────────────────────────────────────────────────────────
  "settings.headerForeground":                   p.UI.FG_DEFAULT,
  "settings.focusedRowBackground":               "#ffffff07",
  "walkThrough.embeddedEditorBackground":        "#00000050",
};

// ─── Assemble and emit ────────────────────────────────────────────────────────

const theme: Theme = {
  name: "Qt Creator-Like Dark Theme",
  type: "dark",
  semanticHighlighting: true,
  semanticTokenColors,
  tokenColors,
  colors,
};

const outPath = resolve(__dirname, "../themes/qtlike-dark-theme.json");
writeFileSync(outPath, JSON.stringify(theme, null, 4), "utf8");
console.log(`✓ Theme written to ${outPath}`);
console.log(`  ${tokenColors.length} TextMate rules`);
console.log(`  ${Object.keys(semanticTokenColors).length} semantic token rules`);
console.log(`  ${Object.keys(colors).length} UI colour entries`);
