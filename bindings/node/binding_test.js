const assert = require("node:assert");
const { test } = require("node:test");

const Parser = require("tree-sitter");
test('can load ObjectScript grammar', () => {
  
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(require('./objectscript')));
});

test('can load ObjectScript Core grammar', () => {
  
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(require('./objectscript_core')));
});

test('can load ObjectScript Expr grammar', () => {
  
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(require('./objectscript_expr')));
});



