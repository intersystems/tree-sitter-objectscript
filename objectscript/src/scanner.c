#include "../../common/udl-scanner.h"
#include "tree_sitter/parser.h"
#include <stdlib.h>
#include <string.h>

void *tree_sitter_objectscript_external_scanner_create() {
  struct ObjectScript_Udl_Scanner *scanner =
      (struct ObjectScript_Udl_Scanner *)calloc(
          1, sizeof(struct ObjectScript_Udl_Scanner));
  ObjectScript_Udl_Scanner_init(scanner);
  // Same as UDL, but top-level routine code is also allowed: treat column-1
  // identifiers as statements and recognize ROUTINE headers / rtn dots.
  scanner->core_scanner.column1_statement_mode = true;
  scanner->core_scanner.routine_token_mode = true;
  return scanner;
}

bool tree_sitter_objectscript_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  return ObjectScript_Udl_Scanner_scan(
      (struct ObjectScript_Udl_Scanner *)payload, lexer, valid_symbols);
}

unsigned tree_sitter_objectscript_external_scanner_serialize(void *payload,
                                                        char *buffer) {
  return ObjectScript_Udl_Scanner_serialize(
      (struct ObjectScript_Udl_Scanner *)payload, buffer);
}

void tree_sitter_objectscript_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
  ObjectScript_Udl_Scanner_deserialize(
      (struct ObjectScript_Udl_Scanner *)payload, buffer, length);
}

void tree_sitter_objectscript_external_scanner_destroy(void *payload) {
  free(payload);
}
