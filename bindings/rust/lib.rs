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
//! ```
//! let code = r#"
//!  if 1 set x = 3 set set = 3
//!  if 1 { set x = 3 } else { w 2 }
//!  set x = 3
//! "#;
//! 
//! let mut parser = tree_sitter::Parser::new();
//! let language = tree_sitter_objectscript::LANGUAGE_OBJECTSCRIPT_CORE;
//! parser
//!     .set_language(&language.into())
//!     .expect("Error loading Objectscript Core parser");
//! let tree = parser.parse(code, None).unwrap();
//! assert!(!tree.root_node().has_error());
//! 
//! ```
//! 
//! ```
//! let code = r#"
//!  $CASE($P($ZE,">",1)_">", "<INTERRUPT>":"KeyboardInterrupt", "<SYNTAX>":"TypeError", :"RuntimeError")
//! "#;
//! 
//! let mut parser = tree_sitter::Parser::new();
//! let language = tree_sitter_objectscript::LANGUAGE_OBJECTSCRIPT_EXPR;
//! parser
//!     .set_language(&language.into())
//!     .expect("Error loading Objectscript Expr parser");
//! let tree = parser.parse(code, None).unwrap();
//! assert!(!tree.root_node().has_error());
//! 
//! ```
//! [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
//! [language func]: fn.language.html
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
pub const LANGUAGE_OBJECTSCRIPT_CORE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_core) };
pub const LANGUAGE_OBJECTSCRIPT_EXPR: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_expr) };

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const OBJECTSCRIPT_NODE_TYPES: &str = include_str!("../../udl/src/node-types.json");
pub const OBJECTSCRIPT_CORE_NODE_TYPES: &str = include_str!("../../core/src/node-types.json");
pub const OBJECTSCRIPT_EXPR_NODE_TYPES: &str = include_str!("../../expr/src/node-types.json");

/// The syntax highlighting query for ObjectScript.
pub const OBJECTSCRIPT_HIGHLIGHTS_QUERY: &str = concat!(
include_str!("../../expr/queries/highlights.scm"), "\n",
include_str!("../../core/queries/highlights.scm"), "\n",
include_str!("../../udl/queries/highlights.scm"),
);

/// The syntax highlighting query for ObjectScript Core.
pub const OBJECTSCRIPT_CORE_HIGHLIGHTS_QUERY: &str = concat!(
include_str!("../../expr/queries/highlights.scm"), "\n",
include_str!("../../core/queries/highlights.scm")
);

/// The syntax highlighting query for ObjectScript Expr.
pub const OBJECTSCRIPT_EXPR_HIGHLIGHTS_QUERY: &str = "../../expr/queries/highlights.scm";

/// The symbol tagging query for ObjectScript.
pub const OBJECTSCRIPT_TAGS_QUERY: &str = concat!(
include_str!("../../expr/queries/tags.scm"), "\n",
include_str!("../../core/queries/tags.scm"), "\n",
include_str!("../../udl/queries/tags.scm"),
);

/// The symbol tagging query for ObjectScript Core.
pub const OBJECTSCRIPT_CORE_TAGS_QUERY: &str = concat!(
include_str!("../../expr/queries/tags.scm"), "\n",
include_str!("../../core/queries/tags.scm"));

/// The symbol tagging query for ObjectScript Expr.
pub const OBJECTSCRIPT_EXPR_TAGS_QUERY: &str = "../../expr/queries/tags.scm";

/// Injections for ObjectScript.
pub const OBJECTSCRIPT_INJECTIONS_QUERY: &str = concat!(
include_str!("../../core/queries/injections.scm"), "\n",
include_str!("../../udl/queries/injections.scm"),
);

/// Injections for ObjectScript Core.
pub const OBJECTSCRIPT_CORE_INJECTIONS_QUERY: &str = "../../core/queries/injections.scm";

/// Indentation for ObjectScript.
pub const INDENTS_QUERY: &str = concat!(
include_str!("../../core/queries/indents.scm"), "\n",
include_str!("../../udl/queries/indents.scm"),
);

/// Indentation for ObjectScript Core.
pub const OBJECTSCRIPT_CORE_INDENTS_QUERY: &str = "../../core/queries/indents.scm";

/// The local var syntax highlighting query for ObjectScript.
pub const LOCALS_QUERY: &str = concat!(
include_str!("../../expr/queries/locals.scm"), "\n",
include_str!("../../core/queries/locals.scm"), "\n",
include_str!("../../udl/queries/locals.scm"),
);

/// The local var syntax highlighting query for ObjectScript Core.
pub const OBJECTSCRIPT_CORE_LOCALS_QUERY: &str = concat!(
include_str!("../../expr/queries/locals.scm"), "\n",
include_str!("../../core/queries/locals.scm")
);

/// The local var syntax highlighting query for ObjectScript Expr.
pub const OBJECTSCRIPT_EXPR_LOCALS_QUERY: &str = "../../expr/queries/locals.scm";

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
