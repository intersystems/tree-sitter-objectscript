/**
 * Copyright (c) 2023 by InterSystems.
 * Cambridge, Massachusetts, U.S.A.  All rights reserved.
 * Confidential, unpublished property of InterSystems.
 */


/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const {
  commaSep1,
} = require('../common/define_grammar');

const {DOTTED_ID_STRICT, DOTTED_ID_RELAXED} = require('../common/identifiers');

// Pattern token fragments. We keep `pattern_expression` as a single token
// to avoid parser state growth, and support nested groups up to depth 2.
const PATTERN_REPEAT = '(?:\\d*(?:\\.\\d*)?|\\.)';
const PATTERN_STRING = '"[^"\\r\\n]*(""[^"\\r\\n]*)*"';
const PATTERN_CODES = '(?:(?:[ACEULNPaceulnp]+)|(?:[Zz](?:[A-Za-z0-9]*[Zz])?))+';
const PATTERN_ATOM_0 = `(?:${PATTERN_CODES}|${PATTERN_STRING})`;
const PATTERN_SEQ_0 = `(?:(?:${PATTERN_REPEAT})?${PATTERN_ATOM_0})+`;
const PATTERN_GROUP_0 = `\\(${PATTERN_SEQ_0}(?:,${PATTERN_SEQ_0})*\\)`;
const PATTERN_ATOM_1 = `(?:${PATTERN_CODES}|${PATTERN_STRING}|${PATTERN_GROUP_0})`;
const PATTERN_SEQ_1 = `(?:(?:${PATTERN_REPEAT})?${PATTERN_ATOM_1})+`;
const PATTERN_GROUP_1 = `\\(${PATTERN_SEQ_1}(?:,${PATTERN_SEQ_1})*\\)`;
const PATTERN_ATOM_TOP = `(?:${PATTERN_CODES}|${PATTERN_STRING}|${PATTERN_GROUP_1})`;
const PATTERN_ITEM = `(?:${PATTERN_REPEAT})${PATTERN_ATOM_TOP}+`;
const PATTERN_EXPRESSION_REGEX = new RegExp(`[ \\t]*[ \\n]*(?:${PATTERN_ITEM})+`);

