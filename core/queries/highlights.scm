;; inherits: objectscript_expr
(locktype) @variable

(macro_arg) @variable
(macro_value) @constant.builtin
keyword: (_) @keyword

(embedded_js_special_case_complete) @punctuation.special
(embedded_sql_marker) @punctuation.special
(embedded_sql_reverse_marker) @punctuation.special
(html_marker) @punctuation.special
(html_marker_reversed) @punctuation.special

(attribute) @attribute

(open_keywords) @attribute
(use_keywords) @attribute
(close_parameter_option_value) @attribute

[
  (line_comment_1)
  (line_comment_2)
  (line_comment_3)
  (line_comment_4)
  (block_comment)
] @comment

(tag) @tag

[
  "--"
  ";"
  "//"
  "#;"
  "##;"
  "$"
] @punctuation