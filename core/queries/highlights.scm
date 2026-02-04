;; inherits: objectscript_expr
; -------------- Objectscript Core -------------
; Commands
; e.g. 'set', 'do', 'D'
; -----------------------------------------
command_name: (_) @keyword
macro_name: (_) @keyword.macro
macro_arg: (_) @constant.macro
mnemonic: (_) @constant.macro

; (_ parameter: _ @variable.parameter)

(doable_dollar_functions) @function.builtin

; non-extrinsic routine call
(routine_tag_call) @function.call

; method call
(instance_method_call) @function.method.call

"{" @punctuation.bracket
"}" @punctuation.bracket

; Comments
; e.g. '// fj;lkasdfj', '#; sklfjas;k', '; sklfjas','/* sdfs */'
[
  (line_comment_1)
  (line_comment_2)
  (line_comment_3)
  (block_comment)
] @comment 

(embedded_html
  (keyword_embedded_html) @keyword.directive
  "<" @keyword.directive
  ">" @keyword.directive
)

(embedded_html
  (keyword_embedded_html) @keyword.directive
  (html_marker) @marker
  "<" @keyword.directive
  ">" @keyword.directive
  (html_marker_reversed) @marker
)

(embedded_sql_amp
  (keyword_embedded_sql_amp) @keyword.directive
  "(" @keyword.directive
  ")" @keyword.directive
) @embedded_sql

(embedded_sql_amp
  (keyword_embedded_sql_amp) @keyword.directive
  (embedded_sql_marker) @marker
  "(" @keyword.directive
  ")" @keyword.directive
  (embedded_sql_reverse_marker) @marker
) @embedded_sql

(embedded_sql_hash
  (keyword_embedded_sql_hash) @keyword.directive
  "(" @keyword.directive
  ")" @keyword.directive
) @embedded_sql
(embedded_js
  (html_marker) @marker
  "<" @keyword.directive
  (embedded_js_special_case) @js_bod
  ">" @keyword.directive
  (embedded_js_special_case_complete) @marker
) @embeddedJS

(embedded_js
  "<" @keyword.directive
  ">" @keyword.directive
)@embeddedJS

(embedded_xml
  (keyword_embedded_xml) @keyword.directive
  "<" @keyword.directive
  ">" @keyword.directive
)

(tag) @label

; Lock type specifications
(locktype) @type.qualifier
(_read_prompt) @readprompt
