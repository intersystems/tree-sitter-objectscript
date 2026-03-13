/**
 *
 *   Copyright (c) 2023 by InterSystems.
 *   Cambridge, Massachusetts, U.S.A.  All rights reserved.
 *   Confidential, unpublished property of InterSystems.
 *
 *
 */

/* eslint-disable indent */


/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
const keyword_rules = require('../common/keywords');
const objectscript_core = require('../core/grammar');
const define_grammar = require('../common/define_grammar');
/**
 * @param {RuleOrLiteral} rule
 * @returns {RuleOrLiteral}
 */
const repeat_with_commas = function(rule) {
  return seq(rule, repeat(seq(',', rule)));
};

// @ts-ignore
module.exports = define_grammar(objectscript_core, {
  name: 'objectscript_udl',
  // Use the relaxed dotted identifier token for keyword extraction so
  // single-letter zbreak switches (e.g. /t and /c) are not suppressed.
  word: ($) => $.dotted_identifier_relaxed_token,
  externals: ($, previous) => previous.concat([$.external_method_body_content, $.iris_username]),
  conflicts: ($, previous) =>
    previous.concat([
      [
        $.method_keywords,
        $.expression_method_keywords,
        $.external_method_keywords,
        $.call_method_keywords,
      ],
      [
        $.xdata_keywords,
        $.xdata_keywords_any,
      ],
      [
        $.trigger_keywords,
        $.external_trigger_keywords,
      ],
    ]),

  // Keep /\s/ in extras to avoid state-0 error-recovery loops.
  extras: ($, previous) =>
    previous.concat([
      /\s/,
      $.documatic_line,
    ]),

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
        $.class_definition,
      ),

    import_code: ($) =>
      seq(
        field('keyword', alias(/Import/i, $.keyword_import)),
        $.include_clause,
      ),

    include_code: ($) => seq(
      field('keyword', $.keyword_include),
      $.include_clause,
    ),


    include_generator: ($) => seq(
      field('keyword', $.keyword_includegenerator),
      $.include_clause,
    ),

    include_clause: ($) =>
      choice(
        alias($.identifier, $.class_name),
        seq('(', alias($.identifier, $.class_name), repeat(seq(',', alias($.identifier, $.class_name))), ')'),
      ),


    class_definition: ($) =>
      seq(
        field('keyword', $.keyword_class),
        alias($.identifier, $.class_name),
        optional($.class_extends),
        optional($.class_keywords),
        $.class_body,
      ),


    class_extends: ($) =>
      seq(
        field('keyword', $.keyword_extends),
        choice(
          alias($.identifier, $.class_name),
          seq(alias('(', $.bracket), alias($.identifier, $.class_name), repeat(seq(',', alias($.identifier, $.class_name))), alias(')', $.bracket)),
        ),
      ),


    documatic_line: ($) => seq(
      '///',
      choice(
        $._line_comment_inner,
        token.immediate(prec(1, /.*/)),
      ),
    ),

    class_body: ($) => seq('{', repeat($.class_statement), '}'),

    class_statement: ($) =>
      seq(
        choice(
          $.method,
          $.classmethod,
          $.property,
          $.parameter,
          $.relationship,
          $.foreignkey,
          $.query,
          $.index,
          $.trigger,
          $.xdata,
          $.projection,
          $.storage,
        ),
      ),

    method: ($) =>
      seq(
        field('keyword', $.keyword_method),
        $.method_definition,
      ),


    classmethod: ($) =>
      seq(
        field('keyword', $.keyword_classmethod),
        $.method_definition,
      ),


    query: ($) =>
      seq(
        field('keyword', $.keyword_query),
        alias($.quote_permitting_identifier, $.query_name),
        $.arguments,
        $.return_type,
        optional($.query_keywords),
        $.query_body,
      ),

    query_body: ($) =>
      seq(
        '{',
        alias($.external_method_body_content, $.query_body_content),
        '}',
      ),

    trigger: ($) =>
      seq(
        field('keyword', $.keyword_trigger),
        alias($.quote_permitting_identifier, $.identifier),
        choice($.core_trigger, $.external_trigger),
      ),

    core_trigger: ($) =>
      seq(
        $.trigger_keywords,
        '{',
        repeat($.statement),
        '}',
      ),

    external_trigger: ($) =>
      seq(
        alias($.external_trigger_keywords, $.trigger_keywords),
        '{',
        $.external_method_body_content,
        '}',
      ),

    property: ($) =>
      seq(
        field('keyword', $.keyword_property),
        alias($.quote_permitting_identifier, $.property_name),
        optional($.property_type),
        optional($.property_keywords),
        ';',
      ),

    relationship: ($) =>
      seq(
        field('keyword', alias(/Relationship/i, $.keyword_relationship)),
        alias($.quote_permitting_identifier, $.relationship_name),
        optional(
          seq(
            field('keyword', $.keyword_as),
            $.typename,
          ),
        ),
        $.relationship_keywords,
        ';',
      ),

    foreignkey: ($) =>
      seq(
        field('keyword', $.keyword_foreignkey),
        alias($.quote_permitting_identifier, $.foreignkey_name),
        alias(token.immediate('('), $.bracket),
        alias($.quote_permitting_identifier, $.identifier),
        repeat(seq(',', alias($.quote_permitting_identifier, $.identifier))),
        alias(token.immediate(')'), $.bracket),
        field('keyword', $.keyword_references),
        alias($.quote_permitting_identifier, $.identifier),
        optional(
          seq(
            '(',
            alias($.quote_permitting_identifier, $.identifier),
            ')',
          ),
        ),
        optional($.foreignkey_keywords),
        ';',
      ),


    parameter_type: ($) =>
      seq(
        field('keyword', $.keyword_as),
        choice(
          /Boolean/i,
          /Classname/i,
          /coscode/i,
          /cosexpression/i,
          /cosidentifier/i,
          /integer/i,
          /sql/i,
          /sqlidentifier/i,
          /string/i,
          /text/i,
          /configvalue/i,
        ),
    ),

    parameter: ($) =>
      seq(
        field('keyword', $.keyword_parameter),
        alias($.quote_permitting_identifier, $.parameter_name),
        optional($.parameter_type),
        optional($.parameter_keywords),
        optional(seq('=', $.default_argument_value)),
        ';',
      ),

    projection: ($) =>
      seq(
        field('keyword', $.keyword_projection),
        alias($.quote_permitting_identifier, $.projection_name),
        alias($.property_type, $.projection_type),
        optional($.projection_keywords),
        ';',
      ),

    index: ($) =>
      choice(
        seq(
        field('keyword', $.keyword_index),
        alias($.quote_permitting_identifier, $.index_name),
        seq(
          field('keyword', $.keyword_on),
          $.index_properties,
        ),
        optional($.index_keywords),
        ';',
        ),
        seq(
          field('keyword', $.keyword_index),
          alias($.quote_permitting_identifier, $.index_name),
          $.extent_index_keywords,
          ';',
        ),
      ),

    index_properties: ($) =>
      choice(
        seq('(', $.index_item, repeat(seq(',', $.index_item)), ')'),
        $.index_item,
      ),
    index_item: ($) =>
      seq(
        $.index_property,
        optional(
          seq(
            field('keyword', $.keyword_as),
            $.index_type,
          ),
        ),
      ),
    index_property: ($) =>
      seq(
        alias($.quote_permitting_identifier, $.identifier),
        optional(
          seq(
            alias('(', $.bracket),
            $.index_property_type,
            alias(')', $.bracket),
          ),
        ),
      ),
    index_property_type: (_) =>
      choice(
        /ELEMENTS/i,
        /KEYS/i,
      ),

    index_type: ($) =>
      seq(
      choice(
        /EXACT/i,
        /SQLSTRING/i,
        /SQLUPPER/i,
        /TRUNCATE/i,
        /PLUS/i,
        /MINUS/i,
      ),
      optional($.index_type_params),
    ),

    index_type_params: ($) =>
  seq(
    '(',
    choice(
      $.numeric_literal,
      repeat_with_commas($.numeric_literal),
    ),
    ')',
  ),

    xdata: ($) =>
      seq(
        field('keyword', $.keyword_xdata),
        alias($.quote_permitting_identifier, $.xdata_name),
        choice($.xdata_xml, $.xdata_any),
      ),

    xdata_xml: ($) =>
      seq(
        optional($.xdata_keywords),
        '{',
        $.external_method_body_content,
        '}',
      ),

    xdata_any: ($) =>
      seq(
        alias($.xdata_keywords_any, $.xdata_keywords),
        '{',
        $.external_method_body_content,
        '}',
      ),

    storage: ($) =>
      seq(
        field('keyword', $.keyword_storage),
        alias($.quote_permitting_identifier, $.storage_name),
        optional($.storage_keywords),
        $.storage_body,
      ),

    method_definition: ($) =>
      seq(
        alias($.quote_permitting_identifier, $.method_name),
        $.arguments,
        optional($.return_type),
        choice($._core_method, $._expression_method, $._external_method, $._call_method),
      ),

    _call_method: ($) =>
      seq(

          $.call_method_keywords,
        '{',
          $.routine_tag_call,
        '}',
      ),

    _core_method: ($) =>
      seq(
        optional($.method_keywords),
        '{',
       repeat($.statement),
        '}',
      ),

    _expression_method: ($) =>
      seq(
          $.expression_method_keywords,
        '{',
        alias($.expression, $.expression_method_body_content),
        '}',
      ),

    _external_method: ($) =>
      seq(
        $.external_method_keywords,
        '{',
       $.external_method_body_content,
        '}',
      ),

    property_type: ($) => seq(
      field('keyword', $.keyword_as),
      optional(
        seq(
          choice(
            field('keyword', $.keyword_list),
            field('keyword', $.keyword_array),
          ),
          $.keyword_of,
        ),
      ),
      $.typename,
    ),

    arguments: ($) =>
      seq(token.immediate('('), optional(seq($.argument, repeat(seq(',', $.argument)))), ')'),

    argument: ($) =>
      seq(
        optional( choice(field('keyword', $.keyword_byref), field('keyword', $.keyword_output))),
        $.identifier,
        optional($.return_type),
        optional(seq('=', $.default_argument_value)),
      ),

    default_argument_value: ($) =>
      choice(
        $.identifier,
        $.string_literal,
        $.numeric_literal,
        seq('{', optional($.expression), '}'),
      ),
    return_type: ($) => seq(field('keyword', $.keyword_as), $.typename),

    code_snippet: ($) =>
      seq(
        '{', prec.left(repeat1($.statement)), '}',
      ),

    storage_body: ($) =>
      seq(
        '{',
        $.external_method_body_content,
        '}',
      ),

    typename: ($) =>
      seq(
        $.identifier,
        optional(
          seq('(', $.typename_param, repeat(seq(',', $.typename_param)), ')'),
        ),
        optional(
          seq($.keyword_of, $.typename),
        ),
      ),

    typename_param: ($) =>
      seq(
        $.identifier,
        '=',
        choice(
          $.string_literal,
          $.keyword_pound_pound_super,
          seq(optional(field('operator', '-')), $.numeric_literal),
        ),
      ),
    identifier: ($) => /[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/,
    quote_permitting_identifier: ($) =>
      choice(/"((?:""|[^"])*)"/, $.identifier),
    _word: ($) => /[%A-Za-z0-9][A-Za-z0-9]+/,
    ...keyword_rules,
  },
});
