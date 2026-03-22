/**
 * Copyright (c) 2023 by InterSystems.
 * Cambridge, Massachusetts, U.S.A.  All rights reserved.
 * Confidential, unpublished property of InterSystems.
 */


/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * @param {RuleOrLiteral} rule
 * @returns {RuleOrLiteral}
 */
const repeat_with_commas = function(rule) {
  return seq(rule, repeat(seq(',', rule)));
};

const {DOTTED_ID_STRICT, DOTTED_ID_RELAXED} = require('../common/identifiers');

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
        $.unary_expression,
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
        $.class_parameter_ref,
        $.superclass_method_call,
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
    unary_expression: ($) =>
      choice(
        seq($.unary_operator, $.expression),
        seq('@', choice($.glvn, $.system_defined_function, $.system_defined_variable), optional(
          seq(
            token.immediate('@'),
            $.subscripts,
          ),
        )),
      ),
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
          alias($.indirection, $.unary_expression), // ? @var
          $.pattern_expression, // ?<pattern>
        ),
      ),
    indirection: ($) => seq('@', $.expression),

    pattern_expression: _ =>
    // A pattern expression looks like this:
    // (?:(REPEAT)(ELEMENT))+
    //
    // REPEAT:
    //   (?:\d*(?:\.\d*)?|\.)
    //     - Matches:
    //         • '3'       → exactly 3
    //         • '1.3'     → 1 to 3
    //         • '3.'      → 3 or more
    //         • '.3'      → up to 3
    //         • '.'       → any number
    //
    // ELEMENT (one of):
    //   [aceulnpzACEULNPZ]+
    //     - One or more valid pattern codes (case-insensitive): A, C, E, L, N, P, U, Z
    //
    //   "[^"\r\n]*(""[^"\r\n]*)*"
    //     - A string literal:
    //
    //   \([^()\r\n"]*(?:,[^()\r\n"]*)*\)
    //     - Alternation group (e.g., (1N,"-",2P)):
      token.immediate(
        /[ \t]*[ \n]*(?:(?:\d*(?:\.\d*)?|\.)((?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"|\(((?:\d*(?:\.\d*)?|\.)?(?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"))(?:,(?:\d*(?:\.\d*)?|\.)?(?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"))*\)))+)+/,
      ),

    class_method_call: ($) =>
      seq(
        $.class_ref,
        token.immediate('.'),
        alias($.member_name, $.method_name),
        $.method_args,
      ),
    class_parameter_ref: ($) =>
      seq(
        $.class_ref,
        token.immediate('.'),
        $.parameter_name,
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
        prec.left(seq(
          '$$',
          choice(
            // label+offset+routine or label+routine or label only
            seq(
              choice($.objectscript_identifier, $.objectscript_identifier_special),
              optional($.label_offset),
              optional($.routine_ref),
            ),
            // routine only (^routine)
            seq(
              $.routine_ref,
            ),
          ),
          optional($.method_args),
        )),
        // Full indirection - no method args, as @var evaluates the expression
        seq(
          '$$',
          $.indirection,
        ),
      ),

    line_ref: ($) => choice(
      // label+offset+routine or label+routine or label only
      seq(
        choice($.objectscript_identifier, $.objectscript_identifier_special),
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
        optional(
          choice(
            token.immediate('||'),
            seq(
              token.immediate('|'),
              alias(choice($.objectscript_identifier, $.objectscript_identifier_special, $.string_literal), $.namespace),
              token.immediate('|'),
            ),
          ),
        ),
        alias($.dotted_identifier_relaxed_token, $.routine_name)),

    dollarsf: ($) =>
      seq(
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
        $.method_args,
      ),


    method_args: ($) =>
      seq(
        alias(token.immediate('('), $.bracket),
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
        alias(')', $.bracket),
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

    indirected_glvn: ($) =>
      seq(
        '@',
        choice(
          $.lvn,
          $.gvn,
          $.ssvn,
          $.relative_dot_parameter, // for ..#myparam
          $.class_parameter_ref, //  ##class(...).#Param
        ),
        '@',
        $.subscripts,
      ),

    glvn: ($) => choice($.gvn, $.lvn, prec(-1, $.ssvn), prec.right(1, $.macro), $.indirected_glvn),
    gvn: ($) =>
      prec.right(
        seq(
          '^',
          optional(
            choice(
              token.immediate('||'),
              seq(token.immediate('|'), choice($.objectscript_identifier, $.objectscript_identifier_special, $.string_literal), optional(seq(',', choice($.objectscript_identifier, $.string_literal) )), '|'),
              seq(token.immediate('['), choice($.objectscript_identifier, $.objectscript_identifier_special, $.string_literal), optional(seq(',', choice($.objectscript_identifier, $.string_literal) )), ']'),
            ),
          ),
          optional(token.immediate(/[%A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/)),
          optional($.subscripts),
        ),
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
            $.instance_variable,
            $.relative_dot_property,
            $.relative_dot_method,
            $.system_defined_function,
            $.class_method_call,
            $.extrinsic_function,
            $.parenthetical_expression,
            $.json_object_literal,
            $.class_ref,
          ),
          repeat1($.oref_chain_segment),
          optional(
            seq(
              token.immediate('.'),
              $.oref_parameter,
            ),
          ),
        ),
      ),

    oref_chain_segment: ($) =>
      seq(
        token.immediate('.'),
        choice(
          $.oref_property,
          $.oref_method,
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
    oref_parameter: ($) =>
      $.parameter_name,


    instance_variable: ($) =>
      prec.right(
        seq(
          token.immediate(/[irm]\%/),
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
    parameter_name: ($) =>
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


    system_defined_variable: ($) =>
      prec(-1,
        choice(
          /\$D(EVICE)?/i, // $DEVICE
          /\$EC(ODE)?/i, // $ECODE
          $.estack_token, // $ESTACK
          $.etrap_token, // $ETRAP
          /\$HALT/i, // $HALT
          /\$H(OROLOG)?/i, // $HOROLOG
          /\$I(O)?/i, // $IO
          /\$J(OB)?/i, // $JOB
          /\$K(EY)?/i, // $KEY
          $.namespace_token, // $NAMESPACE
          /\$P(RINCIPAL)?/i, // $P[RINCIPAL] conflicts with $P[IECE]
          /\$Q(UIT)?/i, // $QUIT
          $.roles_token, // $ROLES
          /\$ST(ACK)?/i, // $STACK conflits with $STACK()
          /\$S(TORAGE)?/i, // $S[TORAGE] conflicts with $S[ELECT]
          /\$SY(STEM)?/i, // $SYSTEM
          /\$T(EST)?/i, // $TEST
          /\$THIS/i, // $THIS
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
          choice(/\$ZTIMESTAMP/i, /\$ZTS/i), // $ZTIMESTAMP
          choice(/\$ZTIMEZONE/i, /\$ZTZ/i), // $ZTIMEZONE
          /\$ZT(RAP)?/i, // $ZTRAP
          /\$ZV(ERSION)?/i, // $ZVERSION
        )),
    system_defined_function: ($) =>
      choice(
        // Keep specialized rules before generic dollar_function to avoid conflicts.
        $.dollar_piece,
        $.dollar_extract,
        $.dollar_list,
        $.dollar_listget,
        $.dollar_case,
        $.dollar_select,
        $.dollar_classmethod,
        $.dollar_method,
        $.dollar_text,
        $.dollarsf,
        $.dollar_function,
        $.built_in_functions_with_optional_args,
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

    dollar_function: ($) =>
      seq(
        token(
          seq(
            choice(
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
              /\$ZU(TIL)?/i,
              /\$XECUTE/i,
              /\$A(SCII)?/i,
              /\$BITLOGIC/i,
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
              /\$ISOBJECT/i,
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
              /\$ZISWIDE/i,
              /\$ZLC(HAR)?/i,
              /\$ZLN/i,
              /\$ZLOG/i,
              /\$ZQC(HAR)?/i,
              /\$ZSE(ARCH)?/i,
              /\$ZSEC/i,
              /\$ZSIN/i,
              /\$ZSQR/i,
              /\$ZTAN/i,
              /\$ZVERSION/i,
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
              choice(/\$LISTUPDATE/i, /\$LU/i),
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
        optional(repeat_with_commas($.expression)),
        ')',
      ),
    dollar_select: ($) =>
      seq(
        token(seq(/\$S(ELECT)?/i, token.immediate('('))),
        repeat_with_commas(seq($.dollar_arg_pair)),
        ')',
      ),
    built_in_functions_with_optional_args: ($) =>
      seq(
        token(
          seq(
            choice(
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
            ),
            token.immediate('('),
          ),
        ),
        optional(
          seq(
            optional($.expression),
            repeat(
              seq(
                ',',
                optional($.expression),
              ),
            ),
          ),
        ),
        ')',
      ),
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

    dollar_piece: ($) =>
      seq(
        // NOTE: `$P(` must be one token to avoid ambiguity with $P[RINCIPAL]
        token(seq(/\$P(IECE)?/i, token.immediate('('))),
        $.expression,
        ',',
        $.expression,
        optional(
          seq(',',
            $.dollar_func_pos,
            optional(
              seq(
                ',',
                $.dollar_func_pos,
              ),
            ),
          ),
        ),
        ')',
      ),
    dollar_extract: ($) =>
      seq(
        token(seq(choice(/\$E(XTRACT)?/i, /\$WE(XTRACT)?/i), token.immediate('('))),
        $.expression,
        optional(
          seq(',', $.dollar_func_pos, optional(seq(',', $.dollar_func_pos))),
        ),
        ')',
      ),
    dollar_list: ($) =>
      seq(
        token(seq(/\$LI(ST)?/i, token.immediate('('))),
        $.expression,
        optional(
          seq(
            ',',
            repeat_with_commas(choice($.dollar_func_pos, $.dollar_arg_pair)),
          ),
        ),
        ')',
      ),
    dollar_listget: ($) =>
      seq(
        token(
          seq(
            choice(/\$LISTGET/i, /\$LG/i),
            token.immediate('('),
          ),
        ),
        $.expression,
        optional(
          seq(
            ',',
            optional($.dollar_func_pos),
            optional(seq(',', $.expression)),
          ),
        ),
        ')',
      ),
    dollar_classmethod: ($) =>
      seq(
        /\$(ZOBJ)?CLASSMETHOD/i,
        alias(token.immediate('('), $.bracket),
        optional($.expression),
        ',',
        $.expression,
        repeat(seq(',', $.method_arg)),
        ')',
      ),
    dollar_method: ($) =>
      seq(
        /\$(ZOBJ)?METHOD/i,
        alias(token.immediate('('), $.bracket),
        optional($.expression),
        ',',
        $.expression,
        repeat(seq(',', $.method_arg)),
        alias(')', $.bracket),
      ),
    dollar_arg_pair: ($) => seq($.expression, ':', $.expression),
    dollar_func_pos: ($) => choice(
      prec(1,
        seq(
          '*',
          optional(
            seq(
              choice('-', '+'),
              $.expression,
            ),
          ),
        ),
      ),
      $.expression,
    ),

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
      prec(1, seq(token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)), $.method_args)),

    json_object_literal: ($) => prec(2, seq(
      '{',
      optional(repeat_with_commas($.json_object_literal_pair)),
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
      optional(repeat_with_commas($.json_literal)),
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
