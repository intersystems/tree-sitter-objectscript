; start @punctuation.bracket.json (magenta fg, default bg)
[
  (json_array_literal
    [
      "["
      "]"
    ] @punctuation.bracket.json)
  (json_object_literal
    [
      "{"
      "}"
    ] @punctuation.bracket.json)
]

; end @punctuation.bracket.json
; start @label (maroon fg, yellow bg)
(tag) @label

; end @label (maroon fg, yellow bg)
; start method_arg @variable.parameter
(method_arg) @variable.parameter

(variadic_arg
  (lvn
    (objectscript_identifier) @variable.parameter))

(method_arg
  (expression
    (expr_atom
      (lvn
        (objectscript_identifier) @variable.parameter))))

; end method_arg @variable.parameter
; start @variable.builtin @keyword.directive @variable.member.oref @constant.builtin (blue fg, default bg)
[
  (ssvn)
  (system_defined_variable)
  (system_defined_function)
  "$$"
] @variable.builtin

[
  (keyword_pound_define)
  (keyword_pound_def1arg)
  (keyword_pound_if)
  (keyword_pound_elseif)
  (keyword_pound_else)
  (keyword_pound_endif)
  (keyword_pound_ifdef)
  (keyword_pound_ifndef)
  (keyword_dim)
  (keyword_pound_import)
  (keyword_pound_include)
  (keyword_pound_delay)
  (locktype)
  (tag_end_if)
] @keyword.directive

(macro_value) @constant.builtin

[
  (method_name)
  (property_name)
  (oref_parameter)
] @variable.member.oref

; end @variable.builtin @keyword.directive @variable.member.oref @constant.builtin (blue fg, default bg)
; start @type.definition (purple fg)
[
  (keyword_embedded_html)
  (keyword_embedded_xml)
  (keyword_embedded_sql_amp)
  (keyword_embedded_sql_hash)
  (keyword_js)
  (sql_field_reference)
] @type.definition

; end  @type.definition (purple fg)
; local variable "maroon fg, light_cyan bg"
(lvn) @variable

; end local variable
; start black fg, default bg @punctuation.special, @variable.member, @number, @keyword.debug
[
  (embedded_js_special_case_complete)
  (embedded_sql_marker)
  (embedded_sql_reverse_marker)
  (html_marker)
  (html_marker_reversed)
  "@"
  ":"
  ","
  "="
  "'="
  ".."
  "..."
  "^"
  "+"
  "-"
  "|"
  (bracket)
  (binary_operator)
  "'?"
  "?"
  "<"
  ">"
  "/"
] @punctuation.special

[
  (json_number_literal)
  (numeric_literal)
] @number

[
  (keyword_trace)
  (keyword_on)
  (keyword_errortrap)
  (keyword_off)
  (keyword_interrupt)
  (zbreak_command_option)
  (keyword_clear)
  (keyword_all)
  (keyword_debug)
  (keyword_step)
  (keyword_nostep)
  (keyword_stepmethod)
  (keyword_ext)
  (keyword_destruct)
] @keyword.debug

[
  (instance_variable)
  (gvn)
  (macro_arg)
  (macro_def)
] @variable.member

; end black fg, default bg @punctuation.special, @variable.member, @number, @keyword.debug
; "Navy FG, Default BG" (Object (Class, super))
[
  (keyword_pound_pound_super)
  (keyword_pound_pound_class)
] @keyword.operator

; end "Navy FG, Default BG" (Object (Class, super))
; keyword names (red fg, default bg)
[
  (keyword_continue)
  (keyword_quit)
  (keyword_if)
  (keyword_elseif)
  (keyword_else)
  (keyword_oldelse)
  (keyword_throw)
  (keyword_try)
  (keyword_catch)
  (keyword_return)
  (keyword_break)
  (keyword_zbreak)
  (keyword_zkill)
  (keyword_ztrap)
  (keyword_zz)
  (keyword_as)
  (keyword_of)
  (keyword_public)
  (keyword_private)
  (keyword_methodimpl)
  (device_keywords)
  (close_parameter_option_value)
  (keyword_print)
  (keyword_zprint)
  (keyword_zn)
  (keyword_set)
  (keyword_write)
  (keyword_zwrite)
  (keyword_do)
  (keyword_for)
  (keyword_while)
  (keyword_kill)
  (keyword_lock)
  (keyword_read)
  (keyword_open)
  (keyword_close)
  (keyword_use)
  (keyword_new)
  (keyword_job)
  (keyword_merge)
  (keyword_goto)
  (keyword_halt_or_hang)
  (keyword_halt)
  (keyword_hang)
  (keyword_tcommit)
  (keyword_trollback)
  (keyword_tstart)
  (keyword_xecute)
  (keyword_view)
  (keyword_zremove)
  (command_keyword)
  (keyword_zload)
  (keyword_do_old)
] @keyword

; end (red fg, default bg)
; macro (silver bg, blue fg)
(macro) @function.macro

; end macro (silver bg, blue fg)
; start (teal fg, default bg) @type.builtin
(class_ref
  (class_name) @type.builtin)

; end (teal fg, default bg) @type.builtin
; start comment (green fg, default bg)
[
  (line_comment_1)
  (line_comment_2)
  (line_comment_3)
  (line_comment_4)
  (block_comment)
  (inline_comment)
  (argumentless_inline_comment)
] @comment @spell

; end (green fg, default bg)
; start string ("black fg, pink bg")
[
  (json_string_literal)
  (string_literal)
] @string

