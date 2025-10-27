TS ?= tree-sitter

all install uninstall clean:
	$(MAKE) -C objectscript $@
	$(MAKE) -C objectscript_core $@

test:
	$(TS) test
	$(TS) parse examples/* --quiet --time

.PHONY: all install uninstall clean test update