package tree_sitter_objectscript_test

import (
	"testing"

	tree_sitter_objectscript "github.com/intersystems/tree-sitter-objectscript/bindings/go/objectscript"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadObjectScriptGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript.LanguageObjectscript())
	if language == nil {
		t.Errorf("Error loading ObjectScript grammar")
	}
}
