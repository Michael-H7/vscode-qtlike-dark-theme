# Qt Creator-Like Dark Theme

A VS Code colour theme inspired by Qt Creator's dark mode: warm tan/khaki text
on a near-black warm-grey background, with teal italic keywords, coral-red type
names, amber strings, and hot-pink preprocessor directives.

## Colour palette

| Role | Colour | Hex | Used for |
|------|--------|-----|----------|
| Default text | warm tan | `#d6cf9a` | Operators, punctuation, function calls |
| Members | sandy orange | `#c19a7a` | Variables, properties, object keys, HTML tags |
| Strings | amber | `#d69545` | All string literals |
| Keywords | teal (italic) | `#45c6d6` | Control flow, `this`/`self`, word-operators |
| Types | coral red | `#ff8080` | Class/struct/interface/enum names |
| Storage types | dusty mauve | `#d69aa7` | Primitive type keywords (`int`, `bool`, …) |
| Constants | dark sienna | `#8a602c` | Numeric literals, function parameters |
| Comments | cool grey (italic) | `#a8abb0` | All comment tokens |
| Preprocessor | hot pink | `#ff6aad` | `#include`, `@decorator`, Rust `#[attr]` |
| Doc tags | muted green | `#66a334` | `@param`, `@return`, enum members |
| C++ members | bright yellow | `#fee45d` | Member access via `.` or `->` in C++ |
| Globals | blue-purple | `#9aa7d6` | Module-level globals, Python ALL_CAPS constants |
| Errors | bright red | `#f44747` | Invalid / illegal tokens |

## Language support

Full semantic + TextMate coverage for:

- **C / C++** — including C++20 concepts, modules, coroutines, spaceship operator;
  C++ member access highlighted separately in bright yellow
- **Python** — including 3.10+ `match`/`case`, walrus `:=`, `@decorator`
- **TypeScript / JavaScript** — including `satisfies`, `using`, JSX/TSX
- **C#** — including `record`, `init`, `with`, `async`/`await`, patterns
- **Rust** — including lifetimes, `async`/`await`, `where`, `#[attributes]`
- **Go** — package names, short variable declarations
- **HTML / XML** — tag names, attribute names, DOCTYPE, angle brackets
- **JSON** — separate colours for property keys vs. string values
- **YAML** — mapping keys, anchors, aliases
- **TOML** — property keys, section headers
- **CSS / SCSS** — property values, selectors, units
- **Markdown** — headings, bold, italic, code spans, links, blockquotes

## Architecture

The theme uses VS Code's two-layer highlighting system:

1. **TextMate** (`tokenColors`) — 66 rules, always-on, universal fallback
2. **Semantic** (`semanticTokenColors`) — 32 rules, LSP-powered, overrides
   TextMate where both match

The build script (`scripts/build.ts`) generates
`themes/qtlike-dark-theme.json` from TypeScript source. To regenerate:

```sh
npm install
npm run build-theme
```

See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for a full developer guide
and [`docs/REFERENCES.md`](docs/REFERENCES.md) for authoritative sources.

## Installation

Install from the VS Code Marketplace, or:

1. Clone this repository
2. Copy or symlink the folder into
   `~/.vscode/extensions/` (Linux/macOS) or
   `%USERPROFILE%\.vscode\extensions\` (Windows)
3. Reload VS Code and select **Qt Creator-Like Dark Theme** via
   `Preferences: Color Theme` (Ctrl+K Ctrl+T)
