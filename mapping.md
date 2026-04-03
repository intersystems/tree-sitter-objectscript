{
; NOTES :
- do x -> x maps to the same highlighting as procedure name (yellow bg, maroon fg)
    "mapping 1:1": {
        "Error" : "",
        "White Space": "",
        "_Tab": "",
        "Label": "@label", // yellow bg, maroon fg
        "Dots": "", // silver bg, black fg
        "Object (class)": "unsure",
        "String": "@string", // pink bg, black fg
        "Comment": "@comment", // green fg, default bg
        "Object dot operator": "",
        "SQL": "keyword.operator",
        "HTML": "keyword.operator",
        "JavaScript" : "keyword.operator" // purple fg, default bg 
        "Pre-Processor Function": "@keyword.directive", // blue fg, default bg
        "Pre-Processor Command": "@keyword.directive", // blue fg, default bg
        "macro": @function.macro AND @constant.macro // silver bg, blue fg 
        "Delimiter": "@punctuation.delimiter", // black fg, default bg
        "External Reference (global?)":  gvn node "@variable AND @operator ..., make sure ^ doesn't get highlighted separately, i should only highlight gvn here", NOTE: this is just accessing a global, etc. not setting //black fg, default bg
        "Global Variable": gvn node @variable //black fg, default bg
        "Extrinsic Function": not really one to one but $$ maps to @punctuation.delimiter //blue fg, default bg
        "Format Specifier": @operator ex: Write !,"Hello" // black fg, default bg
        "Function": @function.builtin // blue fg, default bg (NOTE: built in functions)
        "Indirection":  @operator // just the @ // blue fg, default bg
        "Local Variable": @lvn // maroon fg, light_cyan bg
        "Mnemonic": maps to device_keywords node, which has @keyword.modifier
        "Name": not sure, //black fg, default bg
        "Number": @number //black fg, default bg
        "Operator": @operator //black fg, default bg
        "Routine": routine_name node, @type // maroon fg, yellow bg
        "Special": dont know (black fg, default bg)
        "Structured variable": don't know // blue fg, default bg
        "System variable": ssvn node @variable // blue fg, default bg
        "Object property": I guess (property_name) node, @variable.member // blue fg, default bg
        "Object name": not sure tbh // teal fg, default bg  ex: the x in w ##class(x).okay(),
        "Command": @keyword.repeat, @keyword.conditional, @keyword.exception, @keyword.return, @keyword.debug, @keyword.directive, @keyword.modifier, @function.builtin // red fg, default bg ,
        "Object instance var": (instance_variable) node, @variable.member // black fg, default bg
        "Object reference var": not sure, // black fg, default bg
        "Object Method": this should map to oref method node, which doesn't have a specific highlight yet, // blue fg, default bg,
        "Object attribute": should map to oref property, // blue fg, default bg,
        "Object (this)": (system defined variable) @variable.builtin // blue fg, default bg
        "Pattern": (pattern_expression node? ) @string.regexp // olive fg, default bg
        "Neutral": anything that doesn't match other stuff @string.regexp // olive fg, default bg
        "Brace" : @punctuation.delimiter // purple fg, default bg 
        "CSP Extension": not sure,
        "Object (Super)": (keyword_pound_pound_super) @keyword.operator 
        "Option Track Warning": not sure what this is tbh // purple fg, default bg 
        "Parameter": (method_arg) node, @variable.parameter // magenta fg, default bg 
        "Local (undeclared)": not sure what this maps to tbh // black fg, default bg 
        "Documentation comment": @comment.documentation // blue fg, default bg 
        ""Unknown Z-function"", ""Unknown Z-function"", "Unknown Z-variable" -> add this to tree sitter // olive fg, dfault bg
        "Object member": generic (something on an object) -> oref_chain_segment? // blue fg, default bg
        "JSON bracket": (json_object_literal, json_array_literal)? // magenta fg, default bg 
        "JSON delimeter":  ':' and ',' in the json stuff.. (NEED TO ADD) // grey fg, default bg
        "JSON keyword": (json boolean or json null val) (NEED TO ADD CAPTURE) // blue fg default background
        Embedding open/close: ex: <%= $ZDate($Horolog) %> the <%= would. be the opening //black fg, default bg 

    },
    "GROUPINGS BY COLOR TO CACHE" : {
        "DEFAULT": ["Error", "white space", "_Tab"],
        "maroon fg, yellow bg": ["Label", "Routine"],
        "black fg,silver bg": ["Dots"],
        "black fg, pink bg": ["String"], 
        "green fg, default bg": ["Comment],
        "magenta fg, default bg": ["Parameter","JSON bracket" ]
        "black fg, default bg": ["object dot operator", "delimiter", "External reference", "Format Specifier", "Mnemonic", "Name", "Number", "Operator", "Special", "Object instance var", "Object reference var"],
        "blue fg, default bg": ["Pre processor function", "Pre-Processor Command", "Extrinsic function","Function", "Indirection", "Structured variable", "System variable", "Object property", "Object Method", "Object attribute", "Documentation comment", "Object member", "JSON keyword"],
        "purple fg, default bg": ["SQL","HTML", "Brace", "JavaScript"],
        "maroon fg, light_cyan bg": ["Local Variable"]
        "Navy FG, Default BG": ["Object (Class) ","Object (This)","Object (Super)", "includes ..x, $THIS, ##super, etc"],
        "teal fg, default bg": ["Object name"],
        "olive fg, default bg": ["Pattern", "Local variable (private)", "Neutral", "Unknown Z-command", "Unknown Z-function", "Unknown Z-variable"]
        "red fg, default bg": ["Command"]
        "grey fg, default bg": ["JSON delimiter"]
    },

    " GROUPING BY COLOR TO CAPTURE" : {
        Default (fg = bg) : this isnt a capture,
        "maroon fg, yellow bg": [@label, @type],
        "black fg,silver bg": ["Dots"], //specifically dots in dotted statements, I am going to add something for this
    }
    



}




