const root = require("path").join(__dirname, "..", "..");

module.exports =
  typeof process.versions.bun === "string"
    // Support `bun build --compile` by being statically analyzable enough to find the .node file at build-time
    ? require(`../../udl/prebuilds/${process.platform}-${process.arch}/tree-sitter-objectscript.node`)
    : require("node-gyp-build")(root);

try {
  module.exports.objectscript.nodeTypeInfo = require("../../udl/src/node-types.json");
  module.exports.objectscript.nodeTypeInfo = require("../../core/src/node-types.json");
  module.exports.objectscript.nodeTypeInfo = require("../../expr/src/node-types.json");
} catch (_) { }