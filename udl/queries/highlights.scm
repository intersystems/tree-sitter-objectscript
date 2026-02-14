;; inherits: objectscript_core
; ------------------ UDL -------------------

[
    (method_keyword_codemode_expression)
    (call_method_keyword)
    (method_keyword)
    (class_keywords)
    (query_keywords)
    (trigger_keyword)
    (method_keyword_language)
    (relationship_keyword)
    (foreignkey_keyword)
    (parameter_keyword)
    (projection_keyword)
    (index_keyword)
    (index_keyword_extent)
    (xdata_keyword)
    (xdata_keyword_mimetype)
    (property_keyword)
    
] @attribute

(documatic_line) @comment.doc

(query_name) @property
(property_name) @property
(relationship_name) @property
(foreignkey_name) @property
(parameter_name) @property
(projection_name) @property
(index_name) @property
(xdata_name) @property
(storage_name) @property

(return_type) @type.builtin
(typename) @type
(parameter_type) @type.builtin
(index_type) @type.builtin
(projection_type) @type.builtin
(property_type) @type.builtin
(index_property_type) @type.builtin

(identifier) @variable
