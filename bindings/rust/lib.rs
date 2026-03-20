//! This crate provides ObjectScript Class and Routine language support for the [tree-sitter][] parsing library.
//!
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_objectscript_udl() -> *const ();
    fn tree_sitter_objectscript_routine() -> *const ();
}

/// The tree-sitter [`LanguageFn`] for ObjectScript UDL grammar.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT_UDL: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_udl) };

/// The content of the [`node-types.json`][] file for ObjectScript UDL grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const UDL_NODE_TYPES: &str = include_str!("../../udl/src/node-types.json");

/// The syntax highlighting query for ObjectScript UDL.
pub const UDL_HIGHLIGHTS_QUERY: &str = include_str!("../../udl/queries/highlights.scm");

/// The injections query for ObjectScript UDL.
pub const UDL_INJECTIONS_QUERY: &str = include_str!("../../udl/queries/injections.scm");

/// The indents query for ObjectScript UDL.
pub const UDL_INDENTS_QUERY: &str = include_str!("../../udl/queries/indents.scm");

/// The tree-sitter [`LanguageFn`] for ObjectScript Routine grammar.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT_ROUTINE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_routine) };

/// The content of the [`node-types.json`][] file for ObjectScript Routine grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const ROUTINE_NODE_TYPES: &str = include_str!("../../objectscript_routine/src/node-types.json");

/// The syntax highlighting query for ObjectScript Routines.
pub const ROUTINE_HIGHLIGHTS_QUERY: &str = include_str!("../../objectscript_routine/queries/highlights.scm");

/// The injections query for ObjectScript Routines.
pub const ROUTINE_INJECTIONS_QUERY: &str = include_str!("../../objectscript_routine/queries/injections.scm");

/// The indents query for ObjectScript Routines.
pub const ROUTINE_INDENTS_QUERY: &str = include_str!("../../objectscript_routine/queries/indents.scm");

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_objectscript_udl_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT_UDL.into())
            .expect("Error loading ObjectScript UDL parser");
    }


    #[test]
    fn test_iudl_ndents_query_is_loaded() {
        assert!(super::UDL_INDENTS_QUERY.contains("indent"));
    }

    #[test]
    fn test_udl_injections_query_is_loaded() {
        assert!(super::UDL_INJECTIONS_QUERY.contains("injection"));
    }

    #[test]
    fn test_udl_highlights_query_is_loaded() {
        assert!(super::UDL_HIGHLIGHTS_QUERY.contains("@keyword"));
    }

    #[test]
    fn test_can_load_objectscript_routine_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT_ROUTINE.into())
            .expect("Error loading ObjectScript UDL parser");
    }


    #[test]
    fn test_routine_indents_query_is_loaded() {
        assert!(super::ROUTINE_INDENTS_QUERY.contains("indent"));
    }

    #[test]
    fn test_routine_injections_query_is_loaded() {
        assert!(super::ROUTINE_INJECTIONS_QUERY.contains("injection"));
    }

    #[test]
    fn test_routine_highlights_query_is_loaded() {
        assert!(super::ROUTINE_HIGHLIGHTS_QUERY.contains("@keyword"));
    }
}
