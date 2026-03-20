import XCTest
import SwiftTreeSitter
import TreeSitterObjectScript
import TreeSitterObjectScriptUDL
import TreeSitterObjectScriptExpr
import TreeSitterObjectScriptCore
import TreeSitterObjectScriptRoutine


final class TreeSitterObjectScriptTests: XCTestCase {
    func testCanLoadObjectScriptGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_objectscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ObjectScript grammar")
    }
    func testCanLoadObjectScriptUdlGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_objectscript_udl())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ObjectScript UDL grammar")
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
    func testCanLoadObjectScriptRoutineGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_objectscript_routine())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ObjectScript Routine grammar")
    }
}
