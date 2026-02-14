# Data Structure: method_definition

## Overview

The `method_definition` rule represents the structure of an ObjectScript method (instance or class method) in UDL format. It includes the method name, arguments, return type, keywords, and body.

## Definition

**Location**: `udl/grammar.js:173-179`

```javascript
method_definition: ($) =>
  seq(
    alias($.quote_permitting_identifier, $.method_name),
    $.arguments,
    optional($.return_type),
    choice($._core_method, $._expression_method, $._external_method, $._call_method),
  ),
```

## Structure

### AST Shape

```
(method_definition
  (method_name)                       ; Method identifier
  (arguments                          ; (arg1, arg2, ...)
    (argument)*)?
  (return_type                        ; As ReturnType
    (typename))?
  ; One of:
  (method_keywords)?                  ; [ Keywords ] { ObjectScript body }
  ; OR
  (expression_method_keywords)?       ; [ CodeMode = expression ] { expr }
  ; OR
  (external_method_keywords)?         ; [ Language = python ] { external body }
  ; OR
  (call_method_keywords)?             ; [ CodeMode = call ] { tag^routine }
)
```

### Components

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method_name` | `quote_permitting_identifier` | Yes | Method name (may be quoted) |
| `arguments` | node | Yes | Parenthesized argument list |
| `return_type` | node | No | `As TypeName` clause |
| Body variant | node | Yes | One of four body types |

### Body Variants

#### 1. Core Method (`_core_method`)

Standard ObjectScript body:

```javascript
_core_method: ($) =>
  seq(
    optional($.method_keywords),
    '{',
    repeat($.statement),
    '}',
  ),
```

**Evidence**: `udl/grammar.js:187-193`

#### 2. Expression Method (`_expression_method`)

Single expression body (CodeMode = expression):

```javascript
_expression_method: ($) =>
  seq(
    $.expression_method_keywords,
    '{', 
    alias($.expression, $.expression_method_body_content),
    '}',
  ),
```

**Evidence**: `udl/grammar.js:195-202`

#### 3. External Method (`_external_method`)

External language body (Language = python/tsql/ispl):

```javascript
_external_method: ($) =>
  seq(
    $.external_method_keywords,
    '{',
    $.external_method_body_content,
    '}',
  ),
```

**Evidence**: `udl/grammar.js:204-211`

#### 4. Call Method (`_call_method`)

Routine call body (CodeMode = call):

```javascript
_call_method: ($) =>
  seq(
    $.call_method_keywords,
    '{', 
    $.routine_tag_call,
    '}',
  ),
```

**Evidence**: `udl/grammar.js:181-186`

## Lifecycle

| Phase | Description |
|-------|-------------|
| Parse | UDL grammar matches method structure |
| AST Creation | `method_definition` with appropriate body variant |
| Query | Highlight queries capture method name as `@function` |
| Injection | External bodies trigger language injection (Python, TSQL, ISPL) |

## Arguments Structure

```javascript
arguments: ($) =>
  seq(
    token.immediate('('), 
    optional(seq($.argument, repeat(seq(',', $.argument)))), 
    ')'
  ),

argument: ($) =>
  seq(
    optional(choice(field('keyword', $.keyword_byref), field('keyword', $.keyword_output))),
    $.identifier,
    optional($.return_type),
    optional(seq('=', $.default_argument_value)),
  ),
```

**Evidence**: `udl/grammar.js:217-230`

### Argument Components

| Component | Required | Description |
|-----------|----------|-------------|
| `ByRef`/`Output` | No | Pass-by-reference modifier |
| Identifier | Yes | Argument name |
| Return type | No | `As TypeName` |
| Default value | No | `= value` |

## Invariants

1. Method name is always present
2. Arguments list is always present (may be empty `()`)
3. Exactly one body variant is used
4. Keywords in brackets precede body `{ }`
5. Body is always enclosed in `{ }`

## Usage Patterns

### Instance Method

```objectscript
Method GetName() As %String {
  Return ..Name
}
```

### Class Method

```objectscript
ClassMethod Create(name As %String) As MyClass {
  SET obj = ..%New()
  SET obj.Name = name
  Return obj
}
```

### Method with Keywords

```objectscript
Method Calculate() As %Integer [ Private, Final ] {
  // ...
}
```

### Expression Method

```objectscript
Method IsValid() As %Boolean [ CodeMode = expression ] {
  ..Name '= ""
}
```

### Python Method

```objectscript
Method ProcessData(data As %String) [ Language = python ] {
import json
result = json.loads(data)
return result
}
```

### Call Method

```objectscript
Method DoWork() [ CodeMode = call ] {
Work^MyRoutine
}
```

## Constraints

- Method names can be quoted for special characters: `Method "My Method"()`
- External methods require corresponding Language keyword
- Expression methods must have exactly one expression

## Update Paths

| Operation | Location | Notes |
|-----------|----------|-------|
| Add method keyword | `udl/keywords.js` | Add to `method_keywords` rule |
| Add body variant | `udl/grammar.js:173-179` | Add to `choice()` |
| Modify argument syntax | `udl/grammar.js:217-230` | Update `argument` rule |

## Related Structures

- `method` (udl) — Wrapper with `Method` keyword
- `classmethod` (udl) — Wrapper with `ClassMethod` keyword
- `statement` (core) — Statements within core method body
- `expression` (expr) — Expression in expression method body

## Injection Queries

External methods trigger language injection:

```scheme
(method_definition
  (external_method_keywords
    (method_keyword_language
      (rhs) @lang))
  (external_method_body_content) @injection.content
  (#match? @lang "^[Pp][Yy][Tt][Hh][Oo][Nn]$")
  (#set! injection.language "python"))
```

**Evidence**: `udl/queries/injections.scm:1-15`

## Assumptions

- Method bodies are syntactically complete
- External language content is passed verbatim to injected parser
- Default argument values can be complex expressions

## Open Questions

- Should generator methods have a distinct body variant?
- How to handle syntax errors within method bodies?

## Evidence

- `udl/grammar.js:173-211` — Method definition and body variants
- `udl/grammar.js:217-230` — Arguments structure
- `udl/keywords.js` — Method keyword definitions
- `udl/queries/injections.scm:1-35` — Method body injections
