#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/bindings/rust-playground"

usage() {
  cat <<USAGE
Usage:
  scripts/rust_playground_crate.sh stage <dest_dir>
  scripts/rust_playground_crate.sh package [-- <cargo package args>]
  scripts/rust_playground_crate.sh publish [-- <cargo publish args>]
USAGE
}

stage_playground_crate() {
  local dest="$1"

  mkdir -p "$dest/common" \
           "$dest/objectscript/src/tree_sitter" \
           "$dest/udl/queries"

  cp -f "$TEMPLATE_DIR/Cargo.toml" "$dest/Cargo.toml"
  cp -f "$TEMPLATE_DIR/build.rs" "$dest/build.rs"
  cp -f "$TEMPLATE_DIR/lib.rs" "$dest/lib.rs"

  cp -f "$ROOT_DIR/LICENSE" "$dest/LICENSE"
  cp -f "$ROOT_DIR/cargo_readme_playground.md" "$dest/cargo_readme_playground.md"

  cp -f "$ROOT_DIR/common/scanner.h" "$dest/common/scanner.h"
  cp -f "$ROOT_DIR/objectscript/src/parser.c" "$dest/objectscript/src/parser.c"
  cp -f "$ROOT_DIR/objectscript/src/scanner.c" "$dest/objectscript/src/scanner.c"
  cp -f "$ROOT_DIR/objectscript/src/node-types.json" "$dest/objectscript/src/node-types.json"
  cp -f "$ROOT_DIR/objectscript/src/tree_sitter/parser.h" "$dest/objectscript/src/tree_sitter/parser.h"

  cp -f "$ROOT_DIR/udl/queries/highlights.scm" "$dest/udl/queries/highlights.scm"
  cp -f "$ROOT_DIR/udl/queries/indents.scm" "$dest/udl/queries/indents.scm"
  cp -f "$ROOT_DIR/udl/queries/injections.scm" "$dest/udl/queries/injections.scm"
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

cmd="$1"
shift

case "$cmd" in
  stage)
    if [[ $# -ne 1 ]]; then
      usage
      exit 1
    fi
    dest="$1"
    rm -rf "$dest"
    mkdir -p "$dest"
    stage_playground_crate "$dest"
    echo "$dest"
    ;;
  package|publish)
    args=("$@")
    if [[ ${#args[@]} -gt 0 && "${args[0]}" == "--" ]]; then
      args=("${args[@]:1}")
    fi

    tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/tsplayground.XXXXXX")"
    cleanup() {
      rm -rf "$tmpdir"
    }
    trap cleanup EXIT

    stage_playground_crate "$tmpdir"

    if [[ "$cmd" == "package" ]]; then
      cargo package --manifest-path "$tmpdir/Cargo.toml" "${args[@]}"
    else
      cargo publish --manifest-path "$tmpdir/Cargo.toml" "${args[@]}"
    fi
    ;;
  *)
    usage
    exit 1
    ;;
esac
