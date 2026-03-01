# Theme Development Guide

How to build, test, and extend the Qt Creator-Like Dark Theme.

---

## Quick start

```bash
# Install dev dependencies (tsx + typescript)
npm install

# Regenerate themes/qtlike-dark-theme.json from source
npm run build-theme
```

The build script writes `themes/qtlike-dark-theme.json` and prints a summary:
```
✓ Theme written to …/themes/qtlike-dark-theme.json
  42 TextMate rules
  28 semantic token rules
  170 UI colour entries
```

**The generated JSON is committed to the repo** so VS Code (and the extension packaging step) can always read it without running the build. Whenever you change the TypeScript source, re-run `npm run build-theme` and commit both the `.ts` changes and the updated `.json`.

---

## File structure

```
scripts/
  palette.ts          ← single source of truth for every hex colour
  build.ts            ← assembles tokenColors, semanticTokenColors, colors
themes/
  qtlike-dark-theme.json   ← generated — do not edit by hand
docs/
  REFERENCES.md       ← authoritative sources for all scope names
  DEVELOPMENT.md      ← this file
package.json          ← VS Code extension manifest + build scripts
```

---

## Colour palette

All colours are named constants in `scripts/palette.ts`. Never put a bare hex value in `build.ts` — always use a palette constant.

### Syntax colours

| Constant | Hex | Role |
|---|---|---|
| `DEFAULT_FG` | `#d6cf9a` | Warm tan — operators, punctuation, function calls, general text |
| `MEMBER` | `#c19a7a` | Sandy orange — member vars, local vars, object keys, HTML tags |
| `STRING` | `#d69545` | Amber — all string literals |
| `KEYWORD` | `#45c6d6` | Teal — language keywords (always italic) |
| `TYPE` | `#ff8080` | Coral red — class/type/namespace/interface names |
| `CONSTANT` | `#8a602c` | Dark sienna — numbers, named constants, function parameters |
| `STORAGE` | `#d69aa7` | Dusty mauve — storage-type keywords (`int`, `float`, …) |
| `COMMENT` | `#a8abb0` | Cool grey — comments (always italic) |
| `PREPROCESSOR` | `#ff6aad` | Hot pink — `#include`/`#define`, decorators, Rust attributes |
| `DOC_TAG` | `#66a334` | Muted green — Doxygen/JSDoc `@param` tags, C++ enum members |
| `MEMBER_CPP` | `#fee45d` | Bright yellow — C++ member-variable access via `.` or `->` |
| `GLOBAL_VAR` | `#9aa7d6` | Blue-purple — global/module variables, Python ALL_CAPS constants |
| `ERROR` | `#f44747` | Bright red — syntax errors, invalid tokens |

### Colour role rationale

The palette is designed so that the most important structural tokens have the highest visual weight:

1. **Teal italic** (`KEYWORD`) — keywords jump out immediately without being harsh
2. **Coral red** (`TYPE`) — types are the second most important structural element
3. **Amber** (`STRING`) — string content is clearly distinguished
4. **Hot pink** (`PREPROCESSOR`) — "meta-level" tokens (directives, decorators) stand apart
5. **Sandy orange / DEFAULT_FG** — variables and operators sit comfortably in the background
6. **Dark sienna** (`CONSTANT`) — numbers and constants are visually quieter than strings

---

## The two-layer system

See `docs/REFERENCES.md §1` for a full explanation. In brief:

- **TextMate rules** (`tokenColors`) are your universal fallback. They run as soon as a file is opened, before any language server loads.
- **Semantic rules** (`semanticTokenColors`) are applied by the language server after it has finished indexing. They are more precise — they know *exactly* whether `x` is a field, parameter, or local variable. They **override** TextMate where both match.

For cross-language consistency, prefer a single semantic rule over many language-specific TextMate rules. For example:

```typescript
// One semantic rule covers member fields in ALL languages:
"property": sc(p.MEMBER),

// vs. having to write separate TextMate rules for each:
// "variable.other.property.cpp"
// "variable.other.property.ts"
// "variable.other.member.rust"
// ...
```

---

## Adding support for a new language

### Step 1 — inspect the scopes

Open a sample file in VS Code with the theme active and the language extension installed. Put the cursor on a token and run:

```
F1 → Developer: Inspect Editor Tokens and Scopes
```

Note the TextMate scope stack (bottom of the popup) and the semantic token type/modifiers (top, if the language server has loaded).

### Step 2 — check if existing rules already cover it

Many scopes are covered by broad universal rules (e.g. `keyword`, `string`, `constant.numeric`). Check `scripts/build.ts` to see if the token already gets a sensible colour before adding a new rule.

### Step 3 — add a TextMate rule

In `scripts/build.ts`, find the appropriate section and add the scope. Use one of the helper functions:

```typescript
// Foreground colour only:
fg("Rule name", ["scope.one", "scope.two"], p.MEMBER),

// Foreground + font style:
fgs("Rule name", ["scope.one"], p.KEYWORD, "italic"),

// Font style only (no colour change):
fs("Rule name", ["scope.one"], "italic"),
```

### Step 4 — add a semantic rule (if the language server supports it)

In the `semanticTokenColors` object, add an entry using the selector syntax:

```typescript
// All languages:
"property": sc(p.MEMBER),

// One language only:
"property:rust": sc(p.MEMBER_CPP),

// With modifier:
"property.readonly": sc(p.CONSTANT),
```

### Step 5 — rebuild and test

```bash
npm run build-theme
```

Then press `F5` in VS Code (with the repo open as a workspace) to launch an Extension Development Host with the updated theme active. Inspect tokens again to confirm the rules fire.

---

## Building for distribution

```bash
# Regenerate the JSON (also runs automatically via vscode:prepublish)
npm run build-theme

# Package as a .vsix file (requires vsce)
npx vsce package
```

The `vscode:prepublish` hook in `package.json` ensures the JSON is always regenerated before packaging, so the distributed `.vsix` always reflects the TypeScript source.

---

## Debugging tips

- **A rule isn't firing**: Use "Inspect Editor Tokens and Scopes" to check the exact scope emitted. The scope in the theme might not exactly match.
- **A colour looks wrong**: The semantic layer overrides TextMate. If you set a TextMate rule but see a different colour, a semantic rule (possibly a built-in VS Code default) is winning. Add a `semanticTokenColors` entry to override it.
- **Italic / bold isn't showing**: Font styles stack in unexpected ways. Check that a `"fontStyle": "normal"` override isn't clearing your italic further up the rule list.
- **Semantic tokens not appearing**: Confirm the language server is running (check the status bar) and that `"editor.semanticHighlighting.enabled"` is not set to `false` in your user settings.
