# Arc42 Architecture Documentation - tree-sitter-objectscript

> Update note (2026): The repository now includes an additional `objectscript_routine` grammar (`expr -> core -> objectscript_routine`) and expanded pre-commit checks (corpus sync, query sync, lint auto-fix, parser/query validation). Query sync only manages `highlights.scm`, `indents.scm`, and `injections.scm`; `studio-highlights.scm` remains manual. Use `README.md` and `CONTRIBUTING.md` as the canonical operational docs.

## 1. Introduction and Goals

### 1.1 Requirements Overview

**tree-sitter-objectscript** is a tree-sitter parser for InterSystems ObjectScript, enabling:

- **Real-time syntax highlighting** in modern editors (Zed, Neovim, Emacs)
- **Incremental parsing** for responsive editing experience
- **Structural code analysis** for tooling (linters, formatters, refactoring tools)
- **Language injection** for polyglot ObjectScript files (embedded SQL, HTML, Python, JavaScript)

### 1.2 Quality Goals

| Priority | Goal | Description |
|----------|------|-------------|
| 1 | **Correctness** | Parse valid ObjectScript without errors; produce accurate ASTs |
| 2 | **Performance** | Sub-millisecond incremental parsing for editor responsiveness |
| 3 | **Completeness** | Cover the full ObjectScript language including UDL class syntax |
| 4 | **Maintainability** | Modular grammar structure for independent evolution of expr/core/objectscript_udl/objectscript/objectscript_routine |
| 5 | **Portability** | Language bindings for Rust, Python, Node.js, Go, Swift, C |

### 1.3 Stakeholders

| Stakeholder | Role | Expectations |
|-------------|------|--------------|
| ObjectScript Developers | End users | Accurate syntax highlighting and code navigation in editors |
| Editor Plugin Authors | Integrators | Stable API, well-documented queries, injection support |
| InterSystems | Maintainers | Language-complete parser, alignment with IRIS platform evolution |
| tree-sitter Ecosystem | Community | Standard compliance with tree-sitter conventions |

---

## 2. Architecture Constraints

### 2.1 Technical Constraints

| Constraint | Description |
|------------|-------------|
| tree-sitter DSL | Grammars must be written in tree-sitter's JavaScript DSL |
| External Scanner | Complex tokenization (whitespace-sensitive, embedded markers) requires C scanner |
| Grammar Inheritance | tree-sitter's `grammar()` extension mechanism is used for layering |
| Query Language | Highlights, injections, indents use tree-sitter's S-expression query format |

### 2.2 Organizational Constraints

| Constraint | Description |
|------------|-------------|
| MIT License | Open source under MIT license |
| Conventional Commits | Commit messages follow Conventional Commits specification |
| InterSystems Ownership | Repository maintained by InterSystems Corporation |

### 2.3 Conventions

| Convention | Description |
|------------|-------------|
| Grammar Layering | expr → core with two downstream paths: objectscript_udl → objectscript, and objectscript_routine |
| Keyword Fields | Keywords attached at usage sites via `field('keyword', ...)` |
| Layered Query Composition | `scripts/sync_queries.py` composes layered `highlights.scm`, `indents.scm`, and `injections.scm` files for `core`, `udl`, `objectscript`, and `objectscript_routine` (from EXPR/CORE/UDL/LOCAL sections per target); `studio-highlights.scm` is excluded from sync |
| Hook Automation | `.githooks/pre-commit` runs corpus sync for `objectscript/test/corpus`, runs `scripts/sync_queries.py`, and stages generated outputs; CI verifies Python query copies via `.github/workflows/sync-queries.yml` |
| Deterministic Node Installs | `package-lock.json` is committed and workflows use `npm ci` |
| ESLint Configuration | Linting uses flat config in `eslint.config.mjs` |

---

## 3. System Scope and Context

### 3.1 Business Context

