#include "tree_sitter/parser.h"
#include <string.h>
#include <wctype.h>

enum ObjectScript_Core_Scanner_TokenType {
  _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE,
  _ASSERT_NO_SPACE_BETWEEN_RULES,
  _ARGUMENTLESS_COMMAND_END,
  _ARGUMENTLESS_LOOP,
  _WHITESPACE,
  TAG,
  ROUTINE,
  ANGLED_BRACKET_FENCED_TEXT,
  PAREN_FENCED_TEXT,
  EMBEDDED_SQL_MARKER,
  EMBEDDED_SQL_REVERSE_MARKER,
  _LINE_COMMENT_INNER,
  _BLOCK_COMMENT_INNER,
  MACRO_VALUE_LINE_WITH_CONTINUE,
  SENTINEL,
  BOL,
  _TERMINATION,
  _ZBREAK_DEVICE_TERMINATION,
  _POST_CONDITIONAL_ID,
  _XECUTE_ARG_INVALID,
  _ZW_BLOCK,
  HTML_MARKER,
  HTML_MARKER_REVERSED,
  EMBEDDED_JS_SPECIAL_CASE,
  EMBEDDED_JS_SPECIAL_CASE_COMPLETE,
  POUND_IF_SPECIAL_CASE,
  POUND_IF_SPECIAL_CASE_ELSE,
  POUND_IF_SPECIAL_CASE_ELSE_IF, 
  MNEMONIC,
  TAG_END_IF,
  /* Max token type */
  OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX

};

static const char* token_names[] = {
  "_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE",
  "_ASSERT_NO_SPACE_BETWEEN_RULES",
  "_ARGUMENTLESS_COMMAND_END",
  "_ARGUMENTLESS_LOOP",
  "_WHITESPACE",
  "TAG",
  "ROUTINE",
  "ANGLED_BRACKET_FENCED_TEXT",
  "PAREN_FENCED_TEXT",
  "EMBEDDED_SQL_MARKER",
  "EMBEDDED_SQL_REVERSE_MARKER",
  "_LINE_COMMENT_INNER",
  "_BLOCK_COMMENT_INNER",
  "MACRO_VALUE_LINE_WITH_CONTINUE",
  "SENTINEL",
  "BOL",
  "_INLINE_STATEMENT_SEPARATOR",
  "_TERMINATION",
  "_ZBREAK_DEVICE_TERMINATION",
  "_POST_CONDITIONAL_ID",
  "_XECUTE_ARG_INVALID",
  "_ZW_BLOCK",
  "HTML_MARKER",
  "HTML_MARKER_REVERSED",
  "EMBEDDED_JS_SPECIAL_CASE",
  "EMBEDDED_JS_SPECIAL_CASE_COMPLETE",
  "POUND_IF_SPECIAL_CASE",
  "POUND_IF_SPECIAL_CASE_ELSE",
  "POUND_IF_SPECIAL_CASE_ELSE_IF", 
  "MNEMONIC",
  "TAG_END_IF"
};

#if 0
static char* debug_enum(TSLexer *lexer, const bool *valid_symbols) {
  static char work[1024];
  size_t n = 0;

  for (int i = 0; i < OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX; i++) {
    if (valid_symbols[i]) {
      if (n > 0) {
        strncpy(&work[n], ", ", sizeof(work)-n);
        n += strlen(&work[n]);
      }
      strncpy(&work[n], token_names[i], sizeof(work)-n);
      n += strlen(&work[n]);
    }
  }

  work[n] = 0;

  return work;
}
#endif

static inline void advance(TSLexer *lexer) {
  lexer->advance(lexer, false);
}
static inline bool is_validHTML_MARKER_char(int32_t c) {
  if (iswspace(c)) return false;

  switch (c) {
    case '<': case '>':
    case '(': case ')':
    case '{': case '}':
    case '+': case '-':
    case '/': case '\\':
    case '|': case '*':
      return false;
    default:
      return true; 
  }
}
static inline bool is_valid_sql_marker_char(int32_t c) {
  if (iswspace(c)) return false;

  switch (c) {
    case '(': case ')':
    case '+': case '-':
    case '/': case '\\':
    case '|': case '*':
      return false;
    default:
      return true; 
  }
}

static inline bool is_short_circuit_continuation_operator(TSLexer *lexer) {
  if (lexer->lookahead != '&' && lexer->lookahead != '|') {
    return false;
  }
  int32_t first = lexer->lookahead;
  lexer->mark_end(lexer);
  advance(lexer);
  return lexer->lookahead == first;
}

static inline void skip   (TSLexer *lexer) { lexer->advance(lexer, true ); }

#define MARKER_BUFFER_MAX_LEN 30
struct ObjectScript_Core_Scanner {
  int32_t marker_buffer[MARKER_BUFFER_MAX_LEN];
  int marker_buffer_len;
  bool terminated_newline;
  // When true, column-1 identifiers are treated as statements unless they
  // are clearly labels/tags.
  bool column1_statement_mode;
  // When true, a column-1 tag named ROUTINE is emitted as ROUTINE instead of TAG.
  bool routine_token_mode;
  bool special_pound_if_mode;
  uint32_t special_pound_if_mode_if_depth;
  int32_t html_marker_buffer[MARKER_BUFFER_MAX_LEN];
  int html_marker_buffer_len;
  int32_t sql_marker_buffer[MARKER_BUFFER_MAX_LEN];
  int sql_marker_buffer_len;
  int32_t js_marker_buffer_reversed[MARKER_BUFFER_MAX_LEN];
  int js_marker_buffer_reversed_len;
};

static inline bool is_label_char(int32_t c) {
  return iswalnum(c) || c == '%';
}

static inline int32_t ascii_toupper_i32(int32_t c) {
  if (c >= 'a' && c <= 'z') return c - ('a' - 'A');
  return c;
}

