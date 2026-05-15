# Data Structure: statement

## Overview

The `statement` rule is the union of all ObjectScript command types and constructs that can appear in routine code. It represents a single executable unit in the core grammar.

## Definition

**Location**: `core/grammar.js:198-199`, with the statement membership list in `core/command_metadata.js`

```javascript
statement: ($) =>
  choice(...rule_refs($, STATEMENT_RULE_NAMES)),
```

## Structure

### AST Shape

A `statement` node is an alias for one of its 50+ constituent command types. The actual AST contains the specific command type, not a generic `statement` wrapper.

```
; Example: SET command
(command_set
  keyword: (keyword_set)
  (set_argument
    (lvn (objectscript_identifier))
    (expression ...)))

; Example: IF command
(command_if
  keyword: (keyword_if)
  (expression ...)
  (statement ...)*     ; Nested statements
  (else_block ...)?)
```

### Statement Categories

| Category | Commands | Count |
|----------|----------|-------|
| Data Manipulation | `SET`, `KILL`, `MERGE`, `NEW` | 4 |
| Control Flow | `IF`, `FOR`, `WHILE`, `DO`, `QUIT`, `RETURN`, `GOTO`, `CONTINUE` | 8 |
| I/O | `READ`, `WRITE`, `OPEN`, `CLOSE`, `USE` | 5 |
| Transaction | `TSTART`, `TCOMMIT`, `TROLLBACK` | 3 |
| Exception | `THROW`, `TRY/CATCH` | 2 |
| Process | `JOB`, `HALT`, `HANG`, `BREAK` | 4 |
| Debugging | `ZWRITE`, `ZBREAK`, `ZTRAP` | 3 |
| Other | `LOCK`, `VIEW`, `XECUTE`, `ZKILL`, `ZN`, `ZSU`, `ZZ` | 7 |
| Embedded | `&sql()`, `&html<>`, `&xml<>`, `&js<>` | 4 |
| Preprocessor | `#define`, `#if`, `#ifdef`, `#ifndef`, `#include`, `#import`, `#dim` | 7 |
| Labels | `tag`, `tag_with_params`, `procedure` | 3 |

**Total**: 50+ statement types

## Lifecycle

| Phase | Description |
|-------|-------------|
| Parse | tree-sitter matches command keyword and arguments |
| AST Creation | Specific command node created (e.g., `command_set`) |
| Query | Highlight queries usually match command keyword fields; non-command statement forms such as tags and macros are highlighted through their own node patterns |
| Injection | Embedded statements trigger language injection |

## Command Structure Pattern

Most commands follow this pattern:

```javascript
function build_command_rule_argumentful($, commandKeyword, commandArgument) {
  return seq(
    commandKeyword,                                          // e.g., $.keyword_set
    optional($.post_conditional),                            // :expression
    $._immediate_single_whitespace_followed_by_non_whitespace,
    commandArgument,                                         // Command-specific args
  );
}
```

**Evidence**: `core/grammar.js:31-40`

### Argumentless Commands

```javascript
function build_command_rule_argumentless($, commandKeyword) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    choice(
        $._argumentless_command_end,
        $._termination,
    )
  );
}
```

**Evidence**: `core/grammar.js:57-67`

## Invariants

1. The `statement` rule expands from `STATEMENT_RULE_NAMES`, so the metadata list and the grammar stay in sync
2. Most command nodes attach a `keyword` field containing the command token; tag/macro-style statements do not use that field
3. Post-conditionals (`:expression`) are optional on most commands
4. Block-style commands (`IF {} ELSE {}`) and old-style (`IF cond cmd`) both remain valid
5. The external scanner controls argumentless vs. argument command detection

## Usage Patterns

### In Source Files

```objectscript
label
  SET x = 1
  WRITE x
  IF x > 0 {
    DO ##class(Pkg.Class).Method()
  }
  QUIT
```

### In Method Bodies

```objectscript
Method DoSomething() {
  statement
  statement
  RETURN result
}
```

### In Control Flow

```objectscript
FOR i = 1:1:10 {
  statement    ; Nested statement
  statement
}
```

## Constraints

- Statements cannot be nested arbitrarily (only in control flow blocks)
- Labels/tags can only appear at line start
- Preprocessor directives have different scoping rules

## Update Paths

| Operation | Location | Notes |
|-----------|----------|-------|
| Add new command | `core/command_metadata.js` and `core/grammar.js:198-199` | Update `STATEMENT_RULE_NAMES`, then add the matching rule implementation |
| Add command keyword | `core/grammar.js` | Define `keyword_*` rule |
| Modify command syntax | Individual `command_*` rules | Use builder functions |

## Related Structures

- `expression` (expr) — Expressions within command arguments
- `statements` (core) — `repeat1(statement)` for multiple statements
- `class_statement` (udl) — UDL-specific statements (methods, properties)

## Keyword Field Pattern

Most command keywords are attached using `field('keyword', ...)`:

```javascript
command_set: ($) =>
  build_command_rule_argumentful(
    $,
    field('keyword', $.keyword_set),  // Attached here
    commaSep1($.set_argument),
  ),
```

This enables a single query pattern:

```scheme
keyword: (_) @keyword
```

**Evidence**: `core/queries/highlights.scm`

## Assumptions

- ObjectScript command keywords are case-insensitive
- Commands on same line separated by single space
- Argumentless commands detected by double-space or EOL

## Open Questions

- Should deprecated commands (e.g., old ZSAVE) be supported?
- How to handle vendor-specific Z* commands?

## Evidence

- `core/command_metadata.js` — `STATEMENT_RULE_NAMES`
- `core/grammar.js:198-199` — `statement` definition
- `core/grammar.js:31-67` — Command builder functions
- `core/grammar.js` — Keyword definitions
- `core/utils.js` — Post-conditional generation utilities
