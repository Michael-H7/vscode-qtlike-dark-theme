[//]: # (sample.md — Theme fixture: Markdown)
[//]: # ()
[//]: # (Open in Extension Development Host (F5) and use)
[//]: # ("Developer: Inspect Editor Tokens and Scopes" to verify colours.)
[//]: # ()
[//]: # (Key things to check:)
[//]: # (  heading markers (#–######)  → hot pink       (#ff6aad))
[//]: # (  heading text                → warm tan        (#d6cf9a))
[//]: # (  bold (**text**)             → warm tan bold   (#d6cf9a))
[//]: # (  italic (*text*)             → warm tan italic (#d6cf9a))
[//]: # (  inline code (`code`)        → amber           (#d69545))
[//]: # (  code fence language id      → teal italic     (#45c6d6))
[//]: # (  link text [text](url)       → sandy orange    (#c19a7a))
[//]: # (  link URL                    → amber           (#d69545))
[//]: # (  blockquote marker (>)       → cool grey       (#a8abb0))
[//]: # (  list markers (-, *, 1.)     → hot pink        (#ff6aad))
[//]: # (  horizontal rule (---)       → cool grey       (#a8abb0))

# Qt Creator-Like Dark Theme

A dark colour theme for **Visual Studio Code** inspired by Qt Creator's
built-in dark mode. Warm *tan* text on a near-black warm-grey background.

---

## Table of Contents

1. [Overview](#overview)
2. [Colour Palette](#colour-palette)
3. [Language Support](#language-support)
4. [Architecture](#architecture)
5. [Installation](#installation)
6. [Development](#development)
7. [Changelog](#changelog)

---

## Overview

This theme aims to faithfully recreate the feel of Qt Creator's **dark mode**
while extending it to all languages VS Code supports. The palette is warm and
low-contrast enough to be comfortable for long sessions, yet distinct enough
that each token class is immediately recognisable.

### Design Principles

- **Warm neutrals** — default text is a warm tan (`#d6cf9a`) rather than pure white
- **Teal italics** — keywords stand out without being jarring
- **Coral types** — type names and class names pop in coral red (`#ff8080`)
- **Amber strings** — string literals in amber are immediately distinguishable
- **Semantic layering** — LSP semantic tokens refine TextMate grammar fallbacks

---

## Colour Palette

| Token Type | Colour Name | Hex |
|---|---|---|
| Keywords *(italic)* | teal | `#45c6d6` |
| Types / class names | coral red | `#ff8080` |
| Storage types (`int`, `bool`) | dusty mauve | `#d69aa7` |
| Functions | warm tan | `#d6cf9a` |
| Members / variables | sandy orange | `#c19a7a` |
| Parameters / constants | dark sienna | `#8a602c` |
| Strings | amber | `#d69545` |
| Comments *(italic)* | cool grey | `#a8abb0` |
| Preprocessor / decorators | hot pink | `#ff6aad` |
| Doc tags (`@param`) | muted green | `#66a334` |
| C++ member access (`.` / `->`) | bright yellow | `#fee45d` |
| Global vars / ALL\_CAPS | blue-purple | `#9aa7d6` |
| Errors / invalid | bright red | `#f44747` |

---

## Language Support

### Priority Languages

- **C / C++** — C17 and C++20, including concepts, coroutines, and modules
- **Python** — 3.10+, including `match`/`case` and walrus operator `:=`
- **TypeScript / JavaScript** — TS 5.x with `satisfies`, `using`, template literal types
- **C#** — C# 12 with records, init setters, and list patterns
- **Rust** — 2021 edition with lifetimes, traits, and `async`/`await`
- **Go** — 1.21+ with generics and goroutines

### Markup & Data Languages

- **HTML / XML** — tags, attributes, CDATA, processing instructions
- **JSON** — keys vs values, all scalar types
- **YAML** — anchors, aliases, block/flow scalars, all scalar types
- **TOML** — tables, array of tables, inline tables, all scalar types
- **CSS** — selectors, properties, custom properties, at-rules, pseudo-classes
- **Markdown** — headings, emphasis, code, links, lists, tables

---

## Architecture

The theme is generated from a **TypeScript build script** rather than being
maintained as raw JSON:

```
scripts/
├── palette.ts     ← single source of truth for all hex colours
└── build.ts       ← generates the JSON theme file

themes/
└── qtlike-dark-theme.json   ← do NOT edit manually
```

Run the build after editing either script:

```bash
npm run build-theme
# or directly:
tsx scripts/build.ts
```

Current output statistics:

| Category | Count |
|---|---|
| TextMate rules | 66 |
| Semantic token rules | 32 |
| UI colour entries | 246 |

---

## Installation

### From VSIX (local build)

```bash
# 1. Install dependencies
npm install

# 2. Build the theme
npm run build-theme

# 3. Package the extension
npx vsce package

# 4. Install in VS Code
code --install-extension qtlike-dark-theme-*.vsix
```

### From Extension Development Host

1. Open this repository in VS Code
2. Press **F5** to launch the Extension Development Host
3. Open **Command Palette** → `Color Theme` → select **Qt-Like Dark**

---

## Development

### Adding a New Language

1. Add token mappings to `scripts/build.ts`
2. Create a fixture file `test/sample.<ext>`
3. Run `npm run build-theme`
4. Press **F5**, open the fixture, inspect with  
   `Developer: Inspect Editor Tokens and Scopes`

### Inline Code Examples

Use `const x = 42` for variable declarations and `function foo()` for
functions. Types like `string`, `number`, and `boolean` are storage keywords.

### Emphasised Text

This is *italic*, this is **bold**, and this is ***bold italic***.
~~Strikethrough~~ text is also supported by GFM.

---

## Changelog

### v0.1.0 — 2025

- Added comprehensive test fixture files for all 15 supported languages
- Fixed `storage.modifier.lifetime.rust` scope placement
- Rewrote `README.md` with full documentation
- Created `CHANGELOG.md`
- Added `.gitignore`

### v0.0.1 — Initial release

- Initial theme based on Qt Creator dark mode palette
- TextMate grammar rules for C, C++, Python, TypeScript, JavaScript,
  C#, Rust, Go, HTML, XML, JSON, YAML, TOML, CSS, Markdown
- Semantic token rules for LSP-powered highlighting
- VS Code workbench / chrome colour overrides

---

## Blockquotes

> "Any fool can write code that a computer can understand.
> Good programmers write code that humans can understand."
> — Martin Fowler

> **Note:** Semantic tokens from LSP servers refine (override) TextMate
> grammar tokens. If a token looks wrong, check both layers with
> `Developer: Inspect Editor Tokens and Scopes`.

> **Warning:** The Go language server (`gopls`) requires explicit opt-in
> for semantic tokens:
>
> ```json
> { "gopls": { "ui.semanticTokens": true } }
> ```

---

## Lists

### Unordered

- alpha
- beta
  - beta-one
  - beta-two
    - deep item
- gamma
- delta

### Ordered

1. First item
2. Second item
   1. Nested first
   2. Nested second
3. Third item
4. Fourth item

### Task list (GFM)

- [x] Create `sample.c`
- [x] Create `sample.cpp`
- [x] Create `sample.py`
- [x] Create `sample.ts`
- [x] Create `sample.js`
- [x] Create `sample.cs`
- [x] Create `sample.rs`
- [x] Create `sample.go`
- [x] Create `sample.html`
- [x] Create `sample.xml`
- [x] Create `sample.json`
- [x] Create `sample.yaml`
- [x] Create `sample.toml`
- [x] Create `sample.css`
- [x] Create `sample.md`

---

## Links and Images

### Inline links

Visit the [VS Code documentation](https://code.visualstudio.com/docs) for
more information about [theme colour references](https://code.visualstudio.com/api/references/theme-color).

### Reference links

The [TextMate grammar specification][tm-spec] describes the scope names used
for syntax highlighting. [Semantic tokens][sem-tokens] are a VS Code extension
on top of that system.

[tm-spec]: https://macromates.com/manual/en/language_grammars
[sem-tokens]: https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide

### Autolinks

<https://github.com/example/vscode-qtlike-dark-theme>  
<dev@example.com>

### Image

![Qt Creator Dark Mode Screenshot](images/qt-like-dark-theme-icon.png "Theme icon")

---

## Code Blocks

### Fenced with language identifier

```typescript
interface ColourEntry {
  hex: string;
  name: string;
  usage: string;
}

const PALETTE: Record<string, ColourEntry> = {
  KEYWORD:  { hex: "#45c6d6", name: "teal",       usage: "keywords (italic)" },
  TYPE:     { hex: "#ff8080", name: "coral red",  usage: "type names" },
  STRING:   { hex: "#d69545", name: "amber",      usage: "string literals" },
  COMMENT:  { hex: "#a8abb0", name: "cool grey",  usage: "comments (italic)" },
};
```

```python
from dataclasses import dataclass

@dataclass
class ColourToken:
    hex: str
    name: str
    usage: str

KEYWORD = ColourToken("#45c6d6", "teal", "keywords")
```

```rust
struct ColourToken {
    hex: &'static str,
    name: &'static str,
}

const KEYWORD: ColourToken = ColourToken {
    hex: "#45c6d6",
    name: "teal",
};
```

### Indented code block

    // This is an indented code block
    // (4 spaces or 1 tab)
    const x = 42;

### Inline code

Use `npm run build-theme` to regenerate `themes/qtlike-dark-theme.json`.
The script is located at `scripts/build.ts` and the palette at `scripts/palette.ts`.

---

## HTML in Markdown

VS Code's Markdown preview renders inline HTML:

<details>
<summary>Click to expand</summary>

This content is hidden by default. It demonstrates that raw HTML inside
Markdown files is highlighted as Markdown, not HTML — the HTML tags themselves
may appear in a muted colour depending on the grammar.

</details>

<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> opens the Command Palette.

---

## Miscellaneous GFM

### Footnotes

The theme supports fifteen languages[^1] and uses a build script[^2] to
generate the final JSON.

[^1]: C, C++, Python, TypeScript, JavaScript, C#, Rust, Go, HTML, XML, JSON, YAML, TOML, CSS, Markdown.
[^2]: Located at `scripts/build.ts`.

### Horizontal rules

Three or more hyphens, asterisks, or underscores:

---

***

___

### Escaped characters

\*not italic\* \`not code\` \[not a link\] \# not a heading

### Hard line breaks (two trailing spaces)

Line one  
Line two  
Line three  

---

*End of fixture — all major Markdown constructs covered.*
