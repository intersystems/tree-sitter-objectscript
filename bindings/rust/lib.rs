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
//! [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
//! [language func]: fn.language.html
//! [Parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_objectscript() -> *const ();
}

/// The tree-sitter [`LanguageFn`] for ObjectScript.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript) };

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const OBJECTSCRIPT_NODE_TYPES: &str = include_str!("../../udl/src/node-types.json");

/// The syntax highlighting query for ObjectScript.
pub const HIGHLIGHTS_QUERY: &str = concat!(
include_str!("../../expr/queries/highlights.scm"), "\n",
include_str!("../../core/queries/highlights.scm"), "\n",
include_str!("../../udl/queries/highlights.scm"),
);

/// The symbol tagging query for ObjectScript.
pub const TAGS_QUERY: &str = concat!(
include_str!("../../expr/queries/tags.scm"), "\n",
include_str!("../../core/queries/tags.scm"), "\n",
include_str!("../../udl/queries/tags.scm"),
);

/// INJECTIONS
pub const INJECTIONS_QUERY: &str = concat!(
include_str!("../../core/queries/injections.scm"), "\n",
include_str!("../../udl/queries/injections.scm"),
);

/// indentation
pub const INDENTS_QUERY: &str = concat!(
include_str!("../../core/queries/indents.scm"), "\n",
include_str!("../../udl/queries/indents.scm"),
);

/// The local var syntax highlighting query for ObjectScript.
pub const LOCALS_QUERY: &str = concat!(
include_str!("../../expr/queries/locals.scm"), "\n",
include_str!("../../core/queries/locals.scm"), "\n",
include_str!("../../udl/queries/locals.scm"),
);

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT.into())
            .expect("Error loading Objectscript parser");
    }
}
