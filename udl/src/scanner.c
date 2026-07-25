#include "../../common/scanner.h"
#include "tree_sitter/parser.h"
#include <string.h>

// There is no way to extend enums, so keep this in sync with base.h
// All new entries should be appended at the bottom of the list
enum TokenType {
  EXTERNAL_METHOD_BODY_CONTENT = OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX,
  PYTHON_METHOD_BODY_CONTENT,
  IRIS_USERNAME,
};

struct ObjectScript_Udl_Scanner {
  char in_body;
  struct ObjectScript_Core_Scanner core_scanner;
};

static bool lex_fenced_text(TSLexer *lexer,
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

/// Lex a Python method body, tracking brace depth but ignoring braces that
/// appear inside string literals or comments. The language-agnostic
/// lex_fenced_text above cannot do this: external_method_body_content is
/// shared with XData (XML/JSON), triggers and SQL queries, where Python
/// quoting rules do not apply.
///
/// Handles single and triple quotes, prefixed strings (f/r/b/u and
/// combinations), backslash escapes, and `#` line comments. Raw strings still
/// terminate on an unescaped quote, so a trailing backslash inside r"..."
/// behaves as Python does.
static bool lex_python_fenced_text(TSLexer *lexer,
                                   enum TokenType desired_symbol) {
  int depth = 1;
  while (!lexer->eof(lexer)) {
    int32_t c = lexer->lookahead;

    if (c == '#') {
      // Line comment: consume to end of line.
      while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
        advance(lexer);
      }
      continue;
    }

    if (c == '\'' || c == '"') {
      int32_t quote = c;
      advance(lexer);

      // Detect a triple-quoted string.
      bool triple = false;
      if (lexer->lookahead == quote) {
        advance(lexer);
        if (lexer->lookahead == quote) {
          advance(lexer);
          triple = true;
        } else {
          // Empty string literal ('' or ""); nothing more to skip.
          continue;
        }
      }

      // Consume the string contents.
      while (!lexer->eof(lexer)) {
        if (lexer->lookahead == '\\') {
          advance(lexer);
          if (!lexer->eof(lexer)) {
            advance(lexer);
          }
          continue;
        }
        if (lexer->lookahead == quote) {
          advance(lexer);
          if (!triple) {
            break;
          }
          if (lexer->lookahead == quote) {
            advance(lexer);
            if (lexer->lookahead == quote) {
              advance(lexer);
              break;
            }
          }
          continue;
        }
        if (!triple && lexer->lookahead == '\n') {
          // Unterminated single-quoted string; stop before consuming the
          // newline so brace counting resumes on the next line.
          break;
        }
        advance(lexer);
      }
      continue;
    }

    if (c == '}') {
      depth -= 1;
      if (depth == 0) {
        lexer->result_symbol = desired_symbol;
        return true;
      }
    } else if (c == '{') {
      depth += 1;
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
  if (valid_symbols[PYTHON_METHOD_BODY_CONTENT]) {
    // Language = python bodies are brace-balanced like the others, but braces
    // inside Python strings and comments must not be counted.
    return lex_python_fenced_text(lexer, PYTHON_METHOD_BODY_CONTENT);
  }

  if (valid_symbols[EXTERNAL_METHOD_BODY_CONTENT]) {
    // A valid method_body is one that is whose text fences
    // are evenly balanced (so far only { })
    // e.g. VALID: {{{ [^{}]* }}} INVALID: {{{ [^{}]* }
    return lex_fenced_text(lexer, EXTERNAL_METHOD_BODY_CONTENT, '{',
                           '}');
  }

  if (valid_symbols[IRIS_USERNAME] && !(lexer->lookahead=='}' || lexer->lookahead=='@' || lexer->lookahead=='*')) {
    int count=0;
    lexer->mark_end(lexer);
    while(!lexer->eof(lexer) && !(lexer->lookahead=='}' || lexer->lookahead=='@' || lexer->lookahead=='*') && count<160 ) {
      count++;
      advance(lexer);
    }
    

    if(lexer->lookahead=='}') {
      lexer->mark_end(lexer);
      lexer->result_symbol = IRIS_USERNAME;
      return true;
    }
    else {
      return false;
    }
  
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
  scanner->core_scanner.column1_statement_mode = false;
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
