#include "tree_sitter/parser.h"
#include <string.h>
#include <wctype.h>

enum ObjectScript_Core_Scanner_TokenType {
  _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE,
  _ASSERT_NO_SPACE_BETWEEN_RULES,
  _ARGUMENTLESS_COMMAND_END,
  _ARGUMENTLESS_FOR_LOOP,
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
  BOL,
  _INLINE_STATEMENT_SEPARATOR,
  _TERMINATION,
  /* Max token type */
  OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX
};

static const char* token_names[] = {
  "_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE",
  "_ASSERT_NO_SPACE_BETWEEN_RULES",
  "_ARGUMENTLESS_COMMAND_END",
  "_ARGUMENTLESS_FOR_LOOP",
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
  "BOL",
  "_INLINE_STATEMENT_SEPARATOR",
  "_TERMINATION"
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
  bool at_bol;
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

  if (valid_symbols[_TERMINATION]) {
        bool is_termination = (lexer->lookahead == '\n' ||
                                      lexer->lookahead == '}' ||
                                      lexer->lookahead == '/' ||
                                      lexer->lookahead == '#' ||
                                      lexer->lookahead == ';' ||
                                      lexer->eof(lexer));

        bool is_new_line = (lexer-> lookahead == '\n');
        if (is_termination) {
            lexer->result_symbol = _TERMINATION;
            scanner-> at_bol = is_new_line;
            return true;
        }
  }

  if (valid_symbols[_ARGUMENTLESS_FOR_LOOP]) {
    bool is_block = (lexer->lookahead == '{');
    if (is_block) {
        lexer->result_symbol = _ARGUMENTLESS_FOR_LOOP;
        scanner->at_bol = false;
        return true;
    }
  }

  if((valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE] ||
  valid_symbols[_ARGUMENTLESS_COMMAND_END] ||
  valid_symbols[_ARGUMENTLESS_FOR_LOOP])
  && iswspace(lexer->lookahead)
  ) {
        int count = 0;
        if (lexer->lookahead == ' ') {

         while (!lexer->eof(lexer) && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
            count ++;
            lexer->advance(lexer, false);
         }
        // make sure it isn't argumentless
        bool is_termination = (lexer->lookahead == '\n' ||
                              lexer->lookahead == '}' ||
                              lexer->lookahead == '/' ||
                              lexer->lookahead == ';' ||
                              lexer->eof(lexer));

        bool is_block = (lexer->lookahead == '{');
        if (count == 1 && !is_termination && !is_block) {
            if (valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE]) {
                lexer->result_symbol = _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE;
                scanner->at_bol = false;
                return true;
            }
        }

        if (valid_symbols[_ARGUMENTLESS_FOR_LOOP] && is_block) {
            lexer->result_symbol = _ARGUMENTLESS_FOR_LOOP;
            scanner->at_bol = false;
            return true;
        }

        if (count == 2 && valid_symbols[_ARGUMENTLESS_COMMAND_END]) {
            lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
            scanner->at_bol = false;
            return true;
        }

        //argumentless
        else if (lexer->eof(lexer) || lexer->lookahead == '}' || lexer->lookahead == ';') {
            if (valid_symbols[_ARGUMENTLESS_COMMAND_END]) {
                lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
                return true;
            }
        }

        else {
            while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                lexer->advance(lexer, false);
            }
            bool is_block = (lexer->lookahead == '{');

            if (valid_symbols[_ARGUMENTLESS_COMMAND_END] && !is_block) {
                lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
                return true;
            }
        }
        }
        else {
            if (lexer->eof(lexer) || lexer->lookahead == '}' || lexer->lookahead == ';') {
                if (valid_symbols[_ARGUMENTLESS_COMMAND_END]) {
                    lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
                    return true;
                }
            }
            while (!lexer->eof(lexer) && iswspace(lexer->lookahead)) {
                lexer->advance(lexer, false);
            }
            bool is_block = (lexer->lookahead == '{');
            if (valid_symbols[_ARGUMENTLESS_COMMAND_END] && !is_block) {
                lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
                return true;
            }
        }
  }
