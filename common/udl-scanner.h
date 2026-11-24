#ifndef OBJECTSCRIPT_UDL_SCANNER_H
#define OBJECTSCRIPT_UDL_SCANNER_H
#include "scanner.h"
#include "tree_sitter/parser.h"
#include <string.h>
#include <wctype.h>

typedef enum {
    EXPRESSION_METHOD,
    CORE_METHOD,
    EXTERNAL_METHOD,
    CALL_METHOD,
} MethodKind;

typedef enum {
    EXTERNAL,
    REGULAR,
} ClassKind;
// There is no way to extend enums, so keep this in sync with base.h
// All new entries should be appended at the bottom of the list
enum TokenType {
   IRIS_USERNAME= OBJECTSCRIPT_CORE_TOKEN_TYPE_MAX,
   PYTHON_MIME_TYPE,
   _IS_PYTHON,
   TEXT_MIME_TYPE,
   _EXTERNAL_CLASS_LANGUAGE,
   _RESET_METHOD_KIND,
   _SET_CALL_METHOD_KIND,
   _SET_EXTERNAL_METHOD_KIND,
   _SET_EXPRESSION_METHOD_KIND,
   _IS_CALL_METHOD,
   _IS_EXTERNAL_METHOD,
   _IS_EXPRESSION_METHOD,
};

struct ObjectScript_Udl_Scanner {
  char in_body;
  MethodKind curr_method_kind;
  ClassKind class_kind;
  struct ObjectScript_Core_Scanner core_scanner;
};

