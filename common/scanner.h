#include "tree_sitter/parser.h"
#include <string.h>
#include <wctype.h>
// #include <stdio.h>

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
  "_XECUTE_ARG_INVALID"
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

static inline void skip   (TSLexer *lexer) { lexer->advance(lexer, true ); }

#define MARKER_BUFFER_MAX_LEN 30
struct ObjectScript_Core_Scanner {
  int32_t marker_buffer[MARKER_BUFFER_MAX_LEN];
  int marker_buffer_len;
  bool terminated_newline;
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
  

if (valid_symbols[_TERMINATION] && valid_symbols[_ARGUMENTLESS_LOOP] && lexer->lookahead=='\n') {
    // normally this would be a termination, but we need to make sure that it isn't a block.
//    fprintf(stderr,"HERE???");
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
        //                 lexer->get_column(lexer), lexer->lookahead);


        if (count == 1 && !is_block && !is_termination) {
            if (valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE]) {
                lexer->result_symbol = _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE;
                scanner->terminated_newline = false;
                return true;
            }
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
  } else if (valid_symbols[EMBEDDED_SQL_MARKER]) {
    // First, wipe the buffer if its already been used
    scanner->marker_buffer_len = 0;
    while (!lexer->eof(lexer)) {
      if (lexer->lookahead == '(') {
        // Note that EMBEDDED_SQL_MARKER can be zero width
        // That is ok and necessary.
        // If we made non zero width and made the marker
        // and its reverse optional,
        // we could not signal an error if marker was valid
        // but the reverse wasn't
        lexer->result_symbol = EMBEDDED_SQL_MARKER;
        scanner->terminated_newline = false;
        return true;
      }
      // The docs say that a marker cannot contain the following:
      // ( + - / \ | * )
      // And no whitespace
      if ((lexer->lookahead == '+') || (lexer->lookahead == '-') ||
          (lexer->lookahead == '/') || (lexer->lookahead == '\\') ||
          (lexer->lookahead == '*') || (lexer->lookahead == ')') ||
          iswspace(lexer->lookahead)) {
        // TODO: Whats the best error handling strategy here?
        // Set result symbol as the expected symbol but return false?
        lexer->result_symbol = EMBEDDED_SQL_MARKER;
        scanner->terminated_newline = false;
        return false;
      }
      // Assert that there is stil capacity in le buffer
      if (scanner->marker_buffer_len == MARKER_BUFFER_MAX_LEN) {
        // TODO: Whats the best error handling strategy here?
        lexer->result_symbol = EMBEDDED_SQL_MARKER;
        scanner->terminated_newline = false;
        return false;
      }
      scanner->marker_buffer[scanner->marker_buffer_len] = lexer->lookahead;
      scanner->marker_buffer_len += 1;
      advance(lexer);
    }
    scanner->terminated_newline = false;
    return false;
  } else if (valid_symbols[EMBEDDED_SQL_REVERSE_MARKER]) {
    while (scanner->marker_buffer_len > 0) {
      if (scanner->marker_buffer[scanner->marker_buffer_len - 1] !=
          lexer->lookahead) {
        // TODO: Whats the best error handling strategy here?
        // Set result symbol as the expected symbol but return false?
        // I think not here as this is a critical error
        // lexer->result_symbol = EMBEDDED_SQL_MARKER;
        scanner->terminated_newline = false;
        return false;
      }
      advance(lexer);
      scanner->marker_buffer_len -= 1;
    }
    lexer->result_symbol = EMBEDDED_SQL_REVERSE_MARKER;
    return true;
  } else if (valid_symbols[_LINE_COMMENT_INNER]) {
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
        // fprintf(stderr, "GOT INTO BOLLL");
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
  scanner->marker_buffer_len = 0;
  scanner->terminated_newline = false;
}
