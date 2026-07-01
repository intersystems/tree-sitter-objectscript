/**
 * Copyright (c) 2023 by InterSystems.
 * Cambridge, Massachusetts, U.S.A.  All rights reserved.
 * Confidential, unpublished property of InterSystems.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const {
  commaSep1,
  sep1ImmediateOptional,
} = require('../common/define_grammar');

/**
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_relative_dot_fn(commandArgument) {
  return seq(token('..'), commandArgument);
}

/**
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_function_arguments(commandArgument) {
  return choice(
    commandArgument,
    seq(
      optional(commandArgument),
      repeat1(seq(',', optional(commandArgument))),
    ),
  );
}

// Pattern token fragments. We keep `pattern_expression` as a single token
// to avoid parser state growth, and support nested groups up to depth 2.
const PATTERN_REPEAT = '(?:\\d*(?:\\.\\d*)?|\\.)';
const PATTERN_STRING = '"[^"\\r\\n]*(""[^"\\r\\n]*)*"';
const PATTERN_CODES =
  '(?:(?:[ACEULNPaceulnp]+)|(?:[Zz](?:[A-Za-z0-9]*[Zz])?))+';
const PATTERN_ATOM_0 = `(?:${PATTERN_CODES}|${PATTERN_STRING})`;
const PATTERN_SEQ_0 = `(?:(?:${PATTERN_REPEAT})?${PATTERN_ATOM_0})+`;
const PATTERN_GROUP_0 = `\\(${PATTERN_SEQ_0}(?:,${PATTERN_SEQ_0})*\\)`;
const PATTERN_ATOM_1 = `(?:${PATTERN_CODES}|${PATTERN_STRING}|${PATTERN_GROUP_0})`;
const PATTERN_SEQ_1 = `(?:(?:${PATTERN_REPEAT})?${PATTERN_ATOM_1})+`;
const PATTERN_GROUP_1 = `\\(${PATTERN_SEQ_1}(?:,${PATTERN_SEQ_1})*\\)`;
const PATTERN_ATOM_2 = `(?:${PATTERN_CODES}|${PATTERN_STRING}|${PATTERN_GROUP_1})`;
const PATTERN_SEQ_2 = `(?:(?:${PATTERN_REPEAT})?${PATTERN_ATOM_2})+`;
const PATTERN_GROUP_2 = `\\(${PATTERN_SEQ_2}(?:,${PATTERN_SEQ_2})*\\)`;
const PATTERN_ATOM_TOP = `(?:${PATTERN_CODES}|${PATTERN_STRING}|${PATTERN_GROUP_1}|${PATTERN_GROUP_2})`;
const PATTERN_ITEM = `(?:${PATTERN_REPEAT})${PATTERN_ATOM_TOP}+`;
const PATTERN_EXPRESSION_REGEX = new RegExp(
  `[ \\t]*[ \\n]*(?:${PATTERN_ITEM})+`,
);

module.exports = grammar({
  name: 'objectscript_expr',
  precedences: ($) => [
    [$.oref_method, $.oref_property],
    [$.oref_chain_expr, $.expr_atom],
    [$.class_method_call, $.oref_method],
  ],
  conflicts: (_) => [],
  inline: (_) => [],
  rules: {
    source_file: ($) => $.expression, // expr grammar is for expressions only
    expression: ($) => prec.left(seq($.expr_atom, repeat($.expr_tail))),
    expr_atom: ($) =>
      choice(
        $.json_object_literal,
        $.parenthetical_expression,
        $.macro,

        // Literals
        $.string_literal,
        $.numeric_literal,
        $.json_array_literal,

        // Variables
        $.ole_object_reference,
        $.lvn,
        $.gvn,
        $.ssvn,
        $.instance_variable,
        $.sql_field_reference,

        // Builtin functions
        $.system_defined_variable,
        $.system_defined_function,

        // User defined functions
        $.extrinsic_function,

        // ..property/method/parameter references
        $.relative_dot_property,
        $.relative_dot_method,
        $.relative_dot_parameter,
        $.oref_chain_expr,

        // Other special keywords
        $.class_method_call,
        $.superclass_method_call,
        $.unary_expression,
        $.indirection,
      ),

    expr_tail: ($) =>
      prec.left(
        1,
        choice(seq($.binary_operator, $.expression), $.pattern_operator),
      ),

    parenthetical_expression: ($) =>
      seq(alias('(', $.bracket), $.expression, alias(')', $.bracket)),
    unary_operator: (_) => choice('+', '-', '\''),

    // NOTE: ObjectScript operators have the same precendence level (left-associative)
    binary_operator: (_) =>
      choice(
        '**', // Exponentiation
        '*', // Multiplication
        '/', // Division
        '\\', // Integer-division
        '#', // Modulo
        '+', // Addition
        '-', // Subtraction
        '=', // Equality
        '\'=', // Inequality
        '<', // Less than
        '<=', // Less than-or-equal
        '\'>', // Not greater-than (same as <=)
        '>', // Greater than
        '>=', // Greater than-or-equal
        '\'<', // Not less-than (same as >=)
        '\'', // Negation
        '!', // Logical OR
        '||', // Logical OR (short-circuit)
        '\'!', // Not OR
        '&', // Logical AND
        '&&', // Logical AND (short-circuit)
        '\'&', // Not AND
        '_', // Concatenate
        ']', // Follows
        '\']', // Not follows
        '[', // Contains
        '\'[', // Not contains
        ']]', // Sorts-after
        '\']]', // Not Sorts-after
      ),
    pattern_operator: ($) =>
      seq(
        choice('?', '\'?'),
        choice(
          $.indirection, // ? @var
          $.pattern_expression, // ?<pattern>
        ),
      ),

    pattern_expression: (_) => token.immediate(PATTERN_EXPRESSION_REGEX),

    class_method_call: ($) =>
      prec.right(
        seq(
          $.class_ref,
          token.immediate('.'),
          alias($._member_name, $.method_name),
          $.method_args,
        ),
      ),
    class_ref: ($) =>
      seq(
        $.keyword_pound_pound_class,
        alias(token.immediate('('), $.bracket),
        alias($._quote_permitting_identifier, $.class_name),
        alias(token.immediate(')'), $.bracket),
        optional(
          // Class cast syntax
          choice(
            $.parenthetical_expression,
            $.lvn,
            alias(/\$THIS/i, $.system_defined_function),
          ),
        ),
      ),

    keyword_pound_pound_class: (_) => /##CLASS/i,
    superclass_method_call: ($) =>
      seq($.keyword_pound_pound_super, $.method_args),
    keyword_pound_pound_super: (_) => /##SUPER/i,

    extrinsic_function: ($) =>
      // $$tag^rtn or $$@var
      prec.left(seq('$$', $._extrinsic_reference, optional($.method_args))),

    _extrinsic_named_ref: ($) =>
      prec.right(
        seq(
          $._base_variable,
          optional($.label_offset),
          optional($.routine_ref),
        ),
      ),
    _extrinsic_indirect_ref: ($) =>
      prec.right(seq($.indirection, optional($.routine_ref))),
    _extrinsic_reference: ($) =>
      choice(
        alias($._extrinsic_named_ref, $.line_ref),
        alias($.routine_ref, $.line_ref),
        alias($._extrinsic_indirect_ref, $.line_ref),
      ),

    line_ref: ($) =>
      choice(
        // label+offset+routine, label+routine, numeric+offset+routine, etc.
        seq(
          optional(choice('+', '-')),
          choice($._base_variable, $.numeric_literal),
          choice($.routine_ref, seq($.label_offset, optional($.routine_ref))),
        ),
        // routine only (^routine)
        seq($.routine_ref),
        // Full indirection, optionally followed by ^routine or ^@(...)
        prec.right(seq($.indirection, optional($.routine_ref))),
      ),
    label_offset: ($) => seq(token.immediate('+'), $.expression),
    _routine_ref_indirection: ($) =>
      prec.right(
        seq(
          token.immediate('@'),
          $.parenthetical_expression,
          optional(seq(token.immediate('@'), $.method_args)),
        ),
      ),

    dollarsf: ($) =>
      prec.right(
        seq(
          token(seq(/\$SYSTEM/i, token.immediate('.'))),
          $._base_variable_immediate,
          token.immediate('.'),
          $._base_variable_immediate,
          choice($.method_args, repeat1($.oref_chain_segment)),
        ),
      ),

    method_args: ($) =>
      seq(
        alias(token.immediate('('), $.bracket),
        optional($._method_arg_list),
        alias(')', $.bracket),
      ),
    _method_arg_list: ($) => build_function_arguments($.method_arg),
    method_arg: ($) => choice($.expression, $.byref_arg, $.variadic_arg),
    byref_arg: ($) =>
      seq(
        '.',
        choice(
          $.lvn,
          $.indirection,
          $.instance_variable,
          $.system_defined_variable,
        ),
      ),
    variadic_arg: ($) =>
      seq(choice($.lvn, $.json_object_literal), token.immediate('...')),

    glvn: ($) => choice($.gvn, $.lvn, prec(-1, $.ssvn), prec.right(1, $.macro)),
    gvn: ($) =>
      prec.right(
        seq(
          '^',
          optional($._global_reference_prefix),
          optional(
            token.immediate(
              /(?:\$\$\$)?[%A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/,
            ),
          ),
          optional($.method_args),
        ),
      ),
    _global_reference_prefix: ($) =>
      choice(
        token.immediate('||'),
        seq(token.immediate('|'), $._expression_list, '|'),
        seq(token.immediate('['), $._expression_list, ']'),
      ),
    routine_ref: ($) =>
      seq(
        token.immediate('^'),
        choice(
          alias($._routine_ref_indirection, $.indirection),
          seq(
            optional($._routine_ref_prefix),
            choice(
              $.system_defined_function,
              alias($.identifier, $.routine_name),
            ),
          ),
        ),
      ),
    _routine_ref_prefix: ($) =>
      choice(
        token.immediate('||'),
        prec(1, token.immediate('@')),
        seq(
          optional(token.immediate('$')),
          token.immediate('|'),
          $._routine_ref_namespace,
          token.immediate('|'),
        ),
      ),

    _routine_ref_namespace: ($) =>
      seq(
        repeat(choice('+', '-', '\'')),
        choice($.lvn, $.string_literal, $.system_defined_variable),
      ),
    lvn: ($) => prec.right(seq($._base_variable, optional($.method_args))),
    ssvn: ($) =>
      prec.right(
        seq(
          '^$',
          optional($._global_reference_prefix),
          $._base_variable_immediate,
          optional($.method_args),
        ),
      ),
    sql_field_reference: ($) =>
      // For triggers, SQLComputeCode etc.
      prec(
        -1,
        seq(
          '{',
          choice(
            token.immediate('*'),
            seq(
              $.sql_field_identifier,
              repeat(seq(token.immediate('_'), $.sql_field_identifier)),
              optional(
                seq(
                  // Access the [O]ld and [N]ew values or if it was [C]hanged
                  token.immediate('*'),
                  $.sql_field_modifier,
                ),
              ),
            ),
          ),
          token.immediate('}'),
        ),
      ),
    sql_field_modifier: (_) => token.immediate(/[ONC]/),
    sql_field_identifier: (_) =>
      choice(
        /[%A-Za-z][A-Za-z0-9]*/,
        seq(
          '"',
          repeat(
            choice(
              /[^"\\*:\n]/, // disallow colon inside (key JSON disambiguation)
              /\\["\\/bfnrt]/,
              /\\u[0-9a-fA-F]{4}/,
            ),
          ),
          '"',
        ),
      ),

    // When we have an expression like oref.a.b.c, we can't just
    // use a repeat('.',...) because the interior elements might be
    // a mix of properties and methods, for example:
    //
    //   oref.a.b().c     ; a=prop,b=method/multidim/c=method
    //   oref.a.b.c()     ; a,b=prop,c=method/multidim
    //   oref.a().b.#C    ; a=method/multidim,b=prop,c=parameter
    //
    // Methods and multidims are hard to differentiate:
    //   oref.a()         ; method as multidim must have subscripts
    //   oref.a(b)        ; could be either
    //   oref.a(.b)       ; method, multidim can't have a byref
    //   oref.a(b...)     ; method, multidim can't be variadic

    oref_chain_expr: ($) =>
      prec.right(
        2,
        seq(
          choice(
            $.lvn,
            $.macro,
            $.instance_variable,
            $.relative_dot_property,
            $.relative_dot_method,
            $.system_defined_function,
            $.system_defined_variable,
            $.extrinsic_function,
            $.parenthetical_expression,
            $.json_object_literal,
            $.json_array_literal,
            $.class_ref,
            $._ole_server_name,
            $.class_method_call,
          ),
          repeat1($.oref_chain_segment),
        ),
      ),

    oref_chain_segment: ($) =>
      seq(
        token.immediate('.'),
        choice($.oref_property, $.oref_method, $.oref_parameter),
      ),

    oref_method: ($) =>
      seq(alias($._member_name, $.method_name), $.method_args),
    oref_property: ($) =>
      // NOTE: Since a multidimensional property is indistinguishable from a method
      //       call (unless it's byref or has variadic args) we'll almost never match
      //       the subscripts clause.
      alias($._member_name, $.property_name),

    instance_variable: ($) =>
      prec.right(
        seq(
          token(/[irms]\%/i),
          alias($._member_name, $.property_name),
          optional($.method_args),
        ),
      ),
    _quoted_member_name: ($) =>
      seq(token.immediate('"'), alias(/((?:""|[^"])*)/, $.identifier), '"'),
    _member_name: ($) =>
      choice($._quoted_member_name, $._base_variable_immediate),
    oref_parameter: ($) =>
      seq(token.immediate('#'), alias($._member_name, $.parameter_name)),
    relative_dot_method: ($) => build_relative_dot_fn($.oref_method),
    relative_dot_property: ($) => build_relative_dot_fn($.oref_property),
    relative_dot_parameter: ($) => build_relative_dot_fn($.oref_parameter),
    namespace_token: (_) => token(/\$NAMESPACE/i),
    estack_token: (_) => token(/\$ES(TACK)?/i),
    etrap_token: (_) => token(/\$ET(RAP)?/i),
    roles_token: (_) => token(/\$ROLES/i),

    system_defined_variable: (_) =>
      prec(
        -1,
        token(
          choice(
            /\$ZW/i,
            /\$mviostatus/i,
            /\$mvioerror/i,
            /\$MVLOCKLIST/i,
            /\$D(EVICE)?/i, // $DEVICE
            /\$EC(ODE)?/i, // $ECODE
            /\$edetail/i,
            /\$ES(TACK)?/i, // $ESTACK
            /\$ET(RAP)?/i, // $ETRAP
            /\$HALT/i, // $HALT
            /\$H(OROLOG)?/i, // $HOROLOG
            /\$I(O)?/i, // $IO
            /\$J(OB)?/i, // $JOB
            /\$K(EY)?/i, // $KEY
            /\$NAMESPACE/i, // $NAMESPACE
            /\$P(RINCIPAL)?/i, // $P[RINCIPAL] conflicts with $P[IECE]
            /\$Q(UIT)?/i, // $QUIT
            /\$ROLES/i, // $ROLES
            /\$ST(ACK)?/i, // $STACK conflits with $STACK()
            /\$S(TORAGE)?/i, // $S[TORAGE] conflicts with $S[ELECT]
            /\$SY(STEM)?/i, // $SYSTEM
            /\$T(EST)?/i, // $TEST
            /\$THIS/i, // $THIS
            /\$mvam/i,
            /\$MVANS/i,
            /\$MVCOMMAND/i,
            /\$MVCONV/i,
            /\$MVDATE/i,
            /\$MVDAY/i,
            /\$MVDICT/i,
            /\$MVERRORS/i,
            /\$MVFILENAME/i,
            /\$MVFM/i,
            /\$MVFOOTER/i,
            /\$MVFORMAT/i,
            /\$MVHEADER/i,
            /\$MVID/i,
            /\$MVLEVEL/i,
            /\$MVMONTH/i,
            /\$MVMORESUBVALUES/i,
            /\$MVMOREVALUES/i,
            /\$MVNB/i,
            /\$MVND/i,
            /\$MVNI/i,
            /\$MVNS/i,
            /\$MVNV/i,
            /\$MVOPTIONS/i,
            /\$MVPROCNAME/i,
            /\$MVPROCERRORS/i,
            /\$MVPARASENTENCE/i,
            /\$MVPROCPIB/i,
            /\$MVPROCPIBOFF/i,
            /\$MVPROCPOB/i,
            /\$MVPROCSIB/i,
            /\$MVPROCSIBOFF/i,
            /\$MVPROCSOB/i,
            /\$MVRECORD/i,
            /\$MVSELECTED/i,
            /\$MVSENTENCE/i,
            /\$MVSM/i,
            /\$MVSTDFIL/i,
            /\$MVSVM/i,
            /\$MVSYSRETCODE/i,
            /\$MVTIME/i,
            /\$MVTM/i,
            /\$MVTTY/i,
            /\$MVUSERRETCODE/i,
            /\$MVVM/i,
            /\$MVYEAR/i,
            /\$TID/i,
            /\$TRESTART/i,
            /\$TRS/i,
            /\$ZL/i,
            /\$ZLS/i,
            /\$ZNODE/i,
            /\$ZPIECE/i,
            /\$THROWOBJ/i, // $THROWOBJ
            /\$TL(EVEL)?/i, // $TLEVEL
            /\$USERNAME/i, // $USERNAME
            /\$X/i, // $X
            /\$Y/i, // $Y
            /\$ZA/i, // $ZA
            /\$ZB/i, // $ZB
            /\$ZC(HILD)?/i, // $ZCHILD
            /\$ZEOF/i, // $ZEOF
            /\$ZEOS/i, // $ZEOS
            /\$ZE(RROR)?/i, // $ZERROR
            /\$ZH(OROLOG)?/i, // $ZHOROLOG
            /\$ZI(O)?/i, // $ZIO
            /\$ZJ(OB)?/i, // $ZJOB
            /\$ZM(ODE)?/i, // $ZMODE
            /\$ZN(AME)?/i, // $ZNAME
            /\$ZNSPACE/i, // $ZNSPACE
            /\$ZO(RDER)?/i, // $ZORDER
            /\$ZP(ARENT)?/i, // $ZPARENT
            /\$ZPI/i, // $ZPI
            /\$ZPOS(ITION)?/i, // $ZPOSITION
            /\$ZR(EFERENCE)?/i, // $ZREFERENCE
            /\$ZS(TORAGE)?/i, // $ZSTORAGE
            /\$ZTIMESTAMP/i,
            /\$ZTS/i,
            /\$ZTIMEZONE/i,
            /\$ZTZ/i,
            /\$ZT(RAP)?/i, // $ZTRAP
            /\$ZV(ERSION)?/i, // $ZVERSION
          ),
        ),
      ),
    system_defined_function: ($) =>
      choice(
        // Keep specialized rules before generic dollar_function to avoid conflicts.
        $.dollar_list,
        $.built_in_func_with_pos_options,
        $.dollar_case,
        $.dollar_select,
        $.dollar_bitlogic,
        $.dollar_method,
        $.dollar_text,
        $.dollarsf,
        $.dollar_function,
        $.dollar_mv,
      ),

    dollar_text: ($) =>
      seq(
        // $T or $TEXT, followed by '(' with no space
        token(seq(/\$T(EXT)?/i, token.immediate('('))),
        $._text_line_ref,
        ')',
      ),

    _text_line_ref: ($) =>
      choice(
        prec(1, $.line_ref),
        alias($._base_variable, $.line_ref),
        alias($._numeric_line_ref, $.line_ref),
      ),
    _numeric_line_ref: ($) => $.numeric_literal,
    dollar_bitlogic: ($) =>
      seq(
        /\$BITLOGIC/i,
        token.immediate('('),
        $.bitlogic_expression,
        optional(seq(',', $.expression)), // length/flags arg
        ')',
      ),

    bitlogic_expression: ($) =>
      prec.left(
        seq(
          optional('~'),
          $.bitlogic_atom,
          repeat(seq(choice('&', '|', '^'), optional('~'), $.bitlogic_atom)),
        ),
      ),

    bitlogic_atom: ($) =>
      choice(
        // nested bitlogic parens
        seq(
          alias(token.immediate('('), $.bracket),
          $.bitlogic_expression,
          alias(')', $.bracket),
        ),
        // reuse existing atoms (functions, vars, calls, strings, numbers, etc.)
        $.expr_atom,
      ),
    dollar_mv: ($) =>
      seq(
        token(seq(/\$MV(AT)?/i, token.immediate('('))),
        optional(
          build_function_arguments(choice($.method_arg, $.dollar_arg_opt)),
        ),
        ')',
      ),

    dollar_function: ($) =>
      seq(
        token(
          seq(
            choice(
              /\$zobjoid/i,
              /\$zobjval/i,
              /\$zu(til)?/i,
              /\$zli(st)?/i,
              /\$zobjmod(s)?/i,
              /\$ZDATETIMEH/i,
              /\$ZDTH/i,
              /\$ZDATEH/i,
              /\$ZDH/i,
              /\$ZDATETIME/i,
              /\$ZDT/i,
              /\$ZDATE/i,
              /\$ZD/i,
              /\$ZTIMEH/i,
              /\$ZTH/i,
              /\$NUM(BER)?/i,
              /\$FN(UMBER)?/i,
              /\$LISTBUILD/i,
              /\$LB/i,
              /\$LISTTOSTRING/i,
              /\$LTS/i,
              /\$LISTFROMSTRING/i,
              /\$LFS/i,
              /\$V(IEW)?/i,
              /\$LISTDATA/i,
              /\$LD/i,
              /\$ZT(IME)?/i,
              /\$zobjcnt/i,
              /\$zobjref/i,
              /\$zel(ement)?/i,
              /\$zlts/i,
              /\$zle(NGTH)/i,
              /\$zlp/i,
              /\$zobjexport/i,
              /\$BIT/i,
              /\$D(ATA)?/i,
              choice(/\$LISTSAME/i, /\$LS/i),
              /\$MATCH/i,
              /\$NORMALIZE/i,
              /\$QS(UBSCRIPT)?/i,
              /\$ZBITAND/i,
              /\$ZBITCOUNT/i,
              /\$ZPOWER/i,
              /\$BITCOUNT/i,
              /\$BITFIND/i,
              /\$C(HAR)?/i,
              /\$WC(HAR)?/i,
              /\$ZF/i,
              /\$XECUTE/i,
              /\$A(SCII)?/i,
              /\$ZO(RDER)?/i, // $ZORDER
              /\$BP/i,
              /\$CE/i,
              /\$ZR/i,
              /\$ZP/i,
              /\$ZVD(ATA)?/i,
              /\$ZVO(RDER)?/i,
              /\$ZVQ(UERY)?/i,
              /\$ZUNION/i,
              /\$ZRV/i,
              /\$CHANGE/i,
              /\$ZPD/i,
              /\$CL/i,
              /\$ZPI/i,
              /\$EL/i,
              /\$EP/i,
              /\$ZPL/i,
              /\$ZPFV/i,
              /\$EPI/i,
              /\$INDEX/i,
              /\$ZPF/i,
              /\$INDEXNUM/i,
              /\$ZOBJNEW/i,
              /\$INDEXNEW/i,
              /\$INDEXPASS/i,
              /\$ZOBJNEXT/i,
              /\$ZOBJINT/i,
              /\$ZOBJID/i,
              /\$ZOBJKILLOID/i,
              /\$ZOBJPARAM/i,
              /\$ZOBJINCREF/i,
              /\$ZOBJGETOID/i,
              /\$INDEXREF/i,
              /\$ZOBJSTATE/i,
              /\$INDEXSAVE/i,
              /\$INDEXSORT/i,
              /\$INDEXSTART/i,
              /\$INDEXVAL/i,
              /\$MVCVTNUM/i,
              /\$MVFMT/i,
              /\$MVICONV/i,
              /\$MVICONVS/i,
              /\$ZPM/i,
              /\$MVINMAT/i,
              /\$MVLOWER/i,
              /\$MVOCONV(s)?/i,
              /\$MVRAISE/i,
              /\$MVTRANS/i,
              /\$ZOBJPURGE/i,
              /\$MVV/i,
              /\$N(ext)?/i,
              /\$U2NULL/i,
              /\$ZCOMP/i,
              /\$ZDIFF/i,
              /\$ZDSWAP/i,
              /\$ZEXTRACT/i,
              /\$ZSR/i,
              /\$ZGROUP/i,
              /\$ZINCR(EMENT)?/i,
              /\$ZISECT/i,
              /\$ZISWIDE/i,
              /\$ZJ(OB)?/i,
              /\$ZLCHK/i,
              /\$ZLSWAP/i,
              /\$zne(xt)?/i,
              /\$ZNS/i,
              /\$ZOBJDECREF/i,
              /\$ZPREVIOUS/i,
              /\$ZQSWAP/i,
              /\$ZWSWAP/i,
              /\$ZSET/i,
              /\$ZS(ORT)?/i,
              /\$ZSU(BLIST)?/i,
              /\$DECIMAL/i,
              /\$FACTOR/i,
              /\$G(ET)?/i,
              /\$L(ENGTH)?/i,
              /\$NA(ME)?/i,
              /\$ST(ACK)?/i,
              /\$WA(SCII)?/i,
              /\$ZDA(SCII)?/i,
              /\$ZLA(SCII)?/i,
              /\$ZQA(SCII)?/i,
              /\$ZSEEK/i,
              /\$ZWA(SCII)?/i,
              /\$ZWIDTH/i,
              /\$CLASSNAME/i,
              /\$NOW/i,
              /\$COMPILE/i,
              /\$DOUBLE/i,
              /\$ISO(BJECT)?/i,
              /\$ISVECTOR/i,
              choice(/\$LISTLENGTH/i, /\$LL/i),
              choice(/\$LISTVALID/i, /\$LV/i),
              /\$QL(ENGTH)?/i,
              /\$RE(VERSE)?/i,
              /\$T(EXT)?/i,
              /\$WISWIDE/i,
              /\$WL(ENGTH)?/i,
              /\$WRE(VERSE)?/i,
              /\$WF(IND)?/i,
              /\$ZABS/i,
              /\$ZARCCOS/i,
              /\$ZARCSIN/i,
              /\$ZARCTAN/i,
              /\$ZCOS/i,
              /\$ZCOT/i,
              /\$ZCSC/i,
              /\$ZC(YC)?/i,
              /\$ZDC(HAR)?/i,
              /\$ZEXP/i,
              /\$ZH(EX)?/i,
              /\$ZI(SWIDE)/i,
              /\$ZLC(HAR)?/i,
              /\$ZLN/i,
              /\$ZLOG/i,
              /\$ZQC(HAR)?/i,
              /\$ZSE(ARCH)?/i,
              /\$ZSEC/i,
              /\$ZSI(N)?/i,
              /\$ZSQR/i,
              /\$zstl/i,
              /\$ZTAN/i,
              /\$ZWC(HAR)?/i,
              /\$ZWPACK/i,
              /\$ZWBPACK/i,
              /\$ZWUNPACK/i,
              /\$ZWBUNPACK/i,
              /\$F(IND)?/i,
              /\$IN(UMBER)?/i,
              /\$J(USTIFY)?/i,
              /\$NC(ONVERT)?/i,
              /\$VE(CTOR)?/i,
              choice(/\$VECTORDEFINED/i, /\$VD/i),
              choice(/\$VECTOROP/i, /\$VOP/i),
              /\$TR(ANSLATE)?/i,
              /\$ZCRC/i,
              /\$ZPOSITION/i,
              /\$ZNAME/i,
              /\$ZZENKAKU/i,
              /\$I(NCREMENT)?/i,
              /\$ISVALIDDOUBLE/i,
              /\$ISVALIDNUM/i,
              /\$LISTNEXT/i,
              choice(/\$LISTFIND/i, /\$LF/i),
              /\$ZB(OOLEAN)?/i,
              /\$LOCATE/i,
              /\$PREPROCESS/i,
              /\$O(RDER)?/i,
              /\$PARAMETER/i,
              /\$PREFETCHOFF/i,
              /\$PREFETCHON/i,
              /\$PROPERTY/i,
              /\$Q(UERY)?/i,
              /\$R(ANDOM)?/i,
              /\$SEQ(UENCE)?/i,
              /\$REPLACE/i,
              /\$SC(ONVERT)?/i,
              choice(/\$ZCONVERT/i, /\$ZCVT/i),
              /\$ZSTRIP/i,
              /\$SORTBEGIN/i,
              /\$SORTEND/i,
              /\$ZBITFIND/i,
              /\$ZBITGET/i,
              /\$ZBITLEN/i,
              /\$ZBITNOT/i,
              /\$ZBITOR/i,
              /\$ZBITSET/i,
              /\$ZBITSTR/i,
              /\$ZBITXOR/i,
              /\$ZOBJCLASS/i,
              /\$ZOBJPROPERTY/i,
              /\$ZV(ERSION)?/i, // $ZVERSION
            ),
            token.immediate('('),
          ),
        ),
        optional($._method_arg_list),
        ')',
      ),
    dollar_select: ($) =>
      prec.right(
        seq(
          token(seq(/\$S(ELECT)?/i, token.immediate('('))),
          commaSep1(seq($.dollar_arg_pair)),
          ')',
        ),
      ),
    dollar_case: ($) =>
      seq(
        token(seq(/\$CASE/i, token.immediate('('))),
        $.expression,
        choice(
          seq(
            repeat1(seq(',', $.dollar_arg_pair)),
            optional(seq(',', ':', choice($.expression))),
          ),
          seq(',', ':', $.expression, optional($.method_args)),
        ),
        ')',
      ),
    _dollar_list_args: ($) =>
      build_function_arguments(
        choice($.method_arg, $.dollar_func_pos, $.dollar_arg_pair),
      ),
    dollar_list: ($) =>
      seq(
        token(
          seq(
            choice(/\$LI(ST)?/i, /\$LISTUPDATE/i, /\$LU/i),
            token.immediate('('),
          ),
        ),
        $._dollar_list_args,
        ')',
      ),
    built_in_func_with_pos_options: ($) =>
      seq(
        token(
          seq(
            choice(
              /\$LISTGET/i,
              /\$LG/i,
              /\$P(IECE)?/i,
              /\$E(XTRACT)?/i,
              /\$WE(XTRACT)?/i,
            ),
            token.immediate('('),
          ),
        ),
        optional($._dollar_pos_method_arg_list),
        ')',
      ),
    dollar_arg_opt: ($) => sep1ImmediateOptional($.numeric_literal, ':'),
    _dollar_pos_method_arg_list: ($) =>
      choice(
        choice($.method_arg, $.dollar_func_pos, $.dollar_arg_opt),
        seq(
          optional($.method_arg),
          repeat1(
            seq(
              ',',
              optional(
                choice($.method_arg, $.dollar_func_pos, $.dollar_arg_opt),
              ),
            ),
          ),
        ),
      ),
    dollar_method: ($) =>
      seq(
        token(choice(/\$(ZOBJ)?METHOD/i, /\$(ZOBJ)?CLASSMETHOD/i)),
        alias(token.immediate('('), $.bracket),
        optional($._method_arg_list),
        alias(')', $.bracket),
      ),
    dollar_arg_pair: ($) => seq($.expression, ':', $.expression),
    dollar_func_pos: ($) =>
      seq('*', optional(seq(choice('-', '+'), $.expression))),
    unary_expression: ($) => seq($.unary_operator, $.expression),

    indirection: ($) =>
      prec.right(
        seq(
          '@',
          $.expression,
          optional(seq(token.immediate('@'), $.method_args)),
        ),
      ),

    _ole_server_name: ($) => seq('_', $._base_variable_immediate),
    ole_object_reference: ($) =>
      prec.right(
        seq(
          $._ole_server_name,
          token.immediate('!'),
          $._base_variable_immediate,
          repeat($.oref_chain_segment),
        ),
      ),
    // rules that can be reused:
    // dotted_identifier_relaxed_token: (_) => token(DOTTED_ID_RELAXED), // routines only
    objectscript_identifier_special: (_) => /\%[A-Za-z0-9]*/,
    identifier_segment_immediate_special: (_) =>
      token.immediate(/\%[A-Za-z0-9]*/),
    identifier_segment_immediate: (_) =>
      token.immediate(/[A-Za-z][A-Za-z0-9]*/),
    objectscript_identifier: (_) => /[A-Za-z][A-Za-z0-9]*/,
    _base_variable_immediate: ($) =>
      choice(
        alias(
          $.identifier_segment_immediate_special,
          $.objectscript_identifier_special,
        ),
        alias($.identifier_segment_immediate, $.objectscript_identifier),
      ),
    _base_variable: ($) =>
      choice($.objectscript_identifier, $.objectscript_identifier_special),
    numeric_literal: (_) =>
      token(
        /[+-]?(?:\d+\.\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|\d+(?:[eE][+-]?\d+)?)/,
      ),
    // any length sequence of characters besides ", between "
    // Double-quotes are escaped with double quotes
    string_literal: (_) => token(seq('"', repeat(choice(/[^"]+/, '""')), '"')),
    macro: ($) => choice($.macro_function, $.macro_constant),
    macro_constant: (_) => token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)),
    macro_function: ($) =>
      prec(
        1,
        prec.right(
          seq(
            token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)),
            $.method_args,
            optional($.method_args),
          ),
        ),
      ),

    json_object_literal: ($) =>
      prec(2, seq('{', optional(commaSep1($.json_object_literal_pair)), '}')),
    json_object_literal_pair: ($) =>
      seq(
        $.json_string_literal,
        ':',
        choice($.json_literal, $.json_objectscript_expr),
      ),
    json_objectscript_expr: ($) => seq('(', $.expression, ')'),
    json_literal: ($) =>
      choice(
        $.json_object_literal,
        $.json_string_literal,
        $.json_number_literal,
        $.json_array_literal,
        $.json_boolean_literal,
        $.json_null_literal,
      ),
    json_array_literal: ($) =>
      seq(
        '[',
        optional(commaSep1(choice($.json_literal, $.json_objectscript_expr))),
        ']',
      ),
    json_string_literal: (_) =>
      token(
        seq(
          '"',
          repeat(choice(/[^"\\\n]/, /\\["\\/bfnrt]/, /\\u[0-9a-fA-F]{4}/)),
          '"',
        ),
      ),
    json_number_literal: (_) => token(/-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/),
    json_boolean_literal: (_) => choice('true', 'false'),
    json_null_literal: (_) => 'null',
    identifier: (_) => /[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z0-9][A-Za-z0-9]*)*/,
    _expression_list: ($) => commaSep1($.expression),
    _quote_permitting_identifier: ($) =>
      choice(
        seq('"', alias(/((?:""|[^"])*)/, $.identifier), '"'),
        $.identifier,
      ),
  },
});
