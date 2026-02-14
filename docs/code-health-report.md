# Code Health Report: tree-sitter-objectscript

**Date:** Generated from current codebase analysis  
**Scope:** Grammar files, scanner, keywords, utilities  
**Lines of Code:** ~5,300 lines across core grammar files

---

## Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Missing Features | 8 | Medium |
| Code Complexity | 4 | Low |
| Consistency Issues | 3 | Low |
| Documentation Gaps | 5 | Low |
| Potential Bugs | 2 | Medium |

**Overall Health:** Good ✅  
The codebase is well-structured with clear separation of concerns. Main areas for improvement are completing unimplemented features and reducing some grammar conflicts.

---

## Findings

### ❌ Missing Features (Documented)

#### MF-1: Unimplemented Preprocessor Directives
**Severity:** Medium  
**Location:** `core/grammar.js:357-360`

```javascript
// TODO: Unimplemented preprocessor directives (lower priority):
// #noshow, #show, #sqlcompile (audit/mode/path/select), #undef,
// ##; ##beginquote/##EndQuote, ##expression, ##function, ##lit,
// ##quote, ##quoteExp, ##sql, ##stripq, ##unique
```

**Impact:** Users with legacy code using these directives will see parse errors.

**Recommendation:** Implement in priority order based on usage frequency. Consider `#undef` and `##expression` as higher priority.

---

### ⚠️ Code Complexity

#### CC-1: Large Scanner File
**Severity:** Low  
**Location:** `common/scanner.h` (839 lines)

**Evidence:** Single file handles 25+ token types with complex state management.

**Impact:** Difficult to maintain and debug. High cognitive load for contributors.

**Recommendation:** Consider splitting into logical sections:
- Whitespace handling
- Marker/fence parsing
- Comment handling
- State management

---

#### CC-2: Grammar Conflicts
**Severity:** Low  
**Location:** `core/grammar.js:117-123`, `udl/grammar.js:31-45`

**Evidence:**
```javascript
// core/grammar.js
conflicts: ($, previous) =>
  previous.concat([
    [$.use_parameters, $._parenthetical_expression],
    [$.open_parameters, $._parenthetical_expression],
    [$.label_ref, $.objectscript_identifier],
    [$.xecute_argument, $._parenthetical_expression],
  ]),

// udl/grammar.js
conflicts: ($, previous) =>
  previous.concat([
    [$.method_keywords, $.expression_method_keywords, $.external_method_keywords, $.call_method_keywords],
    [$.xdata_keywords, $.xdata_keywords_any],
    [$.trigger_keywords, $.external_trigger_keywords],
  ]),
```

**Impact:** GLR parsing required for ambiguous constructs. Potential performance impact on large files.

**Recommendation:** Review if conflicts can be resolved with precedence rules or grammar restructuring.

---

#### CC-3: Precedence Complexity
**Severity:** Low  
**Location:** `expr/grammar.js:22-28`

**Evidence:** 32 uses of `prec`, `prec.left`, `prec.right` across grammar files.

**Impact:** Precedence rules are implicit knowledge. May cause unexpected parse behavior.

**Recommendation:** Document precedence rationale inline. Consider explicit precedence table in docs.

---

#### CC-4: Keyword File Size
**Severity:** Low  
**Location:** `udl/keywords.js` (949 lines)

**Evidence:** Single file with all UDL keywords, many with similar patterns.

**Impact:** Difficult to find specific keyword rules. Repetitive code patterns.

**Recommendation:** Consider generating keyword rules from a data structure or splitting by member type.

---

### 🔄 Consistency Issues

#### CI-1: Mixed Comment Styles
**Severity:** Low  
**Location:** Various grammar files

**Evidence:**
```javascript
// Some comments use //
/* Others use block comments */
/// Some use triple-slash (JSDoc-style)
```

**Impact:** Minor readability impact. No functional issue.

**Recommendation:** Standardize on `//` for inline, `/* */` for blocks, JSDoc for documentation.

---

#### CI-2: Inconsistent Keyword Casing
**Severity:** Low  
**Location:** `core/grammar.js`, `udl/grammar.js`

**Evidence:**
```javascript
keyword_set: (_) => /[sS]([eE][tT])?/,    // Manual case alternation
keyword_open: (_) => /O(pen)?/i,          // Using /i flag
keyword_halt: (_) => /Halt/i,             // Using /i flag
```

**Impact:** Inconsistent patterns. Manual alternation is error-prone.

**Recommendation:** Standardize on `/i` flag for all case-insensitive keywords.

---

#### CI-3: Field Naming Inconsistency
**Severity:** Low  
**Location:** Various grammar files