module.exports = grammar({
  name: 'objectscript_expr',
  precedences: ($) => [
    [$.oref_method, $.oref_property],
    [$.method_arg, $.subscripts],
    [$.oref_chain_expr, $.expr_atom],
    [$.class_method_call, $.oref_method],

  ],
  conflicts: ($) => [
    [$.line_ref, $.lvn],
  ],
  inline: (_) => [

  ],
  rules: {
    source_file: ($) => $.expression, // expr grammar is for expressions only
    expression: ($) =>
      prec.left(
        seq(
          $.expr_atom,
          repeat($.expr_tail),
        ),
      ),
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
        choice(
          seq(
            $.binary_operator,
            $.expression,
          ),
          $.pattern_operator,
        ),
      ),

    parenthetical_expression: ($) => seq( alias('(', $.bracket), $.expression, alias(')', $.bracket)),
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

    pattern_expression: _ =>
      token.immediate(PATTERN_EXPRESSION_REGEX),

    class_method_call: ($) =>
      seq(
        $.class_ref,
        token.immediate('.'),
        alias($.member_name, $.method_name),
        $.method_args,
      ),
    class_ref: ($) =>
      seq(
        $.keyword_pound_pound_class,
        alias(token.immediate('('), $.bracket),
        $.class_name,
        alias(token.immediate(')'), $.bracket),
        optional(
          // Class cast syntax
          choice(
            $.parenthetical_expression,
            $.lvn,
          ),
        ),
      ),

    keyword_pound_pound_class: (_) => /##CLASS/i,
    class_name: (_) =>
      choice(
        // quoted class name
        seq(
          token.immediate('"'),
          repeat(choice(/[^"]+/, token.immediate('""'))),
          '"',
        ),
        // unquoted: each segment starts with letter or %
        token.immediate(/[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/),
      ),
    superclass_method_call: ($) =>
      seq(
        $.keyword_pound_pound_super,
        $.method_args,
      ),
    keyword_pound_pound_super: (_) => /##SUPER/i,

    extrinsic_function: ($) =>
    // $$tag^rtn or $$@var
      choice(
        // Standard line reference with optional method args
        prec.left(seq('$$', $._extrinsic_reference, optional($.method_args))),
        // Full indirection - no method args, as @var evaluates the expression
        prec.right(seq(
          '$$',
          $.indirection,
          optional($.method_args),
        )),
      ),
    _extrinsic_reference: ($) =>
      prec.left(choice(
        // label+offset+routine or label+routine or label only
        seq(
          choice($.objectscript_identifier, $.objectscript_identifier_special),
          optional($.label_offset),
          optional($.routine_ref),
        ),
        // routine only (^routine)
        $.routine_ref,
      )),

    line_ref: ($) => choice(
      // label+offset+routine or label+routine or label only
      seq(
        optional(choice('+', '-')),
        choice($.objectscript_identifier, $.objectscript_identifier_special, $.numeric_literal),
        optional($.label_offset),
        optional($.routine_ref),
      ),
      // routine only (^routine)
      seq(
        $.routine_ref,
      ),
      // Full indirection
      seq(
        $.indirection,
        optional($.routine_ref),
      ),
      seq(
        $.indirection,
        token.immediate('^'),
        $.indirection,
      ),
    ),
    label_offset: ($) =>
      seq(
        token.immediate('+'),
        $.expression,
      ),
    routine_ref: ($) =>
      seq(token.immediate('^'),
        optional($._routine_ref_prefix),
        choice(
          $.system_defined_function,
          alias($.dotted_identifier_relaxed_token, $.routine_name)),
      ),
    _routine_ref_prefix: ($) =>
      choice(
        token.immediate('||'),
        token.immediate('@'),
        seq(token.immediate('|'), $._routine_ref_namespace, token.immediate('|')),
      ),
    _routine_ref_namespace: ($) =>
      seq(
        repeat(choice('+', '-', '\'')),
        choice(alias($.objectscript_identifier, $.lvn), alias($.objectscript_identifier_special, $.lvn), $.string_literal),
      ),


    dollarsf: ($) =>
      prec.right(seq(
        token(seq(
          /\$SYSTEM/i,
          token.immediate('.'),
        )),
        choice(
          $.objectscript_identifier,
          $.objectscript_identifier_special,
        ),
        token.immediate('.'),
        choice(
          $.objectscript_identifier,
          $.objectscript_identifier_special,
        ),
        choice(
          $.method_args,
          repeat1($.oref_chain_segment),
        ),
      )),


    method_args: ($) =>
      seq(
        alias(token.immediate('('), $.bracket),
        optional($._method_arg_list),
        alias(')', $.bracket),
      ),
    _method_arg_list: ($) =>
      choice(
        $.method_arg,
        seq(
          optional($.method_arg),
          repeat1(
            seq(
              ',',
              optional($.method_arg),
            ),
          ),
        ),
      ),
    method_arg: ($) =>
      choice(
        $.expression,
        $.byref_arg,
        $.variadic_arg,
      ),
    byref_arg: ($) =>
      seq(
        '.',
        $.lvn,
      ),
    variadic_arg: ($) =>
      seq(
        $.lvn,
        token.immediate('...'),
      ),

    glvn: ($) => choice($.gvn, $.lvn, prec(-1, $.ssvn), prec.right(1, $.macro)),
    gvn: ($) =>
      prec.right(
        seq(
          '^',
          optional($._global_reference_prefix),
          optional(token.immediate(/(?:\$\$\$)?[%A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/)),
          optional($.subscripts),
        ),
      ),
    _global_reference_prefix: ($) =>
      choice(
        token.immediate('||'),
        seq(token.immediate('|'), $._global_reference_namespace, '|'),
        seq(token.immediate('['), $._global_reference_namespace, ']'),
      ),
    _global_reference_namespace: ($) =>
      seq(
        $._global_reference_primary_namespace,
        optional(seq(',', $._global_reference_secondary_namespace)),
      ),
    _global_reference_primary_namespace: ($) =>
      seq(
        repeat(choice('+', '-', '\'')),
        choice($.objectscript_identifier, $.objectscript_identifier_special, $.string_literal),
      ),
    _global_reference_secondary_namespace: ($) =>
      seq(
        repeat(choice('+', '-', '\'')),
        choice($.objectscript_identifier, $.string_literal),
      ),
    lvn: ($) => prec.right(seq(choice($.objectscript_identifier, $.objectscript_identifier_special), optional($.subscripts))),
    ssvn: ($) =>
      prec.right(
        seq(
          '^$',
          choice(
            $.identifier_segment_immediate,
            $.identifier_segment_immediate_special,
          ),
          optional($.subscripts),
        ),
      ),
    sql_field_reference: ($) =>
    // For triggers, SQLComputeCode etc.
      prec(-1, seq(
        '{',
        choice(
          token.immediate('*'),
          seq(
            $.sql_field_identifier,
            repeat(
              seq(
                token.immediate('_'),
                $.sql_field_identifier,
              ),
            ),
            optional(seq(
              // Access the [O]ld and [N]ew values or if it was [C]hanged
              token.immediate('*'),
              $.sql_field_modifier,
            )),
          ),
        ),
        token.immediate('}'),
      )),
    sql_field_modifier: (_) =>
      token.immediate(/[ONC]/),
    sql_field_identifier: (_) =>
      choice(
        /[%A-Za-z][A-Za-z0-9]*/,
        seq(
          '"',
          repeat(choice(
            /[^"\\*:\n]/, // disallow colon inside (key JSON disambiguation)
            /\\["\\/bfnrt]/,
            /\\u[0-9a-fA-F]{4}/,
          )),
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
      prec.right(2,
        seq(
          choice(
            $.lvn,
            $.macro,
            $.instance_variable,
            $.relative_dot_property,
            $.relative_dot_method,
            $.system_defined_function,
            $.system_defined_variable,
            $.class_method_call,
            $.extrinsic_function,
            $.parenthetical_expression,
            $.json_object_literal,
            $.class_ref,
          ),
          repeat1($.oref_chain_segment),
        ),
      ),

    oref_chain_segment: ($) =>
      seq(
        token.immediate('.'),
        choice(
          $.oref_property,
          $.oref_method,
          $.oref_parameter,
        ),
      ),

    oref_method: ($) =>
      seq(
        alias($.member_name, $.method_name),
        $.method_args,
      ),
    oref_property: ($) =>
    // NOTE: Since a multidimensional property is indistinguishable from a method
    //       call (unless it's byref or has variadic args) we'll almost never match
    //       the subscripts clause.
      seq(
        alias($.member_name, $.property_name),
        optional($.subscripts),
      ),


    instance_variable: ($) =>
      prec.right(
        seq(
          token.immediate(/[irm]\%/i),
          $.member_name,
          optional($.subscripts),
        ),
      ),
    member_name: ($) =>
      choice(
        seq(token.immediate('"'), repeat(choice(/[^"]+/, token.immediate('""'))), '"'),
        choice(
          $.identifier_segment_immediate,
          $.identifier_segment_immediate_special,
        ),
      ),
    oref_parameter: ($) =>
      seq(
        token.immediate('#'),
        $.member_name,
      ),
    subscripts: ($) =>
      seq(
        alias(token.immediate('('), $.bracket),
        $.expression,
        repeat(seq(',', $.expression)),
        alias(')', $.bracket),
      ),

    relative_dot_method: ($) =>
      seq(
        token.immediate('..'),
        $.oref_method,
      ),
    relative_dot_property: ($) =>
      seq(
        token.immediate('..'),
        $.oref_property,
      ),
    relative_dot_parameter: ($) =>
      seq(
        token.immediate('..'),
        $.oref_parameter,
      ),
    namespace_token: (_) => token(/\$NAMESPACE/i),
    estack_token: (_) => token(/\$ES(TACK)?/i),
    etrap_token: (_) => token(/\$ET(RAP)?/i),
    roles_token: (_) => token(/\$ROLES/i),

    system_defined_variable: (_) =>
      prec(-1,
        token(choice(
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
        ))),
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
      ),

    dollar_text: ($) =>
      seq(
        // $T or $TEXT, followed by '(' with no space
        token(
          seq(
            /\$T(EXT)?/i,
            token.immediate('('),
          ),
        ),
        $.line_ref,
        ')',
      ),
    dollar_bitlogic: ($) =>
      seq(
        /\$BITLOGIC/i,
        token.immediate('('),
        $.bitlogic_expression,
        optional(seq(',', $.expression)), // length/flags arg
        ')',
      ),

    bitlogic_expression: ($) =>
      prec.left(seq(
        optional('~'),
        $.bitlogic_atom,
        repeat(seq(
          choice('&', '|', '^'),
          optional('~'),
          $.bitlogic_atom,
        )),
      )),

    bitlogic_atom: ($) =>
      choice(
        // nested bitlogic parens
        seq(alias(token.immediate('('), $.bracket), $.bitlogic_expression, alias(')', $.bracket)),
        // reuse existing atoms (functions, vars, calls, strings, numbers, etc.)
        $.expr_atom,
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
              /\$ZDATETIMEH/i, /\$ZDTH/i,
              /\$ZDATEH/i, /\$ZDH/i,
              /\$ZDATETIME/i, /\$ZDT/i,
              /\$ZDATE/i, /\$ZD/i,
              /\$ZTIMEH/i, /\$ZTH/i,
              /\$NUM(BER)?/i, /\$FN(UMBER)?/i,
              /\$LISTBUILD/i, /\$LB/i,
              /\$LISTTOSTRING/i, /\$LTS/i,
              /\$LISTFROMSTRING/i, /\$LFS/i,
              /\$V(IEW)?/i,
              /\$LISTDATA/i, /\$LD/i,
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
              /\$MV(AT)?/i,
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
              /\$ZJOB/i,
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
      prec.right(seq(
        token(seq(/\$S(ELECT)?/i, token.immediate('('))),
        commaSep1(seq($.dollar_arg_pair)),
        ')',
      )),
    dollar_case: ($) =>
      seq(
        token(seq(/\$CASE/i, token.immediate('('))),
        $.expression,
        choice(
          seq(
            repeat1(
              seq(
                ',',
                $.dollar_arg_pair,
              ),
            ),
            optional(
              seq(
                ',',
                ':',
                $.expression,
              ),
            ),
          ),
          seq(
            ',',
            ':',
            $.expression,
          ),
        ),
        ')',
      ),
    dollar_list: ($) =>
      seq(
        token(seq(choice(/\$LI(ST)?/i, /\$LISTUPDATE/i, /\$LU/i), token.immediate('('))),
        $.expression,
        optional(
          seq(
            ',',
            commaSep1(choice($.method_arg, $.dollar_func_pos, $.dollar_arg_pair)),
          ),
        ),
        ')',
      ),
    built_in_func_with_pos_options: ($) =>
      seq(
        token(
          seq(
            choice(/\$LISTGET/i, /\$LG/i, /\$P(IECE)?/i, /\$E(XTRACT)?/i, /\$WE(XTRACT)?/i),
            token.immediate('('),
          ),
        ),
        optional($._dollar_pos_method_arg_list),
        ')',
      ),
    _dollar_pos_method_arg_list: ($) =>
      choice(
        choice($.method_arg, $.dollar_func_pos),
        seq(
          optional($.method_arg),
          repeat1(
            seq(
              ',',
              optional(choice($.method_arg, $.dollar_func_pos)),
            ),
          ),
        ),
      ),
    dollar_method: ($) =>
      seq(
        token(choice(
          /\$(ZOBJ)?METHOD/i,
          /\$(ZOBJ)?CLASSMETHOD/i,
        )),
        alias(token.immediate('('), $.bracket),
        optional($._method_arg_list),
        alias(')', $.bracket),
      ),
    dollar_arg_pair: ($) => seq($.expression, ':', $.expression),
    dollar_func_pos: ($) =>
      seq(
        '*',
        optional(
          seq(
            choice('-', '+'),
            $.expression,
          ),
        ),
      ),
    unary_expression: ($) =>
      seq($.unary_operator, $.expression),

    indirection: ($) => prec.right(seq('@', $.expression, optional(
      seq(
        token.immediate('@'),
        $.subscripts,
      ),
    ))),
    // rules that can be reused:
    dotted_identifier_relaxed_token: _ => token(DOTTED_ID_RELAXED), // routines only
    objectscript_identifier_special: _ => /\%[A-Za-z0-9]*/,
    identifier_segment_immediate_special: _ => token.immediate(/\%[A-Za-z0-9]*/),
    identifier_segment_immediate: _ => token.immediate(/[A-Za-z][A-Za-z0-9]*/),
    objectscript_identifier: _ => /[A-Za-z][A-Za-z0-9]*/,
    dotted_identifier_strict_token_immediate: _ => token.immediate(DOTTED_ID_STRICT),
    dotted_identifier_strict_token: _ => token(DOTTED_ID_STRICT), // class/UDL names

    numeric_literal: _ =>
      token(/[+-]?(?:\d+\.\d+(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|\d+(?:[eE][+-]?\d+)?)/),
    // any length sequence of characters besides ", between "
    // Double-quotes are escaped with double quotes
    string_literal: (_) =>
      token(seq('"', repeat(choice(/[^"]+/, '""')), '"')),
    macro: ($) => choice($.macro_function, $.macro_constant),
    macro_constant: (_) =>
      token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)),
    macro_function: ($) =>
      prec(1, prec.right(seq(token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)), $.method_args, optional($.method_args)))),

    json_object_literal: ($) => prec(2, seq(
      '{',
      optional(commaSep1($.json_object_literal_pair)),
      '}',
    )),
    json_object_literal_pair: ($) => seq(
      $.json_string_literal,
      ':',
      choice(
        $.json_literal,
        $.json_objectscript_expr,
      ),
    ),
    json_objectscript_expr: ($) => seq(
      '(',
      $.expression,
      ')',
    ),
    json_literal: ($) => choice(
      $.json_object_literal,
      $.json_string_literal,
      $.json_number_literal,
      $.json_array_literal,
      $.json_boolean_literal,
      $.json_null_literal,
    ),
    json_array_literal: ($) => seq(
      '[',
      optional(commaSep1($.json_literal)),
      ']',
    ),
    json_string_literal: (_) => token(seq(
      '"',
      repeat(choice(
        /[^"\\\n]/,
        /\\["\\/bfnrt]/,
        /\\u[0-9a-fA-F]{4}/,
      )),
      '"',
    )),
    json_number_literal: (_) => token(
      /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
    ),
    json_boolean_literal: (_) => choice(
      'true',
      'false',
    ),
    json_null_literal: (_) => 'null',
  },
});
