/**
 * Copyright (c) 2023 by InterSystems.
 * Cambridge, Massachusetts, U.S.A.  All rights reserved.
 * Confidential, unpublished property of InterSystems.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const objectscript_expr = require('../expr/grammar');

const {
  commaSep1,
  commaSep,
  sep1,
  sepStart1,
  commaSepStart,
  commaSepStart1,
  sep1Immediate,
  sepN,
  sepUpTo,
  build_argument_list_immediate,
  build_command_rule_argumentful,
  build_command_rule_argumentless_or_argumentful_block_allowed,
  build_command_rule_argumentless_or_argumentful,
  build_dotted_statement_special_block_version,
  build_legacy_version,
  build_special_block_version,
  build_argument_list,
  build_dotted_block_has_params,
  build_block_has_params,
  build_command_rule_argumentful_block_allowed,
  build_parameter_options_three,
  build_parameter_options_two,
  build_dotted_block_no_params,
  build_block_no_params,
  build_special_dotted_block_has_params,
  build_special_block_has_params,
  build_special_block_no_params,
  build_legacy_version_conditional,
  build_legacy_no_params_cond,
  build_arguments,
  build_block,
  build_command_rule_argumentless,
  build_argumentful_statement,
  command_keyword_alias,
} = require('../common/define_grammar');

const {
  STATEMENT_RULE_NAMES,
  OBJECTSCRIPT_BUILT_IN_COMMAND_PATTERNS,
  PRINTLIST_COMMAND_PATTERNS,
} = require('./command_metadata');

/**
 * @param {GrammarSymbols<string>} $
 * @param {string[]} ruleNames
 * @returns {RuleOrLiteral[]}
 */
function rule_refs($, ruleNames) {
  return ruleNames.map((ruleName) => $[ruleName]);
}

