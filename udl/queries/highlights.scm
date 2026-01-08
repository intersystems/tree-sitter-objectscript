;; inherits: objectscript_core
; ------------------ UDL -------------------

; CLASS HIGHLIGHTING
(class_definition
  class_name: (identifier) @type
  (class_extends (identifier) @type)?)
(class_keyword  
  (_  
    (identifier) @key  
    (rhs)? @rhs))
    
(_ keyword: (_) @keyword)
(keyword_not) @Not

;for import, include, includegenerator 
(include_clause (identifier) @import)


"{" @punctuation.bracket
"}" @punctuation.bracket

; METHOD HIGHLIGHTING
(method_keyword  
  (_  
    (identifier) @key  
    (rhs)? @rhs))
; codemode=expression
(method_keyword_codemode_expression
	(identifier) @key  
    (rhs)? @rhs)
; external languages 
(method_keyword_language
	(identifier) @key  
    (rhs)? @rhs)
; call method keyword
(call_method_keyword
	(identifier) @key  
    (rhs)? @rhs)
; method definition
(method_definition
	(identifier) @method_name 
    (arguments)? @method_arguments
) @method
(expression_method_body_content) @body
(core_method_body_content) @body
(external_method_body_content) @body

; PROPERTY HIGHLIGHTING
(property (identifier) @property)
(property_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))

; PARAMETER HIGHLIGHTING
(parameter (identifier) @constant)
(default_argument_value) @rhs
(parameter_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))
(parameter_type) @type

; types and comments
(typename) @type
(documatic_line) @comment.doc

; RELATIONSHIP HIGHLIGHTING
(relationship (identifier) @relationship)
(relationship_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))
    
; FOREIGNKEY HIGHLIGHTING
(foreignkey (identifier) @type.definition)
(foreignkey_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))
    
; QUERY HIGHLIGHTING
(query (identifier) @function)
(query_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))

(query_body_content) @body

; INDEX HIGHLIGHTING
(index (identifier) @type.definition)
(index_properties) @index_properties
(index_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))
(index_keyword_extent) @key

;TRIGGER HIGHLIGHTING
(trigger (identifier) @type.definition)
(trigger_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))
    
; XDATA HIGHLIGHTING
(xdata (identifier) @constant)
(xdata_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))
(xdata_keyword_mimetype
  (
    (identifier) @key  
    (rhs)? @rhs))
(xdata_body_content_xml) @body
(xdata_body_content_any) @body 

; PROJECTION HIGHLIGHTING
(projection (identifier) @type.definition)
(projection_keyword
  (_  
    (identifier) @key  
    (rhs)? @rhs))
; STORAGE HIGHLIGHTING
(storage (identifier) @type.definition)
(storage_body_content) @body
