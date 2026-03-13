# tree-sitter-objectscript

[![CI][ci]](https://github.com/intersystems/tree-sitter-objectscript/actions/workflows/ci.yml)
[![npm][npm]](https://www.npmjs.com/package/tree-sitter-objectscript)
[![crates-udl][crates-udl]](https://crates.io/crates/tree-sitter-objectscript)
[![crates-playground][crates-playground]](https://crates.io/crates/tree-sitter-objectscript-playground)
[![pypi][pypi]](https://pypi.org/project/tree-sitter-objectscript/)

Tree-sitter grammars for InterSystems ObjectScript.

## Grammars

This repository publishes four related grammars:

- `objectscript`: playground/snippet grammar.
- `objectscript_udl`: class-file grammar for `.cls`.
- `objectscript_core`: routine/statement grammar.
- `objectscript_expr`: expression grammar.

Grammar extension chain:
`objectscript -> objectscript_udl -> objectscript_core -> objectscript_expr`

## Packages

- npm: `tree-sitter-objectscript`
- PyPI: `tree-sitter-objectscript`
- Rust crates:
  - `tree-sitter-objectscript` (UDL grammar)
  - `tree-sitter-objectscript-playground` (playground grammar)

## Bindings

Language bindings are available under `bindings/`:

- C: `bindings/c`
- Go: `bindings/go`
- Node.js: `bindings/node`
- Python: `bindings/python`
- Rust: `bindings/rust` and `bindings/rust-playground`
- Swift: `bindings/swift`

Quick binding checks from repo root:

```bash
nvm use
npm install
cargo test --lib --package tree-sitter-objectscript
python3 -m pytest -q bindings/python/tests/test_binding.py
npm test
go test ./bindings/go/...
swift test
make test
```

For Node bindings specifically, `.nvmrc` pins the expected Node version.

## Editor Integration

- Zed: [ObjectScript extension](https://zed.dev/extensions/objectscript)
- Neovim (`nvim-treesitter`):
  - Install grammars with `:TSInstall objectscript_udl` and `:TSInstall objectscript`
  - Optional filetype mapping for `.cls`:

```lua
vim.filetype.add({
  extension = {
    cls = "objectscript_udl",
  },
})
```

- Emacs: [emacs-objectscript-ts-mode](https://github.com/intersystems/emacs-objectscript-ts-mode)

## Quick Development

Install the [tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html), then run commands from a grammar directory (`objectscript`, `udl`, `core`, or `expr`):

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

If you change an upstream grammar (`expr`, `core`, `udl`), regenerate downstream grammars as needed.

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
[crates-playground]: https://img.shields.io/crates/v/tree-sitter-objectscript-playground?logo=rust
[pypi]: https://img.shields.io/pypi/v/tree-sitter-objectscript?logo=pypi&logoColor=ffd242
