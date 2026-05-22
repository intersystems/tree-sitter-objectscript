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
    ...Array.from(
      {length: max - 1},
      () => optional(seq(separator, rule)),
    ),
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

  return choice(...sequences
    .sort((a, b) => b.length - a.length)
    .map((rules) => seq(...rules)));
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
};
