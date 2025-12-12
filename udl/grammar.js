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
/**
 * @param {RuleOrLiteral} rule
 * @return {RuleOrLiteral}
 */
const repeat_with_commas = function (rule) {
  return seq(rule, repeat(seq(',', rule)));
};

// @ts-ignore
module.exports = define_grammar(objectscript_core, {
  name: 'objectscript',
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
        $.xdata_keywords,
        $.xdata_keywords_any,
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
    property_keyword_aliases: ($) => seq(/Aliases/i, '=', '{', repeat_with_commas($.objectscript_identifier), '}'),
    property_keyword_calculated: (_) => seq(optional(/Not/i),/Calculated/i),
    property_keyword_client_name: ($) => seq(/ClientName/i,'=', $.objectscript_identifier),
    property_keyword_compute_local_only: (_) => seq(/ComputeLocalOnly/i,'=', /[0-1]/),
    property_keyword_deferred: (_) => seq(optional(/Not/i),/Deferred/i),
    property_keyword_identity: (_) => seq(optional(/Not/i),/Identity/i),
    property_keyword_multidimensional: (_) => seq(optional(/Not/i),/Multidimensional/i),
    property_keyword_private: (_) => seq(optional(/Not/i),/Private/i),
    property_keyword_transient: (_) => seq(optional(/Not/i),/Transient/i),
    property_keyword_readonly: (_) => seq(optional(/Not/i),/ReadOnly/i),
    property_keyword_required: (_) => seq(optional(/Not/i),/Required/i),
    property_keyword_server_only: (_) => seq(/ServerOnly/i,'=', /[0-1]/),
    property_keyword_sql_column_number: ($) => seq(/SqlColumnNumber/i,'=', $.numeric_literal),
    property_keyword_sql_computed: (_) => seq(optional(/Not/i),/SqlComputed/i),
    property_keyword_sql_compute_on_change: ($) => seq(/SqlComputeOnChange/i, '=', choice(seq('(',repeat_with_commas(choice($.objectscript_identifier,$.oref_set_target,'%%UPDATE','%%INSERT')),')'),choice($.objectscript_identifier,$.oref_set_target,'%%UPDATE','%%INSERT'))),
    property_keyword_sql_field_name: ($) => seq(/SqlFieldName/i,'=',$.sql_id),
    property_keyword_sql_list_delim: ($) => seq(/SqlListDelimiter/i,'=',$.string_literal),
    property_keyword_sql_list_type: ($) => 
      seq(/SqlListType/i,
        '=',choice(/LIST/i,/DELIMITED/i,/SUBNODE/i)),
    sql_id: (_) => /[A-Za-z%_][A-Za-z@_#$0-9]*/,
    property_keyword_sql_compute_code: ($) => 
      seq(
        /SqlComputeCode/i, 
        '=', 
        '{',
        /Set/i, 
        '{', 
        choice('*',$.objectscript_identifier), 
        '}', 
        '=',
        choice(
          seq(
            '{',
            $.expression,
            '}',
          ),
          $.expression
        ),
        '}'
      ),

    property_keyword_initial_expression: ($) => 
      seq(/InitialExpression/i,'=',choice(seq('{',$.expression,'}'), $.string_literal, $.objectscript_identifier)),
    
    property_keywords: ($) => 
      seq(
        '[',
        repeat_with_commas(choice(
        $.property_keyword_aliases,
        $.property_keyword_calculated,
        $.property_keyword_client_name,
        $.property_keyword_compute_local_only,
        $.property_keyword_deferred,
        $.parameter_keyword_deprecated,
        $.parameter_keyword_final,
        $.property_keyword_identity,
        $.property_keyword_initial_expression,
        $.parameter_keyword_internal,
        $.property_keyword_multidimensional,
        $.property_keyword_private,
        $.property_keyword_readonly,
        $.property_keyword_required,
        $.property_keyword_server_only,
        $.property_keyword_sql_column_number,
        $.property_keyword_sql_compute_code,
        $.property_keyword_sql_computed,
        $.property_keyword_sql_compute_on_change,
        $.property_keyword_sql_field_name,
        $.property_keyword_sql_list_delim,
        $.property_keyword_sql_list_type,
        $.property_keyword_transient
      )),
      ']'
      )
    ,

    relationship: ($) =>
      seq(
        field('keyword', /Relationship/i),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        field('keyword', $.keyword_as),
        $.typename,
        $.relationship_keywords,
        ';',
      ),
    relationship_keywords: ($) => 
      choice(
      seq(
        '[', 
        repeat_with_commas(
          choice(
            $.relationship_keyword_cardinality,
            $.relationship_keyword_inverse,
            $.relationship_keyword_on_delete
          )
        ),
        ']'
      ),
      seq(
        '[',
        ']'
      )
      ),
    relationship_keyword_cardinality: ($) => 
      seq(
        /Cardinality/i, 
        '=', 
        choice(/one/i,/many/i,/parent/i,/children/i), 
      ),
    relationship_keyword_inverse: ($) => 
      seq(
        /inverse/i,
        '=',
        choice($.objectscript_identifier,$.oref_set_target),
      ),
    relationship_keyword_on_delete: (_) => 
      seq(
        /OnDelete/i, 
        '=', 
        choice(/cascade/i,/noaction/i,/setdefault/i,/setnull/i), 
      ),

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
    
    parameter_type: ($) => 
      seq(
        $.keyword_as,
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
        )
    ),
    parameter_keyword_final: (_) => seq(optional(/Not/i), /Final/i),
    parameter_keyword_abstract: (_) => seq(optional(/Not/i),/Abstract/i),
    parameter_keyword_deprecated: (_) => seq(optional(/Not/i),/Deprecated/i),
    parameter_keyword_internal: (_) => seq(optional(/Not/i),/Internal/i),
    parameter_keyword_flags: ($) => seq(/Flags/i,'=', choice($.enum_flag,$.list_flag)),
    parameter_keyword_constraint: ($) => seq(/Constraint/i,'=', choice($.string_literal,$.objectscript_identifier)),
    enum_flag: (_) => /ENUM/i,
    list_flag: (_) => /LIST/i,
    // Parameter Rules
    parameter_keywords: ($) =>
      seq(
        '[',
        optional(repeat_with_commas(choice(
        $.parameter_keyword_abstract,
        $.parameter_keyword_deprecated,
        $.parameter_keyword_final,
        $.parameter_keyword_flags,
        $.parameter_keyword_internal,
        $.parameter_keyword_constraint,
        ))),
        ']'
      ),
      
    parameter: ($) =>
      seq(
        field('keyword', $.keyword_parameter),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional($.parameter_type),
        optional($.parameter_keywords),
        optional(seq('=', $.default_argument_value)),
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
        choice($._xdata_xml, $._xdata_any),
      ),
    keyword_xdata: (_) => /XData/i,

    _xdata_xml: ($) =>
      seq(
        optional(field('keywords', $.xdata_keywords)),
        '{',
        field('body', alias($.external_method_body_content, $.xdata_body_content_xml)),
        '}',
      ),

    _xdata_any: ($) =>
      seq(
        field('keywords', alias($.xdata_keywords_any, $.xdata_keywords)),
        '{',
        field('body', alias($.external_method_body_content, $.xdata_body_content_any)),
        '}',
      ),

    xdata_keywords_any: ($) =>
      // NOTE: Here, MimeType _must_ be present to match this
      seq(
        '[',
        repeat(seq($._xdata_keyword, ',')),
        $.kw_MimeType,
        repeat(seq(',', $._xdata_keyword)),
        ']',
      ),

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
          seq(optional(field('operator', '-')), $.numeric_literal),
        ),
      ),
    identifier: ($) => /[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/, // i think that class names and such can't start with a number
    quote_permitting_identifier: ($) =>
      choice(/"((?:""|[^"])*)"/, $.identifier),
    _word: ($) => /[%A-Za-z0-9][A-Za-z0-9]+/,
    ...keyword_rules,
  },
});