**Evidence:**
```javascript
field('command_name', ...)     // Some use command_name
field('builtin_keyword', ...)  // Others use builtin_keyword
field('keyword', ...)          // Others use just keyword
```

**Impact:** Query patterns must handle multiple field names for similar concepts.

**Recommendation:** Standardize field names across grammar. Consider `keyword` for all keywords.

---

### 📝 Documentation Gaps

#### DG-1: Scanner State Machine Undocumented
**Severity:** Low  
**Location:** `common/scanner.h`

**Evidence:** Complex state transitions without documentation.

**Recommendation:** Add state diagram or transition table in comments.

---

#### DG-2: Precedence Rationale Missing
**Severity:** Low  
**Location:** `expr/grammar.js:22-28`

**Evidence:** Precedence rules without explanation of why they exist.

**Recommendation:** Add inline comments explaining each precedence rule.

---

#### DG-3: Conflict Rationale Missing
**Severity:** Low  
**Location:** `core/grammar.js:117-123`

**Evidence:** Conflicts declared without explanation of ambiguity.

**Recommendation:** Document what constructs cause each conflict.

---

#### DG-4: External Scanner API Undocumented
**Severity:** Low  
**Location:** `common/scanner.h`

**Evidence:** Tree-sitter external scanner functions without documentation.

**Recommendation:** Add JSDoc-style comments for scanner API functions.

---

#### DG-5: Test Coverage Documentation Missing
**Severity:** Low  
**Location:** `*/test/corpus/`

**Evidence:** Test files exist but no coverage report or gap analysis.

**Recommendation:** Add test coverage tracking. Document untested constructs.

---

### 🐛 Potential Bugs

#### PB-1: Scanner State Serialization
**Severity:** Medium  
**Location:** `common/scanner.h:38-47`

**Evidence:** Scanner state includes multiple buffers that must be serialized/deserialized for incremental parsing.

```c
struct ObjectScript_Core_Scanner {
  int32_t marker_buffer[MARKER_BUFFER_MAX_LEN];
  int marker_buffer_len;
  bool terminated_newline;
  int32_t html_marker_buffer[MARKER_BUFFER_MAX_LEN];
  // ...
};
```

**Risk:** If serialization is incomplete, incremental parsing may produce incorrect results.

**Recommendation:** Verify serialization covers all state. Add test for incremental parse after marker.

---

#### PB-2: Marker Buffer Overflow
**Severity:** Medium  
**Location:** `common/scanner.h:37`

**Evidence:**
```c
#define MARKER_BUFFER_MAX_LEN 30
```

Markers longer than 30 characters will cause issues:
```c
if (scanner->html_marker_buffer_len == MARKER_BUFFER_MAX_LEN) {
  return false; // too long
}
```

**Risk:** Users with long custom markers (e.g., `&sqlVERYLONGMARKERNAME(...)`) will fail silently.

**Recommendation:** Either increase buffer size or provide clear error. Consider dynamic allocation.

---

## Outdated Comments

| Location | Issue | Recommendation |
|----------|-------|----------------|
| `common/scanner.h:17-35` | `token_names` array doesn't match enum | Update or remove |
| `core/grammar.js:357` | TODO with old syntax | Update or implement |

---

## Technical Debt Summary

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| Implement missing preprocessor directives | High | Medium | P2 |
| Split scanner into modules | Medium | Low | P3 |
| Standardize keyword casing | Low | Low | P3 |
| Document scanner state machine | Medium | Medium | P2 |
| Add conflict explanations | Low | Low | P3 |
| Verify scanner serialization | Medium | High | P1 |

---

## Recommendations

### Immediate (P0)
- None critical

### Short-term (P1)
1. Verify scanner state serialization completeness
2. Add incremental parsing tests for marker scenarios

### Medium-term (P2)
1. Implement `#undef` and `##expression` preprocessor directives
2. Document scanner state machine
3. Increase marker buffer size or add dynamic allocation

### Long-term (P3)
1. Standardize keyword patterns to use `/i` flag
2. Standardize field names across grammars
3. Split scanner into logical modules
4. Add test coverage tracking

---

## Evidence

- `core/grammar.js:357-360` — TODO comment for missing directives
- `common/scanner.h:38-47` — Scanner state structure
- `common/scanner.h:37` — Marker buffer limit
- `core/grammar.js:117-123` — Conflict declarations
- `udl/keywords.js:1-949` — Keyword definitions
- `expr/grammar.js:22-28` — Precedence rules

---

## Assumptions

1. Incremental parsing is a key use case requiring correct serialization
2. Most users don't use markers longer than 30 characters
3. Performance impact of GLR conflicts is acceptable

## Open Questions

1. What is the actual frequency of long markers in production code?
2. Are all scanner state fields actually needed?
3. Should conflicts be tracked as technical debt metrics?
