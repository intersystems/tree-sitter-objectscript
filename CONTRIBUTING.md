# Contributing

Thanks for contributing to `tree-sitter-objectscript`.

## Prerequisites

- `tree-sitter` CLI `0.26.6`
- Node.js `22` and npm `>=10` (`nvm use`)
- Rust toolchain (`cargo`)
- Python `>=3.9`
- Optional: Go and Swift toolchains for binding tests

## Repository Layout

- `objectscript/`: playground/snippet grammar
- `udl/`: `.cls` grammar
- `core/`: routine/statement grammar
- `expr/`: expression grammar

Grammar chain:
`objectscript -> objectscript_udl -> objectscript_core -> objectscript_expr`

## Grammar Workflow

Run from the grammar directory you are changing:

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

If you modify an upstream grammar (`expr`, `core`, or `udl`), regenerate and retest downstream grammars.

## Query Sync and Git Hooks

One-time setup after cloning:

```bash
make installhooks
```

What this does:

- Sets `core.hooksPath` to `.githooks`
- Installs and enables the repository `pre-commit` hook

Verify hook setup:

```bash
git config --get core.hooksPath
ls -l .githooks/pre-commit
```

Expected:

- `core.hooksPath` prints `.githooks`
- `.githooks/pre-commit` is executable

Hook behavior:

- On commit, the `pre-commit` hook runs `python3 scripts/sync_queries.py` when query-related files are staged.
- If query files are updated, the hook stages those changes automatically.

Manual query commands:

```bash
make syncqueries
make query
```

## Binding Tests

Run from repository root.

- Rust (UDL crate):

```bash
cargo test --lib --package tree-sitter-objectscript
```

- Python:

```bash
python3 -m pip install -e .
python3 -m pytest -q bindings/python/tests/test_binding.py
```

- Node:

```bash
nvm use
npm install
npm test
```

Use `nvm use` first so your shell switches to the repository version from `.nvmrc`.

- Go:

```bash
go test ./bindings/go/...
```

- Swift:

```bash
swift test
```

- C:

```bash
make test
```

## Pull Requests

- Keep generated parser/query artifacts in sync with grammar changes.
- Add or update corpus tests for behavior changes.
- Prefer [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages.
- Open PRs against this repository and include a concise change summary.

## Issues

Report bugs and feature requests via [GitHub Issues](https://github.com/intersystems/tree-sitter-objectscript/issues).