/// This is the interesting function. The rest is infrastructure
static bool ObjectScript_Udl_Scanner_scan(struct ObjectScript_Udl_Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
  if (valid_symbols[SENTINEL]) {
    return false;
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

  if (valid_symbols[_IS_PYTHON]) {
      scanner->core_scanner.is_python = true;
      lexer->result_symbol = _IS_PYTHON;
      return true;
  }

  if (valid_symbols[PYTHON_MIME_TYPE]) {
        lexer->mark_end(lexer);
        int count = 0;
        while(iswspace(lexer->lookahead)) {
            count ++;
            advance(lexer);
        }
        if (count > 0) {
            lexer -> mark_end(lexer);
            lexer->result_symbol = _WHITESPACE;
            return true;
        }
        bool has_string = false;
        if (lexer->lookahead == '"') {
            has_string = true;
            advance(lexer);
        }
    const char* text_mime = "text/";
    const char *text_python = "x-python";
    const char *application_python = "application/python";
    const char *markdown = "markdown";
    const char *plain = "plain";
    bool is_python = true;
    bool is_text = true;
    bool is_markdown = false;
    for (unsigned i = 0; i < 5; i++) {
        if (lexer->lookahead != text_mime[i]) {
            is_text = false;
            break;
        }
        if (lexer->eof(lexer)) break;
        advance(lexer);
    }
    if (is_text) {
        for (unsigned i = 0; i < 8; i++) {
            if (lexer->lookahead != text_python[i]) {
                is_python = false;
                break;
            }
            if (lexer->eof(lexer)) break;
            advance(lexer);
        } if (!is_python) {
            is_markdown = true;
            for (unsigned i = 0; i < 8; i++) {
                if (lexer->lookahead != markdown[i]) {
                    is_markdown = false;
                    break;
                }
                if (lexer->eof(lexer)) break;
                advance(lexer);
            }
        } if (!is_markdown && !is_python) {
            is_markdown = true;
            for (unsigned i = 0; i < 5; i++) {
                if (lexer->lookahead != plain[i]) {
                    is_markdown = false;
                    break;
                }
                if (lexer->eof(lexer)) break;
                advance(lexer);
            }
        }
    }
    else {
        for (unsigned i = 0; i < 18; i++) {
            if (lexer->lookahead != application_python[i]) {
                is_python = false;
                break;
            }
            if (lexer->eof(lexer)) break;
            advance(lexer);
        }
    }
    if (has_string) {
        advance(lexer);
    }

    if (is_python) {
        scanner->core_scanner.is_python = true;
        lexer->mark_end(lexer);
        lexer->result_symbol = PYTHON_MIME_TYPE;
        return true;
    }

    if (is_markdown) {
        scanner->core_scanner.is_text = true;
        lexer->mark_end(lexer);
        lexer->result_symbol = TEXT_MIME_TYPE;
        return true;
    }

    return false;

  }

  if (valid_symbols[_EXTERNAL_CLASS_LANGUAGE]) {
      scanner->class_kind = EXTERNAL;
      scanner->curr_method_kind = EXTERNAL_METHOD;
      lexer->result_symbol = _EXTERNAL_CLASS_LANGUAGE;
      return true;
  }

  if (valid_symbols[_RESET_METHOD_KIND]) {
      if (scanner->class_kind == EXTERNAL) {
          scanner->curr_method_kind = EXTERNAL_METHOD;
      } else {
          scanner->curr_method_kind = CORE_METHOD;
      }
      lexer->result_symbol = _RESET_METHOD_KIND;
      return true;
  }

  if (valid_symbols[_SET_CALL_METHOD_KIND]) {
      scanner->curr_method_kind = CALL_METHOD;
      lexer->result_symbol = _SET_CALL_METHOD_KIND;
      return true;
  } if (valid_symbols[_SET_EXTERNAL_METHOD_KIND]) {
      scanner->curr_method_kind = EXTERNAL_METHOD;
      lexer->result_symbol = _SET_EXTERNAL_METHOD_KIND;
      return true;
  } if (valid_symbols[_SET_EXPRESSION_METHOD_KIND]) {
      scanner->curr_method_kind = EXPRESSION_METHOD;
      lexer->result_symbol = _SET_EXPRESSION_METHOD_KIND;
      return true;
  }

  // Only commit to a method kind once we reach the body. These tokens are
  // valid as soon as the method header could end (e.g. right after the
  // argument list, before `As Type` or `[ keywords ]`).
  if (valid_symbols[_IS_CALL_METHOD] || valid_symbols[_IS_EXTERNAL_METHOD] ||
      valid_symbols[_IS_EXPRESSION_METHOD]) {
      while (iswspace(lexer->lookahead)) {
          skip(lexer);
      }
      if (lexer->lookahead != '{') {
          return false;
      }
  }
  if (valid_symbols[_IS_CALL_METHOD] && scanner->curr_method_kind == CALL_METHOD) {
      lexer->result_symbol = _IS_CALL_METHOD;
      return true;
  } else if (valid_symbols[_IS_EXTERNAL_METHOD] && scanner->curr_method_kind == EXTERNAL_METHOD) {
      lexer->result_symbol = _IS_EXTERNAL_METHOD;
      return true;
  } else if (valid_symbols[_IS_EXPRESSION_METHOD] && scanner->curr_method_kind == EXPRESSION_METHOD) {
      lexer->result_symbol = _IS_EXPRESSION_METHOD;
      return true;
  }


  return ObjectScript_Core_Scanner_scan(&scanner->core_scanner, lexer,
                                        valid_symbols);
}

static void ObjectScript_Udl_Scanner_init(struct ObjectScript_Udl_Scanner *scanner) {
  scanner->in_body = 0;
  scanner->class_kind = REGULAR;
  scanner->curr_method_kind = CORE_METHOD;
  ObjectScript_Core_Scanner_init(&scanner->core_scanner);
}

static unsigned ObjectScript_Udl_Scanner_serialize(struct ObjectScript_Udl_Scanner *scanner,
                                                   char *buffer) {
  memcpy(buffer, scanner, sizeof(struct ObjectScript_Udl_Scanner));
  return sizeof(struct ObjectScript_Udl_Scanner);
}

static void ObjectScript_Udl_Scanner_deserialize(struct ObjectScript_Udl_Scanner *scanner,
                                                 const char *buffer, unsigned length) {
  // This one is a bit funky.
  // length includes the sizeof(struct Scanner) and the structs it points to
  memcpy(scanner, buffer, length);
}
#endif
