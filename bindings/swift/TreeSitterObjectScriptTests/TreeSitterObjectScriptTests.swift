import XCTest
import SwiftTreeSitter
import TreeSitterObjectScript
import TreeSitterObjectScriptExpr
import TreeSitterObjectScriptCore


final class TreeSitterObjectScriptTests: XCTestCase {
    func testCanLoadObjectScriptGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_objectscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ObjectScript grammar")
    }
    func testCanLoadObjectScriptCoreGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_objectscript_core())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ObjectScript Core grammar")
    }
    func testCanLoadObjectScriptExprGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_objectscript_expr())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ObjectScript Expr grammar")
    }
}
