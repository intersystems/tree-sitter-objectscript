const assert = require("node:assert");
const { test } = require("node:test");

const Parser = require("tree-sitter");
test('can load ObjectScript Playground grammar', () => {
  
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(require('./objectscript')));
});

test('can load ObjectScript UDL grammar', () => {
  
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(require('./objectscript_udl')));
});

test('can load ObjectScript Routine grammar', () => {
  
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(require('./objectscript_routine')));
});

