; Target method_body_content and reparse it using
; objectscript_core
;

((documatic_line) @injection.content
    (#set! injection.language "comment")
)

;; Keywords, one of type language = "python", none of type codemode
(method_definition
	keywords:
    (_
    	(kw_External_Language rhs: _ @injection.language)
    )
    body: (_) @injection.content
    (#set! injection.include-children "true")
)

(trigger
	keywords:
    (_
    	(kw_External_Language rhs: _ @injection.language)
    )
    body: (_) @injection.content
    (#set! injection.include-children "true")
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
; but we need to individually match each one so that we can specify the
; name of the tree-sitter grammar to inject.
(xdata
    keywords:
    (_
        (kw_MimeType rhs: _ @_mimetype (#eq? @_mimetype "\"text/markdown\""))
    )
    body: (_) @injection.content
    (#set! injection.language "markdown")
    (#set! injection.include-children "true")
)

(xdata
    keywords:
    (_
        (kw_MimeType rhs: _ @_mimetype (#eq? @_mimetype "\"text/xml\""))
    )
    body: (_) @injection.content
    (#set! injection.language "xml")
    (#set! injection.include-children "true")
)

(xdata
    keywords:
    (_
        (kw_MimeType rhs: _ @_mimetype (#eq? @_mimetype "\"text/html\""))
    )
    body: (_) @injection.content
    (#set! injection.language "html")
    (#set! injection.include-children "true")
)

(xdata
    keywords:
    (_
        (kw_MimeType rhs: _ @_mimetype (#eq? @_mimetype "\"application/json\""))
    )
    body: (_) @injection.content
    (#set! injection.language "json")
    (#set! injection.include-children "true")
)

(xdata
    keywords:
    (_
        (kw_MimeType rhs: _ @_mimetype (#eq? @_mimetype "\"text/css\""))
    )
    body: (_) @injection.content
    (#set! injection.language "css")
    (#set! injection.include-children "true")
)


; Match other less specific XDATAs
(xdata
    body: (_) @injection.content
    (#set! injection.language "xml")
    (#set! injection.include-children "true")
)

; Storage definition is XML
(storage
    body: (_) @injection.content
    (#set! injection.language "xml")
    (#set! injection.include-children "true")
)

