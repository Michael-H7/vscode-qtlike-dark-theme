# Changelog

All notable changes to the Qt Creator-Like Dark Theme are documented here.

## [0.1.0] — 2026-03-01

### Added

- **TypeScript build script** (`scripts/build.ts`) — the theme JSON is now
  generated programmatically, replacing the hand-edited JSON file. Run
  `npm run build-theme` to regenerate `themes/qtlike-dark-theme.json`.

- **Palette module** (`scripts/palette.ts`) — all hex values are now named
  constants with JSDoc comments explaining their role. This eliminates the
  near-duplicate `#d6cf99` / `#d6cf9a` colour that existed in the original.

- **Expanded semantic token rules** — from 4 to 32 rules, now covering all
  22 standard VS Code token types (namespace, class, interface, struct, enum,
  type, typeParameter, property, variable, parameter, function, method,
  decorator, macro, label, event, keyword, operator, comment, string, number,
  regexp) across all language servers (clangd, Pylance, OmniSharp,
  rust-analyzer, gopls, tsserver).

- **Expanded TextMate rules** — from 16 to 66 rules. Existing rules are
  preserved with identical colours; new rules add coverage for:
  - C++20: concepts (`storage.type.concept.cpp`), modules
    (`keyword.control.directive.module.cpp`), coroutines
    (`keyword.control.coroutine.cpp`), spaceship operator
  - Python 3.10+: structural pattern matching (`match`/`case`), walrus
    operator (`:=`), ALL_CAPS constants mapped to `GLOBAL_VAR` blue-purple
  - TypeScript modern: `satisfies` operator, `using` declarations
  - C# modern: `record` types, `init` accessors, `with` expressions,
    `async`/`await` keywords, pattern operators
  - Rust: `async`/`await`, `where` clauses, lifetime use-sites
    (`storage.modifier.lifetime.rust`)
  - HTML/XML: tag angle-bracket punctuation (was missing entirely)
  - YAML: mapping keys (`entity.name.tag.yaml`), anchors, aliases
  - TOML: property keys, section headers (was completely missing)
  - JSON: separate rules for keys vs. string values

- **Developer documentation**:
  - `docs/REFERENCES.md` — authoritative sources with links (VS Code theme
    guide, Semantic Highlight Guide, Sublime naming spec, TextMate grammar
    manual, per-language grammar extension repos)
  - `docs/DEVELOPMENT.md` — quick-start guide, colour palette table, two-layer
    architecture explanation, per-language extension instructions, debug tips

### Changed

- `package.json`: version bumped to `0.1.0`, engines updated to `^1.85.0`,
  added `devDependencies` (`tsx`, `typescript`), added `build-theme` and
  `vscode:prepublish` scripts, added extension keywords.

### Fixed

- Near-duplicate palette colour (`#d6cf99` vs `#d6cf9a`) unified to
  `DEFAULT_FG = "#d6cf9a"`.
- `storage.modifier.lifetime.rust` was previously grouped under diff-header
  punctuation (wrong section, same colour). Moved to the Rust types section.

## [0.0.1] — Initial release

- Basic Qt Creator-inspired dark colour theme for VS Code.
- 16 TextMate token-colour rules, 4 semantic token rules.
- ~170 workbench UI colour entries.
