#ifndef OBJECTSCRIPT_EXPR_SCANNER_H
#define OBJECTSCRIPT_EXPR_SCANNER_H
#include <wctype.h>
#include "tree_sitter/parser.h"
#include <string.h>
enum ObjectScript_Expr_Scanner_TokenType {
    STATEMENT_IN_MACRO,
    SENTINEL,
    OBJECTSCRIPT_EXPR_TOKEN_TYPE_MAX
};

static inline void advance(TSLexer *lexer) {
  lexer->advance(lexer, false);
}
static inline bool is_ascii_alpha_i32(int32_t c) {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
}

static bool lex_macro_statement(TSLexer *lexer) {
  int depth = 1;
  while (iswspace(lexer->lookahead) || lexer->lookahead == 0x2028 || lexer->lookahead == 0x2029) {
      advance(lexer);
  }

  while(iswalnum(lexer->lookahead) || iswspace(lexer->lookahead)) {
      advance(lexer);
  }
  while (!lexer->eof(lexer)) {
    while (iswspace(lexer->lookahead) || lexer->lookahead == 0x2028 || lexer->lookahead == 0x2029) {
        advance(lexer);
    }
    int32_t c = lexer->lookahead;
    if (c == '"') {
          int32_t quote = c;
          advance(lexer);
            if (lexer->lookahead == quote) {
            advance(lexer);
            continue;
            }

          // Consume the string contents.
          while (!lexer->eof(lexer)) {
            if (lexer->lookahead == quote) {
              advance(lexer);
              if (lexer->lookahead == quote) {
                advance(lexer);
                continue;
              } else {
                  break;
              }
            }
            if (lexer->lookahead == '\n') {
              // Unterminated single-quoted string; stop before consuming the
              // newline so brace counting resumes on the next line.
              break;
            }
            advance(lexer);
          }
          continue;

    } if (c == '/') {
        advance(lexer);
        if (lexer->lookahead == '/') {
            while (lexer->lookahead != 0 && lexer->lookahead != '\n' && lexer->lookahead != 0x2028 &&
              lexer->lookahead != 0x2029) {
              advance(lexer);
              }
            continue;
        } else if (lexer->lookahead == '*') {
            advance(lexer);
            while (!lexer->eof(lexer)) {
              if (lexer->lookahead == '*') {
                  advance(lexer);
                if (lexer->lookahead == '/') {
                    advance(lexer);
                    break;
                }
              }
              else {
                advance(lexer);
              }
            }
            continue;
        } else {
            continue;
        }
    }

    if (c == ')') {
      depth--;
      if (depth == 0) {
          lexer->mark_end(lexer);
          advance(lexer);
          if (lexer->lookahead == '"' || is_ascii_alpha_i32(lexer->lookahead)) {
              depth = 1;
              continue;
          }
        lexer->result_symbol = STATEMENT_IN_MACRO;
        return true;
      }
    } else if (c == '(') {
      depth++;
    }
    advance(lexer);
  }
  return false;
}
#endif
