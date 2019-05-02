'use strict';

const SPACE = /\s/;

const Parser = exports = module.exports = function Parser(options) {
	if ( ! (this instanceof Parser) )
		return new Parser(options);

	this.opts = Object.assign({
		OPEN: '{',
		CLOSE: '}',
		SEP: ',',
		SUB_VAR: '#',
		ESCAPE: "'",
		OFFSET: 'offset:',

		subnumeric_types: ['plural', 'selectordinal'],
		submessage_types: ['plural', 'selectordinal', 'select']
	}, options)
}

Parser.prototype.parse = function(msg) {
	return this.parseAST({msg: String(msg), i: 0}, null);
}

Parser.prototype.parseAST = function(context, parent) {
	const msg = context.msg,
		length = msg.length,
		special_hash = parent && this.opts.subnumeric_types.includes(parent.t),
		out = [];

	while ( context.i < length ) {
		const start = context.i,
			char = msg[start];

		if ( char === this.opts.CLOSE ) {
			if ( ! parent )
				throw unexpected(char, context.i);
			break;

		} else if ( char === this.opts.OPEN || (special_hash && char === this.opts.SUB_VAR) ) {
			const element = this.parseElement(context, parent);
			if ( element )
				out.push(element);

		} else {
			const text = this.parseText(context, parent);
			if ( text )
				out.push(text);
		}

		// Infinite Loop Protection
		if ( context.i === start )
			throw unexpected(char, context.i);
	}

	return out;
}

Parser.prototype.parseText = function(context, parent, include_separator = true, include_space = true) {
	const msg = context.msg,
		length = msg.length,
		special_hash = parent && this.opts.subnumeric_types.includes(parent.t);

	let out = '';

	while ( context.i < length ) {
		const char = msg[context.i];
		if ( char === this.opts.OPEN ||
				char === this.opts.CLOSE ||
				(!include_separator && char === this.opts.SEP) ||
				(!include_space && SPACE.test(char)) ||
				(special_hash && char === this.opts.SUB_VAR) )
			break;

		if ( char === this.opts.ESCAPE ) {
			let next = msg[++context.i];
			if ( next === this.opts.ESCAPE ) {
				// Escaped Escape Character
				out += next;
				context.i++;
			} else if ( next === this.opts.OPEN || next === this.opts.CLOSE || (special_hash && next === this.opts.SUB_VAR) || ! include_space || ! include_separator ) {
				// Special Character
				out += next;
				while( ++context.i < length ) {
					next = msg[context.i];
					if ( next === this.opts.ESCAPE ) {
						// Check for an escaped escape character, and don't
						// stop if we encounter one.
						next = msg[context.i + 1];
						if ( next === this.opts.ESCAPE ) {
							out += next;
							context.i++;
						} else {
							context.i++;
							break;
						}
					} else
						out += next;
				}
			} else
				out += char;

		} else {
			context.i++;
			out += char;
		}
	}

	return out;
}

Parser.prototype.parseElement = function(context, parent) {
	const msg = context.msg,
		special_hash = parent && this.opts.subnumeric_types.includes(parent.t);

	let char = msg[context.i];

	if ( special_hash && char === this.opts.SUB_VAR ) {
		context.i++;
		return {v: parent.v}
	}

	if ( char !== this.opts.OPEN )
		throw expected(this.opts.OPEN, char, context.i);

	context.i++;
	skipSpace(context);

	// ID
	const id = this.parseText(context, null, false, false);
	if ( ! id )
		throw expected('placeholder id', char, context.i);

	const out = {v: id};

	skipSpace(context);

	char = msg[context.i];
	if ( char === this.opts.CLOSE ) {
		context.i++;
		return out;

	} else if ( char !== this.opts.SEP )
		throw expected(`${this.opts.SEP} or ${this.opts.CLOSE}`, char, context.i);

	context.i++;
	skipSpace(context);

	// Type
	const type = this.parseText(context, null, false, false);
	if ( ! type )
		throw expected('type', context);

	out.t = type;
	skipSpace(context);

	char = msg[context.i];
	if ( char === this.opts.CLOSE ) {
		if ( this.opts.submessage_types.includes(out.t) )
			throw expected('sub-messages', context);

		context.i++;
		return out;

	} else if ( char !== this.opts.SEP )
		throw expected(`${this.opts.SEP} or ${this.opts.CLOSE}`, char, context.i);

	context.i++;
	skipSpace(context);

	// Formatting
	if ( this.opts.subnumeric_types.includes(out.t) ) {
		const offset = this.parseOffset(context);
		if ( offset ) {
			out.f = offset;
			skipSpace(context);
		}
	}

	if ( this.opts.submessage_types.includes(out.t) ) {
		const submessages = this.parseSubmessages(context, out);
		if ( ! submessages.other )
			throw expected('other sub-message', context);

		out.o = submessages;

	} else {
		const format = this.parseText(context, null, true, true);
		if ( ! format )
			throw expected('format', context);

		// Since we allow spaces mid-format, we should trim any
		// remaining spaces off the end.
		out.f = format.trimRight();
	}

	skipSpace(context);
	char = msg[context.i];
	if ( char !== this.opts.CLOSE )
		throw expected(this.opts.CLOSE, char, context.i);

	context.i++;
	return out;
}


Parser.prototype.parseSubmessages = function(context, parent) {
	const msg = context.msg,
		length = msg.length,
		out = {};

	while(context.i < length ) {
		const char = msg[context.i];
		if ( char === this.opts.CLOSE )
			break;

		const selector = this.parseText(context, null, true, false);
		if ( ! selector )
			throw expected('sub-message selector', context);

		skipSpace(context);
		out[selector] = this.parseSubmessage(context, parent);
		skipSpace(context);
	}

	return out;
}


Parser.prototype.parseSubmessage = function(context, parent) {
	const msg = context.msg;

	if ( msg[context.i] !== this.opts.OPEN )
		throw expected(this.opts.OPEN, context);

	context.i++;
	const out = this.parseAST(context, parent);

	if ( msg[context.i] !== this.opts.CLOSE )
		throw expected(this.opts.CLOSE, context);

	context.i++;
	return out;
}


Parser.prototype.parseOffset = function(context) {
	const msg = context.msg,
		OFFSET = this.opts.OFFSET,
		length = msg.length;

	if ( msg.slice(context.i, context.i + OFFSET.length) !== OFFSET )
		return;

	context.i += OFFSET.length;
	skipSpace(context);

	const start = context.i;
	while(context.i < length && /\d/.test(msg[context.i]))
		context.i++;

	if ( start === context.i )
		throw expected('number', context);

	return +msg.slice(start, context.i);
}


function expected(char, found, index) {
	if ( typeof found === 'object' ) {
		index = found.i;
		found = found.msg[index];
	}

	return new SyntaxError(`expected ${char} at position ${index} but found ${found || 'eof'}`);
}

function unexpected(char, index) {
	return new SyntaxError(`unexpected ${char} at position ${index}`)
}

function skipSpace(context) {
	const msg = context.msg,
		length = msg.length;

	while ( context.i < length && SPACE.test(msg[context.i]) )
		context.i++;
}
