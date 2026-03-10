# tree-sitter-objectscript

ObjectScript Grammars for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

This crate provides ObjectScript UDL and ObjectScript Playground (any valid objectscript command, class, or class statement) language support for the tree-sitter parsing library.

There are two grammars: 
1. **objectscript_udl** - this is the udl (classes and routines) grammar. This extends the `objectscript_core` and `objectscript_expr` grammars, and should be used for .cls files.
1. **objectscript**: this grammar extends `objectscript_udl`, and is meant to be used for highlighting valid objectscript classes, statements, methods etc on their own. 

See [docs.rs](https://docs.rs/tree-sitter-objectscript/latest/tree_sitter_objectscript/) 
for information on how to access the languages and their associated query files. 

