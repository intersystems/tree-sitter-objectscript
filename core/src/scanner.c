#include "../../common/scanner.h"
#include "tree_sitter/parser.h"
#include <string.h>

void *tree_sitter_objectscript_core_external_scanner_create() {
  struct ObjectScript_Core_Scanner *scanner =
      (struct ObjectScript_Core_Scanner *)calloc(
          1, sizeof(struct ObjectScript_Core_Scanner));
  ObjectScript_Core_Scanner_init(scanner);
  return scanner;
}

bool tree_sitter_objectscript_core_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  return ObjectScript_Core_Scanner_scan(
      (struct ObjectScript_Core_Scanner *)payload, lexer, valid_symbols);
}

unsigned tree_sitter_objectscript_core_external_scanner_serialize(
    void *payload, char *buffer) {
  struct ObjectScript_Core_Scanner *s = (struct ObjectScript_Core_Scanner *)payload;

  unsigned i = 0;
  const unsigned char version = 1;
  unsigned char mlen = (unsigned char)(s->marker_buffer_len);

  // Ensure we never overrun TREE_SITTER_SERIALIZATION_BUFFER_SIZE (usually 1024)
  // Worst-case here: 1 + 1 + 1 + 30*4 = 123 bytes.
  buffer[i++] = (char)version;
  buffer[i++] = (char)mlen;

  for (int j = 0; j < s->marker_buffer_len; j++) {
    // store as raw 4 bytes
    if (i + (unsigned)sizeof(int32_t) > TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
      mlen = j; // truncate safely
      break;
    }
    memcpy(buffer + i, &s->marker_buffer[j], sizeof(int32_t));
    i += (unsigned)sizeof(int32_t);
  }

  // If we truncated, fix the recorded length
  buffer[2] = (char)mlen;
  return i;
}

void tree_sitter_objectscript_core_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
  struct ObjectScript_Core_Scanner *s = (struct ObjectScript_Core_Scanner *)payload;

  // Reset to clean defaults first
  s->marker_buffer_len = 0;

  if (!buffer || length == 0) return;

  unsigned i = 0;
  unsigned char version = (unsigned char)buffer[i++];
  if (version != 1 || i >= length) return;

  if (i >= length) return;
  unsigned char mlen = (unsigned char)buffer[i++];
  if (mlen > MARKER_BUFFER_MAX_LEN) mlen = MARKER_BUFFER_MAX_LEN;

  int j = 0;
  for (; j < (int)mlen && (i + sizeof(int32_t)) <= length; j++) {
    int32_t v;
    memcpy(&v, buffer + i, sizeof(int32_t));
    i += (unsigned)sizeof(int32_t);
    s->marker_buffer[j] = v;
  }
  s->marker_buffer_len = (char)j;
}

void tree_sitter_objectscript_core_external_scanner_destroy(void *payload) {
  struct ObjectScript_Core_Scanner *scanner =
      (struct ObjectScript_Core_Scanner *)payload;
  free(scanner);
}
