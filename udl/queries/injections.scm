; Target method_body_content and reparse it using
; objectscript_core
;

((documatic_line) @injection.content
    (#set! injection.language "comment")
)

;; Keywords, one of type language = "python", none of type codemode
; External method body injection based on [ Language = ... ]
(method_definition
  keywords: (external_method_keywords
    (method_keyword_language
      (rhs) @lang))
  body: (external_method_body_content) @injection.content
  (#set! injection.include-children "true")
  (#match? @lang "(?i)^python$")
  (#set! injection.language "python"))

(method_definition
  keywords: (external_method_keywords
    (method_keyword_language
      (rhs) @lang))
  body: (external_method_body_content) @injection.content
  (#set! injection.include-children "true")
  (#match? @lang "(?i)^tsql$")
  (#set! injection.language "tsql"))

(method_definition
  keywords: (external_method_keywords
    (method_keyword_language
      (rhs) @lang))
  body: (external_method_body_content) @injection.content
  (#set! injection.include-children "true")
  (#match? @lang "(?i)^javascript$")
  (#set! injection.language "ispl"))



;; External trigger with python body
(
  (trigger
    (trigger_keywords
      (method_keyword_language) @lang)
    (external_method_body_content) @injection.content)
  (#match? @lang "python")
  (#set! injection.language "python")
)

;; External trigger with TSQL body
(
  (trigger
    (trigger_keywords
      (method_keyword_language) @lang)
    (external_method_body_content) @injection.content)
  (#match? @lang "tsql")
  (#set! injection.language "tsql")
)

; A query must be of type %SQLQuery to have an SQL body, otherwise the body
; is empty
(query
	type: (_ (typename (identifier) @_querytype (#eq? @_querytype "%SQLQuery")))
    (_ (query_body_content) @injection.content)
    (#set! injection.language "sql")
    (#set! injection.include-children "true")
)

; XDATA blocks.  There's a MimeType keyword that defines the content-type
; To prevent overlapping matches, we use a different body for the case where
; no MimeType is given and default to XML, otherwise we extract the language
; from the mimetype.

; ----------------------------
; XDATA injections (MimeType)
; ----------------------------

; text/markdown
(xdata
  keywords: (xdata_keywords
    (xdata_keyword_mimetype (rhs) @mt))
  body: (xdata_body_content_any) @injection.content
  (#set! injection.include-children "true")
  (#match? @mt "^\"text/markdown\"$")
  (#set! injection.language "markdown"))

; text/xml
(xdata
  keywords: (xdata_keywords
    (xdata_keyword_mimetype (rhs) @mt))
  body: (xdata_body_content_any) @injection.content
  (#set! injection.include-children "true")
  (#match? @mt "^\"text/xml\"$")
  (#set! injection.language "xml"))

; text/html
(xdata
  keywords: (xdata_keywords
    (xdata_keyword_mimetype (rhs) @mt))
  body: (xdata_body_content_any) @injection.content
  (#set! injection.include-children "true")
  (#match? @mt "^\"text/html\"$")
  (#set! injection.language "html"))

; application/json
(xdata
  keywords: (xdata_keywords
    (xdata_keyword_mimetype (rhs) @mt))
  body: (xdata_body_content_any) @injection.content
  (#set! injection.include-children "true")
  (#match? @mt "^\"application/json\"$")
  (#set! injection.language "json"))

; text/css
(xdata
  keywords: (xdata_keywords
    (xdata_keyword_mimetype (rhs) @mt))
  body: (xdata_body_content_any) @injection.content
  (#set! injection.include-children "true")
  (#match? @mt "^\"text/css\"$")
  (#set! injection.language "css"))

; -----------------------------------------
; XDATA default (no MimeType): XML fallback
; -----------------------------------------
(xdata
  body: (xdata_body_content_xml) @injection.content
  (#set! injection.include-children "true")
  (#set! injection.language "xml"))


; NOTE: This should work in tree-sitter, but #strip! seems to not be available
;       in Zed and possibly other environments.
;
;       Also, it's not exactly clear if include-children and combined are needed
;
; (xdata
;     keywords:
;     (_
;         (xdata_keyword_mimetype rhs: (_) @injection.language
;          (#match? @injection.language "^\"[A-Za-z0-9.+-]+/[^\"/]+\"$")
;         )
;     )
;
;     (#strip! @injection.language "^\"|\"$") ; strip outer quotes
;     (#strip! @injection.language "^[^/]+/") ; drop leading application or text prefix
;     (#strip! @injection.language "^x-")     ; drop leading x- on the name
;
;     body: (xdata_body_content_any) @injection.content
;     (#set! injection.include-children "false")
;     (#set! injection.combined "true")
; )
;
; ; Match an unspecified XDATA -- that is XML
; (xdata
;     body: (xdata_body_content_xml) @injection.content
;     (#set! injection.language "xml")
;     (#set! injection.include-children "false")
;     (#set! injection.combined "true")
; )

; Storage definition is XML
(storage
    body: (_) @injection.content
    (#set! injection.language "xml")
    (#set! injection.include-children "true")
)

