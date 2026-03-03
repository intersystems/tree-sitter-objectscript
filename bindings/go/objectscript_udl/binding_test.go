package tree_sitter_objectscript_udl_test

import (
	"testing"

	tree_sitter_objectscript_udl "github.com/intersystems/tree-sitter-objectscript/bindings/go/objectscript_udl"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadObjectScriptUdlGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript_udl.LanguageObjectscriptUdl())
	if language == nil {
		t.Errorf("Error loading ObjectScript UDL grammar")
	}
}
