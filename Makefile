TS ?= tree-sitter
QUERY_DIRS ?= core/queries udl/queries expr/queries objectscript/queries objectscript_routine/queries
DEPDIR ?= .test-deps
CURL ?= curl -sL --create-dirs

ifeq ($(shell uname -s),Darwin)
	ifeq ($(shell uname -m),arm64)
		RUST_ARCH ?= aarch64-apple-darwin
	else
		RUST_ARCH ?= x86_64-apple-darwin
	endif
else
	ifeq ($(shell uname -m),aarch64)
		RUST_ARCH ?= aarch64-unknown-linux-gnu
	else
		RUST_ARCH ?= x86_64-unknown-linux-gnu
	endif
endif

TSQUERYLS := $(DEPDIR)/ts_query_ls-$(RUST_ARCH)
TSQUERYLS_TARBALL := $(TSQUERYLS).tar.gz
TSQUERYLS_URL := https://github.com/ribru17/ts_query_ls/releases/latest/download/$(notdir $(TSQUERYLS_TARBALL))

all install uninstall clean:
	$(MAKE) -C objectscript $@
	$(MAKE) -C udl $@
	$(MAKE) -C core $@
	$(MAKE) -C expr $@
	$(MAKE) -C objectscript_routine $@

test:
	$(TS) test
	@set -eu; \
	repo_root="$(CURDIR)"; \
	found=0; \
	for file in "$$repo_root"/examples/*.cls; do \
		[ -e "$$file" ] || continue; \
		found=1; \
		( \
			cd udl; \
			$(TS) parse --quiet --time "$$file"; \
		); \
	done; \
	if [ "$$found" -eq 0 ]; then \
		echo "No .cls examples found under examples/"; \
	fi

buildqueryparsers:
	@set -eu; \
	jq -r '.grammars[] | [.path // ".", .name] | @tsv' tree-sitter.json | \
	while read -r grammar_dir grammar_name; do \
		( \
			cd "$$grammar_dir"; \
			$(TS) build; \
			built_parser=""; \
			for ext in so dylib dll wasm; do \
				if [ -f "parser.$$ext" ]; then \
					built_parser="parser.$$ext"; \
					break; \
				fi; \
			done; \
			if [ -z "$$built_parser" ]; then \
				echo "No parser artifact produced for $$grammar_name in $$grammar_dir" >&2; \
				exit 1; \
			fi; \
			target_parser="$$grammar_name.$${built_parser##*.}"; \
			tmp_parser=".$$target_parser.tmp"; \
			cp "$$built_parser" "$$tmp_parser"; \
			mv -f "$$tmp_parser" "$$target_parser"; \
		); \
	done

.PHONY: tsqueryls
tsqueryls: $(TSQUERYLS)

$(TSQUERYLS):
	$(CURL) $(TSQUERYLS_URL) -o $(TSQUERYLS_TARBALL)
	mkdir -p $@
	tar -xf $(TSQUERYLS_TARBALL) -C $@
	rm -rf $(TSQUERYLS_TARBALL)

syncqueries:
	python3 scripts/sync_queries.py

installhooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/pre-commit

formatquery: syncqueries $(TSQUERYLS)
	$(TSQUERYLS)/ts_query_ls format $(QUERY_DIRS)

lintquery: syncqueries $(TSQUERYLS)
	$(TSQUERYLS)/ts_query_ls lint $(QUERY_DIRS)

checkquery: syncqueries $(TSQUERYLS) buildqueryparsers
	$(TSQUERYLS)/ts_query_ls check $(QUERY_DIRS)

query: formatquery lintquery checkquery

.PHONY: all install uninstall clean test update buildqueryparsers syncqueries installhooks formatquery lintquery checkquery query
