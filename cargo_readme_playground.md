# tree-sitter-objectscript-playground

ObjectScript playground/snippet grammar for
[tree-sitter](https://github.com/tree-sitter/tree-sitter).

This crate publishes the `objectscript` playground grammar. It is useful when
parsing standalone ObjectScript snippets (commands, class members, fragments)
instead of full `.cls` files.

It includes:

- `LANGUAGE_OBJECTSCRIPT`
- `NODE_TYPES`
- `HIGHLIGHTS_QUERY`
- `INJECTIONS_QUERY`
- `INDENTS_QUERY`

For full class-file parsing (`objectscript_udl`), use the 
`tree-sitter-objectscript` crate.

For full routine parsing (`objectscript_routine`), use the
`tree-sitter-objectscript-routine` crate.