static bool ascii_upper_eq(const int32_t *text, uint32_t len, const char *kw) {
  uint32_t i = 0;
  for (; kw[i] != 0; i++) {
    if (i >= len) return false;
    if (ascii_toupper_i32(text[i]) != (int32_t)kw[i]) return false;
  }
  return i == len;
}

static bool is_statement_or_class_keyword(const int32_t *text, uint32_t len) {
  if (len == 0) return false;
  int32_t c0 = ascii_toupper_i32(text[0]);
  if (!(c0 >= 'A' && c0 <= 'Z')) return false;

  // ZZ* commands
  if (len >= 3 && c0 == 'Z' && ascii_toupper_i32(text[1]) == 'Z') return true;

  // Statement keywords
  if (ascii_upper_eq(text, len, "P") || ascii_upper_eq(text, len, "PRINT")) return true;
  if (ascii_upper_eq(text, len, "ROUTINE")) return true;
  if (ascii_upper_eq(text, len, "ZP") || ascii_upper_eq(text, len, "ZPRINT")) return true;
  if (ascii_upper_eq(text, len, "S") || ascii_upper_eq(text, len, "SET")) return true;
  if (ascii_upper_eq(text, len, "W") || ascii_upper_eq(text, len, "WRITE")) return true;
  if (ascii_upper_eq(text, len, "D") || ascii_upper_eq(text, len, "DO")) return true;
  if (ascii_upper_eq(text, len, "ZW") || ascii_upper_eq(text, len, "ZWRITE")) return true;
  if (ascii_upper_eq(text, len, "F") || ascii_upper_eq(text, len, "FOR")) return true;
  if (ascii_upper_eq(text, len, "WHILE")) return true;
  if (ascii_upper_eq(text, len, "K") || ascii_upper_eq(text, len, "KILL")) return true;
  if (ascii_upper_eq(text, len, "L") || ascii_upper_eq(text, len, "LOCK")) return true;
  if (ascii_upper_eq(text, len, "R") || ascii_upper_eq(text, len, "READ") ||
      ascii_upper_eq(text, len, "RET") || ascii_upper_eq(text, len, "RETURN")) return true;
  if (ascii_upper_eq(text, len, "O") || ascii_upper_eq(text, len, "OPEN")) return true;
  if (ascii_upper_eq(text, len, "CLOSE")) return true;
  if (ascii_upper_eq(text, len, "U") || ascii_upper_eq(text, len, "USE")) return true;
  if (ascii_upper_eq(text, len, "N") || ascii_upper_eq(text, len, "NEW")) return true;
  if (ascii_upper_eq(text, len, "I") || ascii_upper_eq(text, len, "IF")) return true;
  if (ascii_upper_eq(text, len, "E") || ascii_upper_eq(text, len, "ELSE")) return true;
  if (ascii_upper_eq(text, len, "THROW")) return true;
  if (ascii_upper_eq(text, len, "TRY")) return true;
  if (ascii_upper_eq(text, len, "CATCH")) return true;
  if (ascii_upper_eq(text, len, "J") || ascii_upper_eq(text, len, "JOB")) return true;
  if (ascii_upper_eq(text, len, "B") || ascii_upper_eq(text, len, "BREAK")) return true;
  if (ascii_upper_eq(text, len, "M") || ascii_upper_eq(text, len, "MERGE")) return true;
  if (ascii_upper_eq(text, len, "MV")) return true;
  if (ascii_upper_eq(text, len, "MVC") || ascii_upper_eq(text, len, "MVCRT")) return true;
  if (ascii_upper_eq(text, len, "MVDIM")) return true;
  if (ascii_upper_eq(text, len, "MVPRINT")) return true;
  if (ascii_upper_eq(text, len, "Q") || ascii_upper_eq(text, len, "QUIT")) return true;
  if (ascii_upper_eq(text, len, "G") || ascii_upper_eq(text, len, "GOTO")) return true;
  if (ascii_upper_eq(text, len, "H") || ascii_upper_eq(text, len, "HALT") ||
      ascii_upper_eq(text, len, "HANG")) return true;
  if (ascii_upper_eq(text, len, "CONTINUE")) return true;
  if (ascii_upper_eq(text, len, "TC") || ascii_upper_eq(text, len, "TCOMMIT")) return true;
  if (ascii_upper_eq(text, len, "TRO") || ascii_upper_eq(text, len, "TROLLBACK")) return true;
  if (ascii_upper_eq(text, len, "TS") || ascii_upper_eq(text, len, "TSTART")) return true;
  if (ascii_upper_eq(text, len, "X") || ascii_upper_eq(text, len, "XECUTE")) return true;
  if (ascii_upper_eq(text, len, "V") || ascii_upper_eq(text, len, "VIEW")) return true;
  if (ascii_upper_eq(text, len, "ZA") || ascii_upper_eq(text, len, "ZALLOCATE")) return true;
  if (ascii_upper_eq(text, len, "ZB") || ascii_upper_eq(text, len, "ZBREAK")) return true;
  if (ascii_upper_eq(text, len, "ZD") || ascii_upper_eq(text, len, "ZDEALLOCATE")) return true;
  if (ascii_upper_eq(text, len, "ZDELETE")) return true;
  if (ascii_upper_eq(text, len, "ZERASE")) return true;
  if (ascii_upper_eq(text, len, "ZETRAP")) return true;
  if (ascii_upper_eq(text, len, "ZFILE")) return true;
  if (ascii_upper_eq(text, len, "ZGO")) return true;
  if (ascii_upper_eq(text, len, "ZHTRAP")) return true;
  if (ascii_upper_eq(text, len, "ZI") || ascii_upper_eq(text, len, "ZINSERT")) return true;
  if (ascii_upper_eq(text, len, "ZITRAP")) return true;
  if (ascii_upper_eq(text, len, "ZK") || ascii_upper_eq(text, len, "ZKILL")) return true;
  if (ascii_upper_eq(text, len, "ZL") || ascii_upper_eq(text, len, "ZLOAD")) return true;
  if (ascii_upper_eq(text, len, "ZN") || ascii_upper_eq(text, len, "ZNSPACE")) return true;
  if (ascii_upper_eq(text, len, "ZNS")) return true;
  if (ascii_upper_eq(text, len, "ZMOVE")) return true;
  if (ascii_upper_eq(text, len, "ZOMSPACK")) return true;
  if (ascii_upper_eq(text, len, "ZONERROR")) return true;
  if (ascii_upper_eq(text, len, "ZOS")) return true;
  if (ascii_upper_eq(text, len, "ZREAD")) return true;
  if (ascii_upper_eq(text, len, "ZS") || ascii_upper_eq(text, len, "ZSAVE")) return true;
  if (ascii_upper_eq(text, len, "ZSU")) return true;
  if (ascii_upper_eq(text, len, "ZSYNC")) return true;
  if (ascii_upper_eq(text, len, "ZTA")) return true;
  if (ascii_upper_eq(text, len, "ZTB")) return true;
  if (ascii_upper_eq(text, len, "ZTE")) return true;
  if (ascii_upper_eq(text, len, "ZTRANSACTION")) return true;
  if (ascii_upper_eq(text, len, "ZT") || ascii_upper_eq(text, len, "ZTRAP")) return true;
  if (ascii_upper_eq(text, len, "ZU") || ascii_upper_eq(text, len, "ZUSE")) return true;

  // Top-level class/objectscript keywords that can start a non-tag statement.
  if (ascii_upper_eq(text, len, "CLASS")) return true;
  if (ascii_upper_eq(text, len, "METHOD")) return true;
  if (ascii_upper_eq(text, len, "CLASSMETHOD")) return true;
  if (ascii_upper_eq(text, len, "PROPERTY")) return true;
  if (ascii_upper_eq(text, len, "PARAMETER")) return true;
  if (ascii_upper_eq(text, len, "RELATIONSHIP")) return true;
  if (ascii_upper_eq(text, len, "FOREIGNKEY")) return true;
  if (ascii_upper_eq(text, len, "QUERY")) return true;
  if (ascii_upper_eq(text, len, "INDEX")) return true;
  if (ascii_upper_eq(text, len, "TRIGGER")) return true;
  if (ascii_upper_eq(text, len, "XDATA")) return true;
  if (ascii_upper_eq(text, len, "PROJECTION")) return true;
  if (ascii_upper_eq(text, len, "STORAGE")) return true;
  if (ascii_upper_eq(text, len, "IMPORT")) return true;
  if (ascii_upper_eq(text, len, "INCLUDE")) return true;
  if (ascii_upper_eq(text, len, "INCLUDEGENERATOR")) return true;

  return false;
}

