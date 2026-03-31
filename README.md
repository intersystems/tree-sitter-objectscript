# tree-sitter-objectscript

[![CI][ci]](https://github.com/intersystems/tree-sitter-objectscript/actions/workflows/ci.yml)
[![npm][npm]](https://www.npmjs.com/package/tree-sitter-objectscript)
[![crates-udl][crates-udl]](https://crates.io/crates/tree-sitter-objectscript)
[![crates-routine][crates-routine]](https://crates.io/crates/tree-sitter-objectscript-routine)
[![crates-playground][crates-playground]](https://crates.io/crates/tree-sitter-objectscript-playground)
[![pypi][pypi]](https://pypi.org/project/tree-sitter-objectscript/)

Tree-sitter grammars for InterSystems ObjectScript.

## Grammars

This repository publishes five related grammars:

- `objectscript`: playground/snippet grammar.
- `objectscript_udl`: class-file grammar for `.cls`.
- `objectscript_core`: routine/statement grammar.
- `objectscript_expr`: expression grammar.
- `objectscript_routine`: routine-header grammar for `.mac`, `.inc`, `.rtn`, and `.int`.

Grammar extension graph:
`objectscript_expr -> objectscript_core -> objectscript_udl -> objectscript`
`objectscript_expr -> objectscript_core -> objectscript_routine`

## Packages

- npm: `tree-sitter-objectscript`
- PyPI: `tree-sitter-objectscript` (ships `tree_sitter_objectscript`, `tree_sitter_objectscript_udl`, and `tree_sitter_objectscript_routine`)
- Rust crates:
  - `tree-sitter-objectscript` (UDL grammar)
  - `tree-sitter-objectscript-routine` (routine grammar)
  - `tree-sitter-objectscript-playground` (playground grammar)

## Bindings

Language bindings are available under `bindings/`:

- C: `bindings/c`
- Go: `bindings/go`
- Node.js: `bindings/node`
- Python: `bindings/python`
- Rust: `bindings/rust`, `bindings/rust-routine`, and `bindings/rust-playground`
- Swift: `bindings/swift`

Quick binding checks from repo root:

```bash
nvm use
npm ci
cargo test --lib --package tree-sitter-objectscript
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -U pip setuptools wheel pytest tree-sitter
python3 setup.py build_ext --inplace
PYTHONPATH=$PWD/bindings/python python3 -m pytest -q bindings/python/tests/test_binding.py
npm test
go test ./bindings/go/...
swift test
make test
```

For Node bindings specifically, `.nvmrc` pins the expected Node version.

## Editor Integration

- Zed: [ObjectScript extension](https://zed.dev/extensions/objectscript)
- Neovim (`nvim-treesitter`):
  - Install grammars with `:TSInstall objectscript_udl`, `:TSInstall objectscript`, and `:TSInstall objectscript_routine`
  - Optional filetype mapping for `.cls` and routine extensions:

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

- Emacs: [emacs-objectscript-ts-mode](https://github.com/intersystems/emacs-objectscript-ts-mode)

## Quick Development

Install the [tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html), then run commands from a grammar directory (`objectscript`, `udl`, `core`, `expr`, or `objectscript_routine`):

```bash
tree-sitter generate
tree-sitter test
tree-sitter build
```

For playground work:

```bash
tree-sitter build --wasm
tree-sitter playground
```

If you change an upstream grammar (`expr` or `core`), regenerate downstream grammars as needed (`udl`, `objectscript`, `objectscript_routine`).

## Corpus Sync

`objectscript/test/corpus` is treated as a synced corpus directory. On commit, the repository `pre-commit` hook:

- Replaces `objectscript/test/corpus` contents with files from:
  - `core/test/corpus`
  - `udl/test/corpus`
  - `objectscript_routine/test/corpus`
- Removes `objectscript/test/corpus/invalid.txt`
- Removes `objectscript/test/corpus/compiled-header.txt`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, query sync, and binding test instructions.

## References

- [InterSystems ObjectScript documentation](https://docs.intersystems.com/latest/csp/docbook/DocBook.UI.Page.cls?KEY=GCOS_intro)
- [Tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/)

## License

MIT. See [LICENSE](LICENSE).

[ci]: https://img.shields.io/github/actions/workflow/status/intersystems/tree-sitter-objectscript/ci.yml?logo=github&label=CI
[npm]: https://img.shields.io/npm/v/tree-sitter-objectscript?logo=npm
[crates-udl]: https://img.shields.io/crates/v/tree-sitter-objectscript?logo=rust
[crates-routine]: https://img.shields.io/crates/v/tree-sitter-objectscript-routine?logo=rust
[crates-playground]: https://img.shields.io/crates/v/tree-sitter-objectscript-playground?logo=rust
[pypi]: https://img.shields.io/pypi/v/tree-sitter-objectscript?logo=pypi&logoColor=ffd242
