package tree_sitter_objectscript_expr_test

import (
	"testing"

	tree_sitter_objectscript_expr "github.com/intersystems/tree-sitter-objectscript/bindings/go/objectscript_expr"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadObjectScriptExprGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript_expr.LanguageObjectscriptExpr())
	if language == nil {
		t.Errorf("Error loading ObjectScript Core grammar")
	}
}
