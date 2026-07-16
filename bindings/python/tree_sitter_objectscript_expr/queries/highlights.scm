; === BEGIN LOCAL ===
(pattern_expression) @string.regexp

(numeric_literal) @number

[
  (json_boolean_literal)
  (json_null_literal)
] @boolean

(json_object_literal_pair
  (json_string_literal) @string.special)

[
  (json_string_literal)
  (string_literal)
] @string

[
  (keyword_super)
  (keyword_pound_pound_class)
] @keyword.operator

(system_defined_function) @function.builtin

; this is because . is grouped into system_defined_function
; and I want the dots to be the same color
(class_method_call
  "." @function.builtin)

(byref_arg
  "." @function.builtin)

(oref_chain_segment
  "." @function.builtin)

(sql_field_modifier) @keyword.modifier

[
  (property_name)
  (oref_parameter)
  (sql_field_identifier)
] @variable.member

(method_name) @function.method

[
  (routine_name)
  (class_name)
] @type

(macro_function) @function.macro

(macro_constant) @constant.macro

[
  (ssvn)
  (system_defined_variable)
  "$$"
] @variable.builtin

(lvn (objectscript_identifier) @variable)
(lvn (objectscript_identifier_special) @variable.member)
(ole_object_reference (objectscript_identifier) @variable)
(ole_object_reference (objectscript_identifier_special) @variable.member)

[
  (gvn)
  (instance_variable)
] @variable.member

(method_arg) @variable.parameter

; I didn't include ( or ) in this, because they are often grouped
; as part of a sequence that gets turned into a single token, so they
; don't get matched, and one ends up getting colored differently than the other.
[
  "_"
  ","
  ":"
  ".."
  "..."
  "'["
  "']"
  "']]"
  "\""
  "["
  "]"
  "]]"
  "{"
  "}"
  "/"
  "\\"
  "#"
  "|"
  "||"
  "$$"
] @punctuation.delimiter

[
  "'&"
  "&"
  "&&"
  "'<"
  "'="
  "'>"
  "^"
  "-"
  "^$"
  "+"
  "<"
  "<="
  "="
  ">"
  ">="
  "@"
  "*"
  "**"
  "'"
  "'!"
  "'?"
  "!"
  "?"
] @operator

; === END LOCAL ===
