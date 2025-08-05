/**
 * Copyright (c) 2023 by InterSystems.
 * Cambridge, Massachusetts, U.S.A.  All rights reserved.
 * Confidential, unpublished property of InterSystems.
 */

/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * @param {RuleOrLiteral} rule
 * @return {RuleOrLiteral}
 */
const repeat_with_commas = function (rule) {
  return seq(rule, repeat(seq(',', rule)));
};

module.exports = grammar({
  name: 'objectscript_expr',
  precedences: ($) => [
    [$.oref_method, $.oref_property],
    [$.method_arg, $.subscripts],
    [$.oref_chain_expr, $.expr_atom],
    [$.label_ref, $.lvn],
  ],
  conflicts: ($) => [
  ],
  inline: ($) => [
    // NOTE: It's not clear why these need to be inline, but they disappear from the ast
    //       when inline, maybe that's by design or for reducing the number of states
    $.dollar_function,
    $.dollar_list,
    $.dollar_listget,
    $.dollar_extract,
    $.dollar_piece,
    $.dollar_case,
    $.dollar_select,
    $.dollar_classmethod,
    $.dollar_method,
    $.dollar_func_pos,
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
        $._parenthetical_expression,
        $.unary_expression,
        $.macro,

        // Literals
        $.string_literal,
        $.numeric_literal,
        $.json_object_literal,
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
        $.dollarsf,

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
            field('operator', $.binary_operator),
            $.expression,
          ),
          $._pattern_operator,
        ),
      ),

    _parenthetical_expression: ($) => seq('(', $.expression, ')'),
    unary_expression: ($) =>
      choice(
        seq(field('operator', $._unary_operator), $.expression),
        seq(field('operator', '@'), $.glvn),
      ),
    _unary_operator: (_) => choice('+', '-', "'"),

    // NOTE: ObjectScript operators have the same precendence level (left-associative)
    binary_operator: (_) =>
      choice(
        '**',       // Exponentiation
        '*',        // Multiplication
        '/',        // Division
        '\\',       // Integer-division
        '#',        // Modulo
        '+',        // Addition
        '-',        // Subtraction
        '=',        // Equality
        "'=",       // Inequality
        '<',        // Less than
        '<=',       // Less than-or-equal
        "'>",       // Not greater-than (same as <=)
        '>',        // Greater than
        '>=',       // Greater than-or-equal
        "'<",       // Not less-than (same as >=)
        "'",        // Negation
        '!',        // Logical OR
        '||',       // Logical OR (short-circuit)
        "'!",       // Not OR
        '&',        // Logical AND
        '&&',       // Logical AND (short-circuit)
        "'&",       // Not AND
        '_',        // Concatenate
        ']',        // Follows
        "']",       // Not follows
        '[',        // Contains
        "'[",       // Not contains
        ']]',       // Sorts-after
        "']]",      // Not Sorts-after
      ),
      _pattern_operator: ($) =>
        seq(
          field('operator','?'),
          field('right', choice(
            alias($.indirection, $.unary_expression),
            $.pattern_expression,
          )),
        ),
      indirection: ($) =>
        seq(field('operator', '@'), $.glvn),

      pattern_expression: ($) =>
        token(
          // A pattern expression looks like thisL
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

          /(?:(?:\d*(?:\.\d*)?|\.)((?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"|\(((?:\d*(?:\.\d*)?|\.)?(?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"))(?:,(?:\d*(?:\.\d*)?|\.)?(?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"))*\)))+)+/
        ),

    // So far it looks like DO + SET: ##class(, ..Method(
    // So far it looks like DO only: [label]^routine[(args)]]
    // So far it looks like Set only: $$[label]^routine[(args)]], maybe $$ONE also ??! (ref: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=GCOS_operators#GCOS_operators_precfuncs)
    // ##class(Foo.Bar).Baz(<args>)
    // ##class("Foo.%Bar")."Baz"(<args>)
    // ##class(Foo.%Bar)."Baz"(<args>)
    // ##class("Foo.%Bar").Baz(<args>)

    class_method_call: ($) =>
      seq(
        $.class_ref,
        token.immediate('.'),
        alias($._member_name, $.method_name),
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
        field('preproc_keyword', $.keyword_pound_pound_class),
        token.immediate('('),
        $.class_name,
        token.immediate(')'),
        optional(
          // Class cast syntax
          choice(
            $._parenthetical_expression,
            $.lvn,
          ),
        ),
      ),

    keyword_pound_pound_class: (_) => /##CLASS/i,
    class_name: (_) =>
      choice(
        seq(
          token.immediate('"'),
          repeat(choice(/[^"]+/, token.immediate('""'))),
          '"',
        ),
        token.immediate(/[%A-Za-z0-9][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/),
      ),
    superclass_method_call: ($) =>
      seq(
        field('preproc_keyword', $.keyword_pound_pound_super),
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
              field('label', $.label_ref),
              optional(field('offset', $.label_offset)),
              optional(field('routine', $.routine_ref)),
            ),
            // routine only (^routine)
            seq(
              field('routine', $.routine_ref),
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
        field('label', $.label_ref),
        optional(field('offset', $.label_offset)),
        optional(field('routine', $.routine_ref)),
      ),
      // routine only (^routine)
      seq(
        field('routine', $.routine_ref),
      ),
      // Full indirection
      $.indirection,
    ),
    label_ref: (_) =>
      token(/[%A-Za-z][A-Za-z0-9]*/),
    label_offset: ($) =>
      seq(
        token.immediate('+'),
        $.expression,
      ),
    routine_ref: ($) =>
      seq(
        token.immediate('^'),
        $.objectscript_identifier,
      ),

    dollarsf: ($) =>
      seq(
        field('function_name', $.dollar_system_keyword),
        repeat1(
          seq(
            '.',
            field(
              'classname_piece',
              token.immediate(/[%A-Za-z0-9][A-Za-z0-9]*/),
            ),
          ),
        ),
        $.method_args,
      ),
    dollar_system_keyword: (_) => /\$SYSTEM/i,

    method_args: ($) =>
      seq(
        token.immediate('('),
        optional(
          seq(
            $.method_arg,
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

    glvn: ($) => choice($.gvn, $.lvn, prec(-1, $.ssvn), prec.right(1,$.macro)),
    gvn: ($) =>
      prec.right(
        seq(
          '^',
          optional(
            choice(
              token.immediate('||'),
              seq(token.immediate('|'), $.expression, '|'),
            ),
          ),
          token.immediate(/[%A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/),
          optional($.subscripts),
        )
      ),
    lvn: ($) => prec.right(seq(/[%A-Za-z][A-Za-z0-9]*/, optional($.subscripts))),
    ssvn: ($) =>
      prec.right(
        seq(
          '^$',
          token.immediate(/[%A-Za-z][A-Za-z0-9]*/),
          optional($.subscripts),
        )
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
              field('modifier', $.sql_field_modifier),
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
        // /"([^"\\:]|\\.)*"/         // Quoted identifier
        seq(
          '"',
          repeat(choice(
            /[^"\\*:\n]/,          // disallow colon inside (key JSON disambiguation)
            /\\["\\/bfnrt]/,
            /\\u[0-9a-fA-F]{4}/
          )),
          '"'
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
            $.dollarsf,
            $.class_method_call,
            $.extrinsic_function,
            $._parenthetical_expression,
            $.json_object_literal,
          ),
          repeat1($._oref_chain_segment),
          optional(
            seq(
              token.immediate('.'),
              $.oref_parameter
            ),
          ),
        ),
      ),

    _oref_chain_segment: ($) =>
      seq(
        token.immediate('.'),
        choice(
          $.oref_property,
          $.oref_method,
        ),
      ),

    oref_method: ($) =>
      seq(
        alias($._member_name, $.method_name),
        $.method_args,
      ),
    oref_property: ($) =>
      // NOTE: Since a multidimensional property is indistinguishable from a method
      //       call (unless it's byref or has variadic args) we'll almost never match
      //       the subscripts clause.
      seq(
        alias($._member_name, $.property_name),
        optional($.subscripts),
      ),
    oref_parameter: ($) =>
      $.parameter_name,

    instance_variable: ($) =>
      prec.right(
        seq(
          token.immediate(/[irm]\%/),
          alias($._member_name, $.property_name),
          optional($.subscripts),
        )
      ),

    _member_name: ($) =>
      choice(
        seq(
          token.immediate('"'),
          repeat(choice(/[^"]+/, token.immediate('""'))),
          '"',
        ),
        token.immediate(/[%A-Za-z0-9][A-Za-z0-9]*/),
      ),
    parameter_name: ($) =>
      seq(
        token.immediate('#'),
        $._member_name,
      ),
    subscripts: ($) =>
      seq(
        token.immediate('('),
        $.expression,
        repeat(seq(',', $.expression)),
        ')',
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

    system_defined_variable: (_) =>
      choice(
        /\$D(EVICE)?/i, // $DEVICE
        /\$EC(ODE)?/i, // $ECODE
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
      ),
    system_defined_function: ($) =>
      choice(
        // NOTE: Make sure you add any new rules here to the inline key at top of the file
        $.dollar_function,
        $.dollar_piece,
        $.dollar_extract,
        $.dollar_list,
        $.dollar_listget,
        $.dollar_case,
        $.dollar_select,
        $.dollar_classmethod,
      ),
    dollar_function: ($) =>
      seq(
        token(
          seq(
            field(
              'function_name',
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
                /\$WE(XTRACT)?/i,
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
                /\$FN(UMBER)?/i,
                choice(/\$LISTDATA/i, /\$LD/i),
                choice(/\$LISTFROMSTRING/i, /\$LFS/i),
                choice(/\$LISTTOSTRING/i, /\$LTS/i),
                /\$V(IEW)?/i,
                /\$ZNAME/i,
                choice(/\$ZTIMEH/i, /\$ZTH/i),
                /\$ZZENKAKU/i,
                /\$I(NCREMENT)?/i,
                /\$ISVALIDDOUBLE/i,
                /\$ISVALIDNUM/i,
                /\$ZT(IME)?/i,
                choice(/\$LISTBUILD/i, /\$LB/i),
                /\$LISTNEXT/i,
                choice(/\$LISTFIND/i, /\$LF/i),
                /\$ZB(OOLEAN)?/i,
                choice(/\$LISTUPDATE/i, /\$LU/i),
                /\$LOCATE/i,
                /\$METHOD/i,
                /\$NUM(BER)?/i,
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
                /\$ZD(ATE)?/i,
                choice(/\$ZDATEH/i, /\$ZDH/i),
                choice(/\$ZDATETIME/i, /\$ZDT/i),
                choice(/\$ZDATETIMEH/i, /\$ZDTH/i),
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
            ),
            token.immediate('('),
          ),
        ),
        optional(repeat_with_commas($.expression)),
        ')',
      ),
    dollar_select: ($) =>
      seq(
        token(seq(field('name', /\$S(ELECT)?/i), token.immediate('('))),
        repeat_with_commas(seq(field('case', $.dollar_arg_pair))),
        ')',
      ),
    dollar_case: ($) =>
      seq(
        token(seq(field('name', /\$CASE/i), token.immediate('('))),
        field('target', $.expression),
        choice(
          seq(
            repeat1(
              seq(
                ',',
                field('case', $.dollar_arg_pair)
              ),
            ),
            optional(
              seq(
                ',',
                field('default',
                  seq(
                    ':',
                    $.expression,
                  ),
                ),
              ),
            ),
          ),
          seq(
            ',',
            field('default',
              seq(
                ':',
                $.expression,
              ),
            ),
          ),
        ),
        ')',
      ),

    dollar_piece: ($) =>
      seq(
        // NOTE: `$P(` must be one token to avoid ambiguity with $P[RINCIPAL]
        token(seq(field('function_name', /\$P(IECE)?/i), token.immediate('('))),
        $.expression,
        ',',
        $.expression,
        optional(
          seq(',',
            $.dollar_func_pos,
            optional(
              seq(
                ',',
                $.dollar_func_pos
              ),
            ),
          ),
        ),
        ')',
      ),
    dollar_extract: ($) =>
      seq(
        token(seq(field('function_name', /\$E(XTRACT)?/i), token.immediate('('))),
        $.expression,
        optional(
          seq(',', $.dollar_func_pos, optional(seq(',', $.dollar_func_pos))),
        ),
        ')',
      ),
    dollar_list: ($) =>
      seq(
        token(seq(field('function_name', /\$LI(ST)?/i), token.immediate('('))),
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
            field('function_name', choice(/\$LISTGET/i, /\$LG/i)),
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
        token(
          seq(field('function_name', /\$(ZOBJ)?CLASSMETHOD/i), token.immediate('(')),
        ),
        optional($.expression),
        ',',
        $.expression,
        repeat(seq(',', $.method_arg)),
        ')',
      ),
    dollar_method: ($) =>
      seq(
        token(
          seq(field('function_name', /\$(ZOBJ)?METHOD/i), token.immediate('(')),
        ),
        optional($.expression),
        ',',
        $.expression,
        repeat(seq(',', $.method_arg)),
        ')',
      ),
    dollar_arg_pair: ($) => seq($.expression, ':', $.expression),
    dollar_func_pos: ($) => choice(
      $.expression,
      seq('*', optional(seq(choice('-', '+'), $.expression))),
    ),
    numeric_literal: ($) => choice($.integer_literal, $.decimal_literal),
    integer_literal: (_) => /[\d]+/,
decimal_literal: (_) =>
      // NOTE: Using optional exponent directly in regex to avoid zero-length tokens
      choice(
        // digit+ . digit+ [exponent] - exponent optional in regex
        seq(/[\d]+\.[\d]+/, token.immediate(/([eE][+-]?[\d]+)?/)),
        // digit+ exponent   NOTE without exponent this is integer
        /[\d]+[eE][+-]?[\d]+/,
        // . digit+ [exponent] - exponent optional in regex
        seq(/\.[\d]+/, token.immediate(/([eE][+-]?[\d]+)?/)),
      ),
    // decimal_literal: (_) =>
    //   // NOTE: This possibly causes an infinite loop in `tree-sitter test`,
    //   //       although I don't see that in normal usage or the playground.
    //   //       However "fixing"" it seems to cause catastropic DFA explosion!
    //   choice(
    //     // digit+ . digit+ [exponent]
    //     seq(/[\d]+\.[\d]+/, token.immediate(optional(/[eE][+-]?[\d]+/))),
    //     // digit+ exponent   NOTE without exponent this is integer
    //     /[\d]+[eE][+-]?[\d]+/,
    //     // . digit+ [exponent]
    //     seq(/\.[\d]+/, token.immediate(optional(/[eE][+-]?[\d]+/))),
    //   ),

    // string literals in objecscript
    // are an any length sequence of characters besides ", between ".
    // Double-quotes are escaped with double quotes
    string_literal: (_) =>
      token(seq('"', repeat(choice(/[^"]+/, '""')), '"')),
    // NOTE: It's worthwhile distinguishing between macro_constant and macro_function
    // as nvim has dedicated captures groups for both.
    // @macro.constant, and @macro.function, repectively.
    macro: ($) => choice($.macro_function, $.macro_constant),
    macro_constant: (_) =>
      token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)),
    macro_function: ($) =>
      prec(1, seq(token(seq(/\$\$\$/, /[%A-Za-z0-9][A-Za-z0-9]*/)), $.method_args)),
    objectscript_identifier: (_) => /[%A-Za-z0-9][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/,
    json_object_literal: ($) => prec(2, seq(
      '{',
      optional(repeat_with_commas($._json_object_literal_pair)),
      '}',
    )),
    _json_object_literal_pair: ($) => seq(
      field('key', $.json_string_literal),
      ':',
      field('value', choice(
        $.json_literal,
        $.json_objectscript_expr,
      )),
    ),
    json_objectscript_expr: ($) => seq(
      '(',
      $.expression,
      ')',
    ),
    json_literal: ($) => choice(
      $.json_string_literal,
      $.json_number_literal,
      $.json_object_literal,
      $.json_array_literal,
      $.json_boolean_literal,
      $.json_null_literal,
    ),
    json_array_literal: ($) => seq(
      '[',
      optional(repeat_with_commas($.json_literal)),
      ']',
    ),
    json_string_literal: ($) => token(seq(
      '"',
      repeat(choice(
        /[^"\\\n]/,
        /\\["\\/bfnrt]/,
        /\\u[0-9a-fA-F]{4}/
      )),
      '"'
    )),
    json_number_literal: ($) => token(
      /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
    ),
    json_boolean_literal: ($) => choice(
      'true',
      'false',
    ),
    json_null_literal: ($) => 'null',
  },
});

