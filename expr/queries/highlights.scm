(pattern_expression) @string.regex
(numeric_literal) @number
(string_literal) @string

(keyword_pound_pound_class) @keyword
(keyword_pound_pound_super) @keyword
(system_defined_variable) @variable.special
(system_defined_function) @variable.special
(sql_field_modifier) @variable.special
(property_name) @property
(method_name) @function
(parameter_name) @property
(class_name) @type
(macro) @constant

(routine_ref) @variable
(sql_field_identifier) @variable
(lvn) @variable
(gvn) @variable
(ssvn) @variable
(instance_variable) @variable
(objectscript_identifier) @variable

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
  "/"
  "/"
  "$$"
] @punctuation

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

(json_string_literal) @string
(json_boolean_literal) @boolean
(json_number_literal) @number
(json_null_literal) @string
(bracket) @punctuation.bracket
