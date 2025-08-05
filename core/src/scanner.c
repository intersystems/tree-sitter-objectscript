#include "scanner.h"
#include "tree_sitter/parser.h"
#include <string.h>

void *tree_sitter_objectscript_core_external_scanner_create() {
  struct ObjectScript_Core_Scanner *scanner =
      (struct ObjectScript_Core_Scanner *)calloc(
          1, sizeof(struct ObjectScript_Core_Scanner));
  ObjectScript_Core_Scanner_init(scanner);
  return scanner;
}

bool tree_sitter_objectscript_core_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  return ObjectScript_Core_Scanner_scan(
      (struct ObjectScript_Core_Scanner *)payload, lexer, valid_symbols);
}

unsigned
tree_sitter_objectscript_core_external_scanner_serialize(void *payload,
                                                         char *buffer) {
  struct ObjectScript_Core_Scanner *scanner =
      (struct ObjectScript_Core_Scanner *)payload;
  memcpy(buffer, scanner, sizeof(struct ObjectScript_Core_Scanner));
  return sizeof(struct ObjectScript_Core_Scanner);
}

void tree_sitter_objectscript_core_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
  memcpy(payload, buffer, length);
}

void tree_sitter_objectscript_core_external_scanner_destroy(void *payload) {
  struct ObjectScript_Core_Scanner *scanner =
      (struct ObjectScript_Core_Scanner *)payload;
  free(scanner);
}
