package tree_sitter_objectscript_core_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/intersystems/tree-sitter-objectscript/core"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript_core.Language())
	if language == nil {
		t.Errorf("Error loading ObjectscriptCore grammar")
	}
}
