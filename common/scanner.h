#include "tree_sitter/parser.h"
#include <string.h>
#include <wctype.h>
#include <stdio.h>

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
  // printf("ADVANCING '%c'\n", lexer->lookahead);
  lexer->advance(lexer, false);
  // printf("AT: '%c'\n", lexer->lookahead);
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
  int32_t html_marker_buffer[MARKER_BUFFER_MAX_LEN];
  int html_marker_buffer_len;
  int32_t sql_marker_buffer[MARKER_BUFFER_MAX_LEN];
  int sql_marker_buffer_len;
  int32_t js_marker_buffer_reversed[MARKER_BUFFER_MAX_LEN];
  int js_marker_buffer_reversed_len;
};

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
      continue;
    }

    // Ordinary character inside JS body
    advance(lexer);
  }

  // EOF without closing fence – let parser produce an error
  return false;
}


/// This is the interesting function. The rest is infrastructure
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
    //  printf("ERROR AT: '%c'. COL: %d\n", lexer->lookahead,
    //         lexer->get_column(lexer));
    return false;
  }
  
if (valid_symbols[EMBEDDED_JS_SPECIAL_CASE]) {
  if (scanner->js_marker_buffer_reversed_len == 0) return false; // defensive
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
  }

  if (valid_symbols[_ZBREAK_DEVICE_TERMINATION] && iswspace(lexer->lookahead)) {
    lexer->result_symbol = _ZBREAK_DEVICE_TERMINATION;  
    scanner->terminated_newline = false;
    return true;  
  }


if (valid_symbols[_ARGUMENTLESS_LOOP]) {
//    fprintf(stderr,"ARG");
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
//        fprintf(stderr, "HERE");
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

        // fprintf(stderr, "DEBUG[BUNCH] col=%u termination=%u block=%u lookahead='%c'\n",
        //                 lexer->get_column(lexer), is_termination, is_block,lexer->lookahead);


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
            // CHANGES HERE
            lexer->mark_end(lexer);
            lexer->advance(lexer, false);
            // c, d, t, e, i, s, n
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
                          scanner->terminated_newline = true; // I THINK THIS SHOULD BE TRUE
                          return true;
                      }
                    }
                }
            }
//            fprintf(stderr, "before checks");
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
              //  fprintf(stderr,"DOES IT EVER GET TO BOL BLOCK");
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
               (iswalnum(lexer->lookahead) || lexer->lookahead == '%')) { //
    if (iswalnum(lexer->lookahead) || lexer->lookahead == '%') {
      do {
        advance(lexer);
      } while (iswalnum(lexer->lookahead) || lexer->lookahead == '%');
      lexer->result_symbol = TAG;
      scanner->terminated_newline = false;
      return true;
    } else {
      // The ObjectScript_Core_Scanner_TokenType NEWLINE is the literal '\n',
      // This means that if we return false,
      // It's ok because TS will fall back to lexing '\n' properly
      // See bottom of this page for more info:
      // https://tree-sitter.github.io/tree-sitter/creating-parsers
      return false;
    }
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
          lexer->result_symbol = MACRO_VALUE_LINE_WITH_CONTINUE;
          scanner->terminated_newline = false;
          return true;
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
//     fprintf(stderr,"WHITESPACE  CHECK");
//     fprintf(stderr, "scan: lookahead='%c' (%d), col=%u\n",
//              lexer->lookahead, lexer->lookahead, lexer->get_column(lexer));
    bool consumed = false;
    bool saw_nl   = scanner->terminated_newline;

    while (iswspace(lexer->lookahead)) {
      if (lexer->lookahead == '\n') saw_nl = true;
      lexer->advance(lexer,false);         // <-- advance(false): add char to this token
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

    // fprintf(stderr, "DEBUG[BOL] dots=%u lookahead='%c'\n",
    //             dots, lexer->lookahead);

    // fprintf(stderr, "is_decimal, saw_nl, valid_symbols[_BOL] %d %d %d", is_decimal, saw_nl, valid_symbols[_BOL]);

    if (saw_nl && valid_symbols[_BOL] && dots > 0 && !is_decimal) {
        lexer->result_symbol = _BOL;
        scanner->terminated_newline = false;
        return true;
    }

    if (!consumed && scanner->terminated_newline == false) return false;          // no whitespace -> not this token
//    if (saw_nl) scanner->at_bol = true;
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
}
