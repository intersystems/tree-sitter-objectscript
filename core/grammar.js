/**
 * Copyright (c) 2023 by InterSystems.
 * Cambridge, Massachusetts, U.S.A.  All rights reserved.
 * Confidential, unpublished property of InterSystems.
 */

/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Note: CommonJS warning is expected - TypeScript repos commonly have this issue
const objectscript_expr = require('../expr/grammar');

const {
  unspace: generate_post_conditionals,
  repeat_with_commas,
} = require('./utils');

/**
 * @param {RuleOrLiteral} rule
 * @return {RuleOrLiteral}
 */
const repeat_with_colons = function (rule) {
  return seq(rule, repeat(seq(token.immediate(':'), rule)));
};

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @return {RuleOrLiteral}
 */
function build_command_rule_argumentful($, commandKeyword, commandArgument) {
  // Argumentful
  return seq(
    field('command_name', commandKeyword),
    optional($.post_conditional),
    $._immediate_single_whitespace_followed_by_non_whitespace,
    commandArgument,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @return {RuleOrLiteral}
 */
function build_command_rule_special_argumentless($, commandKeyword) {
  return choice(
      seq(
          field('command_name', commandKeyword),
          optional($.post_conditional),
          $._argumentless_command_end,
          repeat($.statement),
          $._termination,
      ),
      seq(field('command_name', commandKeyword), optional($.post_conditional), $._termination)
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @return {RuleOrLiteral}
 */
function build_command_rule_argumentless($, commandKeyword) {
  // Argumentless
  return seq(
    field('command_name', commandKeyword),
    optional($.post_conditional),
    choice(
        $._argumentless_command_end,
        $._termination,
    )

  );
}

const post_conditional_rules = generate_post_conditionals(
  // LINT: Why is ts giving an error? .grammar is a valid field
  // @ts-ignore
  objectscript_expr.grammar,
  [sym('method_args'), sym('subscripts')],
);

module.exports = grammar(objectscript_expr, {
  name: 'objectscript_core',
  externals: ($) => [
    $._immediate_single_whitespace_followed_by_non_whitespace,
    $._assert_no_space_between_rules,
    $._argumentless_command_end,
    $._argumentless_loop,
    $._whitespace, // handle whitespaces programatically. NOTE: Prioritize lexing whitespace as fast as possible!!!
    $.tag,
    $.angled_bracket_fenced_text,
    $.paren_fenced_text,
    $.embedded_sql_marker,
    $.embedded_sql_reverse_marker,
    $._line_comment_inner,
    $._block_comment_inner,
    $.macro_value_line_with_continue,
    $.sentinel,
    $._bol,
    $._termination,
    $.zbreak_command,
    $._zbreak_device_termination,
    $._post_conditional_id,
    $._xecute_arg_invalid,
    $._zw_block,
    $.html_marker,
    $.html_marker_reversed,
    $.embedded_js_special_case,
    $.embedded_js_special_case_complete,
  ],
  conflicts: ($, previous) =>
    previous.concat([
      [$.use_parameters, $.parenthetical_expression],
      [$.open_parameters, $.parenthetical_expression],
      [$.xecute_argument, $.parenthetical_expression],
      [$.class_method_call_post_cond,$.oref_chain_expr_post_cond],
    ]),

  // These are what I can think of
  // \r: Carriage return
  // \f: Form feed
  // : Space
  // \v: Vertical tab
  // \u00A0: Non-breaking space
  // \u2028: Line separator
  // \u2029: Paragraph separator
  extras: ($) => [
    $._whitespace,
    $.line_comment_1,
    $.line_comment_2,
    $.line_comment_3,
    $.line_comment_4,
    $.block_comment,
  ],
  // Note that adding the word key
  // makes tree sitter not like the one letter form of keyword write
  precedences: ($, previous) => [

    // [$.oref_method_post_cond, $.oref_property_post_cond],
    [$.oref_chain_expr_post_cond, $.expr_atom_post_cond],
    [$.class_method_call_post_cond,$.oref_chain_expr_post_cond],
    ...previous,
  ],
  // inline: ($, previous) => [$.set_target, ...previous],

  rules: {
    source_file: ($) => $.statements,
    statements: ($) => repeat1($.statement),
    // Note: Line comments must be handled separately due to tree-sitter limitations.
    // Using choice() for line_comment as an extra causes parsing issues.
    line_comment_1: ($) => seq('//', $._line_comment_inner),
    line_comment_2: ($) => seq('#;', $._line_comment_inner),
    line_comment_3: ($) => seq(';', $._line_comment_inner),
    line_comment_4: ($) => seq('##;', $._line_comment_inner),
    block_comment: ($) => seq('/*', $._block_comment_inner, '*/'),
    statement: ($) =>
      choice(
        $.command_set,
        $.command_write,
        $.command_do,
        $.command_zwrite,
        $.command_for,
        $.command_while,
        $.command_kill,
        $.command_lock,
        $.command_read,
        $.command_open,
        $.command_close,
        $.command_use,
        $.command_new,
        $.command_if,
        $.command_else,
        $.command_throw,
        $.command_trycatch,
        $.command_job,
        $.command_break,
        $.command_merge,
        $.command_quit,
        $.command_goto,
        $.command_return,
        $.command_halt_or_hang,
        $.command_dowhile,
        $.command_continue,
        $.command_tcommit,
        $.command_trollback,
        $.command_tstart,
        $.command_view,
        $.command_xecute,
        $.command_zbreak,
        $.command_zkill,
        $.command_zn,
        $.command_zsu,
        $.command_ztrap,
        $.command_zz,
        $.embedded_html,
        $.embedded_xml,
        $.embedded_sql,
        $.embedded_js,
        $.pound_dim,
        $.pound_define,
        $.pound_def1arg,
        $.pound_if,
        $.pound_ifdef,
        $.pound_ifndef,
        $.pound_import,
        $.pound_include,
        $.macro,
        $.tag,
        $.tag_with_params,
        $.procedure,
      ),

    dotted_statement: ($) =>
       seq(
         // this is from the external scanner, and it means that it was
         // at the start of a line and there were dots matching the dotted statement
        $._bol,
        repeat('.'), // in the whitespace case, I don't want to consume the . in the scanner, so they would appear here
        $.statement,
      ),
    pound_dim: ($) =>
      seq(
        field('preproc_keyword', $.keyword_dim),
        repeat_with_commas($.objectscript_identifier),
        optional(
          seq(
            field('preproc_keyword', /As/i),
            choice(
              $.objectscript_identifier,
              $.oref_chain_expr,
            ),
            optional(
              seq(
                /Of/i,
                choice(
                  $.objectscript_identifier,
                  $.oref_chain_expr
                )
              )
            ),
          ),
        ),
        optional(seq('=', optional($._xecute_arg_invalid), $.expression)),
      ),

    keyword_dim: (_) => /\#[dD][iI][mM]/,
    keyword_list:(_)=> /list/i,
    keyword_array:(_)=> /array/i,

    pound_define: ($) =>
      seq(
        field('preproc_keyword', $.keyword_pound_define),
        prec(10, seq(
          field('macro_name', $.pound_define_variable_name),
          optional($.pound_define_variable_args),
        )),
        choice($.macro_value, $._termination),
      ),
    pound_define_variable_name: ($) =>
      /[A-Za-z0-9]+/,
    pound_define_variable_args: ($) =>
      prec(15, seq(
        token.immediate('('),
        optional(
          seq(
            $.macro_arg,
            repeat(seq(',', $.macro_arg)),
          ),
        ),
        token.immediate(')'),
      )),
    keyword_pound_define: (_) => /\#define/i,
    pound_def1arg: ($) =>
      seq(
        field('preproc_keyword', $.keyword_pound_def1arg),
        prec(10, seq(
          field('macro_name' ,$.pound_define_variable_name),
          optional($.pound_def1arg_variable_arg),
        )),
        optional($.macro_value),
      ),
    pound_def1arg_variable_arg: ($) =>
      prec(15, seq(
        token.immediate('('),
        optional($.macro_arg),
        token.immediate(')'),
      )),
    keyword_pound_def1arg: (_) => /\#def1arg/i,

    pound_execute: ($) => field('preproc_keyword', $.keyword_pound_execute),
    keyword_pound_execute: (_) => /\#execute/i,

    pound_if: ($) =>
      seq(
        field('preproc_keyword', $.keyword_pound_if),
          optional($._xecute_arg_invalid),
        field('condition', $.expression),
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
        field('preproc_keyword', $.keyword_pound_endif),
      ),

    pound_ifdef: ($) =>
      seq(
        field('preproc_keyword', alias(/\#ifdef/i, $.kw_pound_ifdef)),
          optional($._xecute_arg_invalid),
        field('condition', $.expression),
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
        field('preproc_keyword', $.keyword_pound_endif),
      ),

    pound_ifndef: ($) =>
      seq(
        choice(/\#ifndef/i,/\#ifundef/i,),
          optional($._xecute_arg_invalid),
        field('condition', $.expression),
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
        field('preproc_keyword', $.keyword_pound_endif),
      ),

    keyword_pound_if: (_) => /\#if/i,
    keyword_pound_endif: (_) => /\#endif/i,
    pound_elseif: ($) =>
      prec.right(
        seq(
          field('preproc_keyword', $.keyword_pound_elseif),
            optional($._xecute_arg_invalid),
          field('condition', $.expression),
          repeat($.statement),
        ),
      ),
    keyword_pound_elseif: (_) => /\#elseif/i,

    pound_else: ($) =>
      seq(field('preproc_keyword', $.keyword_pound_else), $.statements),
    keyword_pound_else: (_) => /#else/i,

    pound_import: ($) =>
      seq(
        field('preproc_keyword', alias(/\#import/i, $.kw_pound_import)),
        repeat_with_commas(/[%A-Za-z0-9][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/),
      ),

    pound_include: ($) =>
      seq(
        field('preproc_keyword', alias(/\#include/i, $.kw_pound_include)),
        /[%A-Za-z0-9][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/,
      ),

    // TODO: Unimplemented preprocessor directives (lower priority):
    // #noshow, #show, #sqlcompile (audit/mode/path/select), #undef,
    // ##; ##beginquote/##EndQuote, ##expression, ##function, ##lit,
    // ##quote, ##quoteExp, ##sql, ##stripq, ##unique

    macro_arg: (_) =>
      /\%[A-Za-z0-9]+/,
    macro_value_line: ($) => prec(0,
      seq(
        /[ \t]+/,
        /[^\n]*/,
        $._termination,
      )),
    macro_value: ($) =>
      seq(
        repeat(
          // Multi-line macro (starts with continuation and can have more)
          $.macro_value_line_with_continue,
        ),
        $.macro_value_line, // Final line without continuation
      ),

    command_set: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_set,
        repeat_with_commas($.set_argument),
      ),
    keyword_set: (_) => /[sS]([eE][tT])?/,
    set_argument: ($) =>
    choice(
        seq(
            field('lhs', 
              choice(
                $.set_target,
                seq(
                  '(',
                  field('lhs', repeat_with_commas($.set_target)),
                  ')'
                )
              )
            ),
            field('operator', '='),
            field('rhs', $.expression),
        ),
        $.indirection,
    ),

    set_target: ($) => prec(1, choice(
        $.glvn,                    // local, global, ssvn
        $.oref_chain_expr,         // obj.prop, obj.method().prop
        $.system_defined_function,
        $.built_in_function_name,
        $.indirection,             // @varname
        $.relative_dot_property,   // ..Property
        $.instance_variable,       // i%propname
    )),

    command_write: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, $.keyword_write),
          seq(
          field('command_name', $.keyword_write),
          optional($.post_conditional),
          choice($._immediate_single_whitespace_followed_by_non_whitespace,$._zw_block),
          repeat_with_commas($.write_argument)
        )
        ),
      ),
    keyword_write: (_) => /[wW]([rR][iI][tT][eE])?/,
    write_argument: ($) => choice($.write_device_control, seq(optional($._xecute_arg_invalid), $.expression)),
    write_device_control: ($) =>
      choice(
        $.write_device_fflf,
        $.write_device_tab,
        $.write_device_char,
        $.write_mnemonic,
        seq($.write_device_fflf, $.write_device_tab),
      ),
    write_device_fflf: (_) => repeat1(choice('!', '#')),
    write_device_tab: ($) => seq('?', optional($._xecute_arg_invalid), $.expression),
    write_device_char: ($) => seq('*', optional($._xecute_arg_invalid), $.expression),

    write_mnemonic: ($) =>
      seq(
        field('mnemonic', $.mnemonic_name),
        optional($.method_args)
      ),
    mnemonic_name: ($) =>
      seq(
        "/",
        $.identifier_segment_immediate
      ),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cdo
    command_do: ($) =>
      choice(
          prec.right(seq(field('command_name', $.keyword_do), repeat1($.dotted_statement))),
        // DO with parameters
        build_command_rule_argumentful(
          $,
          $.keyword_do,
          repeat_with_commas($.do_parameter),
        ),
      ),
    keyword_do: (_) => /[dD]([oO])?/,
    do_parameter: ($) =>
        seq(
            choice(
                $.routine_tag_call,
                $.class_method_call,
                $.instance_method_call,
                seq(optional($._xecute_arg_invalid), $.system_defined_function),
                // $.doable_dollar_functions,
                $.superclass_method_call,
            ),
            optional($.post_conditional)
        ),


    instance_method_call: ($) =>
      choice(
        $.relative_dot_method,
        seq(
          choice(
            $.lvn,
            $.instance_variable,
            $.relative_dot_method,
            $.parenthetical_expression,
          ),
          repeat(
            seq(
              token.immediate('.'),
              choice(
                  alias(token.immediate(/"(?:[^"]+|"")*"/), $.method_name),
                  alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.method_name),
              ),
              optional(
                seq(
                  token.immediate('('),
                  optional(
                    seq(
                      optional($.method_arg),
                      repeat(
                          seq(
                              ',',
                              optional($.method_arg),
                          ),
                      ),
                      ),
                  ),
              ')'
            )
            )
        )
        ),
          // Whatever we have here must end in a method
          token.immediate('.'),
          choice(
              alias(token.immediate(/"(?:[^"]+|"")*"/), $.method_name),
              alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.method_name),
          ),
          token.immediate('('),
          optional(
              seq(
                  optional($.method_arg,),
                  repeat(
                      seq(
                          ',',
                          optional($.method_arg),
                      ),
                  ),
              ),
          ),
          ')',
        ),
      ),

    routine_tag_call: ($) =>
      seq(
        $.line_ref,
        optional($.method_args),
      ),

    // doable_dollar_functions: ($) =>
    //   choice(
    //     // These are more specialized
    //     $.dollar_classmethod,
    //     $.dollar_method,
    //     $.dollarsf,
    //     // Generic $ functions
    //     seq(
    //       alias(choice(
    //         /\$I(NCREMENT)?/i,
    //         /\$ZF/i,
    //         /\$ZU(TIL)?/i
    //       ), $.built_in_function_name),
    //       token.immediate('('),
    //       repeat_with_commas(seq(optional($._xecute_arg_invalid), $.expression)),
    //       ')',
    //     ),
    //   ),


    command_for: ($) =>
      // The `FOR` command has 4 versions:
      // * Block style with params:    FOR <criteria> { ... }
      // * Block style argumentless:   FOR { ... }
      // * Old style with params:      FOR <criteria> <commands...>
      // * Old style argumentless:     FOR  <commands...>
      // NOTE: `FOR` doesn't allow post_conditional in any form
      choice(
        // Block style FOR with parameters
        seq(
          field('command_name', $.keyword_for),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          optional($._termination),
          '{',
          repeat($.statement),
          '}',
        ),
        // Block style FOR without parameters (argumentless)
        seq(
          field('command_name', $.keyword_for),
          $._argumentless_loop,
          '{',
          repeat($.statement),
          '}',
        ),
        // Old style FOR with parameters
        seq(
          field('command_name', $.keyword_for),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          repeat($.statement),
          $._termination,
        ),
        // // Old style argumentless FOR
        seq(
          field('command_name', $.keyword_for),
          $._argumentless_command_end,
          repeat($.statement),
          $._termination,
        ),
        seq(
            field('command_name', $.keyword_for),
            $._termination,
        )
      ),

    keyword_for: (_) => /[fF]([oO][rR])?/,
    for_parameter: ($) => prec.right(
        seq(
      choice(
        $.glvn,
        $.instance_variable,
        $.indirection,
      ),
      field('operator','='),
      repeat_with_commas($.for_parameter_arg),
    )),
    for_parameter_arg: ($) =>
      choice(
          seq(
              optional($._xecute_arg_invalid),
              $.expression,
          ),
        seq(
            optional($._xecute_arg_invalid),
          field('initial', $.expression),
          field('operator',':'),
            optional($._xecute_arg_invalid),
          field('increment', $.expression),
        ),
        seq(
            optional($._xecute_arg_invalid),
          field('initial', $.expression),
          field('operator',':'),
            optional($._xecute_arg_invalid),
          field('increment', $.expression),
          field('operator',':'),
            optional($._xecute_arg_invalid),
          field('limit', $.expression),
        ),
      ),

    // Note: Parser prioritizes DO statement over KILL in certain contexts.
    // This is acceptable behavior for the current implementation.
    command_while: ($) =>
      seq(
        field('command_name', $.keyword_while),
        $._immediate_single_whitespace_followed_by_non_whitespace,
        repeat_with_commas(seq(optional($._xecute_arg_invalid), $.expression)),
        '{',
        repeat($.statement),
        '}',
      ),
    keyword_while: (_) => /[wW][hH][iI][lL][eE]/,

    command_kill: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_kill),
        build_command_rule_argumentful(
          $,
          $.keyword_kill,
          repeat_with_commas($.kill_argument),
        ),
      ),

    keyword_kill: (_) => /[kK]([iI][lL][lL])?/,
    kill_argument: ($) =>
        choice(
            seq(optional($._xecute_arg_invalid), alias($.kill_target, $.variable)),
            seq('(', repeat_with_commas(seq(optional($._xecute_arg_invalid), alias($.kill_target, $.variable))), ')'),
        ),

    kill_target: ($) =>
        prec(1,choice(
            $.glvn,
            $.indirection,
            $.instance_variable,
            $.oref_chain_expr,
        )),

    command_lock: ($) =>
      choice(
        seq(field('command_name', $.keyword_lock),
            choice($._argumentless_command_end,
                $._termination,
            ),

            ),

        build_command_rule_argumentful(
          $,
          $.keyword_lock,
          repeat_with_commas($.command_lock_argument),
        ),
      ),
    keyword_lock: (_) => /[lL]([oO][cC][kK])?/,
    command_lock_argument: ($) =>
      choice(
        $.command_lock_arguments_variant_1,
        $.command_lock_arguments_variant_2,
      ),
    command_lock_arguments_variant_1: ($) =>
      field(
        'argument',
        seq(
          optional(/[\+\-]/),
          optional('@'),
          $.glvn,
          optional($.locktype),
          optional($.timeout),
        ),
      ),
    command_lock_arguments_variant_2: ($) =>
      seq(
        optional(/[\+\-]/),
        '(',
        repeat_with_commas(
          field(
            'argument',
            seq(
              optional(/[\+\-]/),
              optional('@'),
              $.glvn,
              optional($.locktype),
            ),
          ),
        ),
        ')',
        optional($.timeout),
      ),
    // Available values are “S” (shared lock), ”E” (escalating lock), “I” (immediate unlock), and “D” (deferred unlock
    // of course lock ^foo#"SSSSSSSSSEEEEEEEEEDDDDDDDD" doesn't make sense, but it's syntactically valid and compiles.
    locktype: (_) =>
      token(seq(
        '#',
        '"',
        /[SEID]+/,
        '"',
      )),
    timeout: ($) =>
      seq(token.immediate(':'), optional($._xecute_arg_invalid), alias($.expression_post_cond, $.expression)),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cread#RCOS_cread25
    command_read: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_read,
        repeat_with_commas($.read_argument),
      ),
    keyword_read: (_) => /[Rr]([eE][aA][dD])?/,
    read_argument: ($) =>
      choice(
        field('fchar', repeat1($._read_fchar)),
        field('prompt', alias($.string_literal, $._read_prompt)),
        field('variable', $._read_variable),
          $.indirection,
      ),
    _read_fchar: (_) => choice('!', '#', '?', '/'),
    _read_variable: ($) =>
      seq(
        choice(
          field('variable', $.glvn),
          field(
            'single_character',
            seq('*', $._assert_no_space_between_rules, $.glvn),
          ),
          field('fixed', seq($.glvn, '#', optional($._xecute_arg_invalid), $.expression)),
        ),
        optional(field('timeout', seq(token.immediate(':'), optional($._xecute_arg_invalid), $.expression))),
      ),

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_copen#RCOS_copen25
    // OPEN:pc device:(parameters):timeout:"mnespace",...
    // O:pc device:(parameters):timeout:"mnespace",...
    command_open: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_open,
        repeat_with_commas($.open_argument),
      ),
    keyword_open: (_) => /O(pen)?/i,
    open_argument: ($) =>
      seq(
        $.device,
        optional(
          choice(
            seq(
              token.immediate(':'),
              $.open_parameters
            ),
            seq(
              token.immediate(':'),token.immediate(':'),
                optional($._xecute_arg_invalid),
              field('timeout',$.expression)
            ),
            seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),
                optional($._xecute_arg_invalid),
              field('timeout',$.expression)
            ),
             seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),
                 optional($._xecute_arg_invalid),
              field('timeout',$.expression),
              token.immediate(':'),
                 optional($._xecute_arg_invalid),
              field('mnespace', $.expression)
            ),
            seq(
              token.immediate(':'),token.immediate(':'),token.immediate(':'),
                optional($._xecute_arg_invalid),
              field('mnespace', $.expression)
            ),
            seq(
              token.immediate(':'),token.immediate(':'),
                optional($._xecute_arg_invalid),
              field('timeout',$.expression),
              token.immediate(':'),
                optional($._xecute_arg_invalid),
              field('mnespace', $.expression)
            ),
            seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),token.immediate(':'),
                optional($._xecute_arg_invalid),
              field('mnespace', $.expression)
            ),
          )
        )
      ),


    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cclose
    // eslint-disable-next-line max-len
    command_close: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_close,
        repeat_with_commas($.close_argument),
      ),
    close_parameters: ($) =>
      choice(
        seq(
        '(',
        optional(
          seq(
            optional($.close_parameter_option_value),
            repeat(
              seq(
                ':',
                optional($.close_parameter_option_value),
              )
            )
          )
        ),
        ')'
        ),
        $.close_parameter_option_value
      ),
    keyword_close: (_) => /Close/i,
    close_argument: ($) =>
      seq($.device, optional(seq(token.immediate(':'),$.close_parameters))),
    // "D", "K", ("R":newname or /REN=newname or /RENAME=newman)
    close_rename: ($) =>
      choice(
        seq('"R"',':'),
        seq(choice('/REN=','/RENAME='))
      ),
    close_parameter_option_value: ($) =>
      choice(
        '"K"',
        '"D"',
        seq($.close_rename, $.device),
        seq($.open_keyword_delete, optional(seq(token.immediate('='),optional($._xecute_arg_invalid), $.expression))),
      ),

    open_keyword_translate: (_) => /\/Tra(nslate)?/i,
    open_keyword_translate_equals: (_) => /\/Tra(nslate)?=/i,
    open_keyword_iotable: (_) => /\/IOT(able)?/i,
    open_keyword_iotable_equals: (_) => /\/IOT(able)?=/i,
    open_keyword_delete_equals: (_) => /\/DEL(ete)?=/i,
    open_keyword_delete: (_) => /\/DEL(ete)?/i,
    open_keyword_write: (_) => /\/WRI(TE)?/i,
    open_keyword_create: (_) => /\/CRE(ATE)?/i,
    open_keyword_xytable: (_) => /\/XYT(ABLE)?/i,
    open_keyword_xytable_equals: (_) => /\/XYT(ABLE)?=/i,

    open_keyword_record_size: (_) => /\/REC(ORDSIZE)?=/i,
    open_keyword_params: (_) => /\/PAR(AMS)?=/i,
    open_keyword_terminator: (_) => /\/TER(MINATOR)?=/i,
    open_keyword_fixed: (_) => /\/fix(ed)?/i,
    immediate_equal: (_) => token.immediate('='),
    open_keywords: ($) =>
      choice(
        '/NEW',
        $.open_keyword_create,
        $.open_keyword_write,
        '/TRUNCATE',
        '/READ',
        '/APPEND',
        '/APP',
        '/STREAM',
        '/VARIABLE',
        $.open_keyword_fixed,
        '/UNDEFINED',

        seq($.open_keyword_delete_equals, seq(optional($._xecute_arg_invalid), $.expression)),
        $.open_keyword_delete,
        '/NOXY',
        seq('/NOXY=', optional($._xecute_arg_invalid), $.expression),
        seq('/OBUFSIZE=', optional($._xecute_arg_invalid), $.expression),
        '/GZIP',
        seq('/GZIP=', optional($._xecute_arg_invalid), $.expression),
        seq('/COMPRESS=', optional($._xecute_arg_invalid), $.expression),
        $.open_keyword_translate,
        $.open_keyword_translate,
        $.open_keyword_xytable,
        seq($.open_keyword_translate_equals, optional($._xecute_arg_invalid), $.expression),
        seq($.open_keyword_iotable_equals, choice($.string_literal,$.objectscript_identifier)),
        seq($.open_keyword_xytable_equals, choice($.string_literal,$.objectscript_identifier)),
        seq($.open_keyword_terminator, choice($.string_literal,$.objectscript_identifier)),
        seq($.open_keyword_record_size, choice($.string_literal,$.objectscript_identifier)),
        seq($.open_keyword_params, choice($.string_literal,$.objectscript_identifier)),
      )

    ,

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cuse
    // USE:pc device:(parameters):"mnespace",...
    // U:pc device:(parameters):"mnespace",...

    use_argument: ($) =>
      seq(
        $.device,
        optional(
          choice(
            seq(
            token.immediate(':'),
            $.use_parameters
            ),
            seq(
            token.immediate(':'),token.immediate(':'),
                optional($._xecute_arg_invalid),
            field('mnespace',$.expression)
            ),
            seq(
            token.immediate(':'),
            $.use_parameters,
            token.immediate(':'),
                optional($._xecute_arg_invalid),
            field('mnespace',$.expression)
            ),
          )
        )
      )
      ,

    use_keywords: ($) => seq('/POSITION=',optional($._xecute_arg_invalid), $.expression),

    use_parameters: ($) =>
      choice(
        seq(
        '(',
        optional(
          seq(
            optional(choice($.open_keywords,seq(optional($._xecute_arg_invalid),$.expression),$.use_keywords)),
            repeat(
              seq(
                ':',
                optional(choice($.open_keywords,seq(optional($._xecute_arg_invalid),$.expression),$.use_keywords)),
              )
            )
          )
        ),
        ')'
        ),
        choice(
          $.open_keywords,
          seq(optional($._xecute_arg_invalid),$.expression),
          $.use_keywords
        ),
      ),



    open_parameters: ($) =>
      choice(
        seq(
        '(',
        optional(
          seq(
            optional(choice($.open_keywords,seq(optional($._xecute_arg_invalid),$.expression))),
            repeat(
              seq(
                ':',
                optional(choice($.open_keywords,seq(optional($._xecute_arg_invalid),$.expression))),
              )
            )
          )
        ),
        ')'
        ),
        choice($.open_keywords,seq(optional($._xecute_arg_invalid),$.expression)),
      ),

    command_use: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_use,
        repeat_with_commas($.use_argument),
      ),
    keyword_use: (_) => /U(se)?/i,

    command_dowhile: ($) =>
      seq(
        field('command_name', $.keyword_do),
        $._argumentless_loop,
        '{',
        repeat($.statement),
        '}',
        field('command_name', $.keyword_while),
          optional($._xecute_arg_invalid),
        $.expression,
      ),

    command_new: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_new),
        build_command_rule_argumentful(
          $,
          $.keyword_new,
          repeat_with_commas($._command_new_argument),
        ),
      ),
    _command_new_argument: ($) =>
      choice($._command_new_item, seq('(', repeat_with_commas($._command_new_item), ')')),
    keyword_new: (_) => /[nN]([eE][wW])?/,
    _command_new_item: ($) =>
      choice(
        $.lvn,
        $.estack_token,
        $.etrap_token,
        $.namespace_token,
        $.roles_token,
      ),

    command_if: ($) =>
      // The `IF` command is tricky, there are 3 versions:
      // * Block style:   If <cond> { ... } [Else/ElseIf ...]
      // * Old with arg:  If <cond> <commands...>
      // * Old no arg:    If  <commands...>
      // NOTE: `IF` doesn't allow post_conditional in any form
      choice(
        // Block style IF

          seq(
              field('command_name', $.keyword_if),
              $._immediate_single_whitespace_followed_by_non_whitespace,
              repeat_with_commas(seq(optional($._xecute_arg_invalid), $.expression)),
              optional($._termination),
              '{',
              repeat($.statement),
              '}',
              repeat(field('elseif_block', $.elseif_block)),
              optional(field('else_block', $.else_block)),
          ),
          seq(
              field('command_name', $.keyword_if),
              $._argumentless_loop,
              '{',
              repeat($.statement),
              '}',
              repeat(field('elseif_block', $.elseif_block)),
              optional(field('else_block', $.else_block)),
          ),
          seq(
              field('command_name', $.keyword_if),
              $._argumentless_command_end,
              repeat1($.statement),
              $._termination,
          ),
          seq(
              field('command_name', $.keyword_if),
              $._termination,
          ),
          seq(
              field('command_name', $.keyword_if),
              $._immediate_single_whitespace_followed_by_non_whitespace,
              repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
              repeat($.statement),
              $._termination,
          )
      ),
    command_else: ($) =>
        choice(
            seq(
                field('command_name', $.keyword_oldelse),
                $._argumentless_command_end,
                repeat($.statement),
                $._termination,
            ),
            seq (
                field('command_name', $.keyword_oldelse),
                $._termination,
            )
        ),

    keyword_if: (_) => /I(f)?/i,
    keyword_elseif: (_) => /ElseIf/i,
    keyword_else: (_) => /Else/i,     // NOTE: New style Else must be spelled out
    keyword_oldelse: (_) => /E(lse)?/i,

    elseif_block: ($) =>
      seq(
        field('command_name', $.keyword_elseif),
        $._immediate_single_whitespace_followed_by_non_whitespace,
        repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
        '{',
        repeat($.statement),
        '}',
      ),
    else_block: ($) =>
      seq(
        field('command_name', $.keyword_else),
        '{',
        repeat($.statement),
        '}',
      ),

    command_throw: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, $.keyword_throw),
          build_command_rule_argumentful(
            $,
            $.keyword_throw,
            field('throw_argument', $.expression),
          ),
        ),
      ),
    keyword_throw: (_) => /Throw/i,

    command_trycatch: ($) =>
      seq(
        field(
          'try_block',
          seq(
            field('command_name', $.keyword_try),
            '{',
            repeat($.statement),
            '}',
          ),
        ),
        field(
          'catch_block',
          $.catch_block,
        ),
      ),

    catch_block: ($) =>
      seq(
        field('command_name', $.keyword_catch),
        optional(choice(seq('(', $.glvn, ')'), $.glvn)),
        '{',
        repeat($.statement),
        '}',
      ),

    keyword_try: (_) => /[tT][rR][yY]/,
    keyword_catch: (_) => /[cC][aA][tT][cC][hH]/,
    // JOB command syntax examples:
    // routine(routine-params):(process-params):timeout
    // routine(routine-params)[joblocation]:(process-params):timeout
    // routine(routine-params)|joblocation|:(process-params):timeout
    // ##class(className).methodName(args):(process-params):timeout
    // ..methodName(args):(process-params):timeout
    command_job: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_job,
        repeat_with_commas($.job_argument),
      ),
    keyword_job: (_) => /[jJ]([oO][bB])?/,
    job_argument: ($) =>
      seq(
        choice(
          $.routine_tag_call,
          $.class_method_call,
          $.relative_dot_method,
          $.dollar_classmethod,
        ),
        optional(
          // jobLocation
          seq(
            token.immediate(/[\[\|]/),
            optional($._xecute_arg_invalid),
            $.expression,
            token.immediate(/[\]\|]/),
          ),
        ),
        optional(
          seq(
            token.immediate(':'),
            optional(
              // process-params
              seq(
                token.immediate('('),

                optional(seq(optional($._xecute_arg_invalid),$.expression)),
                repeat(
                  seq(
                    token.immediate(':'),
                    optional(seq(optional($._xecute_arg_invalid),$.expression)),
                  ),
                ),
                token.immediate(')'),
              ),
            ),
            optional($.timeout),
          ),
        ),
      ),

    // eslint-disable-next-line max-len
    command_break: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_break),
        build_command_rule_argumentful(
          $,
          $.keyword_break,
          repeat_with_commas($.break_argument),
        ),
      ),
    break_argument: ($) =>
      choice(field('extend', $.string_literal), field('flag', /[0145]/)),
    keyword_break: (_) => /B(REAK)?/i,

    command_merge: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_merge,
        repeat_with_commas($.merge_argument),
      ),
    keyword_merge: (_) => /[mM]([eE][rR][gG][eE])?/,
    // Technically ^$GLOBAL() can be the source
    merge_argument: ($) => seq(
      field('lhs', choice($.glvn, $.indirection)),
      field('operator', '='),
      field('rhs', choice($.glvn, $.indirection)),
    ),

    command_return: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, $.keyword_return),
          build_command_rule_argumentful(
            $,
            $.keyword_return,
            repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
          ),
        ),
      ),
    keyword_return: (_) => /[rR][eE][tT]([uU][rR][nN])?/,
    command_quit: ($) =>choice(
        build_command_rule_special_argumentless($,$.keyword_quit),

        build_command_rule_argumentful(
            $,
            $.keyword_quit,
            repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
        ),
    ),

    keyword_quit: (_) => /[Qq]([uU][iI][tT])?/,

    command_goto: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, $.keyword_goto),
          build_command_rule_argumentful(
            $,
            $.keyword_goto,
            repeat_with_commas($.goto_argument),
          ),
        ),
      ),
    keyword_goto: (_) => /[Gg]([oO][tT][oO])?/,

    goto_argument: ($) => seq(
      $.line_ref,
      optional($.post_conditional),
    ),

    command_halt_or_hang: ($) =>
      // hang or h is argumentless
      choice(
        seq(
          field('command_name', choice('h', 'H')),
          // halt case
          optional($.post_conditional),
          choice($._argumentless_command_end,$._termination)
        ),
        seq(
          field('command_name', choice('h', 'H')),
          // hang case
          optional($.post_conditional),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          field('hang_argument',repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)))
        ),
        seq(
          field('command_name', $.keyword_halt),
          // halt case
          optional($.post_conditional),
          choice($._argumentless_command_end,$._termination)

        ),
        seq(
          field('command_name', $.keyword_hang),
          optional($.post_conditional),
          field('hang',$._immediate_single_whitespace_followed_by_non_whitespace),
          repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression))
        ),
      )
      ,

    keyword_halt: (_) => /Halt/i,
    keyword_hang: (_) => /Hang/i,

    command_continue: ($) =>
        // this one is special, becuase if there is anything after the
        // continue but on the same line, that stuff doesn't actually ever get executed
        // i am enclosing any commands written on the same line as the continue WITHIN
        // the continue, as they will never be executed
      build_command_rule_special_argumentless($,$.keyword_continue),
      //build_command_rule_argumentless($, $.keyword_continue),
    keyword_continue: (_) => /Continue/i,

    command_tcommit: ($) =>
      build_command_rule_argumentless($, $.keyword_tcommit),
    keyword_tcommit: (_) => /TC(OMMIT)?/i,

    command_trollback: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_trollback),
        build_command_rule_argumentful($, $.keyword_trollback, '1'),
      ),
    keyword_trollback: (_) => /TRO(LLBACK)?/i,

    command_tstart: ($) => build_command_rule_argumentless($, $.keyword_tstart),
    keyword_tstart: (_) => /TS(TART)?/i,

    byref_arg: ($) =>
      seq(
        '.',
        $.lvn,
      ),

    xecute_argument: ($) =>
      choice(
        // Simple form: XECUTE cmdline[:pc]
        seq(
          optional($._xecute_arg_invalid),
          $.expression,
          optional($.post_conditional),
        ),

        // Parameter-passing form: XECUTE ("cmdline", params... )[:pc]
        seq(
          '(',
            optional($._xecute_arg_invalid),
          $.expression,
          repeat(
            seq(
              ',',
                optional($._xecute_arg_invalid),
              choice($.byref_arg,$.expression),
            ),
          ),
          ')',
          optional($.post_conditional),
        ),
      ),
    command_xecute: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_xecute,
        repeat_with_commas($.xecute_argument),
      )
    ,
    keyword_xecute: (_) => /X(ECUTE)?/i,

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cview
    command_view: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_view,
        alias($.view_parameter, $.view_parameters),
      ),
    keyword_view: (_) => /V(IEW)?/i,
    view_parameter: ($) =>
      choice(
        field('block', seq(optional($._xecute_arg_invalid),$.expression)),
        seq(
            optional($._xecute_arg_invalid),
          field('offset', $.expression),
          ':',
            optional($._xecute_arg_invalid),
          field('mode', $.expression),
          ':',
            optional($._xecute_arg_invalid),
          field('length', $.expression),
          ':',
            optional($._xecute_arg_invalid),
          field('newvalue', $.expression),
        ),
      ),

    command_zbreak: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_zbreak),
        seq(
          field('command_name', $.keyword_zbreak),
          optional($.post_conditional),
          $.zbreak_arguments,
        )
      ),
    keyword_zbreak: (_) => /ZB(REAK)?/i,
    zbreak_execute_command: ($) => $.string_literal,
    zbreak_arg: ($) =>
      seq(
        $.zbreak_location,
        optional(
          choice(
            seq(
            token.immediate(':'),
            field('zbreak_action',$.string_literal),
            token.immediate(':'),
            $.zbreak_condition,
            token.immediate(':'),
            $.zbreak_execute_command,
            ),
            seq(
              token.immediate(':'),token.immediate(':'),
              $.zbreak_condition,
              token.immediate(':'),
              $.zbreak_execute_command,
            ),
            seq(
              token.immediate(':'),token.immediate(':'),
              $.zbreak_condition,
            ),
            seq(
              token.immediate(':'),token.immediate(':'), token.immediate(':'),
              $.zbreak_execute_command,
            ),
            seq(
              token.immediate(':'),
              field('zbreak_action',$.string_literal),
              token.immediate(':'),token.immediate(':'),
              $.zbreak_execute_command,
            ),
            seq(
              token.immediate(':'),
              field('zbreak_action',$.string_literal),
              token.immediate(':'),
              $.zbreak_condition,
            ),
            seq(
              token.immediate(':'),
              field('zbreak_action',$.string_literal),
            )
          )
        ),

      ),
    zbreak_location: ($) =>
      seq(
        optional(choice('+', '-', '--')),
        choice(
          // code line location?,
          $.line_ref,
          // local var *var
          seq('*', $.objectscript_identifier),
          // single step breakpoint
          '$'
        ),
        optional('#delay'),
      ),


    zbreak_condition: ($) =>
        seq('"', optional($._xecute_arg_invalid), $.expression, '"'),

    zbreak_arguments: ($) =>
      choice(
        seq(
          $._immediate_single_whitespace_followed_by_non_whitespace,
          choice(
            '+',
            '-',
            $.zbreak_arg
          ),
          $._termination
        ),
        seq(
          $.zbreak_command,
          token.immediate('/'),
          choice(
            $.keyword_clear,
            seq(
              $.keyword_debug,
              optional(
                seq(
                  token.immediate(':'),
                  $.device,
                )
              )
            ),
            seq(
              $.keyword_errortrap,
              token.immediate(':'),
              choice(
              $.keyword_on,
              $.keyword_off
              )
            ),
            seq(
              $.keyword_trace,
              optional(
                seq(
                  token.immediate(':'),
                  choice(
                  $.keyword_on,
                  $.keyword_off,
                  $.keyword_all
                  ),
                  optional(
                    seq(
                      token.immediate(':'),
                      $.device
                    )
                  )
                )
              )
            ),
            seq(
              choice(
                $.keyword_step,
                $.keyword_nostep
              ),
              repeat1(
                seq(
                  token.immediate(':'),
                  choice(
                    $.keyword_ext,
                    $.keyword_destruct,
                    $.keyword_stepmethod,
                  )
                )
              )
            ),
            seq(
              $.keyword_interrupt,
              optional(
                seq(
                  token.immediate(':'),
                  choice(
                    $.keyword_break,
                    $.keyword_normal,
                  )
                )
              )
            )
          )
        ),
      ),
     device: ($) =>
      seq(
          optional($._xecute_arg_invalid),
        $.expression,
        optional(
              repeat(
              seq(
                token.immediate('/'),
                  optional($._xecute_arg_invalid),
                $.expression,
              )
            ),
        )
      ),
    keyword_normal: (_) => /N(ormal)?/i,
    keyword_ext: (_) => /EXT/i,
    keyword_destruct: (_) => /DESTRUCT/i,
    keyword_stepmethod: (_) => /METHOD/i,

    keyword_interrupt: (_) => /I(nterrupt)?/i,

    keyword_on: (_) => /ON/i,
    keyword_off: (_) => /OFF/i,
    keyword_all: (_) => /All/i,
    // one :
    keyword_debug: (_) => /D(ebug)?/i,
    keyword_errortrap: (_) => /ErrorTrap/i,
    // two :
    keyword_trace: (_) => /T(race)?/i,
    keyword_step: (_) => /Step/i,
    keyword_nostep: (_) => /NoStep/i,
    // 0 :
    keyword_clear: (_) => /C(lear)?/i,
    command_zkill: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_zkill,
        repeat_with_commas(choice($.glvn, $.indirection)),
      ),
    keyword_zkill: (_) => /ZK(ILL)?/i,

    command_zn: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_zn,
        repeat_with_commas(seq(optional($._xecute_arg_invalid), $.expression)),
      ),
    keyword_zn: (_) => /ZN(SPACE)?/i,

    command_zsu: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_zsu),
        build_command_rule_argumentful(
          $,
          $.keyword_zsu,
          repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
        ),
      ),
    keyword_zsu: (_) => /ZSU/i,

    command_ztrap: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_ztrap),
        build_command_rule_argumentful(
          $,
          $.keyword_ztrap,
          repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
        ),
      ),
    keyword_ztrap: (_) => /ZT(RAP)?/i,
    command_zwrite: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_zwrite),
        seq(
          field('command_name', $.keyword_zwrite),
          optional($.post_conditional),
          choice($._immediate_single_whitespace_followed_by_non_whitespace,$._zw_block),
          repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression))
        )
      ),
    keyword_zwrite: (_) => /ZW(RITE)?/i,

    command_zz: ($) =>
      seq(
          field('command_name', $.keyword_zz),
          optional($.post_conditional),
          choice($._immediate_single_whitespace_followed_by_non_whitespace,$._zw_block),
          repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression))
        ),
    keyword_zz: (_) => /ZZ[A-Z0-9]+/i,

    embedded_html: ($) =>
      choice(
        seq(
        field('command_name', $.keyword_embedded_html),
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
        seq(
        field('command_name', $.keyword_embedded_html),
        $.html_marker,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
        $.html_marker_reversed,
      ),
    ),

    keyword_embedded_html: (_) => /&html/i,

    embedded_xml: ($) =>
      seq(
        field('command_name', $.keyword_embedded_xml),
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
    keyword_embedded_xml: (_) => /&xml/i,

    embedded_sql: ($) => choice($.embedded_sql_amp, $.embedded_sql_hash),
    embedded_sql_amp: ($) =>
      choice(
        seq(
        field('command_name', $.keyword_embedded_sql_amp),
        $.embedded_sql_marker,
        token.immediate('('),
        $.paren_fenced_text,
        token.immediate(')'),
        $.embedded_sql_reverse_marker,
      ),
      seq(
        field('command_name', $.keyword_embedded_sql_amp),
        token.immediate('('),
        $.paren_fenced_text,
        token.immediate(')'),
      ),
      ),

    // NOTE: We put the marker within the &sql keyword def to make it easier to query for highlighting
    embedded_sql_hash: ($) =>
      seq(
        field('command_name', $.keyword_embedded_sql_hash),
        token.immediate('('),
        $.paren_fenced_text,
        ')',
      ),
    keyword_embedded_sql_amp: (_) => /&sql/i,
    keyword_embedded_sql_hash: (_) => /##sql/i,

    embedded_js: ($) =>
      choice(
        seq(
        choice(field('command_name','&js'), field('command_name','&jscript'), field('command_name', '&javascript')),
        $.html_marker,
        token.immediate('<'),
        $.embedded_js_special_case,
        '>',
        $.embedded_js_special_case_complete
        ),
        seq(
        choice(field('command_name','&js'), field('command_name','&jscript'), field('command_name', '&javascript')),
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
        ),
      ),


    // Simple parameterized tag/label: tagname(params) - no modifiers, no body
    // Example: bar(a,b=2)
    tag_with_params: ($) =>
      seq(
        $.tag,
        $.parameter_list,
      ),

    procedure_pub_vars: ($) =>
      seq(
        '[',
        optional(
          repeat_with_commas($.objectscript_identifier),
        ),
        ']',
      ),

    // Full procedure definitions: tagname(params) [public_vars] access_modifier { body }
    procedure: ($) =>
      seq(
        $.tag_with_params,
        // Optional public variables list [var1, var2, ...]
        optional($.procedure_pub_vars),
        optional(
          choice(
            $.keyword_public,
            $.keyword_private,
            $.keyword_methodimpl,
          ),
        ),
        // Code block { statements }, separated by whitespace
        '{',
        repeat($.statement),
        '}',
      ),

    keyword_private: (_) => /private/i,
    keyword_public: (_) => /public/i,
    keyword_methodimpl: (_) => /methodimpl/i,

    // Shared parameter list rule for both tag_with_params and procedure
    parameter_list: ($) =>
      seq(
        token.immediate('('),
        optional(
          seq(
            $.tag_parameter,
            repeat(seq(',', $.tag_parameter)),
          ),
        ),
        token.immediate(')'),
      ),

    // A tag parameter can be just a name or a name with a default value
    tag_parameter: ($) =>
      seq(
        field('parameter', $.objectscript_identifier),
        optional(seq('=', optional($._xecute_arg_invalid), $.expression)),
      ),

    post_conditional: ($) =>
      seq($._post_conditional_id, token.immediate(':'), alias($.expression_post_cond, $.expression)),
    ...post_conditional_rules,
  },
});
