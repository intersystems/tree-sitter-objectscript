//! This crate provides ObjectScript routine language support for the [tree-sitter][] parsing library.
//!
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_objectscript_routine() -> *const ();
}

/// The tree-sitter [`LanguageFn`] for ObjectScript routine grammar.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE_OBJECTSCRIPT_ROUTINE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_objectscript_routine) };

/// The content of the [`node-types.json`][] file for ObjectScript routine grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const NODE_TYPES: &str = include_str!("objectscript_routine/src/node-types.json");

/// The syntax highlighting query for ObjectScript routine grammar.
pub const HIGHLIGHTS_QUERY: &str = include_str!("objectscript_routine/queries/highlights.scm");

/// The syntax highlighting query for ObjectScript routines (Studio Version).
pub const STUDIO_HIGHLIGHTS_QUERY: &str = include_str!("objectscript_routine/queries/studio-highlights.scm");

/// The injections query for ObjectScript routine grammar.
pub const INJECTIONS_QUERY: &str = include_str!("objectscript_routine/queries/injections.scm");

/// The indents query for ObjectScript routine grammar.
pub const INDENTS_QUERY: &str = include_str!("objectscript_routine/queries/indents.scm");

#[cfg(test)]
mod tests {
    use tree_sitter::{Parser, Point, Node};
    pub fn dump(node: Node, depth: usize) {
    let indent = "  ".repeat(depth);
    let start = node.start_position();
    let end = node.end_position();

    println!(
        "{}{} [{}, {}] - [{}, {}]",
        indent,
        node.kind(),
        start.row,
        start.column,
        end.row,
        end.column
    );

    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        dump(child, depth + 1);
    }
}
    fn parse_cls(code: &str) -> tree_sitter::Tree {
        let mut parser = Parser::new();
        parser
            .set_language(&super::LANGUAGE_OBJECTSCRIPT_ROUTINE.into())
            .expect("failed to load objectscript routine grammar");
        parser.parse(code, None).expect("parse returned None")
    }
    
    #[test]
    fn test_can_load_objectscript_routine_grammar() {
        
        // let mut parser = tree_sitter::Parser::new();
        // parser
        //     .set_language(&super::LANGUAGE_OBJECTSCRIPT_ROUTINE.into())
        //     .expect("Error loading ObjectScript routine parser");
        let source = r#"ROUTINE x
heyyy() methodimpl {
    w "hi"
    set x = 2
    if x {
        w "bye"
        q
    }
}
"#;
        let tree = parse_cls(source);
        dump(tree.root_node(), 0);
        // println!("TREE NODE {:?}", tree.root_node().named_child(0))
        
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
