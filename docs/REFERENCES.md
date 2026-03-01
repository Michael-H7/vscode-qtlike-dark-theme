# Theme Development References

This document catalogues every authoritative source used to build the Qt Creator-Like Dark Theme. It is the canonical answer to "where do these scope names come from?"

---

## 1. VS Code Theme Architecture

### Official theme-authoring guide
**https://code.visualstudio.com/api/extension-guides/color-theme**

Covers:
- JSON structure of a `.color-theme.json` file
- The three top-level sections: `colors` (workbench UI), `tokenColors` (TextMate), `semanticTokenColors` (LSP)
- How to generate a starter theme with `yo code`
- The `"semanticHighlighting": true` opt-in flag

### Two-layer architecture summary

| Layer | Key | Mechanism | Priority |
|---|---|---|---|
| TextMate | `tokenColors` | Regex grammar tokenisation — always present, instant | Lower |
| Semantic | `semanticTokenColors` | Language server (LSP) — precise, project-aware, loads after LSP | **Higher — wins on conflict** |

When both layers match a token the **semantic rule wins**. If a semantic token has no matching rule in `semanticTokenColors`, VS Code falls back to a set of predefined TextMate scope mappings (e.g. the semantic token `property` falls back to the TextMate scope `variable.other.property`). The full fallback table is in the semantic highlight guide below.

---

## 2. Semantic Token Reference (Official)

**https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide**

The canonical list of the **22 standard token types** and **10 modifiers** that any language server may emit. Theming rules in `semanticTokenColors` use the selector syntax:

```
(tokenType)(.modifier)*(:language)?
```

Examples:
- `"property"` — all property tokens in all languages
- `"property.readonly"` — readonly properties in all languages
- `"variable:java"` — variables in Java only
- `"*.declaration"` — any token with the `declaration` modifier

### Standard token types

| Type | Typical usage |
|---|---|
| `namespace` | namespace / module / package name |
| `class` | class type name |
| `enum` | enumeration type name |
| `interface` | interface type name |
| `struct` | struct type name |
| `typeParameter` | generic / template type parameter (T, K, V) |
| `type` | other type (type alias, typedef) |
| `parameter` | function or method parameter |
| `variable` | local or global variable |
| `property` | member field / property |
| `enumMember` | enum constant |
| `decorator` | decorator or annotation |
| `event` | event property |
| `function` | function at declaration or call site |
| `method` | member method |
| `macro` | macro |
| `label` | goto-style label |
| `comment` | comment token |
| `string` | string literal |
| `keyword` | language keyword |
| `number` | number literal |
| `regexp` | regular expression literal |
| `operator` | operator symbol |

### Standard modifiers

| Modifier | Meaning |
|---|---|
| `declaration` | this is the declaration site of the symbol |
| `definition` | this is the definition site (e.g. in a header file) |
| `readonly` | symbol is immutable / const |
| `static` | static class member |
| `deprecated` | symbol is marked deprecated |
| `abstract` | abstract type or method |
| `async` | async function |
| `modification` | variable is being assigned to here |
| `documentation` | occurs inside a doc comment |
| `defaultLibrary` | symbol is from the standard library |

### Language servers that provide semantic tokens

| Language | Extension | Notes |
|---|---|---|
| TypeScript / JavaScript | Built-in (tsserver) | First language supported (VS Code 1.43, 2020) |
| Python | Pylance (`ms-python.vscode-pylance`) | Full coverage |
| C / C++ | clangd (`llvm-vs-code-extensions.vscode-clangd`) or `ms-vscode.cpptools` | Both provide good coverage |
| C# | C# Dev Kit or OmniSharp (`ms-dotnettools.*`) | Full coverage |
| Rust | rust-analyzer (`rust-lang.rust-analyzer`) | Excellent coverage |
| Go | gopls (`golang.go`) | Requires opt-in: `"gopls": { "ui.semanticTokens": true }` |
| Java | Extension Pack for Java | Partial |
| HTML / CSS / JSON | None / minimal | These rely purely on TextMate grammars |

---

## 3. TextMate Scope Naming — De-facto Standard

### Sublime Text Scope Naming Guide (primary reference)
**https://www.sublimetext.com/docs/scope_naming.html**

This is the **de-facto community standard** for TextMate scope naming. It extends the original TextMate spec with a more complete set of scope groups and is the guide that modern grammar authors (including those writing VS Code language extensions) follow. Use this when writing or verifying TextMate rules.

Key additions over the original TextMate spec that are widely emitted:
- `punctuation.definition.*` — opening/closing delimiters for strings, tags, blocks
- `punctuation.separator.*` — commas, periods, colons
- `punctuation.terminator.*` — semicolons
- `punctuation.accessor.*` — `.` and `->` member-access operators
- `punctuation.section.block.*` / `punctuation.section.parens.*` — brackets and braces
- `variable.other.member` — member field access (cross-language)
- `variable.function` — function used as a value or called as an expression
- `keyword.declaration.*` — declaration keywords (`class`, `def`, `fn`, etc.)

