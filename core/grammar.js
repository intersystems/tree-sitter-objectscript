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
  return seq(
    commandKeyword,
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
          commandKeyword,
          optional($.post_conditional),
          $._argumentless_command_end,
          repeat($.statement),
          $._termination,
      ),
      seq(commandKeyword, optional($.post_conditional), $._termination)
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @return {RuleOrLiteral}
 */
function build_command_rule_argumentless($, commandKeyword) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    choice(
        $._argumentless_command_end,
        $._termination,
    )

  );
}

const post_conditional_rules = generate_post_conditionals(
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
    $._whitespace,
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
    ]),

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

    [$.oref_method_post_cond, $.oref_property_post_cond],
    [$.oref_chain_expr_post_cond, $.expr_atom_post_cond],
    [$.class_method_call_post_cond,$.oref_method_post_cond],
    ...previous,
  ],
  inline: ($, previous) => [$.set_target, ...previous],

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

    keyword_set: (_) => /[sS]([eE][tT])?/,
    keyword_as: (_) => /As/i,
      keyword_of: (_) => /Of/i,
    keyword_dim: (_) => /\#[dD][iI][mM]/,
    keyword_pound_define: (_) => /\#define/i,
    keyword_pound_def1arg: (_) => /\#def1arg/i,
    keyword_pound_execute: (_) => /\#execute/i,
    keyword_pound_import: (_) => /\#import/i,
    keyword_pound_include: (_) => /\#include/i,
    keyword_pound_if: (_) => /\#if/i,
    keyword_pound_endif: (_) => /\#endif/i,
    keyword_pound_elseif: (_) => /\#elseif/i,
    keyword_pound_ifdef: (_) => /#ifdef/i,
    keyword_pound_else: (_) => /#else/i,
    keyword_pound_ifndef: (_) => choice(/\#ifndef/i,/\#ifundef/i),
    keyword_write: (_) => /[wW]([rR][iI][tT][eE])?/,
    keyword_do: (_) => /[dD]([oO])?/,
    keyword_for: (_) => /[fF]([oO][rR])?/,
    keyword_while: (_) => /[wW][hH][iI][lL][eE]/,
    keyword_kill: (_) => /[kK]([iI][lL][lL])?/,
    keyword_lock: (_) => /[lL]([oO][cC][kK])?/,
    keyword_read: (_) => /[Rr]([eE][aA][dD])?/,
    keyword_open: (_) => /O(pen)?/i,
    keyword_close: (_) => /Close/i,
    keyword_use: (_) => /U(se)?/i,
    keyword_new: (_) => /[nN]([eE][wW])?/,
    keyword_if: (_) => /I(f)?/i,
    keyword_elseif: (_) => /ElseIf/i,
    keyword_else: (_) => /Else/i,     // NOTE: New style Else must be spelled out
    keyword_oldelse: (_) => /E(lse)?/i,
    keyword_throw: (_) => /Throw/i,
    keyword_try: (_) => /[tT][rR][yY]/,
    keyword_catch: (_) => /[cC][aA][tT][cC][hH]/,
    // JOB command syntax examples:
    // routine(routine-params):(process-params):timeout
    // routine(routine-params)[joblocation]:(process-params):timeout
    // routine(routine-params)|joblocation|:(process-params):timeout
    // ##class(className).methodName(args):(process-params):timeout
    // ..methodName(args):(process-params):timeout
    keyword_job: (_) => /[jJ]([oO][bB])?/,
    keyword_break: (_) => /B(REAK)?/i,
    keyword_merge: (_) => /[mM]([eE][rR][gG][eE])?/,
    // Technically ^$GLOBAL() can be the source
    keyword_return: (_) => /[rR][eE][tT]([uU][rR][nN])?/,
    keyword_quit: (_) => /[Qq]([uU][iI][tT])?/,
    keyword_goto: (_) => /[Gg]([oO][tT][oO])?/,
    keyword_halt: (_) => /Halt/i,
    keyword_hang: (_) => /Hang/i,
      keyword_halt_or_hang: (_) => /h/i,
    keyword_continue: (_) => /Continue/i,
    keyword_tcommit: (_) => /TC(OMMIT)?/i,
    keyword_trollback: (_) => /TRO(LLBACK)?/i,
    keyword_tstart: (_) => /TS(TART)?/i,
    keyword_xecute: (_) => /X(ECUTE)?/i,
    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cview
    keyword_view: (_) => /V(IEW)?/i,
    keyword_zbreak: (_) => /ZB(REAK)?/i,
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
    keyword_zkill: (_) => /ZK(ILL)?/i,
    keyword_zn: (_) => /ZN(SPACE)?/i,
    keyword_zsu: (_) => /ZSU/i,
    keyword_ztrap: (_) => /ZT(RAP)?/i,
    keyword_zwrite: (_) => /ZW(RITE)?/i,
    keyword_zz: (_) => /ZZ[A-Z0-9]+/i,
    keyword_embedded_html: (_) => /&html/i,
    keyword_embedded_xml: (_) => /&xml/i,
    keyword_embedded_sql_amp: (_) => /&sql/i,
    keyword_embedded_sql_hash: (_) => /##sql/i,
      keyword_js: (_) => choice('&js','&jscript','&javascript'),
    keyword_private: (_) => /private/i,
    keyword_public: (_) => /public/i,
    keyword_methodimpl: (_) => /methodimpl/i,
    // Shared parameter list rule for both tag_with_params and procedure
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
        field('keyword', $.keyword_dim),
        repeat_with_commas(alias($.objectscript_identifier, $.lvn)),
        optional(
          seq(
              field('keyword', $.keyword_as),
            choice(
              $.objectscript_identifier,
              $.oref_set_target,
            ),
            optional(
              seq(
                  field('keyword', $.keyword_of),
                choice(
                  $.objectscript_identifier,
                  $.oref_set_target
                )
              )
            ),
          ),
        ),
        optional(seq('=', $.expression)),
      ),

    pound_define: ($) =>
      seq(
          field('keyword', $.keyword_pound_define),
        prec(10, seq(
          alias($.pound_define_variable_name, $.objectscript_identifier),
          optional($.pound_define_variable_args),
        )),
        choice($.macro_value, $._termination),
      ),
    pound_define_variable_name: (_) =>
      /[A-Za-z0-9]+/,
    pound_define_variable_args: ($) =>
      prec(15, seq(
        alias(token.immediate('('), $.bracket),

        optional(
          seq(
            $.macro_arg,
            repeat(seq(',', $.macro_arg)),
          ),
        ),
        alias(token.immediate(')'), $.bracket),

      )),
    pound_def1arg: ($) =>
      seq(
          field('keyword', $.keyword_pound_def1arg),
        prec(10, seq(
          alias($.pound_define_variable_name, $.objectscript_identifier),
          optional($.pound_def1arg_variable_arg),
        )),
        optional($.macro_value),
      ),
    pound_def1arg_variable_arg: ($) =>
      prec(15, seq(
        alias(token.immediate('('), $.bracket),

        optional($.macro_arg),
        alias(token.immediate(')'), $.bracket),

      )),
    pound_execute: ($) => field('keyword', $.keyword_pound_execute),
    pound_if: ($) =>
      seq(
          field('keyword', $.keyword_pound_if),
        $.expression,
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
          field('keyword', $.keyword_pound_endif),
      ),
    pound_ifdef: ($) =>
      seq(
        field('keyword', $.keyword_pound_ifdef),
        $.expression,
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
          field('keyword', $.keyword_pound_endif),
      ),

    pound_ifndef: ($) =>
      seq(
        field('keyword', $.keyword_pound_ifndef),
        $.expression,
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
          field('keyword', $.keyword_pound_endif),
      ),

    pound_elseif: ($) =>
      prec.right(
        seq(
            field('keyword', $.keyword_pound_elseif),
          $.expression,
          repeat($.statement),
        ),
      ),
    pound_else: ($) =>
      seq(field('keyword', $.keyword_pound_else), $.statements),
    class_name: (_) => /[%A-Za-z0-9][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/,
    pound_import: ($) =>
      seq(
          field('keyword', $.keyword_pound_import),
        repeat_with_commas($.class_name),
      ),

    pound_include: ($) =>
      seq(
          field('keyword', $.keyword_pound_include),
        $.class_name
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
        field('keyword', $.keyword_set),
        repeat_with_commas($.set_argument),
      ),
    set_argument: ($) =>
        choice(
            seq(
                choice($.set_target, $.set_target_list),
                '=',
                optional($._xecute_arg_invalid), $.expression,
            ),
            $.indirection,
        ),

    set_target_list: ($) => seq(alias('(', $.bracket), repeat_with_commas($.set_target), alias(')', $.bracket)),
    set_target: ($) =>
        seq(
            optional($._xecute_arg_invalid),
            choice(
                $.glvn,
                $.instance_variable,
                $.oref_set_target,
                $.system_defined_function,  // For things like, set $LB(a, b) = 3
                $.system_defined_variable,
                $.sql_field_reference,
                $.indirection,
            ),
        ),
    oref_set_target: ($) =>
      choice(
        $.relative_dot_property,
        seq(
          choice(
            $.lvn,
            $.instance_variable,
            $.relative_dot_property,
            $.relative_dot_method,
          ),
          repeat1($.oref_chain_segment),
        ),
      ),

    command_write: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, field('keyword', $.keyword_write)),
          seq(
           field('keyword', $.keyword_write),
          optional($.post_conditional),
          choice($._immediate_single_whitespace_followed_by_non_whitespace,$._zw_block),
          repeat_with_commas($.write_argument)
        )
        ),
      ),
    write_argument: ($) => choice($.write_device_control, $.expression),
    write_device_control: ($) =>
      choice(
        $.write_device_fflf,
        $.write_device_tab,
        $.write_device_char,
        $.write_mnemonic,
        seq($.write_device_fflf, $.write_device_tab),
      ),
    write_device_fflf: (_) => repeat1(choice('!', '#')),
    write_device_tab: ($) => seq('?', $.expression),
    write_device_char: ($) => seq('*', $.expression),

    write_mnemonic: ($) =>
      seq(
        $.mnemonic_name,
        optional($.method_args)
      ),
    mnemonic_name: (_) =>
      seq(
        "/",
        token.immediate(/[%A-Za-z][A-Za-z0-9]*/),
      ),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cdo
    command_do: ($) =>
      choice(
          prec.right(seq(field('keyword', $.keyword_do), repeat1($.dotted_statement))),
        // DO with parameters
        build_command_rule_argumentful(
          $,
          field('keyword', $.keyword_do),
          repeat_with_commas($.do_parameter),
        ),
      ),
    do_parameter: ($) =>
        seq(
            choice(
                $.routine_tag_call,
                $.class_method_call,
                $.instance_method_call,
                $.doable_dollar_functions,
                $.superclass_method_call,
            ),
            optional($.post_conditional)
        ),


    instance_method_call: ($) =>
      choice(
        $.relative_dot_method,
        seq(
            optional($._xecute_arg_invalid),
          choice(
            $.lvn,
            $.instance_variable,
            $.relative_dot_property,
            $.relative_dot_method,
            $.parenthetical_expression,
          ),
          repeat($.oref_chain_segment),
          // Whatever we have here must end in a method
          token.immediate('.'),
          $.oref_method,
        ),
      ),

    routine_tag_call: ($) =>
      seq(
        $.line_ref,
        optional($.method_args),
      ),

    doable_dollar_functions: ($) =>
      choice(
        $.dollar_classmethod,
        $.dollar_method,
        $.dollarsf,
        alias(
          seq(
          choice(
            /\$I(NCREMENT)?/i,
            /\$ZF/i,
            /\$ZU(TIL)?/i
          ),
          alias(token.immediate('('), $.bracket),
          repeat_with_commas($.expression),
          alias(')', $.bracket),
        ),
        $.system_defined_function
        )
      ),


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
            field('keyword', $.keyword_for),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          optional($._termination),
          '{',
          repeat($.statement),
          '}',
        ),
        // Block style FOR without parameters (argumentless)
        seq(
            field('keyword', $.keyword_for),
          $._argumentless_loop,
          '{',
          repeat($.statement),
          '}',
        ),
        // Old style FOR with parameters
        seq(
            field('keyword', $.keyword_for),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          repeat($.statement),
          $._termination,
        ),
        // Old style argumentless FOR
        seq(
            field('keyword', $.keyword_for),
          $._argumentless_command_end,
          repeat($.statement),
          $._termination,
        ),
        seq(
            field('keyword', $.keyword_for),
            $._termination,
        )
      ),

    for_parameter: ($) => prec.right(
        seq(
            optional($._xecute_arg_invalid),
      choice(
        $.glvn,
        $.instance_variable,
        $.indirection,
      ),
      '=',
      repeat_with_commas($.for_parameter_arg),
    )),
    for_parameter_arg: ($) =>
      choice(
        $.expression,
        seq(
          $.expression,
          ':',
          $.expression,
        ),
        seq(
          $.expression,
          ':',
          $.expression,
          ':',
          $.expression,
        ),
      ),

    command_while: ($) =>
      seq(
          field('keyword', $.keyword_while),
        $._immediate_single_whitespace_followed_by_non_whitespace,
        repeat_with_commas($.expression),
        '{',
        repeat($.statement),
        '}',
      ),
    command_kill: ($) =>
      choice(
        build_command_rule_argumentless($, field('keyword', $.keyword_kill)),
        build_command_rule_argumentful(
          $,
          field('keyword', $.keyword_kill),
          repeat_with_commas($.kill_argument),
        ),
      ),

    kill_argument: ($) =>
        choice(
            $.kill_target,
            seq( alias('(', $.bracket), repeat_with_commas($.kill_target), alias(')', $.bracket)
),
        ),

    kill_target: ($) =>
        seq(
            optional($._xecute_arg_invalid),
            choice(
                $.glvn,
                $.instance_variable,
                $.oref_set_target,
            ),
        ),


    command_lock: ($) =>
      choice(
        seq(field('keyword', $.keyword_lock),
            choice($._argumentless_command_end,
                $._termination,
            ),

            ),

        build_command_rule_argumentful(
          $,
          field('keyword', $.keyword_lock),
          repeat_with_commas($.command_lock_argument),
        ),
      ),
    command_lock_argument: ($) =>
      choice(
        $.command_lock_arguments_variant_1,
        $.command_lock_arguments_variant_2,
      ),
    command_lock_arguments_variant_1: ($) =>
        seq(
          optional(choice('+', '-')),
          optional('@'),
            optional($._xecute_arg_invalid),
          $.glvn,
          optional($.locktype),
          optional($.timeout),
        ),
      
    command_lock_arguments_variant_2: ($) =>
      seq(
        optional(choice('+', '-')),
         alias('(', $.bracket),
        repeat_with_commas(
      
            seq(
              optional(choice('+', '-')),
              optional('@'),
                optional($._xecute_arg_invalid),
              $.glvn,
              optional($.locktype),
            ),
        ),
         alias(')', $.bracket),
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
      seq(token.immediate(':'), alias($.expression_post_cond, $.expression)),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cread#RCOS_cread25
    command_read: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_read),
        repeat_with_commas($.read_argument),
      ),
    read_argument: ($) =>
      choice(
        repeat1($.read_fchar),
        $.string_literal,
        $.read_variable,
          $.indirection,
      ),
    read_fchar: (_) => choice('!', '#', '?', '/'),
    read_variable: ($) =>
      seq(
        choice(
          $.glvn,
          seq('*', $._assert_no_space_between_rules, $.glvn),
          seq($.glvn, '#', $.expression),
        ),
        optional(seq(token.immediate(':'), $.expression)),
      ),

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_copen#RCOS_copen25
    // OPEN:pc device:(parameters):timeout:"mnespace",...
    // O:pc device:(parameters):timeout:"mnespace",...
    command_open: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_open),
        repeat_with_commas($.open_argument),
      ),
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
              $.expression
            ),
            seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),
              $.expression
            ),
             seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),
              $.expression,
              token.immediate(':'),
              $.expression
            ),
            seq(
              token.immediate(':'),token.immediate(':'),token.immediate(':'),
              $.expression
            ),
            seq(
              token.immediate(':'),token.immediate(':'),
              $.expression,
              token.immediate(':'),
              $.expression
            ),
            seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),token.immediate(':'),
              $.expression
            ),
          )
        )
      ),


    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cclose
    // eslint-disable-next-line max-len
    command_close: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_close),
        repeat_with_commas($.close_argument),
      ),
    close_parameters: ($) =>
      choice(
        seq(
         alias('(', $.bracket),
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
         alias(')', $.bracket)
        ),
        $.close_parameter_option_value
      ),
    close_argument: ($) =>
      seq($.device, optional(seq(token.immediate(':'),$.close_parameters))),
    // "D", "K", ("R":newname or /REN=newname or /RENAME=newman)
    close_rename: (_) =>
        choice(
        seq('"R"',':'),
        seq(choice('/REN=','/RENAME='))
      ),
    close_parameter_option_value: ($) =>
      choice(
        '"K"',
        '"D"',
        seq($.close_rename, $.device),
        seq($.open_keyword_delete, optional(seq(token.immediate('='), $.expression))),
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
            $.expression
            ),
            seq(
            token.immediate(':'),
            $.use_parameters,
            token.immediate(':'),
            $.expression
            ),
          )
        )
      )
      ,

    use_keywords: ($) => seq('/POSITION=', $.expression),

    use_parameters: ($) =>
      choice(
        seq(
         alias('(', $.bracket),
        optional(
          seq(
            optional(choice($.open_keywords,$.expression,$.use_keywords)),
            repeat(
              seq(
                ':',
                optional(choice($.open_keywords,$.expression,$.use_keywords)),
              )
            )
          )
        ),
         alias(')', $.bracket)
        ),
        choice($.open_keywords,$.expression,$.use_keywords),
      ),



    open_parameters: ($) =>
      choice(
        seq(
         alias('(', $.bracket),
        optional(
          seq(
            optional(choice($.open_keywords,$.expression)),
            repeat(
              seq(
                ':',
                optional(choice($.open_keywords,$.expression)),
              )
            )
          )
        ),
         alias(')', $.bracket),
        ),
        choice($.open_keywords,$.expression),
      ),

    command_use: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_use),
        repeat_with_commas($.use_argument),
      ),
    command_dowhile: ($) =>
      seq(
        field('keyword', $.keyword_do),
        $._argumentless_loop,
        '{',
        repeat($.statement),
        '}',
        field('keyword', $.keyword_while),
        $.expression,
      ),

    command_new: ($) =>
      choice(
        build_command_rule_argumentless($, field('keyword', $.keyword_new)),
        build_command_rule_argumentful(
          $,
          field('keyword', $.keyword_new),
          repeat_with_commas($.command_new_argument),
        ),
      ),
    command_new_argument: ($) =>
      choice($.command_new_item, seq( alias('(', $.bracket), repeat_with_commas($.command_new_item),  alias(')', $.bracket))),
    command_new_item: ($) =>
      choice(
        $.lvn,
        alias($.estack_token, $.system_defined_variable),
        alias($.etrap_token, $.system_defined_variable),
        alias($.namespace_token, $.system_defined_variable),
       alias($.roles_token,  $.system_defined_variable),
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
              field('keyword', $.keyword_if),
              $._immediate_single_whitespace_followed_by_non_whitespace,
              repeat_with_commas($.expression),
              optional($._termination),
              '{',
              repeat($.statement),
              '}',
              repeat($.elseif_block),
              optional($.else_block),
          ),
          seq(
              field('keyword', $.keyword_if),
              $._argumentless_loop,
              '{',
              repeat($.statement),
              '}',
              repeat($.elseif_block),
              optional($.else_block),
          ),
          seq(
              field('keyword', $.keyword_if),
              $._argumentless_command_end,
              repeat1($.statement),
              $._termination,
          ),
          seq(
              field('keyword', $.keyword_if),
              $._termination,
          ),
          seq(
              field('keyword', $.keyword_if),
              $._immediate_single_whitespace_followed_by_non_whitespace,
              repeat_with_commas($.expression),
              repeat($.statement),
              $._termination,
          )
      ),
    command_else: ($) =>
        choice(
            seq(
                field('keyword', $.keyword_oldelse),
                $._argumentless_command_end,
                repeat($.statement),
                $._termination,
            ),
            seq (
                field('keyword', $.keyword_oldelse),
                $._termination,
            )
        ),

    elseif_block: ($) =>
      seq(
          field('keyword', $.keyword_elseif),
        $._immediate_single_whitespace_followed_by_non_whitespace,
        repeat_with_commas($.expression),
        '{',
        repeat($.statement),
        '}',
      ),
    else_block: ($) =>
      seq(
          field('keyword', $.keyword_else),
        '{',
        repeat($.statement),
        '}',
      ),

    command_throw: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, field('keyword', $.keyword_throw)),
          build_command_rule_argumentful(
            $,
            field('keyword', $.keyword_throw),
            $.expression,
          ),
        ),
      ),
    command_trycatch: ($) =>
      seq(
          field('keyword', $.keyword_try),
            '{',
            repeat($.statement),
            '}',
          $.catch_block,
      ),

    catch_block: ($) =>
      seq(
        field('keyword', $.keyword_catch),
        optional(choice(seq( alias('(', $.bracket), optional($._xecute_arg_invalid), $.glvn,  alias(')', $.bracket)), seq(optional($._xecute_arg_invalid), $.glvn))),
        '{',
        repeat($.statement),
        '}',
      ),

    command_job: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_job),
        repeat_with_commas($.job_argument),
      ),
    job_argument: ($) =>
      seq(
          optional($._xecute_arg_invalid),
        choice(
          seq(
            $.routine_tag_call,
            optional(
              // jobLocation
              seq(
                choice(token.immediate('['), token.immediate('|')),
                $.expression,
                choice(token.immediate(']'), token.immediate('|')),
              ),
            ),
          ),
          $.class_method_call,
          $.relative_dot_method,
          alias($.dollar_classmethod, $.system_defined_function),
        ),
        optional(
          seq(
            token.immediate(':'),
            optional(
              // process-params
              seq(
                 alias('(', $.bracket),
                optional($.expression),
                repeat(
                  seq(
                    token.immediate(':'),
                    optional($.expression),
                  ),
                ),
                 alias(')', $.bracket),
              ),
            ),
            optional($.timeout),
          ),
        ),
      ),

    // eslint-disable-next-line max-len
    command_break: ($) =>
      choice(
          seq(
              field('keyword', $.keyword_break),
              optional($.post_conditional),
              choice(
                  $._argumentless_command_end,
                  $._termination,
              )
          ),
          seq(
              field('keyword', $.keyword_break),
              optional($.post_conditional),
              $._immediate_single_whitespace_followed_by_non_whitespace,
              repeat_with_commas($.break_argument),
          ),
      ),
    break_argument: ($) =>
      choice( $.string_literal, alias(/[0145]/, $.numeric_literal),),
    command_merge: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_merge),
        repeat_with_commas($.merge_argument),
      ),
    merge_argument: ($) => seq(
      optional($._xecute_arg_invalid),
      $.glvn,
      '=',
      optional($._xecute_arg_invalid),
      $.glvn,
    ),

    command_return: ($) =>
        prec.right(
            choice(
                seq(
                    field('keyword', $.keyword_return),
                    optional($.post_conditional),
                    choice(
                        $._argumentless_command_end,
                        $._termination,
                    )
                ),
                seq(
                    field('keyword', $.keyword_return),
                    optional($.post_conditional),
                    $._immediate_single_whitespace_followed_by_non_whitespace,
                    repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
                ),
            )
        ),

    command_quit: ($) =>choice(
        build_command_rule_special_argumentless($,field('keyword', $.keyword_quit)),

        build_command_rule_argumentful(
            $,
            field('keyword', $.keyword_quit),
            repeat_with_commas(seq(optional($._xecute_arg_invalid),$.expression)),
        ),
    ),

    command_goto: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, field('keyword', $.keyword_goto)),
          build_command_rule_argumentful(
            $,
            field('keyword', $.keyword_goto),
            repeat_with_commas($.goto_argument),
          ),
        ),
      ),
    goto_argument: ($) => seq(
      $.line_ref,
      optional($.post_conditional),
    ),

    command_halt_or_hang: ($) =>
      choice(
        seq(
            field('keyword', $.keyword_halt_or_hang),
          optional($.post_conditional),
          choice($._argumentless_command_end,$._termination)
        ),
        seq(
            field('keyword', $.keyword_halt_or_hang),
          optional($.post_conditional),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.expression)
        ),
        seq(
            field('keyword', $.keyword_halt),
          optional($.post_conditional),
          choice($._argumentless_command_end,$._termination)

        ),
        seq(
            field('keyword', $.keyword_hang),
          optional($.post_conditional),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.expression)
        ),
      )
      ,

    command_continue: ($) =>
        // Commands on the same line after CONTINUE are unreachable; parse them under CONTINUE.
      build_command_rule_special_argumentless($,field('keyword', $.keyword_continue)),
    command_tcommit: ($) =>
      build_command_rule_argumentless($, field('keyword', $.keyword_tcommit)),
    command_trollback: ($) =>
      choice(
        build_command_rule_argumentless($, field('keyword', $.keyword_trollback)),
        build_command_rule_argumentful($, field('keyword', $.keyword_trollback), alias('1', $.numeric_literal)),
      ),
    command_tstart: ($) => build_command_rule_argumentless($, field('keyword', $.keyword_tstart)),
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
           alias('(', $.bracket),
          $.expression,
          repeat(
            seq(
              ',',
              choice($.byref_arg,$.expression),
            ),
          ),
           alias(')', $.bracket),
          optional($.post_conditional),
        ),
      ),
    command_xecute: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_xecute),
        repeat_with_commas($.xecute_argument),
      )
    ,
    command_view: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_view),
        alias($.view_parameter, $.view_parameters),
      ),
    view_parameter: ($) =>
      choice(
        $.expression,
        seq(
          $.expression,
          ':',
          $.expression,
          ':',
          $.expression,
          ':',
          $.expression,
        ),
      ),

    command_zbreak: ($) =>
      choice(
        build_command_rule_argumentless($, field('keyword', $.keyword_zbreak)),
        seq(
          field('keyword', $.keyword_zbreak),
          optional($.post_conditional),
          $.zbreak_arguments,
        )
      ),
    zbreak_arg: ($) =>
      seq(
        $.zbreak_location,
        optional(
          choice(
            seq(
            token.immediate(':'),
            $.string_literal,
            token.immediate(':'),
            $.zbreak_condition,
            token.immediate(':'),
            $.string_literal,
            ),
            seq(
              token.immediate(':'),token.immediate(':'),
              $.zbreak_condition,
              token.immediate(':'),
              $.string_literal,
            ),
            seq(
              token.immediate(':'),token.immediate(':'),
              $.zbreak_condition,
            ),
            seq(
              token.immediate(':'),token.immediate(':'), token.immediate(':'),
              $.string_literal,
            ),
            seq(
              token.immediate(':'),
              $.string_literal,
              token.immediate(':'),token.immediate(':'),
              $.string_literal,
            ),
            seq(
              token.immediate(':'),
              $.string_literal,
              token.immediate(':'),
              $.zbreak_condition,
            ),
            seq(
              token.immediate(':'),
              $.string_literal,
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
        optional(field('keyword','#delay')),
      ),


    zbreak_condition: ($) =>
        seq('"', $.expression, '"'),

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
            field('keyword', $.keyword_clear),
            seq(
              field('keyword', $.keyword_debug),
              optional(
                seq(
                  token.immediate(':'),
                  $.device,
                )
              )
            ),
            seq(
              field('keyword', $.keyword_errortrap),
              token.immediate(':'),
              choice(
              field('keyword', $.keyword_on),
              field('keyword', $.keyword_off)
              )
            ),
            seq(
              field('keyword', $.keyword_trace),
              optional(
                seq(
                  token.immediate(':'),
                  choice(
                  field('keyword', $.keyword_on),
                  field('keyword', $.keyword_off),
                  field('keyword', $.keyword_all)
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
                field('keyword', $.keyword_step),
                field('keyword', $.keyword_nostep)
              ),
              repeat1(
                seq(
                  token.immediate(':'),
                  choice(
                    field('keyword', $.keyword_ext),
                    field('keyword', $.keyword_destruct),
                    field('keyword', $.keyword_stepmethod),
                  )
                )
              )
            ),
            seq(
              field('keyword', $.keyword_interrupt),
              optional(
                seq(
                  token.immediate(':'),
                  choice(
                    field('keyword', $.keyword_break),
                    field('keyword', $.keyword_normal),
                  )
                )
              )
            )
          )
        ),
      ),
     device: ($) =>
      seq(
        $.expression,
        optional(
              repeat(
              seq(
                token.immediate('/'),
                $.expression,
              )
            ),
        )
      ),
    command_zkill: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_zkill),
        repeat_with_commas($.glvn),
      ),
    command_zn: ($) =>
      build_command_rule_argumentful(
        $,
        field('keyword', $.keyword_zn),
        repeat_with_commas($.expression),
      ),
    command_zsu: ($) =>
      choice(
        build_command_rule_argumentless($, field('keyword', $.keyword_zsu)),
        build_command_rule_argumentful(
          $,
          field('keyword', $.keyword_zsu),
          repeat_with_commas($.expression),
        ),
      ),
    command_ztrap: ($) =>
      choice(
        build_command_rule_argumentless($, field('keyword', $.keyword_ztrap)),
        build_command_rule_argumentful(
          $,
          field('keyword', $.keyword_ztrap),
          repeat_with_commas($.expression),
        ),
      ),
    command_zwrite: ($) =>
      choice(
        build_command_rule_argumentless($, field('keyword', $.keyword_zwrite)),
        seq(
            field('keyword', $.keyword_zwrite),
          optional($.post_conditional),
          choice($._immediate_single_whitespace_followed_by_non_whitespace,$._zw_block),
          repeat_with_commas($.expression)
        )
      ),
    command_zz: ($) =>
      seq(
          field('keyword', $.keyword_zz),
          optional($.post_conditional),
          choice($._immediate_single_whitespace_followed_by_non_whitespace,$._zw_block),
          repeat_with_commas($.expression)
        ),
    embedded_html: ($) =>
      choice(
        seq(
        field('keyword', $.keyword_embedded_html),
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
        seq(
            field('keyword', $.keyword_embedded_html),
        $.html_marker,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
        $.html_marker_reversed,
      ),
    ),

    embedded_xml: ($) =>
      seq(
          field('keyword', $.keyword_embedded_xml),
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
    embedded_sql: ($) => choice($.embedded_sql_amp, $.embedded_sql_hash),
    embedded_sql_amp: ($) =>
      choice(
        seq(
            field('keyword', $.keyword_embedded_sql_amp),
        $.embedded_sql_marker,
        alias(token.immediate('('), $.bracket),

        $.paren_fenced_text,
        alias(token.immediate(')'), $.bracket),

        $.embedded_sql_reverse_marker,
      ),
      seq(
          field('keyword', $.keyword_embedded_sql_amp),
        alias(token.immediate('('), $.bracket),
        $.paren_fenced_text,
        alias(token.immediate(')'), $.bracket),

      ),
      ),

    // NOTE: We put the marker within the &sql keyword def to make it easier to query for highlighting
    embedded_sql_hash: ($) =>
      seq(
          field('keyword', $.keyword_embedded_sql_hash),
          alias(token.immediate('('), $.bracket),

        $.paren_fenced_text,
        alias(')', $.bracket),
      ),
    embedded_js: ($) =>
      choice(
        seq(
        field('keyword', $.keyword_js),
        $.html_marker,
        token.immediate('<'),
        $.embedded_js_special_case,
        '>',
        $.embedded_js_special_case_complete
        ),
        seq(
            field('keyword', $.keyword_js),
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
          repeat_with_commas(alias($.objectscript_identifier, $.attribute)),
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
            field('keyword', $.keyword_public),
            field('keyword', $.keyword_private),
            field('keyword', $.keyword_methodimpl),
          ),
        ),
        // Code block { statements }, separated by whitespace
        '{',
        repeat($.statement),
        '}',
      ),

    parameter_list: ($) =>
      seq(
        alias(token.immediate('('), $.bracket),
        optional(
          seq(
            $.tag_parameter,
            repeat(seq(',', $.tag_parameter)),
          ),
        ),
        alias(token.immediate(')'), $.bracket),

      ),

    // A tag parameter can be just a name or a name with a default value
    tag_parameter: ($) =>
      seq(
        $.objectscript_identifier,
        optional(seq('=', $.expression)),
      ),

    post_conditional: ($) =>
      seq($._post_conditional_id, token.immediate(':'), alias($.expression_post_cond, $.expression)),
    ...post_conditional_rules,
  },
});
