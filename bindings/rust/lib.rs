//! This crate provides Objectscript language support for the [tree-sitter][] parsing library.
//!
//! Typically, you will use the [LANGUAGE_OBJECTSCRIPT] function to add this language to a
//! tree-sitter [Parser][], and then use the parser to parse some code:
//!
//! ```
//! let code = r#"
//! Class Demo.Test
//! {
//!   ClassMethod Main()
//!   {
//!     set x = 42
//!   }
//! }
//! "#;
//! let mut parser = tree_sitter::Parser::new();
//! let language = tree_sitter_objectscript::LANGUAGE_OBJECTSCRIPT;
//! parser
//!     .set_language(&language.into())
//!     .expect("Error loading Objectscript parser");
//! let tree = parser.parse(code, None).unwrap();
//! assert!(!tree.root_node().has_error());
//! ```
//!
//! [Parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_objectscript() -> *const ();
    fn tree_sitter_objectscript_core() -> *const ();
    fn tree_sitter_objectscript_expr() -> *const ();

}

/// The tree-sitter [`LanguageFn`] for ObjectScript.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript) };
/// The tree-sitter [`LanguageFn`] for ObjectScript Core (routines).
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT_CORE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_core) };
/// The tree-sitter [`LanguageFn`] for ObjectScript Expressions.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT_EXPR: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_expr) };

/// The content of the [`node-types.json`][] file for ObjectScript.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const OBJECTSCRIPT_NODE_TYPES: &str = include_str!("../../udl/src/node-types.json");
/// The content of the [`node-types.json`][] file for ObjectScript Core (routines).
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const OBJECTSCRIPT_CORE_NODE_TYPES: &str = include_str!("../../core/src/node-types.json");
/// The content of the [`node-types.json`][] file for ObjectScript Expressions.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const OBJECTSCRIPT_EXPR_NODE_TYPES: &str = include_str!("../../expr/src/node-types.json");

/// The syntax highlighting query for ObjectScript.
pub const OBJECTSCRIPT_HIGHLIGHTS_QUERY: &str = concat!(
include_str!("../../expr/queries/highlights.scm"), "\n",
include_str!("../../core/queries/highlights.scm"), "\n",
include_str!("../../udl/queries/highlights.scm"),
);

/// The syntax highlighting query for ObjectScript Core (routines).
pub const OBJECTSCRIPT_CORE_HIGHLIGHTS_QUERY: &str = concat!(
include_str!("../../expr/queries/highlights.scm"), "\n",
include_str!("../../core/queries/highlights.scm")
);

/// The syntax highlighting query for ObjectScript Expressions.
pub const OBJECTSCRIPT_EXPR_HIGHLIGHTS_QUERY: &str = "../../expr/queries/highlights.scm";

/// The injections query for ObjectScript.
pub const OBJECTSCRIPT_INJECTIONS_QUERY: &str = concat!(
include_str!("../../core/queries/injections.scm"), "\n",
include_str!("../../udl/queries/injections.scm"),
);

/// The injections query for ObjectScript Core (routines).
pub const OBJECTSCRIPT_CORE_INJECTIONS_QUERY: &str = "../../core/queries/injections.scm";

/// The indents query for ObjectScript and ObjectScript Core (routines).
pub const OBJECTSCRIPT_INDENTS_QUERY: &str = "../../core/queries/indents.scm";

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_objectscript_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT.into())
            .expect("Error loading Objectscript parser");
    }

    #[test]
    fn test_can_load_objectscript_core_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT_CORE.into())
            .expect("Error loading Objectscript Core parser");
    }

    #[test]
    fn test_can_load_objectscript_expr_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT_EXPR.into())
            .expect("Error loading Objectscript Expr parser");
    }
}
