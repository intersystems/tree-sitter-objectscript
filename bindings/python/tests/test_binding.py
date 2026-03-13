from unittest import TestCase
import tree_sitter
import tree_sitter_objectscript
import tree_sitter_objectscript_udl


class TestLanguage(TestCase):
    def test_can_load_objectscript_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_objectscript.language_objectscript())
        except Exception:
            self.fail("Error loading objectscript grammar")

    def test_can_load_objectscript_udl_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_objectscript_udl.language_objectscript_udl())
        except Exception:
            self.fail("Error loading objectscript UDL grammar")

    def test_objectscript_loads_and_has_queries(self):
        try:
            lang = tree_sitter.Language(tree_sitter_objectscript.language_objectscript())
            tree_sitter.Query(lang, tree_sitter_objectscript.HIGHLIGHTS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript.INJECTIONS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript.INDENTS_QUERY)
        except Exception:
            self.fail("Error loading objectscript query files")

    def test_objectscript_udl_loads_and_has_queries(self):
        try:
            lang = tree_sitter.Language(tree_sitter_objectscript_udl.language_objectscript_udl())
            tree_sitter.Query(lang, tree_sitter_objectscript_udl.HIGHLIGHTS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript_udl.INJECTIONS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript_udl.INDENTS_QUERY)
        except Exception:
            self.fail("Error loading objectscript UDL query files")
