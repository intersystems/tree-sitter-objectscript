package tree_sitter_objectscript

// #cgo CPPFLAGS: -I../../objectscript_routine/src
// #cgo CFLAGS: -std=c11 -fPIC
// #include "../../objectscript_routine/src/parser.c"
// #include "../../objectscript_routine/src/scanner.c"
import "C"

import "unsafe"

// Get the tree-sitter Language for this grammar.
func LanguageObjectscriptRoutine() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_objectscript_routine())
}
