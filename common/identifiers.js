// Dotted form where *each* segment follows the same rule
const DOTTED_ID_STRICT =
  /[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/;

// this will be used for routine names and labels
const DOTTED_ID_RELAXED = /[%A-Za-z][A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*/;

module.exports = {
  DOTTED_ID_STRICT,
  DOTTED_ID_RELAXED,
};