```
┌─────────────────────────────────────────────────────────────────┐
│                    ObjectScript Development                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌─────────────────────┐     ┌──────────────┐ │
│  │Developer │────▶│tree-sitter-objectscript│────▶│ Editor       │ │
│  └──────────┘     └─────────────────────┘     │ (Zed/Neovim/ │ │
│       │                     │                  │  Emacs)      │ │
│       │                     │                  └──────────────┘ │
│       ▼                     ▼                                    │
│  ┌──────────┐     ┌─────────────────────┐                       │
│  │ IRIS DB  │     │ Other tree-sitter   │                       │
│  │ Platform │     │ grammars (SQL,HTML, │                       │
│  └──────────┘     │ Python,JavaScript)  │                       │
│                   └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Technical Context

| Interface | Description | Technology |
|-----------|-------------|------------|
| tree-sitter CLI | Grammar generation and testing | tree-sitter generate/build/test |
| Language Bindings | Native parser access | Rust, Python, Node.js, Go, Swift, C |
| Editor Extensions | Zed extension, nvim-treesitter, emacs-objectscript-ts-mode | Extension APIs |
| Query Files | Syntax highlighting and injection | .scm query files |

---

## 4. Solution Strategy

### 4.1 Layered Grammar Architecture

The grammar is split into five related targets to enable reuse and independent injection:

1. **expr**: Pure expressions (can be injected into SQL extensions, CSP templates)
2. **core**: Full routine syntax (lines of ObjectScript code)
3. **objectscript_udl**: Class definition syntax (`.cls` files)
4. **objectscript_routine**: Routine-file grammar for `.mac`, `.inc`, `.int`, and `.rtn` files
5. **objectscript**: Playground grammar for mixed snippets (top-level statements and class members)

Each layer extends the previous using tree-sitter's `grammar()` inheritance mechanism.

### 4.2 External Scanner for Whitespace Sensitivity

ObjectScript has whitespace-sensitive constructs:
- Command arguments require single space followed by non-whitespace
- Argumentless commands detected by double-space or end-of-line
- Embedded SQL/HTML markers need context-aware tokenization

The external scanner (`common/scanner.h`) handles these cases in C for performance.

### 4.3 Language Injection via Queries

Polyglot support is achieved through injection queries that detect:
- `[Language=python]` method keywords → Python parser
- `&sql()` embedded blocks → SQL parser
- XDATA MimeType → XML/JSON/YAML/Markdown parsers
- Storage definitions → XML parser

---

## 5. Building Block View

### 5.1 Level 1: Grammar Containers

```
┌────────────────────────────────────────────────────────────────┐
│                    tree-sitter-objectscript                     │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────┐   ┌──────────┐   ┌────────────────┐   ┌──────────┐ │
│  │   expr   │◀──│   core   │◀──│objectscript_udl│◀──│objectscript│ │
│  │ grammar  │   │ grammar  │   │    grammar     │   │  grammar  │ │
│  └──────────┘   └──────────┘   └────────────────┘   └──────────┘ │
│                      ▲                                             │
│                      │                                             │
│              ┌───────────────────┐                                │
│              │objectscript_      │                                │
│              │routine grammar    │                                │
│              └───────────────────┘                                │
│                      │                                             │
│              ┌───────┴───────┐                                 │
│              │    common     │                                 │
│              │ (scanner.h,   │                                 │
│              │  identifiers) │                                 │
│              └───────────────┘                                 │
├────────────────────────────────────────────────────────────────┤
│  Language Bindings: Rust | Python | Node | Go | Swift | C      │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Level 2: expr Grammar Components

| Component | Responsibility | Key Rules |
|-----------|----------------|-----------|
| Literals | String/numeric/JSON values | `string_literal`, `numeric_literal`, `json_*` |
| Operators | Binary/unary/pattern operators | `binary_operator`, `unary_operator`, `pattern_operator` |
| Variables | Variable references | `lvn`, `gvn`, `ssvn`, `instance_variable` |
| Functions | System functions | `system_defined_function`, `dollar_piece`, `dollar_list`, etc. |
| Classes | Class references | `class_method_call`, `class_parameter_ref` |
| Macros | Preprocessor macros | `macro_constant`, `macro_function` |

### 5.3 Level 2: core Grammar Components

| Component | Responsibility | Key Rules |
|-----------|----------------|-----------|
| Commands | ObjectScript commands | `command_set`, `command_do`, `command_for`, `command_if`, etc. |
| Control Flow | Block/old-style control | `elseif_block`, `else_block`, `command_while` |
| I/O | Device operations | `command_read`, `command_write`, `command_open`, `command_close` |
| Embedded | Language embedding | `embedded_sql`, `embedded_html`, `embedded_xml`, `embedded_js` |
| Preprocessor | Macros/conditionals | `pound_define`, `pound_if`, `pound_include` |
| Tags | Routine labels | `tag`, `tag_with_params`, `procedure` |

### 5.4 Level 2: objectscript_udl Grammar Components

