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
function build_command_rule_argumentless($, commandKeyword) {
  // Argumentless
  return seq(
    field('command_name', commandKeyword),
    optional($.post_conditional),
    $._argumentless_command_end,
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
    $._whitespace_before_block,
    $._immediate_single_whitespace_followed_by_non_whitespace,
    $._assert_no_space_between_rules,
    $._argumentless_command_end,
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
  ],
  conflicts: ($, previous) =>
    previous.concat([
      [$.keyword_hang, $.keyword_halt],
      [$.command_xecute, $._parenthetical_expression],
    ]),
  // [$.statement, $.expression]],

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
    $.block_comment,
  ],
  // Note that adding the word key
  // makes tree sitter not like the one letter form of keyword write
  precedences: ($, previous) => [
    [$.oref_method_post_cond, $.oref_property_post_cond],
    [$.oref_chain_expr_post_cond, $.expr_atom_post_cond],
    [$.command_hang, $.command_halt],
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
        $.command_hang,
        $.command_halt,
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
        $.command_zwrite,
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
        $.dotted_statement,
      ),

    dotted_statement: ($) =>
      prec.right(10, seq(
        repeat1('.'),
        optional(token.immediate(/[ \t]+/)),
        $.statement,
      )),
    pound_dim: ($) =>
      seq(
        field('preproc_keyword', $.keyword_dim),
        alias($.objectscript_identifier, $.lvn),
        optional(
          seq(
            field('preproc_keyword', /[aA][sS]/),
            alias($.objectscript_identifier, $.typename),
          ),
        ),
        optional(seq('=', $.expression)),
      ),

    keyword_dim: (_) => /\#[dD][iI][mM]/,

    pound_define: ($) =>
      seq(
        field('preproc_keyword', $.keyword_pound_define),
        prec(10, seq(
          field('macro_name', $.pound_define_variable_name),
          optional($.pound_define_variable_args),
        )),
        optional($.macro_value),
      ),
    pound_define_variable_name: ($) =>
      /[A-Za-z0-9]+/,
    pound_define_variable_args: ($) =>
      prec(15, seq(
        token.immediate('('),
        optional(
          seq(
            field('macro_arg', $.macro_arg),
            repeat(seq(',', field('macro_arg', $.macro_arg))),
          ),
        ),
        token.immediate(')'),
      )),
    keyword_pound_define: (_) => /\#define/i,
    keyword_pound_pound_continue: (_) => /\##continue/i,

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
        optional(field('macro_arg', $.macro_arg)),
        token.immediate(')'),
      )),
    keyword_pound_def1arg: (_) => /\#def1arg/i,

    pound_execute: ($) => field('preproc_keyword', $.keyword_pound_execute),
    keyword_pound_execute: (_) => /\#execute/i,

    pound_if: ($) =>
      seq(
        field('preproc_keyword', $.keyword_pound_if),
        field('condition', $.expression),
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
        field('preproc_keyword', $.keyword_pound_endif),
      ),

    pound_ifdef: ($) =>
      seq(
        field('preproc_keyword', alias(/\#ifdef/i, $.kw_pound_ifdef)),
        field('condition', $.expression),
        repeat(choice($.statement, $.pound_elseif)),
        optional($.pound_else),
        field('preproc_keyword', $.keyword_pound_endif),
      ),

    pound_ifndef: ($) =>
      seq(
        field('preproc_keyword', alias(/\#ifndef/i, $.kw_pound_ifndef)),
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
    macro_value_line: (_) => prec(0,
      seq(
        /[ \t]+/,
        /[^\n]*\n/,
      )),
    macro_value: ($) =>
      seq(
        repeat(
          // Multi-line macro (starts with continuation and can have more)
          seq(
            $.macro_value_line_with_continue,
            field('preproc_keyword', $.keyword_pound_pound_continue),
          ),
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
      seq(
        field('lhs', choice($.set_target, $.set_target_list)),
        field('operator', '='),
        field('rhs', $.expression),
      ),

    set_target_list: ($) => seq('(', repeat_with_commas($.set_target), ')'),
    set_target: ($) =>
      choice(
        $.glvn,
        $.instance_variable,
        $.oref_set_target,
        $.system_defined_function,  // For things like, set $LB(a, b) = 3
        $.system_defined_variable,
        $.sql_field_reference,
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
          repeat($._oref_chain_segment),
          // Whatever we have here must end in a property
          token.immediate('.'),
          $.oref_property,
        ),
      ),

    command_write: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, $.keyword_write),
          build_command_rule_argumentful(
            $,
            $.keyword_write,
            repeat_with_commas($.write_argument),
          ),
        ),
      ),
    keyword_write: (_) => /[wW]([rR][iI][tT][eE])?/,
    write_argument: ($) => choice($.write_device_control, $.expression),
    write_device_control: ($) =>
      choice(
        $.write_device_fflf,
        $.write_device_tab,
        $.write_device_char,
        $.write_mnemonic,
      ),
    write_device_fflf: (_) => repeat1(choice('!', '#')),
    write_device_tab: ($) => seq('?', $.expression),
    write_device_char: ($) => seq('*', $.expression),

    write_mnemonic: ($) =>
      seq(
        field('mnemonic', $.mnemonic_name),
        optional($.method_args)
      ),
    mnemonic_name: (_) =>
      token(/\/[%A-Za-z0-9][A-Za-z0-9]*/),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cdo
    command_do: ($) =>
      choice(
        // DO with parameters
        build_command_rule_argumentful(
          $,
          $.keyword_do,
          repeat_with_commas($.do_parameter),
        ),
        // Argumentless DO
        build_command_rule_argumentless($, $.keyword_do),
      ),
    keyword_do: (_) => /[dD]([oO])?/,
    do_parameter: ($) =>
      choice(
        $.routine_tag_call,
        $.class_method_call,
        $.instance_method_call,
        $.doable_dollar_functions,
      ),

    instance_method_call: ($) =>
      choice(
        $.relative_dot_method,
        seq(
          choice(
            $.lvn,
            $.instance_variable,
            $.relative_dot_property,
            $.relative_dot_method,
            $._parenthetical_expression,
          ),
          repeat($._oref_chain_segment),
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
        // These are more specialized
        $.dollar_classmethod,
        $.dollar_method,
        $.dollarsf,
        // Generic $ functions
        seq(
          field('function_name', choice(
            /\$I(NCREMENT)?/i,
            /\$ZF/i,
            /\$ZU(TIL)?/i
          )),
          token.immediate('('),
          repeat_with_commas($.expression),
          ')',
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
          field('command_name', $.keyword_for),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          '{',
          repeat($.statement),
          '}',
        ),
        // Block style FOR without parameters (argumentless)
        seq(
          field('command_name', $.keyword_for),
          optional(
            choice(
              $._whitespace_before_block,
              $._argumentless_command_end,
              $._immediate_single_whitespace_followed_by_non_whitespace,
            ),
          ),
          '{',
          repeat($.statement),
          '}',
        ),
        // Old style FOR with parameters
        seq(
          field('command_name', $.keyword_for),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.for_parameter),
          prec.left(repeat1($.statement)),
        ),
        // Old style argumentless FOR
        seq(
          field('command_name', $.keyword_for),
          $._argumentless_command_end,
          prec.left(repeat1($.statement)),
        ),
      ),

    keyword_for: (_) => /[fF]([oO][rR])?/,
    for_parameter: ($) => prec.right(seq(
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
        $.expression,
        seq(
          field('initial', $.expression),
          field('operator',':'),
          field('increment', $.expression),
        ),
        seq(
          field('initial', $.expression),
          field('operator',':'),
          field('increment', $.expression),
          field('operator',':'),
          field('limit', $.expression),
        ),
      ),

    // Note: Parser prioritizes DO statement over KILL in certain contexts.
    // This is acceptable behavior for the current implementation.
    command_while: ($) =>
      seq(
        field('command_name', $.keyword_while),
        optional($._immediate_single_whitespace_followed_by_non_whitespace),
        repeat_with_commas($.expression),
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
      choice($.glvn, seq('(', repeat_with_commas($.glvn), ')')),

    command_lock: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_lock),
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
      seq(token.immediate(':'), alias($.expression_post_cond, $.expression)),

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
        field('fchar', $._read_fchar),
        field('prompt', alias($.string_literal, $._read_prompt)),
        field('variable', $._read_variable),
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
          field('fixed', seq($.glvn, '#', $.expression)),
        ),
        optional(field('timeout', seq(token.immediate(':'), $.expression))),
      ),

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_copen#RCOS_copen25
    // OPEN:pc device:(parameters):timeout:"mnespace",...
    // O:pc device:(parameters):timeout:"mnespace",...
    command_open: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_open,
        repeat_with_commas($.open_parameter),
      ),
    keyword_open: (_) => /O(pen)?/i,
    open_parameter: ($) =>
      seq(
        $.expression,
        optional(
          seq(
            token.immediate(':'),
            optional(
              seq(
                token.immediate('('),
                field(
                  'keywords',
                  repeat_with_commas(
                    field('keyword', /\/[A-Za-z]+=[A-Z-a-z]+/),
                  ),
                ),
                token.immediate(')'),
              ),
            ),
            optional(
              seq(
                token.immediate(':'),
                seq(
                  $._assert_no_space_between_rules,
                  field('timeout', $.expression),
                ),
                optional(
                  seq(
                    token.immediate(':'),
                    seq(
                      $._assert_no_space_between_rules,
                      field('mnspace', $.expression),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),

    // Reference: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cclose
    // eslint-disable-next-line max-len
    command_close: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_close,
        repeat_with_commas($.close_parameter),
      ),
    keyword_close: (_) => /Close/i,
    close_parameter: ($) =>
      seq($.expression, optional($.close_parameter_option)),
    close_parameter_option: ($) =>
      seq(
        token.immediate(':'),
        choice(
          $.close_parameter_option_value,
          seq(
            '(',
            $.close_parameter_option_value,
            repeat(seq(token.immediate(':'), $.close_parameter_option_value)),
            ')',
          ),
        ),
      ),
    // "D", "K", ("R":newname or /REN=newname or /RENAME=newman)
    close_parameter_option_value: (_) =>
      choice(
        '"D"',
        '"K"',
        token(seq('"R"', ':', /[A-Za-z0-9]+/)),
        token(seq('/REN', '=', /[A-Za-z0-9]+/)),
        token(seq('/RENAME', '=', /[A-Za-z0-9]+/)),
      ),

    // Link: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_cuse
    // USE:pc device:(parameters):"mnespace",...
    // U:pc device:(parameters):"mnespace",...
    command_use: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_use,
        repeat_with_commas($.use_parameter),
      ),
    keyword_use: (_) => /U(se)?/i,
    use_parameter: ($) =>
      seq(
        field('device', $.expression),
        optional(
          seq(
            token.immediate(':'),
            optional(
              seq(
                token.immediate('('),
                field(
                  'keywords',
                  repeat_with_commas(
                    field('keyword', /\/[A-Za-z]+=[A-Z-a-z]+/),
                  ),
                ),
                token.immediate(')'),
              ),
            ),
            optional(
              seq(
                token.immediate(':'),
                seq(
                  $._assert_no_space_between_rules,
                  field('mnspace', $.expression),
                ),
              ),
            ),
          ),
        ),
      ),

    command_dowhile: ($) =>
      seq(
        field('command_name', $.keyword_do),
        optional($._immediate_single_whitespace_followed_by_non_whitespace),
        '{',
        repeat($.statement),
        '}',
        field('command_name', $.keyword_while),
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
        /\$ES(TACK)?/i,
        /\$ET(RAP)?/i,
        /\$NAMESPACE/i,
        /\$ROLES/i,
      ),

    command_if: ($) =>
      // The `IF` command is tricky, there are 3 versions:
      // * Block style:   If <cond> { ... } [Else/ElseIf ...]
      // * Old with arg:  If <cond> <commands...>
      // * Old no arg:    If  <commands...>
      // NOTE: `IF` doesn't allow post_conditional in any form
      choice(
        // Block style IF
        prec.right(
          seq(
            field('command_name', $.keyword_if),
            $._immediate_single_whitespace_followed_by_non_whitespace,
            repeat_with_commas($.expression),
            '{',
            repeat($.statement),
            '}',
            repeat(field('elseif_block', $.elseif_block)),
            optional(field('else_block', $.else_block)),
          ),
        ),
        // Old style IF
        seq(
          field('command_name', $.keyword_if),
          $._immediate_single_whitespace_followed_by_non_whitespace,
          repeat_with_commas($.expression),
          choice(
            $._argumentless_command_end,
            prec.left(repeat1($.statement)),
          ),
        ),
        // Argumentless IF, requires 2 spaces following
        seq(
          field('command_name', $.keyword_if),
          $._argumentless_command_end,
          choice(
            $._argumentless_command_end,
            prec.left(repeat1($.statement)),
          ),
        ),
      ),

    keyword_if: (_) => /I(f)?/i,
    keyword_elseif: (_) => /ElseIf/i,
    keyword_else: (_) => /Else/i,     // NOTE: New style Else must be spelled out
    keyword_oldelse: (_) => /E(lse)?/i,

    elseif_block: ($) =>
      seq(
        field('command_name', $.keyword_elseif),
        repeat_with_commas($.expression),
        '{',
        $.statements,
        '}',
      ),

    else_block: ($) =>
      seq(
        field('command_name', $.keyword_else),
        '{',
        $.statements,
        '}',
      ),

    command_else: ($) =>
      prec.left(
        1,
        seq(
          field('command_name', $.keyword_oldelse),
          $._argumentless_command_end,
          prec.left(repeat1($.statement)),
        ),
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
                optional($.expression),
                repeat(
                  seq(
                    token.immediate(':'),
                    optional($.expression),
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
    keyword_break: (_) => /B(REAK)/i,

    command_merge: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_merge,
        repeat_with_commas($.merge_argument),
      ),
    keyword_merge: (_) => /[mM]([eE][rR][gG][eE])?/,
    // Technically ^$GLOBAL() can be the source
    merge_argument: ($) => seq(
      field('lhs', $.glvn),
      field('operator', '='),
      field('rhs', $.glvn),
    ),

    command_return: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, $.keyword_return),
          build_command_rule_argumentful(
            $,
            $.keyword_return,
            repeat_with_commas($.expression),
          ),
        ),
      ),
    keyword_return: (_) => /[rR][eE][tT]([uU][rR][nN])?/,

    command_quit: ($) =>
      prec.right(
        choice(
          build_command_rule_argumentless($, $.keyword_quit),
          build_command_rule_argumentful(
            $,
            $.keyword_quit,
            repeat_with_commas($.expression),
          ),
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

    // NOTE: It seems that using /H(alt)?/i doesn't work, we need this choice() along with
    //       the conflict with keyword_hang
    command_halt: ($) =>
      prec.left(0, build_command_rule_argumentless($, $.keyword_halt)),
    keyword_halt: (_) => choice(/[Hh]/, /Halt/i),

    command_hang: ($) =>
      prec.right(2, build_command_rule_argumentful(
        $,
        $.keyword_hang,
        repeat_with_commas($.expression),
      )),
    keyword_hang: (_) => choice(/[Hh]/, /Hang/i),

    command_continue: ($) =>
      build_command_rule_argumentless($, $.keyword_continue),
    keyword_continue: (_) => /Continue/i,

    command_tcommit: ($) =>
      build_command_rule_argumentless($, $.keyword_tcommit),
    keyword_tcommit: (_) => /TCOMMIT/i,

    command_trollback: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_trollback),
        build_command_rule_argumentful($, $.keyword_trollback, '1'),
      ),
    keyword_trollback: (_) => /TRO(LLBACK)?/i,

    command_tstart: ($) => build_command_rule_argumentless($, $.keyword_tstart),
    keyword_tstart: (_) => /TS(TART)?/i,

    command_xecute: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_xecute,
        choice(
          $.expression,
          seq(
            '(', repeat_with_commas($.expression), ')'
          ),
        ),
      ),
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
        field('block', $.expression),
        seq(
          field('offset', $.expression),
          ':',
          field('mode', $.expression),
          ':',
          field('length', $.expression),
          ':',
          field('newvalue', $.expression),
        ),
      ),

    command_zbreak: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_zbreak),
        build_command_rule_argumentful($, $.keyword_zbreak, $.zbreak_arguments),
      ),
    keyword_zbreak: (_) => /ZB(REAK)?/i,
    zbreak_arguments: ($) =>
      seq(
        token.immediate('/'),
        $.objectscript_identifier,
        optional(
          token(seq(
            ':',
            /[A-Za-z0-9]+/,
          )),
        ),
      ),
    command_zkill: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_zkill,
        repeat_with_commas($.glvn),
      ),
    keyword_zkill: (_) => /ZKILL/i,

    command_zn: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_zn,
        repeat_with_commas($.expression),
      ),
    keyword_zn: (_) => /ZN(SPACE)/i,

    command_zsu: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_zsu),
        build_command_rule_argumentful(
          $,
          $.keyword_zsu,
          repeat_with_commas($.expression),
        ),
      ),
    keyword_zsu: (_) => /ZSU/i,

    command_ztrap: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_ztrap),
        build_command_rule_argumentful(
          $,
          $.keyword_ztrap,
          repeat_with_commas($.expression),
        ),
      ),
    keyword_ztrap: (_) => /ZT(RAP)?/i,

    command_zwrite: ($) =>
      choice(
        build_command_rule_argumentless($, $.keyword_zwrite),
        build_command_rule_argumentful(
          $,
          $.keyword_zwrite,
          repeat_with_commas($.expression),
        ),
      ),
    keyword_zwrite: (_) => /ZW(RITE)?/i,

    command_zz: ($) =>
      build_command_rule_argumentful(
        $,
        $.keyword_zz,
        repeat_with_commas($.expression),
      ),
    keyword_zz: (_) => /ZZ[A-Z0-9]+/i,

    embedded_html: ($) =>
      seq(
        $.keyword_embedded_html,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
    keyword_embedded_html: (_) => /&html/i,

    embedded_xml: ($) =>
      seq(
        $.keyword_embedded_xml,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
    keyword_embedded_xml: (_) => /&xml/i,

    embedded_sql: ($) => choice($.embedded_sql_amp, $.embedded_sql_hash),
    embedded_sql_amp: ($) =>
      seq(
        $.keyword_embedded_sql_amp,
        $.embedded_sql_marker,
        token.immediate('('),
        $.paren_fenced_text,
        token.immediate(')'),
        $.embedded_sql_reverse_marker,
      ),
    // NOTE: We put the marker within the &sql keyword def to make it easier to query for highlighting
    // keyword_embedded_sql_amp: ($) =>
    //   seq(field('non_marker_part', /&sql/i), $.embedded_sql_marker),
    embedded_sql_hash: ($) =>
      seq(
        $.keyword_embedded_sql_hash,
        token.immediate('('),
        $.paren_fenced_text,
        ')',
      ),
    keyword_embedded_sql_amp: (_) => /&sql/i,
    keyword_embedded_sql_hash: (_) => /##sql/i,

    embedded_js: ($) =>
      seq(
        $.keyword_embedded_js,
        token.immediate('<'),
        $.angled_bracket_fenced_text,
        '>',
      ),
    keyword_embedded_js: (_) => /&js/i,

    // Simple parameterized tag/label: tagname(params) - no modifiers, no body
    // Example: bar(a,b=2)
    tag_with_params: ($) =>
      seq(
        $.tag,
        $.parameter_list,
      ),

    // Full procedure definitions: tagname(params) [public_vars] access_modifier { body }
    procedure: ($) =>
      seq(
        $.tag,
        $.parameter_list,
        // Optional public variables list [var1, var2, ...]
        optional(
          seq(
            '[',
            optional(
              seq(
                field('parameter', $.objectscript_identifier),
                repeat(seq(',', field('parameter', $.objectscript_identifier))),
              ),
            ),
            ']',
          ),
        ),
        optional(
          field('keyword', choice(
            $.keyword_public,
            $.keyword_private,
            $.keyword_methodimpl,
          )),
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
        optional(seq('=', $.expression)),
      ),

    post_conditional: ($) =>
      seq(token.immediate(':'), alias($.expression_post_cond, $.expression)),
    ...post_conditional_rules,
  },
});
