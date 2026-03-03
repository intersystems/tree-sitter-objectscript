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
  ANGLED_BRACKET_FENCED_TEXT,
  PAREN_FENCED_TEXT,
  EMBEDDED_SQL_MARKER,
  EMBEDDED_SQL_REVERSE_MARKER,
  _LINE_COMMENT_INNER,
  _BLOCK_COMMENT_INNER,
  MACRO_VALUE_LINE_WITH_CONTINUE,
  SENTINEL,
  _BOL,
  _TERMINATION,
  ZBREAK_COMMAND,
  _ZBREAK_DEVICE_TERMINATION,
  _POST_CONDITIONAL_ID,
  _XECUTE_ARG_INVALID,
  _ZW_BLOCK,
  HTML_MARKER,
  HTML_MARKER_REVERSED,
  EMBEDDED_JS_SPECIAL_CASE,
  EMBEDDED_JS_SPECIAL_CASE_COMPLETE,
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
  "ANGLED_BRACKET_FENCED_TEXT",
  "PAREN_FENCED_TEXT",
  "EMBEDDED_SQL_MARKER",
  "EMBEDDED_SQL_REVERSE_MARKER",
  "_LINE_COMMENT_INNER",
  "_BLOCK_COMMENT_INNER",
  "MACRO_VALUE_LINE_WITH_CONTINUE",
  "SENTINEL",
  "_BOL",
  "_INLINE_STATEMENT_SEPARATOR",
  "_TERMINATION",
  "ZBREAK_COMMAND",
  "_ZBREAK_DEVICE_TERMINATION",
  "_POST_CONDITIONAL_ID",
  "_XECUTE_ARG_INVALID",
  "_ZW_BLOCK",
  "HTML_MARKER",
  "HTML_MARKER_REVERSED",
  "EMBEDDED_JS_SPECIAL_CASE",
  "EMBEDDED_JS_SPECIAL_CASE_COMPLETE"
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

static inline void skip   (TSLexer *lexer) { lexer->advance(lexer, true ); }

#define MARKER_BUFFER_MAX_LEN 30
struct ObjectScript_Core_Scanner {
  int32_t marker_buffer[MARKER_BUFFER_MAX_LEN];
  int marker_buffer_len;
  bool terminated_newline;
  // When true, column-1 identifiers are treated as statements unless they
  // are clearly labels/tags.
  bool column1_statement_mode;
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
  // Only ASCII letter-start keywords are relevant here.
  if (len == 0) return false;
  int32_t c0 = ascii_toupper_i32(text[0]);
  if (!(c0 >= 'A' && c0 <= 'Z')) return false;

  // ZZ* commands
  if (len >= 3 && c0 == 'Z' && ascii_toupper_i32(text[1]) == 'Z') return true;

  // Statement keywords (including short forms accepted by the grammar)
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
  if (ascii_upper_eq(text, len, "ZB") || ascii_upper_eq(text, len, "ZBREAK")) return true;
  if (ascii_upper_eq(text, len, "ZK") || ascii_upper_eq(text, len, "ZKILL")) return true;
  if (ascii_upper_eq(text, len, "ZN") || ascii_upper_eq(text, len, "ZNSPACE")) return true;
  if (ascii_upper_eq(text, len, "ZSU")) return true;
  if (ascii_upper_eq(text, len, "ZT") || ascii_upper_eq(text, len, "ZTRAP")) return true;

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
      // Potential start of closing sequence ">CBA"
      lexer->mark_end(lexer);
      advance(lexer); // consume '>'

      uint8_t i = 0;
      while (i < reverse_marker_len && !lexer->eof(lexer)
             && lexer->lookahead == reverse_marker[i]) {
        advance(lexer);
        i++;
      }

      if (i == reverse_marker_len) {
        // We just consumed ">CBA" (or whatever reverse_marker is)
        lexer->result_symbol = desired_symbol;
        return true;
      }