| Component | Responsibility | Key Rules |
|-----------|----------------|-----------|
| Class | Class structure | `class_definition`, `class_extends`, `class_body` |
| Methods | Method definitions | `method`, `classmethod`, `method_definition` |
| Properties | Property definitions | `property`, `relationship`, `foreignkey` |
| Parameters | Class parameters | `parameter`, `parameter_type` |
| Queries | SQL queries | `query`, `query_body` |
| Triggers | Database triggers | `trigger`, `core_trigger`, `external_trigger` |
| XDATA | Data blocks | `xdata`, `xdata_xml`, `xdata_any` |
| Storage | Storage definitions | `storage`, `storage_body` |
| Indices | Index definitions | `index`, `index_properties` |

### 5.5 Level 2: objectscript Grammar Components

| Component | Responsibility | Key Rules |
|-----------|----------------|-----------|
| Top-level source | Parse mixed snippet/class-member input | `source_file` |
| Statement/class merge | Allow class statements and routine statements together | `class_statement`, `statement` |
| Scanner mode | Column-1 tag/statement disambiguation in playground mode | `column1_statement_mode` |

---

## 6. Runtime View

### 6.1 Parsing a Method Body

```
1. Editor sends text change to tree-sitter
2. UDL parser matches method_definition
3. Parser enters method body ({...})
4. Core grammar rules match statements (SET, DO, IF, etc.)
5. Expr grammar rules match expressions within statements
6. External scanner handles whitespace-sensitive tokenization
7. AST is returned to editor for highlighting
```

### 6.2 Language Injection Flow

```
1. UDL parser identifies method with [Language=python]
2. Injection query matches external_method_keywords
3. Query extracts language name and body content range
4. tree-sitter invokes Python parser on body range
5. Combined AST includes Python syntax nodes
6. Editor applies Python highlighting to injected range
```

---

## 7. Deployment View

### 7.1 Editor Integration

| Editor | Integration Method | Installation |
|--------|-------------------|--------------|
| Zed | Zed Extension | Extensions panel → ObjectScript |
| Neovim | nvim-treesitter | `:TSInstall objectscript_udl` for `.cls`; `:TSInstall objectscript` for snippets; `:TSInstall objectscript_routine` for routine files |
| Emacs | emacs-objectscript-ts-mode | Package installation from GitHub |

### 7.2 Build Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| `parser.c` | `*/src/parser.c` | Generated C parser |
| `scanner.c` | `*/src/scanner.c` | Generated scanner |
| `*.wasm` | `*/` | WebAssembly parser for playground |
| `*.dylib` | `*/` | macOS dynamic library |

---

## 8. Cross-cutting Concepts

### 8.1 Keyword Field Placement

Keywords are attached at usage sites rather than token definitions:

```javascript
// In grammar.js
command_set: ($) =>
  build_command_rule_argumentful(
    $,
    field('keyword', $.keyword_set),  // Field attached here
    repeat_with_commas($.set_argument),
  ),
```

This enables consistent query patterns: `keyword: (_) @keyword`

### 8.2 Post-Conditional Handling

ObjectScript commands accept post-conditionals (`:expression`). The `unspace` utility generates `_post_cond` variants of expression rules to handle the whitespace-less context after `:`.

### 8.3 Query File Composition

Query layering is generated by `scripts/sync_queries.py`:

- `expr/queries` is the source layer
- `core/queries` is composed as EXPR + CORE LOCAL
- `udl/queries` is composed as EXPR + CORE + UDL LOCAL
- `objectscript/queries` is composed as:
  - `highlights`: EXPR + CORE + UDL + OBJECTSCRIPT LOCAL
  - `injections`: CORE + UDL + OBJECTSCRIPT LOCAL
  - `indents`: CORE + OBJECTSCRIPT LOCAL
- `objectscript_routine/queries` is composed as:
  - `highlights`: EXPR + CORE + ROUTINE LOCAL
  - `injections`: CORE + ROUTINE LOCAL
  - `indents`: CORE + ROUTINE LOCAL
- `studio-highlights.scm` files are excluded from sync and maintained manually

Generated files include explicit section markers:

```scheme
; === BEGIN EXPR ===
...
; === END EXPR ===
; === BEGIN LOCAL ===
...
; === END LOCAL ===
```

---

## 9. Architecture Decisions

### ADR-1: Five-Grammar Topology

**Context**: ObjectScript expressions, routine code, and class definitions have different use cases.

**Decision**: Split into expr → core with two inheritance paths:
- expr → core → objectscript_udl → objectscript
- expr → core → objectscript_routine