static bool ObjectScript_Core_Scanner_lex_fenced_text(
    TSLexer *lexer,
    enum ObjectScript_Core_Scanner_TokenType desired_symbol,
    char l_delim,
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


static bool ObjectScript_Core_Scanner_lex_marker_fenced_text(
    TSLexer *lexer,
    enum ObjectScript_Core_Scanner_TokenType desired_symbol,
    const int32_t *reverse_marker,
    int reverse_marker_len,
    char r_delim  
) {
  while (!lexer->eof(lexer)) {
    if (lexer->lookahead == r_delim) {
      lexer->mark_end(lexer);
      advance(lexer); 

      uint8_t i = 0;
      while (i < reverse_marker_len && !lexer->eof(lexer)
             && lexer->lookahead == reverse_marker[i]) {
        advance(lexer);
        i++;
      }

      if (i == reverse_marker_len) {
        lexer->result_symbol = desired_symbol;
        return true;
      }

      lexer->mark_end(lexer);
      continue;
    }

    advance(lexer);
  }

  // EOF without closing fence – let parser produce an error
  return false;
}

static inline bool is_ascii_alpha_i32(int32_t c) {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
}

static bool ObjectScript_Core_Scanner_lex_pound_if_special_case(TSLexer *lexer) {
  if (lexer->lookahead != '0') return false;

  uint32_t depth = 1;
  bool at_line_start = false;
  advance(lexer);  

  while (!lexer->eof(lexer)) {
    if (at_line_start) {
      while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
        advance(lexer);
      }

      if (lexer->lookahead == '#') {
        lexer->mark_end(lexer);
        advance(lexer);

        int32_t directive[16];
        uint32_t len = 0;
        while (len < (sizeof(directive) / sizeof(directive[0])) &&
               is_ascii_alpha_i32(lexer->lookahead)) {
          directive[len++] = ascii_toupper_i32(lexer->lookahead);
          advance(lexer);
        }

        if (ascii_upper_eq(directive, len, "IF") ||
            ascii_upper_eq(directive, len, "IFDEF") ||
            ascii_upper_eq(directive, len, "IFNDEF") ||
            ascii_upper_eq(directive, len, "IFUNDEF")) {
          depth += 1;
        } else if (ascii_upper_eq(directive, len, "ENDIF")) {
          if (depth == 0) return false;
          depth -= 1;
          if (depth == 0) {

            lexer->result_symbol = POUND_IF_SPECIAL_CASE;
            return true;
          }
        } else if (ascii_upper_eq(directive, len, "ELSE")) {
          if (depth == 0) return false;
          depth -= 1;
          if (depth == 0) {
            lexer->result_symbol = POUND_IF_SPECIAL_CASE_ELSE;
            return true;
          }
        } else if (ascii_upper_eq(directive, len, "ELSEIF")) {
          if (depth == 0) return false;
          if (depth == 1) {
            while (lexer->lookahead== ' ' || lexer->lookahead== '\t') {
              advance(lexer);
            }
            if (lexer->lookahead == '1') {
              depth -= 1;
              lexer->result_symbol = POUND_IF_SPECIAL_CASE_ELSE;
              return true;
            }
            lexer->result_symbol = POUND_IF_SPECIAL_CASE_ELSE_IF;
            return true;
          }
        }


        at_line_start = false;
        continue;
      }

      at_line_start = false;
    }

    if (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
      at_line_start = true;
    }

    advance(lexer);
  }

  // No matching #endif found; let grammar/error recovery handle it.
  return false;
}


