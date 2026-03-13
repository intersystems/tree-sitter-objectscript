# Code Health Report - tree-sitter-objectscript

## Executive Summary

| Metric | Status | Details |
|--------|--------|---------|
| **Overall Health** | Good | Well-structured, maintainable codebase |
| **Technical Debt** | Low-Medium | Some unimplemented features, minor style issues |
| **Test Coverage** | Good | 168 corpus test files across 4 grammars |
| **Documentation** | Good | Comprehensive README, inline comments |
| **Code Quality** | Good | Consistent patterns, type annotations |

---

## Findings by Severity

### Critical Issues

*None identified.*

---

### High Priority

#### H1: Unimplemented Preprocessor Directives

**Location**: `core/grammar.js:420-423`

**Evidence**:
```javascript
// TODO: Unimplemented preprocessor directives (lower priority):
// #noshow, #show, #sqlcompile (audit/mode/path/select), #undef,
// ##; ##beginquote/##EndQuote, ##expression, ##function, ##lit,
// ##quote, ##quoteExp, ##sql, ##stripq, ##unique
```

**Impact**: Files using these directives may not parse correctly. Users relying on `##expression` or `##function` macros will see parse errors.

**Suggested Fix**: Implement rules for frequently-used directives, prioritizing `##expression`, `##function`, and `#undef`.

**Validation**: Add corpus tests for each new directive.

---

### Medium Priority

#### M1: Duplicated `repeat_with_commas` Utility

**Location**: 
- `expr/grammar.js:14-17`
- `core/grammar.js:17-20` (imported from utils)
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

**Location**: `core/grammar.js` (1,728 lines)

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

**Location**: `common/keywords.js` (947 lines)

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
// Found in: expr/grammar.js, core/grammar.js, udl/grammar.js, common/keywords.js
/* eslint-disable indent */
/* eslint-disable camelcase */
```

**Impact**: Inconsistent code style; potential for style drift.

**Suggested Fix**: Configure ESLint to allow tree-sitter DSL patterns instead of disabling rules entirely. Keep flat config in `eslint.config.mjs` with grammar-specific overrides.

**Validation**: Run `npm run lint` after configuration.

---

#### M5: Hardcoded Exclusion List in `utils.js`

**Location**: `core/utils.js:53-56`

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

#### L2: Duplicate `open_keyword_translate` Entry

**Location**: `core/grammar.js:839`

**Evidence**:
```javascript
open_keywords: ($) =>
    choice(
        // ...
        $.open_keyword_translate,
        $.open_keyword_translate,  // <-- DUPLICATE
        $.open_keyword_xytable,
        // ...
    )
```

**Impact**: No functional impact (tree-sitter deduplicates), but confusing.

**Suggested Fix**: Remove duplicate entry.

**Validation**: Grammar still parses correctly.

---

#### L3: Missing Type Annotations in Some Functions

**Location**: `core/utils.js:53-56`, `common/define_grammar.js`

**Evidence**: Some helper functions lack JSDoc type annotations.

**Impact**: IDE support degraded; potential for type errors.

**Suggested Fix**: Add `@param` and `@return` JSDoc annotations to all exported functions.

---

## Outdated Comments

| Location | Comment | Action |
|----------|---------|--------|
| `core/grammar.js:420-423` | TODO for unimplemented directives | Keep - still valid |
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
| expr | 22 | ~80% of expression rules | Pattern edge cases |
| core | 54 | ~70% of command rules | I/O commands, ZBREAK variants |
| udl | 18 | ~60% of UDL rules | Keyword combinations |

### Suggested Additional Tests

1. **expr**: Add tests for edge cases in `gvn` namespace syntax (`^|ns,db|var`)
2. **core**: Add tests for OPEN/CLOSE/USE parameter combinations
3. **udl**: Add tests for complex keyword combinations on methods/properties

---

## Architecture Recommendations

### Short-term (1-2 weeks)

1. Remove duplicate `repeat_with_commas` definitions
2. Fix duplicate `open_keyword_translate` entry
3. Add JSDoc to undocumented functions

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

1. **Well-layered architecture**: expr → core → udl inheritance is clean and enables reuse
2. **Comprehensive keyword handling**: UDL keywords are exhaustively defined
3. **Good test coverage**: 168 corpus tests provide confidence in parsing accuracy
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
| Total Grammar LOC | ~4,400 | Reasonable for language complexity |
| Scanner LOC (C) | 827 | Acceptable |
| Test Files | 168 | Good coverage |
| Language Bindings | 6 | Excellent portability |
| TODO Comments | 1 | Low debt indicator |
| ESLint Disables | 18 | Moderate - consider cleanup |

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

- `core/grammar.js:420-423` — TODO for unimplemented directives
- `expr/grammar.js:14-17`, `common/keywords.js:15-17` — Duplicated utility functions
- `core/grammar.js:839` — Duplicate `open_keyword_translate`
- `core/utils.js:53-56` — Hardcoded exclusion list
- File line counts from `wc -l` command
