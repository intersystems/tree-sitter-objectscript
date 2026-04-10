# tree-sitter-objectscript-routine

ObjectScript routine grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

This crate publishes the `objectscript_routine` grammar for routine files like
`.mac`, `.inc`, `.int`, and `.rtn`.

It includes:

- `LANGUAGE_OBJECTSCRIPT_ROUTINE`
- `NODE_TYPES`
- `HIGHLIGHTS_QUERY`
- `STUDIO_HIGHLIGHTS_QUERY`
- `INJECTIONS_QUERY`
- `INDENTS_QUERY`

For class-file parsing (`objectscript_udl`), use the
`tree-sitter-objectscript` crate.

For playground/snippet parsing (`objectscript`), use the
`tree-sitter-objectscript-playground` crate.

See [docs.rs/tree-sitter-objectscript-routine](https://docs.rs/tree-sitter-objectscript-routine/latest/tree_sitter_objectscript_routine/)
for API details and examples.
