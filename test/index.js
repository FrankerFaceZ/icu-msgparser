'use strict';

const Chai = require('chai');
const expect = Chai.expect;

const Parser = require('../lib/parser'),
	parser = new Parser,
	parse = parser.parse.bind(parser);

describe('Parser', function() {

	describe('init', function() {

		it('constructs a parser', function() {
			const thing = new Parser();
			expect(thing).to.be.an.instanceof(Parser);
		});

		it('constructs without new', function() {
			const thing = Parser();
			expect(thing).to.be.an.instanceof(Parser);
		});

		it('takes options', function() {
			const thing = Parser({
				VAR_OPEN: '<',
				VAR_CLOSE: '>'
			});
			expect(thing.parse('Hello, <name>!')).to.deep.equal([
				'Hello, ',
				{v: 'name'},
				'!'
			]);
		})

	});

	describe('parse()', function() {
		it('accepts strings', function() {
			const msg = 'This is a test.';
			expect(parse(msg)).to.deep.equal([msg]);
		})

		it('coerces input to string', function() {
			expect(parse()).to.deep.equal(['undefined']);
			expect(parse(null)).to.deep.equal(['null']);
			expect(parse(12.34)).to.deep.equal(['12.34']);
		})

		it('parses variables', function() {
			expect(parse('This is a {test}.')).to.deep.equal([
				'This is a ',
				{v: 'test'},
				'.'
			])
		})

		it('parses vars with types', function() {
			expect(parse('{test, number}')).to.deep.equal([
				{v: 'test', t: 'number'}
			])
		})

		it('parses vars with type and format', function() {
			expect(parse('{ test,    number, percent }')).to.deep.equal([
				{v: 'test', t: 'number', f: 'percent'}
			])
		})

		it('parses plural tags', function() {
			expect(parse('{test, plural, one{one test} other {# test} }')).to.deep.equal([
				{
					v: 'test',
					t: 'plural',
					o: {
						'one': ['one test'],
						'other': [{v: 'test'}, ' test']
					}
				}
			])
		})

		it('parses plural with offset', function() {
			expect(parse('{test, plural, offset:3 one{one test} other {# test} }')).to.deep.equal([
				{
					v: 'test',
					t: 'plural',
					f: 3,
					o: {
						'one': ['one test'],
						'other': [{v: 'test'}, ' test']
					}
				}
			])
		})

		it('parses selectordinal', function() {
			expect(parse('{test, selectordinal, one{one test} other {# test} }')).to.deep.equal([
				{
					v: 'test',
					t: 'selectordinal',
					o: {
						'one': ['one test'],
						'other': [{v: 'test'}, ' test']
					}
				}
			])
		})

		it('parses select', function() {
			expect(parse('{test, select, first {yes} second {false} other {maybe}}')).to.deep.equal([
				{
					v: 'test',
					t: 'select',
					o: {
						'first': ['yes'],
						'second': ['false'],
						'other': ['maybe']
					}
				}
			])
		})

		it('escapes characters', function() {
			expect(parse('{0} {1} {2}')).to.deep.equal([
				{v: '0'}, ' ', {v: '1'}, ' ', {v: '2'}
			]);
			expect(parse("{0} '{1}' {2}")).to.deep.equal([
				{v: '0'}, ' {1} ', {v: '2'}
			]);
			expect(parse("{0} ''{1}'' {2}")).to.deep.equal([
				{v: '0'}, " '", {v: '1'}, "' ", {v: '2'}
			]);
			expect(parse("{0} '''{1}''' {2}")).to.deep.equal([
				{v: '0'}, " '{1}' ", {v: '2'}
			]);
			expect(parse("{0} '{1} {2}")).to.deep.equal([
				{v: '0'}, ' {1} {2}'
			]);
			expect(parse("{0} ''{1} {2}")).to.deep.equal([
				{v: '0'}, " '", {v: '1'}, ' ', {v: '2'}
			]);
		})

		it('does not escape sometimes', function() {
			expect(parse("You've done it now, {name}.")).to.deep.equal([
				"You've done it now, ",
				{v: 'name'},
				'.'
			])
		})

		it('throws on empty variable', function() {
			expect(() => parse('{}')).to.throw(SyntaxError, 'expected placeholder id')
		})

		it('throws on extra closing brace', function() {
			expect(() => parse('}')).to.throw(SyntaxError, 'unexpected }')
		})

		it('throws on unclosed variable', function() {
			expect(() => parse('{n')).to.throw(SyntaxError, 'expected , or }')
		})

		it('throws on open brace in variable', function() {
			expect(() => parse('{n{')).to.throw(SyntaxError, 'expected , or }');
			expect(() => parse('{n,{')).to.throw(SyntaxError, 'expected type');
			expect(() => parse('{n,n{')).to.throw(SyntaxError, 'expected , or }');
			expect(() => parse('{n,n,{')).to.throw(SyntaxError, 'expected format');
		})

		it('throws on missing type', function() {
			expect(() => parse('{n,}')).to.throw(SyntaxError, 'expected type');
		})

		it('throws on missing format', function() {
			expect(() => parse('{n,n,}')).to.throw(SyntaxError, 'expected format');
		})

		it('throws on missing sub-messages', function() {
			expect(() => parse('{n,select}')).to.throw(SyntaxError, 'expected sub-messages');
			expect(() => parse('{n,selectordinal}')).to.throw(SyntaxError, 'expected sub-messages');
			expect(() => parse('{n,plural}')).to.throw(SyntaxError, 'expected sub-messages');
		})

		it('throws on bad sub-messages', function() {
			expect(() => parse('{n,select,this thing}')).to.throw(SyntaxError, 'expected {')
			expect(() => parse('{n,select,this {thing')).to.throw(SyntaxError, 'expected }')
		})

		it('throws on missing other sub-message', function() {
			expect(() => parse('{n,select,=0 {test}}')).to.throw(SyntaxError, 'expected other sub-message');
			expect(() => parse('{n,selectordinal,=0 {test}}')).to.throw(SyntaxError, 'expected other sub-message');
			expect(() => parse('{n,plural,=0 {test}}')).to.throw(SyntaxError, 'expected other sub-message');
		})

		it('throws on missing sub-message selector', function() {
			expect(() => parse('{n,select,{n}')).to.throw(SyntaxError, 'expected sub-message selector');
			expect(() => parse('{n,selectordinal,{n}')).to.throw(SyntaxError, 'expected sub-message selector');
			expect(() => parse('{n,plural,{n}')).to.throw(SyntaxError, 'expected sub-message selector');
		})

		it('throws on missing offset number', function() {
			expect(() => parse('{n,plural,offset: other{n}')).to.throw(SyntaxError, 'expected number');
		})
	});

});
