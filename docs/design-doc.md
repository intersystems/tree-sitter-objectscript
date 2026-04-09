# Design Document - tree-sitter-objectscript

> Update note (2026): The implemented system uses five grammar targets, including `objectscript_routine` as a branch from `core`. Operational workflows and hook behavior were expanded (corpus sync, query sync, lint auto-fix, parser/query checks). Query sync now only manages the canonical `highlights.scm`, `indents.scm`, and `injections.scm` files; `studio-highlights.scm` remains manual. Refer to `README.md` and `CONTRIBUTING.md` for current procedures.

## Metadata

| Field | Value |
|-------|-------|
| **Title** | tree-sitter-objectscript: Parser Architecture |
| **Authors** | Dave McCaldon, Hannah Kimura |
| **Status** | Implemented |
| **Created** | 2023 |
| **Updated** | 2026 |

---

## Problem Statement

### Background

InterSystems ObjectScript is the core programming language for the InterSystems IRIS Data Platform. Developers need modern editor support including:

- Real-time syntax highlighting
- Structural code navigation
- Code analysis and refactoring tools
- Language server protocol (LSP) integration

Traditional regex-based highlighters are insufficient because:

1. ObjectScript has **whitespace-sensitive command parsing** (single space vs. double space changes meaning)
2. ObjectScript files are **polyglot** — `.cls` files contain embedded SQL, HTML, XML, Python, and JavaScript
3. The **UDL class syntax** requires understanding nested structures (class → method → statements → expressions)

### Problem

There was no accurate, performant, incrementally-updatable parser for ObjectScript that could:

1. Handle the full language including UDL class definitions
2. Support real-time editing with sub-millisecond incremental updates
3. Enable language injection for embedded languages
4. Provide a standardized API for multiple editors and tools

---

## Goals and Non-Goals

### Goals

1. **Complete ObjectScript parsing**: Support expressions, routine syntax, and UDL class definitions
2. **Editor integration**: Work with Zed, Neovim, Emacs, and future editors
3. **Incremental parsing**: Sub-millisecond updates for responsive editing
4. **Language injection**: Accurate highlighting for embedded SQL, HTML, Python, JavaScript, etc.
5. **Multi-platform bindings**: Rust, Python, Node.js, Go, Swift, C
6. **Maintainable structure**: Modular grammar layers that can evolve independently

### Non-Goals

1. **Semantic analysis**: No type checking, reference resolution, or compile-time validation
2. **Code generation**: No ObjectScript-to-bytecode or ObjectScript-to-any-target compilation
3. **Full LSP server**: This is a parser only; LSP features require additional tooling
4. **Runtime execution**: No ObjectScript interpreter or REPL

---

## Proposal

### High-Level Design

Implement a **five-target grammar architecture** using tree-sitter:

```
expr -> core -> objectscript_udl -> objectscript
expr -> core -> objectscript_routine
```

Each target is a complete tree-sitter grammar. `objectscript` is the playground profile, `objectscript_udl` remains the class-file profile, and `objectscript_routine` is the routine-file profile.

### Detailed Design

#### 1. Expression Grammar (expr)

**Scope**: ObjectScript expressions that can appear anywhere a value is expected.

**Key constructs**:

| Category | Examples |
|----------|----------|
| Literals | `"string"`, `123.45`, `{"key":"value"}`, `[1,2,3]` |
| Variables | `x`, `^global(1)`, `^$LOCK`, `i%property` |
| Operators | `+`, `-`, `_` (concat), `=`, `<`, `>`, `&`, `!`, `?` (pattern) |
| Functions | `$PIECE()`, `$LIST()`, `$ZDATE()`, `$SYSTEM.X.Y()` |
| Classes | `##class(Pkg.Class).Method()`, `##class().#Param` |
| Macros | `$$$MacroConst`, `$$$MacroFunc(args)` |

**Design decisions**:

- `expression` = `expr_atom` followed by zero or more `expr_tail` (binary op + expression)
- All ObjectScript operators have equal precedence (left-associative)
- Pattern expressions (`?1N.A`) use a single regex token for efficiency

**Evidence**: `expr/grammar.js` defines the core expression structure.

#### 2. Core Grammar (core)

**Scope**: ObjectScript routine syntax — commands, control flow, embedded languages.

**Key constructs**:

| Category | Commands/Constructs |
|----------|---------------------|
| Data | `SET`, `KILL`, `MERGE`, `NEW` |
| Control | `IF`, `FOR`, `WHILE`, `DO`, `QUIT`, `RETURN`, `GOTO` |
| I/O | `READ`, `WRITE`, `OPEN`, `CLOSE`, `USE` |
| Transaction | `TSTART`, `TCOMMIT`, `TROLLBACK` |
| Embedded | `&sql()`, `&html<>`, `&xml<>`, `&js<>` |
| Preprocessor | `#define`, `#if`, `#include`, `#import` |
| Labels | `label`, `label(params)`, procedures |

**Design decisions**:

- **External scanner** for whitespace-sensitive tokenization
- **Post-conditional support** via `unspace()` utility generating `_post_cond` rule variants
- **Block and old-style syntax** both supported (`IF cond { } ELSE { }` and `IF cond command`)
- **Keyword field placement** at usage sites: `field('keyword', $.keyword_set)`

**Evidence**: `core/grammar.js` defines the command builder functions.

#### 3. UDL Grammar (objectscript_udl)

**Scope**: ObjectScript class definitions in `.cls` files.

**Key constructs**:

| Category | Constructs |
|----------|------------|
| Class | `Class pkg.Name Extends Super [ Keywords ] { ... }` |
| Methods | `Method Name(args) As ReturnType [ Keywords ] { body }` |
| Properties | `Property Name As Type [ Keywords ];` |
| Parameters | `Parameter Name As Type = value;` |
| Queries | `Query Name() As %SQLQuery { SQL code }` |
| Triggers | `Trigger Name [ Keywords ] { body }` |
| XDATA | `XData Name [ MimeType = "..." ] { content }` |
| Storage | `Storage Name { XML content }` |
| Index | `Index Name On (props) [ Keywords ];` |

**Design decisions**:

- **Method body variants**: `_core_method` (ObjectScript), `_expression_method` (single expression), `_external_method` (Python/SQL), `_call_method` (routine call)
- **Keyword definitions** factored into `common/keywords.js` for maintainability
- **External scanner extension** for IRIS username and external method body content

**Evidence**: `udl/grammar.js` defines class structure rules.

#### 4. Routine Grammar (objectscript_routine)

**Scope**: Routine files that begin with a `ROUTINE` header and then continue
with core statements.

**Key constructs**:

| Category | Constructs |
|----------|------------|
| Routine header | `ROUTINE Name [Type=mac|inc|int]` |
| Routine body | Reuses `statement` from `core` after the header |
| Extras | Allows routine documatic lines and routine-specific scanner tokens |

**Design decisions**:

- Keep routine files on the `expr -> core -> objectscript_routine` branch so
  they can reuse the full core statement grammar without UDL class rules
- Accept both headered routine files and statement-only routine snippets at the
  top level
- Share the same scanner with extra routine-specific external tokens

**Evidence**: `objectscript_routine/grammar.js` defines the routine-file entry
point and header rules.

#### 5. Playground Grammar (objectscript)

**Scope**: Mixed/top-level snippet parsing for terminal/agent output and incomplete code fragments.

**Key constructs**:

| Category | Constructs |
|----------|------------|
| Top-level source | `source_file` accepts `class_definition`, `class_statement`, and `statement` |
| Scanner behavior | `column1_statement_mode = true` for tag/statement disambiguation |
| Inheritance | Extends `objectscript_udl` without duplicating full class/routine rules |

**Design decisions**:

- Preserve strict `.cls` parsing in `objectscript_udl`, but permit mixed snippets in `objectscript`
- Reuse shared scanner with mode flag instead of duplicating scanner logic

**Evidence**: `objectscript/grammar.js` and `common/scanner.h` show the scanner mode handling.

#### 6. Shared Components (common)

| Component | Purpose |
|-----------|---------|
| `identifiers.js` | Regex patterns for ObjectScript identifiers |
| `scanner.h` | C external scanner for whitespace, comments, markers |
| `define_grammar.js` | `define_grammar()` helper for grammar extension |

**Evidence**: `common/identifiers.js` defines identifier patterns.

#### 7. Query Files

| Query | Purpose |
|-------|---------|
| `highlights.scm` | Syntax highlighting captures |
| `injections.scm` | Language injection rules |
| `indents.scm` | Auto-indentation rules |