**Consequences**: 
- (+) expr can be injected into SQL extensions independently
- (+) core can be used for routine files without UDL overhead
- (+) objectscript_udl remains strict for `.cls` while objectscript supports playground snippets
- (+) objectscript_routine provides a dedicated routine-file profile for `.mac/.inc/.int/.rtn`
- (-) Changes to expr require regenerating downstream grammars

### ADR-2: External Scanner for Whitespace

**Context**: ObjectScript has whitespace-sensitive command parsing.

**Decision**: Use C-based external scanner for whitespace disambiguation.

**Consequences**:
- (+) Accurate parsing of argumentless vs. argument commands
- (+) Efficient tokenization
- (-) Increased complexity; scanner bugs harder to diagnose

### ADR-3: Keyword Fields at Usage Sites

**Context**: Keyword tokens need consistent highlighting.

**Decision**: Attach `keyword` field at statement/structure usage sites.

**Consequences**:
- (+) Single query pattern for all keywords: `keyword: (_) @keyword`
- (+) Cleaner AST without keyword wrapper nodes
- (-) Users of prior grammar versions need to update queries

---

## 10. Quality Requirements

### 10.1 Quality Tree

```
Quality
├── Correctness
│   ├── Full language coverage
│   └── Accurate AST structure
├── Performance
│   ├── Incremental parsing < 1ms
│   └── Full parse < 100ms for typical files
├── Maintainability
│   ├── Modular grammar structure
│   └── Test coverage (185 corpus files)
└── Compatibility
    ├── tree-sitter 0.26+ support (Rust crate floor: 0.26.6)
    └── Multi-platform bindings
```

### 10.2 Quality Scenarios

| Scenario | Stimulus | Response | Measure |
|----------|----------|----------|---------|
| Edit in large file | Single character change | Incremental reparse | < 5ms |
| Open 10KB .cls file | File open event | Full parse complete | < 100ms |
| Grammar update | Change to expr/grammar.js | Regenerate downstream grammars | < 30s build |
| New platform | Add Swift binding | All tests pass | 100% test success |

---

## 11. Risks and Technical Debt

### 11.1 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| IRIS language evolution | Medium | High | Monitor IRIS releases; update grammar |
| tree-sitter breaking changes | Low | Medium | Pin tree-sitter version; test with new releases |
| Injection grammar unavailability | Medium | Low | Document required dependencies |

### 11.2 Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| CSP template support | Future work mentioned in README | Medium |
| Rust staged crate drift | Routine/playground staging scripts do not currently copy `studio-highlights.scm`, even though the staged Rust crates reference it | Medium |
| Full M standard coverage | Some legacy M constructs may be untested | Low |
| Injection query complexity | Long regex patterns hard to maintain | Low |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **AST** | Abstract Syntax Tree; parse result structure |
| **CSP** | Caché Server Pages; HTML template format |
| **expr** | Expression grammar layer |
| **core** | Core routine grammar layer |
| **objectscript** | Playground/sandbox grammar layer |
| **objectscript_udl** | UDL class-file grammar layer |
| **gvn** | Global Variable Name (^name) |
| **IRIS** | InterSystems IRIS Data Platform |
| **lvn** | Local Variable Name |
| **ObjectScript** | InterSystems' programming language |
| **ssvn** | Structured System Variable Name (^$name) |
| **tree-sitter** | Incremental parsing library |
| **udl** | Universal Definition Language; class file format (`objectscript_udl`) |
| **XDATA** | XML Data block in class definitions |

---

## Critical Data Structures

The following data structures are central to the grammar:

1. **`expression`** — Root expression rule; atom + tail chain
2. **`statement`** — Union of all command types in core grammar
3. **`class_definition`** — Top-level UDL structure
4. **`method_definition`** — Method with arguments, return type, body variants

---

## Assumptions

- tree-sitter 0.26+ is the target runtime (Rust crate floor is 0.26.6)
- Editors support tree-sitter's injection query mechanism
- Users install required injection grammars (SQL, HTML, Python, etc.)

## Open Questions

- Should `expr` be published as a standalone npm/crate for SQL extension authors?
- How will the grammar handle future ObjectScript language additions (e.g., new $SYSTEM functions)?

## Evidence

- `expr/grammar.js` — Expression grammar rules
- `core/grammar.js` — Core grammar rules
- `udl/grammar.js` — objectscript_udl grammar rules
- `objectscript/grammar.js` — objectscript playground grammar rules
- `objectscript_routine/grammar.js` — routine-file grammar rules
- `common/scanner.h` — External scanner implementation
- `tree-sitter.json` — Grammar configuration
- `README.md` — Project documentation and usage
- `*/test/corpus/*.txt` — 185 test corpus files
