'use strict';
const path = require('path');
const root = path.join(__dirname, '..', '..');

const built = require('node-gyp-build')(root);

// Your addon exports { objectscript: { name, language } }
const lang = built.objectscript ?? built;

// Attach node types (REQUIRED by tree-sitter JS)
const nodeTypesPath = path.join(root, 'udl', 'src', 'node-types.json');
lang.nodeTypeInfo = require(nodeTypesPath);

// Optional safety: fail fast if it’s wrong
if (!Array.isArray(lang.nodeTypeInfo)) {
  throw new Error(`Invalid nodeTypeInfo at ${nodeTypesPath}`);
}

module.exports = lang;
