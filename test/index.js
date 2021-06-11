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
				OPEN: '(',
				CLOSE: ')'
			});
			expect(thing.parse('Hello, (name)!')).to.deep.equal([
				'Hello, ',
				{v: 'name'},
				'!'
			]);
		});

		it('does not allow multi-character options', function() {
			expect(() => Parser({OPEN: '{{', CLOSE: '}}'})).to.throw();
		});

		it('does not allow matching options', function() {
			expect(() => Parser({OPEN: '<'})).to.throw();
		})
	});

	describe('parse()', function() {
		it('accepts strings', function() {
			const msg = 'This is a test.';
			expect(parse(msg)).to.deep.equal([msg]);
		})

		it('accepts unicode', function() {
			const msg = '中文';
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

		it('requires other', function() {
			expect(() => parse('{test,plural,one{}}')).to.throw(SyntaxError, 'expected other sub-message');
		});

		it('sometimes requires other', function() {
			const thing = Parser({requireOther: ['select']});

			expect(thing.parse('{test,plural,one{}}')).to.deep.equal([
				{
					v: 'test',
					t: 'plural',
					o: {
						'one': []
					}
				}
			]);

			expect(() => thing.parse('{test,select,one{}}')).to.throw(SyntaxError, 'expected other sub-message');

			expect(Parser({requireOther: false}).parse('{test,plural,one{}}')).to.deep.equal([
				{
					v: 'test',
					t: 'plural',
					o: {
						'one': []
					}
				}
			]);
		});

		it('parses plural tags', function() {
			expect(parse('{test, plural, one{one test} other {# test} }')).to.deep.equal([
				{
					v: 'test',
					t: 'plural',
					o: {
						'one': ['one test'],
						'other': [{v: 'test', t: 'number'}, ' test']
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
						'other': [{v: 'test', t: 'number'}, ' test']
					}
				}
			])
		})

		it('parses plural with =', function() {
			expect(parse('{test, plural, =0{none} other {# test} }')).to.deep.equal([
				{
					v: 'test',
					t: 'plural',
					o: {
						'=0': ['none'],
						'other': [{v: 'test', t: 'number'}, ' test']
					}
				}
			])
		})

		it('parses plural with negative offset', function() {
			expect(parse('{test, plural, offset:-3 =-2{thingy} other {# test} }')).to.deep.equal([
				{
					v: 'test',
					t: 'plural',
					f: -3,
					o: {
						'=-2': ['thingy'],
						'other': [{v: 'test', t: 'number'}, ' test']
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
						'other': [{v: 'test', t: 'number'}, ' test']
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
			expect(parse("So, '{Mike''s Test}' is real.")).to.deep.equal([
				"So, {Mike's Test} is real."
			])

			expect(parse("You've done it now, {name}.")).to.deep.equal([
				"You've done it now, ",
				{v: 'name'},
				'.'
			])
		})

		it('treats unicode chars as whitespace', function() {
			expect(parse(`{gender, select,
			\u202Fmale {{He}}
			\u205Ffemale {{She}}
			\u2008other{{They}}}`)).to.deep.equal([
				{
					v: 'gender',
					t: 'select',
					o: {
						male: [{v: 'He'}],
						female: [{v: 'She'}],
						other: [{v: 'They'}]
					}
				}
			])
		})

		it('throws on empty variable', function() {
			expect(() => parse('{}')).to.throw(SyntaxError, 'expected placeholder id')
		})

		it('ignores extra closing brace', function() {
			expect(parse('}')).to.deep.equal(['}'])
		})

		it('throws on unclosed variable', function() {
			expect(() => parse('{n')).to.throw(SyntaxError, 'expected , or }')
			expect(() => parse('{n,number')).to.throw(SyntaxError, 'expected , or }')
			expect(() => parse('{n,number,short')).to.throw(SyntaxError, 'expected }')
			expect(() => parse('({n,plural,other{# test}')).to.throw(SyntaxError, 'expected }');
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

		it('parses tags', function() {
			expect(parse('<b>hi</b>')).to.deep.equal([
				{
					n: 'b',
					c: ['hi']
				}
			]);
		})

		it('allows a single solitary tag_open', function() {
			expect(parse('hi <')).to.deep.equal(['hi <'])
		})

		it('parses self-closing tags', function() {
			expect(parse('hi <user-tag />!')).to.deep.equal([
				'hi ',
				{n: 'user-tag'},
				'!'
			])
		})

		it('parses empty tags', function() {
			expect(parse('hi <user-tag></user-tag>!')).to.deep.equal([
				'hi ',
				{n: 'user-tag'},
				'!'
			])
		})

		it('requires closing tags', function() {
			expect(() => parse('<b>hi there')).to.throw(SyntaxError, 'expected closing tag');
		});

		it('rejects weird closing tags', function() {
			expect(() => parse('<b>hi</b/>')).to.throw(SyntaxError, 'expected >')
		});

		it('allows tag characters', function() {
			expect(parse('i <3 you>')).to.deep.equal([
				'i <3 you>',
			]);
		})

		it('allows spaces in tags', function() {
			expect(parse('<3 >Hi</3>')).to.deep.equal([
				{
					n: '3',
					c: ['Hi']
				}
			])
		})

		it('parses nested tags', function() {
			expect(parse('<b><i>hi</i></b>')).to.deep.equal([
				{
					n: 'b',
					c: [
						{
							n: 'i',
							c: ['hi']
						}
					]
				}
			])
		})

		it('rejects unexpected closing tags', function() {
			expect(() => parse('hi</b>')).to.throw(SyntaxError, 'unexpected /')
		})

		it('allows quotes in tag names', function() {
			expect(parse("<'/b' />")).to.deep.equal([
				{
					n: '/b'
				}
			])
		})

		it('rejects invalid nested tags', function() {
			expect(() => parse('<b><i>hi</b></i>')).to.throw(SyntaxError, 'tag mismatch')
		})

		it('escapes tags', function() {
			expect(parse("'<notATag>hello</notATag>'")).to.deep.equal([
				'<notATag>hello</notATag>'
			])
		})

		it('parses stuff inside tags', function() {
			expect(parse('Our price is <boldThis>{price, number, ::currency/USD precision-integer}</boldThis> with <link>{pct, number, ::percent} discount</link>')).to.deep.equal([
				'Our price is ',
				{
					n: 'boldThis',
					c: [
						{
							v: 'price',
							t: 'number',
							f: '::currency/USD precision-integer'
						}
					]
				},
				' with ',
				{
					n: 'link',
					c: [
						{
							v: 'pct',
							t: 'number',
							f: '::percent'
						},
						' discount'
					]
				}
			])
		})

		it('works without tags', function() {
			const thing = Parser({allowTags: false});
			expect(thing.parse('<b>hi</b>')).to.deep.equal(['<b>hi</b>']);
		})
	});

});
