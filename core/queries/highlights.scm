;; inherits: objectscript_expr
; -------------- Objectscript Core -------------
; Commands
; e.g. 'set', 'do', 'D'
; -----------------------------------------
(_ command_name: (_) @keyword)

(_ macro_name: (_) @keyword.macro)
(_ macro_arg: (_) @constant.macro)
(_ mnemonic: (_) @constant.macro)

; Functions that can be on the LHS of a SET
(doable_dollar_functions) @function.builtin

; non-extrinsic routine call
(routine_tag_call) @function.call

;; Technically elseif and else_block are not statements,
;; so we need ot query them explicitly
;(elseif_block command_name: (_) @keyword)
;(else_block command_name: (_) @keyword)

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
; (embedded_sql_hash
;   (keyword_embedded_sql_hash) @keyword.directive
; )
; (embedded_sql_amp
;   (keyword_embedded_sql_amp) @keyword.directive
;   "(" @keyword.directive
;   ")" @keyword.directive
;   (embedded_sql_reverse_marker) @keyword.directive
; )

(embedded_sql_amp
  (keyword_embedded_sql_amp) @keyword.directive
  "(" @keyword.directive
  ")" @keyword.directive
)

(embedded_sql_hash
  (keyword_embedded_sql_hash) @keyword.directive
  "(" @keyword.directive
  ")" @keyword.directive
)

(embedded_js
  (keyword_embedded_js) @keyword.directive
  "<" @keyword.directive
  ">" @keyword.directive
)

(embedded_xml
  (keyword_embedded_xml) @keyword.directive
  "<" @keyword.directive
  ">" @keyword.directive
)

(tag) @label

; Lock type specifications
(locktype) @type.qualifier

