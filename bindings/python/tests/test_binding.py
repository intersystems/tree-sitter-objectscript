from unittest import TestCase
import tree_sitter, tree_sitter_objectscript, tree_sitter_objectscript_core, tree_sitter_objectscript_expr


class TestLanguage(TestCase):
    def test_can_load_objectscript_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_objectscript.language_objectscript())
        except Exception:
            self.fail("Error loading objectscript grammar")

    def test_can_load_objectscript_core_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_objectscript_core.language_objectscript_core())
        except Exception:
            self.fail("Error loading objectscript core grammar")

    def test_can_load_objectscript_expr_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_objectscript_expr.language_objectscript_expr())
        except Exception:
            self.fail("Error loading objectscript expr grammar")

    def test_objectscript_loads_and_has_queries(self):
        try:
            lang = tree_sitter.Language(tree_sitter_objectscript.language_objectscript())
            tree_sitter.Query(lang, tree_sitter_objectscript.HIGHLIGHTS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript.INJECTIONS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript.INDENTS_QUERY)
        except Exception: 
            self.fail("Error loading objectscript query files")

        

    def test_core_loads_and_has_queries(self):
        try: 
            lang = tree_sitter.Language(tree_sitter_objectscript_core.language_objectscript_core())
            tree_sitter.Query(lang, tree_sitter_objectscript_core.HIGHLIGHTS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript_core.INJECTIONS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript_core.INDENTS_QUERY)
        except Exception: 
            self.fail("Error loading objectscript core query files")

    def test_expr_loads_and_has_queries(self):
        try: 
            lang = tree_sitter.Language(tree_sitter_objectscript_expr.language_objectscript_expr())
            tree_sitter.Query(lang, tree_sitter_objectscript_expr.HIGHLIGHTS_QUERY)
        except Exception: 
            self.fail("Error loading objectscript expr query files")
