# Data Structure: statement

## Overview

The `statement` rule is the union of all ObjectScript command types and constructs that can appear in routine code. It represents a single executable unit in the core grammar.

## Definition

**Location**: `core/grammar.js:145-196`

```javascript
statement: ($) =>
  choice(
    $.command_set,
    $.command_write,
    $.command_do,
    $.command_zwrite,
    $.command_for,
    $.command_while,
    $.command_kill,
    $.command_lock,
    $.command_read,
    $.command_open,
    $.command_close,
    $.command_use,
    $.command_new,
    $.command_if,
    $.command_else,
    $.command_throw,
    $.command_trycatch,
    $.command_job,
    $.command_break,
    $.command_merge,
    $.command_quit,
    $.command_goto,
    $.command_return,
    $.command_halt_or_hang,
    $.command_dowhile,
    $.command_continue,
    $.command_tcommit,
    $.command_trollback,
    $.command_tstart,
    $.command_view,
    $.command_xecute,
    $.command_zbreak,
    $.command_zkill,
    $.command_zn,
    $.command_zsu,
    $.command_ztrap,
    $.command_zz,
    $.embedded_html,
    $.embedded_xml,
    $.embedded_sql,
    $.embedded_js,
    $.pound_dim,
    $.pound_define,
    $.pound_def1arg,
    $.pound_if,
    $.pound_ifdef,
    $.pound_ifndef,
    $.pound_import,
    $.pound_include,
    $.macro,
    $.tag,
    $.tag_with_params,
    $.procedure,
  ),
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
| Query | Highlight queries match `keyword:` field for keyword highlighting |
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

**Evidence**: `core/grammar.js:30-40`

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

**Evidence**: `core/grammar.js:57-68`

## Invariants

1. Every command has a `keyword` field containing the command token
2. Post-conditionals (`:expression`) are optional on most commands
3. Block-style commands (`IF {} ELSE {}`) and old-style (`IF cond cmd`) both valid
4. External scanner controls argumentless vs. argument command detection

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
| Add new command | `core/grammar.js:145-196` | Add to `choice()` in `statement` |
| Add command keyword | `core/grammar.js:200-280` | Define `keyword_*` rule |
| Modify command syntax | Individual `command_*` rules | Use builder functions |

## Related Structures

- `expression` (expr) — Expressions within command arguments
- `statements` (core) — `repeat1(statement)` for multiple statements
- `class_statement` (udl) — UDL-specific statements (methods, properties)

## Keyword Field Pattern

All keywords are attached using `field('keyword', ...)`:

```javascript
command_set: ($) =>
  build_command_rule_argumentful(
    $,
    field('keyword', $.keyword_set),  // Attached here
    repeat_with_commas($.set_argument),
  ),
```

This enables a single query pattern:

```scheme
keyword: (_) @keyword
```

**Evidence**: `core/queries/highlights.scm:7`

## Assumptions

- ObjectScript command keywords are case-insensitive
- Commands on same line separated by single space
- Argumentless commands detected by double-space or EOL

## Open Questions

- Should deprecated commands (e.g., old ZSAVE) be supported?
- How to handle vendor-specific Z* commands?

## Evidence

- `core/grammar.js:145-196` — `statement` choice definition
- `core/grammar.js:30-68` — Command builder functions
- `core/grammar.js:200-280` — Keyword definitions
- `core/utils.js:1-150` — Post-conditional generation utilities
