/**
 * Qt Creator-Like Dark Theme — Colour Palette
 *
 * Every hex value used by the theme is defined here as a named constant.
 * This is the single source of truth for colours. Modify here; the build
 * script will propagate changes to every rule that references each constant.
 *
 * Colour roles follow the Qt Creator dark-mode aesthetic:
 *   warm tan/khaki text on near-black warm-grey backgrounds, with
 *   teal italic keywords, coral-red types, and amber strings.
 *
 * References:
 *   Qt Creator dark theme colour inspiration — https://www.qt.io/product/development-tools
 */

// ─── Syntax / Token Colours ──────────────────────────────────────────────────

/**
 * DEFAULT_FG — Warm tan #d6cf9a
 * The base foreground: operators, punctuation, function-call sites,
 * generic identifiers and any token that should "blend in".
 */
export const DEFAULT_FG = "#d6cf9a";

/**
 * MEMBER — Sandy orange #c19a7a
 * Member variables / properties, local variables, object-literal keys,
 * HTML tag names, JSON property keys, Markdown headings.
 * Equivalent to the "variable / property" semantic-token role.
 */
export const MEMBER = "#c19a7a";

/**
 * STRING — Amber #d69545
 * All string literals, template-literal delimiters, INI file text.
 */
export const STRING = "#d69545";

/**
 * KEYWORD — Teal #45c6d6  (always rendered italic)
 * Language keywords (if, for, while, return, class, …),
 * `this`/`self`/`super`, operators that read like words (instanceof,
 * typeof, sizeof, new, delete, …), template-expression braces,
 * CSS selectors, Markdown links.
 */
export const KEYWORD = "#45c6d6";

/**
 * TYPE — Coral red #ff8080
 * Class names, type names, interface names, namespace/module names,
 * enum type names, built-in types (support.class / support.type),
 * Rust lifetime names, Go package names.
 */
export const TYPE = "#ff8080";

/**
 * CONSTANT — Dark sienna #8a602c
 * Numeric literals, named constants, enum members in TextMate layer,
 * CSS property-value constants, `const`-declared / readonly variable
 * references. NOT used for function parameters (see PARAMETER below).
 */
export const CONSTANT = "#8a602c";

/**
 * PARAMETER — Warm terracotta #c0836b
 * Function and method parameters across all languages.
 * Distinct from CONSTANT (numbers/named constants) and MEMBER (fields/locals)
 * so call-site arguments can be visually traced back to their declaration.
 * Applies via the `parameter` semantic token and `variable.parameter.*`
 * TextMate scopes.
 */
export const PARAMETER = "#c0836b";

/**
 * STORAGE — Dusty mauve #d69aa7
 * Storage-type keywords used as type annotations: int, float, bool, …
 * Also Haskell generic types and HLSL shader types.
 */
export const STORAGE = "#d69aa7";

/**
 * COMMENT — Cool grey #a8abb0  (always rendered italic)
 * All comment tokens, Markdown blockquote punctuation.
 */
export const COMMENT = "#a8abb0";

/**
 * PREPROCESSOR — Hot pink #ff6aad
 * C/C++ preprocessor directives (#include, #define, #pragma, …),
 * Python and TypeScript decorators (@decorator), attribute macros in Rust.
 */
export const PREPROCESSOR = "#ff6aad";

/**
 * DOC_TAG — Muted green #66a334
 * Doxygen / JSDoc documentation tags (@param, @return, @brief, …),
 * C++ enum member variable names (in the TextMate layer).
 * Also used for the `enumMember` semantic token (italic).
 */
export const DOC_TAG = "#66a334";

/**
 * MEMBER_CPP — Bright yellow #fee45d
 * C++-specific member-variable access through `.` or `->`.
 * Scopes: variable.other.property.cpp, variable.other.object.access.cpp
 * Kept distinct from MEMBER to give C++ devs immediate visual feedback
 * on member-access expressions.
 */
export const MEMBER_CPP = "#fee45d";

/**
 * GLOBAL_VAR — Blue-purple #9aa7d6
 * Global / module-level variables and Python ALL_CAPS constants
 * (constant.other.caps.python). Visually separates globals from locals.
 */
export const GLOBAL_VAR = "#9aa7d6";

/**
 * ERROR — Bright red #f44747
 * Invalid tokens, syntax errors, PHP illegal constructs.
 */
export const ERROR = "#f44747";

// ─── Workbench / UI Colours ───────────────────────────────────────────────────
// These are used only in the `colors` section of the theme (editor chrome,
// widget backgrounds, status bar, etc.). They are not used for syntax tokens.

export const UI = {
  // Backgrounds
  BG_EDITOR:       "#2e2f30",   // main editor area
  BG_DARK:         "#222324",   // gutter, breadcrumbs, panel
  BG_DARKER:       "#222222",   // sidebar section headers
  BG_PANEL:        "#252526",   // widgets, suggest widget, tabs header
  BG_MENU:         "#252526",   // menus
  BG_SIDEBAR:      "#2e2f30",   // file explorer
  BG_TITLE:        "#3c3c3c",   // title bar
  BG_ACTIVITY:     "#333333",   // activity bar
  BG_INPUT:        "#3c3c3c",   // input fields, dropdowns, checkboxes
  BG_PEEK:         "#302d1d",   // peek view editor (warm tint)
  BG_PEEK_GUTTER:  "#242117",   // peek view gutter

  // Foregrounds
  FG_DEFAULT:      "#cccccc",   // general UI text
  FG_SIDEBAR:      "#d0d0d0",   // sidebar / panel titles
  FG_DIM:          "#bbbbbb",   // dimmed / inactive text

  // Accent / highlights
  ACCENT_GOLD:     "#ffd700",   // focus border, peek border, suggest widget border
  ACCENT_BLUE:     "#007acc",   // status bar, activity badge, links
  ACCENT_CYAN:     "#00ffff",   // suggest widget highlight foreground
  ACCENT_AMBER:    "#ffa700",   // progress bar
  ACCENT_LINK:     "#3794ff",   // text links, picker group
  ACCENT_TEAL_SEL: "#1d545c",   // selection background (matches KEYWORD family)

  // Diagnostics
  ERR_FG:          "#ec735b",   // error squiggles
  WARN_FG:         "#cca700",   // warning squiggles
  INFO_FG:         "#75beff",   // info squiggles

  // Git decorations
  GIT_ADDED:       "#81b88b",
  GIT_MODIFIED:    "#e2c08d",
  GIT_DELETED:     "#c74e39",
  GIT_IGNORED:     "#8c8c8c",
  GIT_UNTRACKED:   "#73c991",
  GIT_SUBMODULE:   "#8db9e2",
  GIT_CONFLICT:    "#6c6cc4",
  GIT_GUTTER_ADD:  "#587c0c",
  GIT_GUTTER_MOD:  "#0c7d9d",
  GIT_GUTTER_DEL:  "#94151b",
};