static bool
ObjectScript_Core_Scanner_scan(struct ObjectScript_Core_Scanner *scanner,
                               TSLexer *lexer, const bool *valid_symbols)
{
#if 0
  if (lexer->log) {
    lexer->log(lexer, "scan: %c (%d): %s\n",
               lexer->lookahead, lexer->lookahead,
               debug_enum(lexer, valid_symbols));
  }
#endif


  // Tree sitter will mark all terminals as valid on error
  // The sentinel should never be valid in a good parse, so this ensures
  // we are not in error recovery mode
  if (valid_symbols[SENTINEL]) {
    return false;
  }


  if (scanner->terminated_newline && lexer->lookahead == '.' && valid_symbols[BOL]) {
    lexer->result_symbol = BOL;
    scanner->terminated_newline = false;
    return true;
  }

  if (valid_symbols[POUND_IF_SPECIAL_CASE]) {
     // #if 0 .. #endif cases
    if (ObjectScript_Core_Scanner_lex_pound_if_special_case(lexer)) {
      if (
           lexer->result_symbol == POUND_IF_SPECIAL_CASE_ELSE 
          ) {
        scanner->special_pound_if_mode_if_depth += 1;
        scanner->special_pound_if_mode = true;
      }
      scanner->terminated_newline = false;
      return true;
    }
  }

  if (valid_symbols[EMBEDDED_JS_SPECIAL_CASE_COMPLETE]) {
    int i = 0;
    while (i<scanner->js_marker_buffer_reversed_len) {
      advance(lexer);
      i++;
    }
    lexer->result_symbol = EMBEDDED_JS_SPECIAL_CASE_COMPLETE;
    scanner->terminated_newline = false;
    return true;
  }

if (valid_symbols[EMBEDDED_JS_SPECIAL_CASE]) {
  if (scanner->js_marker_buffer_reversed_len == 0) return false;
  return ObjectScript_Core_Scanner_lex_marker_fenced_text(
      lexer,
      EMBEDDED_JS_SPECIAL_CASE,
      scanner->js_marker_buffer_reversed,
      scanner->js_marker_buffer_reversed_len,
      '>');
}

if (valid_symbols[HTML_MARKER_REVERSED]) {
  while (scanner->html_marker_buffer_len >0 && !lexer->eof(lexer)) {
    int32_t expected = scanner->html_marker_buffer[scanner->html_marker_buffer_len - 1];

    if (expected == '[') expected = ']';
    else if (expected == ']') expected = '[';

    if (lexer->lookahead != expected) {
      scanner->terminated_newline = false;
      return false;
    }

    advance(lexer);
    scanner->html_marker_buffer_len -= 1;
  }

  if (scanner->html_marker_buffer_len > 0) {
    return false;
  }

  scanner->html_marker_buffer_len = 0;  
  lexer->result_symbol = HTML_MARKER_REVERSED;
  scanner->terminated_newline = false;
  return true;
}


if (valid_symbols[HTML_MARKER]) {
    scanner->html_marker_buffer_len=0;
    lexer->mark_end(lexer);

    while (!lexer->eof(lexer) && is_validHTML_MARKER_char(lexer->lookahead)) {
      if (scanner->html_marker_buffer_len == MARKER_BUFFER_MAX_LEN) {
        return false;  
      }
      scanner->html_marker_buffer[scanner->html_marker_buffer_len] = lexer->lookahead;
      scanner->html_marker_buffer_len +=1;
      advance(lexer);
      lexer->mark_end(lexer);
    }

    if (scanner->html_marker_buffer_len == 0 || lexer->lookahead != '<') {
      return false;
    }
    scanner->js_marker_buffer_reversed_len = scanner->html_marker_buffer_len;
    for (uint8_t i = 0; i < scanner->html_marker_buffer_len; i++) {
      if (scanner->html_marker_buffer[scanner->html_marker_buffer_len - 1 - i] == '[') {
        scanner->js_marker_buffer_reversed[i] = ']';
      }
      else if (scanner->html_marker_buffer[scanner->html_marker_buffer_len - 1 - i] == ']') {
        scanner->js_marker_buffer_reversed[i] = '[';
      }
      else {
        scanner->js_marker_buffer_reversed[i] =
          scanner->html_marker_buffer[scanner->html_marker_buffer_len - 1 - i];
      }
    }

    lexer->result_symbol = HTML_MARKER;
    scanner->terminated_newline = false;
    return true;
}
if (valid_symbols[EMBEDDED_SQL_REVERSE_MARKER]) {
  while (scanner->sql_marker_buffer_len >0 && !lexer->eof(lexer)) {
    int32_t expected = scanner->sql_marker_buffer[scanner->sql_marker_buffer_len - 1];

    if (expected == '[') expected = ']';
    else if (expected == ']') expected = '[';
    else if (expected == '{') expected = '}';
    else if (expected == '}') expected = '{';

    if (lexer->lookahead != expected) {
      scanner->terminated_newline = false;
      return false;
    }

    advance(lexer);
    scanner->sql_marker_buffer_len -= 1;
  }

  if (scanner->sql_marker_buffer_len > 0) {
    return false;
  }

  scanner->sql_marker_buffer_len = 0;  
  lexer->result_symbol = EMBEDDED_SQL_REVERSE_MARKER;
  scanner->terminated_newline = false;
  return true;
}
if (valid_symbols[EMBEDDED_SQL_MARKER]) {
    scanner->sql_marker_buffer_len=0;
    lexer->mark_end(lexer);

    while (!lexer->eof(lexer) && is_valid_sql_marker_char(lexer->lookahead)) {
      if (scanner->sql_marker_buffer_len == MARKER_BUFFER_MAX_LEN) {
        return false; 
      }
      scanner->sql_marker_buffer[scanner->sql_marker_buffer_len] = lexer->lookahead;
      scanner->sql_marker_buffer_len +=1;
      advance(lexer);
      lexer->mark_end(lexer);
    }

    if (scanner->sql_marker_buffer_len == 0 || lexer->lookahead != '(') {
      return false;
    }
    lexer->result_symbol = EMBEDDED_SQL_MARKER;
    scanner->terminated_newline = false;
    return true;
}

if (valid_symbols[_TERMINATION]) {
        if (valid_symbols[_WHITESPACE] &&
            (lexer->lookahead == ';' || lexer->lookahead == '/' ||
             (lexer->lookahead == '#' && !scanner->special_pound_if_mode))) {
            return false;
        }
        if (lexer->lookahead == '\n' && valid_symbols[_WHITESPACE]) {
            // If the next line starts with && or ||, treat newline as whitespace
            // so multiline IF/WHILE conditions continue.
            lexer->mark_end(lexer);
            if (scanner->special_pound_if_mode && valid_symbols[_ZW_BLOCK]) {
              
                  lexer->mark_end(lexer);
                  lexer->result_symbol = _TERMINATION;
                  return true;
                }
            advance(lexer);
            while (!lexer->eof(lexer) && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
              advance(lexer);
            }
            // Allow comment-only lines between a condition and a following
            // block opener
            while (!lexer->eof(lexer)) {
              bool consumed_comment_line = false;

              if (lexer->lookahead == ';') {
                consumed_comment_line = true;
                while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
                  advance(lexer);
                }
              } else if (lexer->lookahead == '/') {
                advance(lexer);
                if (lexer->lookahead == '/') {
                  consumed_comment_line = true;
                  while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
                    advance(lexer);
                  }
                }
              } else if (lexer->lookahead == '#') {
                advance(lexer);
                if (lexer->lookahead == ';') {
                  consumed_comment_line = true;
                  while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
                    advance(lexer);
                  }
                } else if (lexer->lookahead == '#') {
                  advance(lexer);
                  if (lexer->lookahead == ';') {
                    consumed_comment_line = true;
                    while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
                      advance(lexer);
                    }
                  }
                }
              }

              if (!consumed_comment_line) {
                break;
              }

              if (lexer->lookahead == '\n') {
                advance(lexer);
                while (!lexer->eof(lexer) && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
                  advance(lexer);
                }
              } else {
                break;
              }
            }

            if (valid_symbols[BOL] && lexer->lookahead == '.') {
              lexer->mark_end(lexer);
              unsigned dots = 0;
              while (lexer->lookahead == '.') {
                advance(lexer);
                dots++;
              }
              bool is_decimal = false;
              if (lexer->lookahead == '.' ||
                  (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
                is_decimal = true;
              }
              if (!is_decimal && dots > 0) {
                lexer->result_symbol = BOL;
                scanner->terminated_newline = false;
                return true;
              }
            }
            if (lexer->lookahead == '{' || lexer->lookahead ==',') {
              lexer->mark_end(lexer);
              lexer->result_symbol = _WHITESPACE;
              scanner->terminated_newline = false;
              return true;
            }
            if (is_short_circuit_continuation_operator(lexer)) {
              lexer->result_symbol = _WHITESPACE;
              scanner->terminated_newline = false;
              return true;
            }
            scanner->terminated_newline = true;
            lexer->result_symbol = _TERMINATION;
            return true;
        }
        bool is_termination = (lexer->lookahead == '\n' ||
                                      lexer->lookahead == '}' ||
                                      lexer->lookahead == ';' ||
                                      lexer->eof(lexer));
        if (is_termination) {
            if (lexer->lookahead == '\n') {
                scanner->terminated_newline = true;
            }
            else {
                scanner->terminated_newline = false;
            }
            lexer->result_symbol = _TERMINATION;
            return true;
        }
        if (lexer->lookahead == '/') {
          lexer->mark_end(lexer); 
          advance(lexer);

          if (is_label_char(lexer->lookahead) && valid_symbols[MNEMONIC]) {
            lexer->result_symbol = MNEMONIC;
            return true;
          }
          if (lexer->lookahead == '/') {
            scanner->terminated_newline = false;
            lexer->result_symbol = _TERMINATION;
            return true;
          }
        }
        if (lexer->lookahead=='#') {
          lexer->mark_end(lexer); 
          advance(lexer);
          if(lexer->lookahead=='#') {
            advance(lexer);
            if(lexer->lookahead==';') {
              lexer->result_symbol = _TERMINATION;
              return true;
            }
          }
          
        }
}

