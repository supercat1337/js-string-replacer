# JS String Replacer

A CLI tool that parses JavaScript files (ESM/ES6) and replaces specified patterns inside string literals. For each match, the tool splits the matched substring in half, inserts a custom separator, and wraps the string in a `.replace()` call that removes the separator.

## Features

- Parses JavaScript code using Babel (AST transformation).
- Supports double‑quoted strings, single‑quoted strings, and template literals (without expressions).
- Configurable via INI file or default settings.
- Adds a `.replace(/separator/g, '')` call to the transformed string.
- Preserves original formatting and line numbers.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/supercat1337/js-string-replacer.git
cd js-string-replacer
npm install
```

To use the tool globally, link it:

```bash
npm link
```

Now you can run `js-string-replacer` from any directory.

## Usage

```
js-string-replacer [options] <input-file> <output-file>
```

### Options

- `-c, --config <file>` – Path to an INI configuration file (optional).
- `-h, --help` – Show help.

If no configuration file is provided, the default settings are used:

- Pattern: `</script>`
- Flags: `gi` (global, case‑insensitive)
- Separator: `_separator_`

### Example

Given an input file `example.js`:

```javascript
const str = 'Hello </script> world';
const another = 'Another </script> here';
```

Run:

```bash
js-string-replacer example.js output.js
```

The output will be:

```javascript
const str = 'Hello </s_separator_cript> world'.replace(/_separator_/g, '');
const another = 'Another </s_separator_cript> here'.replace(/_separator_/g, '');
```

## Configuration

You can provide an INI file to customize the behaviour. Example `config.ini`:

```ini
pattern = <your-pattern>
flags = gi
separator = your_separator
```

- `pattern` – A regular expression pattern (string) to match.
- `flags` – Regular expression flags (e.g., `gi`).
- `separator` – The string inserted in the middle of each match. It will later be removed by the added `.replace()` call.

Use the file with the `-c` option:

```bash
js-string-replacer input.js output.js -c config.ini
```

## How It Works

1. The tool reads the input JavaScript file.
2. It parses the code into an AST using Babel.
3. It traverses all string literals and template literals (without expressions).
4. If the pattern matches, it splits each matched substring in half and inserts the separator.
5. The original string literal is replaced with a call to `.replace()` that removes the separator globally.
6. The modified AST is generated back to code and saved to the output file.

## License

MIT © [Albert Bazaleev aka supercat1337](https://github.com/supercat1337)
