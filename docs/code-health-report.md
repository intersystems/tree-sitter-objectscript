# Code Health Report - tree-sitter-objectscript

## Executive Summary

| Metric | Status | Details |
|--------|--------|---------|
| **Overall Health** | Good | Well-structured, maintainable codebase |
| **Technical Debt** | Medium | Main sharp edge is staged Rust routine/playground packaging drifting from the Rust template includes |
| **Test Coverage** | Good | 185 corpus test files across 5 grammar corpus directories (109 source-corpus files before playground sync) |
| **Documentation** | Good | Top-level and architecture docs now reflect the current five-grammar layout and query sync behavior |
| **Code Quality** | Good | Consistent patterns, type annotations |

---

## Findings by Severity

### Critical Issues

*None identified.*

---

### High Priority

#### H1: Staged Rust routine/playground crates omit `studio-highlights.scm`

**Location**:
- `bindings/rust-routine/lib.rs`
- `bindings/rust-playground/lib.rs`
- `scripts/rust_routine_crate.sh`
- `scripts/rust_playground_crate.sh`

**Evidence**:
```text
bindings/rust-routine/lib.rs      -> include_str!("objectscript_routine/queries/studio-highlights.scm")
bindings/rust-playground/lib.rs   -> include_str!("objectscript/queries/studio-highlights.scm")
scripts/rust_routine_crate.sh     -> copies highlights.scm, indents.scm, injections.scm only
scripts/rust_playground_crate.sh  -> copies highlights.scm, indents.scm, injections.scm only
```

**Impact**: A staged `cargo build`, `cargo package`, or `cargo publish` for the
routine/playground crates fails unless `studio-highlights.scm` is copied into
the staged query directory manually. Contributors can hit this even though the
root UDL Rust crate builds and tests cleanly.

**Suggested Fix**: Keep the staging scripts in sync with the Rust templates by
copying `studio-highlights.scm`, or stop exporting `STUDIO_HIGHLIGHTS_QUERY`
from the staged crates until the staged package contents include it.

**Validation**: Stage each crate, copy `studio-highlights.scm`, and run
`cargo build --manifest-path .../Cargo.toml`.

---

### Medium Priority

#### M1: Duplicated `repeat_with_commas` Utility

**Location**: 
- `expr/grammar.js:14-17`
- `core/utils.js:47`
- `udl/grammar.js:19-22`
- `common/keywords.js:15-17`

**Evidence**:
```javascript
// In expr/grammar.js
const repeat_with_commas = function (rule) {
    return seq(rule, repeat(seq(',', rule)));
};

// Same function defined in 4 locations
```

**Impact**: Maintenance burden; changes must be made in multiple places.

**Suggested Fix**: Move to `common/utils.js` and import in all grammars.

**Validation**: Verify all grammars still generate correctly after refactoring.

---

#### M2: Large File Size - `core/grammar.js`

**Location**: `core/grammar.js` (1,692 lines)

**Evidence**: File contains 50+ command definitions, each with complex argument handling.

**Impact**: Difficult to navigate; higher cognitive load for contributors.

**Suggested Fix**: Consider splitting into:
- `core/commands-data.js` (SET, KILL, MERGE, NEW)
- `core/commands-control.js` (IF, FOR, WHILE, DO)
- `core/commands-io.js` (READ, WRITE, OPEN, CLOSE, USE)
- `core/commands-misc.js` (remaining commands)

**Validation**: Ensure grammar generation still works after restructuring.

---

#### M3: Large File Size - `common/keywords.js`

**Location**: `common/keywords.js` (932 lines)

**Evidence**: All keyword definitions in single file.

**Impact**: Difficult to maintain; hard to find specific keyword rules.

**Suggested Fix**: Split by member type:
- `keywords/class-keywords.js`
- `keywords/method-keywords.js`
- `keywords/property-keywords.js`
- `keywords/index-keywords.js`

**Validation**: Ensure all keyword rules still resolve correctly.

---

#### M4: ESLint Disabled Rules

**Location**: Multiple files

**Evidence**:
```javascript
// Found in: core/grammar.js, udl/grammar.js, common/keywords.js
/* eslint-disable indent */
```

**Impact**: Inconsistent code style; potential for style drift.

**Suggested Fix**: Configure ESLint to allow tree-sitter DSL patterns instead of disabling rules entirely. Keep flat config in `eslint.config.mjs` with grammar-specific overrides.

**Validation**: Run `npm run lint` after configuration.

---

#### M5: Hardcoded Exclusion List in `utils.js`

**Location**: `core/utils.js:52-55`

**Evidence**:
```javascript
const EXCLUDED_RULE_1 = 'method_args';
const EXCLUDED_RULE_2 = 'subscripts';
const EXCLUDED_RULE_3 = '_parenthetical_expression';
const EXCLUDED_RULE_4 = 'system_defined_function';
```

**Impact**: Magic constants; purpose not immediately clear to contributors.

**Suggested Fix**: Document why these rules are excluded (infinite recursion prevention) and consider passing as configuration.

**Validation**: Add JSDoc comment explaining the exclusion reasons.

---

### Low Priority

#### L1: Inconsistent Comment Style

**Location**: Various files

