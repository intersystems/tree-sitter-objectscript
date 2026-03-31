# Usage Examples - tree-sitter-objectscript

This document contains current, runnable examples for using the grammars and bindings in this repository.

## Grammar Targets

- `objectscript`: playground/snippet grammar
- `objectscript_udl`: class-file grammar for `.cls`
- `objectscript_core`: routine/statement grammar
- `objectscript_expr`: expression grammar
- `objectscript_routine`: routine-header grammar for `.mac`, `.inc`, `.int`, `.rtn`

## CLI Workflow

Run from the grammar directory you are editing (`objectscript`, `udl`, `core`, `expr`, or `objectscript_routine`):

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
- `objectscript/queries`
- `objectscript_routine/queries`

## Neovim Setup

Install the grammar set used in this repository:

```vim
:TSInstall objectscript_udl
:TSInstall objectscript
:TSInstall objectscript_routine
```

Optional filetype mapping for `.cls`:

```lua
vim.filetype.add({
  extension = {
    cls = "objectscript_udl",
    mac = "objectscript_routine",
    inc = "objectscript_routine",
    int = "objectscript_routine",
    rtn = "objectscript_routine",
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
Use `ObjectScript.objectscript_routine` for routine-header files.

## Python Example

```python
import tree_sitter
import tree_sitter_objectscript
import tree_sitter_objectscript_udl
import tree_sitter_objectscript_routine

lang_udl = tree_sitter.Language(tree_sitter_objectscript_udl.language_objectscript_udl())
lang_playground = tree_sitter.Language(tree_sitter_objectscript.language_objectscript())
lang_routine = tree_sitter.Language(tree_sitter_objectscript_routine.language_objectscript_routine())

tree_sitter.Query(lang_udl, tree_sitter_objectscript_udl.HIGHLIGHTS_QUERY)
tree_sitter.Query(lang_playground, tree_sitter_objectscript.HIGHLIGHTS_QUERY)
tree_sitter.Query(lang_routine, tree_sitter_objectscript_routine.HIGHLIGHTS_QUERY)
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

## Rust Example (Routine crate)

```rust
use tree_sitter::Parser;
use tree_sitter_objectscript_routine::LANGUAGE_OBJECTSCRIPT_ROUTINE;

fn main() {
    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE_OBJECTSCRIPT_ROUTINE.into())
        .expect("failed to load objectscript_routine grammar");
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
npm ci
npm test

cargo test --lib --package tree-sitter-objectscript
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -U pip setuptools wheel pytest tree-sitter
python3 setup.py build_ext --inplace
PYTHONPATH=$PWD/bindings/python python3 -m pytest -q bindings/python/tests/test_binding.py
go test ./bindings/go/...
swift test
make test
```
