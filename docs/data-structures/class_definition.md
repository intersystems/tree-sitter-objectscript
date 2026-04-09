# Data Structure: class_definition

## Overview

The `class_definition` rule represents an ObjectScript class declaration in UDL format. It is the top-level structure in `.cls` files and contains all class members (methods, properties, parameters, etc.).

## Definition

**Location**: `udl/grammar.js:108-115`

```javascript
class_definition: ($) =>
  seq(
    $.keyword_class,
    alias($.identifier, $.class_name),
    optional($.class_extends),
    optional($.class_keywords),
    $.class_body,
  ),
```

## Structure

### AST Shape

```
(class_definition
  (keyword_class)                     ; "Class" keyword
  (class_name)                        ; Package.ClassName
  (class_extends)?                    ; Extends clause (optional)
  (class_keywords)?                   ; [ keyword = value, ... ] (optional)
  (class_body                         ; { ... }
    (class_statement)*))              ; Methods, properties, etc.
```

### Components

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keyword_class` | node | Yes | The `Class` keyword token |
| `class_name` | `identifier` | Yes | Fully qualified class name |
| `class_extends` | node | No | Superclass declaration |
| `class_keywords` | node | No | Class modifiers in brackets |
| `class_body` | node | Yes | Curly-brace-enclosed body |

### class_extends Structure

```javascript
class_extends: ($) =>
  seq(
    $.keyword_extends,
    choice(
      alias($.identifier, $.class_name),
      seq(alias('(', $.bracket), 
          alias($.identifier, $.class_name), 
          repeat(seq(',', alias($.identifier, $.class_name))), 
          alias(')', $.bracket)),
    ),
  ),
```

**Evidence**: `udl/grammar.js:118-124`

### class_body Structure

```javascript
class_body: ($) => seq('{', repeat($.class_statement), '}'),

class_statement: ($) =>
  seq(
    choice(
      $.method,
      $.classmethod,
      $.property,
      $.parameter,
      $.relationship,
      $.foreignkey,
      $.query,
      $.index,
      $.trigger,
      $.xdata,
      $.projection,
      $.storage,
    ),
  ),
```

**Evidence**: `udl/grammar.js:136-151`

## Lifecycle

| Phase | Description |
|-------|-------------|
| Parse | UDL grammar matches "Class" keyword and structure |
| AST Creation | `class_definition` node with nested members |
| Query | Highlight queries can capture the class keyword, class name, and class member declarations from the UDL/objectscript query layers |
| Injection | Storage body injected as XML |

## Member Types

| Member | Rule | Description |
|--------|------|-------------|
| Method | `method` | Instance method |
| ClassMethod | `classmethod` | Class (static) method |
| Property | `property` | Instance property |
| Parameter | `parameter` | Class constant |
| Relationship | `relationship` | Object relationship |
| ForeignKey | `foreignkey` | SQL foreign key |
| Query | `query` | Named SQL query |
| Index | `index` | Database index |
| Trigger | `trigger` | Database trigger |
| XData | `xdata` | Named data block |
| Projection | `projection` | Projection definition |
| Storage | `storage` | Storage definition |

## Invariants

1. A `.cls` file contains exactly one `class_definition`
2. Class name must be a valid dotted identifier
3. Multiple inheritance uses parenthesized extends: `Extends (A, B, C)`
4. Class body is always enclosed in `{ }`

## Usage Patterns

### Simple Class

```objectscript
Class MyPackage.MyClass {
  Property Name As %String;
  Method GetName() As %String {
    Return ..Name
  }
}
```

### Class with Inheritance

```objectscript
Class MyPackage.MyClass Extends %Persistent {
  // ...
}
```

### Class with Keywords

```objectscript
Class MyPackage.MyClass Extends %Persistent [ Abstract, Final ] {
  // ...
}
```

### Multiple Inheritance

```objectscript
Class MyPackage.MyClass Extends (%Persistent, %XML.Adaptor) {
  // ...
}
```

## Constraints

- Only one class per `.cls` file
- Class name must match file path (by convention)
- Reserved class names (starting with `%`) for system classes

## Update Paths

| Operation | Location | Notes |
|-----------|----------|-------|
| Add class keyword | `common/keywords.js` | Define in `class_keywords` rule |
| Add member type | `udl/grammar.js:138-151` | Add to `class_statement` choice |
| Modify extends syntax | `udl/grammar.js:118-124` | Update `class_extends` rule |

## Related Structures

- `method_definition` (udl) — Method structure
- `property` (udl) — Property declaration
- `class_statement` (udl) — Union of all member types

## File-Level Context

Before `class_definition`, a file may have optional `Include`,
`IncludeGenerator`, and `Import` clauses. The `source_file` rule still resolves
those clauses before the class body.

### Include/Import Clauses

| Clause | Purpose |
|--------|---------|
| `Include ClassName` | Include macro file |
| `IncludeGenerator ClassName` | Include generator macros |
| `Import Package` | Import package namespace |

## Assumptions

- Class files are UTF-8 encoded
- Class names are case-sensitive
- System classes start with `%`

## Open Questions

- Should the grammar validate class name vs. file path?
- How to handle malformed class definitions for error recovery?

## Evidence

- `udl/grammar.js:108-115` — `class_definition` rule
- `udl/grammar.js:118-124` — `class_extends` rule
- `udl/grammar.js:136-151` — `class_body` and `class_statement` rules
- `udl/grammar.js:59-105` — `source_file` with include/import
- `common/keywords.js` — Class keyword definitions