**Design decisions**:

- **Generated layered composition**: `scripts/sync_queries.py` composes layered EXPR/CORE/UDL/LOCAL sections for `core`, `udl`, `objectscript`, and `objectscript_routine` query trees
- **Canonical sync scope only**: `scripts/sync_queries.py` manages `highlights.scm`, `indents.scm`, and `injections.scm`; `studio-highlights.scm` is intentionally excluded from sync and Python copy verification
- **Zed-compatible capture names**: `@keyword`, `@variable`, `@function`, `@type`, etc.
- **MimeType-based injection**: XDATA blocks use MimeType attribute to select injected language
- **Layered playground queries**: `objectscript` query trees are composed from the `expr`, `core`, and `udl` layers plus objectscript-local rules before `tree-sitter.json` points consumers at the composed files

**Evidence**: `udl/queries/injections.scm` defines XDATA injection rules; `tree-sitter.json` defines grammar/query mappings.

---

## Alternatives Considered

### Alternative 1: Single Monolithic Grammar

**Approach**: One grammar.js file containing all ObjectScript syntax.

**Rejected because**:
- Cannot inject expression-only grammar into SQL extensions
- Changes to expressions force full regeneration
- Harder to test components in isolation

### Alternative 2: No External Scanner

**Approach**: Handle whitespace purely in grammar rules.

**Rejected because**:
- tree-sitter's conflict resolution cannot handle command argument detection
- Performance degradation from excessive ambiguity
- Embedded language markers require lookahead beyond grammar capabilities

### Alternative 3: Separate Highlight Queries Per Grammar

**Approach**: No query inheritance; duplicate rules in each grammar's highlights.scm.

**Rejected because**:
- Maintenance burden: changes need updates across multiple layers
- Inconsistency risk between layers
- tree-sitter's inheritance mechanism already solves this

---

## Tradeoffs

### Layered Grammars

| Benefit | Cost |
|---------|------|
| Reusable expr grammar for SQL dialects | Build complexity (five grammar targets) |
| Independent testing of each layer | Regeneration cascade on base changes |
| Clear separation of concerns | Learning curve for contributors |

### External Scanner

| Benefit | Cost |
|---------|------|
| Accurate whitespace handling | C code maintenance |
| Fast tokenization | Debugging difficulty |
| Context-aware markers | Platform-specific builds |

### Keyword Field Placement

| Benefit | Cost |
|---------|------|
| Single query pattern for all keywords | Breaking change from prior grammar |
| Cleaner AST structure | User migration required |
| Consistent highlighting | Documentation updates needed |

---

## Implementation Plan

### Phase 1: Core Expression Parsing

- [x] Implement expr grammar with all expression constructs
- [x] Add tests for literals, operators, variables, functions
- [x] Create expr/queries/highlights.scm

### Phase 2: Routine Syntax

- [x] Implement core grammar extending expr
- [x] Add external scanner for whitespace handling
- [x] Implement all ObjectScript commands
- [x] Add embedded language constructs
- [x] Create core/queries/highlights.scm and injections.scm

### Phase 3: UDL Class Definitions

- [x] Implement udl grammar extending core
- [x] Add class, method, property, parameter rules
- [x] Add query, trigger, XDATA, storage rules
- [x] Create udl/queries/highlights.scm and injections.scm
- [x] Factor keywords into common/keywords.js

### Phase 4: Playground Grammar

- [x] Implement `objectscript` grammar extending `objectscript_udl`
- [x] Enable top-level mixed source parsing for snippets
- [x] Add scanner mode flag (`column1_statement_mode`) and playground scanner wiring
- [x] Add full `objectscript/test/corpus` suite

### Phase 5: Language Bindings

- [x] Rust binding (Cargo crate)
- [x] Python binding (pip wheel)
- [x] Node.js binding (npm package)
- [x] Go binding (Go module)
- [x] Swift binding (Swift package)
- [x] C binding (headers and library)
- [x] Expose `objectscript`, `objectscript_udl`, and `objectscript_routine` entry points across bindings (plus `core`/`expr` where supported)
- [x] Rust crates expose current constants:
  - `tree-sitter-objectscript`: `LANGUAGE_OBJECTSCRIPT_UDL`
  - `tree-sitter-objectscript-routine`: `LANGUAGE_OBJECTSCRIPT_ROUTINE`
  - `tree-sitter-objectscript-playground`: `LANGUAGE_OBJECTSCRIPT`

