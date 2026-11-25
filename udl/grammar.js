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
    previous.concat([
      $.iris_username,
      $.python_mime_type,
      $._is_python,
      $.text_mime_type,
      $._external_class_language,
      $._reset_method_kind,
      $._set_call_method_kind,
      $._set_external_method_kind,
      $._set_expression_method_kind,
      $._is_call_method,
      $._is_external_method,
      $._is_expression_method,
    ]),
  conflicts: ($, previous) =>
    previous.concat([

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

    class_extends: ($) => seq($.keyword_extends,
      choice(
        alias($._quote_permitting_identifier, $.class_name),
        seq(
          '(',
          optional(alias($._quote_permitting_identifier, $.class_name)),
          repeat1(seq(',', optional(alias($._quote_permitting_identifier, $.class_name)))),
          ')',
        ),
      )),

    documatic_line: ($) =>
      seq('///', choice($._line_comment_inner, token.immediate(prec(1, /.*/)))),

    class_body: ($) => seq('{', repeat($.class_statement), '}'),

    class_statement: ($) =>
      seq(
        choice(
          $.method,
          $.classmethod,
          $.clientmethod,
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

    clientmethod: ($) =>
      seq(
        $.keyword_clientmethod,
        $._set_external_method_kind,
        $._method_header,
        optional($.method_keywords),
        $.external_method,
        $._reset_method_kind,
      ),

    query: ($) =>
      seq(
        $.keyword_query,
        alias($._quote_permitting_identifier, $.query_name),
        $.arguments,
        $.return_type,
        optional($.query_keywords),
        $._external_body,
      ),

    trigger: ($) =>
      seq(
        $.keyword_trigger,
        alias($._quote_permitting_identifier, $.trigger_name),
        $.trigger_keywords,
        choice($._class_statements_block, $.external_trigger),
        $._reset_method_kind,
      ),

    _class_statements_block: ($) => seq('{', repeat($.statement), '}'),
    _core_trigger: ($) => seq($.trigger_keywords, $._class_statements_block),

    external_trigger: ($) =>
      seq($._is_external_method, $._external_body),

    property: ($) =>
      seq(
        $.keyword_property,
        alias($._quote_permitting_identifier, $.property_name),
        optional($.arguments),
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
          seq('(', optional(alias($._quote_permitting_identifier, $.index_name)), ')'),
        ),
        optional($.foreignkey_keywords),
        ';',
      ),

    parameter: ($) =>
      seq(
        $.keyword_parameter,
        alias($._quote_permitting_identifier, $.parameter_name),
        optional(alias($.return_type, $.parameter_type)),
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
          prec.right(seq(
            $.keyword_on,
            $._index_on_values,
            optional($.index_keywords),
          )),
          $.extent_index_keywords,
        ),
        ';',
      ),
    _index_on_values: ($) =>
      choice(
        prec.right(seq(
          build_argument_list(commaSep1($.index_property_value)),
          optional($.return_type),
        )),
        $.index_property_value,
      ),
    index_property_value: ($) =>
      prec.right(
        seq(
          alias($._quote_permitting_identifier, $.property_name),
          optional($._index_property_args),
          optional($.index_type),
        ),
      ),

    index_type: ($) =>
      seq(
        $.keyword_as,
        alias($._base_variable, $.typename),
        optional(build_argument_list($.numeric_literal),
        ),
      ),
    _index_property_args: ($) => build_argument_list(alias(choice(/ELEMENTS/i, /KEYS/i), $.typename)),

    xdata: ($) =>
      seq(
        $.keyword_xdata,
        alias($._quote_permitting_identifier, $.xdata_name),
        optional($.xdata_keywords),
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

    _method_header: ($) =>
      seq(
        alias($._quote_permitting_identifier, $.method_name),
        $.arguments,
        optional($.return_type),
      ),

    method_definition: ($) =>
      seq(
        $._method_header,
        optional($.method_keywords),

        choice(
          $.expression_method,
          $.external_method,
          $.call_method,
          $._class_statements_block,
        ),
        $._reset_method_kind,
      ),

    call_method: ($) =>
      seq($._is_call_method, '{', choice($.routine_tag_call, $._method_call), '}'),

    expression_method: ($) =>
      seq($._is_expression_method, '{', optional($.expression), '}'),

    external_method: ($) => seq(
      $._is_external_method, $._external_body),

    arguments: ($) =>
      seq(
        token.immediate('('),
        optional(build_function_arguments($.argument)),
        ')',
      ),

    argument: ($) =>
      seq(
        optional(choice($.keyword_byref, $.keyword_output, $.keyword_byval)),
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
