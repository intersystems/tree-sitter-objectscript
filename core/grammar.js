/**
 * Copyright (c) 2023 by InterSystems.
 * Cambridge, Massachusetts, U.S.A.  All rights reserved.
 * Confidential, unpublished property of InterSystems.
 */

/* eslint-disable indent */


/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const objectscript_expr = require('../expr/grammar');

const {
  unspace: generate_post_conditionals,
  repeat_with_commas,
} = require('./utils');
const {
  STATEMENT_RULE_NAMES,
  OBJECTSCRIPT_BUILT_IN_COMMAND_PATTERNS,
  PRINTLIST_COMMAND_PATTERNS,
} = require('./command_metadata');

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
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
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentful_block_allowed($, commandKeyword, commandArgument) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    choice($._immediate_single_whitespace_followed_by_non_whitespace, $._zw_block),
    commandArgument,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentless($, commandKeyword) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    choice(
        $._argumentless_command_end,
        $._termination,
    ),

  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentless_or_argumentful($, commandKeyword, commandArgument) {
  return choice(
    build_command_rule_argumentless($, commandKeyword),
    build_command_rule_argumentful($, commandKeyword, commandArgument),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentless_or_argumentful_block_allowed($, commandKeyword, commandArgument) {
  return choice(
    build_command_rule_argumentless($, commandKeyword),
    build_command_rule_argumentful_block_allowed($, commandKeyword, commandArgument),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {string[]} ruleNames
 * @returns {RuleOrLiteral[]}
 */
function rule_refs($, ruleNames) {
  return ruleNames.map((ruleName) => $[ruleName]);
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RegExp[]} commandPatterns
 * @returns {RuleOrLiteral}
 */
function command_keyword_alias($, commandPatterns) {
  return alias(token(choice(...commandPatterns)), $.command_keyword);
}

/**
 * @param {GrammarSymbols<string>} $
 * @returns {RuleOrLiteral}
 */
function xecute_expression_list($) {
  return repeat_with_commas(seq(optional($._xecute_arg_invalid), $.expression));
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
    $._zbreak_device_termination,
    $._post_conditional_id,
    $._xecute_arg_invalid,
    $._zw_block,
    $.html_marker,
    $.html_marker_reversed,
    $.embedded_js_special_case,
    $.embedded_js_special_case_complete,
    $.pound_if_special_case,
    $.pound_if_special_case_else,
    $.pound_if_special_case_else_if,
    $.mnemonic,
    $.tag_end_if,
  ],
  conflicts: ($, previous) =>
    previous.concat([
      [$.xecute_argument, $.parenthetical_expression],
      [$.line_ref, $.line_ref],
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
    [$.class_method_call_post_cond, $.oref_method_post_cond],
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
      choice(...rule_refs($, STATEMENT_RULE_NAMES)),

    keyword_set: (_) => /[sS]([eE][tT])?/,
    keyword_as: (_) => /As/i,
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
    keyword_pound_ifndef: (_) => choice(/\#ifndef/i, /\#ifundef/i),
    keyword_write: (_) => /[wW]([rR][iI][tT][eE])?/,
    keyword_do: (_) => /[dD]([oO])?/,
    keyword_for: (_) => /[fF]([oO][rR])?/,
    keyword_while: (_) => /[wW][hH][iI][lL][eE]/,
    keyword_kill: (_) => /[kK]([iI][lL][lL])?/,
    keyword_lock: (_) => /[lL]([oO][cC][kK])?/,
    keyword_read: (_) => /[Rr]([eE][aA][dD])?/,
    keyword_zload: (_) => /zl(oad)?/i,
    keyword_open: (_) => /O(pen)?/i,
    keyword_close: (_) => /C(lose)?/i,
    keyword_use: (_) => /U(se)?/i,
    keyword_new: (_) => /[nN]([eE][wW])?/,
    keyword_if: (_) => /I(f)?/i,
    keyword_elseif: (_) => /ElseIf/i,
    keyword_else: (_) => /Else/i, // NOTE: New style Else must be spelled out
    keyword_oldelse: (_) => /E(lse)?/i,
    keyword_throw: (_) => /Throw/i,
    keyword_print: (_) => /p(rint)?/i,
    keyword_zprint: (_) => /zp(rint)?/i,
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
    keyword_quit: (_) => choice(/q(uit)?/i, /zq(uit)?/i),
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
      keyword_js: (_) => choice('&js', '&jscript', '&javascript'),
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
      variable_datatype: ($) =>
        seq(
          choice(
                  $.objectscript_identifier,
                  $.objectscript_identifier_special,
                  $.instance_variable,
                  $.macro,
                ),
                repeat(seq(token.immediate('.'), choice($.identifier_segment_immediate_special, $.identifier_segment_immediate))),
        ),
      keyword_of: (_) => /Of/i,
      pound_dim: ($) =>
        seq(
          $.keyword_dim,
          repeat_with_commas(choice($.objectscript_identifier, $.objectscript_identifier_special)),
          optional(
            seq(
              $.keyword_as,
              $.variable_datatype,
              optional(
                seq(
                  $.keyword_of,
                  $.variable_datatype,
                ),
              ),
            ),
          ),
          optional(seq('=', $.expression)),
        ),

    pound_define: ($) =>
      seq(
          $.keyword_pound_define,
        prec(10, seq(
          alias(choice($.objectscript_identifier, $.objectscript_identifier_special), $.macro_def),
          optional($.pound_define_variable_args),
        )),
        choice($.macro_value, $._termination),
      ),
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
          $.keyword_pound_def1arg,
        prec(10, seq(
          alias(choice($.objectscript_identifier, $.objectscript_identifier_special), $.macro_def),
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
    pound_execute: ($) => $.keyword_pound_execute,
    pound_if: ($) =>
      seq(
          $.keyword_pound_if,
          choice(
            seq(
              $.expression,
              repeat(choice($.statement, $.pound_elseif)),
              optional($.pound_else),
              $.keyword_pound_endif,
            ),
            seq(
              $.pound_if_special_case,
              $.keyword_pound_endif,
            ),
            seq(
              $.pound_if_special_case_else,
              choice(
                $.keyword_pound_else,
                seq(
                  $.keyword_pound_elseif,
                  alias('1', $.numeric_literal),
                ),
              ),
            ),
            seq(
              $.pound_if_special_case_else_if,
              $.keyword_pound_elseif,
              $.expression,
              repeat(choice($.statement, $.pound_elseif)),
              optional($.pound_else),
              $.keyword_pound_endif,
            ),
        ),
      ),
    pound_ifdef: ($) =>
      seq(
        $.keyword_pound_ifdef,
        $.expression,
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
          $.keyword_pound_endif,
      ),

    pound_ifndef: ($) =>
      seq(
        $.keyword_pound_ifndef,
        $.expression,
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
          $.keyword_pound_endif,
      ),

    pound_elseif: ($) =>
      prec.right(
        seq(
            $.keyword_pound_elseif,
          $.expression,
          repeat($.statement),
        ),
      ),
    pound_else: ($) =>
      seq($.keyword_pound_else, $.statements),
    class_name: (_) => /[%A-Za-z0-9][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/,
    pound_import: ($) =>
      seq(
          $.keyword_pound_import,
        repeat_with_commas($.class_name),
      ),

    pound_include: ($) =>
      seq(
          $.keyword_pound_include,
        $.class_name,
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
                $.system_defined_function, // For things like, set $LB(a, b) = 3
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
            $.system_defined_function,
            $.macro,
          ),
          repeat1($.oref_chain_segment),
        ),
      ),

    command_write: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_write,
          repeat_with_commas($.write_argument),
        ),
      ),
    write_argument: ($) => choice($.write_device_control, $.expression),
    write_device_control: ($) =>
      choice(
        $.write_device_fflf,
        $.write_device_tab,
        $.write_device_char,
        seq(optional($.mnemonic), $.write_mnemonic),
        seq($.write_device_fflf, $.write_device_tab),
      ),
    write_device_fflf: (_) => repeat1(choice('!', '#')),
    write_device_tab: ($) => seq('?', $.expression),
    write_device_char: ($) => seq('*', $.expression),

    write_mnemonic: ($) =>
      seq(
        $.mnemonic_name,
        optional($.method_args),
      ),
    mnemonic_name: (_) =>
      seq(
        '/',
        token.immediate(/[%A-Za-z][A-Za-z0-9]*/),
      ),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cdo
    command_do: ($) =>
      choice(
        prec.right(seq($.keyword_do, optional($.post_conditional), repeat1($.dotted_statement))),
        prec.right(
          seq($.keyword_do,
          optional($.post_conditional),
          $._argumentless_command_end,
          repeat1(alias($.statement, $.do_statement_after)),
          repeat($.dotted_statement),
          ),
        ),
        // DO with parameters
        build_command_rule_argumentful(
          $,
          $.keyword_do,
          repeat_with_commas($.do_parameter),
        ),
      ),

    do_parameter: ($) =>
        seq(
            choice(
                $.routine_tag_call,
                $.class_method_call,
                $.instance_method_call,
                $.system_defined_function,
                $.superclass_method_call,
            ),
            optional($.post_conditional),
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
            $.macro,
            $.extrinsic_function,
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
    keyword_zremove: (_) => /zr(emove)?/i,

    print_statement: ($) => {
      const print_keyword = choice(
        $.keyword_print,
        $.keyword_zprint,
        $.keyword_zremove,
      );
      return build_command_rule_argumentless_or_argumentful(
        $,
        print_keyword,
        $.print_argument,
      );
    },
    print_argument: ($) =>
      choice(
        seq(
          $.line_ref,
        ),
        seq(
          $.line_ref,
          token.immediate(':'),
          $.line_ref,
        ),
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
            $.keyword_for,
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          optional($._termination),
          '{',
          repeat($.statement),
          '}',
        ),
        // Block style FOR without parameters (argumentless)
        seq(
            $.keyword_for,
          choice(
            $._argumentless_loop,
            $._termination,
          ),
          '{',
          repeat($.statement),
          '}',
        ),
        // Old style FOR with parameters
        seq(
            $.keyword_for,
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          repeat($.statement),
          $._termination,
        ),
        // Old style argumentless FOR
        seq(
            $.keyword_for,
          $._argumentless_command_end,
          repeat($.statement),
          $._termination,
        ),
        seq(
            $.keyword_for,
            $._termination,
        ),
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
          $.keyword_while,
        choice(
          seq(
            alias('(', $.bracket),
            repeat_with_commas($.expression),
            alias(')', $.bracket),
          ),
          seq(
            $._immediate_single_whitespace_followed_by_non_whitespace,
            repeat_with_commas($.expression),
          ),
        ),
        '{',
        repeat($.statement),
        '}',
      ),
    command_kill: ($) =>
      build_command_rule_argumentless_or_argumentful(
        $,
        $.keyword_kill,
        repeat_with_commas($.kill_argument),
      ),

    kill_argument: ($) =>
        choice(
            $.kill_target,
            seq( alias('(', $.bracket), repeat_with_commas($.kill_target), alias(')', $.bracket),
),
        ),

    kill_target: ($) =>
        seq(
            optional($._xecute_arg_invalid),
            choice(
                $.glvn,
                $.indirection,
                $.instance_variable,
                $.oref_set_target,
            ),
        ),


    command_lock: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_lock,
        repeat_with_commas($.command_lock_argument),
      ),
    command_lock_argument: ($) =>
      choice(
        $.command_lock_arguments_variant_1,
        $.command_lock_arguments_variant_2,
      ),
    command_lock_arguments_variant_1: ($) =>
        prec.right(seq(
          optional(choice('+', '-')),
            optional($._xecute_arg_invalid),
          choice($.glvn, $.indirection),
          optional($.locktype),
          optional($.timeout),
        )),

    command_lock_arguments_variant_2: ($) =>
      prec.right(seq(
        optional(choice('+', '-')),
         alias('(', $.bracket),
        repeat_with_commas(

            seq(
              optional(choice('+', '-')),
                optional($._xecute_arg_invalid),
              choice($.glvn, $.indirection),
              optional($.locktype),
            ),
        ),
         alias(')', $.bracket),
        optional($.timeout),
      )),
    // Available values are “S” (shared lock), ”E” (escalating lock), “I” (immediate unlock), and “D” (deferred unlock
    // of course lock ^foo#"SSSSSSSSSEEEEEEEEEDDDDDDDD" doesn't make sense, but it's syntactically valid and compiles.
    locktype: ($) =>
      prec.right(choice(
          seq(
        '#',
        alias(token(seq('"',
        /[SEID]+/i,
        '"')), $.string_literal),
      ),
      seq(
        '#',
        alias(/[SEID]+/i, $.lvn),
      ),
      seq(
        '#',
        alias(token(seq('"',
        /[SEID]+/i,
        '"')), $.string_literal),
        '_',
        alias(/[A-Za-z]+/, $.lvn),
      ),
      seq(
        '#',
        alias(/[SEID]+/i, $.lvn),
        '_',
        alias(/[A-Za-z]+/, $.lvn),
      ),
      )),

    timeout: ($) =>
      seq(token.immediate(':'), alias($.expression_post_cond, $.expression)),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cread#RCOS_cread25
    command_read: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_read,
        repeat_with_commas($.read_argument),
      ),
    read_argument: ($) =>
      choice(
        repeat1($.read_fchar),
        $.string_literal,
        $.read_variable,
      ),
    read_fchar: ($) => choice('!', '#', '?', $.numeric_literal),
    read_variable: ($) =>
      seq(
        choice(
          choice($.glvn, $.indirection, $.mnemonic_name),
          seq('*', $._assert_no_space_between_rules, $.glvn),
          seq($.glvn, '#', $.expression),
        ),
        optional(seq(token.immediate(':'), $.expression)),
      ),

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_copen#RCOS_copen25
    // OPEN:pc device:(parameters):timeout:"mnespace",...
    // O:pc device:(parameters):timeout:"mnespace",...
    command_open: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_open,
        repeat_with_commas($.open_argument),
      ),
    open_argument: ($) =>
      seq(
        $.device,
        optional(
          choice(
            seq(
              token.immediate(':'),
              $.open_parameters,
            ),
            seq(
              token.immediate(':'), token.immediate(':'),
              $.expression,
            ),
            seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),
              $.expression,
            ),
             seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'),
              $.expression,
              token.immediate(':'),
              $.expression,
            ),
            seq(
              token.immediate(':'), token.immediate(':'), token.immediate(':'),
              $.expression,
            ),
            seq(
              token.immediate(':'), token.immediate(':'),
              $.expression,
              token.immediate(':'),
              $.expression,
            ),
            seq(
              token.immediate(':'),
              $.open_parameters,
              token.immediate(':'), token.immediate(':'),
              $.expression,
            ),
          ),
        ),
      ),


    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cclose

    command_close: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_close,
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
              ),
            ),
          ),
        ),
         alias(')', $.bracket),
        ),
        $.close_parameter_option_value,
      ),
    close_argument: ($) =>
      seq($.device, optional(seq(token.immediate(':'), $.close_parameters))),
    // "D", "K", ("R":newname or /REN=newname or /RENAME=newman)
    close_rename: ($) =>
        choice(
        seq(alias('"R"', $.string_literal), ':'),
        seq(alias(choice('/REN=', '/RENAME='), $.mnemonic_name)),
      ),
    close_parameter_option_value: ($) =>
      choice(
        alias('"K"', $.string_literal),
        alias('"D"', $.string_literal),
        seq($.close_rename, $.device),
        seq(alias(/del(ete)?/i, $.mnemonic_name), optional(seq(token.immediate('='), $.expression))),
      ),

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
            $.open_parameters,
            ),
            seq(
            token.immediate(':'), token.immediate(':'),
            $.expression,
            ),
            seq(
            token.immediate(':'),
            $.open_parameters,
            token.immediate(':'),
            $.expression,
            ),
          ),
        ),
      ),

    device_keywords: ($) => prec.right(choice(seq(alias(token(seq('/', /[%A-Za-z][A-Za-z0-9]*/, token.immediate('='))), $.mnemonic_name), $.expression), $.expression, $.mnemonic_name)),
    open_parameters: ($) =>
      choice(
        seq(
         alias('(', $.bracket),
        optional(
          seq(
            optional($.device_keywords),
            repeat(
              seq(
                ':',
                optional($.device_keywords),
              ),
            ),
          ),
        ),
         alias(')', $.bracket),
        ),
        $.device_keywords,
      ),

    command_use: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_use,
        repeat_with_commas($.use_argument),
      ),
    command_dowhile: ($) =>
      seq(
        $.keyword_do,
        $._argumentless_loop,
        '{',
        repeat($.statement),
        '}',
        $.keyword_while,
        repeat_with_commas($.expression),
      ),

    command_new: ($) =>
      build_command_rule_argumentless_or_argumentful(
        $,
        $.keyword_new,
        repeat_with_commas($.command_new_argument),
      ),
    command_new_argument: ($) =>
      choice($.command_new_item, seq( alias('(', $.bracket), repeat_with_commas($.command_new_item), alias(')', $.bracket))),
    command_new_item: ($) =>
      choice(
        seq(optional('@'), $.lvn),
        $.macro,
        alias($.estack_token, $.system_defined_variable),
        alias($.etrap_token, $.system_defined_variable),
        alias($.namespace_token, $.system_defined_variable),
       alias($.roles_token, $.system_defined_variable),
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
              $.keyword_if,
              $._immediate_single_whitespace_followed_by_non_whitespace,
              repeat_with_commas($.expression),
              '{',
              repeat($.statement),
              '}',
              repeat($.elseif_block),
              optional($.else_block),
          ),
          seq(
              $.keyword_if,
              $._argumentless_loop,
              '{',
              repeat($.statement),
              '}',
              repeat($.elseif_block),
              optional($.else_block),
          ),
          seq(
              $.keyword_if,
              $._argumentless_command_end,
              repeat1($.statement),
              $._termination,
          ),
          seq(
              $.keyword_if,
              $._termination,
          ),
          seq(
              $.keyword_if,
              $._immediate_single_whitespace_followed_by_non_whitespace,
              repeat_with_commas($.expression),
              repeat($.statement),
              $._termination,
          ),
      ),
    command_else: ($) =>
        choice(
            seq(
                $.keyword_oldelse,
                $._argumentless_command_end,
                repeat($.statement),
                $._termination,
            ),
            seq(
                $.keyword_oldelse,
                $._termination,
            ),
        ),

    elseif_block: ($) =>
      seq(
          $.keyword_elseif,
        repeat_with_commas($.expression),
        '{',
        repeat($.statement),
        '}',
      ),
    else_block: ($) =>
      seq(
          $.keyword_else,
        '{',
        repeat($.statement),
        '}',
      ),

    command_throw: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_throw,
          $.expression,
        ),
      ),
    command_trycatch: ($) =>
      seq(
          $.keyword_try,
            '{',
            repeat($.statement),
            '}',
          $.catch_block,
      ),

    catch_block: ($) =>
      seq(
        $.keyword_catch,
        optional(choice(seq( alias('(', $.bracket), optional($._xecute_arg_invalid), choice($.glvn, $.indirection), alias(')', $.bracket)), seq(optional($._xecute_arg_invalid), choice($.glvn, $.indirection)))),
        '{',
        repeat($.statement),
        '}',
      ),

    command_job: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_job,
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
          alias($.dollar_method, $.system_defined_function),
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

    command_break: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_break,
        repeat_with_commas($.expression),
      ),

    command_merge: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_merge,
        repeat_with_commas($.merge_argument),
      ),
    merge_argument: ($) => seq(
      $.set_target,
      '=',
      $.set_target,
    ),

    command_return: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_return,
          xecute_expression_list($),
        ),
      ),

    command_quit: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_quit,
        xecute_expression_list($),
      ),

    command_goto: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_goto,
          repeat_with_commas(choice($.goto_argument, $.system_defined_function)),
        ),
      ),
    goto_argument: ($) => seq(
      $.line_ref,
      optional($.post_conditional),
    ),


    command_halt_or_hang: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_halt_or_hang),
        build_command_rule_argumentless($, $.keyword_halt),
        build_command_rule_argumentful_block_allowed($, $.keyword_halt_or_hang, repeat_with_commas($.expression)),
        build_command_rule_argumentful_block_allowed($, $.keyword_hang, repeat_with_commas($.expression)),
      ),

    command_continue: ($) =>
      build_command_rule_argumentless($, $.keyword_continue),
    command_tcommit: ($) =>
      build_command_rule_argumentless($, $.keyword_tcommit),
    command_trollback: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_trollback),
        build_command_rule_argumentful($, $.keyword_trollback, alias('1', $.numeric_literal)),
      ),
    command_tstart: ($) => build_command_rule_argumentless($, $.keyword_tstart),
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
              choice($.byref_arg, $.expression),
            ),
          ),
           alias(')', $.bracket),
          optional($.post_conditional),
        ),
      ),
    command_xecute: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_xecute,
        repeat_with_commas($.xecute_argument),
      ),
    command_view: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_view,
        $.view_parameter,
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
        build_command_rule_argumentless($, $.keyword_zbreak),
        seq(
          $.keyword_zbreak,
          optional($.post_conditional),
          $.zbreak_arguments,
        ),
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
              token.immediate(':'), token.immediate(':'),
              $.zbreak_condition,
              token.immediate(':'),
              $.string_literal,
            ),
            seq(
              token.immediate(':'), token.immediate(':'),
              $.zbreak_condition,
            ),
            seq(
              token.immediate(':'), token.immediate(':'), token.immediate(':'),
              $.string_literal,
            ),
            seq(
              token.immediate(':'),
              $.string_literal,
              token.immediate(':'), token.immediate(':'),
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
            ),
          ),
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
          '$',
        ),
        optional(alias('#delay', $.keyword_pound_delay)),
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
            $.zbreak_arg,
          ),
          $._termination,
        ),
        seq(
          $.mnemonic,
          token.immediate('/'),
          choice(
            $.keyword_clear,
            seq(
              $.keyword_debug,
              optional(
                seq(
                  token.immediate(':'),
                  $.device,
                ),
              ),
            ),
            seq(
              $.keyword_errortrap,
              token.immediate(':'),
              choice(
              $.keyword_on,
              $.keyword_off,
              ),
            ),
            seq(
              $.keyword_trace,
              optional(
                seq(
                  token.immediate(':'),
                  choice(
                  $.keyword_on,
                  $.keyword_off,
                  $.keyword_all,
                  ),
                  optional(
                    seq(
                      token.immediate(':'),
                      $.device,
                    ),
                  ),
                ),
              ),
            ),
            seq(
              choice(
                $.keyword_step,
                $.keyword_nostep,
              ),
              repeat1(
                seq(
                  token.immediate(':'),
                  choice(
                    $.keyword_ext,
                    $.keyword_destruct,
                    $.keyword_stepmethod,
                  ),
                ),
              ),
            ),
            seq(
              $.keyword_interrupt,
              optional(
                seq(
                  token.immediate(':'),
                  alias(choice(
                    $.keyword_break,
                    $.keyword_normal,
                  ), $.zbreak_command_option),
                ),
              ),
            ),
          ),
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
              ),
            ),
        ),
      ),
    command_zkill: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_zkill,
        repeat_with_commas(choice($.glvn, $.indirection)),
      ),
    command_zn: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_zn,
        repeat_with_commas($.expression),
      ),
    command_zsu: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_zsu,
        repeat_with_commas($.expression),
      ),
    command_ztrap: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_ztrap,
        repeat_with_commas($.expression),
      ),
    command_zwrite: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_zwrite,
        xecute_expression_list($),
      ),
    command_zz: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_zz,
        xecute_expression_list($),
      ),

    embedded_html: ($) =>
      choice(
        seq(
        $.keyword_embedded_html,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
        seq(
          $.keyword_embedded_html,
        $.html_marker,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
        $.html_marker_reversed,
      ),
    ),

    embedded_xml: ($) =>
      seq(
          $.keyword_embedded_xml,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
    embedded_sql: ($) => choice($.embedded_sql_amp, $.embedded_sql_hash),
    embedded_sql_amp: ($) =>
      choice(
        seq(
            $.keyword_embedded_sql_amp,
        $.embedded_sql_marker,
        alias(token.immediate('('), $.bracket),

        $.paren_fenced_text,
        alias(token.immediate(')'), $.bracket),

        $.embedded_sql_reverse_marker,
      ),
      seq(
          $.keyword_embedded_sql_amp,
        alias(token.immediate('('), $.bracket),
        $.paren_fenced_text,
        alias(token.immediate(')'), $.bracket),

      ),
      ),

    // NOTE: We put the marker within the &sql keyword def to make it easier to query for highlighting
    embedded_sql_hash: ($) =>
      seq(
          $.keyword_embedded_sql_hash,
          alias(token.immediate('('), $.bracket),

        $.paren_fenced_text,
        alias(')', $.bracket),
      ),
    embedded_js: ($) =>
      choice(
        seq(
        $.keyword_js,
        $.html_marker,
        token.immediate('<'),
        $.embedded_js_special_case,
        '>',
        $.embedded_js_special_case_complete,
        ),
        seq(
           $.keyword_js,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
        ),
      ),


    // Simple parameterized tag/label: tagname(params) - no modifiers, no body
    // Example: bar(a,b=2)
    tag_with_params: ($) =>
      prec.right(seq(
        $.tag,
        $.parameter_list,
        optional(choice($.keyword_methodimpl, $.keyword_public, $.keyword_private)),
      )),

    procedure_pub_vars: ($) =>
      seq(
        '[',
        optional(
          repeat_with_commas(choice($.objectscript_identifier, $.objectscript_identifier_special, $.macro)),
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

    objectscript_built_in_command: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        command_keyword_alias($, OBJECTSCRIPT_BUILT_IN_COMMAND_PATTERNS),
        repeat_with_commas($.expression),
      ),

    command_zload: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_zload,
        repeat_with_commas($.expression),
      ),

    // https://docs.intersystems.com/ens201817/csp/docbook/Doc.View.cls?KEY=RCOS_cmvcrt
    commands_with_printlist: ($) =>
      choice(
        build_command_rule_argumentful_block_allowed(
          $,
          command_keyword_alias($, PRINTLIST_COMMAND_PATTERNS),
          repeat_with_commas(choice($.expression, '!', '?')),
        ),
        build_command_rule_argumentless($, PRINTLIST_COMMAND_PATTERNS[0]),
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

    command_macro: ($) =>
      prec.right(
        seq(
        $.macro,
        optional($.post_conditional),

        optional(
          choice(
            repeat1(
              seq(
                ',',
                $.do_parameter,
              ),
            ),
            seq(
              '{',
              repeat($.statement),
              '}',
              repeat($.elseif_block),
              optional($.else_block),
            ),
          ),
        ),

      )),

    // A tag parameter can be just a name or a name with a default value
    tag_parameter: ($) =>
      seq(
        optional('&'),
        $.method_arg,
        optional(seq('=', $.expression)),
      ),

    post_conditional: ($) =>
      seq($._post_conditional_id, token.immediate(':'), alias($.expression_post_cond, $.expression)),
    ...post_conditional_rules,
  },
});
