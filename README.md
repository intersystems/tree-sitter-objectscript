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
- `objectscript_routine`: routine-file grammar for `.mac`, `.inc`, `.rtn`, and `.int`.

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

The routine and playground Rust crates are staged from `bindings/rust-routine` and
`bindings/rust-playground` via helper scripts. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the current local build workflow.

For Node bindings specifically, `.nvmrc` pins the expected Node version.

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

## Query Sync

`scripts/sync_queries.py` manages the canonical query trio for each grammar:

- `highlights.scm`
- `indents.scm`
- `injections.scm`

It composes the layered query trees for `core`, `udl`, `objectscript`, and
`objectscript_routine`, then mirrors those composed files into the Python
binding query directories. 

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

## Editor Integration
- [Zed](zed.dev)
  On Zed, you can use `tree-sitter-objectscript` by downloading the [InterSystems ObjectScript extension](https://zed.dev/extensions/objectscript)
- [Neovim](https://neovim.io/)
  We currently have a [PR](https://github.com/nvim-treesitter/nvim-treesitter/pull/8587) open with `nvim-treesitter`, and if that gets merged in, the setup process will be automated. However, this repo is currently archived, so for now do the following to setup the grammars in neovim: 
  #### Step 1: Create `~/.config/nvim/lua/plugins/objectscript-treesitter.lua`
  Add the following content to that file: 
  **IMPORTANT: Make sure to replace the revision section with the commit that you want.**
  ```lua
  return {
  -- configure nvim-treesitter
  {
    "nvim-treesitter/nvim-treesitter",
    init = function()
      vim.filetype.add({
        extension = {
          cls = "objectscript_udl",
          mac = "objectscript_routine",
          inc = "objectscript_routine",
          int = "objectscript_routine",
          rtn = "objectscript_routine"
        },
      })

      vim.api.nvim_create_autocmd("FileType", {
        pattern = { "objectscript_udl", "objectscript_routine" },
        callback = function(args)
          vim.treesitter.start(args.buf)
        end,
      })

      vim.api.nvim_create_autocmd('User', { pattern = 'TSUpdate',
      callback = function()
      local parsers = require("nvim-treesitter.parsers")

        parsers.objectscript_udl = {
          install_info = {
            url = "https://github.com/intersystems/tree-sitter-objectscript",
            revision = "58450fe03f6fa51de38ac689fbf0af63f455494a", 
            location = "udl",
            queries = "udl/queries",
          }
        }

        parsers.objectscript = {
          install_info = {
            url = "https://github.com/intersystems/tree-sitter-objectscript",
            revision = "58450fe03f6fa51de38ac689fbf0af63f455494a", 
            location = "objectscript",
            queries = "objectscript/queries",
          }
        }

        parsers.objectscript_routine = {
          install_info = {
            url = "https://github.com/intersystems/tree-sitter-objectscript",
            revision = "58450fe03f6fa51de38ac689fbf0af63f455494a", 
            location = "objectscript_routine",
            queries = "objectscript_routine/queries",
          }
        }
      end})
    end,

      opts = function(_, opts)
        opts.ensure_installed = opts.ensure_installed or {}
        for _, lang in ipairs({ "objectscript_udl", "objectscript_routine", "objectscript" }) do
          if not vim.tbl_contains(opts.ensure_installed, lang) then
            table.insert(opts.ensure_installed, lang)
          end
        end
      end,
    },
  }
 
  ```

  #### Step 2: Create `~/.config/nvim/after/queries/xml/injections.scm`
  Add the following content to that file: 
  ```scheme
  ;; extends

  (
    element
      (STag (Name) @_start_tag)
      (content (CDSect (CData) @injection.content))
      (ETag (Name) @_end_tag)
    (#eq? @_start_tag "Implementation")
    (#eq? @_end_tag "Implementation")
    (#set! injection.language "objectscript")
  )
  (
    element
      (STag (Name) @_start_tag)
      (content (CharData) @injection.content)
      (ETag (Name) @_end_tag)
    (#eq? @_start_tag "Implementation")
    (#eq? @_end_tag "Implementation")
    (#set! injection.language "objectscript")
  )
  ```
  #### Step 3: Create `~/.config/nvim/queries/xml/highlights.scm`
  ```scheme
  ;; XML declaration

  "xml" @keyword

  [ "version" "encoding" "standalone" ] @property

  (EncName) @string.special

  (VersionNum) @number

  [ "yes" "no" ] @boolean

  ;; Processing instructions

  (PI) @embedded

  (PI (PITarget) @keyword)

  ;; Element declaration

  (elementdecl
    "ELEMENT" @keyword
    (Name) @tag)

  (contentspec
    (_ (Name) @property))

  "#PCDATA" @type.builtin

  [ "EMPTY" "ANY" ] @string.special.symbol

  [ "*" "?" "+" ] @operator

  ;; Entity declaration

  (GEDecl
    "ENTITY" @keyword
    (Name) @constant)

  (GEDecl (EntityValue) @string)

  (NDataDecl
    "NDATA" @keyword
    (Name) @label)

  ;; Parsed entity declaration

  (PEDecl
    "ENTITY" @keyword
    "%" @operator
    (Name) @constant)

  (PEDecl (EntityValue) @string)

  ;; Notation declaration

  (NotationDecl
    "NOTATION" @keyword
    (Name) @constant)

  (NotationDecl
    (ExternalID
      (SystemLiteral (URI) @string.special)))

  ;; Attlist declaration

  (AttlistDecl
    "ATTLIST" @keyword
    (Name) @tag)

  (AttDef (Name) @property)

  (AttDef (Enumeration (Nmtoken) @string))

  (DefaultDecl (AttValue) @string)

  [
    (StringType)
    (TokenizedType)
  ] @type.builtin

  (NotationType "NOTATION" @type.builtin)

  [
    "#REQUIRED"
    "#IMPLIED"
    "#FIXED"
  ] @attribute

  ;; Entities

  (EntityRef) @constant

  ((EntityRef) @constant.builtin
  (#any-of? @constant.builtin
    "&amp;" "&lt;" "&gt;" "&quot;" "&apos;"))

  (CharRef) @constant

  (PEReference) @constant

  ;; External references

  [ "PUBLIC" "SYSTEM" ] @keyword

  (PubidLiteral) @string.special

  (SystemLiteral (URI) @markup.link)

  ;; Processing instructions

  (XmlModelPI "xml-model" @keyword)

  (StyleSheetPI "xml-stylesheet" @keyword)

  (PseudoAtt (Name) @property)

  (PseudoAtt (PseudoAttValue) @string)

  ;; Doctype declaration

  (doctypedecl "DOCTYPE" @keyword)

  (doctypedecl (Name) @type)

  ;; Tags

  (STag (Name) @tag)

  (ETag (Name) @tag)

  (EmptyElemTag (Name) @tag)

  ;; Attributes

  (Attribute (Name) @property)

  (Attribute (AttValue) @string)

  ;; Delimiters & punctuation

  [
  "<?" "?>"
  "<!" "]]>"
  "<" ">"
  "</" "/>"
  ] @punctuation.delimiter

  [ "(" ")" "[" "]" ] @punctuation.bracket

  [ "\"" "'" ] @punctuation.delimiter

  [ "," "|" "=" ] @operator

  ;; Text

  (CharData) @markup

  (
    element
      (STag (Name) @_start_tag)
      (content (CDSect (CData) @injection.content))
      (ETag (Name) @_end_tag)
    (#eq? @_start_tag "Implementation")
    (#eq? @_end_tag "Implementation")
    (#set! priority 90)
  )

  (
    element
      (STag (Name) @_start_tag)
      (content (CharData) @injection.content)
      (ETag (Name) @_end_tag)
    (#eq? @_start_tag "Implementation")
    (#eq? @_end_tag "Implementation")
    (#set! priority 90)
  )

  (CDSect
    (CDStart) @markup.heading
    (CData) @markup.raw
    "]]>" @markup.heading)

  ;; Misc

  (Comment) @comment

  (ERROR) @error
  ```

  #### Step 4: Remove cached data from nvim if necessary (if previously installed)
  
  ```zsh
  rm -rf ~/.local/share/nvim/site/parser \
    ~/.local/share/nvim/site/parser-info \
    ~/.local/share/nvim/site/queries
  ```

  #### Step 5: Open Neovim and Install `objectscript_udl`, `objectscript_routine`, and `objectscript`
  ```vim
  :TSInstall objectscript_udl objectscript_routine objectscript
  ```

[ci]: https://img.shields.io/github/actions/workflow/status/intersystems/tree-sitter-objectscript/ci.yml?logo=github&label=CI
[npm]: https://img.shields.io/npm/v/tree-sitter-objectscript?logo=npm
[crates-udl]: https://img.shields.io/crates/v/tree-sitter-objectscript?logo=rust
[crates-routine]: https://img.shields.io/crates/v/tree-sitter-objectscript-routine?logo=rust
[crates-playground]: https://img.shields.io/crates/v/tree-sitter-objectscript-playground?logo=rust
[pypi]: https://img.shields.io/pypi/v/tree-sitter-objectscript?logo=pypi&logoColor=ffd242
