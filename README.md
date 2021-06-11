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


## Parse the Stuff...

```javascript
const parser = new Parser(),
    ast = parser.parse(`Hello, <b>{name}</b>! You have {messages, plural,
    =0 {no messages}
    one {one message}
    other {# messages}
} and you're {completion, number, percentage} done.`);

ast === [
    "Hello, ",
    {
        n: "b",
        c: [
            {v: "name"}
        ]
    },
    "! You have ",
    {
        v: "messages",
        t: "plural",
        o: {
            "=0": ["no messages"],
            one: ["one message"],
            other: [
                {v: "messages", t: "number"},
                " messages"
            ]
        }
    },
    " and you're ",
    {
        v: "completion",
        t: "number",
        f: "percentage"
    },
    " done."
]
```


## Make Mistakes?

```javascript
> parser.parse('Hello, {name{!');
SyntaxError: expected , or } at position 12 but found {
```


## Interpret the AST

```typescript
// ASTs are a simple array of strings and placeholder objects.
type MessageAST = MessageNode[];
type MessageNode = string | MessagePlaceholder;

// Placeholder objects are either tags or variables.
type MessagePlaceholder = MessageTag | MessageVariable;


type MessageTag = {
    // The name of the tag. For `<link>` this would be `link`.
    n: string;

    // If the tag has children, the child AST will be stored in this
    // variable. Otherwise, it will be undefined.
    c?: MessageAST;
};


type MessageVariable = {
    // n is never defined on variables and can be used to discriminate
    // between variables and tags.
    n: undefined;

    // The name of the variable. For `{count,number}` this would be `count`.
    v: string;

    // The type of the variable, if a type is included. Given the example
    // `{count,number}` this would be `number`.
    t?: string;

    // The format of the variable, if a format is included. Given the example
    // `{count,number,::currency/USD}` this would be `::currency/USD`.
    // For subnumeric types, this will be the `offset:` if one was provided
    // and the type will be a number.
    f?: string | number;

    // For submessage types, this will contain all of the separate submessage
    // ASTs, with their rules as unprocessed strings.
    o?: MessageSubmessages;
}

type MessageSubmessages = {
    [rule: string]: MessageAST;
};
```

Strings are just strings.

Placeholders can be tags or variables.

All tags will have a `n`, or name, which tells the interpreter what tag
handler to use for them. `c`, or children/content, is only included for a tag with
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
    allowTags: true,
    requireOther: true,
    // or
    requireOther: ['select']
});

const ast = parser.parse(message);
```

Tags can be completely disabled by setting `allowTags` to `false`.

By default, types with submessages are required to have an `other` type. You
can set `requireOther` to `false` to disable this behavior entirely, or set
it to an array of specific types that should require `other` while all other
types should not.


## Make Sure It Still Works

Run tests using `npm test`.


## Contribute the Stuff

Please submit all issues and pull requests to the [FrankerFaceZ/icu-msgparser](https://github.com/frankerfacez/icu-msgparser) repository.
