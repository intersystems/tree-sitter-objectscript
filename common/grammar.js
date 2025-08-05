/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />

/**
 * Extends an existing language grammar with the provided options,
 * creating a new language.
 *
 * @param {GrammarSchema<string>} baseGrammar base grammar schema to extend from
 * @param {Grammar<string, string>} options grammar options for the new extended language
 * @return {GrammarSchema<RuleName>}
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

module.exports = define_grammar;
