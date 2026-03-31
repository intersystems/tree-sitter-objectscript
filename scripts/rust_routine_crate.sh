#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/bindings/rust-routine"

usage() {
  cat <<USAGE
Usage:
  scripts/rust_routine_crate.sh stage <dest_dir>
  scripts/rust_routine_crate.sh package [-- <cargo package args>]
  scripts/rust_routine_crate.sh publish [-- <cargo publish args>]
USAGE
}

stage_routine_crate() {
  local dest="$1"

  mkdir -p "$dest/common" \
           "$dest/objectscript_routine/src/tree_sitter" \
           "$dest/objectscript_routine/queries"

  cp -f "$TEMPLATE_DIR/Cargo.toml" "$dest/Cargo.toml"
  cp -f "$TEMPLATE_DIR/build.rs" "$dest/build.rs"
  cp -f "$TEMPLATE_DIR/lib.rs" "$dest/lib.rs"

  cp -f "$ROOT_DIR/LICENSE" "$dest/LICENSE"
  cp -f "$ROOT_DIR/cargo_readme_routine.md" "$dest/cargo_readme_routine.md"

  cp -f "$ROOT_DIR/common/scanner.h" "$dest/common/scanner.h"
  cp -f "$ROOT_DIR/objectscript_routine/src/parser.c" "$dest/objectscript_routine/src/parser.c"
  cp -f "$ROOT_DIR/objectscript_routine/src/scanner.c" "$dest/objectscript_routine/src/scanner.c"
  cp -f "$ROOT_DIR/objectscript_routine/src/node-types.json" "$dest/objectscript_routine/src/node-types.json"
  cp -f "$ROOT_DIR/objectscript_routine/src/tree_sitter/parser.h" "$dest/objectscript_routine/src/tree_sitter/parser.h"

  cp -f "$ROOT_DIR/objectscript_routine/queries/highlights.scm" "$dest/objectscript_routine/queries/highlights.scm"
  cp -f "$ROOT_DIR/objectscript_routine/queries/indents.scm" "$dest/objectscript_routine/queries/indents.scm"
  cp -f "$ROOT_DIR/objectscript_routine/queries/injections.scm" "$dest/objectscript_routine/queries/injections.scm"
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
    stage_routine_crate "$dest"
    echo "$dest"
    ;;
  package|publish)
    args=("$@")
    if [[ ${#args[@]} -gt 0 && "${args[0]}" == "--" ]]; then
      args=("${args[@]:1}")
    fi

    tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/tsroutine.XXXXXX")"
    cleanup() {
      rm -rf "$tmpdir"
    }
    trap cleanup EXIT

    stage_routine_crate "$tmpdir"

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
