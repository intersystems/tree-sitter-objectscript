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
const keyword_rules = require('../common/keywords');
const objectscript_core = require('../core/grammar');
const {
  define_grammar,
  commaSep1,
  anyOrder1,
  build_arguments,
  build_argument_list_immediate,
  build_argument_list,
  build_function_arguments,
} = require('../common/define_grammar');
// @ts-ignore
module.exports = define_grammar(objectscript_core, {
  name: 'objectscript_udl',
  externals: ($, previous) =>
    previous.concat([$.external_method_body_content, $.iris_username]),
  conflicts: ($, previous) =>
    previous.concat([
      [$._trigger_keywords, $._external_trigger_keywords],
      [
        $._expression_method_keywords,
        $._external_method_keywords,
        $._call_method_keywords,
        $._method_keywords,
      ],
    ]),

  // Keep /\s/ in extras to avoid state-0 error-recovery loops.
  extras: ($, previous) => previous.concat([/\s/, $.documatic_line]),

  rules: {
    source_file: ($) =>
      seq(
        optional(anyOrder1($.include_code, $.include_generator, $.import_code)),
        $.class_definition,
      ),

    import_code: ($) => seq(alias(/Import/i, $.keyword_import), $._class_names),

    include_code: ($) => seq($.keyword_include, $._class_names),

    include_generator: ($) => seq($.keyword_includegenerator, $._class_names),

    _class_names: ($) =>
      build_arguments(alias($._quote_permitting_identifier, $.class_name)),

    class_definition: ($) =>
      seq(
        $.keyword_class,
        alias($._quote_permitting_identifier, $.class_name),
        optional($.class_extends),
        optional($._class_keywords),
        $.class_body,
      ),

    class_extends: ($) => seq($.keyword_extends, $._class_names),

    documatic_line: ($) =>
      seq('///', choice($._line_comment_inner, token.immediate(prec(1, /.*/)))),

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

    method: ($) => seq($.keyword_method, $.method_definition),

    classmethod: ($) => seq($.keyword_classmethod, $.method_definition),

    query: ($) =>
      seq(
        $.keyword_query,
        alias($._quote_permitting_identifier, $.query_name),
        $.arguments,
        $.return_type,
        optional($._query_keywords),
        $._external_body,
      ),

    trigger: ($) =>
      seq(
        $.keyword_trigger,
        alias($._quote_permitting_identifier, $.trigger_name),
        choice($._core_trigger, $._external_trigger),
      ),

    _class_statements_block: ($) => seq('{', repeat($.statement), '}'),
    _core_trigger: ($) => seq($._trigger_keywords, $._class_statements_block),

    _external_trigger: ($) =>
      seq($._external_trigger_keywords, $._external_body),

    property: ($) =>
      seq(
        $.keyword_property,
        alias($._quote_permitting_identifier, $.property_name),
        optional($.return_type),
        optional($.property_keywords),
        ';',
      ),

    relationship: ($) =>
      seq(
        alias(/Relationship/i, $.keyword_relationship),
        alias($._quote_permitting_identifier, $.relationship_name),
        optional($.return_type),
        $.relationship_keywords,
        ';',
      ),

    foreignkey: ($) =>
      seq(
        $.keyword_foreignkey,
        alias($._quote_permitting_identifier, $.foreignkey_name),
        build_argument_list_immediate(
          commaSep1(alias($._quote_permitting_identifier, $.property_name)),
        ),
        $.keyword_references,
        alias($._quote_permitting_identifier, $.class_name),
        optional(
          seq('(', alias($._quote_permitting_identifier, $.index_name), ')'),
        ),
        optional($.foreignkey_keywords),
        ';',
      ),

    parameter_type: ($) =>
      seq(
        $.keyword_as,
        token(
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
      ),

    parameter: ($) =>
      seq(
        $.keyword_parameter,
        alias($._quote_permitting_identifier, $.parameter_name),
        optional($.parameter_type),
        optional($.parameter_keywords),
        optional($.default_argument_value),
        ';',
      ),

    projection: ($) =>
      seq(
        $.keyword_projection,
        alias($._quote_permitting_identifier, $.projection_name),
        $.return_type,
        optional($.projection_keywords),
        ';',
      ),

    index: ($) =>
      seq(
        $.keyword_index,
        alias($._quote_permitting_identifier, $.index_name),
        choice(
          seq(
            $.keyword_on,
            build_arguments($.index_item),
            optional($.index_keywords),
          ),
          $.extent_index_keywords,
        ),
        ';',
      ),

    index_item: ($) =>
      seq($.index_property, optional(seq($.keyword_as, $.index_type))),
    index_property: ($) =>
      seq(
        alias($._quote_permitting_identifier, $.column_name),
        optional(build_argument_list($.index_property_type)),
      ),
    index_property_type: (_) => token(choice(/ELEMENTS/i, /KEYS/i)),

    index_type: ($) =>
      seq(
        token(
          choice(
            /EXACT/i,
            /SQLSTRING/i,
            /SQLUPPER/i,
            /TRUNCATE/i,
            /PLUS/i,
            /MINUS/i,
          ),
        ),
        optional(build_arguments($.numeric_literal)),
      ),

    xdata: ($) =>
      seq(
        $.keyword_xdata,
        alias($._quote_permitting_identifier, $.xdata_name),
        optional($._xdata_keywords),
        $._external_body,
      ),

    _external_body: ($) => seq('{', $.external_method_body_content, '}'),

    storage: ($) =>
      seq(
        $.keyword_storage,
        alias($._quote_permitting_identifier, $.storage_name),
        optional(seq('[', ']')),
        $._external_body,
      ),

    method_definition: ($) =>
      seq(
        alias($._quote_permitting_identifier, $.method_name),
        $.arguments,
        optional($.return_type),
        choice(
          $._core_method,
          $._expression_method,
          $._external_method,
          $._call_method,
        ),
      ),

    _call_method: ($) =>
      seq($._call_method_keywords, '{', $.routine_tag_call, '}'),

    _core_method: ($) =>
      seq(optional($._method_keywords), $._class_statements_block),

    _expression_method: ($) =>
      seq($._expression_method_keywords, '{', $.expression, '}'),

    _external_method: ($) => seq($._external_method_keywords, $._external_body),

    arguments: ($) =>
      seq(
        token.immediate('('),
        optional(build_function_arguments($.argument)),
        ')',
      ),

    argument: ($) =>
      seq(
        optional(choice($.keyword_byref, $.keyword_output)),
        $.method_arg,
        optional($.return_type),
        optional($.default_argument_value),
      ),

    default_argument_value: ($) =>
      seq(
        '=',
        choice(
          $.identifier,
          $.string_literal,
          $.numeric_literal,
          seq('{', optional($.expression), '}'),
        ),
      ),
    return_type: ($) => seq($.keyword_as, $.typename),
    typename: ($) =>
      seq(
        $._typename_options,
        optional(seq($.keyword_of, $._typename_options)),
      ),
    _typename_options: ($) =>
      seq(
        $.identifier,
        optional(build_argument_list(commaSep1($._typename_param))),
      ),
    _typename_param: ($) =>
      seq(
        $.identifier,
        '=',
        choice(
          $.string_literal,
          $.keyword_super,
          seq(optional('-'), $.numeric_literal),
        ),
      ),
    ...keyword_rules,
  },
});
