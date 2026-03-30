#include "../../common/scanner.h"
#include "tree_sitter/parser.h"
#include <stdlib.h>
#include <string.h>

// Keep this in sync with grammar externals.
enum TokenType {
  COMPILED_HEADER = OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX,
  ROUTINE,
  RTN_DOT,
};

struct ObjectScript_Routine_Scanner {
  bool saw_compiled_header;
  bool saw_routine_header;
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

static bool lex_compiled_header(TSLexer *lexer) {
  uint32_t newlines_seen = 0;
  if (lexer->eof(lexer)) return false;

  while (!lexer->eof(lexer) && newlines_seen < 3) {
    if (lexer->lookahead == '\n') {
      newlines_seen++;
    }
    advance(lexer);
  }

  // We only emit this token when we successfully consumed the top 3 lines.
  if (newlines_seen < 3) return false;

  lexer->mark_end(lexer);
  lexer->result_symbol = COMPILED_HEADER;
  return true;

}

static bool lex_rtn_dot(TSLexer *lexer) {
  if (lexer->get_column(lexer) != 0) return false;
  if (lexer->lookahead != '.') return false;

  advance(lexer);

  // Only match a line that is exactly "." with no trailing content.
  if (lexer->eof(lexer) || lexer->lookahead == '\n' || lexer->lookahead == '\r') {
    lexer->mark_end(lexer);
    lexer->result_symbol = RTN_DOT;
    return true;
  }

  return false;
}

static bool scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  struct ObjectScript_Routine_Scanner *scanner =
      (struct ObjectScript_Routine_Scanner *)payload;

  // Tree-sitter marks all terminals as valid during error recovery.
  if (valid_symbols[SENTINEL]) {
    return false;
  }

  // Gate core scanner until the routine header keyword is consumed.
  if (!scanner->saw_routine_header) {
    // Stage 1: at BOF, accept ROUTINE if it starts on the first line;
    // otherwise accept COMPILED_HEADER once.
    if (!scanner->saw_compiled_header && lexer->get_column(lexer) == 0) {
      if (valid_symbols[ROUTINE] && lex_routine_keyword(lexer)) {
        scanner->saw_routine_header = true;
        return true;
      }
      if (valid_symbols[COMPILED_HEADER] && lex_compiled_header(lexer)) {
        scanner->saw_compiled_header = true;
        // Some grammars proceed directly to statements after COMPILED_HEADER.
        // If ROUTINE is not expected next, unlock core scanning immediately.
        if (!valid_symbols[ROUTINE]) {
          scanner->saw_routine_header = true;
        }
        return true;
      }
    }

    // Stage 2: after compiled header is consumed, wait for ROUTINE keyword.
    if (scanner->saw_compiled_header) {
      if (valid_symbols[ROUTINE] &&
          lexer->get_column(lexer) == 0 &&
          lex_routine_keyword(lexer)) {
        scanner->saw_routine_header = true;
        return true;
      }
      // If parser no longer requests ROUTINE after COMPILED_HEADER,
      // allow regular ObjectScript scanning.
      if (!valid_symbols[ROUTINE]) {
        scanner->saw_routine_header = true;
      } else {
        return false;
      }
    }

    if (!scanner->saw_routine_header) {
      // Do not delegate to core yet. This prevents column-1 TAG from winning
      // before the required routine header.
      return false;
    }
  }

  if (valid_symbols[RTN_DOT] && lex_rtn_dot(lexer)) {
    return true;
  }

  bool matched = ObjectScript_Core_Scanner_scan(&scanner->core_scanner, lexer,
                                                valid_symbols);
  return matched;
}

void *tree_sitter_objectscript_routine_external_scanner_create() {
  struct ObjectScript_Routine_Scanner *scanner =
      (struct ObjectScript_Routine_Scanner *)calloc(
          1, sizeof(struct ObjectScript_Routine_Scanner));
  scanner->saw_compiled_header = false;
  scanner->saw_routine_header = false;
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
