// @ts-check

/**
 * @file Babel-based AST transformation.
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

/**
 * Builds a RegExp object from pattern and flags.
 *
 * @param {string} pattern - The regex pattern string.
 * @param {string} flags - The regex flags.
 * @returns {RegExp} The compiled RegExp.
 */
function buildRegex(pattern, flags) {
    try {
        return new RegExp(pattern, flags);
    } catch (error) {
        throw new Error(`Invalid regex pattern: ${error.message}`);
    }
}

/**
 * Splits a match into two halves and inserts the separator.
 *
 * @param {string} match - The substring to transform.
 * @param {string} separator - The separator to insert.
 * @returns {string} The transformed substring.
 */
function transformMatch(match, separator) {
    const halfLength = Math.ceil(match.length / 2);
    const first = match.slice(0, halfLength);
    const second = match.slice(halfLength);
    return first + separator + second;
}

/**
 * Replaces all occurrences of the regex in the string and builds the new string.
 *
 * @param {string} original - The original string content.
 * @param {RegExp} regex - The regex to match.
 * @param {string} separator - The separator to insert.
 * @returns {string} The new string with replaced matches.
 */
function replaceInString(original, regex, separator) {
    return original.replace(regex, match => transformMatch(match, separator));
}

/**
 * Creates a `.replace()` call expression from a string literal node.
 *
 * @param {t.StringLiteral} stringNode - The original string literal node.
 * @param {string} separator - The separator used (to build the regex pattern).
 * @returns {t.CallExpression} A call expression: stringLiteral.replace(/separator/g, '')
 */
function createReplaceCall(stringNode, separator) {
    // Create the string literal with the modified value (already transformed)
    // We don't modify it here; it's already a new node passed in.

    // Build the regex literal: /separator/g
    const regexLiteral = t.regExpLiteral(separator, 'g');

    // Build the empty string literal
    const emptyString = t.stringLiteral('');

    // Build the member expression: stringNode.replace
    const memberExpr = t.memberExpression(stringNode, t.identifier('replace'));

    // Build the call expression: stringNode.replace(/separator/g, '')
    return t.callExpression(memberExpr, [regexLiteral, emptyString]);
}

/**
 * Transforms the JavaScript code by processing string literals.
 *
 * @param {string} code - The original JavaScript source code.
 * @param {Object} config - Configuration object.
 * @param {string} config.pattern - The regex pattern as a string.
 * @param {string} config.flags - The regex flags.
 * @param {string} config.separator - The separator to insert.
 * @returns {string} The transformed code.
 */
export function transformCode(code, { pattern, flags, separator }) {
    // Build the regex
    const regex = buildRegex(pattern, flags);
    const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape for regex

    // Parse the code into an AST
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'], // support common syntax
    });

    // Traverse and modify
    let modified = false;

    traverse.default(ast, {
        StringLiteral(path) {
            const node = path.node;
            const value = node.value;

            // Check if the string contains the pattern
            if (regex.test(value)) {
                // Replace all matches
                const newValue = replaceInString(value, regex, separator);
                if (newValue !== value) {
                    // Create a new string literal
                    const newStringLiteral = t.stringLiteral(newValue);
                    // Replace with a replace call
                    const replaceCall = createReplaceCall(newStringLiteral, escapedSeparator);
                    path.replaceWith(replaceCall);
                    modified = true;
                }
            }
        },

        // Optional: handle template literals (simple case – no expressions)
        TemplateLiteral(path) {
            // Only process if there are no expressions (i.e., all quasis)
            if (path.node.expressions.length === 0) {
                // Combine quasis into a single string
                const value = path.node.quasis.map(q => q.value.raw).join('');
                if (regex.test(value)) {
                    const newValue = replaceInString(value, regex, separator);
                    if (newValue !== value) {
                        const newStringLiteral = t.stringLiteral(newValue);
                        const replaceCall = createReplaceCall(newStringLiteral, escapedSeparator);
                        path.replaceWith(replaceCall);
                        modified = true;
                    }
                }
            }
        },
    });

    // If nothing was modified, return original code
    if (!modified) {
        return code;
    }

    // Generate the new code
    const output = generate.default(ast, {
        retainLines: true,
        compact: false,
    });

    return output.code;
}
