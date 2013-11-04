/* b64vlq */
function B64VLQ() {
	var BASE 						= 0,
			SHIFT 					= 0,
			MASK 						= 0,
			BIT 						= 0,
			SIGN 						= 0,
			intToCharTable	= {},
			charToIntTable	= {};

	function init() {
		SHIFT = 5;
		/* b100000 */
		BASE = 1 << SHIFT;
		/* b011111 */
		MASK = BASE - 1;
		/* b100000 */
		BIT = BASE;
		/* b000001*/
		SIGN = 1;

		var num = 0;
		/* from A - Z */
		for(i = "A".charCodeAt(); i <= "Z".charCodeAt(); ++i) {
			intToCharTable[num] = String.fromCharCode(i);
			charToIntTable[String.fromCharCode(i)] = num;
			num++;
		}
		/* from a - z */
		for(i = "a".charCodeAt(); i <= "z".charCodeAt(); ++i) {
			intToCharTable[num] = String.fromCharCode(i);
			charToIntTable[String.fromCharCode(i)] = num;
			num++;
		}
		/* from 0 - 9 */
		for(i = "0".charCodeAt(); i <= "9".charCodeAt(); ++i) {
			intToCharTable[num] = String.fromCharCode(i);
			charToIntTable[String.fromCharCode(i)] = num;
			num++;
		}
		/* + and / */
		intToCharTable[62] = '+';
		charToIntTable['+'] = 62;
		intToCharTable[63] = '/';
		charToIntTable['/'] = 63;
	}
	init();

	function toSigned(value) {
		var ret;
		if(SIGN & value) {
			ret = (value >> 1);
			ret = -ret;
		} else {
			ret = value >> 1;
		}
		return ret;
	}

	function toUnsigned(value) {
		if(value < 0) {
			return ((-value) << 1) + 1;
		} else {
			return (value << 1) + 0;
		}
	}

	// encode a value to b64 vlq format
	function encode(value) {
		var ret = "", digit, tmp = toUnsigned(value);
		while(tmp) {
			digit = tmp & MASK;
			tmp >>>= SHIFT;
			if(tmp) {
				digit |= BIT;
			}
			ret += intToCharTable[digit];
		}
		return ret;
	}

	// decodes a single b64 vlq encoded value
	function decode(string) {
		var res = 0, 
				shift = 0,
				chars = string.split('').reverse();

		do {
			ch = charToIntTable[chars.pop()];
			res += (ch & MASK) << shift * SHIFT;
			if(ch & BIT) {
				shift++;
			}
		} while(ch & BIT);

		return {
			value: toSigned(res),
			rest: chars.reverse().join('')
		};
	}

	function decompress(string) {
		var entry = [], process = string;
		while(process.length > 0) {
			var result = decode(process);
			entry.push(result.value);
			process = result.rest;
		}
		return entry;
	}

	return {
		encode: encode,
		decode: decode,
		decompress: decompress
	}
};

/* table compiler */
/* TODO: this module compiles the sourcemap to a lookup-table for faster lookup of minified errors */
/* TODO: according to number of occurances of a same line in a single file enumerate literals for further beautification */
function TableCompiler() {
	var b64vlq = B64VLQ();
	var fs = require("fs");

	function compile(src) {
		var table = {},
				data = null,
				json = null;
				sources = {},
				tmp = null;

		data = fs.readFileSync(src, "utf8");
		json = JSON.parse(data);

		var i = 0;
		json.sourcesContent.forEach(function (s) {
			sources[i] = {source: s, lines: []};
			sources[i].lines = sources[i].source.split(/\n/);
			i++;
		});
		
		tmp = json.mappings.split(";");
		var line = 1;
		var base = [1, 0, 0, 0, 0];
		var prev = 0;
		tmp.forEach(function (m) {
			var positions = m.split(",");
			positions.forEach(function (p) {
				var dcmp = b64vlq.decompress(p);
				for(var i = 0; i < dcmp.length; ++i) {
					base[i] += dcmp[i];
				}
				table[(line).toString() + ":" + (base[0] - prev)] = "" + json.sources[base[1]] + ":" + base[2];
			});
			prev = base[0] - 1;
			line++;
		});
		//console.log(table);
		return table;
	}


	return {
		compile: compile
	}
}

/* lookup */
var argv = process.argv;
var compiler = TableCompiler();

if(argv.length != 4) {
	console.log("Usage: \n\t node magify.js <path to source map> <line:column>");
} else {
	var smap = argv[2]
	var err = argv[3]
	
	var table = compiler.compile(smap);

	console.log("/*========================================================================*/");
        if(table[err.toString()]) {
		console.log(table[err.toString()]);
	}
}