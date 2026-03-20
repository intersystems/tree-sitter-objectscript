{
  "targets": [
    {
      "target_name": "tree_sitter_objectscript_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "objectscript/src",
        "udl/src",
        "objectscript_routine/src",
      ],
      "sources": [
        "bindings/node/binding.cc",
        "objectscript/src/parser.c",
        "objectscript/src/scanner.c",
        "udl/src/parser.c",
        "udl/src/scanner.c",
        "objectscript_routine/src/parser.c",
        "objectscript_routine/src/scanner.c",
      ],
      "conditions": [
        ["OS!='win'", {
          "cflags_c": [
            "-std=c11",
          ],
        }, { # OS == "win"
          "cflags_c": [
            "/std:c11",
            "/utf-8",
          ],
        }],
      ],
    }
  ]
}
