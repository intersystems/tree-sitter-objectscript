const assert = require("node:assert");
const { test } = require("node:test");

const Parser = require("tree-sitter");
const localBinding = require(".");
const ObjectScript = localBinding.objectscript;
const ObjectScriptCore = localBinding.objectscript_core;
test('can load ObjectScript grammar', () => {
  
  const parser = new Parser();
  assert.ok(ObjectScript, "ObjectScript export is missing");
  assert.equal(ObjectScript.name, "objectscript");
  assert.doesNotThrow(() => parser.setLanguage(ObjectScript));
});



