package tree_sitter_objectscript_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/intersystems/tree-sitter-objectscript"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript.Language())
	if language == nil {
		t.Errorf("Error loading ObjectScript grammar")
	}
}
