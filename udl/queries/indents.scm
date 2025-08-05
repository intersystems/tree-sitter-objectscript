; Indentation rules for ObjectScript UDL (User Defined Language)

; --- Class Definition ---
; Indent the body of a class, which is enclosed in {}.
; The class_body node contains all class statements (methods, properties, etc.).
(class_body
  "{" @indent.begin)
(class_body
  "}" @indent.end)


(class_body
 (class_statement) @indent)


(_) @indent
