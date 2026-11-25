#include "tree_sitter/parser.h"
#include <string.h>
#include "../../common/expr-scanner.h"

static bool ObjectScript_Expr_Scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    (void)payload;
    if (valid_symbols[SENTINEL]) {
        return false;
    }
    if (valid_symbols[STATEMENT_IN_MACRO]) {
        return lex_macro_statement(lexer);
    } return false;
}
void *tree_sitter_objectscript_expr_external_scanner_create() {
    return NULL;
}

bool tree_sitter_objectscript_expr_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  return ObjectScript_Expr_Scanner_scan(
      (struct ObjectScript_Expr_Scanner *)payload, lexer, valid_symbols);
}

unsigned tree_sitter_objectscript_expr_external_scanner_serialize(
    void *payload, char *buffer) {
        (void)payload;
        (void)buffer;
        return 0;
}

void tree_sitter_objectscript_expr_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
        (void)payload;
        (void)buffer;
        (void)length;

}

void tree_sitter_objectscript_expr_external_scanner_destroy(void *payload) {
  (void)payload;
}
