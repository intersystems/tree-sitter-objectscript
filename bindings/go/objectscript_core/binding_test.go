package tree_sitter_objectscript_core_test

import (
	"testing"

	tree_sitter_objectscript_core "github.com/intersystems/tree-sitter-objectscript/bindings/go/objectscript_core"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadObjectScriptCoreGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript_core.LanguageObjectscriptCore())
	if language == nil {
		t.Errorf("Error loading ObjectScript Core grammar")
	}
}