      // Not actually closing; treat what we consumed as part of the text
      // and keep scanning.
      lexer->mark_end(lexer);
      continue;
    }

    // Ordinary character inside JS body
    advance(lexer);
  }

  // EOF without closing fence – let parser produce an error
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

  if (valid_symbols[EMBEDDED_JS_SPECIAL_CASE_COMPLETE]) {
    int i = 0;
    // we already know marker is valid, now we want to consume it
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

if (valid_symbols[_TERMINATION] && valid_symbols[_ARGUMENTLESS_LOOP] && lexer->lookahead=='\n') {
    // normally this would be a termination, but we need to make sure that it isn't a block.
    while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
        lexer->advance(lexer,false);
    }
    bool is_block = (lexer->lookahead == '{');
    if (is_block) {
        lexer->result_symbol = _ARGUMENTLESS_LOOP;
        scanner->terminated_newline = false;
        return true;
    }
    else {
        scanner->terminated_newline = true;
        lexer->result_symbol = _TERMINATION;
        return true;

    }
}

if (valid_symbols[HTML_MARKER_REVERSED]) {
  // lexer->mark_end(lexer);
  while (scanner->html_marker_buffer_len >0 && !lexer->eof(lexer)) {
    int32_t expected = scanner->html_marker_buffer[scanner->html_marker_buffer_len - 1];

    if (expected == '[') expected = ']';
    else if (expected == ']') expected = '[';

    if (lexer->lookahead != expected) {
      scanner->terminated_newline = false;
      return false;
    }

    advance(lexer);
    // lexer->mark_end(lexer);
    scanner->html_marker_buffer_len -= 1;
  }

  if (scanner->html_marker_buffer_len > 0) {
    // Ran out of input before fully matching reverse marker
    return false;
  }

  scanner->html_marker_buffer_len = 0;  // reset for next pair
  lexer->result_symbol = HTML_MARKER_REVERSED;
  scanner->terminated_newline = false;
  return true;
}


if (valid_symbols[HTML_MARKER]) {
    scanner->html_marker_buffer_len=0;
    lexer->mark_end(lexer);

    while (!lexer->eof(lexer) && is_validHTML_MARKER_char(lexer->lookahead)) {
      if (scanner->html_marker_buffer_len == MARKER_BUFFER_MAX_LEN) {
        return false; // too long
      }
      scanner->html_marker_buffer[scanner->html_marker_buffer_len] = lexer->lookahead;
      scanner->html_marker_buffer_len +=1;
      advance(lexer);
      lexer->mark_end(lexer);
    }

    // Marker must be non-empty and must stop because of '<'
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
    // lexer->mark_end(lexer);
    scanner->sql_marker_buffer_len -= 1;
  }

  if (scanner->sql_marker_buffer_len > 0) {
    // Ran out of input before fully matching reverse marker
    return false;
  }

  scanner->sql_marker_buffer_len = 0;  // reset for next pair
  lexer->result_symbol = EMBEDDED_SQL_REVERSE_MARKER;
  scanner->terminated_newline = false;
  return true;
}
if (valid_symbols[EMBEDDED_SQL_MARKER]) {
    scanner->sql_marker_buffer_len=0;
    lexer->mark_end(lexer);

    while (!lexer->eof(lexer) && is_valid_sql_marker_char(lexer->lookahead)) {
      if (scanner->sql_marker_buffer_len == MARKER_BUFFER_MAX_LEN) {
        return false; // too long
      }
      scanner->sql_marker_buffer[scanner->sql_marker_buffer_len] = lexer->lookahead;
      scanner->sql_marker_buffer_len +=1;
      advance(lexer);
      lexer->mark_end(lexer);
    }

    // Marker must be non-empty and must stop because of '('
    if (scanner->sql_marker_buffer_len == 0 || lexer->lookahead != '(') {
      return false;
    }
    // Do NOT consume '<' – ANGLED_BRACKET_FENCED_TEXT will see it
    lexer->result_symbol = EMBEDDED_SQL_MARKER;
    scanner->terminated_newline = false;
    return true;
}

