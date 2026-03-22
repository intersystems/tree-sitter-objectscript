; === BEGIN LOCAL ===
(pattern_expression) @string.regexp

[
  (json_number_literal)
  (numeric_literal)
] @number

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
  (keyword_pound_pound_super)
  (keyword_pound_pound_class)
] @keyword.operator

(system_defined_variable) @variable.builtin

(system_defined_function) @function.builtin

(sql_field_modifier) @keyword.modifier

[
  (property_name)
  (parameter_name)
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
  (lvn)
  (gvn)
  (ssvn)
  (objectscript_identifier)
] @variable

(namespace) @module

[
  (objectscript_identifier_special)
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
  "\"\""
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

(bracket) @punctuation.bracket

; === END LOCAL ===
