/// <reference types="tree-sitter-cli/dsl" />

/**
 * Extends an existing language grammar with the provided options,
 * creating a new language.
 *
 * @param {GrammarSchema<string>} baseGrammar base grammar schema to extend from
 * @param {Grammar<string, string>} options grammar options for the new extended language
 * @returns {GrammarSchema<RuleName>}
 */
function define_grammar(baseGrammar, options) {
  if (baseGrammar.grammar.name == options.name) {
    // eslint-disable-next-line no-throw-literal
    throw 'Name conflict ';
  }
  for (const name in baseGrammar.grammar.rules) {
    if (options.rules[name] != undefined) {
      console.warn(`WARN: Duplicate rule name ${name}`);
    }
  }
  return grammar(baseGrammar, options);
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return sep1(rule, ',');
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more occurrences `sep` `rule`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sepStart1(rule, separator) {
  return repeat1(seq(separator, rule));
}

/**
 * Creates a rule to optionally match one or more occurrences of `, rule`
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function commaSepStart(rule) {
  return optional(commaSepStart1(rule));
}

/**
 * Creates a rule to match one or more occurrences of `, rule`
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function commaSepStart1(rule) {
  return sepStart1(rule, ',');
}

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

/**
 * Creates a rule to match any occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep(rule, separator) {
  return optional(sep1(rule, separator));
}

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1Immediate(rule, separator) {
  return seq(rule, repeat(seq(token.immediate(separator), rule)));
}

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1ImmediateOptional(rule, separator) {
  return seq(rule, repeat1(seq(token.immediate(separator), optional(rule))));
}

/**
 * Creates a rule to match count number of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 * @param {number} count
 *
 * @returns {SeqRule}
 */
function sepN(rule, separator, count) {
  return seq(
    rule,
    ...Array.from({length: count - 1}, () => seq(separator, rule)),
  );
}

/**
 * Creates a rule to match at least 1 rule up to
 * max number of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 * @param {number} max
 *
 * @returns {SeqRule}
 */
function sepUpTo(rule, separator, max) {
  return seq(
    rule,
    ...Array.from({length: max - 1}, () => optional(seq(separator, rule))),
  );
}

/**
 *
 * @param {...RuleOrLiteral} rules
 * @returns {ChoiceRule}
 */
function anyOrder1(...rules) {
  const sequences = [];

  /**
   *
   * @param {RuleOrLiteral[]} prefix
   * @param {RuleOrLiteral[]} remaining
   */
  function walk(prefix, remaining) {
    if (prefix.length > 0) sequences.push(prefix);

    remaining.forEach((rule, index) => {
      walk(
        prefix.concat(rule),
        remaining.slice(0, index).concat(remaining.slice(index + 1)),
      );
    });
  }

  walk([], rules);

  return choice(
    ...sequences
      .sort((a, b) => b.length - a.length)
      .map((rules) => seq(...rules)),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_block($, commandKeyword, commandArgument) {
  return choice(
    build_block_no_params($, commandKeyword),
    build_block_has_params($, commandKeyword, commandArgument),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @returns {RuleOrLiteral}
 */
function build_block_no_params($, commandKeyword) {
  return seq(commandKeyword, $._statements_block);
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_block_has_params($, commandKeyword, commandArgument) {
  return seq(commandKeyword, commandArgument, $._statements_block);
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_special_block_has_params($, commandKeyword, commandArgument) {
  return seq(
    commandKeyword,
    $._immediate_single_whitespace_followed_by_non_whitespace,
    commandArgument,
    optional($._intermediate_termination),
    $._statements_block,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @returns {RuleOrLiteral}
 */
function build_special_block_no_params($, commandKeyword) {
  return seq(commandKeyword, $._argumentless_loop, $._statements_block);
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_legacy_has_params($, commandKeyword, commandArgument) {
  return seq(
    commandKeyword,
    $._immediate_single_whitespace_followed_by_non_whitespace,
    commandArgument,
    repeat($.statement),
    $._termination,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @returns {RuleOrLiteral}
 */
function build_legacy_no_params($, commandKeyword) {
  return seq(
    commandKeyword,
    optional(seq($._argumentless_command_end, repeat1($.statement))),
    $._termination,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @returns {RuleOrLiteral}
 */
function build_legacy_no_params_cond($, commandKeyword) {
  return seq(
    commandKeyword,
    optional(
      seq(
        choice($._argumentless_command_end, $.argumentless_inline_comment),
        repeat1($.statement),
      ),
    ),
    $._termination,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_special_dotted_block_has_params(
  $,
  commandKeyword,
  commandArgument,
) {
  return seq(
    commandKeyword,
    $._immediate_single_whitespace_followed_by_non_whitespace,
    commandArgument,
    $._dotted_statements_block,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_dotted_block_has_params($, commandKeyword, commandArgument) {
  return seq(commandKeyword, commandArgument, $._dotted_statements_block);
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @returns {RuleOrLiteral}
 */
function build_dotted_block_no_params($, commandKeyword) {
  return seq(commandKeyword, $._dotted_statements_block);
}

/**
 * @param {RuleOrLiteral} firstSlot
 * @param {RuleOrLiteral} secondSlot
 * @returns {RuleOrLiteral}
 */
function build_parameter_options_two(firstSlot, secondSlot) {
  return choice(
    seq(token.immediate(':'), firstSlot),
    seq(
      token.immediate(':'),
      optional(firstSlot),
      token.immediate(':'),
      secondSlot,
    ),
  );
}

/**
 * @param {RuleOrLiteral} firstSlot
 * @param {RuleOrLiteral} secondSlot
 * @param {RuleOrLiteral} thirdSlot
 * @returns {RuleOrLiteral}
 */
function build_parameter_options_three(firstSlot, secondSlot, thirdSlot) {
  return choice(
    seq(token.immediate(':'), firstSlot),
    seq(
      token.immediate(':'),
      optional(firstSlot),
      token.immediate(':'),
      secondSlot,
    ),
    seq(
      token.immediate(':'),
      optional(firstSlot),
      token.immediate(':'),
      optional(secondSlot),
      token.immediate(':'),
      thirdSlot,
    ),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentless_or_argumentful(
  $,
  commandKeyword,
  commandArgument,
) {
  return choice(
    build_command_rule_argumentless($, commandKeyword),
    build_command_rule_argumentful($, commandKeyword, commandArgument),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentless_or_argumentful_block_allowed(
  $,
  commandKeyword,
  commandArgument,
) {
  return choice(
    build_command_rule_argumentless($, commandKeyword),
    build_command_rule_argumentful_block_allowed(
      $,
      commandKeyword,
      commandArgument,
    ),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RegExp[]} commandPatterns
 * @returns {RuleOrLiteral}
 */
function command_keyword_alias($, commandPatterns) {
  return alias(token(choice(...commandPatterns)), $.command_keyword);
}

/**
 * @param {RuleOrLiteral} argument
 * @returns {RuleOrLiteral}
 */
function build_arguments(argument) {
  return choice(build_argument_list(commaSep1(argument)), argument);
}

/**
 * @param {RuleOrLiteral} argument
 * @returns {RuleOrLiteral}
 */
function build_argument_list(argument) {
  return seq('(', argument, ')');
}

/**
 * @param {RuleOrLiteral} argument
 * @returns {RuleOrLiteral}
 */
function build_argument_list_immediate(argument) {
  return seq(token.immediate('('), argument, token.immediate(')'));
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentful($, commandKeyword, commandArgument) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    $._immediate_single_whitespace_followed_by_non_whitespace,
    commandArgument,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentful_block_allowed(
  $,
  commandKeyword,
  commandArgument,
) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    choice(
      $._immediate_single_whitespace_followed_by_non_whitespace,
      $._zw_block,
    ),
    commandArgument,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_argumentful_statement($, commandKeyword, commandArgument) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    choice(
      $._immediate_single_whitespace_followed_by_non_whitespace,
      $._argumentless_command_end,
    ),
    commandArgument,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @returns {RuleOrLiteral}
 */
function build_command_rule_argumentless($, commandKeyword) {
  return seq(
    commandKeyword,
    optional($.post_conditional),
    $._statement_termination,
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_legacy_version($, commandKeyword, commandArgument) {
  return choice(
    build_legacy_no_params($, commandKeyword),
    build_legacy_has_params($, commandKeyword, commandArgument),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_legacy_version_conditional($, commandKeyword, commandArgument) {
  return choice(
    build_legacy_no_params_cond($, commandKeyword),
    build_legacy_has_params($, commandKeyword, commandArgument),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_special_block_version($, commandKeyword, commandArgument) {
  return choice(
    build_special_block_no_params($, commandKeyword),
    build_special_block_has_params($, commandKeyword, commandArgument),
  );
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} commandKeyword
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_dotted_statement_special_block_version(
  $,
  commandKeyword,
  commandArgument,
) {
  return choice(
    build_dotted_block_no_params($, commandKeyword),
    build_special_dotted_block_has_params($, commandKeyword, commandArgument),
  );
}

/**
 * @param {RuleOrLiteral} commandArgument
 * @returns {RuleOrLiteral}
 */
function build_function_arguments(commandArgument) {
  return choice(
    commandArgument,
    seq(
      optional(commandArgument),
      repeat1(seq(',', optional(commandArgument))),
    ),
  );
}

module.exports = {
  define_grammar,
  commaSep1,
  commaSep,
  sep1,
  sepStart1,
  commaSepStart,
  commaSepStart1,
  sep1Immediate,
  sepN,
  sepUpTo,
  sep,
  anyOrder1,
  sep1ImmediateOptional,
  build_argument_list_immediate,
  build_command_rule_argumentful,
  build_command_rule_argumentless_or_argumentful_block_allowed,
  build_command_rule_argumentless_or_argumentful,
  build_dotted_statement_special_block_version,
  build_legacy_version,
  build_special_block_version,
  build_argument_list,
  build_dotted_block_has_params,
  build_block_has_params,
  build_command_rule_argumentful_block_allowed,
  build_parameter_options_three,
  build_parameter_options_two,
  build_dotted_block_no_params,
  build_block_no_params,
  build_special_dotted_block_has_params,
  build_special_block_has_params,
  build_special_block_no_params,
  build_legacy_version_conditional,
  build_legacy_no_params_cond,
  build_arguments,
  build_block,
  build_command_rule_argumentless,
  build_argumentful_statement,
  command_keyword_alias,
  build_function_arguments,
};
