#include "../../common/scanner.h"
#include "tree_sitter/parser.h"
#include <stdlib.h>
#include <string.h>

// Keep this in sync with grammar externals.
enum TokenType {
  ROUTINE = OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX,
};

struct ObjectScript_Routine_Scanner {
  bool saw_routine_header;
  // True while we are still on line 1 before the routine header.
  bool at_bof;
  struct ObjectScript_Core_Scanner core_scanner;
};

static bool lex_routine_keyword(TSLexer *lexer) {
  static const char keyword[] = "ROUTINE";

  for (size_t i = 0; keyword[i] != 0; i++) {
    if (ascii_toupper_i32(lexer->lookahead) != (int32_t)keyword[i]) {
      return false;
    }
    advance(lexer);
  }

  lexer->mark_end(lexer);
  lexer->result_symbol = ROUTINE;
  return true;
}

static bool scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  struct ObjectScript_Routine_Scanner *scanner =
      (struct ObjectScript_Routine_Scanner *)payload;

  // Tree-sitter marks all terminals as valid during error recovery.
  if (valid_symbols[SENTINEL]) {
    return false;
  }

  // If we've moved away from column 0 before seeing the header, it is no
  // longer BOF for our strict "first row, first column" requirement.
  if (!scanner->saw_routine_header && scanner->at_bof &&
      lexer->get_column(lexer) > 0) {
    scanner->at_bof = false;
  }

  // Gate core scanner until the routine header keyword is consumed.
  if (!scanner->saw_routine_header) {
    if (valid_symbols[ROUTINE] && scanner->at_bof &&
        lexer->get_column(lexer) == 0) {
      if (lex_routine_keyword(lexer)) {
        scanner->saw_routine_header = true;
        scanner->at_bof = false;
        return true;
      }
    }

    // Do not delegate to core yet. This prevents column-1 TAG from winning
    // before the required routine header.
    return false;
  }

  bool matched = ObjectScript_Core_Scanner_scan(&scanner->core_scanner, lexer,
                                                valid_symbols);
  if (matched) {
    scanner->at_bof = false;
  }
  return matched;
}

void *tree_sitter_objectscript_routine_external_scanner_create() {
  struct ObjectScript_Routine_Scanner *scanner =
      (struct ObjectScript_Routine_Scanner *)calloc(
          1, sizeof(struct ObjectScript_Routine_Scanner));
  scanner->saw_routine_header = false;
  scanner->at_bof = true;
  ObjectScript_Core_Scanner_init(&scanner->core_scanner);
  scanner->core_scanner.column1_statement_mode = false;
  return scanner;
}

bool tree_sitter_objectscript_routine_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  return scan(payload, lexer, valid_symbols);
}

unsigned tree_sitter_objectscript_routine_external_scanner_serialize(void *payload,
                                                             char *buffer) {
  struct ObjectScript_Routine_Scanner *scanner =
      (struct ObjectScript_Routine_Scanner *)payload;
  memcpy(buffer, scanner, sizeof(struct ObjectScript_Routine_Scanner));
  return sizeof(struct ObjectScript_Routine_Scanner);
}

void tree_sitter_objectscript_routine_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
  memcpy(payload, buffer, length);
}

void tree_sitter_objectscript_routine_external_scanner_destroy(void *payload) {
  struct ObjectScript_Routine_Scanner *scanner =
      (struct ObjectScript_Routine_Scanner *)payload;
  free(scanner);
}
