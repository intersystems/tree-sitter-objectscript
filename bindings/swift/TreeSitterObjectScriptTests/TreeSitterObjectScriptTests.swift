import XCTest
import SwiftTreeSitter
import TreeSitterObjectScript

final class TreeSitterObjectScriptTests: XCTestCase {
    func testCanLoadObjectScriptGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_objectscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading ObjectScript grammar")
    }
}
