
/**
 * Keyword definitions
 * NOTE: A file somewhat resembling this can be regenerated in by invoking the appropriate file in scripts/
 */

/* eslint-disable indent */

/**
 *
 * @param rule
 * @param requiredRule
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
 * @param keyword
 */
function buildBoolKeywordArg(keyword) {
  return seq(keyword, '=', /[0-1]/);
}

/**
 *
 * @param keyword
 */
function buildKeywords(keyword) {
  return seq('[', commaSep(keyword), ']');
}

const {
  commaSep1,
  commaSep,
} = require('../common/define_grammar');

// Keyword rules
module.exports = {
    /*
      METHOD KEYWORDS
    */
    keyword_classmethod: (_) => /ClassMethod/i,
    keyword_method: (_) => /Method/i,

    expression_method_keywords: ($) => specialKeywords($.method_keyword, $.method_keyword_codemode_expression),
    external_method_keywords: ($) => specialKeywords($.method_keyword, $.method_keyword_language),
    method_keyword_codemode_expression: ($) => seq(/CodeMode/i, '=', alias(/expression/i, $.typename)),
    method_keyword_codemode: ($) => seq(/CodeMode/i, '=', alias(/(?:objectgenerator|code)/i, $.typename)),
    method_keyword_language_objectscript: ($) => seq(/Language/i, '=', alias(/objectscript/i, $.typename)),
    method_keyword_language: ($) => seq(/Language/i, '=', alias(/(?:python|tsql|ispl)/i, $.typename)),
    _keyword_client_name: ($) => seq(/ClientName/i, '=', alias(/[^\s'`,\[\]\(\)\{\}]+/, $.property_name)),
    _keyword_web_method: ($) => seq(optional($.keyword_not), /WebMethod/i),
    _not_inheritable_keyword: ($) => seq(optional($.keyword_not), /NotInheritable/i),
    _sql_proc_keyword: ($) => seq(optional($.keyword_not), /SqlProc/i),
    _keyword_soap_binding_style: ($) => seq(/SoapBindingStyle/i, '=', alias(/(?:document|rpc)/i, $.typename)),
    _keyword_soap_body_use: ($) => seq(/SoapBodyUse/i, '=', alias(/(?:literal|encoded)/i, $.typename)),
    _keyword_soap_namespace: ($) => seq(/SoapNameSpace/i, '=', choice($.objectscript_identifier, $.string_literal)),
    _method_keyword_no_arg: ($) => seq(
      optional($.keyword_not),
      /(?:ReturnResultsets|NotInheritable|ForceGenerate|Deprecated|Abstract|Internal|WebMethod|Private|SqlProc|Final)/i,
    ),
    _method_keyword_name_list: ($) => seq(/(?:GenerateAfter|PlaceAfter)/i, '=', $._method_name_or_list),
    _method_keyword_public_list: ($) => seq(/PublicList/i, '=', $._objectscript_method_name_or_list),
    _keyword_sql_name: ($) => seq(/SqlName/i, '=', alias($.sql_id, $.query_name)),
    _method_keyword_value: ($) => choice(
      $._keyword_client_name,
      $.keyword_server_only,
      $._keyword_soap_binding_style,
      $._keyword_soap_body_use,
      $._keyword_soap_namespace,
      seq(/ExternalProcName/i, '=', $.objectscript_identifier),
      seq(/CodeMode/i, '=', alias(/(?:objectgenerator|code)/i, $.typename)),
      seq(/Language/i, '=', alias(/objectscript/i, $.typename)),
      seq(/ProcedureBlock/i, optional(seq('=', choice(alias('0', $.false), alias('1', $.true))))),
      seq(/Requires/i, '=', alias($.string_literal, $.typename)),
      seq(/SoapAction/i, '=', alias(choice($.string_literal, $.objectscript_identifier), $.typename)),
      seq(/SoapMessageName/i, '=', $.xml_identifier),
      seq(/SoapRequestMessage/i, '=', $.xml_identifier),
      $._keyword_sql_name,
    ),
  call_method_keyword: ($) => seq(/CodeMode/i, '=', alias(/call/i, $.typename)),
  call_method_keywords: ($) => specialKeywords($.method_keyword, $.call_method_keyword),
  method_keyword: ($) =>
    choice(
            $._method_keyword_no_arg,
            $._method_keyword_name_list,
            $._method_keyword_public_list,
            $._method_keyword_value,
          ),
    method_keywords: ($) => buildKeywords($.method_keyword),
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
    _class_keyword_no_arg: ($) => seq(
      optional($.keyword_not),
      /(?:LegacyInstanceContext|SqlRowIdPrivate|ProcedureBlock|DdlAllowed|Deprecated|NoExtent|Abstract|Hidden|Final)/i,
    ),
    _class_sql_name_keyword: ($) => seq(/(?:SqlRowIdName|SqlTableName)/i, '=', alias($.sql_id, $.query_name)),
    _class_name_list_keyword: ($) => seq(
      /(?:ConstraintClass|ProjectionClass|PropertyClass|CompileAfter|TriggerClass|DependsOn|IndexClass|QueryClass)/i,
      '=',
      $._class_name_or_list,
    ),
    _class_single_class_keyword: ($) => seq(
      /(?:EmbeddedClass|GeneratedBy|membersuper)/i,
      '=',
      alias($.identifier, $.class_name),
    ),
    _class_keyword_value: ($) => choice(
      $._class_name_list_keyword,
      $._class_single_class_keyword,
      $._class_sql_name_keyword,
      $._keyword_client_name,
      $.keyword_server_only,
      $._keyword_soap_binding_style,
      $._keyword_soap_body_use,
      seq(/ClassType/i, '=', choice(
        alias(/(?:persistent|datatype|dynamic|serial|stream|index|view)/i, $.typename),
        alias('""', $.typename),
        alias('\'\'', $.typename),
      )),
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
      seq(/OdbcType/i, '=', alias(
        /(?:LONGVARBINARY|LONGVARCHAR|TIMESTAMP|RESULTSET|VARBINARY|SMALLINT|VARCHAR|INTEGER|NUMERIC|TINYINT|DOUBLE|BIGINT|STRUCT|DATE|TIME|BIT)/i,
        $.typename,
      )),
      seq(/Owner/i, '=', seq('{', $.iris_username, '}')),
      seq(/Sharded/i, '=', alias(/1/, $.numeric_literal)),
      seq(/SQLCategory/i, '=', alias(
        /(?:FMTIMESTAMP|TIMESTAMP|FMDATE|STRING|NUMERIC|INTEGER|DOUBLE|MVDATE|NAME|DATE|TIME)/i,
        $.typename,
      )),
      seq(/StorageStrategy/i, '=', alias($.identifier, $.storage_name)),
      seq(/System/i, '=', alias(/[0-4]/, $.numeric_literal)),
      seq(/ViewQuery/i, '=', '{', $.external_method_body_content, '}'),
    ),
    class_keyword_inheritance: ($) => seq(/Inheritance/i, '=', alias(/(?:left|right)/i, $.typename)),
    class_keyword_language: ($) => seq(/Language/i, '=', alias(/(?:objectscript|tsql)/i, $.typename)),
    class_keyword_sharded: ($) => seq(/Sharded/i, '=', alias(/1/, $.numeric_literal)),
    class_keyword_view_query: ($) =>
      seq(
        /ViewQuery/i,
        '=',
      '{',
        $.external_method_body_content,
      '}',
      ),
    class_keyword_odbc_type: ($) => seq(/OdbcType/i, '=', alias(
      /(?:LONGVARBINARY|LONGVARCHAR|TIMESTAMP|RESULTSET|VARBINARY|SMALLINT|VARCHAR|INTEGER|NUMERIC|TINYINT|DOUBLE|BIGINT|STRUCT|DATE|TIME|BIT)/i,
      $.typename,
    )),
      class_keyword_owner: ($) =>seq(/Owner/i, '=', seq('{', $.iris_username, '}')),
      class_keyword_sql_category: ($) => seq(/SQLCategory/i, '=', alias(
      /(?:FMTIMESTAMP|TIMESTAMP|FMDATE|STRING|NUMERIC|INTEGER|DOUBLE|MVDATE|NAME|DATE|TIME)/i,
      $.typename,
    )),
    class_keyword_storage_strategy: ($) => seq(/StorageStrategy/i, '=', alias($.identifier, $.storage_name)),
    class_keyword_system: ($) => seq(/System/i, '=', alias(/[0-4]/, $.numeric_literal)),

  class_keyword_classtype: ($) =>
    seq(
      /classtype/i,
      '=',
        choice(
          alias(/(?:persistent|datatype|dynamic|serial|stream|index|view)/i, $.typename),
          alias('""', $.typename),
          alias('\'\'', $.typename),
        ),
    ),
  class_keyword_clientdatatype: ($) =>
  seq(
    /clientdatatype/i,
    '=',
      alias(
        /(?:characterstream|binarystream|ftimestamp|longvarchar|timestamp|currency|boolean|decimal|integer|numeric|varchar|binary|bigint|double|handle|status|fdate|date|list|time)/i,
        $.typename,
      ),
  ),
    class_keyword_modified: ($) =>
      seq(
        /Modified/i,
        '=',
        $.numeric_literal,
      ),
    _class_name_or_list: ($) =>
      choice(
        alias($.identifier, $.class_name),
        seq('(', commaSep1(alias($.identifier, $.class_name)), ')'),
      ),
    class_keywords: ($) => buildKeywords($.class_keyword),
    class_keyword: ($) =>
    choice(
      $._class_keyword_no_arg,
      $._class_keyword_value,
    ),
    // QUERY KEYWORDS
    keyword_query: (_) => /Query/i,
    _query_keyword_no_arg: ($) => seq(optional($.keyword_not), /(?:Deprecated|Internal|WebMethod|SqlView|Private|SqlProc|Final)/i),
    _query_keyword_value: ($) => choice(
      $._keyword_soap_binding_style,
      $._keyword_soap_body_use,
      $._keyword_soap_namespace,
      $._keyword_sql_name,
      seq(/SqlViewName/i, '=', alias($.sql_id, $.query_name)),
      seq(/Requires/i, '=', alias($.string_literal, $.typename)),
      $._keyword_client_name,
    ),
    query_keyword_sql_view_name: ($) => seq(/SqlViewName/i, '=', alias($.sql_id, $.query_name)),
    query_keyword: ($) =>
    choice(
      $._query_keyword_no_arg,
      $._query_keyword_value,
    ),
    query_keywords: ($) => buildKeywords($.query_keyword),


    trigger_keyword_foreach: ($) =>
      seq(
        /Foreach/i,
        '=',
        alias(/(?:row\/object|statement|row)/i, $.typename),
      ),
    trigger_keyword_event: ($) =>
      seq(
        /Event/i,
        '=',
        $.trigger_event_value,
      ),

    trigger_event_value: ($) =>
      alias(/(?:INSERT\/UPDATE\/DELETE|INSERT\/UPDATE|INSERT\/DELETE|UPDATE\/DELETE|DELETE|INSERT|UPDATE)/i, $.typename),

    trigger_keyword_order: ($) =>
      seq(
        /Order/i,
        '=',
        $.numeric_literal,
      ),

    trigger_keyword_time: ($) =>
      seq(
        /Time/i,
        '=',
        alias(/(?:AFTER|BEFORE)/i, $.typename),
      ),
    trigger_keyword_newtable: ($) => seq(
      /NewTable/i,
      '=',
      alias($.sql_id, $.query_name),
    ),
    trigger_keyword_oldtable: ($) => seq(
      /OldTable/i,
      '=',
      alias($.sql_id, $.query_name),
    ),
    trigger_keyword_update_column_list: ($) =>
      seq(
        /UpdateColumnList/i,
        '=',
          choice(
            alias($.sql_id, $.query_name),
            seq(
              '(',
              seq(alias($.sql_id, $.query_name), repeat(seq(',', alias($.sql_id, $.query_name)))),
              ')',
            ),
          ),
      ),
    keyword_list: (_)=> /list/i,
    keyword_array: (_)=> /array/i,
    // TRIGGER KEYWORDS
    keyword_trigger: (_) => /Trigger/i,
    _trigger_keyword_no_arg: ($) => seq(optional($.keyword_not), /(?:Deprecated|Internal|Final)/i),
    _trigger_keyword_value: ($) => choice(
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
          seq('(', seq(alias($.sql_id, $.query_name), repeat(seq(',', alias($.sql_id, $.query_name)))), ')'),
        ),
      ),
    ),
    trigger_keyword: ($) =>
    choice(
      $._trigger_keyword_no_arg,
      $._trigger_keyword_value,
    ),
    trigger_keywords: ($) => buildKeywords($.trigger_keyword),
    external_trigger_keywords: ($) =>
      seq(
        '[',
        repeat(seq($.trigger_keyword, ',')),
        $.method_keyword_language,
        repeat(seq(',', $.trigger_keyword)),
        ']',
      ),

    /*
    PROPERTY KEYWORDS
    */
       keyword_property: (_) => /Property/i,
    property_keyword_aliases: ($) => seq(/Aliases/i, '=', '{', commaSep1(alias($.objectscript_identifier, $.property_name)), '}'),
    _property_keyword_no_arg: ($) => seq(
      optional($.keyword_not),
      /(?:Multidimensional|Calculated|Deprecated|SqlComputed|Transient|Deferred|Readonly|Required|Identity|Internal|Private|Final)/i,
    ),
    _property_keyword_value: ($) => choice(
      seq(/Aliases/i, '=', '{', commaSep1(alias($.objectscript_identifier, $.property_name)), '}'),
      $._keyword_client_name,
      buildBoolKeywordArg(/ComputeLocalOnly/i),
      $.keyword_server_only,
      seq(/InitialExpression/i, '=', choice(seq('{', $.expression, '}'), alias($.string_literal, $.typename), alias($.objectscript_identifier, $.typename))),
      seq(/SqlColumnNumber/i, '=', $.numeric_literal),
      seq(/SqlComputeCode/i, '=', $.rhs_sql_compute_code),
      seq(/SqlComputeOnChange/i, '=', choice(seq('(', commaSep1(choice(alias($.objectscript_identifier, $.typename), $.oref_set_target, alias('%%UPDATE', $.typename), alias('%%INSERT', $.typename))), ')'), choice(alias($.objectscript_identifier, $.typename), $.oref_set_target, alias('%%UPDATE', $.typename), alias('%%INSERT', $.typename)))),
      seq(/SqlFieldName/i, '=', alias($.sql_id, $.query_name)),
      seq(/SqlListDelimiter/i, '=', alias($.string_literal, $.typename)),
      seq(/SqlListType/i, '=', alias(/(?:DELIMITED|SUBNODE|LIST)/i, $.typename)),
    ),
    property_keyword_compute_local_only: ($) => buildBoolKeywordArg(/ComputeLocalOnly/i),
    keyword_server_only: ($) => buildBoolKeywordArg(/ServerOnly/i),
    property_keyword_sql_column_number: ($) => seq(/SqlColumnNumber/i, '=', $.numeric_literal),
    property_keyword_sql_compute_on_change: ($) => seq(/SqlComputeOnChange/i, '=', choice(seq('(', commaSep1(choice(alias($.objectscript_identifier, $.typename), $.oref_set_target, alias('%%UPDATE', $.typename), alias('%%INSERT', $.typename))), ')'), choice(alias($.objectscript_identifier, $.typename), $.oref_set_target, alias('%%UPDATE', $.typename), alias('%%INSERT', $.typename)))),
    property_keyword_sql_field_name: ($) => seq(/SqlFieldName/i, '=', alias($.sql_id, $.query_name)),
    property_keyword_sql_list_delim: ($) => seq(/SqlListDelimiter/i, '=', alias($.string_literal, $.typename)),
    property_keyword_sql_list_type: ($) =>
      seq(
        /SqlListType/i,
        '=',
        alias(/(?:DELIMITED|SUBNODE|LIST)/i, $.typename)),
    sql_id: (_) => /[A-Za-z%_][A-Za-z@_#$0-9]*/,
    rhs_sql_compute_code: ($) => seq('{',
        /Set/i,
        '{',
        choice('*', $.objectscript_identifier),
        '}',
        '=',
        choice(
          seq(
            '{',
            $.expression,
            '}',
          ),
          $.expression,
        ),
        '}',
    ),

    property_keyword: ($) =>
      choice(
        $._property_keyword_no_arg,
        $._property_keyword_value,
      ),
    property_keywords: ($) => buildKeywords($.property_keyword),
    relationship_keyword: ($) =>
      choice(
            $._keyword_cardinality,
            $._keyword_inverse,
            $._keyword_on_delete,
          ),
    /*
    RELATIONSHIP KEYWORDS
    */
    relationship_keywords: ($) => buildKeywords($.relationship_keyword),
    _keyword_cardinality: ($) =>
      seq(
        /Cardinality/i,
        '=',
        alias(/(?:children|parent|many|one)/i, $.typename),
      ),
    _keyword_inverse: ($) =>
      seq(
        /inverse/i,
        '=',
        $.variable_datatype,
      ),
    _keyword_on_delete: ($) =>
      seq(
       /OnDelete/i,
        '=',
        alias(/(?:setdefault|noaction|setnull|cascade)/i, $.typename),
      ),

    /*
    FOREIGNKEY KEYWORDS
    */

    _foreignkey_keyword_no_arg: ($) =>seq(optional($.keyword_not), /(?:Deprecated|Internal|NoCheck)/i),
    _foreignkey_keyword_value: ($) => choice(
      seq(/OnDelete/i, '=', alias(/(?:setdefault|noaction|setnull|cascade)/i, $.typename)),
      seq(/OnUpdate/i, '=', alias(/(?:setdefault|noaction|setnull|cascade)/i, $.typename)),
      $._keyword_sql_name,
    ),
    foreignkey_keyword: ($) =>
    choice(
      $._foreignkey_keyword_no_arg,
      $._foreignkey_keyword_value,
    ),
    foreignkey_keywords: ($) => buildKeywords($.foreignkey_keyword),

    keyword_foreignkey: (_) => /ForeignKey/i,
    keyword_references: (_) => /References/i,

    /*
    PARAMETER KEYWORDS
    */
    keyword_parameter: (_) => /Parameter/i,

    _parameter_keyword_no_arg: ($) => seq(optional($.keyword_not), /(?:Deprecated|Abstract|Internal|Final)/i),
    _parameter_keyword_flags: ($) => seq(/Flags/i, '=', choice(alias(/ENUM/i, $.typename), $.keyword_list)),
    _parameter_keyword_constraint: ($) => seq(/Constraint/i, '=', choice($.string_literal, $.objectscript_identifier)),
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
    _projection_keyword_no_arg: ($) => seq(optional($.keyword_not), /(?:NotInheritable|Deprecated|Internal)/i),
    projection_keyword: ($) =>
    $._projection_keyword_no_arg,
    projection_keywords: ($) => buildKeywords($.projection_keyword),

    /*
    INDEX KEYWORDS
    */
    _index_keyword_no_arg: ($) => seq(optional($.keyword_not), /(?:PrimaryKey|Deprecated|Abstract|Internal|Deferred|ShardKey|Unique|IdKey)/i),
    _index_keyword_value: ($) => choice(
      seq(/Condition/i, '=', choice(alias($.string_literal, $.typename), $.numeric_literal, seq('{', $.expression, '}'))),
      seq(/CoshardWith/i, '=', alias($.identifier, $.class_name)),
      seq(
        /Data/i,
        '=',
        choice(
          alias($.quote_permitting_identifier, $.property_name),
          seq('(', commaSep1(alias($.quote_permitting_identifier, $.property_name)), ')'),
        ),
      ),
      $._keyword_sql_name,
      seq(/type/i, '=', alias(/(?:collatedkey|bitslice|columnar|bitmap|index|key)/i, $.typename)),
    ),
    index_keyword: ($) =>
      choice(
        $._index_keyword_no_arg,
        $._index_keyword_value,
      ),
    index_keywords: ($) => buildKeywords($.index_keyword),
    _keyword_extent: ($) => seq(optional($.keyword_not), /Extent/i),
    extent_index_keywords: ($) => specialKeywords($.index_keyword, $._keyword_extent),

    keyword_index: (_) => /Index/i,

    /*
    XDATA KEYWORDS
    */
    keyword_xdata: (_) => /XData/i,
    xdata_keyword: ($) =>
    choice(
      // NOTE: mimetype is INTENTIONALLY excluded, see $._xdata_any rule
      seq(/SchemaSpec/i, '=', alias($.string_literal, $.typename)),
      seq(/XMLNamespace/i, '=', alias($.string_literal, $.typename)),
      seq(optional($.keyword_not), /(?:Deprecated|Internal)/i)),
    mime_type: (_) =>
      token(
        /[A-Za-z0-9!#$&^_.-]+\/[A-Za-z0-9!#$&^_.-]+(?:\+[A-Za-z0-9!#$&^_.-]+)*(?:;[A-Za-z0-9!#$&^_.-]+=[A-Za-z0-9!#$&^_.-]+)*/,
      ),

    xdata_keywords: ($) => buildKeywords($.xdata_keyword),

    xdata_keyword_mimetype: ($) =>
      seq(
        /MimeType/i,
        '=',
        alias(choice($.mime_type, $.string_literal), $.typename),
      ),
    xdata_keywords_any: ($) => specialKeywords($.xdata_keyword, $.xdata_keyword_mimetype),
    /*
      STORAGE KEYWORDS
    */
    keyword_storage: (_) => /Storage/i,
    storage_keywords: (_) =>
      seq(
          '[',
          ']',
        ),

    // COMMON KEYWORDS
    keyword_include: (_) => /Include/i,
    keyword_not: (_) => /Not /i,
    keyword_includegenerator: (_) => /IncludeGenerator/i,
    keyword_byref: (_) => token(prec(1, /ByRef/i)),
    keyword_output: (_) => token(prec(1, /Output/i)),


};

//
// End-of-file
//
