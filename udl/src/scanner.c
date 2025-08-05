#include "../../core/src/scanner.h"
#include "tree_sitter/parser.h"
#include <stdlib.h>
#include <string.h>

// Ther is no way to extend enums, so keep this in sync with base.h
// All new entries should be appended at the bottom of the list
enum TokenType {
  EXTERNAL_METHOD_BODY_CONTENT = OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX
};

struct ObjectScript_Udl_Scanner {
  char in_body;
  struct ObjectScript_Core_Scanner core_scanner;
};

static bool lex_fenced_text(void *payload, TSLexer *lexer,
                            enum TokenType desired_symbol, char l_delim,
                            char r_delim) {
  int leftRightDiff = 1;
  while (!lexer->eof(lexer)) {
    if (lexer->lookahead == r_delim) {
      leftRightDiff -= 1;
    } else if (lexer->lookahead == l_delim) {
      leftRightDiff += 1;
    }
    if (leftRightDiff == 0) {
      lexer->result_symbol = desired_symbol;
      return true;
    }
    advance(lexer);
  }
  return false;
}

/// This is the interesting function. The rest is infrastructure
static bool scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  // struct Scanner *scanner = (struct Scanner *)payload;
  //
  // Tree sitter will mark all terminals as valid on error
  // The sentinel should never be valid in a good parse, so this ensures
  // we are not in error recovery mode
  // printf("Lookahead: '%c'. Col %d. Tag is valid? %d", lexer->lookahead,
  // lexer->get_column(lexer), valid_symbols[TAG]);
  // printf("lexer->lookahead: '%c'\n", lexer->lookahead);
  // printf("====\n");
  // debug_enum(valid_symbols);
  // printf("====\n");
  if (valid_symbols[SENTINEL]) {
    //  printf("Thats not good!\n");
    //  // TODO: ERROR RECOVERY MODE ?? Why would we be better than TS's
    //  default? if (iswspace(lexer->lookahead)) {
    //    skip(lexer);
    //    eat_whitespace(lexer);
    //    lexer->result_symbol = _WHITESPACE;
    //    return true;
    //  }
    return false;
  }
  if (valid_symbols[EXTERNAL_METHOD_BODY_CONTENT]) {
    // A valid method_body is one that is whose text fences
    // are evenly balanced (so far only { })
    // e.g. VALID: {{{ [^{}]* }}} INVALID: {{{ [^{}]* }
    return lex_fenced_text(payload, lexer, EXTERNAL_METHOD_BODY_CONTENT, '{',
                           '}');
  }
  struct ObjectScript_Udl_Scanner *scanner =
      (struct ObjectScript_Udl_Scanner *)payload;
  return ObjectScript_Core_Scanner_scan(&scanner->core_scanner, lexer,
                                        valid_symbols);
}

void *tree_sitter_objectscript_udl_external_scanner_create() {
  struct ObjectScript_Udl_Scanner *scanner =
      (struct ObjectScript_Udl_Scanner *)calloc(
          1, sizeof(struct ObjectScript_Udl_Scanner));
  scanner->in_body = 0;
  ObjectScript_Core_Scanner_init(&scanner->core_scanner);
  return scanner;
}

bool tree_sitter_objectscript_udl_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  return scan(payload, lexer, valid_symbols);
}

unsigned tree_sitter_objectscript_udl_external_scanner_serialize(void *payload,
                                                                 char *buffer) {
  struct ObjectScript_Udl_Scanner *scanner =
      (struct ObjectScript_Udl_Scanner *)payload;
  memcpy(buffer, scanner, sizeof(struct ObjectScript_Udl_Scanner));
  return sizeof(struct ObjectScript_Udl_Scanner);
}

void tree_sitter_objectscript_udl_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
  // This one is a bit funky.
  // length includes the sizeof(struct Scanner) and the structs it points to
  memcpy(payload, buffer, length);
}

void tree_sitter_objectscript_udl_external_scanner_destroy(void *payload) {
  struct ObjectScript_Udl_Scanner *scanner =
      (struct ObjectScript_Udl_Scanner *)payload;
  free(scanner);
}
