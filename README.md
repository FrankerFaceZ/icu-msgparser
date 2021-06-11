# @ffz/icu-msgparser

[![NPM Version](https://img.shields.io/npm/v/@ffz/icu-msgparser.svg?style=flat)](https://npmjs.org/package/@ffz/icu-msgparser)
[![Build Status](https://img.shields.io/circleci/project/github/FrankerFaceZ/icu-msgparser.svg?style=flat)](https://circleci.com/gh/frankerfacez/icu-msgparser)
[![Dependency Status](https://img.shields.io/david/frankerfacez/icu-msgparser.svg?style=flat)](https://david-dm.org/frankerfacez/icu-msgparser)
[![Test Coverage](https://coveralls.io/repos/github/FrankerFaceZ/icu-msgparser/badge.svg?branch=master)](https://coveralls.io/github/FrankerFaceZ/icu-msgparser?branch=master)

A simple JavaScript parser for the [ICU Message Format](http://userguide.icu-project.org/formatparse/messages).

-   Under 2 Kilobytes, Minified and Gzipped
-   Decently Fast
-   Only does what it needs to.


## Include the Thing

```javascript
import Parser from '@ffz/icu-msgparser';
```


## Do the Stuff

```javascript
const parser = new Parser(),
    ast = parser.parse(`Hello, <b>{name}</b>! You have {messages, plural,
    =0 {no messages}
    one {one message}
    other {# messages}
} and you're {completion, number, percentage} done.`);
```


## Get the AST

```javascript
[
    "Hello, ",
    {
        "n": "b",
        "c": [
            {"v": "name"}
        ]
    },
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

```typescript
type ast = node[];
type node = string | placeholder;

type placeholder = tag | variable;

type tag = {
    n: string;
    c?: ast;
};

type variable = {
    v: string;
    t?: string;
    f?: string | number;
    o?: submessages;
}

type submessages = {
    [rule: string]: ast;
};
```

Strings are just strings.

Placeholders can be tags or variables.

All tags will have a `n`, or name, which tells the interpreter what tag
handler to use for them. `c`, or children, is only included for a tag with
contents.

All variables will have a `v`, or value, which tells the interpreter what
value to use for them. `t`, or type, is only included for variables with
types given. This would be `plural`, `number`, etc.

`f` is the optionally provided format. For `plural`, `selectordinal`, as well
as any custom types that use offset numbers, `f` will be the offset number
if provided.

Finally, `o` is an object with containing all the parsed sub-messages for a
variables with sub-messages.


## Know the API

```javascript
const parser = new Parser(/* options: */ {
    // Symbols (Single Character Only)
    OPEN: '{',
    CLOSE: '}',
    SEP: ',',
    ESCAPE: "'",
    SUB_VAR: '#',
    TAG_OPEN: '<',
    TAG_CLOSE: '>',
    TAG_CLOSING: '/',

    // Offset
    OFFSET: 'offset:',

    // Types that support offset:
    subnumeric_types: ['plural', 'selectordinal'],

    // Types that support sub-messages:
    submessage_types: ['plural', 'selectordinal', 'select'],

    // Config Flags
    allowTags: true
});

const ast = parser.parse(message);
```


## Make Sure It Still Works

Run tests using `npm test`.


## Contribute the Stuff

Please submit all issues and pull requests to the [FrankerFaceZ/icu-msgparser](https://github.com/frankerfacez/icu-msgparser) repository.
