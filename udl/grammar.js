/**
 *
 *   Copyright (c) 2023 by InterSystems.
 *   Cambridge, Massachusetts, U.S.A.  All rights reserved.
 *   Confidential, unpublished property of InterSystems.
 *
 *
 */

/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
const keyword_rules = require('./keywords');
const objectscript_core = require('../core/grammar');
const define_grammar = require('../common/grammar');

// @ts-ignore
module.exports = define_grammar(objectscript_core, {
  name: 'objectscript_udl',
  word: ($) => $._word,
  externals: ($, previous) => previous.concat([$.external_method_body_content]),
  conflicts: ($, previous) =>
    previous.concat([
      [
        $.method_keywords,
        $.expression_method_keywords,
        $.external_method_keywords,
      ],
      [
        $.trigger_keywords,
        $.external_trigger_keywords,
      ], // This is intended. When the parser sees kw_Abstract ',' for example,
    ]),

  // Extras needs to be defined after rules
  // so that we can use rules given by the objectscript
  // module in common/grammar.js
  // Note: /\s/ in extras prevents infinite loops during error recovery on state 0.
  // This rule increases the state machine size (~0.3MB impact).
  // Consider removing if we can improve error recovery without it.
  extras: ($, previous) =>
    previous.concat([
      /\s/,
      $.documatic_line,
    ]),

  rules: {
    source_file: ($) =>
      seq(
        optional($.include_code),
        optional($.include_generator),
        $.class_definition,
      ),

    include_code: ($) => seq(
      field('keyword', $.keyword_include),
      $.include_clause,
    ),
    keyword_include: (_) => /Include/i,

    include_generator: ($) => seq(
      field('keyword', $.keyword_includegenerator),
      $.include_clause,
    ),
    keyword_includegenerator: (_) => /IncludeGenerator/i,

    include_clause: ($) =>
      choice(
        $.identifier,
        seq('(', $.identifier, repeat(seq(',', $.identifier)), ')'),
      ),

    class_definition: ($) =>
      seq(
        field('keyword', $.keyword_class),
        field('class_name', $.identifier),
        optional($.class_extends),
        optional($.class_keywords),
        field('class_body', $.class_body),
      ),
    keyword_class: (_) => /Class/i,

    class_extends: ($) =>
      seq(
        field('keyword', $.keyword_extends),
        choice(
          $.identifier,
          seq('(', $.identifier, repeat(seq(',', $.identifier)), ')'),
        ),
      ),
    keyword_extends: (_) => /Extends/i,

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
    keyword_method: (_) => /Method/i,

    classmethod: ($) =>
      seq(
        field('keyword', $.keyword_classmethod),
        $.method_definition,
      ),
    keyword_classmethod: (_) => /ClassMethod/i,

    query: ($) =>
      seq(
        field('keyword', $.keyword_query),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        field('arguments', $.arguments),
        field('type', alias($.return_type, $.query_type)),
        optional($.query_keywords),
        $.query_body,
      ),
    keyword_query: (_) => /Query/i,
    query_body: ($) =>
      seq(
        '{',
        field('body', alias($.external_method_body_content, $.query_body_content)),
        '}',
      ),

    trigger: ($) =>
      seq(
        field('keyword', $.keyword_trigger),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        choice($._core_trigger, $._external_trigger),
      ),
    keyword_trigger: (_) => /Trigger/i,

    _core_trigger: ($) =>
      seq(
        optional(field('keywords', $.trigger_keywords)),
        '{',
        field('body', alias(repeat($.statement), $.core_trigger_body_content)),
        '}',
      ),

    _external_trigger: ($) =>
      seq(
        field('keywords', alias($.external_trigger_keywords, $.trigger_keywords)),
        '{',
        field('body', $.external_method_body_content),
        '}',
      ),

    external_trigger_keywords: ($) =>
      seq(
        '[',
        repeat(seq($._trigger_keyword, ',')),
        $.kw_External_Language,
        repeat(seq(',', $._trigger_keyword)),
        ']',
      ),

    property: ($) =>
      seq(
        field('keyword', $.keyword_property),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional($.property_type),
        optional($.property_keywords),
        ';',
      ),
    keyword_property: (_) => /Property/i,

    relationship: ($) =>
      seq(
        field('keyword', $.keyword_relationship),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        field('keyword', $.keyword_as),
        $.typename,
        optional($.relationship_keywords),
        ';',
      ),
    keyword_relationship: (_) => /Relationship/i,

    foreignkey: ($) =>
      seq(
        field('keyword', $.keyword_foreignkey),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        '(',
        alias($.quote_permitting_identifier, $.identifier),
        repeat(seq(',', alias($.quote_permitting_identifier, $.identifier))),
        ')',
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
    keyword_foreignkey: (_) => /ForeignKey/i,
    keyword_references: (_) => /References/i,

    parameter: ($) =>
      seq(
        field('keyword', $.keyword_parameter),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional($.property_type),
        optional(seq('=', $.default_argument_value)),
        optional($.parameter_keywords),
        ';',
      ),
    keyword_parameter: (_) => /Parameter/i,

    projection: ($) =>
      seq(
        field('keyword', $.keyword_projection),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional($.projection_type),
        optional($.projection_keywords),
        ';',
      ),
    keyword_projection: (_) => /Projection/i,
    projection_type: ($) => $.property_type,

    index: ($) =>
      seq(
        field('keyword', $.keyword_index),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional(
          // Extent indexes don't have an `On type` clause
          seq(
            field('keyword', $.keyword_on),
            $.index_properties,
          ),
        ),
        optional($.index_keywords),
        ';',
      ),
    keyword_index: (_) => /Index/i,
    keyword_on: (_) => /On/i,
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
            field('keyword', $.index_type),
          ),
        ),
      ),
    index_property: ($) =>
      seq(
        alias($.quote_permitting_identifier, $.identifier),
        optional(
          seq(
            '(',
            field('keyword', $.index_property_type),
            ')',
          ),
        ),
      ),
    index_property_type: ($) =>
      choice(
        /ELEMENTS/i,
        /KEYS/i,
      ),

    index_type: ($) =>
      choice(
        /EXACT/i,
        /SQLSTRING/i,
        /SQLUPPER/i,
        /TRUNCATE/i,
        /PLUS/i,
        /MINUS/i,
      ),

    xdata: ($) =>
      seq(
        field('keyword', $.keyword_xdata),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional(field('keywords', $.xdata_keywords)),
        $._xdata_body,
      ),
    keyword_xdata: (_) => /XData/i,

    storage: ($) =>
      seq(
        field('keyword', $.keyword_storage),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional(field('keywords', $.storage_keywords)),
        $._storage_body,
      ),
    keyword_storage: (_) => /Storage/i,

    method_definition: ($) =>
      seq(
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        field('arguments', $.arguments),
        optional(field('return_type', $.return_type)),
        choice($._core_method, $._expression_method, $._external_method),
      ),

    _core_method: ($) =>
      seq(
        optional(field('keywords', $.method_keywords)),
        '{',
        field('body', alias(repeat($.statement), $.core_method_body_content)),
        '}',
      ),

    _expression_method: ($) =>
      seq(
        field(
          'keywords',
          alias($.expression_method_keywords, $.method_keywords),
        ), // Any keywords, which make the body node an expression
        '{', // Will only ever likely be [CodeMode = expression]
        field(
          'body',
          alias($.expression, $.expression_method_body_content),
        ),
        '}',
      ),

    _external_method: ($) =>
      seq(
        field('keywords', alias($.external_method_keywords, $.method_keywords)),
        '{',
        field('body', $.external_method_body_content),
        '}',
      ),

    // _core_method_keywords/method_keywords specification

    expression_method_keywords: ($) =>
      seq(
        '[',
        repeat(seq($._method_keyword, ',')),
        $.kw_Expression_CodeMode,
        repeat(seq(',', $._method_keyword)),
        ']',
      ),

    external_method_keywords: ($) =>
      seq(
        '[',
        repeat(seq($._method_keyword, ',')),
        $.kw_External_Language,
        repeat(seq(',', $._method_keyword)),
        ']',
      ),

    property_type: ($) => seq(
      field('keyword', $.keyword_as),
      optional(
        seq(
          choice(
            field('keyword', $.keyword_list),
            field('keyword', $.keyword_array),
          ),
          field('keyword', $.keyword_of),
        ),
      ),
      $.typename,
    ),
    keyword_as: (_) => /As/i,
    keyword_list: (_) => /list/i,
    keyword_array: (_) => /array/i,
    keyword_of: (_) => /Of/i,

    arguments: ($) =>
      seq('(', optional(seq($.argument, repeat(seq(',', $.argument)))), ')'),

    argument: ($) =>
      seq(
        optional(field('keyword', choice($.keyword_byref, $.keyword_output))),
        $.identifier,
        optional(seq(field('keyword', $.keyword_as), $.typename)),
        optional(seq('=', $.default_argument_value)),
      ),

    keyword_byref: (_) => token(prec(1, /ByRef/i)),
    keyword_output: (_) => token(prec(1, /Output/i)),
    default_argument_value: ($) =>
      choice(
        field('value', $.identifier),
        field('value', $.string_literal),
        field('value', $.numeric_literal),
        seq('{', optional(field('value', $.expression)), '}'),
      ),
    // default_argument_value_escaped: ($) => repeat1(choice($.string_literal, /[^"}]+/)),
    return_type: ($) => seq(field('keyword', $.keyword_as), $.typename),

    code_snippet: ($) =>
      seq(
        '{', prec.left(repeat1($.statement)), '}',
      ),

    _xdata_body: ($) =>
      seq(
        '{',
        field('body', alias($.external_method_body_content, $.xdata_body_content)),
        '}',
      ),

    _storage_body: ($) =>
      seq(
        '{',
        field('body', alias($.external_method_body_content, $.storage_body_content)),
        '}',
      ),

    typename: ($) =>
      seq(
        $.identifier,
        optional(
          seq('(', $.typename_param, repeat(seq(',', $.typename_param)), ')'),
        ),
        optional(
          seq($.keyword_of, $.typename)
        ),
      ),

    typename_param: ($) =>
      seq(
        $.identifier,
        '=',
        choice(
          $.string_literal,
          seq(optional(field('operator', '-')), /[0-9]+(\.[0-9]+)?/),
        ),
      ),
    identifier: ($) => /[%A-Za-z0-9][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/,
    quote_permitting_identifier: ($) =>
      choice(/"((?:""|[^"])*)"/, $.identifier),
    _word: ($) => /[%A-Za-z0-9][A-Za-z0-9]+/,
    ...keyword_rules,
  },
});
