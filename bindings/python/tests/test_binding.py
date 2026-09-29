from unittest import TestCase
import tree_sitter
import tree_sitter_objectscript
import tree_sitter_objectscript_udl
import tree_sitter_objectscript_routine


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

    def test_can_load_objectscript_routine_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_objectscript_routine.language_objectscript_routine())
        except Exception:
            self.fail("Error loading objectscript routine grammar")

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

    def test_objectscript_routine_loads_and_has_queries(self):
        try:
            lang = tree_sitter.Language(tree_sitter_objectscript_routine.language_objectscript_routine())
            tree_sitter.Query(lang, tree_sitter_objectscript_routine.HIGHLIGHTS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript_routine.INJECTIONS_QUERY)
            tree_sitter.Query(lang, tree_sitter_objectscript_routine.INDENTS_QUERY)
        except Exception:
            self.fail("Error loading objectscript routine query files")

    def test_grammars_are_abi_15_and_load_under_the_declared_floor(self):
        # The generated parsers declare LANGUAGE_VERSION 15, which py-tree-sitter
        # only supports from 0.25 (the `abi_version` attribute itself only exists
        # from 0.25). Older releases fail to load them with "Incompatible Language
        # version 15", so the `core` extra pins tree-sitter>=0.25.
        for loader in (
            tree_sitter_objectscript.language_objectscript,
            tree_sitter_objectscript_udl.language_objectscript_udl,
            tree_sitter_objectscript_routine.language_objectscript_routine,
        ):
            self.assertEqual(tree_sitter.Language(loader()).abi_version, 15)
