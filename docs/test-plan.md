# Edge-Case Test Plan: tree-sitter-objectscript

**Scope:** Repository-wide grammar testing  
**Framework:** tree-sitter built-in test runner (`tree-sitter test`)  
**Existing Coverage:** 93 test files across expr/core/udl grammars

---

## Executive Summary

| Area | Existing Tests | Gap Analysis | Risk Level |
|------|---------------|--------------|------------|
| **expr** | 21 files | Missing: edge patterns, unicode | Medium |
| **core** | 54 files | Missing: command combinations, error recovery | Low |
| **udl** | 18 files | Missing: keyword combinations, complex bodies | Medium |
| **scanner** | Implicit | Missing: explicit boundary tests | High |

---

## Scope and Strategy

### Test Levels

| Level | Tool | Focus |
|-------|------|-------|
| Unit | `tree-sitter test` | Individual rule parsing |
| Integration | Custom scripts | Grammar interaction, injections |
| E2E | Editor testing | Real-world file parsing |

### Risk-Based Prioritization

| Priority | Criteria |
|----------|----------|
| **P0** | Scanner edge cases, incremental parsing |
| **P1** | Command combinations, keyword interactions |
| **P2** | Unicode, unusual patterns, error recovery |

---

## Scenario Matrix

### P0: Scanner Edge Cases (Critical)

| ID | Scenario | Test Level | Status | Owner |
|----|----------|------------|--------|-------|
| SC-001 | Single space before argument | Unit | Existing | core/test/corpus/set-statement.txt |
| SC-002 | Double space (argumentless) | Unit | **Gap** | — |
| SC-003 | Tab before argument | Unit | **Gap** | — |
| SC-004 | Mixed whitespace | Unit | **Gap** | — |
| SC-005 | Newline as terminator | Unit | Partial | core/test/corpus/statements.txt |
| SC-006 | Block brace detection | Unit | Partial | core/test/corpus/if-statements.txt |
| SC-007 | Marker buffer at limit (30 chars) | Unit | **Gap** | — |
| SC-008 | Marker buffer overflow | Unit | **Gap** | — |
| SC-009 | Tag at column 0 | Unit | Existing | core/test/corpus/tags.txt |
| SC-010 | Tag not at column 0 | Unit | **Gap** | — |

#### Test Cases for SC-002: Double space argumentless

```
==================
Argumentless QUIT with double space
==================

  QUIT  SET x=1

---

(source_file
  (statements
    (command_quit
      (keyword_quit))
    (command_set
      (keyword_set)
      (set_argument
        (set_target (glvn (lvn (objectscript_identifier))))
        (expression (expr_atom (numeric_literal)))))))

==================
Argumentless IF with double space
==================

  IF  SET x=1

---

(source_file
  (statements
    (command_if
      (keyword_if)
      (command_set ...))))
```

---

### P0: Incremental Parsing

| ID | Scenario | Test Level | Status | Owner |
|----|----------|------------|--------|-------|
| IP-001 | Edit inside method body | Integration | **Gap** | — |
| IP-002 | Edit after embedded SQL marker | Integration | **Gap** | — |
| IP-003 | Edit after HTML marker | Integration | **Gap** | — |
| IP-004 | Add/remove class member | Integration | **Gap** | — |
| IP-005 | State restoration after checkpoint | Integration | **Gap** | — |

---

### P1: Command Combinations

| ID | Scenario | Test Level | Status | Owner |
|----|----------|------------|--------|-------|
| CC-001 | SET with post-conditional | Unit | Existing | core/test/corpus/set-statement.txt |
| CC-002 | IF with embedded SQL | Unit | **Gap** | — |
| CC-003 | FOR with block and old-style | Unit | Existing | core/test/corpus/for-loops.txt |
| CC-004 | Nested IF/FOR blocks | Unit | Partial | — |
| CC-005 | DO with class method chain | Unit | Existing | core/test/corpus/do-statements.txt |
| CC-006 | XECUTE with complex expression | Unit | Partial | core/test/corpus/xecute-statements.txt |
| CC-007 | LOCK with all options | Unit | Existing | core/test/corpus/lock-statements.txt |
| CC-008 | Multiple commands on line | Unit | **Gap** | — |

#### Test Cases for CC-002: IF with embedded SQL

```
==================
IF with embedded SQL in body
==================

  IF x=1 { &sql(SELECT * FROM Table) }

---

(source_file
  (statements
    (command_if
      (keyword_if)
      (expression ...)
      (embedded_sql
        (embedded_sql_amp
          (keyword_embedded_sql_amp)
          (paren_fenced_text))))))
```

---

### P1: Keyword Combinations (UDL)

| ID | Scenario | Test Level | Status | Owner |
|----|----------|------------|--------|-------|
| KW-001 | Method with all keywords | Unit | Partial | udl/test/corpus/class-method.txt |
| KW-002 | Property with complex type | Unit | Existing | udl/test/corpus/properties.txt |
| KW-003 | Conflicting keywords | Unit | **Gap** | — |
| KW-004 | Expression method body | Unit | **Gap** | — |
| KW-005 | External Python method | Unit | **Gap** | — |
| KW-006 | External JavaScript method | Unit | **Gap** | — |
| KW-007 | Call method body | Unit | **Gap** | — |
| KW-008 | Index with all options | Unit | Existing | udl/test/corpus/index.txt |

