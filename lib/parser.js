'use strict';

const SPACE = /\s/,
	SYMBOLS = {
		OPEN: '{',
		CLOSE: '}',
		TAG_OPEN: '<',
		TAG_CLOSE: '>',
		TAG_CLOSING: '/',
		SEP: ',',
		SUB_VAR: '#',
		ESCAPE: "'"
	},
	SUBNUM = 'subnumeric_types',
	SUBMSG = 'submessage_types',
	KEYS = Object.keys(SYMBOLS),
	CLOSE_TAG = Symbol('C');

const Parser = exports = module.exports = function Parser(options) {
		if ( ! (this instanceof Parser) )
			return new Parser(options);

		this.opts = Object.assign({
			OFFSET: 'offset:',
			[SUBNUM]: ['plural', 'selectordinal'],
			[SUBMSG]: ['plural', 'selectordinal', 'select'],
			allowTags: true
		}, SYMBOLS, options);

		for(let i=0; i < KEYS.length; i++) {
			const key = KEYS[i],
				val = this.opts[key];
			if ( typeof val !== 'string' || val.length !== 1 )
				throw new Error(`Option ${key} must be a 1-length string`);
			for(let j=i+1; j < KEYS.length; j++) {
				const k2 = KEYS[j];
				if ( this.opts[k2] === val )
					throw new Error(`Option ${key} and ${k2} cannot match`);
			}
		}
	},
	p = Parser.prototype;

p.parse = function(msg) {
	return this.parseAST({msg: String(msg), i: 0}, null);
}

p.parseAST = function(context, parent) {
	const msg = context.msg,
		opts = this.opts,
		length = msg.length,
		special_hash = parent && opts[SUBNUM].includes(parent.t),
		out = [];

	while ( context.i < length ) {
		const start = context.i,
			char = msg[start];

		if ( char === opts.CLOSE ) {
			if ( ! parent ) {
				mergePush(out, '}')
				context.i++;
			} else
				break;

		} else if ( char === opts.OPEN || (special_hash && char === opts.SUB_VAR) ) {
			mergePush(out, this.parseElement(context, parent));

		} else if ( opts.allowTags && char === opts.TAG_OPEN && ! SPACE.test(msg[start+1]) ) {
			const element = this.parseTag(context, parent);
			if ( element === CLOSE_TAG ) {
				parent.closed = true;
				break;
			} else
				mergePush(out, element);

		} else
			mergePush(out, this.parseText(context, parent));

		// Infinite Loop Protection
		// This should never be triggered.
		/* istanbul ignore if */
		if ( context.i === start )
			throw unexpected(char, context.i);
	}

	return out;
}

