//! This crate provides Objectscript language support for the [tree-sitter][] parsing library.
//!
//! Typically, you will use the [LANGUAGE_OBJECTSCRIPT_UDL] function to add this language to a
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
//! let language = tree_sitter_objectscript::LANGUAGE_OBJECTSCRIPT_UDL;
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
    fn tree_sitter_objectscript_udl() -> *const ();
}

/// The tree-sitter [`LanguageFn`] for ObjectScript Playground.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT_PLAYGROUND: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript) };
/// The tree-sitter [`LanguageFn`] for ObjectScript UDL.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT_UDL: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_udl) };
/// The content of the [`node-types.json`][] file for ObjectScript.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const OBJECTSCRIPT_UDL_NODE_TYPES: &str = include_str!("../../udl/src/node-types.json");
/// The content of the [`node-types.json`][] file for ObjectScript Playground.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const OBJECTSCRIPT_PLAYGROUND_NODE_TYPES: &str = include_str!("../../objectscript/src/node-types.json");
/// The content of the [`node-types.json`][] file for ObjectScript Core (routines).
///

/// The syntax highlighting query for ObjectScript.
pub const OBJECTSCRIPT_HIGHLIGHTS_QUERY: &str = concat!(
include_str!("../../expr/queries/highlights.scm"), "\n",
include_str!("../../core/queries/highlights.scm"), "\n",
include_str!("../../udl/queries/highlights.scm"),
);

/// The injections query for ObjectScript.
pub const OBJECTSCRIPT_INJECTIONS_QUERY: &str = concat!(
include_str!("../../core/queries/injections.scm"), "\n",
include_str!("../../udl/queries/injections.scm"),
);

/// The indents query for ObjectScript.
pub const OBJECTSCRIPT_INDENTS_QUERY: &str =
    include_str!("../../core/queries/indents.scm");


#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_objectscript_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT_PLAYGROUND.into())
            .expect("Error loading Objectscript parser");
    }

    #[test]
    fn test_can_load_objectscript_udl_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT_UDL.into())
            .expect("Error loading Objectscript UDL parser");
    }

    #[test]
    fn test_indents_query_is_loaded() {
        assert!(super::OBJECTSCRIPT_INDENTS_QUERY.contains("indent"));
    }

    #[test]
    fn test_injections_query_is_loaded() {
        assert!(super::OBJECTSCRIPT_INJECTIONS_QUERY.contains("injection"));
    }

    #[test]
    fn test_highlights_query_is_loaded() {
        assert!(super::OBJECTSCRIPT_HIGHLIGHTS_QUERY.contains("@keyword"));
    }
}
