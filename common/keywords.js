/**
 * Keyword definitions
 * NOTE: A file somewhat resembling this can be regenerated in by invoking the appropriate file in scripts/
 */

/**
 *
 * @param {RuleOrLiteral} rule
 * @param {RuleOrLiteral} requiredRule
 */
function specialKeywords(rule, requiredRule) {
  return seq(
    '[',
    repeat(seq(rule, ',')),
    requiredRule,
    repeat(seq(',', rule)),
    ']',
  );
}

/**
 *
 * @param {RuleOrLiteral} keyword
 */
function buildBoolKeywordArg(keyword) {
  return seq(keyword, '=', /[0-1]/);
}

/**
 *
 * @param {RuleOrLiteral} keyword
 */
function buildKeywords(keyword) {
  return seq('[', commaSep(keyword), ']');
}

const {commaSep1, commaSep} = require('../common/define_grammar');

// Keyword rules
module.exports = {
  /*
      METHOD KEYWORDS
    */
  keyword_classmethod: (_) => /ClassMethod/i,
  keyword_method: (_) => /Method/i,

  // special case: methods
  method_keyword_codemode_expression: ($) =>
    seq(/CodeMode/i, '=', alias(/expression/i, $.typename)),
  _expression_method_keywords: ($) =>
    specialKeywords($.method_keyword, $.method_keyword_codemode_expression),
  _external_method_keywords: ($) =>
    specialKeywords($.method_keyword, $.method_keyword_external_language),
  _call_method_keywords: ($) =>
    specialKeywords($.method_keyword, $.call_method_keyword),
  call_method_keyword: ($) => seq(/CodeMode/i, '=', alias(/call/i, $.typename)),
  method_keyword_external_language: ($) =>
    seq(/Language/i, '=', alias(/(?:python|tsql|ispl)/i, $.typename)),
  // regular method keywords
  _keyword_client_name: ($) =>
    seq(/ClientName/i, '=', alias(/[^\s'`,\[\]\(\)\{\}]+/, $.property_name)),
  _keyword_soap_binding_style: ($) =>
    seq(/SoapBindingStyle/i, '=', alias(/(?:document|rpc)/i, $.typename)),
  _keyword_soap_body_use: ($) =>
    seq(/SoapBodyUse/i, '=', alias(/(?:literal|encoded)/i, $.typename)),
  _keyword_soap_namespace: ($) =>
    seq(
      /SoapNameSpace/i,
      '=',
      choice($.objectscript_identifier, $.string_literal),
    ),
  _method_keyword_no_arg: ($) =>
    seq(
      optional($.keyword_not),
      /(?:ReturnResultsets|NotInheritable|ForceGenerate|Deprecated|Abstract|Internal|WebMethod|Private|SqlProc|Final)/i,
    ),
  _keyword_sql_name: ($) => seq(/SqlName/i, '=', alias($.sql_id, $.query_name)),
  _method_keyword_value: ($) =>
    choice(
      $._keyword_client_name,
      $.keyword_server_only,
      $._keyword_soap_binding_style,
      $._keyword_soap_body_use,
      $._keyword_soap_namespace,
      seq(/PublicList/i, '=', $._objectscript_method_name_or_list),
      seq(/(?:GenerateAfter|PlaceAfter)/i, '=', $._method_name_or_list),
      seq(/ExternalProcName/i, '=', $.objectscript_identifier),
      seq(/CodeMode/i, '=', alias(/(?:objectgenerator|code)/i, $.typename)),
      seq(/Language/i, '=', alias(/objectscript/i, $.typename)),
      seq(
        /ProcedureBlock/i,
        optional(seq('=', choice(alias('0', $.false), alias('1', $.true)))),
      ),
      seq(/Requires/i, '=', alias($.string_literal, $.typename)),
      seq(
        /SoapAction/i,
        '=',
        alias(choice($.string_literal, $.objectscript_identifier), $.typename),
      ),
      seq(/SoapMessageName/i, '=', $.xml_identifier),
      seq(/SoapRequestMessage/i, '=', $.xml_identifier),
      $._keyword_sql_name,
    ),
  method_keyword: ($) =>
    choice($._method_keyword_no_arg, $._method_keyword_value),
  _method_keywords: ($) => buildKeywords($.method_keyword),
  _method_name_or_list: ($) =>
    choice(
      alias($.identifier, $.method_name),
      seq('(', commaSep1(alias($.identifier, $.method_name)), ')'),
    ),
  _objectscript_method_name_or_list: ($) =>
    choice(
      alias($.objectscript_identifier, $.method_name),
      seq('(', commaSep1(alias($.objectscript_identifier, $.method_name)), ')'),
    ),
  xml_identifier: (_) => /[A-Za-z_][A-Za-z0-9._-]*/,
  /*
      CLASS KEYWORDS
    */

  keyword_class: (_) => /Class/i,
  keyword_extends: (_) => /Extends/i,
  _class_keyword_no_arg: ($) =>
    seq(
      optional($.keyword_not),
      /(?:LegacyInstanceContext|SqlRowIdPrivate|ProcedureBlock|DdlAllowed|Deprecated|NoExtent|Abstract|Hidden|Final)/i,
    ),
  _class_sql_name_keyword: ($) =>
    seq(/(?:SqlRowIdName|SqlTableName)/i, '=', alias($.sql_id, $.query_name)),
  _class_name_list_keyword: ($) =>
    seq(
      /(?:ConstraintClass|ProjectionClass|PropertyClass|CompileAfter|TriggerClass|DependsOn|IndexClass|QueryClass)/i,
      '=',
      $._class_name_or_list,
    ),
  _class_single_class_keyword: ($) =>
    seq(
      /(?:EmbeddedClass|GeneratedBy|membersuper)/i,
      '=',
      alias($.identifier, $.class_name),
    ),
  _class_keyword_value: ($) =>
    choice(
      $._class_name_list_keyword,
      $._class_single_class_keyword,
      $._class_sql_name_keyword,
      $._keyword_client_name,
      $.keyword_server_only,
      $._keyword_soap_binding_style,
      $._keyword_soap_body_use,
      seq(
        /ClassType/i,
        '=',
        choice(
          alias(
            /(?:persistent|datatype|dynamic|serial|stream|index|view)/i,
            $.typename,
          ),
          alias('""', $.typename),
          alias('\'\'', $.typename),
        ),
      ),
      seq(
        /ClientDataType/i,
        '=',
        alias(
          /(?:characterstream|binarystream|ftimestamp|longvarchar|timestamp|currency|boolean|decimal|integer|numeric|varchar|binary|bigint|double|handle|status|fdate|date|list|time)/i,
          $.typename,
        ),
      ),
      seq(/Inheritance/i, '=', alias(/(?:left|right)/i, $.typename)),
      seq(/Language/i, '=', alias(/(?:objectscript|tsql)/i, $.typename)),
      seq(/Modified/i, '=', $.numeric_literal),
      seq(
        /OdbcType/i,
        '=',
        alias(
          /(?:LONGVARBINARY|LONGVARCHAR|TIMESTAMP|RESULTSET|VARBINARY|SMALLINT|VARCHAR|INTEGER|NUMERIC|TINYINT|DOUBLE|BIGINT|STRUCT|DATE|TIME|BIT)/i,
          $.typename,
        ),
      ),
      seq(/Owner/i, '=', seq('{', $.iris_username, '}')),
      seq(/Sharded/i, '=', alias(/1/, $.numeric_literal)),
      seq(
        /SQLCategory/i,
        '=',
        alias(
          /(?:FMTIMESTAMP|TIMESTAMP|FMDATE|STRING|NUMERIC|INTEGER|DOUBLE|MVDATE|NAME|DATE|TIME)/i,
          $.typename,
        ),
      ),
      seq(/StorageStrategy/i, '=', alias($.identifier, $.storage_name)),
      seq(/System/i, '=', alias(/[0-4]/, $.numeric_literal)),
      seq(/ViewQuery/i, '=', '{', $.external_method_body_content, '}'),
    ),
  _class_name_or_list: ($) =>
    choice(
      alias($.identifier, $.class_name),
      seq('(', commaSep1(alias($.identifier, $.class_name)), ')'),
    ),
  _class_keywords: ($) => buildKeywords($.class_keyword),
  class_keyword: ($) => choice($._class_keyword_no_arg, $._class_keyword_value),

  /*
     QUERY KEYWORDS
    */
  keyword_query: (_) => /Query/i,
  _query_keyword_no_arg: ($) =>
    seq(
      optional($.keyword_not),
      /(?:Deprecated|Internal|WebMethod|SqlView|Private|SqlProc|Final)/i,
    ),
  _query_keyword_value: ($) =>
    choice(
      $._keyword_soap_binding_style,
      $._keyword_soap_body_use,
      $._keyword_soap_namespace,
      $._keyword_sql_name,
      seq(/SqlViewName/i, '=', alias($.sql_id, $.query_name)),
      seq(/Requires/i, '=', alias($.string_literal, $.typename)),
      $._keyword_client_name,
    ),
  query_keyword: ($) => choice($._query_keyword_no_arg, $._query_keyword_value),
  _query_keywords: ($) => buildKeywords($.query_keyword),

  /*
      TRIGGER KEYWORDS
    */

  trigger_event_value: ($) =>
    alias(
      /(?:INSERT\/UPDATE\/DELETE|INSERT\/UPDATE|INSERT\/DELETE|UPDATE\/DELETE|DELETE|INSERT|UPDATE)/i,
      $.typename,
    ),
  // TRIGGER KEYWORDS
  keyword_trigger: (_) => /Trigger/i,
  _trigger_keyword_no_arg: ($) =>
    seq(optional($.keyword_not), /(?:Deprecated|Internal|Final)/i),
  _trigger_keyword_value: ($) =>
    choice(
      seq(/CodeMode/i, '=', alias(/(?:objectgenerator|code)/i, $.typename)),
      seq(/Event/i, '=', $.trigger_event_value),
      seq(/Foreach/i, '=', alias(/(?:row\/object|statement|row)/i, $.typename)),
      seq(/(?:NewTable|OldTable)/i, '=', alias($.sql_id, $.query_name)),
      seq(/Order/i, '=', $.numeric_literal),
      $._keyword_sql_name,
      seq(/Time/i, '=', alias(/(?:AFTER|BEFORE)/i, $.typename)),
      seq(
        /UpdateColumnList/i,
        '=',
        choice(
          alias($.sql_id, $.query_name),
          seq(
            '(',
            seq(
              alias($.sql_id, $.query_name),
              repeat(seq(',', alias($.sql_id, $.query_name))),
            ),
            ')',
          ),
        ),
      ),
    ),
  trigger_keyword: ($) =>
    choice($._trigger_keyword_no_arg, $._trigger_keyword_value),
  _trigger_keywords: ($) => buildKeywords($.trigger_keyword),
  _external_trigger_keywords: ($) =>
    specialKeywords($.trigger_keyword, $.method_keyword_external_language),

  /*
    PROPERTY KEYWORDS
    */
  keyword_property: (_) => /Property/i,
  _property_keyword_no_arg: ($) =>
    seq(
      optional($.keyword_not),
      /(?:Multidimensional|Calculated|Deprecated|SqlComputed|Transient|Deferred|Readonly|Required|Identity|Internal|Private|Final)/i,
    ),
  _property_keyword_value: ($) =>
    choice(
      seq(
        /Aliases/i,
        '=',
        '{',
        commaSep1(alias($.objectscript_identifier, $.property_name)),
        '}',
      ),
      $._keyword_client_name,
      buildBoolKeywordArg(/ComputeLocalOnly/i),
      $.keyword_server_only,
      seq(
        /InitialExpression/i,
        '=',
        choice(
          seq('{', $.expression, '}'),
          alias($.string_literal, $.typename),
          alias($.objectscript_identifier, $.typename),
        ),
      ),
      seq(/SqlColumnNumber/i, '=', $.numeric_literal),
      seq(/SqlComputeCode/i, '=', $.rhs_sql_compute_code),
      seq(
        /SqlComputeOnChange/i,
        '=',
        choice(
          prec(
            10,
            seq(
              '(',
              commaSep1(
                choice(
                  alias($.objectscript_identifier, $.typename),
                  $.oref_chain_expr,
                  alias('%%UPDATE', $.typename),
                  alias('%%INSERT', $.typename),
                ),
              ),
              ')',
            ),
          ),
          alias($.objectscript_identifier, $.typename),
          $.oref_chain_expr,
          alias('%%UPDATE', $.typename),
          alias('%%INSERT', $.typename),
        ),
      ),
      seq(/SqlFieldName/i, '=', alias($.sql_id, $.query_name)),
      seq(/SqlListDelimiter/i, '=', alias($.string_literal, $.typename)),
      seq(
        /SqlListType/i,
        '=',
        alias(/(?:DELIMITED|SUBNODE|LIST)/i, $.typename),
      ),
    ),
  keyword_server_only: ($) => buildBoolKeywordArg(/ServerOnly/i),
  sql_id: (_) => /[A-Za-z%_][A-Za-z@_#$0-9]*/,
  rhs_sql_compute_code: ($) =>
    seq(
      '{',
      /Set/i,
      '{',
      choice('*', $.objectscript_identifier),
      '}',
      '=',
      choice(seq('{', $.expression, '}'), $.expression),
      '}',
    ),

  property_keyword: ($) =>
    choice($._property_keyword_no_arg, $._property_keyword_value),
  property_keywords: ($) => buildKeywords($.property_keyword),
  /*
    RELATIONSHIP KEYWORDS
    */
  relationship_keyword: ($) =>
    choice($._keyword_cardinality, $._keyword_inverse, $._keyword_on_delete),
  relationship_keywords: ($) => buildKeywords($.relationship_keyword),
  _keyword_cardinality: ($) =>
    seq(
      /Cardinality/i,
      '=',
      alias(/(?:children|parent|many|one)/i, $.typename),
    ),
  _keyword_inverse: ($) => seq(/inverse/i, '=', $.variable_datatype),
  _keyword_on_delete: ($) =>
    seq(
      /OnDelete/i,
      '=',
      alias(/(?:setdefault|noaction|setnull|cascade)/i, $.typename),
    ),

  /*
    FOREIGNKEY KEYWORDS
    */

  _foreignkey_keyword_no_arg: ($) =>
    seq(optional($.keyword_not), /(?:Deprecated|Internal|NoCheck)/i),
  _foreignkey_keyword_value: ($) =>
    choice(
      seq(
        /OnDelete/i,
        '=',
        alias(/(?:setdefault|noaction|setnull|cascade)/i, $.typename),
      ),
      seq(
        /OnUpdate/i,
        '=',
        alias(/(?:setdefault|noaction|setnull|cascade)/i, $.typename),
      ),
      $._keyword_sql_name,
    ),
  foreignkey_keyword: ($) =>
    choice($._foreignkey_keyword_no_arg, $._foreignkey_keyword_value),
  foreignkey_keywords: ($) => buildKeywords($.foreignkey_keyword),

  keyword_foreignkey: (_) => /ForeignKey/i,
  keyword_references: (_) => /References/i,

  /*
    PARAMETER KEYWORDS
    */
  keyword_parameter: (_) => /Parameter/i,

  _parameter_keyword_no_arg: ($) =>
    seq(optional($.keyword_not), /(?:Deprecated|Abstract|Internal|Final)/i),
  _parameter_keyword_flags: ($) =>
    seq(/Flags/i, '=', choice(alias(/ENUM/i, $.typename), $.keyword_list)),
  _parameter_keyword_constraint: ($) =>
    seq(
      /Constraint/i,
      '=',
      choice($.string_literal, $.objectscript_identifier),
    ),
  parameter_keyword: ($) =>
    choice(
      $._parameter_keyword_no_arg,
      $._parameter_keyword_flags,
      $._parameter_keyword_constraint,
    ),
  parameter_keywords: ($) => buildKeywords($.parameter_keyword),

  /*
    PROJECTION KEYWORDS
    */
  keyword_projection: (_) => /Projection/i,
  _projection_keyword_no_arg: ($) =>
    seq(optional($.keyword_not), /(?:NotInheritable|Deprecated|Internal)/i),
  projection_keyword: ($) => $._projection_keyword_no_arg,
  projection_keywords: ($) => buildKeywords($.projection_keyword),

  /*
    INDEX KEYWORDS
    */
  _index_keyword_no_arg: ($) =>
    seq(
      optional($.keyword_not),
      /(?:PrimaryKey|Deprecated|Abstract|Internal|Deferred|ShardKey|Unique|IdKey)/i,
    ),
  _index_keyword_value: ($) =>
    choice(
      seq(
        /Condition/i,
        '=',
        choice(
          alias($.string_literal, $.typename),
          $.numeric_literal,
          seq('{', $.expression, '}'),
        ),
      ),
      seq(/CoshardWith/i, '=', alias($.identifier, $.class_name)),
      seq(
        /Data/i,
        '=',
        choice(
          alias($._quote_permitting_identifier, $.property_name),
          seq(
            '(',
            commaSep1(alias($._quote_permitting_identifier, $.property_name)),
            ')',
          ),
        ),
      ),
      $._keyword_sql_name,
      seq(
        /type/i,
        '=',
        alias(
          /(?:collatedkey|bitslice|columnar|bitmap|index|key)/i,
          $.typename,
        ),
      ),
    ),
  index_keyword: ($) => choice($._index_keyword_no_arg, $._index_keyword_value),

  index_keywords: ($) => buildKeywords($.index_keyword),
  extent_index_keywords: ($) =>
    specialKeywords($.index_keyword, $.extent_index_keyword),
  extent_index_keyword: ($) => seq(optional($.keyword_not), /Extent/i),

  keyword_index: (_) => /Index/i,

  /*
    XDATA KEYWORDS
    */
  keyword_xdata: (_) => /XData/i,
  xdata_keyword: ($) =>
    choice(
      // NOTE: mimetype is INTENTIONALLY excluded, see $._xdata_any rule
      seq(/SchemaSpec/i, '=', $.string_literal),
      seq(/XMLNamespace/i, '=', $.string_literal),
      seq(optional($.keyword_not), /(?:Deprecated|Internal)/i),
    ),
  mime_type: (_) =>
    token(
      /[A-Za-z0-9!#$&^_.-]+\/[A-Za-z0-9!#$&^_.-]+(?:\+[A-Za-z0-9!#$&^_.-]+)*(?:;[A-Za-z0-9!#$&^_.-]+=[A-Za-z0-9!#$&^_.-]+)*/,
    ),
  xdata_keyword_mimetype: ($) =>
    seq(
      /MimeType/i,
      '=',
      alias(choice($.mime_type, $.string_literal), $.typename),
    ),

  _xdata_keywords: ($) =>
    buildKeywords(choice($.xdata_keyword, $.xdata_keyword_mimetype)),
  /*
      STORAGE KEYWORDS
    */
  keyword_storage: (_) => /Storage/i,

  // COMMON KEYWORDS
  keyword_include: (_) => /Include/i,
  keyword_not: (_) => /Not /i,
  keyword_includegenerator: (_) => /IncludeGenerator/i,
  keyword_byref: (_) => token(prec(1, /ByRef/i)),
  keyword_output: (_) => token(prec(1, /Output/i)),
  keyword_list: (_) => /list/i,
  keyword_array: (_) => /array/i,
};

//
// End-of-file
//
