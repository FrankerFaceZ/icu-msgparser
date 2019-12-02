# @ffz/icu-msgparser

[![NPM Version](https://img.shields.io/npm/v/@ffz/icu-msgparser.svg?style=flat)](https://npmjs.org/package/@ffz/icu-msgparser)
[![Build Status](https://img.shields.io/circleci/project/github/FrankerFaceZ/icu-msgparser.svg?style=flat)](https://circleci.com/gh/frankerfacez/icu-msgparser)
[![Dependency Status](https://img.shields.io/david/frankerfacez/icu-msgparser.svg?style=flat)](https://david-dm.org/frankerfacez/icu-msgparser)
[![Test Coverage](https://coveralls.io/repos/github/FrankerFaceZ/icu-msgparser/badge.svg?branch=master)](https://coveralls.io/github/FrankerFaceZ/icu-msgparser?branch=master)

A simple JavaScript parser for the [ICU Message Format](http://userguide.icu-project.org/formatparse/messages).

-   Approximately 6,500 Bytes Uncompressed
-   1 Kilobyte, Minified and Gzipped
-   Decently Fast
-   Only does what it needs to.
-   No really, this doesn't include anything weird like XML tags or non-standard
    escaping or free piña coladas.


## Include the Thing

```javascript
import Parser from '@ffz/icu-msgparser';
```


## Do the Stuff

```javascript
const parser = new Parser(),
    ast = parser.parse(`Hello, {name}! You have {messages, plural,
    =0 {no messages}
    one {one message}
    other {# messages}
} and you're {completion, number, percentage} done.`);
```


## Get the AST

```javascript
[
    "Hello, ",
    {"v": "name"},
    "! You have ",
    {
        "v": "messages",
        "t": "plural",
        "o": {
            "=0": ["no messages"],
            "one": ["one message"],
            "other": [
                {"v": "messages"},
                " messages"
            ]
        }
    },
    " and you're ",
    {
        "v": "completion",
        "t": "number",
        "f": "percentage"
    },
    " done."
]
```


## Make the Oops?

```javascript
> parser.parse('Hello, {name{!');
SyntaxError: expected , or } at position 12 but found {
```


## Interpret the AST

```
ast = node[]
node = string | placeholder

placeholder = {
    v: string,
    t: ?string,
    f: ?string | ?number,
    o: ?submessages
}

submessages = {
    [string]: ast
}
```

All placeholders will have a `v`, or value, which tells the interpreter what
value to use for them. `t`, or type, is only included for placeholders with
types given. This would be `plural`, `number`, etc.

`f` is the optionally provided format. For `plural`, `selectordinal`, as well
as any custom types that use offset numbers, `f` will be the offset number
if provided.

Finally, `o` is an object with containing all the parsed sub-messages for a
placeholder with sub-messages.


## Know the API

```javascript
const parser = new Parser(/* options: */ {
    // Symbols (Single Character Only)
    OPEN: '{',
    CLOSE: '}',
    SEP: ',',
    ESCAPE: "'",
    SUB_VAR: '#',

    // Offset
    OFFSET: 'offset:',

    // Types that support offset:
    subnumeric_types: ['plural', 'selectordinal'],

    // Types that support sub-messages:
    submessage_types: ['plural', 'selectordinal', 'select']
});

const ast = parser.parse(message);
```


## Make Sure It Still Works

Run tests using `npm test`.


## Do Stuff Quick

We now include a benchmark taken from `intl-messageformat-parser` for the
purpose of comparing performance. Please note that, while performing
essentially the same task, `intl-messageformat-parser` produces an AST
with a different syntax than this project. The `intl-messageformat-parser`
project also has special handling for custom date format strings while
this project intends for custom format strings to be handled by whichever
library is responsible for consuming the AST.

Run the benchmark yourself with `npm run benchmark`.

Results when run on an i7-4770k running at 3.5 GHz with 24GB of DDR3-1600:

```
> @ffz/icu-msgparser@1.0.2 benchmark
> node ./benchmark.js

complex_msg AST length 1166
normal_msg AST length 176
simple_msg AST length 28
string_msg AST length 17
complex_msg x 26,836 ops/sec ±1.89% (89 runs sampled)
normal_msg x 193,392 ops/sec ±0.96% (92 runs sampled)
simple_msg x 2,185,362 ops/sec ±1.09% (92 runs sampled)
string_msg x 4,394,321 ops/sec ±1.42% (93 runs sampled)
```

In comparison, the following are results taken from the same machine
benchmarking `intl-messageformat-parser`:

```
> intl-messageformat-parser@3.5.0 benchmark
> node ./benchmark.js

complex_msg AST length 2176
normal_msg AST length 400
simple_msg AST length 79
string_msg AST length 36
complex_msg x 4,191 ops/sec ±1.65% (90 runs sampled)
normal_msg x 35,364 ops/sec ±1.31% (89 runs sampled)
simple_msg x 171,065 ops/sec ±0.54% (94 runs sampled)
string_msg x 187,480 ops/sec ±0.52% (92 runs sampled)
```


## Contribute the Stuff

Please submit all issues and pull requests to the [FrankerFaceZ/icu-msgparser](https://github.com/frankerfacez/icu-msgparser) repository.
