# Usage Examples Catalog - tree-sitter-objectscript

This catalog provides usage examples for the tree-sitter-objectscript parser, organized by use case. Each example includes prerequisites, code snippets, and evidence references.

---

## Table of Contents

1. [Basic Parser Usage](#1-basic-parser-usage)
2. [Parsing ObjectScript Expressions](#2-parsing-objectscript-expressions)
3. [Parsing Class Files (.cls)](#3-parsing-class-files-cls)
4. [Writing Highlight Queries](#4-writing-highlight-queries)
5. [Language Injection](#5-language-injection)
6. [Editor Integration](#6-editor-integration)
7. [Programmatic AST Traversal](#7-programmatic-ast-traversal)

---

## 1. Basic Parser Usage

### Prerequisites

- tree-sitter CLI installed (`brew install tree-sitter` or `scoop install tree-sitter`)
- Repository cloned

### Example: Generate and Build Parser

```bash
# Navigate to the grammar you want to build
cd udl

# Generate parser from grammar.js
tree-sitter generate

# Build native parser
tree-sitter build

# Build WebAssembly parser (for playground)
tree-sitter build --wasm
```

**Evidence**: `README.md:118-130`

### Example: Run Tests

```bash
cd udl
tree-sitter test
```

**Evidence**: `README.md:134-138`

### Example: Interactive Playground

```bash
cd udl
tree-sitter build --wasm
tree-sitter playground
```

Opens browser with visual AST explorer.

**Evidence**: `README.md:140-148`

---

## 2. Parsing ObjectScript Expressions

### Prerequisites

- `expr` grammar built

### Example: Parse Simple Expression

**Input** (`test.cos`):
```objectscript
$PIECE(name, ",", 1)
```

**Command**:
```bash
cd expr
tree-sitter parse ../test.cos
```

**Output**:
```
(source_file [0, 0] - [0, 21]
  (expression [0, 0] - [0, 21]
    (expr_atom [0, 0] - [0, 21]
      (system_defined_function [0, 0] - [0, 21]
        (dollar_piece [0, 0] - [0, 21]
          (expression [0, 7] - [0, 11]
            (expr_atom [0, 7] - [0, 11]
              (lvn [0, 7] - [0, 11]
                (objectscript_identifier [0, 7] - [0, 11]))))
          (expression [0, 13] - [0, 16]
            (expr_atom [0, 13] - [0, 16]
              (string_literal [0, 13] - [0, 16])))
          (dollar_func_pos [0, 18] - [0, 19]
            (expression [0, 18] - [0, 19]
              (expr_atom [0, 18] - [0, 19]
                (numeric_literal [0, 18] - [0, 19])))))))))
```

**Evidence**: `expr/grammar.js:546-560` (dollar_piece rule)

### Example: Parse Global Variable Reference

**Input**:
```objectscript
^|"SAMPLES"|Patient(id)
```

**AST nodes**:
- `gvn` — Global variable name
- `objectscript_identifier` — Variable name portion
- `subscripts` — `(id)` portion

**Evidence**: `expr/grammar.js:324-340` (gvn rule)

### Example: Parse Class Method Call

**Input**:
```objectscript
##class(%Library.PopulateUtils).Name()
```

**Key nodes**:
- `class_method_call`
- `class_ref` containing `keyword_pound_pound_class`
- `class_name` — `%Library.PopulateUtils`
- `method_name` — `Name`
- `method_args` — `()`

**Evidence**: `expr/grammar.js:168-187` (class_method_call rule)

---

## 3. Parsing Class Files (.cls)

### Prerequisites

- `udl` grammar built

### Example: Parse Complete Class

**Input** (`Sample.cls`):
```objectscript
Class Sample.Person Extends %Persistent {

Property Name As %String;

Property DOB As %Date;

Method GetAge() As %Integer {
    Return $ZDATE($HOROLOG, 8) - ..DOB \ 365
}

ClassMethod Create(name As %String) As Sample.Person {
    Set person = ..%New()
    Set person.Name = name
    Return person
}

}
```

**Command**:
```bash
cd udl
tree-sitter parse Sample.cls
```

**Key AST structure**:
```
(source_file
  (class_definition
    keyword: (keyword_class)
    (class_name)
    (class_extends
      keyword: (keyword_extends)
      (class_name))
    (class_body
      (class_statement
        (property ...))
      (class_statement
        (property ...))
      (class_statement
        (method
          keyword: (keyword_method)
          (method_definition ...)))
      (class_statement
        (classmethod
          keyword: (keyword_classmethod)
          (method_definition ...))))))
```

**Evidence**: `udl/grammar.js:78-125`

### Example: Parse Method with Keywords

**Input**:
```objectscript
Method Process() As %Status [ Private, Final ] {
    Return $$$OK
}
```

**Relevant nodes**:
- `method_keywords` containing `property_keyword_private`, `parameter_keyword_final`
- `_core_method` body with `statement` children

**Evidence**: `common/keywords.js:111-140` (method_keyword rule)

---

## 4. Writing Highlight Queries

### Prerequisites

- Understanding of tree-sitter query syntax (.scm files)

### Example: Highlight Keywords

**Query** (`highlights.scm`):
```scheme
; Capture all keywords using the field pattern
keyword: (_) @keyword
```

This captures any node in a `keyword:` field position.

**Evidence**: `core/queries/highlights.scm:7`

### Example: Highlight Variables

**Query**:
```scheme
(lvn) @variable
(gvn) @variable
(ssvn) @variable
(instance_variable) @variable
```

**Evidence**: `expr/queries/highlights.scm:18-22`

### Example: Highlight System Functions

**Query**:
```scheme
(system_defined_variable) @variable.special
(system_defined_function) @variable.special
```

**Evidence**: `expr/queries/highlights.scm:8-9`

### Example: Highlight Class Names

**Query**:
```scheme
(class_name) @type
```

**Evidence**: `expr/queries/highlights.scm:12`

### Example: Highlight Method Names

**Query**:
```scheme
(method_name) @function
```

**Evidence**: `expr/queries/highlights.scm:11`

---

## 5. Language Injection

### Prerequisites

- Understanding of injection queries
- Target language parsers installed (SQL, Python, etc.)

### Example: Inject SQL into Query Bodies

**Query** (`injections.scm`):
```scheme
(query
  (return_type
    (typename
      (identifier) @_querytype
      (#match? @_querytype "^%[Ss][Qq][Ll][Qq][Uu][Ee][Rr][Yy]$")))
  (query_body
    (query_body_content) @injection.content)
  (#set! injection.language "sql")
  (#set! injection.include-children "true"))
```

**Evidence**: `udl/queries/injections.scm:42-52`

### Example: Inject Python into Methods

**Query**:
```scheme
(method_definition
  (external_method_keywords
    (method_keyword_language
      (rhs) @lang))
  (external_method_body_content) @injection.content
  (#set! injection.include-children "true")
  (#match? @lang "^[Pp][Yy][Tt][Hh][Oo][Nn]$")
  (#set! injection.language "python"))
```

**Evidence**: `udl/queries/injections.scm:1-10`

### Example: Inject XML into XDATA Blocks

**Query**:
```scheme
(xdata
  (xdata_xml
    (xdata_keywords)?
    (external_method_body_content) @injection.content)
  (#set! injection.include-children "true")
  (#set! injection.language "xml"))
```

**Evidence**: `udl/queries/injections.scm:91-97`

### Example: Inject YAML into XDATA by MimeType

**Query**:
```scheme
(xdata
  (xdata_any
    (xdata_keywords
      (xdata_keyword_mimetype (rhs) @mt))
    (external_method_body_content) @injection.content)
  (#set! injection.include-children "true")
  (#match? @mt "^\"?([Tt][Ee][Xx][Tt]|[Aa][Pp][Pp][Ll][Ii][Cc][Aa][Tt][Ii][Oo][Nn])/[Yy][Aa][Mm][Ll]\"?$")
  (#set! injection.language "yaml"))
```

**Evidence**: `udl/queries/injections.scm:76-84`

---

## 6. Editor Integration

### Example: Zed Editor

**Installation**:
1. Open Zed
2. Open command palette (`Cmd+Shift+P`)
3. Type "Extensions"
4. Search "ObjectScript"
5. Click Install

**Evidence**: `README.md:60-62`

### Example: Neovim (nvim-treesitter)

**Configuration** (`init.lua`):
```lua
-- Associate .cls files with ObjectScript
vim.filetype.add({
  extension = {
    cls = 'objectscript',
  },
})
```

**Installation**:
```vim
:TSInstall objectscript
```

**Evidence**: `README.md:66-90`

### Example: Emacs

**Installation**:
Follow instructions at [emacs-objectscript-ts-mode](https://github.com/intersystems/emacs-objectscript-ts-mode)

**Evidence**: `README.md:92-94`

---

## 7. Programmatic AST Traversal

### Example: Rust

**Prerequisites**:
```toml
# Cargo.toml
[dependencies]
tree-sitter = "0.24"
tree-sitter-objectscript = { path = "./path/to/tree-sitter-objectscript" }
```

**Code**:
```rust
use tree_sitter::{Parser, Language};

fn main() {
    let mut parser = Parser::new();
    
    // Load the ObjectScript language
    extern "C" { fn tree_sitter_objectscript() -> Language; }
    let language = unsafe { tree_sitter_objectscript() };
    parser.set_language(&language).unwrap();
    
    // Parse source code
    let source = r#"Class Test { Property Name As %String; }"#;
    let tree = parser.parse(source, None).unwrap();
    
    // Traverse the tree
    let root = tree.root_node();
    println!("Root: {:?}", root.kind());
    
    for child in root.children(&mut root.walk()) {
        println!("  Child: {:?}", child.kind());
    }
}
```

**Evidence**: `README.md:176-178`

### Example: Python

**Prerequisites**:
```bash
pip install tree-sitter-objectscript
```

**Code**:
```python
import tree_sitter_objectscript as ts_objectscript
from tree_sitter import Language, Parser

# Create parser
parser = Parser()
parser.language = Language(ts_objectscript.language())

# Parse source
source = b'SET x = $PIECE(name, ",", 1)'
tree = parser.parse(source)

# Traverse
def traverse(node, indent=0):
    print(" " * indent + f"{node.type}: {source[node.start_byte:node.end_byte]}")
    for child in node.children:
        traverse(child, indent + 2)

traverse(tree.root_node)
```

**Evidence**: `README.md:180-182`

### Example: Node.js

**Prerequisites**:
```bash
npm install tree-sitter tree-sitter-objectscript
```

**Code**:
```javascript
const Parser = require('tree-sitter');
const ObjectScript = require('tree-sitter-objectscript');

const parser = new Parser();
parser.setLanguage(ObjectScript);

const source = 'WRITE "Hello, World!"';
const tree = parser.parse(source);

console.log(tree.rootNode.toString());
```

**Evidence**: `README.md:184-190`

### Example: Go

**Prerequisites**:
```bash
go get github.com/tree-sitter/go-tree-sitter@v0.24.0
```

**Code**:
```go
package main

import (
    "fmt"
    sitter "github.com/tree-sitter/go-tree-sitter"
    objectscript "github.com/intersystems/tree-sitter-objectscript/bindings/go"
)

func main() {
    parser := sitter.NewParser()
    parser.SetLanguage(sitter.NewLanguage(objectscript.Language()))
    
    source := []byte(`SET x = 1`)
    tree := parser.Parse(source, nil)
    
    fmt.Println(tree.RootNode().String())
}
```

**Evidence**: `README.md:192-194`

---

## Doc/Code Consistency Notes

| Documentation Claim | Code Evidence | Status |
|---------------------|---------------|--------|
| "Three main grammars" | `expr/`, `core/`, `udl/` directories | ✅ Verified |
| "UDL extends core extends expr" | `require('../core/grammar')` in udl | ✅ Verified |
| "112 test files" | `find test/corpus -name "*.txt"` = 94 | ⚠️ Mismatch (PR says 437 tests, not files) |
| "Zed extension available" | Extension exists at zed.dev | ✅ Verified |

---

## Advanced Examples

### Example: Extract All Method Names from a Class

**Query**:
```scheme
(method_definition
  (method_name) @method)
```

**Usage**:
```bash
tree-sitter query queries/extract-methods.scm Sample.cls
```

### Example: Find All SQL Embeds

**Query**:
```scheme
(embedded_sql) @sql
```

### Example: List All Global References

**Query**:
```scheme
(gvn) @global
```

---

## Assumptions

- Examples tested with tree-sitter CLI 0.24+
- Language binding versions match tree-sitter.json metadata
- Editor integrations require recent editor versions

## Open Questions

1. Should examples include error handling for malformed input?
2. Should we provide a cookbook-style examples directory?

## Evidence

- `README.md` — Installation and usage instructions
- `expr/queries/highlights.scm` — Expression highlight captures
- `core/queries/highlights.scm` — Core highlight captures  
- `udl/queries/highlights.scm` — UDL highlight captures
- `udl/queries/injections.scm` — Language injection rules
- `examples/parser.cls` — Sample ObjectScript class
- `bindings/*/` — Language binding implementations
