package tree_sitter_objectscript_udl_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/intersystems/tree-sitter-objectscript/udl"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript_udl.Language())
	if language == nil {
		t.Errorf("Error loading ObjectscriptUdl grammar")
	}
}