p.parseText = function(context, parent, include_separator = true, include_space = true, include_tags = false) {
	const msg = context.msg,
		opts = this.opts,
		tags = opts.allowTags,
		length = msg.length,
		special_hash = parent && opts[SUBNUM].includes(parent.t);

	let out = '';

	while ( context.i < length ) {
		const char = msg[context.i];
		if ( char === opts.OPEN ||
				char === opts.CLOSE ||
				(tags && (char === opts.TAG_OPEN || (include_tags && (char === opts.TAG_CLOSE || char === opts.TAG_CLOSING)))) ||
				(!include_separator && char === opts.SEP) ||
				(!include_space && SPACE.test(char)) ||
				(special_hash && char === opts.SUB_VAR) )
			break;

		if ( char === opts.ESCAPE ) {
			let next = msg[++context.i];
			if ( next === opts.ESCAPE ) {
				// Escaped Escape Character
				out += next;
				context.i++;
			} else if (
				next === opts.OPEN ||
				next === opts.CLOSE ||
				(tags && (next === opts.TAG_OPEN || (include_tags && (next === opts.TAG_CLOSE || next === opts.TAG_CLOSING)))) ||
				(special_hash && next === opts.SUB_VAR) ||
				! include_space || ! include_separator
			) {
				// Special Character
				// Tags are only special when they're enabled.
				// Tag endings are only special inside open tags.
				// SUB_VAR is only special inside submessages.
				// Spaces and separators are only special inside placeholders.
				out += next;
				while( ++context.i < length ) {
					next = msg[context.i];
					if ( next === opts.ESCAPE ) {
						// Check for an escaped escape character, and don't
						// stop if we encounter one.
						next = msg[context.i + 1];
						if ( next === opts.ESCAPE ) {
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

p.parseTag = function(context, parent) {
	const msg = context.msg,
		start = context.i,
		opts = this.opts;

	context.i++;
	let char = msg[context.i];

	// Closing Tag?
	let closing = false;
	if ( char === opts.TAG_CLOSING ) {
		if ( ! parent || ! parent.n )
			throw unexpected(char, context.i);
		closing = true;
		context.i++;
		skipSpace(context);
	}

	// Name
	const name = this.parseText(context, null, false, false, true);
	if ( ! name )
		return msg.slice(start, context.i);

	skipSpace(context);
	char = msg[context.i];

	if ( closing ) {
		if ( char !== opts.TAG_CLOSE )
			throw expected(opts.TAG_CLOSE, char, context.i);

		if ( name !== parent.n )
			throw unexpected('tag mismatch', start);

		context.i++;
		return CLOSE_TAG;
	}

	closing = false;
	if ( char === opts.TAG_CLOSING ) {
		closing = true;
		context.i++;
		char = msg[context.i];
	}

	if ( char !== opts.TAG_CLOSE )
		// So long and thanks for all the fish.
		return msg.slice(start, context.i);

	context.i++;

	const tag = {
		n: name
	};

	if ( closing )
		return tag;

	const contents = this.parseAST(context, tag);
	if ( contents && contents.length )
		tag.c = contents;

	if ( ! tag.closed && context.i >= msg.length )
		throw expected('closing tag', 'EOL', context.i);

	delete tag.closed;
	return tag;
}

p.parseElement = function(context, parent) {
	const msg = context.msg,
		opts = this.opts,
		special_hash = parent && opts[SUBNUM].includes(parent.t);

	let char = msg[context.i];

	if ( special_hash && char === opts.SUB_VAR ) {
		context.i++;
		return {v: parent.v, t: 'number'}
	}

	context.i++;
	skipSpace(context);

	// ID
	const id = this.parseText(context, null, false, false);
	if ( ! id )
		throw expected('placeholder id', char, context.i);

	const out = {v: id};

	skipSpace(context);

	char = msg[context.i];
	if ( char === opts.CLOSE ) {
		context.i++;
		return out;

	} else if ( char !== opts.SEP )
		throw expected(`${opts.SEP} or ${opts.CLOSE}`, char, context.i);

	context.i++;
	skipSpace(context);

	// Type
	const type = this.parseText(context, null, false, false);
	if ( ! type )
		throw expected('type', context);

	out.t = type;
	skipSpace(context);

	char = msg[context.i];
	if ( char === opts.CLOSE ) {
		if ( opts[SUBMSG].includes(out.t) )
			throw expected('sub-messages', context);

		context.i++;
		return out;

	} else if ( char !== opts.SEP )
		throw expected(`${opts.SEP} or ${opts.CLOSE}`, char, context.i);

	context.i++;
	skipSpace(context);

	// Formatting
	if ( opts[SUBNUM].includes(out.t) ) {
		const offset = this.parseOffset(context);
		if ( offset ) {
			out.f = offset;
			skipSpace(context);
		}
	}

	if ( opts[SUBMSG].includes(out.t) ) {
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
	if ( char !== opts.CLOSE )
		throw expected(opts.CLOSE, char, context.i);

	context.i++;
	return out;
}


p.parseSubmessages = function(context, parent) {
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


p.parseSubmessage = function(context, parent) {
	const msg = context.msg,
		opts = this.opts;

	if ( msg[context.i] !== opts.OPEN )
		throw expected(opts.OPEN, context);

	context.i++;
	const out = this.parseAST(context, parent);

	if ( msg[context.i] !== opts.CLOSE )
		throw expected(opts.CLOSE, context);

	context.i++;
	return out;
}


p.parseOffset = function(context) {
	const msg = context.msg,
		OFFSET = this.opts.OFFSET,
		length = msg.length;

	if ( msg.slice(context.i, context.i + OFFSET.length) !== OFFSET )
		return;

	context.i += OFFSET.length;
	skipSpace(context);

	const start = context.i;
	while(context.i < length && /[-\d]/.test(msg[context.i]))
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

function mergePush(list, item) {
	const l = list.length - 1;
	if ( typeof item === 'string' && typeof list[l] === 'string' )
		list[l] += item;
	else
		list.push(item);
}
