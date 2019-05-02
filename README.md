# @ffz/icu-msgparser

[![NPM Version](https://img.shields.io/npm/v/@ffz/icu-msgparser.svg?style=flat)](https://npmjs.org/package/@ffz/icu-msgparser)
[![Dependency Status](https://img.shields.io/circleci/project/github/FrankerFaceZ/icu-msgparser.svg?style=flat)](https://circleci.com/gh/frankerfacez/icu-msgparser)

A simple JavaScript parser for the [ICU Message Format](http://userguide.icu-project.org/formatparse/messages).

-   6 Kilobytes
-   1 Kilobyte, Minified and Gzipped

## Include

```javascript
import Parser from '@ffz/icu-msgparser';
```

## Do Stuff

```javascript
const parser = new Parser(),
    ast = parser.parse(`Hello, {name}! You have {messages, plural,
    =0 {no messages}
    one {one message}
    other {# messages}
}.`);
```

## Get AST

```javascript
[
    "Hello, ",
    {v: "name"},
    "! You have ",
    {
        t: "plural",
        v: "messages",
        o: {
            "=0": ["no messages"],
            "one": ["one message"],
            "other": [
                {v: "messages"},
                " messages"
            ]
        }
    }
]
```

## Tests

Run tests using `npm test`.

## Contributions and Support

Please submit all issues and pull requests to the [FrankerFaceZ/icu-msgparser](https://github.com/frankerfacez/icu-msgparser) repository.
