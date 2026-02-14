# Documentation Topic Suggestions

Based on analysis of the tree-sitter-objectscript codebase and existing documentation, here are recommended follow-on documentation topics.

---

## Themes Identified

| Theme | Signal Strength | Evidence |
|-------|-----------------|----------|
| **Grammar Architecture** | High | Three-grammar hierarchy, extension pattern |
| **External Scanner** | High | Complex C code, whitespace handling |
| **Language Injection** | High | Multiple injection queries, polyglot support |
| **Editor Integration** | Medium | Zed, Neovim, Emacs setup |
| **Testing & Validation** | Medium | Corpus tests, binding tests |
| **Keyword System** | Medium | Extensive keyword combinations |

---

## Suggested Documentation (Priority Ordered)

### 1. External Scanner Deep Dive
**Type:** Technical Reference  
**Extractor Skill:** `data-structure-doc`, `code-usage-examples`  
**Priority:** P0 (High)

**Rationale:**
- Scanner is the most complex component (~700 lines of C)
- Contains subtle state management and whitespace detection
- Critical for correct parsing
- Current documentation is embedded in code comments

**Suggested Sections:**
- Token type reference with examples
- State machine diagrams
- Debugging techniques
- Common failure modes

---

### 2. Injection Query Cookbook
**Type:** How-To Guide  
**Extractor Skill:** `code-usage-examples`  
**Priority:** P0 (High)

**Rationale:**
- Injections are a key feature for polyglot support
- Query syntax is non-obvious
- Editor-specific variations exist
- Users frequently need to add custom injections

**Suggested Sections:**
- Query pattern reference
- Editor compatibility matrix
- Adding new language injections
- Debugging injection failures

---

### 3. Command Reference
**Type:** API Reference  
**Extractor Skill:** `data-structure-doc`  
**Priority:** P1 (Medium)

**Rationale:**
- 40+ commands in core grammar
- Each has unique argument patterns
- Post-conditional support varies
- Useful for editor plugin authors

**Suggested Format:**
- Per-command syntax diagram
- AST structure
- Highlight query patterns
- Test examples

---

### 4. Grammar Extension Guide
**Type:** Tutorial  
**Extractor Skill:** `code-usage-examples`  
**Priority:** P1 (Medium)

**Rationale:**
- Common use case: extend for CSP, custom dialects
- Extension pattern is non-obvious
- Conflicts and precedence rules complex
- Enables community contributions

**Suggested Sections:**
- Creating a new grammar that extends core/expr
- Adding new keywords
- Handling conflicts
- Testing extended grammars

---

### 5. Editor Integration Guide
**Type:** How-To Guide  
**Extractor Skill:** N/A (documentation only)  
**Priority:** P1 (Medium)

**Rationale:**
- README covers basics but lacks depth
- Each editor has unique configuration
- Query file compatibility varies
- Common issues not documented

**Suggested Sections:**
- Per-editor detailed setup
- Troubleshooting common issues
- Performance tuning
- Custom highlight themes

---

### 6. Keyword Combinations Reference
**Type:** API Reference  
**Extractor Skill:** `data-structure-doc`  
**Priority:** P2 (Low)

**Rationale:**
- Extensive keyword system in `udl/keywords.js`
- Valid combinations not obvious
- Impacts method/property/class behavior
- Useful for language server authors

**Suggested Format:**
- Per-member-type keyword table
- Valid/invalid combinations
- Default values
- Interaction effects

---

### 7. AST Query Patterns Library
**Type:** Reference / Examples  
**Extractor Skill:** `code-usage-examples`  
**Priority:** P2 (Low)

**Rationale:**
- Common queries needed for tooling
- Pattern syntax learning curve
- Reusable patterns save time
- Enables community tooling

**Suggested Categories:**
- Finding all methods/properties/parameters
- Extracting SQL from embedded blocks
- Navigating class hierarchies
- Finding specific command usage

---

## Extractor Skills to Build Next

Based on the themes and gaps identified:

| Skill | Purpose | Input |
|-------|---------|-------|
| `scanner-state-doc` | Document scanner state transitions | `common/scanner.h` |
| `injection-query-doc` | Document injection patterns | `*/queries/injections.scm` |
| `command-doc` | Document individual commands | `core/grammar.js` |
| `keyword-doc` | Document keyword combinations | `udl/keywords.js` |

---

## Skeletons (If Requested)

### External Scanner Deep Dive Skeleton

```markdown
# External Scanner Reference

## Overview
[What the scanner does, why it exists]

## Token Types
### _IMMEDIATE_SINGLE_WHITESPACE_FOLLOWED_BY_NON_WHITESPACE
[When produced, what it means, example]

### _ARGUMENTLESS_COMMAND_END
[When produced, what it means, example]

[... repeat for each token type ...]

## State Management
### Scanner State Structure
[Fields, serialization]

### State Transitions
[Diagram, triggers]

## Debugging
### Common Issues
[Symptoms, causes, fixes]

### Logging
[How to enable, interpret output]
```

### Injection Query Cookbook Skeleton

```markdown
# Injection Query Cookbook

## Overview
[What injections are, how they work]

## Basic Patterns
### External Method Body
[Pattern, example, editor notes]

### Embedded SQL
[Pattern, example, editor notes]

[... repeat for each injection type ...]

## Editor Compatibility
| Pattern | Zed | Neovim | Emacs |
|---------|-----|--------|-------|
| #match? | ✓ | ✓ | ✓ |
| #set! | ✓ | ✓ | ? |
| #strip! | ✗ | ✗ | ✗ |

## Adding Custom Injections
[Step-by-step guide]

## Troubleshooting
[Common issues and solutions]
```

---

## Open Questions

1. Should command documentation be auto-generated from grammar rules?
2. What level of detail is needed for editor integration guides?
3. Should there be a separate "internals" doc for contributors vs. users?

---

## Assumptions

1. Primary audience is editor plugin developers and grammar contributors
2. Users have basic tree-sitter knowledge
3. Documentation should be searchable and linkable

---

## Next Steps

Would you like me to generate any of these suggested documentation topics?

1. External Scanner Deep Dive
2. Injection Query Cookbook  
3. Command Reference
4. Grammar Extension Guide
5. Editor Integration Guide
6. Keyword Combinations Reference
7. AST Query Patterns Library