module.exports = grammar(objectscript_expr, {
  name: 'objectscript_core',
  externals: ($) => [
    $._immediate_single_whitespace_followed_by_non_whitespace,
    $._assert_no_space_between_rules,
    $._argumentless_command_end,
    $._argumentless_loop,
    $._whitespace,
    $.tag,
    $.routine,
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
    $._post_conditional_id,
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
    $.inline_comment,
    $._statement_termination,
    $.argumentless_inline_comment,
    $.dotted_statement_block,
    $._intermediate_termination,
    $.bol_extra,
    $._do_termination,
    $._bol_block,
    $._post_conditional_end,
    $.compiled_header,
    $.external_method_body_content,
    $.statement_in_macro,
  ],
  conflicts: ($, previous) =>
    previous.concat([
      [$.xecute_argument, $._parenthetical_expression],
      [$.line_ref, $.line_ref],
      [$.lvn, $._text_line_ref],
      [$._expr_atom, $.device_params],
    ]),

  extras: ($) => [
    $._whitespace,
    $.line_comment_1,
    $.line_comment_2,
    $.line_comment_3,
    $.line_comment_4,
    $.block_comment,
    $.inline_comment,
    $.bol_extra,
  ],
  // Note that adding the word key
  // makes tree sitter not like the one letter form of keyword write
  precedences: ($, previous) => [...previous],
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
    statement: ($) => choice(...rule_refs($, STATEMENT_RULE_NAMES)),

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
    _dotted_block_continuation: ($) =>
      seq($._bol, optional($.tag), repeat1('.')),
    _dotted_block_end: ($) => seq($._bol_block, repeat1('.')),

    dotted_statement: ($) =>
      seq(
        // this is from the external scanner, and it means that it was
        // at the start of a line and there were dots matching the dotted statement
        $._dotted_block_continuation,
        repeat(choice($.statement, $.dotted_block_statements)),
        $._termination,
      ),
    variable_datatype: ($) =>
      seq(
        choice(alias($._base_variable, $.typename), $.instance_variable, $.macro),
        repeat(seq(token.immediate('.'), alias($._base_variable_immediate, $.typename))),
      ),
    keyword_of: (_) => /Of/i,
    pound_dim: ($) =>
      seq(
        $.keyword_dim,
        commaSep1(alias($._base_variable, $.lvn)),
        optional(
          seq(
            $.keyword_as,
            $.variable_datatype,
            optional(seq($.keyword_of, $.variable_datatype)),
          ),
        ),
        optional(seq('=', $.expression)),
      ),

    pound_define: ($) =>
      seq(
        choice($.keyword_pound_define, $.keyword_pound_def1arg),
        prec(
          10,
          seq(
            alias($._base_variable, $.macro_def),
            optional($.pound_define_variable_args),
          ),
        ),
        choice($.macro_value, $._statement_termination),
      ),

    pound_define_variable_args: ($) =>
      prec(15, build_argument_list_immediate(commaSep($.macro_arg))),
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
          seq($.pound_if_special_case, $.keyword_pound_endif),
          seq(
            $.pound_if_special_case_else,
            choice(
              $.keyword_pound_else,
              seq($.keyword_pound_elseif, alias('1', $.numeric_literal)),
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
        seq($.keyword_pound_elseif, $.expression, repeat($.statement)),
      ),
    pound_else: ($) => seq($.keyword_pound_else, repeat($.statement)),
    pound_import: ($) =>
      seq(
        $.keyword_pound_import,
        commaSep1(alias($._quote_permitting_identifier, $.class_name)),
      ),

    pound_include: ($) =>
      seq(
        $.keyword_pound_include,
        alias($._quote_permitting_identifier, $.class_name),
      ),

    // TODO: Unimplemented preprocessor directives (lower priority):
    // #noshow, #show, #sqlcompile (audit/mode/path/select), #undef,
    // ##; ##beginquote/##EndQuote, ##expression, ##function, ##lit,
    // ##quoteExp, ##sql, ##stripq, ##unique

    macro_arg: (_) => /\%[A-Za-z0-9]+/,
    macro_value_line: ($) =>
      prec(0, seq(/[ \t]+/, /[^\n]*/, $._statement_termination)),
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
        commaSep1($.set_argument),
      ),
    set_argument: ($) =>
      choice(
        seq(choice($.set_target, $.set_target_list), '=', $.expression),
        $.indirection,
      ),

    set_target_list: ($) =>
      seq('(', $.set_target, repeat1(seq(',', $.set_target)), ')'),

    set_target: ($) =>
      choice(
        $._target_variable,
        $.macro,
        $.relative_dot_property,
        $.relative_dot_method,
        $.system_defined_function,
        $.system_defined_variable,
        $._parenthetical_expression,
        $.json_object_literal,
        $.json_array_literal,
        $.ole_object_reference,
        $.class_method_call,
        $.sql_field_reference,
        $._ole_server_name,
      ),

    _special_case_do: ($) =>
      prec.right(
        seq(
          alias($.keyword_do, $.keyword_do_old),
          optional($.post_conditional),
          $._do_termination,
          '}',
          repeat($.dotted_statement),
        ),
      ),

    _statements_block: ($) =>
      seq('{', repeat($.statement), choice('}', $._special_case_do)),

    _dotted_statements_block: ($) =>
      seq(
        $.dotted_statement_block,
        '{',
        repeat(choice($.dotted_statement, $.statement)),
        optional($._dotted_block_end),
        '}',
      ),

    command_write: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_write,
          commaSep1($.write_argument),
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

    write_mnemonic: ($) => seq($.mnemonic_name, optional($.method_args)),
    mnemonic_name: (_) => seq('/', token.immediate(/[%A-Za-z][A-Za-z0-9]*/)),

    dotted_block_statements: ($) =>
      choice(
        $.command_if_dotted_block,
        $.command_for_dotted_block,
        $.command_while_dotted_block,
        $.command_dowhile_dotted,
        $.command_trycatch_dotted,
      ),
    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cdo
    command_do: ($) =>
      choice(
        prec.right(
          seq(
            alias($.keyword_do, $.keyword_do_old),
            optional($.post_conditional),
            repeat1($.dotted_statement),
          ),
        ),
        prec.right(
          seq(
            alias($.keyword_do, $.keyword_do_old),
            optional($.post_conditional),
            $._argumentless_command_end,
            repeat(alias($.statement, $.do_statement_after)),
            $._termination,
            repeat($.dotted_statement),
          ),
        ),
        // DO with parameters
        seq(
          $.keyword_do,
          optional($.post_conditional),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          commaSep1($.do_parameter),
        ),
      ),

    do_parameter: ($) =>
      seq(
        choice($.routine_tag_call, $.system_defined_function, $._method_call),
        optional($.post_conditional),
      ),

    command_mvcall: ($) =>
      seq(
        alias(/MVCALL/i, $.command_keyword),
        optional($.post_conditional),
        $._immediate_single_whitespace_followed_by_non_whitespace,
        commaSep1($.do_parameter),
      ),

    _method_call: ($) =>
      choice(
        $.relative_dot_method,
        $.superclass_method_call,
        $.class_method_call,
        $.macro,
        seq(
          choice(
            $.lvn,
            $.instance_variable,
            $.relative_dot_property,
            $.relative_dot_method,
            $._parenthetical_expression,
            $.macro,
            $.extrinsic_function,
            $.system_defined_function,
            $.system_defined_variable,
            $.class_method_call,
          ),
          repeat($.oref_chain_segment),
          // Whatever we have here must end in a method
          token.immediate('.'),
          choice($.oref_method, $.macro_function),
        ),
      ),

    routine_tag_call: ($) => seq($._text_line_ref, optional($.method_args)),
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
      prec.right(
        seq(
          $._text_line_ref,
          optional(seq(token.immediate(':'), $._text_line_ref)),
        ),
      ),

    _for_header: ($) =>
      seq(
        $.keyword_for,
        $._immediate_single_whitespace_followed_by_non_whitespace,
        commaSep1($.for_parameter),
      ),

    command_for: ($) =>
      // The `FOR` command has 4 versions:
      // * Block style with params:    FOR <criteria> { ... }
      // * Block style argumentless:   FOR { ... }
      // * Old style with params:      FOR <criteria> <commands...>
      // * Old style argumentless:     FOR  <commands...>
      // NOTE: `FOR` doesn't allow post_conditional in any form
      choice(
        build_special_block_version(
          $,
          $.keyword_for,
          commaSep1($.for_parameter),
        ),
        build_legacy_version(
          $,
          alias($.keyword_for, $.keyword_old_for),
          commaSep1($.for_parameter),
        ),
      ),

    command_for_dotted_block: ($) =>
      build_dotted_statement_special_block_version(
        $,
        $.keyword_for,
        commaSep1($.for_parameter),
      ),

    for_parameter: ($) =>
      prec.right(
        seq(
          choice($._target_var_arg, $.instance_variable),
          '=',
          commaSep1($.for_parameter_arg),
        ),
      ),
    for_parameter_arg: ($) => sepUpTo($.expression, ':', 3),

    command_while: ($) =>
      build_block_has_params(
        $,
        $.keyword_while,
        choice(
          build_argument_list(commaSep1($.expression)),
          seq(
            $._immediate_single_whitespace_followed_by_non_whitespace,
            commaSep1($.expression),
          ),
        ),
      ),

    command_while_dotted_block: ($) =>
      build_dotted_block_has_params(
        $,
        $.keyword_while,
        choice(
          build_argument_list(commaSep1($.expression)),
          seq(
            $._immediate_single_whitespace_followed_by_non_whitespace,
            commaSep1($.expression),
          ),
        ),
      ),
    command_kill: ($) =>
      build_command_rule_argumentless_or_argumentful(
        $,
        $.keyword_kill,
        commaSep1(
          choice(
            alias($.set_target, $.kill_target),
            alias($.set_target_list, $.kill_target_list),
          ),
        ),
      ),

    command_lock: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_lock,
        commaSep1($.command_lock_argument),
      ),

    lock_arg: ($) => seq($._target_var_arg, optional($.locktype)),

    command_lock_argument: ($) =>
      prec.right(
        seq(
          optional(choice('+', '-')),
          choice(
            $.lock_arg,
            build_argument_list(
              commaSep1(seq(optional(choice('+', '-')), $.lock_arg)),
            ),
          ),
          optional($.timeout),
        ),
      ),

    // Available values are “S” (shared lock), ”E” (escalating lock), “I” (immediate unlock), and “D” (deferred unlock
    // of course lock ^foo#"SSSSSSSSSEEEEEEEEEDDDDDDDD" doesn't make sense, but it's syntactically valid and compiles.
    locktype: ($) =>
      prec.right(
        seq(
          '#',
          choice(
            $.relative_dot_method,
            $.relative_dot_property,
            $.relative_dot_parameter,
            $.instance_variable,
            seq(
              choice(
                $.string_literal,
                alias(token.immediate(/[A-Za-z]+/), $.lvn),
                $.system_defined_function,
              ),
              optional(
                seq(
                  '_',
                  choice(
                    $.string_literal,
                    alias(token.immediate(/[A-Za-z]+/), $.lvn),
                    $.system_defined_function,
                  ),
                ),
              ),
            ),
          ),
        ),
        // ),
      ),

    timeout: ($) => seq(token.immediate(':'), $.expression),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cread#RCOS_cread25
    command_read: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_read,
        commaSep1($.read_argument),
      ),
    read_argument: ($) =>
      choice(repeat1($.read_fchar), $.string_literal, $.read_variable),
    read_fchar: ($) => choice('!', '#', '?', $.numeric_literal),
    read_variable: ($) =>
      seq(
        choice(
          choice($._target_var_arg, $.mnemonic_name),
          seq('*', $._assert_no_space_between_rules, $._glvn),
          seq($._glvn, '#', $.expression),
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
        commaSep1($.open_argument),
      ),

    open_argument: ($) =>
      seq(
        $.device,
        optional(
          build_parameter_options_three(
            $.device_params,
            $.expression,
            $.expression,
          ),
        ),
      ),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cclose

    command_close: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_close,
        commaSep1($.close_argument),
      ),
    close_parameters: ($) =>
      choice(
        build_argument_list(
          sep1(optional($.close_parameter_option_value), ':'),
        ),
        $.close_parameter_option_value,
      ),
    close_argument: ($) =>
      seq($.device, optional(seq(token.immediate(':'), $.close_parameters))),
    // "D", "K", ("R":newname or /REN=newname or /RENAME=newname)
    close_rename: ($) =>
      choice(
        seq(alias('"R"', $.string_literal), ':'),
        seq(alias(choice('/REN=', '/RENAME='), $.mnemonic_name)),
      ),
    close_parameter_option_value: ($) =>
      choice(
        alias(choice('"k"', '"K"'), $.string_literal),
        alias(choice('"D"', '"d"'), $.string_literal),
        alias(choice('"I"', '"i"'), $.string_literal),
        seq($.close_rename, $.device),
        seq(
          alias(/del(ete)?/i, $.mnemonic_name),
          optional(seq(token.immediate('='), $.expression)),
        ),
      ),

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cuse
    // USE:pc device:(parameters):"mnespace",...
    // U:pc device:(parameters):"mnespace",...
    use_argument: ($) =>
      seq(
        $.device,
        optional(build_parameter_options_two($.device_params, $.expression)),
      ),

    device_keywords: ($) =>
      prec.right(
        choice(
          seq(
            alias(
              token(seq('/', /[%A-Za-z][A-Za-z0-9]*/, token.immediate('='))),
              $.mnemonic_name,
            ),
            choice($.expression, $.variadic_arg),
          ),
          $.expression,
          $.mnemonic_name,
        ),
      ),

    device_params: ($) =>
      choice(
        build_argument_list(
          commaSep1(
            choice(sep1(optional($.device_keywords), ':'), $.string_literal),
          ),
        ),
        $.device_keywords,
      ),

    command_use: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_use,
        commaSep1($.use_argument),
      ),
    command_dowhile: ($) =>
      seq(
        build_block_no_params($, $.keyword_do),
        $.keyword_while,
        $._expression_list,
      ),

    command_dowhile_dotted: ($) =>
      seq(
        build_dotted_block_no_params($, $.keyword_do),
        $.keyword_while,
        $._expression_list,
      ),

    command_new: ($) =>
      build_command_rule_argumentless_or_argumentful(
        $,
        $.keyword_new,
        commaSep1($.command_new_argument),
      ),
    command_new_argument: ($) =>
      choice(
        $.command_new_item,
        build_argument_list(commaSep1($.command_new_item)),
      ),

    command_new_item: ($) =>
      choice(
        $.indirection,
        $.lvn,
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
          build_special_block_has_params($, $.keyword_if, $._expression_list),
          repeat($.elseif_block),
          optional($.else_block),
        ),
        seq(
          build_special_block_no_params($, $.keyword_if),
          repeat($.elseif_block),
          optional($.else_block),
        ),
        build_legacy_version_conditional(
          $,
          alias($.keyword_if, $.keyword_old_if),
          $._expression_list,
        ),
      ),
    command_sqlcompile: ($) =>
      seq(
        alias(/#sqlcompile/i, $.keyword_sqlcompile),
        alias(/select/i, $.keyword_select),
        '=',
        alias(/(?:Display|Logical|ODBC|Runtime|Text|FDBMS)/i, $.typename),
      ),

    else_block_dotted: ($) => build_dotted_block_no_params($, $.keyword_else),
    elseif_block_dotted: ($) =>
      build_dotted_block_has_params($, $.keyword_elseif, $._expression_list),
    command_if_dotted_block: ($) =>
      choice(
        seq(
          build_special_dotted_block_has_params(
            $,
            $.keyword_if,
            $._expression_list,
          ),
          repeat($.elseif_block_dotted),
          optional($.else_block_dotted),
        ),
        seq(
          build_dotted_block_no_params($, $.keyword_if),
          repeat($.elseif_block_dotted),
          optional($.else_block_dotted),
        ),
      ),
    command_else: ($) => build_legacy_no_params_cond($, $.keyword_oldelse),
    elseif_block: ($) =>
      build_block_has_params($, $.keyword_elseif, $._expression_list),
    else_block: ($) => build_block_no_params($, $.keyword_else),
    command_throw: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_throw,
          $.expression,
        ),
      ),
    command_trycatch: ($) =>
      seq(build_block_no_params($, $.keyword_try), $.catch_block),

    catch_block: ($) =>
      build_block($, $.keyword_catch, build_arguments($._target_var_arg)),

    command_trycatch_dotted: ($) =>
      seq(
        build_dotted_block_no_params($, $.keyword_try),
        $.keyword_catch,
        optional(build_arguments($._target_var_arg)),
        $._dotted_statements_block,
      ),

    command_job: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_job,
        commaSep1($.job_argument),
      ),
    job_argument: ($) =>
      seq(
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
          $.system_defined_function,
          $._method_call,
        ),
        optional(
          seq(
            token.immediate(':'),
            choice(
              $.lvn,
              build_argument_list(sep1Immediate(optional($.expression), ':')),
              $.timeout,
            ),
            optional($.timeout),
          ),
        ),
      ),

    command_break: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_break,
        $._expression_list,
      ),

    command_merge: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_merge,
        commaSep1(alias($.set_argument, $.merge_argument)),
      ),

    command_return: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_return,
          $._expression_list,
        ),
      ),

    command_quit: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_quit,
        $._expression_list,
      ),

    command_goto: ($) =>
      prec.right(
        build_command_rule_argumentless_or_argumentful_block_allowed(
          $,
          $.keyword_goto,
          commaSep1(choice($.goto_argument, $.system_defined_function)),
        ),
      ),
    goto_argument: ($) => seq($._text_line_ref, optional($.post_conditional)),

    command_halt_or_hang: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_halt_or_hang),
        build_command_rule_argumentless($, $.keyword_halt),
        build_command_rule_argumentful_block_allowed(
          $,
          $.keyword_halt_or_hang,
          $._expression_list,
        ),
        build_command_rule_argumentful_block_allowed(
          $,
          $.keyword_hang,
          $._expression_list,
        ),
      ),

    command_continue: ($) =>
      build_command_rule_argumentless($, $.keyword_continue),
    command_tcommit: ($) =>
      build_command_rule_argumentless($, $.keyword_tcommit),
    command_trollback: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_trollback),
        build_command_rule_argumentful(
          $,
          $.keyword_trollback,
          alias('1', $.numeric_literal),
        ),
      ),
    command_tstart: ($) => build_command_rule_argumentless($, $.keyword_tstart),

    xecute_argument: ($) =>
      choice(
        // Simple form: XECUTE cmdline[:pc]
        seq($.expression, optional($.post_conditional)),

        // Parameter-passing form: XECUTE ("cmdline", params... )[:pc]
        seq(
          '(',
          $.expression,
          commaSepStart(choice($.byref_arg, $.expression)),
          ')',
          optional($.post_conditional),
        ),
      ),
    command_xecute: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_xecute,
        commaSep1($.xecute_argument),
      ),
    command_view: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_view,
        commaSep1($.view_parameter),
      ),

    view_parameter: ($) => choice($.expression, sepN($.expression, ':', 4)),

    command_zbreak: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_zbreak),
        seq($.keyword_zbreak, optional($.post_conditional), $.zbreak_arguments),
      ),
    zbreak_arg: ($) =>
      seq(
        $.zbreak_location,
        optional(
          build_parameter_options_three(
            $.string_literal,
            $.zbreak_condition,
            $.string_literal,
          ),
        ),
      ),
    zbreak_location: ($) =>
      seq(
        optional(choice('+', '-', '--')),
        choice(
          // code line location?,
          $._text_line_ref,
          // local var *var
          seq('*', alias($._base_variable_immediate, $.lvn)),
          // single step breakpoint
          '$',
        ),
        optional(alias('#delay', $.keyword_pound_delay)),
      ),

    zbreak_condition: ($) => seq('"', $.expression, '"'),

    _zb_device: ($) => seq(token.immediate(':'), $.device),

    zbreak_arguments: ($) =>
      choice(
        seq(
          $._immediate_single_whitespace_followed_by_non_whitespace,
          choice('+', '-', $.zbreak_arg),
          $._statement_termination,
        ),
        seq(
          $.mnemonic,
          token.immediate('/'),
          choice(
            $.keyword_clear,
            seq($.keyword_debug, optional($._zb_device)),
            seq(
              $.keyword_errortrap,
              token.immediate(':'),
              choice($.keyword_on, $.keyword_off),
            ),
            seq(
              $.keyword_trace,
              optional(
                seq(
                  token.immediate(':'),
                  choice($.keyword_on, $.keyword_off, $.keyword_all),
                  optional($._zb_device),
                ),
              ),
            ),
            seq(
              choice($.keyword_step, $.keyword_nostep),
              sepStart1(
                choice($.keyword_ext, $.keyword_destruct, $.keyword_stepmethod),
                token.immediate(':'),
              ),
            ),
            seq(
              $.keyword_interrupt,
              optional(
                seq(
                  token.immediate(':'),
                  alias(
                    choice($.keyword_break, $.keyword_normal),
                    $.zbreak_command_option,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    device: ($) => sep1Immediate($.expression, '/'),
    _zkill_arg: ($) => choice($._target_variable, $.dollar_arg_pair),

    command_zkill: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_zkill,
        commaSep1($._zkill_arg),
      ),
    command_zn: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_zn,
        $._expression_list,
      ),
    command_zsu: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_zsu,
        $._expression_list,
      ),
    command_ztrap: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_ztrap,
        $._expression_list,
      ),
    command_zwrite: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        $.keyword_zwrite,
        $._expression_list,
      ),
    command_zz: ($) =>
      build_command_rule_argumentful_block_allowed(
        $,
        $.keyword_zz,
        $._expression_list,
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
          build_argument_list_immediate($.paren_fenced_text),
          $.embedded_sql_reverse_marker,
        ),
        seq(
          $.keyword_embedded_sql_amp,
          build_argument_list_immediate($.paren_fenced_text),
        ),
      ),

    // NOTE: We put the marker within the &sql keyword def to make it easier to query for highlighting
    embedded_sql_hash: ($) =>
      seq(
        $.keyword_embedded_sql_hash,
        build_argument_list_immediate($.paren_fenced_text),
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

    tag_statement: ($) =>
      prec.right(
        seq(
          $.tag,
          optional($.parameter_list),
          optional(
            choice($.keyword_methodimpl, $.keyword_public, $.keyword_private),
          ),
        ),
      ),

    procedure_pub_vars: ($) =>
      seq('[', optional(commaSep1(choice(alias($._base_variable, $.lvn), $.macro))), ']'),

    // Full procedure definitions: tagname(params) [public_vars] access_modifier { body }
    procedure: ($) =>
      seq(
        $.tag,
        $.parameter_list,
        // Optional public variables list [var1, var2, ...]
        optional($.procedure_pub_vars),
        optional(
          choice($.keyword_public, $.keyword_private, $.keyword_methodimpl),
        ),
        // Code block { statements }, separated by whitespace
        $._statements_block,
      ),

    objectscript_built_in_command: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        command_keyword_alias($, OBJECTSCRIPT_BUILT_IN_COMMAND_PATTERNS),
        $._expression_list,
      ),

    z_file_commands: ($) =>
      build_command_rule_argumentless_or_argumentful_block_allowed(
        $,
        choice($.keyword_zload, alias(/ZS(AVE)?/i, $.keyword_zsave)),
        $._routine_arguments,
      ),

    // https://docs.intersystems.com/ens201817/csp/docbook/Doc.View.cls?KEY=RCOS_cmvcrt
    commands_with_printlist: ($) =>
      build_argumentful_statement(
        $,
        command_keyword_alias($, PRINTLIST_COMMAND_PATTERNS),
        commaSep1(choice($.expression, '!', '?')),
      ),

    // choice(
    //   build_command_rule_argumentful_block_allowed(
    //     $,
    //     command_keyword_alias($, PRINTLIST_COMMAND_PATTERNS),
    //     commaSep1(choice($.expression, '!', '?')),
    //   ),
    //   // build_command_rule_argumentless($, PRINTLIST_COMMAND_PATTERNS[0]),
    // ),
    parameter_list: ($) =>
      build_argument_list_immediate(commaSep($.tag_parameter)),

    command_macro: ($) =>
      prec.right(
        seq(
          choice(
            alias(token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)), $.macro_constant),
            seq(
              alias(token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/, token.immediate('('))), $.macro_function),
              optional(choice(
                seq(
                  $.statement_in_macro,
                  $.statement,
                ),
                $._method_arg_list,
              )),
              alias(')', $.macro_function),
            ),
          ),
          optional($.post_conditional),
          optional(
            choice(
              commaSepStart1($.do_parameter),
              seq(
                $._statements_block,
                repeat($.elseif_block),
                optional($.else_block),
              ),
            ),
          ),
        ),
      ),

    _routine_arguments: ($) => build_arguments(alias($._quote_permitting_identifier, $.routine_name)),
    _target_variable: ($) =>
      choice($._glvn, $.indirection, $.instance_variable, $.oref_chain_expr),

    _target_var_arg: ($) => choice($._glvn, $.indirection),

    // A tag parameter can be just a name or a name with a default value
    tag_parameter: ($) =>
      seq(optional('&'), $.method_arg, optional(seq('=', $.expression))),
    // from DataTree
    command_zedit: ($) =>
      seq(
        alias(/ze(dit)?/i, $.keyword_zedit),
        $._routine_arguments,
      ),

    post_conditional: ($) =>
      seq(
        $._post_conditional_id,
        token.immediate(':'),
        $.expression,
        $._post_conditional_end,
      ),
    // ...post_conditional_rules,
  },
});
