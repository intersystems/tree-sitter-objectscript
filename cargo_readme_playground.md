# tree-sitter-objectscript-playground

ObjectScript playground/snippet grammar for
[tree-sitter](https://github.com/tree-sitter/tree-sitter).

This crate publishes the `objectscript` playground grammar. It is useful when
parsing standalone ObjectScript snippets (commands, class members, fragments)
instead of full `.cls` files.

It includes:

- `LANGUAGE_OBJECTSCRIPT` (and `LANGUAGE_OBJECTSCRIPT_PLAYGROUND` alias)
- `OBJECTSCRIPT_NODE_TYPES` (and `OBJECTSCRIPT_PLAYGROUND_NODE_TYPES` alias)
- Query constants for highlights, injections, and indents

For full class-file parsing (`objectscript_udl`), use:
`tree-sitter-objectscript`.
