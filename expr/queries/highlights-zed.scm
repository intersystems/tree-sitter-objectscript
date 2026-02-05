command_name: (_) @keyword

(pound_define_variable_name)  @keyword.macro
(macro_arg) @constant
(mnemonic_name) @constant.macro
; this is for built in objectscript functions (ex: $METHOD(), $Q, etc.)
(built_in_function_name) @function.builtin
(function_argument) @parameter
(string_literal) @string

; I think I am going to separate commands vs expressions for keywords
(command_name)
; the only exceptions for function arguments are these in dollar method and dollar class method
(class_name)
(method_name)