**Evidence**:
- Some comments use `//` style
- Some use `/* */` blocks
- Reference links inconsistently formatted

**Impact**: Minor readability issue.

**Suggested Fix**: Standardize on `//` for single-line, `/** */` for JSDoc, `/* */` for blocks.

---

#### L2: Stale Regeneration Note in `common/keywords.js`

**Location**: `common/keywords.js:3`

**Evidence**:
```javascript
// NOTE: A file somewhat resembling this can be regenerated in by invoking the appropriate file in scripts/
```

**Impact**: Contributors may spend time searching for a non-existent regeneration script.

**Suggested Fix**: Update or remove this note, and point to an existing script if regeneration is reintroduced.

---

## Outdated Comments

| Location | Comment | Action |
|----------|---------|--------|
| `core/grammar.js:444-447` | TODO for unimplemented directives | Keep - still valid |
| `common/keywords.js:3` | "NOTE: A file somewhat resembling this can be regenerated" | Update or remove if script no longer exists |

---

## Code Duplication Analysis

| Pattern | Locations | LOC | Action |
|---------|-----------|-----|--------|
| `repeat_with_commas()` | 4 files | 12 | Extract to common |
| Keyword `seq(optional($.keyword_not), /Pattern/i)` | 20+ rules | ~60 | Consider helper function |
| `alias($.expression, $.rhs)` pattern | 50+ rules | ~150 | Document as standard pattern |

---

## Test Coverage Analysis

| Grammar | Test Files | Estimated Rules Covered | Gap |
|---------|------------|------------------------|-----|
| expr | 30 | ~80% of expression rules | Pattern edge cases |
| core | 57 | ~70% of command rules | I/O commands, ZBREAK variants |
| udl | 18 | ~60% of UDL rules | Keyword combinations |
| objectscript_routine | 3 | ~50% of routine-file rules | Header/comment edge cases |
| objectscript (playground) | 77 | Broad integration coverage | Sync drift if hook is bypassed |

### Suggested Additional Tests

1. **expr**: Add tests for edge cases in `gvn` namespace syntax (`^|ns,db|var`)
2. **core**: Add tests for OPEN/CLOSE/USE parameter combinations
3. **udl**: Add tests for complex keyword combinations on methods/properties

---

## Architecture Recommendations

### Short-term (1-2 weeks)

1. Remove duplicate `repeat_with_commas` definitions
2. Update/remove stale regeneration note in `common/keywords.js`
3. Add targeted comments where scanner behavior is not obvious

### Medium-term (1-2 months)

1. Implement high-priority preprocessor directives (`##expression`, `##function`)
2. Consider splitting large files for maintainability
3. Configure ESLint properly for tree-sitter DSL

### Long-term (3-6 months)

1. Implement CSP template grammar (HTML + ObjectScript injection)
2. Add fuzzing/property-based tests for robustness
3. Consider publishing `expr` as standalone package for SQL extension use

---

## Positive Findings

### Strengths

1. **Well-layered architecture**: expr → core with two downstream paths (udl/playground and routine) is clean and enables reuse
2. **Comprehensive keyword handling**: UDL keywords are exhaustively defined
3. **Good test coverage**: 185 corpus tests provide confidence in parsing accuracy
4. **Consistent patterns**: Command builder functions reduce duplication
5. **Type annotations**: JSDoc types improve IDE support
6. **External scanner**: Complex tokenization handled efficiently in C

### Best Practices Observed

- Conventional Commits for change tracking
- MIT license for broad compatibility
- Multiple language bindings for ecosystem reach
- Playground support for testing
- Editor integration documentation

---

## Metrics Summary

| Metric | Value | Assessment |
|--------|-------|------------|
| Total Grammar LOC | 3,401 | Reasonable for language complexity |
| Scanner LOC (C) | 1,009 | Acceptable |
| Test Files | 185 | Good coverage |
| Language Bindings | 6 | Excellent portability |
| TODO Comments | 1 | Low debt indicator |
| ESLint Disables | 7 | Low-Moderate - consider cleanup |

---

## Assumptions

- ESLint rules disabled intentionally for tree-sitter DSL compatibility
- Unimplemented preprocessor directives are rarely used in practice
- File sizes are acceptable given language complexity

## Open Questions

1. Are the unimplemented preprocessor directives used in real codebases?
2. Should large files be split, or is single-file navigation preferred?
3. Is there a script to regenerate `common/keywords.js` as the comment suggests?

## Evidence

- `bindings/rust-routine/lib.rs` and `bindings/rust-playground/lib.rs` — staged crates include `STUDIO_HIGHLIGHTS_QUERY`
- `scripts/rust_routine_crate.sh` and `scripts/rust_playground_crate.sh` — staging helpers omit `studio-highlights.scm`
- `core/grammar.js:444-447` — TODO for unimplemented directives
- `expr/grammar.js:15`, `core/utils.js:47`, `udl/grammar.js:22`, `common/keywords.js:15` — Duplicated `repeat_with_commas` utility
- `core/utils.js:52-55` — Hardcoded exclusion list
- `find expr/test/corpus core/test/corpus udl/test/corpus objectscript_routine/test/corpus objectscript/test/corpus -type f -name '*.txt' | wc -l` — 185 corpus files across grammar directories
- File line counts from `wc -l` command
