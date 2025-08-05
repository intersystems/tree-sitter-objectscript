/**
 * Keyword definitions
 * NOTE: A file somewhat resembling this can be regenerated in by invoking the appropriate file in scripts/
 */

/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const kw_boolean = function ($, keyword) {
  return choice(
    field('name', alias(keyword, $.keyword_name)),
    seq(
      field('name', alias(keyword, $.keyword_name)),
      '=',
      field('rhs', /[0-1]/),
    ),
    seq(
      field('not', /[nN][oO][tT] /),
      field('name', alias(keyword, $.keyword_name)),
    ),
  );
};

const kw_integer = function ($, keyword) {
  return seq(
    field('name', alias(keyword, $.keyword_name)),
    '=',
    field('rhs', /[0-9]+/),
  );
};

const kw_enum = function ($, keyword, variants) {
  return seq(
    field('name', alias(keyword, $.keyword_name)),
    '=',
    field('rhs', choice(...variants)),
  );
};

const kw_expression = function ($, keyword) {
  return seq(
    field('name', alias(keyword, $.keyword_name)),
    '=',
    field('rhs', $.default_argument_value),
  );
};

const kw_text = function ($, keyword) {
  return seq(
    field('name', alias(keyword, $.keyword_name)),
    '=',
    field('rhs', $.string_literal),
  );
};

// // { set {*} = {} }
const kw_code = function ($, keyword) {
  return seq(
    field('name', alias(keyword, $.keyword_name)),
    '=',
    field('rhs', $.code_snippet),
  );
};

// / / Unused/Dead code
const kw_sql = function ($, keyword) {
  return seq(
    field('name', alias(keyword, $.keyword_name)),
    '=',
    field('rhs', $.string_literal),
  );
};

// / Unused/Dead code
const kw_identifier = function ($, keyword) {
  return seq(
    field('name', alias(keyword, $.keyword_name)),
    '=',
    field('rhs', $.identifier),
  );
};

/**
 * @param {SymbolRule<string>} symbolRule
 */

const define_keywords = function (symbolRule) {
  return seq('[', symbolRule, repeat(seq(',', symbolRule)), ']');
};

