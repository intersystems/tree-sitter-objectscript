# tree-sitter-objectscript

A tree-sitter parser for InterSystems ObjectScript.

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

## Introduction

This project provides a [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [InterSystems ObjectScript](https://docs.intersystems.com/latest/csp/docbook/DocBook.UI.Page.cls?KEY=GCOS_intro), enabling fast and precise syntax parsing for use in code editors, linters, and developer tooling.

**Tree-sitter** is a powerful parser generator and incremental parsing library widely used in modern development environments to deliver real-time syntax highlighting, structural editing, and code analysis. It constructs concrete syntax trees quickly and efficiently, even as code changes.

**InterSystems ObjectScript** is a dynamic, multi-paradigm programming language that combines procedural and object-oriented approaches with novel multi-model data access features for key-value, SQL, Object and Document stores. It is the core language for the InterSystems IRIS Data Platform, particularly well-known in mission-critical applications in healthcare, financial services, and other data-intensive domains.

The grammar currently integrates with these editors:
- [zed.dev](#zeddev)
- [neovim](#neovim-nvim-treesitter)
- [emacs](#emacs)

Given the polyglot nature of ObjectScript `.cls` files, it's recommended to ensure the following tree-sitter grammars are installed and available for injection:

- SQL
- HTML
- Python
- JavaScript
- CSS
- XML
- Markdown

## Screenshots

### Zed
![Screenshot of syntax highlighting in Zed](assets/zed-screenshot.png)

### Neovim
![Screenshot of syntax highlighting in Neovim](assets/nvim-screenshot.png)


## Editor Integrations

### zed.dev

Integration with the Zed editor is done as a [Zed Extension for ObjectScript](https://zed.dev/extensions/objectscript).  You can install from that page, or alternately use `zed: extensions` in the command panel to access the Extensions tab, from there just search for ObjectScript and click install.

### Neovim (nvim-treesitter)

**NOTE:** The normal process for nvim-treesitter integration is for the grammar author to fork nvim-treesitter, add a few lines to make the grammar known and submit a PR, after which it's just a simple question of `TSInstall ...`.  However, as of writing, the nvim-treesitter project has archived it's main branch and isn't taking PRs while they rewrite the project.

At some point when they've completed that work, we'll integrate this directly, but in the meantime, you need to follow the manual steps outlined below.

#### Pre-requisites

Before using, you need to have [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) plugin installed with your favorite
package manager, here we use LazyVim.

#### Configuration

Add the following to `init.lua`, or, in the case you are using LazyVim, to your `config/autocmds.lua` file.

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.objectscript_udl = {
  install_info = {
    url = "https://github.com/intersystems/tree-sitter-objectscript",
    files = { "src/parser.c", "src/scanner.c" }, 
    branch = "main",
    location = "udl",
  },
}
vim.filetype.add({
  extension = {
    cls = "objectscript_udl",
  },
})
vim.treesitter.language.register("objectscript_udl", "objectscript_udl") 
```

You will need to copy in the `*.scm` files, these go into the nvim-data directory which depends on if you're using Windows or UNIX
(and if you're using LazyVim or another package manager).

The best place to get these currently is https://github.com/intersystems/zed-objectscript/languages/objectscript_udl/*.scm and 
copy them into:

* UNIX: `~/.local/share/nvim/lazy/nvim-treesitter/queries/objectscript_udl/...`
* Windows: `%USERPROFILE%\Local\nvim-data\lazy\nvim-treesitter\queries\objectscript_udl\...`

#### Installation

Open a new instance of NeoVim and type `:TSInstall objectscript_udl` to install the tree-sitter-objectscript parser.  After this completes you should be able to open `*.cls` files.  If no coloring shows up, it probably means you haven't copied the `*.scm` files as described above.

**NOTE**: On Windows, if the parser is currently in-use, nvim-treesitter will fail to update it; simply exit any nvim sessions and start a new one to redo the `:TSInstall objectscript_udl` command.

#### Testing

Open up a .cls file in NeoVim:
```bash
~ $ nvim foo.cls
```
Highlighting should be automatic. If not, use `:TSBufEnable highlight`.

### Emacs

For Emacs 29.1 or later, we've implemented a [major mode for ObjectScript](https://github.com/intersystems/emacs-objectscript-ts-mode) using Emacs' built in tree-sitter support.  Follow the installation & setup instructions there.

## Reporting Issues

Please report issues via [GitHub Issues](https://github.com/intersystems/tree-sitter-objectscript/issues).

## Contributing

Contributions are welcome. Please submit changes via Pull Requests. Our preference is to use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages in order to keep the summaries terse, but allowing for more detail on the subsequent lines of the commit message.

### Project Overview

There are three main grammars in this repository:

- **expr**: Handles ObjectScript expressions.
- **core**: Core ObjectScript "routine" syntax (e.g., lines of code).
- **udl**: Grammar for the `.cls` files that IRIS uses for storing ObjectScript classes.

UDL is the grammar for the `.cls` files and extends the `core` grammar that represents one or more lines/statements of ObjectScript.  The `core` grammar similarly extends the `expr` grammar.

The reason behind the multiple grammar architecture is that there are cases where we need to inject ObjectScript
expressions as well as lines of ObjectScript into other grammars (see future work below).  Although it adds a little bit of complexity, it does promote reuse, for example a IRIS specific dialect of SQL could extend the stock SQL grammar and use tree-sitter injections to handle the ObjectScript extensions.

### Getting Started

You'll need to install the [tree-sitter-cli](https://github.com/tree-sitter/tree-sitter/blob/master/crates/cli/README.md) tooling (best done via your local package manager, e.g. homebrew on macOS, scoop on Windows).

Since there are three parsers, you'll need to cd into the directory containing the one you want to work on.

#### Build the Parser(s)

From the parser directory, generate the state machines from the grammar and compile the native parser:
```bash
tree-sitter generate
tree-sitter build
```

**NOTE**: Use `tree-sitter --wasm` when using the playground to test the grammar.

#### Running Tests

Tree-sitter has a built-in test runner:
```bash
tree-sitter test
```
Test cases live under `test/corpus`, where each file contains sample ObjectScript code and the expected parse tree.

#### Playground

Tree-sitter comes with a "playground" that allows you to test your grammar changes, visualize the AST as well as try out queries.

```bash
tree-sitter playground
```

This will start up a web browser running the playground with the .wasm built from the grammar using `tree-sitter build --wasm`.

#### Iterating on Changes

1. Edit grammar definitions (e.g., `grammar.js` and related files).
2. Rebuild and test:
   ```bash
   tree-sitter generate
   tree-sitter build
   tree-sitter test
   ```
3. Update or add cases in `test/corpus` as needed.
4. Repeat until all tests pass.

**NOTE**: Since `udl` extends `core` which extends `expr`, if you make changes to the "upstream" grammars, you'll need to regenerate/rebuild the downstream one(s).

## License

This project provided as-is and is licensed under the MIT License.

## Future Work

Future plans include creating a grammar for CSP by extending HTML and injecting `expr` and `core` grammar elements
to support `#(<expr>)#` and `<script language="cache" runat=server>...</script>` blocks of ObjectScript.

