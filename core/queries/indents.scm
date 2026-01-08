





("{" @indents.begin)
("}" @indents.end)

; Indent for command_write arguments
(command_write
    (keyword_write)
    (write_argument) @indent)

(command_set
    (keyword_set)
    (set_argument) @indent)

(command_do
    (keyword_do)
    (do_parameter) @indent)

(command_kill
  (keyword_kill)
  (kill_argument) @indent)

(command_lock
  (keyword_lock)
  (command_lock_argument) @indent)

(command_read
 (keyword_read)
 (read_argument) @indent)

(command_open
 (keyword_open)
 (open_argument) @indent)

(command_close
 (keyword_close)
 (close_argument) @indent)

(command_use
 (keyword_use)
 (use_argument) @indent)

; ----- Block-style commands -----
(command_while "{" @indent.begin "}" @indent.end)
(command_for   "{" @indent.begin "}" @indent.end)
(command_if    "{" @indent.begin "}" @indent.end)
(elseif_block  "{" @indent.begin "}" @indent.end)
(else_block    "{" @indent.begin "}" @indent.end)

; ----- Old-style FOR -----
(command_for (for_parameter) @indent)
(command_for (statement)     @indent)

; ----- Old-style IF -----
(command_if  (expression) @indent)
(command_if  (statement)  @indent)


