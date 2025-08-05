package tree_sitter_objectscript_expr_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/intersystems/tree-sitter-objectscript/expr"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript_expr.Language())
	if language == nil {
		t.Errorf("Error loading ObjectscriptExpr grammar")
	}
}
