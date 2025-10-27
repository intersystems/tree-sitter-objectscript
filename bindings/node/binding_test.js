// // const assert = require('node:assert');
// // const { test } = require('node:test');

// // const Parser = require('tree-sitter');

// // test('can load ObjectScript grammar', () => {
// //   const parser = new Parser();
// //   assert.doesNotThrow(() => parser.setLanguage(require('.')));
// // });

// // bindings/node/binding_test.js
// const assert = require('node:assert');
// const { test } = require('node:test');
// const Parser = require('tree-sitter');

// test('can load ObjectScript grammar', () => {
//   const parser = new Parser();

//   // Load exactly the file we expect:
//   const mod = require('./index.js');          // avoid "." ambiguity
//   const lang = mod.objectscript ?? mod;       // support container or direct export

//   // Prove it has nodeTypeInfo right here in the test:
//   console.log('TEST lang keys:', Object.keys(lang));
//   console.log('TEST nodeTypeInfo:', Array.isArray(lang.nodeTypeInfo), lang.nodeTypeInfo && lang.nodeTypeInfo.length);

//   assert.ok(Array.isArray(lang.nodeTypeInfo), 'nodeTypeInfo missing in test');
//   assert.doesNotThrow(() => parser.setLanguage(lang));

//   const tree = parser.parse('Class D { ClassMethod M(){ set x=1 } }');
//   assert.ok(!tree.rootNode.hasError(), 'parse produced errors');
// });

// bindings/node/binding_test.js
const { test } = require('node:test');
const assert = require('node:assert');
const Parser = require('tree-sitter');

test('can load ObjectScript grammar', () => {
  const parser = new Parser();

  // ALWAYS load the JS wrapper explicitly
  const mod = require('./index.js');
  const lang = mod.objectscript ?? mod;

  // Prove shape right here
  console.log('TEST lang keys:', Object.keys(lang));
  console.log('TEST nodeTypeInfo:', Array.isArray(lang.nodeTypeInfo), lang.nodeTypeInfo && lang.nodeTypeInfo.length);

  // Hard-assert before calling setLanguage
  assert.ok(lang && typeof lang.name === 'string', 'missing name');
  assert.ok(lang && lang.language, 'missing language pointer');
  assert.ok(Array.isArray(lang.nodeTypeInfo), 'missing nodeTypeInfo array');

  // ← IMPORTANT: pass *lang*, not require('.')
  parser.setLanguage(lang);

  // Quick parse smoke
  const tree = parser.parse('Class Demo.Test { ClassMethod Main(){ set x=42 } }');
  assert.ok(!tree.rootNode.hasError(), 'parse produced errors');
});


