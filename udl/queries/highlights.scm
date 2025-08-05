;; inherits: objectscript_core
; ------------------ UDL -------------------

(_ keyword: (_) @keyword)

; (identifier) @variable


; Alternatively
; (class_statement (_ class_statement_keyword: (_) @keyword ) .)
"{" @punctuation.bracket
"}" @punctuation.bracket

; @class.name capture group is not suppported in nvim highlighter
; (class_definition class_name: (identifier) @class.name)
(include_clause (identifier) @keyword.import)
(property (identifier) @property)
(parameter (identifier) @constant)
(projection (identifier) @type.definition)
(trigger (identifier) @type.definition)
(index (identifier) @type.definition)
(relationship (identifier) @type.definition)
(foreignkey (identifier) @type.definition)
(xdata (identifier) @constant)
(typename) @type
(class_definition
  class_name: (identifier) @type
  (class_extends (identifier) @type))
(method_definition (identifier (identifier)) @function)
(query (identifier) @function)

(argument (identifier) @variable.parameter)

(keyword_name) @keyword

(class_keywords (_ rhs: _ @constant.builtin))
(parameter_keywords (_ rhs: _ @constant.builtin))
(property_keywords (_ rhs: _ @constant.builtin))
(xdata_keywords (_ rhs: _ @constant.builtin))
(method_keywords (_ rhs: _ @constant.builtin))
(trigger_keywords (_ rhs: _ @constant.builtin))
(query_keywords (_ rhs: _ @constant.builtin))
(index_keywords (_ rhs: _ @constant.builtin))
(foreignkey_keywords (_ rhs: _ @constant.builtin))
(projection_keywords (_ rhs: _ @constant.builtin))
(relationship_keywords (_ rhs: _ @constant.builtin))

(documatic_line) @comment.doc