### Phase 6: Editor Integrations

- [x] Zed extension (published)
- [x] nvim-treesitter integration
- [x] Emacs major mode

### Phase 7: Ongoing Maintenance

- [x] Add repository-managed pre-commit automation for corpus/query synchronization and staging of generated outputs
- [x] Add CI workflow to verify Python query copies match source query trees
- [x] Switch JavaScript lint installs to deterministic `npm ci` using committed `package-lock.json`
- [x] Migrate ESLint configuration to flat config (`eslint.config.mjs`)
- [ ] CSP template grammar (future)
- [ ] IRIS language evolution tracking
- [ ] Community contribution support

---

## Validation

### Testing Strategy

| Level | Method | Coverage |
|-------|--------|----------|
| Unit | tree-sitter corpus tests | corpus coverage across expr/core/objectscript_udl/objectscript/objectscript_routine |
| Integration | Binding tests | Rust, Python, Node, Go, Swift, C |
| E2E | Editor manual testing | Zed, Neovim, Emacs |

### Test Commands

```bash
# Grammar tests
cd objectscript && tree-sitter test
cd expr && tree-sitter test
cd core && tree-sitter test
cd udl && tree-sitter test
cd objectscript_routine && tree-sitter test

# Binding tests
nvm use
npm ci
cargo test --lib --package tree-sitter-objectscript
./scripts/rust_routine_crate.sh stage /tmp/tsroutine
cp objectscript_routine/queries/studio-highlights.scm /tmp/tsroutine/objectscript_routine/queries/
cargo build --manifest-path /tmp/tsroutine/Cargo.toml
./scripts/rust_playground_crate.sh stage /tmp/tsplayground
cp objectscript/queries/studio-highlights.scm /tmp/tsplayground/objectscript/queries/
cargo build --manifest-path /tmp/tsplayground/Cargo.toml
python3 -m pytest bindings/python/tests/      # Python (in venv)
npm test                                       # Node
npm run lint                                   # JavaScript lint
go test ./bindings/go/...                      # Go
swift test                                     # Swift
make test                                      # C

# Query synchronization and verification
make installhooks                              # Install repo pre-commit hook
python3 scripts/sync_queries.py --check-python # Verify Python query copies
```

### Current Validation Targets

- Corpus tests run in all five grammar directories
- Binding checks cover Rust, Python, Node, Go, Swift, and C surfaces
- CI verifies synchronized Python query copies separately from parser/query lint
- Editor integration targets remain Zed, nvim-treesitter, and Emacs

---

## Assumptions

1. **tree-sitter 0.26+** is the target runtime version (Rust crate floor: 0.26.6)
2. **Editors support** tree-sitter's injection query mechanism
3. **Users will install** required injection grammars (SQL, HTML, Python, etc.)
4. **ObjectScript syntax** remains stable in future IRIS releases
5. **MIT license** is acceptable for all downstream use cases

## Open Questions

1. **CSP support**: Should a sixth grammar profile extend HTML with ObjectScript injection?
2. **Standalone expr**: Should expr be published independently for SQL dialect authors?
3. **Version alignment**: How to coordinate grammar versions with IRIS releases?
4. **LSP integration**: Should this project include LSP server hooks?

## Evidence

- `expr/grammar.js` — Expression grammar implementation
- `core/grammar.js` — Core grammar implementation
- `udl/grammar.js` — objectscript_udl grammar implementation
- `objectscript/grammar.js` — objectscript playground grammar implementation
- `objectscript_routine/grammar.js` — objectscript_routine implementation
- `common/scanner.h` — External scanner C implementation
- `common/keywords.js` — shared keyword definitions
- `common/define_grammar.js` — shared grammar extension helper
- `tree-sitter.json` — Multi-grammar configuration
- `.githooks/pre-commit` — local query synchronization hook
- `.github/workflows/sync-queries.yml` — CI verification for Python query parity
- `.github/workflows/lint.yml` — deterministic `npm ci` lint workflow
- `eslint.config.mjs` — ESLint flat configuration
- `package-lock.json` — lockfile for deterministic npm dependency resolution
- `README.md` — Project documentation
- `*/test/corpus/*.txt` — 185 test corpus files
- `bindings/*/` — Language binding implementations
