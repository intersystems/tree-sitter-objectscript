/**
 *
 *   Copyright (c) 2023 by InterSystems.
 *   Cambridge, Massachusetts, U.S.A.  All rights reserved.
 *   Confidential, unpublished property of InterSystems.
 *
 *
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
const objectscript_core = require('../core/grammar');
const {define_grammar} = require('../common/define_grammar');

module.exports = define_grammar(objectscript_core, {
  name: 'objectscript_routine',
  externals: ($, previous) => previous.concat([$.rtn_dot]),
  extras: ($, previous) => previous.concat([/\s/, $.documatic_line, $.rtn_dot]),
  rules: {
    source_file: ($) =>
      seq(
        choice($.compiled_header, $.routine_definition, $.statement),
        repeat(choice($.statement)),
        optional(alias($._unclosed_pound_ifndef, $.pound_ifndef)),
      ),
    // An include guard (#ifndef X) is sometimes never closed, e.g. SMHEAP.inc.
    // Only allowed as the last element of the file so that unclosed
    // conditionals elsewhere are still errors and parser.c stays small.
    _unclosed_pound_ifndef: ($) =>
      prec.right(seq(
        $.keyword_pound_ifndef,
        $.expression,
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
      )),
    routine_definition: ($) =>
      seq(
        $.routine,
        alias($.identifier, $.routine_name),
        optional($.routine_type),
      ),

    routine_type: (_) =>
      seq(
        '[',
        /type/i,
        '=',
        choice(/mac/i, /inc/i, /int/i),
        optional(seq(',', /generated/i)),
        ']',
      ),

    documatic_line: ($) =>
      seq('///', choice($._line_comment_inner, token.immediate(prec(1, /.*/)))),
  },
});