#### Test Cases for KW-004: Expression method

```
==================
Expression method body
==================

Class Test {
Method Double(x As %Integer) As %Integer [ CodeMode = expression ]
{
x * 2
}
}

---

(source_file
  (class_definition
    (keyword_class)
    (identifier)
    (class_body
      (class_statement
        (method
          (keyword_method)
          (method_definition
            (identifier)
            (arguments ...)
            (return_type ...)
            (expression_method_keywords ...)
            (expression_method_body_content
              (expression ...))))))))
```

---

### P2: Expression Edge Cases

| ID | Scenario | Test Level | Status | Owner |
|----|----------|------------|--------|-------|
| EX-001 | Deep nesting (10+ levels) | Unit | **Gap** | — |
| EX-002 | All binary operators | Unit | Partial | expr/test/corpus/ |
| EX-003 | Pattern expressions | Unit | Partial | — |
| EX-004 | JSON with ObjectScript expressions | Unit | **Gap** | — |
| EX-005 | Indirection chains | Unit | Partial | — |
| EX-006 | Unicode in strings | Unit | **Gap** | — |
| EX-007 | Empty string literal | Unit | Existing | — |
| EX-008 | Numeric edge values | Unit | **Gap** | — |

#### Test Cases for EX-006: Unicode in strings

```
==================
Unicode in string literal
==================

SET x = "Hello 世界 🌍"

---

(source_file
  (statements
    (command_set
      (keyword_set)
      (set_argument
        (set_target (glvn (lvn (objectscript_identifier))))
        (expression (expr_atom (string_literal)))))))
```

---

### P2: Error Recovery

| ID | Scenario | Test Level | Status | Owner |
|----|----------|------------|--------|-------|
| ER-001 | Missing closing brace | Unit | **Gap** | — |
| ER-002 | Invalid keyword | Unit | **Gap** | — |
| ER-003 | Incomplete expression | Unit | **Gap** | — |
| ER-004 | Mismatched parentheses | Unit | **Gap** | — |
| ER-005 | Invalid command syntax | Unit | **Gap** | — |

---

## Existing Test Coverage

### expr Grammar (21 files)
- ✅ Basic expressions, literals
- ✅ System functions ($PIECE, $EXTRACT, etc.)
- ✅ Object references
- ⚠️ Pattern expressions (partial)
- ❌ Unicode, edge numeric values

### core Grammar (54 files)
- ✅ All major commands
- ✅ Control flow (IF, FOR, WHILE)
- ✅ Embedded SQL, HTML, JS
- ⚠️ Command combinations (partial)
- ❌ Error recovery

### udl Grammar (18 files)
- ✅ Class structure
- ✅ Methods, properties, parameters
- ✅ Index, XData, storage
- ⚠️ Method body variants (partial)
- ❌ Keyword combinations

---

## Execution Strategy

### Phase 1: P0 Scanner Tests (Recommended First)

1. Create `core/test/corpus/scanner-edge-cases.txt`
2. Add tests for SC-002 through SC-010
3. Run `cd core && tree-sitter test -f scanner`
4. Verify incremental parsing manually

### Phase 2: P1 Command/Keyword Tests

1. Create `core/test/corpus/command-combinations.txt`
2. Create `udl/test/corpus/method-body-variants.txt`
3. Run full test suite
4. Document any conflicts or ambiguities

### Phase 3: P2 Edge Cases

1. Create `expr/test/corpus/edge-expressions.txt`
2. Create `*/test/corpus/error-recovery.txt`
3. Test unicode and encoding issues

---

## Test File Template

```
==================
<Test Name>
==================

<ObjectScript Source Code>

---

<Expected S-Expression Tree>

==================
<Another Test Name>
==================

...
```

---

## Validation Criteria

| Criterion | Threshold |
|-----------|-----------|
| All corpus tests pass | 100% |
| No new conflicts introduced | 0 new |
| Incremental parse produces same tree | Exact match |
| Error recovery produces partial tree | Non-empty |

---

## Assumptions

1. tree-sitter test runner is available (`tree-sitter test`)
2. Expected trees are manually verified against ObjectScript spec
3. Error recovery tests accept ERROR nodes in output

## Open Questions

1. Should error recovery tests have separate corpus files?
2. How to test incremental parsing systematically?
3. Should unicode tests be in separate files?

## Residual Risks

| Risk | Mitigation |
|------|------------|
| Scanner state bugs | Add explicit serialization tests |
| Marker overflow | Increase limit or add validation |
| Editor-specific issues | Test on all target editors |

---

## Evidence

- `core/test/corpus/` — 54 existing test files
- `expr/test/corpus/` — 21 existing test files
- `udl/test/corpus/` — 18 existing test files
- `common/scanner.h:37` — Marker buffer limit
- `core/grammar.js:117-123` — Declared conflicts

---

## Execution Status

**Status:** Plan created, pending user approval for execution.

Do you want me to execute this test plan by creating the test files for the identified gaps?