; end string ("black fg, pink bg")
; start brackets (purple fg, default bg)
[
  "{"
  "}"
  (bracket)
] @punctuation.bracket

; end brackets (purple fg, default bg)
; start @label (maroon fg, yellow bg)
(routine_name) @label

; end @label (maroon fg, yellow bg)
; start @string.regexp (olive fg, default bg)
(pattern_expression) @string.regexp

(keyword_zsu) @keyword.modifier

; start Dots in dotted statements, (black fg,silver bg)
(command_if_dotted_block
  "." @punctuation.special.dots)

(command_for_dotted_block
  "." @punctuation.special.dots)

(command_while_dotted_block
  "." @punctuation.special.dots)

(command_dowhile_dotted
  "." @punctuation.special.dots)

(command_trycatch_dotted
  "." @punctuation.special.dots)

(dotted_statement
  "." @punctuation.special.dots)

(else_block_dotted
  "." @punctuation.special.dots)

(elseif_block_dotted
  "." @punctuation.special.dots)

; end Dots in dotted statements (black fg,silver bg)
; start #dim command
; @type.builtin -> teal fg, default bg
; @variable.member -> black fg, default bg
; @variable -> maroon fg, light_cyan bg
(pound_dim
  (keyword_as)
  .
  (variable_datatype
    [
      (instance_variable)
      (macro)
      (objectscript_identifier)
      (objectscript_identifier_special)
    ] @type.builtin) @type.builtin)

(pound_dim
  (keyword_as)
  .
  (variable_datatype
    [
      (instance_variable)
      (macro)
      (objectscript_identifier)
      (objectscript_identifier_special)
    ] @variable.member) @variable.member
  .
  (keyword_of) @punctuation.special
  .
  (variable_datatype
    [
      (instance_variable)
      (macro)
      (objectscript_identifier)
      (objectscript_identifier_special)
    ] @type.builtin) @type.builtin)

(pound_dim
  (keyword_dim)
  [
    (objectscript_identifier)
    (objectscript_identifier_special)
  ] @variable)

; end #dim command
; start write command/read command
; @punctuation.special -> black fg, default bg
[
  "!"
  "*"
  "?"
  (mnemonic_name)
  (read_fchar)
] @punctuation.special

; end write command/read command
; start lock command
; @punctuation.special -> black fg, default background
(command_lock_argument
  [
    "+"
    "-"
  ] @punctuation.special)

(locktype
  [
    "#"
    "_"
  ] @punctuation.special)

; end lock command
; read command # start (black fg, default bg)
(read_variable
  "#" @punctuation.special)

; read command # end
; start line_ref
; @label -> maroon fg, yellow bg
; @variable ->  "maroon fg, light_cyan bg"
(line_ref
  [
    (objectscript_identifier)
    (objectscript_identifier_special)
  ] @label)

(line_ref
  [
    "+"
    "-"
  ] @punctuation.special
  .
  [
    (objectscript_identifier)
    (objectscript_identifier_special)
  ] @variable)

; end line_ref
; start dollarsf
; @variable -> maroon fg, light_cyan bg
; @variable.member.oref ->  blue fg, default bg
(dollarsf
  [
    (objectscript_identifier)
    (objectscript_identifier_special)
  ] @type.builtin
  "."
  .
  [
    (objectscript_identifier)
    (objectscript_identifier_special)
  ] @variable.member.oref)

; end dollarsf
; start extrinsic_function
(extrinsic_function
  [
    (objectscript_identifier)
    (objectscript_identifier_special)
  ] @label)

; end extrinsic_function
; start highlighting for code never touched
[
  (pound_if_special_case)
  (pound_if_special_case_else)
  (pound_if_special_case_else_if)
] @comment.inactive

; end highlighting for code never touched
; start zload command
; @label -> (maroon fg, yellow bg)
(command_zload
  (expression
    (expr_atom
      [
        (lvn
          (objectscript_identifier) @label)
        (lvn
          (objectscript_identifier_special) @label)
        (instance_variable) @label
        (oref_chain_expr
          [
            (lvn)
            (instance_variable)
          ] @label
          (oref_chain_segment
            (oref_property
              (property_name
                (identifier_segment_immediate) @label) @label)) @label)
      ] @label)))

; end zload command
; start #ifdef command
; @variable.member -> black fg, default bg
(pound_ifdef
  (keyword_pound_ifdef)
  .
  (expression
    (expr_atom
      (lvn
        [
          (objectscript_identifier)
          (objectscript_identifier_special)
        ] @variable.member))))

; end #ifdef command
; start #ifndef command
; @variable.member -> black fg, default bg
(pound_ifndef
  (keyword_pound_ifndef)
  .
  (expression
    (expr_atom
      (lvn
        [
          (objectscript_identifier)
          (objectscript_identifier_special)
        ] @variable.member))))

; end #ifdef command
; start #import command
; @variable.member -> black fg, default bg
(pound_import
  (class_name) @variable.member)

; end #import command
; start #include command
; @label -> (maroon fg, yellow bg)
(pound_include
  (class_name) @label)

(variable_datatype
  "." @variable.builtin)

(instance_method_call
  "." @variable.builtin)

(class_method_call
  "." @variable.builtin)

(byref_arg
  "." @variable.builtin)

(oref_chain_segment
  "." @variable.builtin)

; end #include command
(routine_type
  [
    "["
    "]"
  ] @punctuation.special) @keyword.operator

(routine) @keyword.type

(documatic_line) @comment @spell

(compiled_header) @markup.heading
