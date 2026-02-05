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

const { IDENT_SEG, DOTTED_ID_STRICT, DOTTED_ID_RELAXED } = require('../common/identifiers');

module.exports = grammar({
  name: 'objectscript_expr',
  conflicts: ($) => [
      [$.class_method_call, $.oref_chain_expr],
  ],
  // inline: ($) => [
  // note: having inline does reduce states because it eliminates rules as grammar symbol
  // ],
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
      seq(
        choice(
        $.json_object_literal,
        $.parenthetical_expression,
        $.unary_expression,
        $.indirection,

        // Literals
        $.string_literal,
        $.numeric_literal,
        $.json_array_literal,

        // Variables
        $.glvn,
        $.instance_variable,
        $.sql_field_reference,

        // Builtin functions
        $.built_in_function_name,
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
      )),

    expr_tail: ($) =>
      prec.left(
        1,
        choice(
          seq(
            field('operator', $.binary_operator),
            $.expr_atom,
          ),
          $.pattern_operator,
        ),
      ),
    
    // pattern, name, subscript, argument indirections
    // indirection: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_op_indirection#RCOS_op_indirection_arg
    indirection: ($) => 
      prec.right(seq(
        field('operator', '@'), 
        $.expression, 
        optional(
          seq(
            token.immediate('@'),
            $.subscripts,   // existing: '(' expr (',' expr)* ')'
          )
        )
      )),

    parenthetical_expression: ($) => seq('(', $.expression, ')'),
    unary_expression: ($) => seq(choice('+', '-', "'"), $.expression),
        // prec(-1, $.indirection),
      

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

    pattern_operator: ($) =>
      seq(
        field('operator', choice('?',"'?")),
        field('right', choice(
          $.indirection, 
          $.pattern_expression                     
        )),
      ),
    // indirection: ($) => seq(field('operator', '@'), $.expression),

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
        /[ \t]*[ \n]*(?:(?:\d*(?:\.\d*)?|\.)((?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"|\(((?:\d*(?:\.\d*)?|\.)?(?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"))(?:,(?:\d*(?:\.\d*)?|\.)?(?:[aceulnpzACEULNPZ]+|"[^"\r\n]*(""[^"\r\n]*)*"))*\)))+)+/
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
          choice(
              alias(token.immediate(/"(?:[^"]+|"")*"/), $.method_name),  // quoted: "Foo" or "Foo""Bar"
              alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.method_name)  // unquoted identifier
          ),
          $.method_args,
      ),
    class_parameter_ref: ($) =>
      seq(
        $.class_ref,
        token.immediate('.'),
        $.oref_parameter,
      ),
    class_ref: ($) =>
      seq(
        field('preproc_keyword', $.keyword_pound_pound_class),
        token.immediate('('),
        choice(
            alias(token.immediate(/"(?:[^"]+|"")*"/), $.class_name),
            alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/), $.class_name),
        ),
        token.immediate(')'),
        optional(
          // Class cast syntax
          choice(
            alias($.parenthetical_expression, $.class_instance_name),
              alias($.lvn, $.class_instance_name)
          ),
        ),
      ),

    keyword_pound_pound_class: (_) => /##CLASS/i,
    class_name: ($) =>
      choice(
        // quoted class name (unchanged)
        seq(
          token.immediate('"'),
          repeat1(choice(/[^"]+/, token.immediate('""'))),
          '"'
        ),
        // unquoted: each segment starts with letter or %
        token.immediate(/[%A-Za-z][A-Za-z0-9]*(?:\.[%A-Za-z][A-Za-z0-9]*)*/)
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
              field('label', $.objectscript_identifier),
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

      line_ref: ($) => prec(1, choice(
      // label+offset+routine or label+routine or label only
      seq(
        field('label', $.objectscript_identifier),
        optional(field('offset', $.label_offset)),
        optional(field('routine', $.routine_ref)),
      ),
      // routine only (^routine)
      seq(
        field('routine', $.routine_ref),
      ),
      // Full indirection
      seq(
          $.indirection,
          optional($.routine_ref)
      ),
      seq(
        field('label', $.indirection),      
        token.immediate('^'),
        field('routine', $.indirection),    
      ),
    )),

    // line_ref: ($) => prec(1, choice(
    //   // label [+offset] [^routine]
    //   seq(
    //     field('label', choice($.objectscript_identifier, $.indirection)),
    //     optional(field('offset', $.label_offset)),
    //     optional(field('routine', $.routine_ref)),
    //   ),
    //   // +offset^routine (no label)
    //   seq(
    //     field('offset', $.label_offset),
    //     field('routine', $.routine_ref),
    //   ),
    //   // ^routine only
    //   field('routine', $.routine_ref),
    // )),

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
                      $.expression,
                      token.immediate('|'),
                  ),
              ),
          ),
         $.dotted_identifier_relaxed_token
        ),

    method_args: ($) =>
      seq(
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
    // glvn: ($) => choice($.gvn, $.lvn, prec(-1, $.ssvn), prec.right(1,$.macro), $.indirected_glvn),
    gvn: ($) =>
      prec.right(
        seq(
          '^',
          optional(
            choice(
              token.immediate('||'),
              seq(token.immediate('|'), $.expression, '|'),
              seq(token.immediate('['), $.expression, ']'),
            ),
          ),
          optional(token.immediate(/[%A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*/)),
          optional($.subscripts),
        )
      ),
    lvn: ($) => prec.right(seq($.objectscript_identifier, optional($.subscripts))),
    ssvn: ($) =>
      prec.right(
        seq(
          '^$',
          $.identifier_segment_immediate,
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
        IDENT_SEG,
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
            $.class_method_call,
            $.extrinsic_function,
            $.parenthetical_expression,
            $.json_object_literal,
            $.class_ref,
          ),
          choice(
            seq(
              repeat1(
              seq(
                token.immediate('.'),
                choice(
                  seq(
                    choice(
                      alias(token.immediate(/"(?:[^"]+|"")*"/), $.method_name),
                      alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.method_name),
                  ),
                  $.method_args
                  ),
                  seq(
                    choice(
                      alias(token.immediate(/"(?:[^"]+|"")*"/), $.property_name),
                      alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.property_name),
                    ),
                  )
                ),
              )
              ),
              optional(
                seq(
                  token.immediate('.'),
                  $.oref_parameter
                ),
              ),
            ),
            seq(
              token.immediate('.'),
              $.oref_parameter
            )
          ), 
        ),
      ),

    oref_parameter: ($) =>
        seq(
        token.immediate('#'),
        choice(
          alias(token.immediate(/"(?:[^"]+|"")*"/), $.parameter_name),
          alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.parameter_name),
        ),
      ),

    instance_variable: ($) =>
      prec.right(
        seq(
          token.immediate(/[irm]\%/),
          choice(
          alias(token.immediate(/"(?:[^"]+|"")*"/), $.property_name),
          alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.property_name),
        ),
          optional($.subscripts),
        )
      ),
    subscripts: ($) =>
      seq(
        token.immediate('('),
        $.expression,
        repeat(seq(',', $.expression)),
        ')',
      ),

    relative_dot_method: ($) =>
     prec(1,

      seq(
        '..',
          choice(
              alias(token.immediate(/"(?:[^"]+|"")*"/), $.method_name),
              alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.method_name),
          ),
          $.method_args
      )),
    relative_dot_property: ($) =>
      prec(0,seq(
        '..',
          choice(
              alias(token.immediate(/"(?:[^"]+|"")*"/), $.property_name),
              alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.property_name),
          ),
      )),
    relative_dot_parameter: ($) =>
      seq(
        '..',
        $.oref_parameter,
      ),
      namespace_token: ($) => /\$NAMESPACE/i,
      estack_token: ($) => /\$ES(TACK)?/i,
      etrap_token: ($) => /\$ET(RAP)?/i,
      roles_token: ($) => /\$ROLES/i,

      built_in_function_device_or_data: ($) => 
        choice(
          prec(-1, 
            alias(choice(
               /\$D/i,
               /\$DEVICE/i
            ), $.built_in_function_name),
          ),
          seq(
            alias(choice(
               /\$D/i,
               /\$DATA/i
            ), $.built_in_function_name),
            token.immediate('('),
            // variable
            alias(choice(
              $.glvn,
              $.indirection,
              $.oref_chain_expr
            ), $.function_argument),
            // target
            optional(
              seq(',', 
                alias(choice(
                  $.glvn,
                  $.indirection,
                  $.oref_chain_expr
                ), $.function_argument)
              )
            ),
            ')'
          )
        ),

      built_in_function_system: ($) => 
          prec.right(seq(
            alias(/\$SYSTEM/i, $.built_in_function_name),
            optional(
              seq(
                token.immediate('.'),
                alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.function_argument),
                token.immediate('.'),
                alias(token.immediate(/[%A-Za-z][A-Za-z0-9]*/), $.function_argument),
                $.method_args,
              )
            )
          )),
        
      built_in_functions_piece_or_principal: ($) => 
        choice(
          seq(
            choice(
               /\$P/i,
               /\$PIECE/i,
            ),
            token.immediate('('),
            optional(
              seq(
                alias($.expression, $.function_argument),
                repeat(
                  seq(
                    ',',
                    optional(alias($.dollar_func_pos, $.function_argument)),
                  ),
                ),
              ),
            ),
            ')'
          ),
          prec(-1,choice(
            /\$P/i,
            /\$PRINCIPAL/i,
          )
          )),

      built_in_functions_quit_or_query: ($) => 
        choice(
          prec(-1, alias(choice(
            /\$QUIT/i, // $QUIT
            /\$Q/i,
          ), $.built_in_function_name)),
          seq(
            alias(choice(
              /\$QUERY/i,
              /\$Q/i,
            ), $.built_in_function_name),
            token.immediate('('),
            // reference
            alias($.expression, $.function_argument),
            optional(
              seq(',', alias(choice('1','-1'), $.function_argument),
              optional(
              seq(',', alias($.objectscript_identifier, $.function_argument))
              )),
            ),
            ')'
          )
        ),

      built_in_functions_storage_or_select: ($) => 
        choice(
          prec(-1,
            alias(choice(
              /\$STORAGE/i, // $STORAGE
              /\$S/i, // $STORAGE
            ), $.built_in_function_name)
          ),
          seq(
            alias(choice(
              /\$SELECT?/i,
              /\$S/i,
            ), $.built_in_function_name),
            token.immediate('('),
            repeat_with_commas(seq(alias($.dollar_arg_pair, $.function_argument))),
            ')',
          ),
        ),

      built_in_function_stack: ($) => 
        choice(
          prec(-1,
            alias(choice(
              /\$ST/i, // $STACK no arguments
              /\$STACK/i, // $STACK no arguments
            ), $.built_in_function_name)
          ),
          seq(
            alias(choice(
              /\$ST/i, // $STACK with arguments
              /\$STACK/i, // $STACK with arguments
            ), $.built_in_function_name),
            token.immediate('('),
            alias($.expression, $.function_argument),
            optional(
              seq(',',
                alias($.expression, $.function_argument),
              )
            ),
            ')',
          )
        ),

      built_in_function_justify_or_job: ($) =>
        choice(
          prec(-1,
              alias(choice(
                /\$J/i, 
                /\$JOB/i, 
              ), $.built_in_function_name)
          ),
          seq(
            alias(
              choice(
                /\$J/i, 
                /\$JUSTIFY/i, 
              ), 
              $.built_in_function_name),
            token.immediate('('),
            repeat_with_commas(alias($.expression, $.function_argument)),
            ')'
          )
        ),

      built_in_function_zchild_or_zcyc: ($) => 
        choice(
          prec(-1,
              alias(choice(
                /\$ZC/i, 
                /\$ZCHILD/i, 
              ), $.built_in_function_name)
            ),
            seq(
              alias(
                choice(
                  /\$ZCYC/i, 
                  /\$ZC/i, 
                ), 
                  $.built_in_function_name
              ),
              token.immediate('('),
              alias($.expression, $.function_argument),
              ')'
            )
        ),

      built_in_function_increment_or_io: ($) => 
          choice(
            prec(-1,
              alias(choice(
                /\$I/i, 
                /\$IO/i, 
              ), $.built_in_function_name)
            ),
            seq(
              alias(
                choice(
                  /\$I/i, 
                  /\$INCREMENT/i, 
                ), 
                  $.built_in_function_name
              ),
              token.immediate('('),
              repeat_with_commas(alias($.expression, $.function_argument)),
              ')'
            )
          ),

      // ZBOOLEAN: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_fzboolean
      // ZB: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_vzb
      built_in_function_zboolean_or_zb: ($) => 
        choice(
            prec(-1,
              alias(
                /\$ZB/i, 
                $.built_in_function_name)
            ),
            seq(
              alias(
                choice(
                  /\$ZB/i, 
                  /\$ZBOOLEAN/i,
                ),
                $.built_in_function_name
              ),
              token.immediate('('),
              repeat_with_commas(alias($.expression, $.function_argument)),
              ')'
            )
          ),

      built_in_function_name: ($) =>
      prec(-1, choice(
          /\$SY/i,
          /\$EC(ODE)?/i, // $ECODE
        $.estack_token, // $ESTACK
        $.etrap_token, // $ETRAP
        /\$HALT/i, // $HALT
        /\$H(OROLOG)?/i, // $HOROLOG
        /\$K(EY)?/i, // $KEY
       $.namespace_token, // $NAMESPACE
        $.roles_token, // $ROLES
        /\$T(EST)?/i, // $TEST
        /\$THIS/i, // $THIS
        /\$THROWOBJ/i, // $THROWOBJ
        /\$TL(EVEL)?/i, // $TLEVEL
        /\$USERNAME/i, // $USERNAME
        /\$X/i, // $X
        /\$Y/i, // $Y
        /\$ZA/i, // $ZA
        /\$ZEOF/i, // $ZEOF
        /\$ZEOS/i, // $ZEOS
        /\$ZE(RROR)?/i, // $ZERROR
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
        /\$ZV(ERSION)?/i, // $ZVERSION
      )),
    system_defined_function: ($) =>
      choice(
        $.built_in_functions_piece_or_principal,
        $.built_in_functions_quit_or_query,
        $.built_in_list_functions_with_optional_args,
        $.dollar_case,
        $.built_in_functions_storage_or_select,
        $.built_in_function_device_or_data,
        $.built_in_function_stack,
        $.built_in_function_system,
        $.built_in_function_increment_or_io,
        $.built_in_function_justify_or_job,
        $.dollar_text,
        $.built_in_function_zboolean_or_zb,
        $.built_in_function_zchild_or_zcyc,
        $.built_in_function_zhex_or_zhorolog,
        $.built_in_function_ztime_or_ztrap,
        $.built_in_functions_with_optional_args,
        $.dollar_method,
        $.dollar_classmethod,
        $.dollar_function,    // Fallback case
      ),

    dollar_text: ($) =>
      seq(
        alias(/\$T(EXT)?/i, $.built_in_function_name),
        token.immediate('('),
        alias($.line_ref, $.function_argument),
        ')',
    ),

    // zhex: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_fzhex
    // zhorolog: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_vzhorolog
    built_in_function_zhex_or_zhorolog:($) => 
      choice(
        prec(-1,
              alias(choice(
                /\$ZH/i, 
                /\$ZHOROLOG/i, 
              ), $.built_in_function_name)
        ),
        seq(
          alias(
            choice(
                /\$ZH/i, 
                /\$ZHEX/i, 
              ), $.built_in_function_name
          ),
          token.immediate('('),
          // num
          alias($.expression, $.function_argument),
          ')'
        )
      ),

    // ztime: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_fztime
    // ztrap: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_vztrap
    built_in_function_ztime_or_ztrap: ($) => 
      choice(
        prec(-1,
              alias(choice(
                /\$ZT/i, 
                /\$ZTRAP/i, 
              ), $.built_in_function_name)
        ),
        seq(
          alias(
            choice(
                /\$ZT/i, 
                /\$ZTIME/i, 
              ), $.built_in_function_name
          ),
          token.immediate('('),
          alias($.expression, $.function_argument),
          repeat(
              seq(
                ',',
                optional(alias($.expression, $.function_argument)),
              ),
            ),
          ')',
        )
      ),
    
    dollar_classmethod: ($) =>
      seq(
          alias(/\$(ZOBJ)?CLASSMETHOD/i, $.built_in_function_name), 
          $.method_args
      ),
    dollar_method: ($) =>
      seq(
          alias(/\$(ZOBJ)?METHOD/i, $.built_in_function_name), 
          $.method_args
      ),

    // fnumber: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_ffnumber
    // zdate: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_fzdate
    // zdatetimeh: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_fzdatetimeh
    // ztimeh: https://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=RCOS_fztimeh
    built_in_functions_with_optional_args: ($) => 
      seq(
        alias(
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
      
        ), $.built_in_function_name),
        token.immediate('('),
        optional(
          seq(
            optional(alias($.expression, $.function_argument)),
            repeat(
              seq(
                ',',
                optional(alias($.expression, $.function_argument)),
              ),
            ),
          ),
        ),
        ')',
      ),

    dollar_function: ($) =>
      seq(
            alias(
              choice(
                /\$SEQ(UENCE)?/i,
                /\$LISTVALID/i, /\$LV/i,
                /\$LISTLENGTH/i, /\$LL/i,
                /\$BIT/i,
                /\$G(ET)?/i,
                /\$L(ENGTH)?/i,
                /\$MATCH/i,
                /\$NORMALIZE/i,
                /\$LISTSAME/i, /\$LS/i,
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
                /\$NA(ME)?/i,
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
                /\$ZDC(HAR)?/i,
                /\$ZEXP/i,
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
                /\$ZWC(HAR)?/i,
                /\$ZWPACK/i,
                /\$ZWBPACK/i,
                /\$ZWUNPACK/i,
                /\$ZWBUNPACK/i,
                /\$F(IND)?/i,
                /\$IN(UMBER)?/i,
                /\$NC(ONVERT)?/i,
                /\$VE(CTOR)?/i,
                choice(/\$VECTORDEFINED/i, /\$VD/i),
                choice(/\$VECTOROP/i, /\$VOP/i),
                /\$TR(ANSLATE)?/i,
                /\$ZCRC/i,
                /\$ZZENKAKU/i,
                /\$ISVALIDDOUBLE/i,
                /\$ISVALIDNUM/i,
                /\$LISTNEXT/i,
                choice(/\$LISTFIND/i, /\$LF/i),
                /\$LOCATE/i,
                /\$PREPROCESS/i,
                /\$O(RDER)?/i,
                /\$PARAMETER/i,
                /\$PREFETCHOFF/i,
                /\$PREFETCHON/i,
                /\$PROPERTY/i,
                /\$R(ANDOM)?/i,
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
              $.built_in_function_name
            ),
            token.immediate('('),
        optional(repeat_with_commas(alias($.expression, $.function_argument))),
        ')',
      ),
    dollar_case: ($) =>
      seq(
        token(seq(field('name', /\$CASE/i), token.immediate('('))),
        alias($.expression, $.function_argument),
        choice(
          seq(
            repeat1(
              seq(
                ',',
                alias($.dollar_arg_pair, $.function_argument)
              ),
            ),
            optional(
              seq(
                ',',
                ':',
                alias($.expression, $.function_argument)
              ),
            ),
          ),
          seq(
              ',',
              ':',
              alias($.expression, $.function_argument)
          ),
        ),
        ')',
      ),
    built_in_list_functions_with_optional_args: ($) =>
      seq(
        alias(choice(/\$LISTGET/i, /\$LG/i, /\$LI(ST)?/i, /\$E(XTRACT)?/i, /\$WE(XTRACT)?/i,/\$LISTUPDATE/i, /\$LU/i), $.built_in_function_name),
        token.immediate('('),
        optional(
          seq(
            alias($.expression, $.function_argument),
            repeat(
              seq(
                ',',
                optional(alias(choice($.dollar_func_pos, $.dollar_arg_pair), $.function_argument)),
              ),
            ),
          ),
        ),
        ')',
      ),  

    dollar_arg_pair: ($) => seq(alias($.expression, $.lhs_pair), ':', alias($.expression, $.rhs_pair)),
    dollar_func_pos: ($) => 
    choice(
      prec(1,
        seq(
          field('modifier','*'),
          optional(
            seq(
              field('modifier', choice('-', '+')),
              $.expression,
            ),
          ),
        ),
      ),
      $.expression,
    ),

    // rules that can be reused:
    identifier_segment_immediate: _ => token.immediate(IDENT_SEG),
    objectscript_identifier: _ => IDENT_SEG,
    dotted_identifier_strict_token_immediate : _ => token.immediate(DOTTED_ID_STRICT),
    dotted_identifier_strict_token: _  => DOTTED_ID_STRICT,   // class/UDL names
    dotted_identifier_relaxed_token: _ => DOTTED_ID_RELAXED,  // routines only

    numeric_literal: _ =>
      /[+-]?(?:\d+\.\d+(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|\d+(?:[eE][+-]?\d+)?)/,
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
    json_string_literal: ($) => token(seq(
      '"',
      repeat(choice(
        /[^"\\\n]/,
        /\\["\\/bfnrt]/,
        /\\u[0-9a-fA-F]{4}/
      )),
      '"'
    )),
    json_number_literal: ($) =>
      /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
    ,
    json_boolean_literal: ($) => choice(
      'true',
      'false',
    ),
    json_null_literal: ($) => 'null',
  },
});