### Original TextMate Language Grammars spec
**https://macromates.com/manual/en/language_grammars**

The original 11 root scope groups, still valid in all modern grammars:

| Root | Examples |
|---|---|
| `comment` | `comment.line.double-slash`, `comment.block.documentation` |
| `constant` | `constant.numeric`, `constant.language`, `constant.character.escape` |
| `entity` | `entity.name.function`, `entity.name.type`, `entity.name.tag` |
| `invalid` | `invalid.illegal`, `invalid.deprecated` |
| `keyword` | `keyword.control`, `keyword.operator`, `keyword.other` |
| `markup` | `markup.bold`, `markup.italic`, `markup.heading` |
| `meta` | structural context — **do not style** `meta.*` directly |
| `storage` | `storage.type`, `storage.modifier` |
| `string` | `string.quoted.*`, `string.interpolated`, `string.regexp` |
| `support` | `support.function`, `support.class`, `support.type`, `support.constant` |
| `variable` | `variable.parameter`, `variable.language`, `variable.other` |

---

## 4. Inspecting Scopes in VS Code

### `Developer: Inspect Editor Tokens and Scopes`

Open the command palette (`F1`) and run **"Developer: Inspect Editor Tokens and Scopes"**. Click on any token in an open file. The popup shows:

- The full TextMate scope stack (grammar layer)
- The semantic token type and modifiers (LSP layer), if any
- Which theme rule matched for each layer
- The rendered foreground colour and font style

This is the **primary tool** for verifying that a new rule fires correctly and for discovering the exact scope names a particular grammar uses. Essential when adding support for a new language or grammar extension.

### VS Code scope-inspection extension (optional)
For bulk inspection, the extension `ctf0.scope-info` adds a hover tooltip to every token. Not required but useful for surveying a new language's grammar coverage.

---

## 5. VS Code Built-in Reference Themes

### Dark+ / Dark Modern (built-in reference implementation)
**https://github.com/microsoft/vscode/tree/main/extensions/theme-defaults/themes**

VS Code ships two built-in dark themes, `dark_vs.json` (base) and `dark_plus.json` (extension). Together they are the canonical reference for what a well-formed VS Code theme looks like. Notable observations:

- Dark+ uses only **4 semantic token rules** in `semanticTokenColors` and relies heavily on TextMate for the rest
- `dark_plus.json` includes `dark_vs.json` via `"include"` — a pattern we do not use (we generate a self-contained file instead)
- The fallback TextMate scope mappings built into VS Code are designed to work well with the Dark+ TextMate rules, which is why following the same scope naming conventions gives good results in any theme

---

## 6. Reference Themes Consulted

### Vitesse (build-script pattern)
**https://github.com/antfu/vscode-theme-vitesse**

Anthony Fu's theme, notable for its TypeScript programmatic build approach:
- `scripts/index.ts` generates multiple JSON variant files via `tsx`
- Colors defined as named constants, eliminating magic strings
- Uses `color` package for manipulation, `fs-extra` for output
- This repo follows the same pattern (without the multi-variant complexity)

### Catppuccin for VS Code (modern semantic token coverage)
**https://github.com/catppuccin/vscode**

Best-in-class example of comprehensive `semanticTokenColors` coverage across many languages. Useful reference when adding new language-server-specific semantic token rules. TypeScript monorepo (pnpm workspace), more complex than Vitesse.

### One Dark Pro
**https://github.com/Binaryify/OneDark-Pro**

Most-downloaded VS Code theme. Good reference for which scopes are commonly used in community themes and what "standard" theming decisions look like.

---

## 7. Language-Specific Scope References

When adding or debugging rules for a specific language, the grammar file itself is the ultimate authority. Grammar files (`.tmLanguage.json`) are typically found in the language extension's source repository.

| Language | Extension source |
|---|---|
| TypeScript / JavaScript | Built-in VS Code — `extensions/typescript-basics/` in the VS Code repo |
| Python | `github.com/microsoft/vscode-python` |
| C / C++ | `github.com/microsoft/vscode-cpptools` |
| C# | `github.com/OmniSharp/omnisharp-vscode` |
| Rust | `github.com/rust-lang/vscode-rust` |
| Go | `github.com/golang/vscode-go` |
| HTML | Built-in VS Code — `extensions/html/` |
| JSON | Built-in VS Code — `extensions/json/` |
| YAML | `github.com/redhat-developer/vscode-yaml` |
| TOML | `github.com/tamasfe/taplo` (even-better-toml extension) |

---

## 8. VS Code Workbench Colour Keys

**https://code.visualstudio.com/api/references/theme-color**

The complete list of keys accepted in the `colors` section of a theme. This covers ~600+ keys spanning editor, sidebar, terminal, diff editor, notification, panel, minimap, and more. The theme only sets the keys it wants to override; everything else falls back to VS Code defaults.
