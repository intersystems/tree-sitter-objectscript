from unittest import TestCase

import tree_sitter, tree_sitter_objectscript


class TestLanguage(TestCase):
    def test_can_load_typescript_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_objectscript.language_objectscript())
        except Exception:
            self.fail("Error loading TypeScript grammar")
