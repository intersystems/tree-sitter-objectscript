package tree_sitter_objectscript_test

import (
	"testing"

	tree_sitter_objectscript "github.com/intersystems/tree-sitter-objectscript/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadObjectScriptGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript.LanguageObjectscript())
	if language == nil {
		t.Errorf("Error loading Objectscript grammar")
	}
}

func TestCanLoadObjectScriptCoreGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript.LanguageObjectscriptCore())
	if language == nil {
		t.Errorf("Error loading ObjectScript Core grammar")
	}
}

func TestCanLoadObjectScriptUdlGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript.LanguageObjectscriptUdl())
	if language == nil {
		t.Errorf("Error loading ObjectScript Udl grammar")
	}
}

func TestCanLoadObjectScriptExprGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript.LanguageObjectscriptExpr())
	if language == nil {
		t.Errorf("Error loading ObjectScript Expr grammar")
	}
}

func TestCanLoadObjectScriptRoutineGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_objectscript.LanguageObjectscriptRoutine())
	if language == nil {
		t.Errorf("Error loading ObjectScript Routine grammar")
	}
}
