package tree_sitter_objectscript_expr

// #cgo CPPFLAGS: -I../../../expr/src
// #cgo CFLAGS: -std=c11 -fPIC
// #include "../../../expr/src/parser.c"
import "C"

import "unsafe"

// Get the tree-sitter Language for this grammar.
func LanguageObjectscriptExpr() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_objectscript_expr())
}
