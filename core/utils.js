// / <reference types="tree-sitter-cli/dsl" />
// @ts-check
/**
 *
 * Utility functions to aid in the generation of
 * grammar.js
 */

/**
 * This function takes in a rule,
 * and recursively traverses it,
 * wraping each token rule with token.immediate
 * The recursion continues for non terminals
 * that are not the value of the current terminal
 * Recursion is done with DFS and a visited dictionary
 * is used to avoid cycles
 * Note: excludeList is hard-coded to avoid certain rule names
 * (method_args, subscripts, etc.) to prevent infinite recursion.
 * This is by design for the current grammar architecture.
 *
 * @param {GrammarSchema<string>} baseGrammar
 * @param{SymbolRule<string>[]} excludeList
 * @return {Record<string, RuleBuilder<string>>}
 */
module.exports.unspace = function (baseGrammar, excludeList) {
  // first build up a map of unvisted rules,
  // mark everything in the excludeList as visited
  /** @type { { [x: string]: boolean; } } */
  const visited = {};
  for (const eRule of excludeList) {
    visited[eRule.name] = true;
  }
  /** @type {Record<string,RuleBuilder<string>>} */
  const ruleMap = {};
  // Now, given the rule we would like to unspace,
  // access its definition from the grammar
  // eslint-disable-next-line no-unused-vars
  const _ = _unspace(baseGrammar, visited, sym('expression'), ruleMap);
  // console.dir(ruleMap, { depth: null, colors: true });
  return ruleMap;
};

/**
 * @param {RuleOrLiteral} rule
 * @return {Rule}
 */
module.exports.repeat_with_commas = function (rule) {
  return seq(rule, repeat(seq(',', rule)));
};

// Rules excluded from unspacing to prevent infinite recursion
const EXCLUDED_RULE_1 = 'method_args';
const EXCLUDED_RULE_2 = 'subscripts';
const EXCLUDED_RULE_3 = '_parenthetical_expression';
const EXCLUDED_RULE_4 = 'system_defined_function';

// eslint-disable-next-line valid-jsdoc
/**
 * @template {string} T
 * @param {GrammarSchema<T>} baseGrammar
 * @param {{ [x: string]: boolean; }} visited
 * @param {Rule} rule
 * @param {Record<string,RuleBuilder<string>>} ruleMap
 * @return {Rule}
 */
function _unspace(baseGrammar, visited, rule, ruleMap) {
  if (rule.type == 'SYMBOL') {
    if (
      rule.name == EXCLUDED_RULE_1 ||
      rule.name == EXCLUDED_RULE_2 ||
      rule.name == EXCLUDED_RULE_3 ||
      rule.name == EXCLUDED_RULE_4
    ) {
      return { ...rule };
    }
    if (visited[rule.name]) {
      return alias(sym(rule.name + '_post_cond'), rule);
    }
    const unwrappedRule = baseGrammar.rules[rule.name];
    visited[rule.name] = true;
    const nodes = _unspace(baseGrammar, visited, unwrappedRule, ruleMap);
    ruleMap[rule.name + '_post_cond'] = (_$) => nodes;
    return alias(sym(rule.name + '_post_cond'), rule);
  }
  if (rule.type == 'CHOICE') {
    /** @type {ChoiceRule} rule */
    /** @type {Rule[]} */
    const members = [];
    for (const r of rule.members) {
      members.push(_unspace(baseGrammar, visited, r, ruleMap));
    }
    return choice(...members);
  }
  if (rule.type == 'SEQ') {
    /** @type {SeqRule} rule */
    /** @type {Rule[]} */
    const members = [];
    for (const r of rule.members) {
      members.push(_unspace(baseGrammar, visited, r, ruleMap));
    }
    return seq(...members);
  }
  if (rule.type == 'REPEAT') {
    const unwrappedRule = rule.content;
    return repeat(_unspace(baseGrammar, visited, unwrappedRule, ruleMap));
  }

  if (rule.type == 'REPEAT1') {
    const unwrappedRule = rule.content;
    return repeat1(_unspace(baseGrammar, visited, unwrappedRule, ruleMap));
  }
  if (rule.type == 'ALIAS') {
    /** @type {AliasRule} rule */
    const r = alias(
      _unspace(baseGrammar, visited, rule.content, ruleMap),
      rule.value,
    );
    // Need to copy the `named` property or all _unspace()'d aliases become anonymous
    r.named = rule.named;
    return r;
  }
  if (rule.type == 'PATTERN') {
    /** @type {PatternRule} rule */
    return token.immediate({ ...rule });
  }
  if (rule.type == 'PREC_LEFT') {
    /** @type {PrecLeftRule} rule */
    return prec.left(
      rule.value,
      _unspace(baseGrammar, visited, rule.content, ruleMap),
    );
  }
  if (rule.type == 'PREC_RIGHT') {
    /** @type {PrecRightRule} rule */
    return prec.right(
      rule.value,
      _unspace(baseGrammar, visited, rule.content, ruleMap),
    );
  }
  if (rule.type == 'STRING') {
    /** @type {StringRule} rule */
    return token.immediate({ ...rule });
  }
  if (rule.type == 'TOKEN') {
    /** @type {TokenRule} rule */
    return token.immediate({ ...rule });
  }
  if (rule.type == 'PREC') {
    /** @type {PrecRule} rule */
    return prec(
      rule.value,
      _unspace(baseGrammar, visited, rule.content, ruleMap),
    );
  }
  if (rule.type == 'FIELD') {
    /** @type {PrecRule} rule */
    return field(
      rule.name,
      _unspace(baseGrammar, visited, rule.content, ruleMap),
    );
  }
  if (rule.type == 'BLANK') {
    /** @type {BlankRule} rule */
    return blank();
  }
  if (rule.type == 'PREC_DYNAMIC') {
    /** @type {PrecDynamicRule} rule */
    return prec.dynamic(
      rule.value,
      _unspace(baseGrammar, visited, rule.content, ruleMap),
    );
  }
  if (rule.type == 'IMMEDIATE_TOKEN') {
    /** @type {ImmediateTokenRule} rule */
    return { ...rule };
  }
  // / This should NEVER happen
  return rule;
}
