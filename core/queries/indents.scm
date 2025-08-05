





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
 (open_parameter) @indent)

(command_close
 (keyword_close)
 (close_parameter) @indent)

(command_use
 (keyword_use)
 (use_parameter) @indent)

(command_while
  (statements) @indent)
