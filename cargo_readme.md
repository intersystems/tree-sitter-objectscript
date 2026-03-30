# tree-sitter-objectscript

ObjectScript UDL + routine grammars for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

This crate publishes:

For UDL (`objectscript_udl`, intended for `.cls`):
- `LANGUAGE_OBJECTSCRIPT_UDL`
- `UDL_NODE_TYPES`
- `UDL_HIGHLIGHTS_QUERY`
- `UDL_INJECTIONS_QUERY`
- `UDL_INDENTS_QUERY`

For routine headers/files (`objectscript_routine`, for `.mac`, `.inc`, `.int`, `.rtn`):
- `LANGUAGE_OBJECTSCRIPT_ROUTINE`
- `ROUTINE_NODE_TYPES`
- `ROUTINE_HIGHLIGHTS_QUERY`
- `ROUTINE_INJECTIONS_QUERY`
- `ROUTINE_INDENTS_QUERY`

If you want the playground/snippet grammar (`objectscript`), use
`tree-sitter-objectscript-playground`.

See [docs.rs/tree-sitter-objectscript](https://docs.rs/tree-sitter-objectscript/latest/tree_sitter_objectscript/)
for API details and examples.