// Keyword rules
module.exports = {
  kw_Abstract: ($) => kw_boolean($, /Abstract/i),
  kw_Condition: ($) => kw_expression($, /Condition/i),
  kw_CoShardWith: ($) => kw_identifier($, /CoShardWith/i),
  kw_Deprecated: ($) => kw_boolean($, /Deprecated/i),
  kw_Extent: ($) => kw_boolean($, /Extent/i),
  kw_IdKey: ($) => kw_boolean($, /IdKey/i),
  kw_Internal: ($) => kw_boolean($, /Internal/i),
  kw_PrimaryKey: ($) => kw_boolean($, /PrimaryKey/i),
  kw_ShardKey: ($) => kw_boolean($, /ShardKey/i),
  kw_SqlName: ($) => kw_identifier($, /SqlName/i),
  kw_Type: ($) =>
    kw_enum($, /Type/i, [
      'bitmap',
      'bitslice',
      'columnar',
      'index',
      'collatedkey',
      'key',
    ]),
  kw_Unique: ($) => kw_boolean($, /Unique/i),
  kw_Content: ($) => kw_text($, /Content/i),
  kw_MimeType: ($) => kw_text($, /MimeType/i),
  kw_SchemaSpec: ($) => kw_text($, /SchemaSpec/i),
  kw_XMLNamespace: ($) => kw_text($, /XMLNamespace/i),
  kw_Name: ($) => kw_identifier($, /Name/i),
  kw_SequenceNumber: ($) => kw_integer($, /SequenceNumber/i),
  kw_TextType: ($) => kw_integer($, /TextType/i),
  kw_ClassType: ($) =>
    kw_enum($, /ClassType/i, [
      'datatype',
      'persistent',
      'serial',
      'stream',
      'view',
      'index',
      'dynamic',
      '""',       // NOTE: Can be set to empty string
    ]),
  kw_ClientDataType: ($) =>
    kw_enum($, /ClientDataType/i, [
      'BIGINT',
      'BINARY',
      'BINARYSTREAM',
      'BOOLEAN',
      'CHARACTERSTREAM',
      'CURRENCY',
      'DATE',
      'DOUBLE',
      'HANDLE',
      'INTEGER',
      'LIST',
      'LONGVARCHAR',
      'NUMERIC',
      'STATUS',
      'TIME',
      'TIMESTAMP',
      'VARCHAR',
      'FDATE',
      'FTIMESTAMP',
      'DECIMAL',
      'MVDATE',
    ]),
  kw_CompileAfter: ($) => kw_identifier($, /CompileAfter/i),
  kw_ConstraintClass: ($) => kw_identifier($, /ConstraintClass/i),
  kw_DdlAllowed: ($) => kw_boolean($, /DdlAllowed/i),
  kw_DependsOn: ($) => kw_identifier($, /DependsOn/i),
  kw_Deployed: ($) => kw_integer($, /Deployed/i),
  kw_Dynamic: ($) => kw_boolean($, /Dynamic/i),
  kw_EmbeddedClass: ($) => kw_identifier($, /EmbeddedClass/i),
  kw_Final: ($) => kw_boolean($, /Final/i),
  kw_Hidden: ($) => kw_boolean($, /Hidden/i),
  kw_IndexClass: ($) => kw_identifier($, /IndexClass/i),
  kw_Inheritance: ($) => kw_enum($, /Inheritance/i, ['left', 'right']),
  kw_LegacyInstanceContext: ($) => kw_boolean($, /LegacyInstanceContext/i),
  kw_MemberSuper: ($) => kw_identifier($, /MemberSuper/i),
  kw_ModificationLevel: ($) => kw_integer($, /ModificationLevel/i),
  kw_Modified: ($) => kw_enum($, /Modified/i, ['0', '1', '2', '3']),
  kw_NoContext: ($) => kw_boolean($, /NoContext/i),
  kw_NoExtent: ($) => kw_boolean($, /NoExtent/i),
  kw_OdbcType: ($) =>
    kw_enum($, /OdbcType/i, [
      'BIGINT',
      'BIT',
      'DATE',
      'DOUBLE',
      'GUID',
      'INTEGER',
      'LONGVARBINARY',
      'LONGVARCHAR',
      'NUMERIC',
      'POSIXTIME',
      'SMALLINT',
      'TIME',
      'TIMESTAMP',
      'TINYINT',
      'VARBINARY',
      'VARCHAR',
      'RESULTSET',
      'STRUCT',
    ]),
  kw_Owner: ($) => kw_text($, /Owner/i),
  kw_ProcedureBlock: ($) => kw_boolean($, /ProcedureBlock/i),
  kw_ProjectionClass: ($) => kw_identifier($, /ProjectionClass/i),
  kw_PropertyClass: ($) => kw_identifier($, /PropertyClass/i),
  kw_QueryClass: ($) => kw_identifier($, /QueryClass/i),
  kw_ServerOnly: ($) => kw_boolean($, /ServerOnly/i),
  kw_Sharded: ($) => kw_integer($, /Sharded/i),
  kw_SoapBindingStyle: ($) =>
    kw_enum($, /SoapBindingStyle/i, ['document', 'rpc']),
  kw_SoapBodyUse: ($) => kw_enum($, /SoapBodyUse/i, ['literal', 'encoded']),
  kw_SqlCategory: ($) =>
    kw_enum($, /SqlCategory/i, [
      'DATE',
      'DOUBLE',
      'FMDATE',
      'FMTIMESTAMP',
      'INTEGER',
      'MVDATE',
      'NAME',
      'NUMERIC',
      'POSIXTS',
      'STRING',
      'TIME',
      'TIMESTAMP',
      'VECTOR',
    ]),
  kw_SqlRoutinePrefix: ($) => kw_identifier($, /SqlRoutinePrefix/i),
  kw_SqlRowIdName: ($) => kw_identifier($, /SqlRowIdName/i),
  kw_SqlRowIdPrivate: ($) => kw_boolean($, /SqlRowIdPrivate/i),
  kw_SqlTableName: ($) => kw_identifier($, /SqlTableName/i),
  kw_System: ($) => kw_enum($, /System/i, ['0', '1', '2', '3', '4']),
  kw_TriggerClass: ($) => kw_identifier($, /TriggerClass/i),
  kw_ViewQuery: ($) => kw_sql($, /ViewQuery/i),
  kw_ForceGenerate: ($) => kw_boolean($, /ForceGenerate/i),
  kw_GenerateAfter: ($) => kw_identifier($, /GenerateAfter/i),
  kw_NotInheritable: ($) => kw_boolean($, /NotInheritable/i),
  kw_PlaceAfter: ($) => kw_identifier($, /PlaceAfter/i),
  kw_Private: ($) => kw_boolean($, /Private/i),
  kw_PublicList: ($) => kw_identifier($, /PublicList/i),
  kw_ReturnResultsets: ($) => kw_boolean($, /ReturnResultsets/i),
  kw_SqlProc: ($) => kw_boolean($, /SqlProc/i),
  kw_SqlRoutine: ($) => kw_enum($, /SqlRoutine/i, ['procedure', 'function']),
  kw_WebMethod: ($) => kw_boolean($, /WebMethod/i),
  kw_ZenMethod: ($) => kw_boolean($, /ZenMethod/i),
  kw_Event: ($) =>
    kw_enum($, /Event/i, [
      'INSERT',
      'UPDATE',
      'DELETE',
      'INSERT/UPDATE',
      'INSERT/DELETE',
      'UPDATE/DELETE',
      'INSERT/UPDATE/DELETE',
    ]),
  kw_Foreach: ($) => kw_enum($, /Foreach/i, ['row', 'row/object', 'statement']),
  kw_NewTable: ($) => kw_identifier($, /NewTable/i),
  kw_OldTable: ($) => kw_identifier($, /OldTable/i),
  kw_Order: ($) => kw_integer($, /Order/i),
  kw_Time: ($) => kw_enum($, /Time/i, ['BEFORE', 'AFTER']),
  kw_UpdateColumnList: ($) => kw_identifier($, /UpdateColumnList/i),
  kw_NoCheck: ($) => kw_boolean($, /NoCheck/i),
  kw_OnDelete: ($) =>
    kw_enum($, /OnDelete/i, ['cascade', 'noaction', 'setdefault', 'setnull']),
  kw_OnUpdate: ($) =>
    kw_enum($, /OnUpdate/i, ['cascade', 'noaction', 'setdefault', 'setnull']),
  kw_IdFunction: ($) => kw_enum($, /IdFunction/i, ['increment', 'sequence']),
  kw_Structure: ($) =>
    kw_enum($, /Structure/i, ['node', 'listnode', 'subnode', 'vector']),
  kw_BiasQueriesAsOutlier: ($) =>
    kw_enum($, /BiasQueriesAsOutlier/i, ['0', '1']),
  kw_BlockCount: ($) => kw_integer($, /BlockCount/i),
  kw_ConditionalWithHostVars: ($) => kw_boolean($, /ConditionalWithHostVars/i),
  kw_Aliases: ($) => kw_text($, /Aliases/i),
  kw_Calculated: ($) => kw_boolean($, /Calculated/i),
  kw_Cardinality: ($) =>
    kw_enum($, /Cardinality/i, ['one', 'many', 'parent', 'children']),
  kw_Identity: ($) => kw_boolean($, /Identity/i),
  kw_InitialExpression: ($) => kw_expression($, /InitialExpression/i),
  kw_Inverse: ($) => kw_identifier($, /Inverse/i),
  kw_MultiDimensional: ($) => kw_boolean($, /MultiDimensional/i),
  kw_ReadOnly: ($) => kw_boolean($, /ReadOnly/i),
  kw_Required: ($) => kw_boolean($, /Required/i),
  kw_SqlCollation: ($) =>
    kw_enum($, /SqlCollation/i, [
      'ALPHAUP',
      'PLUS',
      'MINUS',
      'SPACE',
      'EXACT',
      'UPPER',
    ]),
  kw_SqlComputeCode: ($) => kw_code($, /SqlComputeCode/i),
  kw_SqlComputed: ($) => kw_boolean($, /SqlComputed/i),
  kw_SqlComputeOnChange: ($) => kw_identifier($, /SqlComputeOnChange/i),
  kw_SqlFieldName: ($) => kw_identifier($, /SqlFieldName/i),
  kw_SqlListType: ($) =>
    kw_enum($, /SqlListType/i, ['DELIMITED', 'LIST', 'SUBNODE']),
  kw_Transient: ($) => kw_boolean($, /Transient/i),
  kw_Encoded: ($) => kw_boolean($, /Encoded/i),
  kw_Flags: ($) =>
    kw_enum($, /Flags/i, ['LIST', 'EDIT', 'ENUM', 'EMPTY', 'SYS']),
  kw_SqlView: ($) => kw_boolean($, /SqlView/i),
  kw_SqlViewName: ($) => kw_identifier($, /SqlViewName/i),
  // These are special
  kw_Native_Language: ($) =>
    kw_enum($, /Language/i, ['basic', 'objectscript', 'mvbasic']),
  kw_External_Language: ($) =>
    kw_enum($, /Language/i, ['java', 'javascript', 'tsql', 'ispl', 'python']),
  kw_Native_CodeMode: ($) =>
    kw_enum($, /CodeMode/i, ['call', 'code', 'generator', 'objectgenerator']),
  kw_Expression_CodeMode: ($) =>
//    was: kw_enum($, /CodeMode/i, ['expression']),
    seq(
      field('name', alias(/CodeMode/i, $.keyword_name)),
      '=',
      field('rhs', 'expression'),
    ),

  /* KEYWORD TYPE RULES START */
  // Index Rules
  _index_keyword: ($) =>
    choice(
      $.kw_Abstract,
      $.kw_Condition,
      $.kw_CoShardWith,
      $.kw_Deprecated,
      $.kw_Extent,
      $.kw_IdKey,
      $.kw_Internal,
      $.kw_PrimaryKey,
      $.kw_ShardKey,
      $.kw_SqlName,
      $.kw_Type,
      $.kw_Unique,
    ),
  index_keywords: ($) => define_keywords($._index_keyword),

  _relationship_keyword: ($) =>
    choice(
      $.kw_Cardinality,
      $.kw_Inverse,
    ),
  relationship_keywords: ($) => define_keywords($._relationship_keyword),

  // // UDLText Rules
  // _udltext_keyword: $ => choice($.kw_Content, $.kw_Name, $.kw_SequenceNumber, $.kw_TextType,),
  // udltext_keywords: $ => define_keywords($._udltext_keyword),

  // // Category Rules
  // _category_keyword: $ => choice(),
  // category_keywords: $ => define_keywords($._category_keyword),

  // // InstanceVar Rules
  // _instancevar_keyword: $ => choice(),
  // instancevar_keywords: $ => define_keywords($._instancevar_keyword),

  // Class Rules
  _class_keyword: ($) =>
    choice(
      $.kw_Abstract,
      $.kw_ClassType,
      $.kw_ClientDataType,
      $.kw_CompileAfter,
      $.kw_ConstraintClass,
      $.kw_DdlAllowed,
      $.kw_DependsOn,
      $.kw_Deployed,
      $.kw_Deprecated,
      $.kw_Dynamic,
      $.kw_EmbeddedClass,
      $.kw_Final,
      $.kw_Hidden,
      $.kw_IndexClass,
      $.kw_Inheritance,
      $.kw_LegacyInstanceContext,
      $.kw_MemberSuper,
      $.kw_ModificationLevel,
      $.kw_Modified,
      $.kw_NoContext,
      $.kw_NoExtent,
      $.kw_OdbcType,
      $.kw_Owner,
      $.kw_ProcedureBlock,
      $.kw_ProjectionClass,
      $.kw_PropertyClass,
      $.kw_QueryClass,
      $.kw_ServerOnly,
      $.kw_Sharded,
      $.kw_SoapBindingStyle,
      $.kw_SoapBodyUse,
      $.kw_SqlCategory,
      $.kw_SqlRoutinePrefix,
      $.kw_SqlRowIdName,
      $.kw_SqlRowIdPrivate,
      $.kw_SqlTableName,
      $.kw_System,
      $.kw_TriggerClass,
      $.kw_ViewQuery,
    ),
  class_keywords: ($) => define_keywords($._class_keyword),

  // Method Rules
  _method_keyword: ($) =>
    choice(
      $.kw_Native_Language,
      $.kw_Native_CodeMode,
      $.kw_Abstract,
      $.kw_Deprecated,
      $.kw_Final,
      $.kw_ForceGenerate,
      $.kw_GenerateAfter,
      $.kw_Internal,
      $.kw_NoContext,
      $.kw_NotInheritable,
      $.kw_PlaceAfter,
      $.kw_Private,
      $.kw_ProcedureBlock,
      $.kw_PublicList,
      $.kw_ReturnResultsets,
      $.kw_ServerOnly,
      $.kw_SoapBindingStyle,
      $.kw_SoapBodyUse,
      $.kw_SqlName,
      $.kw_SqlProc,
      $.kw_SqlRoutine,
      $.kw_WebMethod,
      $.kw_ZenMethod,
    ),
  method_keywords: ($) => define_keywords($._method_keyword),

  // Trigger Rules
  _trigger_keyword: ($) =>
    choice(
      $.kw_Deprecated,
      $.kw_Event,
      $.kw_Final,
      $.kw_Foreach,
      $.kw_Internal,
      $.kw_NewTable,
      $.kw_OldTable,
      $.kw_Order,
      $.kw_SqlName,
      $.kw_Time,
      $.kw_UpdateColumnList,
    ),
  trigger_keywords: ($) => define_keywords($._trigger_keyword),

  // ForeignKey Rules
  _foreignkey_keyword: ($) =>
    choice(
      $.kw_Deprecated,
      $.kw_Internal,
      $.kw_NoCheck,
      $.kw_OnDelete,
      $.kw_OnUpdate,
      $.kw_SqlName,
    ),
  foreignkey_keywords: ($) => define_keywords($._foreignkey_keyword),

  // XData Rules
  _xdata_keyword: ($) =>
    choice(
      $.kw_MimeType,
      $.kw_SchemaSpec,
      $.kw_XMLNamespace,
      $.kw_Deprecated,
      $.kw_Internal),
  xdata_keywords: ($) => define_keywords($._xdata_keyword),

  // Storage Rules
  _storage_keyword: ($) =>
    choice(
      $.kw_Deprecated,
      $.kw_Final,
      $.kw_IdFunction,
      $.kw_Internal,
      $.kw_Type,
      $.kw_Structure,
      $.kw_Name,
      $.kw_BiasQueriesAsOutlier,
      $.kw_BlockCount,
      $.kw_ConditionalWithHostVars,
      $.kw_Type,
      $.kw_Name,
    ),
  storage_keywords: ($) => define_keywords($._storage_keyword),

  // Projection Rules
  _projection_keyword: ($) =>
    choice($.kw_Deprecated, $.kw_Internal, $.kw_NotInheritable),
  projection_keywords: ($) => define_keywords($._projection_keyword),

  // Constraint Rules
  _constraint_keyword: ($) => choice($.kw_Deprecated),
  constraint_keywords: ($) => define_keywords($._constraint_keyword),

  // Property Rules
  _property_keyword: ($) =>
    choice(
      $.kw_Aliases,
      $.kw_Calculated,
      $.kw_Cardinality,
      $.kw_Deprecated,
      $.kw_Final,
      $.kw_Identity,
      $.kw_InitialExpression,
      $.kw_Internal,
      $.kw_MultiDimensional,
      $.kw_OnDelete,
      $.kw_Private,
      $.kw_ReadOnly,
      $.kw_Required,
      $.kw_ServerOnly,
      $.kw_SqlCollation,
      $.kw_SqlComputeCode,
      $.kw_SqlComputed,
      $.kw_SqlComputeOnChange,
      $.kw_SqlFieldName,
      $.kw_SqlListType,
      $.kw_Transient,
    ),
  property_keywords: ($) => define_keywords($._property_keyword),

  // Parameter Rules
  _parameter_keyword: ($) =>
    choice(
      $.kw_Abstract,
      $.kw_Deprecated,
      $.kw_Encoded,
      $.kw_Final,
      $.kw_Flags,
      $.kw_Internal,
    ),
  parameter_keywords: ($) => define_keywords($._parameter_keyword),

  // Query Rules
  _query_keyword: ($) =>
    choice(
      $.kw_Deprecated,
      $.kw_Final,
      $.kw_Internal,
      $.kw_Private,
      $.kw_SoapBindingStyle,
      $.kw_SoapBodyUse,
      $.kw_SqlName,
      $.kw_SqlProc,
      $.kw_SqlView,
      $.kw_SqlViewName,
      $.kw_WebMethod,
    ),
  query_keywords: ($) => define_keywords($._query_keyword),

  /* KEYWORD TYPE RULES END */
};

//
// End-of-file
//
