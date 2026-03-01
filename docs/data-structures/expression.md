# Data Structure: expression

## Overview

The `expression` rule is the root construct for all ObjectScript expressions. It represents any value-producing construct in the language, from simple literals to complex chained method calls.

## Definition

**Location**: `expr/grammar.js:36-42`

```javascript
expression: ($) =>
    prec.left(
        seq(
            $.expr_atom,
            repeat($.expr_tail),
        ),
    ),
```

## Structure

### AST Shape

```
(expression
  (expr_atom ...)          ; Required: one atomic expression
  (expr_tail ...)*         ; Optional: zero or more binary operations
)
```

### Components

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expr_atom` | node | Yes | The leading atomic expression |
| `expr_tail` | node[] | No | Zero or more binary operator + expression pairs |

### expr_atom Choices

The `expr_atom` rule is a `choice()` of:

- `json_object_literal` — `{"key": value}`
- `parenthetical_expression` — `(expression)`
- `unary_expression` — `+expr`, `-expr`, `'expr`, `@var`
- `macro` — `$$$MacroName`, `$$$MacroFunc(args)`
- `string_literal` — `"text"`
- `numeric_literal` — `123`, `3.14`, `1E10`
- `json_array_literal` — `[1, 2, 3]`
- `lvn` — local variable `x`, `arr(1,2)`
- `gvn` — global variable `^name`, `^|ns|name(sub)`
- `ssvn` — structured system variable `^$LOCK`, `^$JOB`
- `instance_variable` — `i%prop`, `r%prop`, `m%prop`
- `sql_field_reference` — `{field}`, `{field*O}`
- `system_defined_variable` — `$HOROLOG`, `$JOB`, `$NAMESPACE`
- `system_defined_function` — `$PIECE()`, `$LIST()`, `$GET()`
- `extrinsic_function` — `$$label^routine(args)`
- `relative_dot_property` — `..PropertyName`
- `relative_dot_method` — `..MethodName(args)`
- `relative_dot_parameter` — `..#ParamName`
- `oref_chain_expr` — `oref.prop.method().#Param`
- `class_method_call` — `##class(Pkg.Class).Method(args)`
- `class_parameter_ref` — `##class(Pkg.Class).#Param`
- `superclass_method_call` — `##super(args)`

**Evidence**: `expr/grammar.js:44-75`

### expr_tail Structure

```javascript
expr_tail: ($) =>
    prec.left(
        1,
        choice(
            seq(
                $.binary_operator,
                $.expression,
            ),
            $.pattern_operator,
        ),
    ),
```

**Evidence**: `expr/grammar.js:77-89`

## Lifecycle

| Phase | Description |
|-------|-------------|
| Parse | tree-sitter matches source text against `expression` rule |
| AST Creation | `expression` node created with children |
| Query | Highlight queries traverse expression for captures |
| Injection | Not applicable (expressions don't trigger injection) |

## Invariants

1. An `expression` always contains exactly one `expr_atom`
2. Binary operators are left-associative (all have equal precedence)
3. Pattern operators (`?`, `'?`) can only appear in `expr_tail`
4. Expressions are recursive: `expr_tail` contains another `expression`

## Usage Patterns

### In Statements

```objectscript
SET x = expression
WRITE expression
IF expression { }
```

### As Arguments

```objectscript
$PIECE(expression, expression, expression)
##class(Pkg.Class).Method(expression, expression)
```

### In Subscripts

```objectscript
arr(expression, expression)
^global(expression)
```

## Constraints

- No side effects at parse time (side effects occur at runtime)
- No type information (ObjectScript is dynamically typed)
- Whitespace between tokens is allowed (handled by tree-sitter)

## Update Paths

| Operation | Location | Notes |
|-----------|----------|-------|
| Add new expr_atom | `expr/grammar.js:44-75` | Add to `choice()` in `expr_atom` |
| Add new operator | `expr/grammar.js:99-130` | Add to `binary_operator` rule |
| Modify precedence | `expr/grammar.js:23-28` | Update `precedences` array |

## Related Structures

- `statement` (core) — Contains expressions as arguments
- `method_arg` (expr) — Expression used as method argument
- `set_argument` (core) — Expression on RHS of SET command

## Assumptions

- All ObjectScript binary operators have equal precedence
- Unary operators bind tighter than binary operators
- Pattern expressions are not nested

## Open Questions

- Should `expression` capture the full text range for error reporting?
- How to handle malformed expressions gracefully for editor tolerance?

## Evidence

- `expr/grammar.js:36-42` — `expression` rule definition
- `expr/grammar.js:44-75` — `expr_atom` choices
- `expr/grammar.js:77-89` — `expr_tail` definition
- `expr/grammar.js:99-130` — `binary_operator` definition
