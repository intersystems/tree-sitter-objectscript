/**
 * Keyword definitions
 * NOTE: A file somewhat resembling this can be regenerated in by invoking the appropriate file in scripts/
 */

/* eslint-disable indent */
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
// Keyword rules
module.exports = {
    /*
      METHOD KEYWORDS
    */
    keyword_classmethod: (_) => /ClassMethod/i,
    keyword_method: (_) =>  /Method/i,
    expression_method_keywords: ($) =>
    seq(
      '[',
      repeat(seq($.method_keyword, ',')),
      $.method_keyword_codemode_expression,
      repeat(seq(',', $.method_keyword)),
      ']',
    ),

    external_method_keywords: ($) =>
      seq(
        '[',
        repeat(seq($.method_keyword, ',')),
        $.method_keyword_language,
        repeat(seq(',', $.method_keyword)),
        ']',
      ),
    method_keyword_codemode_expression:($) => seq(/CodeMode/i,'=', alias(/expression/i,$.rhs)),
    method_keyword_codemode: ($) => seq(/CodeMode/i,'=', alias(choice(/code/i,/objectgenerator/i),$.rhs)),
    method_keyword_language_objectscript: ($) => seq(/Language/i,'=', alias(/objectscript/i, $.rhs)),
    method_keyword_language: ($) => seq(/Language/i,'=', alias(choice(/python/i,/tsql/i,/ispl/i), $.rhs)),
    method_keyword_external_proc_name: ($) => seq(/ExternalProcName/i,'=', alias($.objectscript_identifier,$.rhs)),
    method_keyword_force_generate: ($) => seq(optional($.keyword_not),/ForceGenerate/i),
    method_keyword_not_inheritable: ($) => seq(optional($.keyword_not),/NotInheritable/i),
    method_keyword_sql_proc: ($) => seq(optional($.keyword_not),/SqlProc/i),
    method_keyword_web_method: ($) => seq(optional($.keyword_not),/WebMethod/i),
    method_keyword_return_results_set: ($) => seq(optional($.keyword_not),/ReturnResultsets/i),
    method_keyword_public_list: ($) => seq(/PublicList/i, '=', choice(alias($.objectscript_identifier,$.rhs), seq('(',repeat_with_commas(alias($.objectscript_identifier,$.rhs)), ')'))),
    method_keyword_procedure_block: ($) => seq(/ProcedureBlock/i,optional(seq('=',alias(/[0-1]/,$.rhs)))),
    method_keyword_soap_binding_style: ($) => seq(/SoapBindingStyle/i,'=',alias(choice(/document/i,/rpc/i),$.rhs)),
    method_keyword_soap_body_use: ($) => seq(/SoapBodyUse/i,'=',alias(choice(/literal/i,/encoded/i),$.rhs)),
    method_keyword_soap_namespace: ($) => seq(/SoapNameSpace/i,'=',alias(choice($.objectscript_identifier,$.string_literal),$.rhs)),
    method_keyword_sql_name: ($) => seq(/SqlName/i,'=',alias($.sql_id,$.rhs)),
    method_keyword_generate_after: ($) => 
      seq(
        /GenerateAfter/i,
        '=',
          choice(
          seq(
            '(',
            repeat_with_commas(alias($.identifier, $.rhs)),
            ')'
          ),
          alias($.identifier,$.rhs)
        )
      ),
    method_keyword_place_after: ($) => 
      seq(
        /PlaceAfter/i,
        '=',
        choice(
          seq(
            '(',
            repeat_with_commas(alias($.identifier, $.rhs)),
            ')'
          ),
          alias($.identifier,$.rhs)
        )
      ),
    method_keyword_requires: ($) =>
      seq(
        /Requires/i,
        '=',
        alias($.string_literal,$.rhs),
      ),
    method_keyword_soap_message_name: ($) =>
  seq(
    /SoapMessageName/i,
    '=',
    alias($.xml_identifier,$.rhs), 
  ),
    method_keyword_soap_action: ($) =>
  seq(
    /SoapAction/i,
    '=',
    alias(choice($.string_literal, $.objectscript_identifier),$.rhs)
  ),
  call_method_keyword: ($) => seq(/CodeMode/i,'=', alias(/call/i,$.rhs),),
  call_method_keywords: ($) =>
    seq(
        '[',
        repeat(seq($.method_keyword, ',')),
        $.call_method_keyword,
        repeat(seq(',', $.method_keyword)),
        ']',
      ),
  method_keyword: ($) => 
    choice(
            $.parameter_keyword_abstract,
            $.property_keyword_client_name,
            $.parameter_keyword_deprecated,
            $.method_keyword_external_proc_name,
            $.parameter_keyword_final,
            $.method_keyword_force_generate,
            $.method_keyword_codemode,
            $.method_keyword_generate_after,
            $.parameter_keyword_internal,
            $.method_keyword_not_inheritable,
            $.method_keyword_place_after,
            $.property_keyword_private,
            $.method_keyword_procedure_block,
            $.method_keyword_return_results_set,
            $.method_keyword_public_list,
            $.property_keyword_server_only,
            $.method_keyword_requires,
            $.method_keyword_soap_binding_style,
            $.method_keyword_soap_body_use,
            $.method_keyword_soap_action,
            $.method_keyword_soap_namespace,
            $.method_keyword_soap_message_name,
            $.method_keyword_web_method,
            $.method_keyword_sql_proc,
            $.method_keyword_sql_name,
            $.method_keyword_soap_request_message,
            $.method_keyword_language_objectscript,
          ),
    method_keywords: ($) => 
      seq(
        '[',
        optional(repeat_with_commas(
          $.method_keyword,
        )),
        ']'
    ),
    xml_identifier: (_) => /[A-Za-z_][A-Za-z0-9._-]*/,
    method_keyword_soap_request_message: ($) =>
      seq(
        /SoapRequestMessage/i,
        '=',
        field('soap_request_message', $.xml_identifier),
      ),

    /*
      CLASS KEYWORDS
    */

    keyword_class: (_) => /Class/i,
    keyword_extends: (_) => /Extends/i,
    class_keyword_sql_row_id_name: ($) => seq(/SqlRowIdName/i,'=',alias($.sql_id,$.rhs)),
    class_keyword_sql_table_name: ($) => seq(/SqlTableName/i,'=',alias($.sql_id,$.rhs)),
    class_keyword_ddl_allowed: ($) => seq(optional($.keyword_not),/DdlAllowed/i),
    class_keyword_hidden: ($) => seq(optional($.keyword_not),/Hidden/i),
    class_keyword_legacy_instance_context: ($) => seq(optional($.keyword_not),/LegacyInstanceContext/i),
    class_keyword_no_extent: ($) => seq(optional($.keyword_not),/NoExtent/i),
    class_keyword_inheritance: ($) => seq(/Inheritance/i,'=',alias(choice(/left/i,/right/i),$.rhs)),
    class_keyword_language: ($) => seq(/Language/i,'=',alias(choice(/objectscript/i,/tsql/i),$.rhs)),
    class_keyword_sharded: ($) => seq(/Sharded/i,'=',alias(/1/,$.rhs)),
    class_keyword_view_query: ($) => 
      seq(
        /ViewQuery/i,
        '=',
      '{',
        alias($.external_method_body_content, $.rhs),
      '}',
      ),
    class_keyword_odbc_type: ($) => seq(/OdbcType/i,'=',alias(
      choice(
        /BIGINT/i,
        /BIT/i,
        /LONGVARCHAR/i,
        /TIMESTAMP/i,
        /NUMERIC/i,
        /TINYINT/i,
        /DATE/i,
        /RESULTSET/i,
        /VARBINARY/i,
        /DOUBLE/i,
        /SMALLINT/i,
        /VARCHAR/i,
        /INTEGER/i,
        /STRUCT/i,
        /LONGVARBINARY/i,
        /TIME/i
      ),$.rhs)),
      class_keyword_owner: ($) =>seq(/Owner/i, '=',seq('{',alias($.iris_username,$.rhs),'}')),
      class_keyword_procedure_block: ($) => seq(optional($.keyword_not),/ProcedureBlock/i),
      class_keyword_sql_row_id_private: ($) => seq(optional($.keyword_not),/SqlRowIdPrivate/i),
      class_keyword_sql_category: ($) => seq(/SQLCategory/i,'=',alias(
      choice(
        /NAME/i,
        /FMDATE/i,
        /STRING/i,
        /TIMESTAMP/i,
        /NUMERIC/i,
        /FMTIMESTAMP/i,
        /DATE/i,
        /DOUBLE/i,
        /INTEGER/i,
        /MVDATE/i,
        /TIME/i
      ),$.rhs)),
    class_keyword_storage_strategy: ($) => seq(/StorageStrategy/i,'=',alias($.identifier,$.rhs)),
    class_keyword_system: ($) => seq(/System/i,'=',alias(/[0-4]/,$.rhs)),
    propertyclass_list: ($) =>
    choice(
      $.identifier,

      seq(
        '(',
        repeat_with_commas($.identifier),
        ')'
      )
    ),

  class_keyword_propertyclass: ($) =>
    seq(
      /PropertyClass/i,
      '=',
      alias($.propertyclass_list,$.rhs)
    ),
  class_keyword_embedded_class: ($) => 
    seq(
      /EmbeddedClass/i,
      '=',
      alias($.identifier, $.rhs)
    ),
  class_keyword_classtype: ($) =>
    seq(
      /classtype/i,
      '=',
        choice(
          alias(/datatype/i, $.rhs),
          alias(/dynamic/i, $.rhs),
          alias(/index/i, $.rhs),
          alias(/persistent/i, $.rhs),
          alias(/serial/i, $.rhs),
          alias(/stream/i, $.rhs),
          alias(/view/i, $.rhs),
          alias('""', $.rhs),
          alias("''", $.rhs) 
        )
    ),    
  class_keyword_clientdatatype: ($) =>
  seq(
    /clientdatatype/i,
    '=',
      choice(
        alias(/bigint/i, $.rhs),
        alias(/binary/i, $.rhs),
        alias(/binarystream/i, $.rhs),
        alias(/boolean/i, $.rhs),
        alias(/characterstream/i, $.rhs),
        alias(/currency/i, $.rhs),
        alias(/date/i, $.rhs),
        alias(/decimal/i, $.rhs),
        alias(/double/i, $.rhs),
        alias(/fdate/i, $.rhs),
        alias(/ftimestamp/i, $.rhs),
        alias(/handle/i, $.rhs),
        alias(/integer/i, $.rhs),
        alias(/list/i, $.rhs),
        alias(/longvarchar/i, $.rhs),
        alias(/numeric/i, $.rhs),
        alias(/status/i, $.rhs),
        alias(/time/i, $.rhs),
        alias(/timestamp/i, $.rhs),
        alias(/varchar/i, $.rhs)  
      )
  ),
    class_keyword_depends_on: ($) => 
      seq(
        /DependsOn/i, 
        '=', 
      choice(
        seq(
          '(',
          repeat_with_commas(alias($.identifier, $.rhs)),
          ')'
        ),
        seq(
          alias($.identifier,$.rhs)
        )
      )
    ),
    class_keyword_constraintclass_on: ($) => 
      seq(
        /ConstraintClass/i, 
        '=', 
      choice(
        seq(
          '(',
          repeat_with_commas(alias($.identifier, $.rhs)),
          ')'
        ),
        seq(
          alias($.identifier,$.rhs)
        )
      )
    ),

    class_keyword_compile_after: ($) => 
      seq(
        /CompileAfter/i, 
        '=', 
      choice(
        seq(
          '(',
          repeat_with_commas(alias($.identifier, $.rhs)),
          ')'
        ),
        seq(
          alias($.identifier,$.rhs)
        )
      )
    ),
    class_keyword_generated_by: ($) => 
      seq(
        /GeneratedBy/i,
        '=',
          alias($.identifier,$.rhs)
      ),
  
    class_keyword_indexclass: ($) =>
      seq(
        /indexclass/i,
        '=',
          choice(
            // IndexClass = Some.Package.Class
            alias($.identifier, $.rhs),

            // IndexClass = (Some.A, Some.B)
            seq('(', repeat_with_commas(alias($.identifier, $.rhs)), ')')
          )
      ),
    class_keyword_membersuper: ($) =>
      seq(
        /membersuper/i,
        '=',
        field("value", alias($.identifier, $.rhs)) 
      ),
    class_keyword_projection_class: ($) =>
      seq(
        /ProjectionClass/i,
        '=',
          choice(
            alias($.identifier, $.rhs),

            seq('(', repeat_with_commas(alias($.identifier, $.rhs)), ')')
          )
      ),
    class_keyword_modified: ($) =>
      seq(
        /Modified/i,
        '=',
            alias($.numeric_literal, $.rhs),
      ),
    class_keyword_triggerclass: ($) =>
      seq(
        /TriggerClass/i,
        '=',
        field(
          "value",
          choice(
            alias($.identifier, $.rhs),

            seq(
              '(',
              seq(alias($.identifier, $.rhs), repeat(seq(',', alias($.identifier, $.rhs)))),
              ')'
            )
          )
        )
      ),
    class_keyword_queryclass: ($) =>
      seq(
        /QueryClass/i,
        '=',
        field(
          "value",
          choice(
            alias($.identifier, $.rhs),

            seq(
              '(',
              seq(alias($.identifier, $.rhs), repeat(seq(',', alias($.identifier, $.rhs)))),
              ')'
            )
          )
        )
      ),
    class_keywords: ($) => 
      seq('[',optional(repeat_with_commas($.class_keyword)),']'),
    class_keyword: ($) =>
    choice(
      $.parameter_keyword_abstract,
      $.class_keyword_classtype,
      $.class_keyword_clientdatatype,
      $.class_keyword_compile_after,
      $.class_keyword_constraintclass_on,
      $.class_keyword_ddl_allowed,
      $.class_keyword_depends_on,
      $.parameter_keyword_deprecated,
      $.class_keyword_generated_by,
      $.class_keyword_embedded_class, 
      $.parameter_keyword_final,
      $.class_keyword_hidden,
      $.class_keyword_indexclass, 
      $.class_keyword_inheritance,
      $.class_keyword_language,
      $.class_keyword_legacy_instance_context,
      $.class_keyword_membersuper,
      $.class_keyword_modified,
      $.class_keyword_no_extent, 
      $.class_keyword_odbc_type,
      $.class_keyword_owner,
      $.class_keyword_procedure_block,
      $.class_keyword_projection_class,
      $.class_keyword_propertyclass, 
      $.property_keyword_client_name,
      $.class_keyword_queryclass,
      $.property_keyword_server_only,
      $.class_keyword_sharded,
      $.method_keyword_soap_binding_style,
      $.method_keyword_soap_body_use,
      $.class_keyword_sql_category,
      $.class_keyword_sql_row_id_name,
      $.class_keyword_sql_row_id_private,
      $.class_keyword_sql_table_name,
      $.class_keyword_storage_strategy,
      $.class_keyword_system,
      $.class_keyword_triggerclass, 
      $.class_keyword_view_query,
    ),
    // QUERY KEYWORDS 
    keyword_query: (_) => /Query/i,
    query_keyword_sql_view:($) => seq(optional($.keyword_not),/SqlView/i),
    query_keyword_sql_view_name: ($) => seq(/SqlViewName/i,'=',alias($.sql_id,$.rhs)),
    query_keyword: ($) =>
    choice(
      $.parameter_keyword_deprecated,
      $.parameter_keyword_final,
      $.parameter_keyword_internal,
      $.property_keyword_private,
      $.method_keyword_soap_binding_style,
      $.method_keyword_soap_body_use,
      $.method_keyword_sql_name,
      $.method_keyword_sql_proc,
      $.query_keyword_sql_view,
      $.query_keyword_sql_view_name,
      $.method_keyword_web_method,
      $.method_keyword_requires,
      $.property_keyword_client_name,
      $.method_keyword_soap_namespace,
    ),
    query_keywords: ($) => 
      seq(
        '[',
        optional(repeat_with_commas(
          $.query_keyword,
        )),
        ']'
      ),
    

    trigger_keyword_foreach: ($) => 
      seq(
        /Foreach/i,
        '=',
        alias(choice(
          /row\/object/i,
          /row/i,
          /statement/i
        ), $.rhs),
      ),
    trigger_keyword_event: ($) =>
      seq(
        field('name', /Event/i),
        '=',
        field('value', alias($.trigger_event_value, $.rhs)),
      ),

    trigger_event_value: (_) =>
      choice(
        /DELETE/i,
        /INSERT/i,
        /UPDATE/i,
        /INSERT\/UPDATE/i,
        /INSERT\/DELETE/i,
        /UPDATE\/DELETE/i,
        /INSERT\/UPDATE\/DELETE/i,
      ),
    
    trigger_keyword_order: ($) => 
      seq(
        field('name', /Order/i),
        '=',
        field('value', alias($.numeric_literal, $.rhs)),
      ),

    trigger_keyword_time: ($) => 
      seq(
        field('name', /Time/i),
        '=',
        field('value', alias(choice(/AFTER/i,/BEFORE/i), $.rhs)),
      ),
    trigger_keyword_newtable: ($) => seq(
      /NewTable/i,
      '=',
      alias($.sql_id,$.rhs)
    ),
    trigger_keyword_oldtable: ($) => seq(
      /OldTable/i,
      '=',
      alias($.sql_id,$.rhs)
    ),
    trigger_keyword_update_column_list: ($) => 
      seq(
        /UpdateColumnList/i,
        '=',
        field(
          "value",
          choice(
            alias($.sql_id, $.rhs),

            seq(
              '(',
              seq(alias($.sql_id, $.rhs), repeat(seq(',', alias($.sql_id, $.rhs)))),
              ')'
            )
          )
        )
      ),
    keyword_list:(_)=> /list/i,
    keyword_array:(_)=> /array/i,
    // TRIGGER KEYWORDS 
    keyword_trigger: (_) => /Trigger/i,
    trigger_keyword: ($) =>
    choice(
      $.method_keyword_codemode,
      $.parameter_keyword_deprecated,
      $.trigger_keyword_event,
      $.parameter_keyword_final,
      $.trigger_keyword_foreach,
      $.parameter_keyword_internal,
      $.trigger_keyword_newtable,
      $.trigger_keyword_oldtable,
      $.trigger_keyword_order,
      $.method_keyword_sql_name,
      $.trigger_keyword_time,
      $.trigger_keyword_update_column_list,
    ),
    trigger_keywords: ($) => 
      seq(
        '[',
        optional(
          repeat_with_commas(
            $.trigger_keyword,
          )
        ),
        ']'
      ),
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
    property_keyword_aliases: ($) => seq(/Aliases/i, '=', '{', repeat_with_commas(alias($.objectscript_identifier, $.rhs)), '}'),
    property_keyword_calculated: ($) => seq(optional($.keyword_not),/Calculated/i),
    property_keyword_client_name: ($) => seq(/ClientName/i,'=', alias(/[^\s'`,\[\]\(\)\{\}]+/,$.rhs)),
    property_keyword_compute_local_only: ($) => seq(/ComputeLocalOnly/i,'=', alias(/[0-1]/,$.rhs)),
    property_keyword_deferred: ($) => seq(optional($.keyword_not),/Deferred/i),
    property_keyword_identity: ($) => seq(optional($.keyword_not),/Identity/i),
    property_keyword_multidimensional: ($) => seq(optional($.keyword_not),/Multidimensional/i),
    property_keyword_private: ($) => seq(optional($.keyword_not),/Private/i),
    property_keyword_transient: ($) => seq(optional($.keyword_not),/Transient/i),
    property_keyword_readonly: ($) => seq(optional($.keyword_not),/ReadOnly/i),
    property_keyword_required: ($) => seq(optional($.keyword_not),/Required/i),
    property_keyword_server_only: ($) => seq(/ServerOnly/i,'=', alias(/[0-1]/,$.rhs)),
    property_keyword_sql_column_number: ($) => seq(/SqlColumnNumber/i,'=', alias($.numeric_literal,$.rhs)),
    property_keyword_sql_computed: ($) => seq(optional($.keyword_not),/SqlComputed/i),
    property_keyword_sql_compute_on_change: ($) => seq(/SqlComputeOnChange/i, '=', choice(seq('(',repeat_with_commas(alias(choice($.objectscript_identifier,$.oref_set_target,'%%UPDATE','%%INSERT'),$.rhs)),')'),alias(choice($.objectscript_identifier,$.oref_set_target,'%%UPDATE','%%INSERT'),$.rhs))),
    property_keyword_sql_field_name: ($) => seq(/SqlFieldName/i,'=',alias($.sql_id,$.rhs)),
    property_keyword_sql_list_delim: ($) => seq(/SqlListDelimiter/i,'=',alias($.string_literal,$.rhs)),
    property_keyword_sql_list_type: ($) => 
      seq(
        /SqlListType/i,
        '=',
        alias(choice(/LIST/i,/DELIMITED/i,/SUBNODE/i),$.rhs)),
    sql_id: (_) => /[A-Za-z%_][A-Za-z@_#$0-9]*/,
    property_keyword_sql_compute_code: ($) => 
      seq(
        /SqlComputeCode/i, 
        '=', 
        alias($.rhs_sql_compute_code,$.rhs),
      ),

    rhs_sql_compute_code: ($) => seq(
      '{',
        /Set/i,
        '{', 
        choice('*',$.objectscript_identifier), 
        '}', 
        '=',
        choice(
          seq(
            '{',
            $.expression,
            '}',
          ),
          $.expression
        ),
        '}'
    ),

    property_keyword_initial_expression: ($) => 
      seq(/InitialExpression/i,'=',choice(seq('{',alias($.expression,$.rhs),'}'), alias($.string_literal,$.rhs), alias($.objectscript_identifier,$.rhs))),
    property_keyword: ($) => 
      choice(
        $.property_keyword_aliases,
        $.property_keyword_calculated,
        $.property_keyword_client_name,
        $.property_keyword_compute_local_only,
        $.property_keyword_deferred,
        $.parameter_keyword_deprecated,
        $.parameter_keyword_final,
        $.property_keyword_identity,
        $.property_keyword_initial_expression,
        $.parameter_keyword_internal,
        $.property_keyword_multidimensional,
        $.property_keyword_private,
        $.property_keyword_readonly,
        $.property_keyword_required,
        $.property_keyword_server_only,
        $.property_keyword_sql_column_number,
        $.property_keyword_sql_compute_code,
        $.property_keyword_sql_computed,
        $.property_keyword_sql_compute_on_change,
        $.property_keyword_sql_field_name,
        $.property_keyword_sql_list_delim,
        $.property_keyword_sql_list_type,
        $.property_keyword_transient
      ),
    property_keywords: ($) => 
      seq(
        '[',
        optional(repeat_with_commas($.property_keyword)),
      ']'
      ),
    relationship_keyword: ($) => 
      choice(
            $.relationship_keyword_cardinality,
            $.relationship_keyword_inverse,
            $.relationship_keyword_on_delete,
          ),
    /*
    RELATIONSHIP KEYWORDS
    */
   relationship_keywords: ($) => 
      choice(
      seq(
        '[', 
        repeat_with_commas(
          $.relationship_keyword
        ),
        ']'
      ),
      seq(
        '[',
        ']'
      )
      ),
    relationship_keyword_cardinality: ($) => 
      seq(
        /Cardinality/i, 
        '=', 
        alias(choice(/one/i,/many/i,/parent/i,/children/i), $.rhs),
      ),
    relationship_keyword_inverse: ($) => 
      seq(
        /inverse/i,
        '=',
        alias(choice($.objectscript_identifier,$.oref_set_target), $.rhs)
      ),
    relationship_keyword_on_delete: ($) => 
      seq(
       /OnDelete/i,
        '=', 
        alias(choice(/cascade/i,/noaction/i,/setdefault/i,/setnull/i), $.rhs)
      ),

    /*
    FOREIGNKEY KEYWORDS
    */

    foreignkey_keyword_no_check: ($) =>seq(optional($.keyword_not),/NoCheck/i), 
    foreignkey_keyword: ($) =>
    choice(
      $.parameter_keyword_deprecated,
      $.parameter_keyword_internal,
      $.foreignkey_keyword_no_check,
      $.relationship_keyword_on_delete,
      $.foreignkey_keyword_on_update,
      $.method_keyword_sql_name,
    ),
    foreignkey_keywords: ($) => 
      seq(
        '[',
        optional(repeat_with_commas(
          $.foreignkey_keyword,
        )),
        ']'
      ),

    
    foreignkey_keyword_on_update: ($) => 
      seq(
        /OnUpdate/i,
        '=', 
        alias(choice(/cascade/i,/noaction/i,/setdefault/i,/setnull/i), $.rhs)
      ),
    keyword_foreignkey: (_) => /ForeignKey/i,
    keyword_references: (_) => /References/i,

    /*
    PARAMETER KEYWORDS
    */
    keyword_parameter: (_) => /Parameter/i,
    parameter_keyword_final: ($) => seq(optional($.keyword_not), /Final/i),
    parameter_keyword_abstract: ($) => seq(optional($.keyword_not),/Abstract/i),
    parameter_keyword_deprecated: ($) => seq(optional($.keyword_not),/Deprecated/i),
    parameter_keyword_internal: ($) => seq(optional($.keyword_not),/Internal/i),
    parameter_keyword_flags: ($) => seq(/Flags/i,'=', alias(choice($.enum_flag,$.list_flag),$.rhs)),
    parameter_keyword_constraint: ($) => seq(/Constraint/i,'=', alias(choice($.string_literal,$.objectscript_identifier),$.rhs)),
    enum_flag: (_) => /ENUM/i,
    list_flag: (_) => /LIST/i,
    parameter_keyword: ($) => 
      choice(
        $.parameter_keyword_abstract,
        $.parameter_keyword_deprecated,
        $.parameter_keyword_final,
        $.parameter_keyword_flags,
        $.parameter_keyword_internal,
        $.parameter_keyword_constraint,
        ),
    parameter_keywords: ($) =>
      seq(
        '[',
        optional(repeat_with_commas($.parameter_keyword)),
        ']'
      ),

    /*
    PROJECTION KEYWORDS
    */
    keyword_projection: (_) => /Projection/i,
    projection_keyword: ($) =>
    choice($.parameter_keyword_deprecated, $.parameter_keyword_internal, $.method_keyword_not_inheritable),
    projection_keywords: ($) => 
        seq(
          '[',
          optional(
            repeat_with_commas($.projection_keyword)
          ),
          ']'
        ),

    /*
    INDEX KEYWORDS
    */
   index_keyword_type: ($) =>
      seq(
        /type/i,
        '=',
        choice(
          alias(/bitmap/i, $.rhs),
          alias(/bitslice/i, $.rhs),
          alias(/collatedkey/i, $.rhs),
          alias(/columnar/i, $.rhs),
          alias(/index/i, $.rhs), 
          alias(/key/i, $.rhs)    
        )
        
      ),
    index_coshardwith: ($) => 
      seq(
        /CoshardWith/i,
        '=',
        alias($.identifier, $.rhs)
      )
      ,
    index_keyword_extent: ($) => seq(optional($.keyword_not),/Extent/i),
    index_keyword_idkey: ($) => seq(optional($.keyword_not),/IdKey/i),
    index_keyword_primary_key: ($) => seq(optional($.keyword_not),/PrimaryKey/i),
    index_keyword_unique: ($) => seq(optional($.keyword_not),/Unique/i),
    index_keyword_deferred: ($) => seq(optional($.keyword_not),/Deferred/i),
    index_keyword_shardkey: ($) => seq(optional($.keyword_not),/ShardKey/i),
    index_keyword_data: ($) => 
      seq(
        /Data/i,
        '=',
        choice(
          alias($.quote_permitting_identifier, $.rhs),
          seq(
            '(',
            repeat_with_commas(alias($.quote_permitting_identifier, $.rhs)),
            ')'
          )
        )
        
      ),
    index_keyword_condition: ($) => 
      seq(
        /Condition/i,
        '=',
        choice(alias($.string_literal, $.rhs),alias($.numeric_literal, $.rhs), seq('{', alias($.expression, $.rhs), '}')),
      ),

    index_keyword: ($) =>
      choice(
        $.parameter_keyword_abstract,
        $.index_keyword_condition,
        $.index_coshardwith,
        $.index_keyword_deferred,
        $.parameter_keyword_deprecated, 
        $.index_keyword_data,
        $.index_keyword_idkey,
        $.parameter_keyword_internal,
        $.index_keyword_primary_key,
        $.index_keyword_shardkey,
        $.method_keyword_sql_name,
        $.index_keyword_type,
        $.index_keyword_unique,
      ),
    index_keywords: ($) => 
      seq(
        '[',
        optional(
          repeat_with_commas($.index_keyword)
        ),
        ']'
      ),
    extent_index_keywords: ($) =>
      seq(
        '[',
        repeat(seq($.index_keyword, ',')),
        $.index_keyword_extent,
        repeat(seq(',', $.index_keyword)),
        ']',
      ),
    keyword_index: (_) => /Index/i,

    /*
    XDATA KEYWORDS
    */
    keyword_xdata: (_) => /XData/i,
    xdata_keyword_schemaspec: ($) => 
      seq(
        /SchemaSpec/i,
        '=',
        alias($.string_literal,$.rhs)
      ),
    xdata_keyword_xmlnamespace: ($) => 
      seq(
        /XMLNamespace/i,
        '=',
        alias($.string_literal,$.rhs)
      ),
    xdata_keyword: ($) =>
    choice(
      // NOTE: mimetype is INTENTIONALLY excluded, see $._xdata_any rule
      $.xdata_keyword_schemaspec,
      $.xdata_keyword_xmlnamespace,
      $.parameter_keyword_deprecated,
      $.parameter_keyword_internal),
    mime_type: (_) =>
      token(
        /[A-Za-z0-9!#$&^_.-]+\/[A-Za-z0-9!#$&^_.-]+(?:\+[A-Za-z0-9!#$&^_.-]+)*(?:;[A-Za-z0-9!#$&^_.-]+=[A-Za-z0-9!#$&^_.-]+)*/
      ),

    xdata_keywords: ($) => 
      seq(
        '[',
        optional(repeat_with_commas(
          $.xdata_keyword,
        )),
        ']'
      ),
      
    xdata_keyword_mimetype: ($) =>
      seq(
        /MimeType/i,
        "=",
        alias(choice($.mime_type,$.string_literal),$.rhs)
      ),
    xdata_keywords_any: ($) =>
      // NOTE: Here, MimeType _must_ be present to match this
      seq(
        '[',
        repeat(seq($.xdata_keyword, ',')),
        $.xdata_keyword_mimetype,
        repeat(seq(',', $.xdata_keyword)),
        ']',
      ),
    /*
      STORAGE KEYWORDS
    */
    keyword_storage: (_) => /Storage/i,
    storage_keywords: (_) => 
      seq(
          '[',
          ']'
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
