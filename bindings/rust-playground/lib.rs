//! This crate provides ObjectScript playground language support for the [tree-sitter][] parsing library.
//!
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_objectscript() -> *const ();
}

/// The tree-sitter [`LanguageFn`] for ObjectScript playground grammar.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript) };

/// The content of the [`node-types.json`][] file for ObjectScript playground grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const NODE_TYPES: &str = include_str!("objectscript/src/node-types.json");

/// The syntax highlighting query for ObjectScript.
pub const HIGHLIGHTS_QUERY: &str = include_str!("udl/queries/highlights.scm");

/// The injections query for ObjectScript.
pub const INJECTIONS_QUERY: &str = include_str!("udl/queries/injections.scm");

/// The indents query for ObjectScript.
pub const INDENTS_QUERY: &str = include_str!("udl/queries/indents.scm");

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_objectscript_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT.into())
            .expect("Error loading ObjectScript parser");
    }

    #[test]
    fn test_indents_query_is_loaded() {
        assert!(super::INDENTS_QUERY.contains("indent"));
    }

    #[test]
    fn test_injections_query_is_loaded() {
        assert!(super::INJECTIONS_QUERY.contains("injection"));
    }

    #[test]
    fn test_highlights_query_is_loaded() {
        assert!(super::HIGHLIGHTS_QUERY.contains("@keyword"));
    }
}