if (valid_symbols[_TERMINATION]) {
        bool is_termination = (lexer->lookahead == '\n' ||
                                      lexer->lookahead == '}' ||
                                      lexer->lookahead == '/' ||
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
        if (lexer->lookahead=='#') {
          lexer->mark_end(lexer); // check if it is a comment 
          advance(lexer);
          if(lexer->lookahead=='#') {
            advance(lexer);
            if(lexer->lookahead==';') {
              // confirmed comment
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
        if (lexer->lookahead == ' ') {
         while (!lexer->eof(lexer) && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
            count ++;
            lexer->advance(lexer, false);
         }
        bool is_termination = (lexer->lookahead == '\n' ||
                              lexer->lookahead == '}' ||
                              lexer->lookahead == '/' ||
                              lexer->lookahead == ';' ||
                              lexer->eof(lexer));

        bool termination_new_line = (lexer->lookahead == '\n');

        bool is_block = (lexer->lookahead == '{');


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
        
        if (count == 1 && !is_block && lexer->lookahead=='/' && valid_symbols[ZBREAK_COMMAND]) {
            lexer->mark_end(lexer);
            lexer->advance(lexer, false);
            if (lexer->lookahead == 'c' || 
                    lexer->lookahead == 'C' || 
                    lexer->lookahead == 'd' || 
                    lexer->lookahead == 'D' ||
                  lexer->lookahead == 't' || 
                    lexer->lookahead == 'T' ||
                  lexer->lookahead == 'e' || 
                    lexer->lookahead == 'E' ||
                  lexer->lookahead == 'i' || 
                    lexer->lookahead == 'I' ||
                  lexer->lookahead == 's' || 
                    lexer->lookahead == 'S' ||
                  lexer->lookahead == 'n' || 
                    lexer->lookahead == 'N') {  
            lexer->result_symbol = ZBREAK_COMMAND;  
            scanner->terminated_newline = false;
            return true;  
          }  
        }

        if (valid_symbols[_ARGUMENTLESS_LOOP] && is_block) {
            lexer->result_symbol = _ARGUMENTLESS_LOOP;
            scanner->terminated_newline = false;
            return true;
        }

        if (count == 2 && valid_symbols[_ARGUMENTLESS_COMMAND_END] && !is_block && !is_termination) {
            lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
            scanner->terminated_newline = false;
            return true;
        }

        if (count >=1 && (valid_symbols[_ARGUMENTLESS_COMMAND_END] || valid_symbols[_TERMINATION] || (valid_symbols[_BOL] && termination_new_line)) && !is_block) {
            // allow /* */
            if (lexer->lookahead=='/') { // potential comment
                lexer->advance(lexer, true);
                if (lexer->lookahead=='/') {
                lexer->advance(lexer, true);

                while (!lexer->eof(lexer) && !(lexer->lookahead=='\n')) {
                    lexer->advance(lexer, true);
                }
                // means the rest of the line is a comment
                if(valid_symbols[_TERMINATION]) {
                    lexer->result_symbol = _TERMINATION;
                    scanner->terminated_newline = false;
                    return true;
                }
                }
                if (lexer->lookahead=='*') {
                lexer->advance(lexer, true);
                bool new_line = false;
                    // parse until end of comment or end of file or new line
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
                    new_line=true;
                }
                lexer->advance(lexer, false);
            }
            // if new line, we are at the start
            if (new_line) {
                scanner->terminated_newline=true;
            }
            bool is_block = (lexer->lookahead == '{');
            bool is_dot = (lexer->lookahead == '.');

            if (valid_symbols[_ARGUMENTLESS_LOOP] && is_block) {
                // this is a block, not termination
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

            if(valid_symbols[_BOL] && is_dot) {
                unsigned dots = 0;
                while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
                // Don’t collide with decimals or relative-dot
                bool is_decimal = false;
                if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
                    is_decimal = true;
                }
                if (!is_decimal && dots > 0 && (scanner->terminated_newline || new_line || termination_new_line)) {
                    lexer->result_symbol = _BOL;
                    scanner->terminated_newline = false;
                    return true;
                }
            }

        }
        }
        else {
            // this HAS to be a newline or tab
            bool is_termination = (lexer->lookahead == '}' ||
                                          lexer->lookahead == '/' ||
                                          lexer->lookahead == ';' ||
                                          lexer->eof(lexer));
            bool new_line=false;
            while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                if (lexer->lookahead == '\n') {
                    new_line=true;
                }
                lexer->advance(lexer, false);
            }
            bool is_block = (lexer->lookahead == '{');
            bool is_dot = (lexer->lookahead == '.');
            if (valid_symbols[_TERMINATION] && !is_block && (new_line || is_termination)) {
                lexer->result_symbol = _TERMINATION;
                scanner->terminated_newline = false;
                return true;
            }


            if (valid_symbols[_BOL] && !is_block && is_dot && (new_line || scanner->terminated_newline)) {
                unsigned dots = 0;
                while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
                // Don’t collide with decimals or relative-dot
                bool is_decimal = false;
                if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
                    is_decimal = true;
                }
                if (!is_decimal && dots > 0 && (scanner->terminated_newline || new_line)) {
                    lexer->result_symbol = _BOL;
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
  } else if (valid_symbols[ANGLED_BRACKET_FENCED_TEXT]) {
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
        // Don't advance here, let the grammar consume this otherwise
        // it'll continue the comment to the next line
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
    // Pattern to match: ##continue (case insensitive)
    static const char pattern[] = "##continue";
    static const int  len       = sizeof(pattern)-1;

    int pos = 0;

    // It must start with at least one whitespace
    if (!lexer->eof(lexer) && !iswspace(lexer->lookahead)) {
      scanner->terminated_newline = false;
      return false;
    }

    while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
      char ch = towlower(lexer->lookahead);


      if ((pos < len) && (ch == pattern[pos])) {
        if (pos++ == 0) {
          // When we match the 1st char, mark the end of the token
          lexer->mark_end(lexer);
        }

        if (pos == len) {
          // Found complete ##continue pattern
          advance(lexer);
          int new_line_count = 0;
          while(iswspace(lexer->lookahead) && new_line_count<1) {
            if(lexer->lookahead=='\n') {
              new_line_count++;
            }
            advance(lexer);
          }
          if(new_line_count==1) {
            lexer->mark_end(lexer); // consume ##continue and the newline 
            lexer->result_symbol = MACRO_VALUE_LINE_WITH_CONTINUE;
            scanner->terminated_newline = false;
            return true;
          }
        }
      } else {
        // Character doesn't match, reset and check if current char starts pattern
        if (ch == pattern[0]) {
          pos = 1;
          lexer->mark_end(lexer);
        } else {
          pos = 0;
        }
      }

      advance(lexer);
    }

    // Didn't find ##continue before newline
    scanner->terminated_newline = false;
    return false;

}
    else if (valid_symbols[_BOL] && scanner->terminated_newline && !iswspace(lexer->lookahead)) {
        unsigned dots = 0;
        while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
        // Don’t collide with decimals or relative-dot
        bool is_decimal = false;
        if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
            is_decimal = true;
        }
        if (dots > 0 && !is_decimal) {
                lexer->result_symbol = _BOL;
                scanner->terminated_newline = false;
                return true;
        }
    }
    else if ((valid_symbols[_WHITESPACE] || valid_symbols[_BOL]) && (iswspace(lexer->lookahead)))  {
    bool consumed = false;
    bool saw_nl   = scanner->terminated_newline;

    while (iswspace(lexer->lookahead)) {
      if (lexer->lookahead == '\n') saw_nl = true;
      lexer->advance(lexer,false);
      consumed = true;
    }


    unsigned dots = 0;

    if (lexer->lookahead=='.' && valid_symbols[_XECUTE_ARG_INVALID]) {
      lexer->mark_end(lexer);
    }
    
    
    while (lexer->lookahead == '.') { lexer->advance(lexer,false); dots++; }
    // Don’t collide with decimals or relative-dot
    bool is_decimal = false;
    if (lexer->lookahead == '.' || (lexer->lookahead >= '0' && lexer->lookahead <= '9')) {
        is_decimal = true;
    }

    if (saw_nl && valid_symbols[_BOL] && dots > 0 && !is_decimal) {
        lexer->result_symbol = _BOL;
        scanner->terminated_newline = false;
        return true;
    }

    if (!consumed && scanner->terminated_newline == false) return false;          // no whitespace -> not this token
    lexer->result_symbol = _WHITESPACE;
    scanner->terminated_newline = false;
    return true;
  }
  scanner->terminated_newline = false;
  return false;
}
static void ObjectScript_Core_Scanner_init(struct ObjectScript_Core_Scanner *scanner) {
  scanner->sql_marker_buffer_len = 0;
  scanner->html_marker_buffer_len = 0;
  scanner->terminated_newline = false;
  scanner->column1_statement_mode = false;
}
