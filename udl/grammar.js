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
  externals: ($, previous) => previous.concat([$.external_method_body_content,$.iris_username]),
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
        optional(
          // any order is possible so we have to incldue that
          choice(
            seq($.include_code,$.include_generator,$.import_code),
            seq($.include_code,$.import_code,$.include_generator),
            seq($.include_code,$.include_generator),
            seq($.include_code,$.import_code),
            seq($.include_code),
            seq($.include_generator,$.include_code,$.import_code),
            seq($.include_generator,$.import_code,$.include_code),
            seq($.include_generator,$.import_code),
            seq($.include_generator,$.include_code),
            seq($.include_generator),
            seq($.import_code,$.include_code,$.include_generator),
            seq($.import_code,$.include_generator,$.include_code),
            seq($.import_code,$.include_generator),
            seq($.import_code,$.include_code),
            seq($.import_code),
          )
        ),
        $.class_definition,
      ),
    
    import_code: ($) => 
      seq(
        field('keyword',alias(/Import/i,$.keyword_import)),
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
    

    class_extends: ($) =>
      seq(
        field('keyword', $.keyword_extends),
        choice(
          $.identifier,
          seq('(', $.identifier, repeat(seq(',', $.identifier)), ')'),
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
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        field('arguments', $.arguments),
        field('type', alias($.return_type, $.query_type)),
        optional($.query_keywords),
        $.query_body,
      ),
    
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

    _core_trigger: ($) =>
      seq(
        field('keywords', $.trigger_keywords),
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
      
    property: ($) =>
      seq(
        field('keyword', $.keyword_property),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional($.property_type),
        optional($.property_keywords),
        ';',
      ),

    relationship: ($) =>
      seq(
        field('keyword', alias(/Relationship/i,$.keyword_relationship)),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional(
          seq(
            field('keyword', $.keyword_as),
            $.typename,
          )
        ),
        $.relationship_keywords,
        ';',
      ),
  
    foreignkey: ($) =>
      seq(
        field('keyword', $.keyword_foreignkey),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        token.immediate('('),
        alias($.quote_permitting_identifier, $.identifier),
        repeat(seq(',', alias($.quote_permitting_identifier, $.identifier))),
        token.immediate(')'),
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
      
    parameter: ($) =>
      seq(
        field('keyword', $.keyword_parameter),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional($.parameter_type),
        optional($.parameter_keywords),
        optional(seq('=', $.default_argument_value)),
        ';',
      ),
    
    projection: ($) =>
      seq(
        field('keyword', $.keyword_projection),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        $.projection_type,
        optional($.projection_keywords),
        ';',
      ),
    projection_type: ($) => $.property_type,

    index: ($) =>
      choice(
        seq(
        field('keyword', $.keyword_index),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        seq(
          field('keyword', $.keyword_on),
          $.index_properties,
        ),
        optional($.index_keywords),
        ';',
        ),
        seq(
          field('keyword', $.keyword_index),
          field('name', alias($.quote_permitting_identifier, $.identifier)),
          $.extent_index_keywords,
          ';',
        )
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
      seq(
      choice(
        /EXACT/i,
        /SQLSTRING/i,
        /SQLUPPER/i,
        /TRUNCATE/i,
        /PLUS/i,
        /MINUS/i,
      ),
      optional($.index_type_params)
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
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        choice($._xdata_xml, $._xdata_any),
      ),

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

    storage: ($) =>
      seq(
        field('keyword', $.keyword_storage),
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        optional(field('keywords', $.storage_keywords)),
        $._storage_body,
      ),

    method_definition: ($) =>
      seq(
        field('name', alias($.quote_permitting_identifier, $.identifier)),
        field('arguments', $.arguments),
        optional(field('return_type', $.return_type)),
        choice($._core_method, $._expression_method, $._external_method,$._call_method),
      ),

    _call_method: ($) =>
      seq(
        field(
          'keywords',
          $.call_method_keywords,
        ),
        '{', 
          $.routine_tag_call,
        '}',
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
          $.expression_method_keywords,
        ), 
        '{', 
        field(
          'body',
          alias($.expression, $.expression_method_body_content),
        ),
        '}',
      ),

    _external_method: ($) =>
      seq(
        field('keywords', $.external_method_keywords),
        '{',
        field('body', $.external_method_body_content),
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
          field('keyword', $.keyword_of),
        ),
      ),
      $.typename,
    ),

    arguments: ($) =>
      seq(token.immediate('('), optional(seq($.argument, repeat(seq(',', $.argument)))), ')'),

    argument: ($) =>
      seq(
        optional(field('keyword', choice($.keyword_byref, $.keyword_output))),
        $.identifier,
        optional(seq(field('keyword', $.keyword_as), $.typename)),
        optional(seq('=', $.default_argument_value)),
      ),

    default_argument_value: ($) =>
      choice(
        field('value', $.identifier),
        field('value', $.string_literal),
        field('value', $.numeric_literal),
        seq('{', optional(field('value', $.expression)), '}'),
      ),
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
    identifier: ($) => /[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/, 
    quote_permitting_identifier: ($) =>
      choice(/"((?:""|[^"])*)"/, $.identifier),
    _word: ($) => /[%A-Za-z0-9][A-Za-z0-9]+/,
    ...keyword_rules,
  },
});
