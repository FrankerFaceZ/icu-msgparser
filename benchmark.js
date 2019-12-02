#!/usr/bin/env node
'use strict';

/*

This benchmark has been copied from the intl-messageformat-parser project
for the purpose of comparing performance between two similar libraries.

While the code below has been slightly reformatted, and changed to import
our own parser rather than intl-messageformat-parser, it still strongly
resembles the code of intl-messageformat-parser's benchmark script.

intl-messageformat-parser is copyright 2019 Oath Inc. and licensed under
the New BSD License. For more, please see the original source at:

https://github.com/formatjs/formatjs/tree/master/packages/intl-messageformat-parser

*/

/* eslint-disable no-console */
/* globals console */

const benchmark = require('benchmark');
const Parser = require('./lib/parser'),
	parser = new Parser;

const complex_msg = `
{gender_of_host, select,
	female {
		{num_guests, plural, offset:1
			=0 {{host} does not give a party.}
			=1 {{host} invites {guest} to her party.}
			=2 {{host} invites {guest} and one other person to her party.}
			other {{host} invites {guest} and # other people to her party.}
		}
	}
	male {
		{num_guests, plural, offset:1
			=0 {{host} does not give a party.}
			=1 {{host} invites {guest} to his party.}
			=2 {{host} invites {guest} and one other person to his party.}
			other {{host} invites {guest} and # other people to his party.}
		}
	}
	other {
		{num_guests, plural, offset:1
			=0 {{host} does not give a party.}
			=1 {{host} invites {guest} to their party.}
			=2 {{host} invites {guest} and one other person to their party.}
			other {{host} invites {guest} and # other people to their party.}
		}
	}
}
`;

const normal_msg = `Yo, {firstName} {lastName} has {numBooks, number, integer} {numBooks, plural, one {book} other {books}}.`;
const simple_msg = `Hello, {name}!`;
const string_msg = `Hello, world!`;

console.log('complex_msg AST length', JSON.stringify(parser.parse(complex_msg)).length)
console.log('normal_msg AST length', JSON.stringify(parser.parse(normal_msg)).length)
console.log('simple_msg AST length', JSON.stringify(parser.parse(simple_msg)).length)
console.log('string_msg AST length', JSON.stringify(parser.parse(string_msg)).length)

new benchmark.Suite()
	.add('complex_msg', () => parser.parse(complex_msg))
	.add('normal_msg', () => parser.parse(normal_msg))
	.add('simple_msg', () => parser.parse(simple_msg))
	.add('string_msg', () => parser.parse(string_msg))
	.on('cycle', event => console.log(String(event.target)))
	.run();
