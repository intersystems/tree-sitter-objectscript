# Usage Examples: tree-sitter-objectscript

This catalog provides validated usage examples for key APIs, data structures, and patterns in the tree-sitter-objectscript grammar.

---

## Table of Contents

1. [Grammar Usage (Rust)](#grammar-usage-rust)
2. [Grammar Usage (Node.js)](#grammar-usage-nodejs)
3. [Grammar Usage (Python)](#grammar-usage-python)
4. [Query Patterns](#query-patterns)
5. [Injection Patterns](#injection-patterns)
6. [AST Navigation](#ast-navigation)

---

## Grammar Usage (Rust)

### Basic Parsing

**Prerequisites:** Add to `Cargo.toml`
```toml
[dependencies]
tree-sitter = "0.24"
tree-sitter-objectscript = { path = "./path/to/tree-sitter-objectscript" }
```

**Example:**
```rust
use tree_sitter::Parser;

fn main() {
    let mut parser = Parser::new();
    parser
        .set_language(&tree_sitter_objectscript::LANGUAGE.into())
        .expect("Error loading ObjectScript grammar");

    let source_code = r#"
Class MyPackage.MyClass Extends %Persistent
{
    Property Name As %String;
    
    Method GetName() As %String
    {
        Return ..Name
    }
}
"#;

    let tree = parser.parse(source_code, None).unwrap();
    let root_node = tree.root_node();
    
    println!("Root node kind: {}", root_node.kind());
    println!("Child count: {}", root_node.child_count());
}
```

**Evidence:** `bindings/rust/lib.rs`, `README.md:235-240`

---

### Walking the AST

```rust
use tree_sitter::{Parser, TreeCursor};

fn walk_tree(cursor: &mut TreeCursor, source: &str, depth: usize) {
    loop {
        let node = cursor.node();
        let indent = "  ".repeat(depth);
        
        if node.is_named() {
            let text = &source[node.start_byte()..node.end_byte()];
            println!("{}{}: {:?}", indent, node.kind(), 
                     text.chars().take(30).collect::<String>());
        }
        
        if cursor.goto_first_child() {
            walk_tree(cursor, source, depth + 1);
            cursor.goto_parent();
        }
        
        if !cursor.goto_next_sibling() {
            break;
        }
    }
}

fn main() {
    let mut parser = Parser::new();
    parser.set_language(&tree_sitter_objectscript::LANGUAGE.into()).unwrap();
    
    let source = "Class Test { Property X As %String; }";
    let tree = parser.parse(source, None).unwrap();
    
    let mut cursor = tree.walk();
    walk_tree(&mut cursor, source, 0);
}
```

---

## Grammar Usage (Node.js)

### Basic Parsing

**Prerequisites:**
```bash
npm install tree-sitter tree-sitter-objectscript
```

**Example:**
```javascript
const Parser = require('tree-sitter');
const ObjectScript = require('tree-sitter-objectscript');

const parser = new Parser();
parser.setLanguage(ObjectScript);

const sourceCode = `
Class MyPackage.MyClass Extends %Persistent
{
    Property Name As %String;
    
    Method GetName() As %String
    {
        Return ..Name
    }
}
`;

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
```

**Evidence:** `bindings/node/index.js`, `README.md:250-255`

---

### Query Execution

```javascript
const Parser = require('tree-sitter');
const ObjectScript = require('tree-sitter-objectscript');

const parser = new Parser();
parser.setLanguage(ObjectScript);

const sourceCode = `
Class Test {
    Method Foo() { Set x = 1 }
    Method Bar() { Set y = 2 }
}
`;

const tree = parser.parse(sourceCode);

// Query for all method names
const query = new Parser.Query(ObjectScript, `
  (method_definition
    name: (identifier) @method.name)
`);

const captures = query.captures(tree.rootNode);
for (const { name, node } of captures) {
    console.log(`${name}: ${node.text}`);
}
// Output:
// method.name: Foo
// method.name: Bar
```

---

## Grammar Usage (Python)

### Basic Parsing

**Prerequisites:**
```bash
pip install tree-sitter tree-sitter-objectscript
```

**Example:**
```python
import tree_sitter_objectscript as ts_os
from tree_sitter import Language, Parser

parser = Parser(Language(ts_os.language()))

source_code = b"""
Class MyPackage.MyClass Extends %Persistent
{
    Property Name As %String;
    
    Method GetName() As %String
    {
        Return ..Name
    }
}
"""

tree = parser.parse(source_code)
root = tree.root_node

print(f"Root kind: {root.type}")
print(f"Children: {len(root.children)}")

# Find all methods
def find_methods(node):
    if node.type == 'method_definition':
        name_node = node.child_by_field_name('name')
        if name_node:
            print(f"Method: {name_node.text.decode()}")
    for child in node.children:
        find_methods(child)

find_methods(root)
```

**Evidence:** `bindings/python/tree_sitter_objectscript/binding.c`, `README.md:245-250`

---

## Query Patterns

### Finding All Class Members

```scheme
;; Find all property declarations
(property
  name: (identifier) @property.name
  type: (property_type
    (typename (identifier) @property.type))?)

;; Find all method declarations
(method
  (method_definition
    name: (identifier) @method.name
    return_type: (return_type
      (typename (identifier) @method.return_type))?))

;; Find all parameters
(parameter
  name: (identifier) @parameter.name)
```

**Evidence:** `udl/queries/highlights.scm`

---

### Finding Command Usage

```scheme
;; Find all SET commands
(command_set
  command_name: (keyword_set) @command
  (set_argument
    lhs: (set_target) @target
    rhs: (expression) @value))

;; Find all embedded SQL
(embedded_sql
  command_name: (_) @sql.keyword
  (paren_fenced_text) @sql.content)

;; Find all DO commands with class method calls
(command_do
  (do_parameter
    (class_method_call
      (class_ref
        (class_name) @class)
      (method_name) @method)))
```

**Evidence:** `core/queries/highlights.scm`

---

### Finding Variables

```scheme
;; Find all local variables
(lvn
  (objectscript_identifier) @variable.local)

;; Find all global variables
(gvn) @variable.global

;; Find all instance variables
(instance_variable
  (property_name) @variable.instance)

;; Find all macro usages
(macro_constant) @constant.macro
(macro_function) @function.macro
```

**Evidence:** `expr/queries/highlights.scm`

---

## Injection Patterns

### Python Method Body

```scheme
;; Inject Python grammar for Language = python methods
(method_definition
  keywords: (external_method_keywords
    (method_keyword_language
      (rhs) @lang))
  body: (external_method_body_content) @injection.content
  (#match? @lang "(?i)^python$")
  (#set! injection.language "python"))
```

**Usage in ObjectScript:**
```objectscript
Method Calculate(x As %Integer) As %Integer [ Language = python ]
{
    return x * 2  # This is Python code
}
```

**Evidence:** `udl/queries/injections.scm:8-15`

---

### Embedded SQL

```scheme
;; Inject SQL grammar for &sql() blocks
(embedded_sql_amp
  command_name: (_)
  (paren_fenced_text) @injection.content
  (#set! injection.language "sql"))
```

**Usage in ObjectScript:**
```objectscript
Method GetData() As %Status
{
    &sql(SELECT Name, Age INTO :name, :age FROM MyTable WHERE ID = :id)
    Return $$$OK
}
```

**Evidence:** `core/queries/injections.scm`

---

### XData Blocks

```scheme
;; XML (default)
(xdata
  body: (xdata_body_content_xml) @injection.content
  (#set! injection.language "xml"))

;; JSON by MimeType
(xdata
  keywords: (xdata_keywords
    (xdata_keyword_mimetype (rhs) @mt))
  body: (xdata_body_content_any) @injection.content
  (#match? @mt "^\"application/json\"$")
  (#set! injection.language "json"))

;; Markdown by MimeType
(xdata
  keywords: (xdata_keywords
    (xdata_keyword_mimetype (rhs) @mt))
  body: (xdata_body_content_any) @injection.content
  (#match? @mt "^\"text/markdown\"$")
  (#set! injection.language "markdown"))
```

**Evidence:** `udl/queries/injections.scm:60-100`

---

## AST Navigation

### Finding Class Name

```javascript
// JavaScript example
function getClassName(tree) {
    const classDefNode = tree.rootNode.descendantsOfType('class_definition')[0];
    if (classDefNode) {
        const nameNode = classDefNode.childForFieldName('class_name');
        return nameNode ? nameNode.text : null;
    }
    return null;
}
```

```python
# Python example
def get_class_name(tree):
    def find_class_def(node):
        if node.type == 'class_definition':
            return node
        for child in node.children:
            result = find_class_def(child)
            if result:
                return result
        return None
    
    class_def = find_class_def(tree.root_node)
    if class_def:
        name_node = class_def.child_by_field_name('class_name')
        return name_node.text.decode() if name_node else None
    return None
```

---

### Extracting Method Signatures

```javascript
// JavaScript: Extract all method signatures
function extractMethodSignatures(tree) {
    const methods = [];
    const query = new Parser.Query(ObjectScript, `
        (method_definition
            name: (identifier) @name
            arguments: (arguments) @args
            return_type: (return_type (typename (identifier) @return))?)
    `);
    
    const captures = query.captures(tree.rootNode);
    let currentMethod = {};
    
    for (const { name, node } of captures) {
        if (name === 'name') {
            if (currentMethod.name) methods.push(currentMethod);
            currentMethod = { name: node.text };
        } else if (name === 'args') {
            currentMethod.args = node.text;
        } else if (name === 'return') {
            currentMethod.returnType = node.text;
        }
    }
    if (currentMethod.name) methods.push(currentMethod);
    
    return methods;
}
```

---

### Finding SQL Queries

```python
# Python: Extract embedded SQL
def extract_sql_queries(tree, source_bytes):
    queries = []
    
    def visit(node):
        if node.type == 'embedded_sql':
            # Find the paren_fenced_text child
            for child in node.children:
                if child.type == 'paren_fenced_text':
                    sql_text = source_bytes[child.start_byte:child.end_byte].decode()
                    queries.append({
                        'sql': sql_text,
                        'line': child.start_point[0] + 1,
                        'column': child.start_point[1]
                    })
        for child in node.children:
            visit(child)
    
    visit(tree.root_node)
    return queries
```

---

## Doc/Code Mismatches

| Documentation Claim | Code Reality | Status |
|---------------------|--------------|--------|
| All bindings tested | Go binding requires manual setup | ⚠️ Minor |
| Syntax highlighting complete | Some edge cases unhighlighted | ⚠️ Minor |

---

## Assumptions

1. Examples assume tree-sitter 0.20+ API
2. Python examples use the newer tree-sitter-language format
3. Query syntax follows tree-sitter 0.20+ query language

## Open Questions

1. Should examples include error handling patterns?
2. Are there common anti-patterns to document?

## Evidence

- `bindings/rust/lib.rs` — Rust binding implementation
- `bindings/node/index.js` — Node.js binding
- `bindings/python/` — Python binding
- `*/queries/highlights.scm` — Highlight queries
- `*/queries/injections.scm` — Injection queries
- `README.md:200-280` — Binding test instructions
