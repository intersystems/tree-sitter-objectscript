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
const objectscript_udl = require('../udl/grammar');
const define_grammar = require('../common/define_grammar');

module.exports = define_grammar(objectscript_udl, {
  name: 'objectscript',
  rules: {
    source_file: ($) =>
      seq(
        optional(
          // Include/import declarations can appear in any order.
          choice(
            seq($.include_code, $.include_generator, $.import_code),
            seq($.include_code, $.import_code, $.include_generator),
            seq($.include_code, $.include_generator),
            seq($.include_code, $.import_code),
            seq($.include_code),
            seq($.include_generator, $.include_code, $.import_code),
            seq($.include_generator, $.import_code, $.include_code),
            seq($.include_generator, $.import_code),
            seq($.include_generator, $.include_code),
            seq($.include_generator),
            seq($.import_code, $.include_code, $.include_generator),
            seq($.import_code, $.include_generator, $.include_code),
            seq($.import_code, $.include_generator),
            seq($.import_code, $.include_code),
            seq($.import_code),
          ),
        ),

        repeat1(
          prec.right(
            choice(
              $.class_definition,
              $.class_statement,
              $.statement,
              $.routine_definition,
            ),
          ),
        ),
      ),

    routine_definition: ($) =>
      prec.right(seq(
        alias(/routine/i, $.routine),
        alias($.identifier, $.routine_name),
        optional($.routine_type),
        repeat(
          $.statement,
        ),
      )),

    routine_type: (_) =>
      seq(
        '[',
        /type/i,
        '=',
        choice(
          /mac/i,
          /inc/i,
          /int/i,
        ),
        ']',
      ),
  },
});
