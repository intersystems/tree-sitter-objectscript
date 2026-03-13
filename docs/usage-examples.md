# Usage Examples - tree-sitter-objectscript

This document contains current, runnable examples for using the grammars and bindings in this repository.

## Grammar Targets

- `objectscript`: playground/snippet grammar
- `objectscript_udl`: class-file grammar for `.cls`
- `objectscript_core`: routine/statement grammar
- `objectscript_expr`: expression grammar

## CLI Workflow

Run from the grammar directory you are editing (`objectscript`, `udl`, `core`, or `expr`):

```bash
tree-sitter generate
tree-sitter test
tree-sitter build
```

For playground inspection:

```bash
tree-sitter build --wasm
tree-sitter playground
```

## Query Validation

From repo root:

```bash
make checkquery
```

This syncs query files, builds parser artifacts, and runs `ts_query_ls check` on:

- `core/queries`
- `udl/queries`
- `expr/queries`

## Neovim Setup

Install both grammars:

```vim
:TSInstall objectscript_udl
:TSInstall objectscript
```

Optional filetype mapping for `.cls`:

```lua
vim.filetype.add({
  extension = {
    cls = "objectscript_udl",
  },
})
```

## Node.js Example

```javascript
const Parser = require("tree-sitter");
const ObjectScript = require("tree-sitter-objectscript");

const parser = new Parser();
parser.setLanguage(ObjectScript.objectscript_udl);

const source = "Class Demo.App { Method Run() { Write \"ok\" } }";
const tree = parser.parse(source);

console.log(tree.rootNode.type);
```

Use `ObjectScript.objectscript` for playground/snippet parsing.

## Python Example

```python
import tree_sitter
import tree_sitter_objectscript
import tree_sitter_objectscript_udl

lang_udl = tree_sitter.Language(tree_sitter_objectscript_udl.language_objectscript_udl())
lang_playground = tree_sitter.Language(tree_sitter_objectscript.language_objectscript())

tree_sitter.Query(lang_udl, tree_sitter_objectscript_udl.HIGHLIGHTS_QUERY)
tree_sitter.Query(lang_playground, tree_sitter_objectscript.HIGHLIGHTS_QUERY)
```

## Rust Example (UDL crate)

```rust
use tree_sitter::Parser;
use tree_sitter_objectscript::LANGUAGE_OBJECTSCRIPT_UDL;

fn main() {
    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE_OBJECTSCRIPT_UDL.into())
        .expect("failed to load objectscript_udl grammar");
}
```

## Rust Example (Playground crate)

```rust
use tree_sitter::Parser;
use tree_sitter_objectscript_playground::LANGUAGE_OBJECTSCRIPT;

fn main() {
    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE_OBJECTSCRIPT.into())
        .expect("failed to load objectscript playground grammar");
}
```

## Go Example

```go
package main

import (
	"fmt"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	objectscript "github.com/intersystems/tree-sitter-objectscript/bindings/go"
)

func main() {
	parser := tree_sitter.NewParser()
	parser.SetLanguage(tree_sitter.NewLanguage(objectscript.LanguageObjectscriptUdl()))
	tree := parser.Parse([]byte("Class Demo.App {}"), nil)
	fmt.Println(tree.RootNode().Kind())
}
```

## Binding Test Commands

Run from repo root:

```bash
nvm use
npm install
npm test

cargo test --lib --package tree-sitter-objectscript
python3 -m pytest -q bindings/python/tests/test_binding.py
go test ./bindings/go/...
swift test
make test
```
