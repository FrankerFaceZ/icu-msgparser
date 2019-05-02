module.exports = {
	"env": {
		"commonjs": true,
		"es6": true,
	},
	"extends": [
		"eslint:recommended"
	],
	"parserOptions": {
		"ecmaVersion": 8,
		"sourceType": "module",
	},
	"globals": {
		"import": false,
		"require": false,
	},
	"rules": {
		"no-console": ["error"],
		"accessor-pairs": ["error"],
		"block-scoped-var": ["error"],
		"class-methods-use-this": ["error"],
		"for-direction": ["error"],
		"guard-for-in": ["warn"],
		"no-alert": ["error"],
		"no-await-in-loop": ["error"],
		"no-caller": ["error"],
		"no-catch-shadow": ["error"],
		"no-invalid-this": ["error"],
		"no-iterator": ["error"],
		"no-labels": ["error"],
		"no-lone-blocks": ["error"],
		"no-octal-escape": ["error"],
		"no-proto": ["warn"],
		"no-return-await": ["error"],
		"no-self-compare": ["error"],
		"no-sequences": ["error"],
		"no-shadow-restricted-names": ["error"],
		"no-template-curly-in-string": ["warn"],
		"no-throw-literal": ["error"],
		"no-undef-init": ["error"],
		"no-unmodified-loop-condition": ["error"],
		"no-use-before-define": ["error", {
			"functions": false,
			"classes": false
		}],
		"no-useless-call": ["warn"],
		"no-useless-concat": ["warn"],
		"no-useless-return": ["warn"],
		"no-void": ["error"],
		"no-warning-comments": ["warn"],
		"no-with": ["error"],
		"radix": ["error"],
		"require-await": ["warn"],
		"valid-jsdoc": ["warn", {
			"prefer": {
				"arg": "param",
				"argument": "param",
				"class": "constructor",
				"return": "return"
			},
			"requireReturn": false
		}],
		"yoda": ["warn"],

		"arrow-body-style": ["warn", "as-needed"],
		"arrow-parens": ["warn", "as-needed"],
		"arrow-spacing": ["warn"],
		"generator-star-spacing": ["warn"],
		"no-duplicate-imports": ["error"],
		"no-useless-computed-key": ["error"],
		"no-useless-constructor": ["error"],
		"no-useless-rename": ["error"],
		"no-var": ["error"],
		"no-cond-assign": ["warn"],
		"object-shorthand": ["warn"],
		"prefer-arrow-callback": ["warn", {"allowUnboundThis": true}],
		"prefer-const": ["warn", {"ignoreReadBeforeAssign": true}],
		"prefer-rest-params": ["warn"],
		"prefer-spread": ["error"],
		"prefer-template": ["warn"],
		"rest-spread-spacing": ["error", "never"],
		"yield-star-spacing": ["warn"],

		"indent": [
			"warn",
			"tab",
			{
				"SwitchCase": 1
			}
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"single",
			{
				"avoidEscape": true,
				"allowTemplateLiterals": true
			}
		]
	},
	overrides: [{
		files: ['test/**/*.js'],
		plugins: ['mocha'],
		env: {
			mocha: true
		},
		rules: {
			'mocha/handle-done-callback': 'error',
			'mocha/max-top-level-suites': 'error',
			'mocha/no-exclusive-tests': 'error',
			'mocha/no-global-tests': 'error',
			'mocha/no-identical-title': 'error',
			'mocha/no-mocha-arrows': 'warn',
			'mocha/no-nested-tests': 'error',
			'mocha/no-pending-tests': 'warn',
			'mocha/no-return-and-callback': 'error',
			'mocha/no-setup-in-describe': 'error',
			'mocha/no-sibling-hooks': 'error',
			'mocha/no-skipped-tests': 'error',
			'prefer-arrow-callback': 0,
			'mocha/prefer-arrow-callback': ['warn', {allowUnboundThis: true}]
		}
	}]
};