//  if ((valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE] ||
//       valid_symbols[_ARGUMENTLESS_COMMAND_END]) &&
//      (lexer->lookahead == ' ' || lexer->lookahead == '\n' ||
//       lexer->lookahead == '\t' || lexer->lookahead == '}')) {
//
//    // This case is where we're processing a command that has both argumentful
//    // and argumentless versions, such as QUIT or RETURN, or more interestingly
//    // IF or FOR that can be followed by a { } block structure.
//    //
//    // In the case of an argumentful version, we need to see a single space,
//    // followed by something that's not a space (or newline etc), which would
//    // be the command argument(s).
//    //
//    // In the argumentless case, we need to see two spaces before anything else
//    // unless it's the end of line, comment, or closing curly brace.
//    //
//    // The tricky part of this is we have to consider all three possibilities at
//    // once while scanning.
//
//    // Argumentless termination patterns which if we match, indicate that we have
//    // an _ARGUMENTLESS_COMMAND_END
//#define _TERM_MAX  8
//    static const char* terminations[_TERM_MAX] = {
//      " ",    // space (for two spaces total)
//      "\n",   // newline
//      "\t",   // tab
//      ";",    // semicolon comment
//      "}",    // closing brace
//      "//",   // double slash comment
//      "/*",   // block comment start
//      "#;",   // macro preprocessor comment
//    };
//
//    // Handle single space after command
//    if (lexer->lookahead == ' ') {
//      lexer->advance(lexer, false);
//      lexer->mark_end(lexer);   // Lock token boundary after the space
//
//      int inactive[_TERM_MAX] = {0};        // Set of inactive patterns
//      int active_count        = _TERM_MAX;  // Patterns remaining
//      int char_pos            = 0;          // Current offset
//
//      // Process characters until we find a match or eliminate all patterns
//      while (active_count > 0 && !lexer->eof(lexer)) {
//        char current_char = lexer->lookahead;
//
//        // Check each pattern at current position
//        for (size_t i = 0; i < _TERM_MAX; i++) {
//          if (inactive[i]) {
//            // This pattern has already been ruled out
//            continue;
//          }
//
//          const char* candidate = terminations[i];
//
//          // Check if current character matches this pattern at current position
//          if (current_char == candidate[char_pos]) {
//            // This is a match ... have we completed this candidate?
//            if (candidate[char_pos+1] == 0) {
//              // Yes! We have found complete match: argumentless, if we are
//              // looking for an _ARGUMENTLESS_COMMAND_END, then we're done
//              if (valid_symbols[_ARGUMENTLESS_COMMAND_END]) {
//                lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
//                return true;
//              }
//
//              // If we're looking for _WHITESPACE_BEFORE_BLOCK then let's
//              // see if that's true -- we should've just completed a match
//              // on one of the whitespace terminators
////              if (valid_symbols[_WHITESPACE_BEFORE_BLOCK] && iswspace(current_char)) {
////                // It could well be, break out of this loop and we'll try a more
////                // thorough check
////                break;
////              }
//
//              // Well, we had a match to a termination string, but we are
//              // not looking for either _ARGUMENTLESS_COMMAND_END nor
//              // _WHITESPACE_BEFORE_BLOCK, so return false.
//              return false;
//            }
//            // else: No, this candidate has additional chars to check
//          } else {
//            // Character doesn't match, deactivate this candidate
//            inactive[i] = 1;
//            active_count--;
//          }
//        }
//
//        // Bail out now if there are none left
//        if (!active_count) break;
//
//        // We've checked all of the [active] candidate termination string,
//        // but not yet found a match, so keep matching
//        advance(lexer);
//        char_pos++;
//      }
//
//      if (lexer->eof(lexer)) {
//          if (valid_symbols[_ARGUMENTLESS_COMMAND_END]) {
//            lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
//            return true;
//          }
//          return false;
//        }
//
//      // If we didn't match any of the terminations, then it must be a space followed
//      // by a non-terminating character
//      if (!lexer->eof(lexer)) {
//
//        // Let's see if this is a _WHITESPACE_BEFORE_BLOCK
////        if (valid_symbols[_WHITESPACE_BEFORE_BLOCK] && iswspace(lexer->lookahead)) {
////          do {
////            lexer->advance(lexer, false);
////          } while (!lexer->eof(lexer) && iswspace(lexer->lookahead));
////
////          if (lexer->lookahead == '{') {
////            lexer->result_symbol = _WHITESPACE_BEFORE_BLOCK;
////            return true;
////          }
////        }
//        if (valid_symbols[_IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE]) {
//          // One space followed by a non-whitespace character: argumentful
//          lexer->result_symbol = _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE;
//          return true;
//        }
//      }
//    } else if ((lexer->lookahead == '\n') ||
//               (lexer->lookahead == '\t') ||
//               (lexer->lookahead == '}') ||
//               lexer->eof(lexer)) {
//      // Argumentless if newline, tab or } directly follows
//      //lexer->advance(lexer, false);
//      if (valid_symbols[_ARGUMENTLESS_COMMAND_END]) {
//        lexer->result_symbol = _ARGUMENTLESS_COMMAND_END;
//        return true;
//      }
//    }
//
//    return false;
//
//  }
else if (valid_symbols[_ASSERT_NO_SPACE_BETWEEN_RULES]) {
    if (!iswspace(lexer->lookahead)) {
      lexer->result_symbol = _ASSERT_NO_SPACE_BETWEEN_RULES;
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
      scanner->at_bol = false;
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
    if (ok) scanner->at_bol = false;
    return ok;
  } else if (valid_symbols[PAREN_FENCED_TEXT]) {
    bool ok = ObjectScript_Core_Scanner_lex_fenced_text(
        lexer, PAREN_FENCED_TEXT, '(', ')');
    if (ok) scanner->at_bol = false;
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
        return false;
      }
      // Assert that there is stil capacity in le buffer
      if (scanner->marker_buffer_len == MARKER_BUFFER_MAX_LEN) {
        // TODO: Whats the best error handling strategy here?
        lexer->result_symbol = EMBEDDED_SQL_MARKER;
        return false;
      }
      scanner->marker_buffer[scanner->marker_buffer_len] = lexer->lookahead;
      scanner->marker_buffer_len += 1;
      advance(lexer);
    }
    return false;
  } else if (valid_symbols[EMBEDDED_SQL_REVERSE_MARKER]) {
    while (scanner->marker_buffer_len > 0) {
      if (scanner->marker_buffer[scanner->marker_buffer_len - 1] !=
          lexer->lookahead) {
        // TODO: Whats the best error handling strategy here?
        // Set result symbol as the expected symbol but return false?
        // I think not here as this is a critical error
        // lexer->result_symbol = EMBEDDED_SQL_MARKER;
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
        return true;
      }

      if (lexer->lookahead == '\n') {
        // Don't advance here, let the grammar consume this otherwise
        // it'll continue the comment to the next line
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
          scanner->at_bol = false;
          lexer->result_symbol = MACRO_VALUE_LINE_WITH_CONTINUE;
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
    return false;

} else if (valid_symbols[_WHITESPACE] && iswspace(lexer->lookahead))  {
    bool consumed = false;
    bool saw_nl   = false;

    while (iswspace(lexer->lookahead)) {
      if (lexer->lookahead == '\n') saw_nl = true;
      advance(lexer);          // <-- advance(false): add char to this token
      consumed = true;
    }

    if (!consumed) return false;          // no whitespace -> not this token
    if (saw_nl) scanner->at_bol = true;
    lexer->result_symbol = _WHITESPACE;
    return true;
  } else if (valid_symbols[BOL]) {
      // Only at beginning of logical line
      if (!scanner->at_bol) return false;

      // Allow additional indentation that extras didn’t eat (spaces/tabs only)
      while (lexer->lookahead == ' ' || lexer->lookahead == '\t') skip(lexer);

      // One-or-more dots
      unsigned dots = 0;
      while (lexer->lookahead == '.') { advance(lexer); dots++; }
      if (dots == 0) return false;

      // Don’t collide with decimals or relative-dot
      int32_t c = lexer->lookahead;
      if (c == '.' || (c >= '0' && c <= '9')) return false;

      scanner->at_bol = false;
      lexer->result_symbol = BOL;
      return true;
    }
  return false;
}
static void ObjectScript_Core_Scanner_init(struct ObjectScript_Core_Scanner *scanner) {
  scanner->marker_buffer_len = 0;
  scanner -> at_bol = true;
}
