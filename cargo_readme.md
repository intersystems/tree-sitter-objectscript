# tree-sitter-objectscript

ObjectScript Grammars for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

This crate provides ObjectScript, ObjectScript Core (routines), and ObjectScript Expr (expressions) language support for the tree-sitter parsing library.

There are three grammars: 
1. **objectscript** - this is the overall grammar. This extends the other
two grammars, and should be used for .cls files.
2. **objectscript_core**: Represents ObjectScript "routine" syntax.
3. **objectscript_expr**: Represents ObjectScript expressions.

See [docs.rs](https://docs.rs/tree-sitter-objectscript/latest/tree_sitter_objectscript/) 
for information on how to access the languages and their associated query files. 

