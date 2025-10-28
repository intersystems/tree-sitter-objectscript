package tree_sitter_objectscript_core

// #cgo CPPFLAGS: -I../../../core/src
// #cgo CFLAGS: -std=c11 -fPIC
// #include "../../../core/src/parser.c"
// #include "../../../core/src/scanner.c"
import "C"

import "unsafe"

// Get the tree-sitter Language for this grammar.
func LanguageObjectscriptCore() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_objectscript_core())
}
