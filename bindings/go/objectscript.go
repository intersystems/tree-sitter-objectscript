package tree_sitter_objectscript

// #cgo CPPFLAGS: -I../../udl/src
// #cgo CFLAGS: -std=c11 -fPIC
// #include "../../udl/src/parser.c"
// #include "../../udl/src/scanner.c"
import "C"

import "unsafe"

// Get the tree-sitter Language for this grammar.
func LanguageObjectscript() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_objectscript())
}
