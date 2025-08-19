; -------------- Objectscript -------------


; Variables
; ^| e.g. '^||ppg', 'do', 'D'
; -----------------------------------------
(gvn) @variable.special
(ssvn) @variable.special
(lvn) @variable
(instance_variable) @variable.special

; String literals
; e.g. "Fo345349*_)(*_)8023841-40"" "
; -----------------------------------------
(string_literal) @string
(pattern_expression) @string.regex

; Operators
(_ operator: _ @operator)

; Numeric literals
; e.g. 12345
(integer_literal) @number
(decimal_literal) @float

; System variable name
; e.g. $IO, $SY[SYTEM]
(system_defined_variable) @function.builtin

; System defined functions
; e.g. $ASCII(62)
(system_defined_function) @function.builtin

(dollarsf
  ; $SYSTEM.Foo.Bar()
  (dollar_system_keyword) @function.builtin
)

(property_name) @property
(parameter_name) @constant
(parameter_name) @variable.parameter

; Method invcoations
(class_method_call
    (class_ref (class_name) @type.definition)
    (method_name) @function.method.call
)
(oref_method (method_name) @function.method.call)

(_ preproc_keyword: (_) @keyword.directive)
(_ modifier: (_) @keyword.directive)


; User-defined functions
(extrinsic_function) @function.call

; Goto labels and locations
(_ label: (_) @label)
(_ offset: (_) @number)
(_ routine: (_) @namespace)

; JSON literals
(json_boolean_literal) @boolean
(json_null_literal) @constant.builtin
(json_number_literal) @number
(json_string_literal) @string.escape

; Macros
(macro (macro_constant)) @constant.macro
(macro (macro_function)) @function.macro