if (valid_symbols[_ZBREAK_DEVICE_TERMINATION] && iswspace(lexer->lookahead)) {
  lexer->result_symbol = _ZBREAK_DEVICE_TERMINATION;  
  scanner->terminated_newline = false;
  return true;  
}


if (valid_symbols[_ARGUMENTLESS_LOOP]) {
    bool is_block = (lexer->lookahead == '{');
    if (is_block) {
        lexer->result_symbol = _ARGUMENTLESS_LOOP;
        scanner->terminated_newline = false;
        return true;
    }
}

if (valid_symbols[_POST_CONDITIONAL_ID] && lexer->lookahead==':') {
  lexer->mark_end(lexer);
  lexer->advance(lexer, false);
  if (!(iswspace(lexer->lookahead))) {
    lexer->result_symbol = _POST_CONDITIONAL_ID;
    scanner->terminated_newline = false;
    return true;
  }
}

  if((valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE] ||
  valid_symbols[_ARGUMENTLESS_COMMAND_END] ||
  valid_symbols[_ARGUMENTLESS_LOOP])
  && iswspace(lexer->lookahead)
  ) {
        int count = 0;
        bool tab = false;
        if (lexer->lookahead == ' ') {
         while (!lexer->eof(lexer) && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
            count ++;
            if (lexer->lookahead == '\t') {
              tab = true;
            }
            lexer->advance(lexer, false);
         }
        bool is_termination = (lexer->lookahead == '\n' ||
                              lexer->lookahead == '\r' ||
                              lexer->lookahead == '}' ||
                              lexer->lookahead == '/' ||
                              lexer->lookahead == ';' ||
                              lexer->eof(lexer));

        bool termination_new_line = (lexer->lookahead == '\n' || lexer->lookahead == '\r' || scanner->terminated_newline);

        bool is_block = (lexer->lookahead == '{');

        bool saw_slash = false;

        if (count == 1 && !is_block && !is_termination) {
            if (valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE]) {
                lexer->result_symbol = _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE;
                scanner->terminated_newline = false;
                return true;
            }
        }

        if (count == 1 && is_block && valid_symbols[_ZW_BLOCK]) {
          lexer->result_symbol = _ZW_BLOCK;
          scanner->terminated_newline = false;
          return true;
        }
        
        if (count == 1 && lexer->lookahead == '/') {
          lexer->mark_end(lexer);
          advance(lexer);
          if (is_label_char(lexer->lookahead)) {
            scanner->terminated_newline = false;
            if (valid_symbols[MNEMONIC]) {
              lexer->result_symbol = MNEMONIC;
              return true;
            }
            if (valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE]) {
              lexer->result_symbol = _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE;
              return true;
            }
          }

          if (lexer->lookahead == '/') {
            lexer->advance(lexer, true);

            while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
              lexer->advance(lexer, true);
            }

            if (valid_symbols[_ARGUMENTLESS_LOOP]) {
              bool new_line = false;
              while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                if (lexer->lookahead == '\n') {
                  new_line = true;
                }
                lexer->advance(lexer, false);
              }
              if (lexer->lookahead == '{' && new_line) {
                lexer->result_symbol = _ARGUMENTLESS_LOOP;
                scanner->terminated_newline = false;
                lexer->mark_end(lexer);
                return true;
              }
            }

            if (valid_symbols[_TERMINATION]) {
              lexer->result_symbol = _TERMINATION;
              scanner->terminated_newline = false;
              lexer->mark_end(lexer);
              return true;
            }
          }

          if (lexer->lookahead == '*') {
            lexer->advance(lexer, true);
            while (!lexer->eof(lexer)) {
              if (lexer->lookahead == '*') {
                lexer->advance(lexer, true);
                if (lexer->lookahead == '/') {
                  lexer->advance(lexer, true);
                  break;
                }
              } else {
                lexer->advance(lexer, true);
              }
            }
            if (valid_symbols[_ARGUMENTLESS_LOOP]) {
              bool new_line = false;
              while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                if (lexer->lookahead == '\n') {
                  new_line = true;
                }
                lexer->advance(lexer, false);
              }
              if (lexer->lookahead == '{' && new_line) {
                lexer->result_symbol = _ARGUMENTLESS_LOOP;
                scanner->terminated_newline = false;
                lexer->mark_end(lexer);
                return true;
              }
            }
            if (valid_symbols[_TERMINATION]) {
              lexer->result_symbol = _TERMINATION;
              scanner->terminated_newline = false;
              lexer->mark_end(lexer);
              return true;
            }
          }

          saw_slash = true;
        }

        if (valid_symbols[_ARGUMENTLESS_LOOP] && is_block) {
            lexer->result_symbol = _ARGUMENTLESS_LOOP;
            scanner->terminated_newline = false;
            return true;
        }

        if (count >= 2 && valid_symbols[_ARGUMENTLESS_COMMAND_END] && !is_block && !is_termination) {
            lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
            scanner->terminated_newline = false;
            return true;
        }

        if ((count >= 2 || tab) && !valid_symbols[_ARGUMENTLESS_LOOP] && valid_symbols[_ARGUMENTLESS_COMMAND_END]) {
            lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
            scanner->terminated_newline = false;
            return true;
        }

        if (count >=1 && (valid_symbols[_ARGUMENTLESS_COMMAND_END] || valid_symbols[_TERMINATION] || (valid_symbols[BOL] && termination_new_line)) && !is_block) {
            if (lexer->lookahead=='/' || saw_slash) { 
                lexer->mark_end(lexer);
                lexer->advance(lexer, true);
                
                if (lexer->lookahead=='/') {
                  lexer->advance(lexer, true);

                  while (!lexer->eof(lexer) && !(lexer->lookahead=='\n')) {
                      lexer->advance(lexer, true);
                  }
                  if (valid_symbols[_ARGUMENTLESS_LOOP]) {
                      bool new_line = false;
                      while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                          if (lexer->lookahead == '\n') {
                            new_line = true;
                          }
                          lexer->advance(lexer, false);
                      }
                      if (lexer->lookahead == '{' && new_line) {
                          lexer->result_symbol = _ARGUMENTLESS_LOOP;
                          scanner->terminated_newline = false;
                          lexer->mark_end(lexer);
                          return true;
                      }
                  }
                  if(valid_symbols[_TERMINATION]) {
                      lexer->result_symbol = _TERMINATION;
                      scanner->terminated_newline = false;
                      lexer->mark_end(lexer);
                      return true;
                  }
                }
                if (lexer->lookahead=='*') {
                lexer->advance(lexer, true);
                bool new_line = false;
                    while (!lexer->eof(lexer)) {
                          if (lexer->lookahead == '\n') {
                            new_line = true;

                          }
                          if (lexer->lookahead == '*') {
                            lexer->advance(lexer, true);
                            if (lexer->lookahead == '/') {
                              lexer->advance(lexer, true);
                              break;

                            }
                          } else {
                            lexer->advance(lexer, true);
                          }
                    }
                    if (!new_line) {
                        lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
                        scanner->terminated_newline = false;
                        return true;
                      }
                    else {
                      if(valid_symbols[_TERMINATION]) {
                          lexer->result_symbol = _TERMINATION;
                          scanner->terminated_newline = true;
                          return true;
                      }
                    }
                }
            }
            bool new_line = false;
            while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                if (lexer->lookahead == '\n') {
                  if(!valid_symbols[_ARGUMENTLESS_LOOP] && valid_symbols[_TERMINATION]) {
                    lexer->result_symbol = _TERMINATION;
                    return true;
                  }
                    new_line=true;
                }
                lexer->advance(lexer, false);
            }
            if (new_line) {
                scanner->terminated_newline=true;
            }

            bool is_block = (lexer->lookahead == '{');
            bool is_dot = (lexer->lookahead == '.');

            if (valid_symbols[_ARGUMENTLESS_LOOP] && is_block) {
                lexer->result_symbol = _ARGUMENTLESS_LOOP;
                scanner->terminated_newline = false;
                return true;
            }

            if(valid_symbols[_TERMINATION] && (is_termination || new_line) && !is_block) {
                lexer->result_symbol = _TERMINATION;
                if (termination_new_line || new_line) {
                    scanner->terminated_newline = true;
                }
                else {
                    scanner->terminated_newline = false;
                }
                return true;
            }

            if(valid_symbols[BOL] && is_dot) {
                lexer->mark_end(lexer);
                unsigned dots = 0;
                while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
                bool is_decimal = false;
                if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
                    is_decimal = true;
                }
                if (!is_decimal && dots > 0 && (scanner->terminated_newline || new_line || termination_new_line)) {
                    lexer->result_symbol = BOL;
                    scanner->terminated_newline = false;
                    return true;
                }
            }

        }
        }
        else {
            bool is_termination = (lexer->lookahead == '}' ||
                                          lexer->lookahead == '/' ||
                                          lexer->lookahead == ';' ||
                                          lexer->eof(lexer));
            bool new_line=false;
            bool tab = false;
            while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                if (lexer->lookahead == '\n') {
                    new_line=true;
                }
                if (lexer->lookahead == '\t') {
                    tab = true;
                }
                lexer->advance(lexer, false);
            }
            bool is_block = (lexer->lookahead == '{');
            bool is_dot = (lexer->lookahead == '.');
            if (valid_symbols[_TERMINATION] && !is_block && (new_line || is_termination)) {
                lexer->result_symbol = _TERMINATION;
                scanner->terminated_newline = new_line;
                return true;
            }

            if (tab && !valid_symbols[_ARGUMENTLESS_LOOP] && valid_symbols[_ARGUMENTLESS_COMMAND_END] && valid_symbols[_TERMINATION]) {
            lexer->result_symbol = _TERMINATION;
            scanner->terminated_newline = false;
            return true;
          }


            if (valid_symbols[BOL] && !is_block && is_dot && (new_line || scanner->terminated_newline)) {
                lexer->mark_end(lexer);
                unsigned dots = 0;
                while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
                bool is_decimal = false;
                if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
                    is_decimal = true;
                }
                if (!is_decimal && dots > 0) {
                    lexer->result_symbol = BOL;
                    scanner->terminated_newline = false;
                    return true;
                }

            }

            if (valid_symbols[_ARGUMENTLESS_LOOP] && is_block) {
                lexer->result_symbol = _ARGUMENTLESS_LOOP;
                scanner->terminated_newline = false;
                return true;
            }
        }
  }
