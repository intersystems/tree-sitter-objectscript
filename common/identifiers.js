// A single unquoted segment: starts with letter or %, then letters/digits
const IDENT_SEG = /[%A-Za-z][A-Za-z0-9]*/;

// Dotted form where *each* segment follows the same rule
const DOTTED_ID_STRICT =
  /[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/;

// this will be used for routine names and labels
const DOTTED_ID_RELAXED = /[%A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)*/;

module.exports = {
  IDENT_SEG,
  DOTTED_ID_STRICT,
  DOTTED_ID_RELAXED,
};