else if (valid_symbols[_ASSERT_NO_SPACE_BETWEEN_RULES]) {
    if (!iswspace(lexer->lookahead)) {
      lexer->result_symbol = _ASSERT_NO_SPACE_BETWEEN_RULES;
      scanner->terminated_newline = false;
      return true;
    }
    return false;
  } else if (valid_symbols[TAG] &&
               lexer->get_column(lexer) == 0 &&
               is_label_char(lexer->lookahead)) {
    int32_t ident[96];
    uint32_t len = 0;
    do {
      if (len < sizeof(ident) / sizeof(ident[0])) ident[len++] = lexer->lookahead;
      advance(lexer);
    } while (is_label_char(lexer->lookahead));

    if (scanner->routine_token_mode &&
        valid_symbols[ROUTINE] &&
        ascii_upper_eq(ident, len, "ROUTINE")) {
      lexer->result_symbol = ROUTINE;
      scanner->terminated_newline = false;
      return true;
    }

    if (ascii_upper_eq(ident, len, "IRIS")) {
        return false;
    }

    if (!scanner->column1_statement_mode) {
      lexer->result_symbol = TAG;
      scanner->terminated_newline = false;
      return true;
    }

    // Rule 1: if there is a tab after the identifier, treat as a definite tag.
    if (lexer->lookahead == '\t') {
      lexer->result_symbol = TAG;
      scanner->terminated_newline = false;
      return true;
    }

    // Rule 2/3: in column-1 statement mode, keyword-like names default to
    // statements/class-statements; non-keywords are tags.
    if (!is_statement_or_class_keyword(ident, len)) {
      lexer->result_symbol = TAG;
      scanner->terminated_newline = false;
      return true;
    }
    return false;
  } 
  else if (valid_symbols[ANGLED_BRACKET_FENCED_TEXT]) {
    bool ok = ObjectScript_Core_Scanner_lex_fenced_text(
        lexer, ANGLED_BRACKET_FENCED_TEXT, '<', '>'); 
    return ok;
  } else if (valid_symbols[PAREN_FENCED_TEXT]) {
    bool ok = ObjectScript_Core_Scanner_lex_fenced_text(
        lexer, PAREN_FENCED_TEXT, '(', ')');
    return ok;
  }

  else if (valid_symbols[_LINE_COMMENT_INNER]) {
    lexer->result_symbol = _LINE_COMMENT_INNER;
    for (;;) {
      if (lexer->eof(lexer)) {
        scanner->terminated_newline = false;
        return true;
      }

      if (lexer->lookahead == '\n') {
        scanner->terminated_newline = false;
        return true;
      }

      advance(lexer);
    }
  } else if (valid_symbols[_BLOCK_COMMENT_INNER]) {
    while (!lexer->eof(lexer)) {
      if (lexer->lookahead == '*') {
        lexer->mark_end(lexer);
        advance(lexer);
        if (lexer->lookahead == '/') {
          lexer->result_symbol = _BLOCK_COMMENT_INNER;
          scanner->terminated_newline = false;
          return true;
        }
      } else {
        advance(lexer);
        lexer->mark_end(lexer);
      }
    }
  } else if (valid_symbols[MACRO_VALUE_LINE_WITH_CONTINUE]) {
    static const char pattern[] = "##continue";
    static const int  len       = sizeof(pattern)-1;

    int pos = 0;

    if (!lexer->eof(lexer) && !iswspace(lexer->lookahead)) {
      scanner->terminated_newline = false;
      return false;
    }

    while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
      char ch = towlower(lexer->lookahead);


      if ((pos < len) && (ch == pattern[pos])) {
        if (pos++ == 0) {
          lexer->mark_end(lexer);
        }

        if (pos == len) {
          advance(lexer);
          int new_line_count = 0;
          while(iswspace(lexer->lookahead) && new_line_count<1) {
            if(lexer->lookahead=='\n') {
              new_line_count++;
            }
            advance(lexer);
          }
          if(new_line_count==1) {
            lexer->mark_end(lexer); 
            lexer->result_symbol = MACRO_VALUE_LINE_WITH_CONTINUE;
            scanner->terminated_newline = false;
            return true;
          }
        }
      } else {
        if (ch == pattern[0]) {
          pos = 1;
          lexer->mark_end(lexer);
        } else {
          pos = 0;
        }
      }

      advance(lexer);
    }

    scanner->terminated_newline = false;
    return false;

}
    else if (valid_symbols[BOL] && scanner->terminated_newline && !iswspace(lexer->lookahead)) {
        lexer->mark_end(lexer);
        unsigned dots = 0;
        while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
        bool is_decimal = false;
        if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
            is_decimal = true;
        }
        if (dots > 0 && !is_decimal) {
                lexer->result_symbol = BOL;
                scanner->terminated_newline = false;
                return true;
        }
    }
  
    else if ((valid_symbols[_WHITESPACE] || valid_symbols[BOL]) && (iswspace(lexer->lookahead)))  {
    bool consumed = false;
    bool saw_nl   = scanner->terminated_newline;

    while (iswspace(lexer->lookahead)) {
      if (lexer->lookahead == '\n') {
        // End the current statement before the next dotted line so
        // constructs like `x` newline `. quit` do not collapse into `x.quit`.
        if (valid_symbols[_TERMINATION] && consumed) {
          lexer->result_symbol = _WHITESPACE;
          scanner->terminated_newline = false;
          return true;
          
        }
        saw_nl = true;
      
      }
      lexer->advance(lexer,false);
      consumed = true;
    }

    unsigned dots = 0;

    lexer->mark_end(lexer);
    
    while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
    bool is_decimal = false;
    if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
        is_decimal = true;
    }
    if (saw_nl && valid_symbols[BOL] && dots > 0 && !is_decimal) {
        lexer->result_symbol = BOL;
        scanner->terminated_newline = false;
        return true;
    }

    if (!consumed && scanner->terminated_newline == false) return false;    
    lexer->result_symbol = _WHITESPACE;
    scanner->terminated_newline = false;
    return true;
  }
  else if (valid_symbols[TAG] && scanner->special_pound_if_mode) {
      while (iswspace(lexer->lookahead)) {
        advance(lexer);
      }
      if (lexer->lookahead == '#') {
        lexer->mark_end(lexer);
        advance(lexer);

        int32_t directive[16];
        uint32_t len = 0;
        while (len < (sizeof(directive) / sizeof(directive[0])) &&
               is_ascii_alpha_i32(lexer->lookahead)) {
          directive[len++] = ascii_toupper_i32(lexer->lookahead);
          advance(lexer);
        }

        if (ascii_upper_eq(directive, len, "ENDIF")) {
          if (scanner->special_pound_if_mode_if_depth > 0) {
            scanner->special_pound_if_mode_if_depth -= 1;
            if (scanner->special_pound_if_mode_if_depth<1) {
              scanner->special_pound_if_mode=false;
            }
            lexer->result_symbol = TAG_END_IF;
            lexer->mark_end(lexer);
            return true;
          }
          return false;
        }

      }
  }
  scanner->terminated_newline = false;
  return false;
}

static void ObjectScript_Core_Scanner_init(struct ObjectScript_Core_Scanner *scanner) {
  scanner->sql_marker_buffer_len = 0;
  scanner->html_marker_buffer_len = 0;
  scanner->terminated_newline = false;
  scanner->column1_statement_mode = false;
  scanner->routine_token_mode = false;
  scanner->special_pound_if_mode = false;
  scanner->special_pound_if_mode_if_depth = 0;
}
