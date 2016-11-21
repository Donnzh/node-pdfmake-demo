'use strict';

const eslintrc = {
	extends: 'swm',
	rules: {
		'comma-dangle': ['error', 'always-multiline'],
		'no-undef-init': ['error'],
		'no-undefined': ['off'],
	},
	parserOptions: {
		'sourceType': 'script',
	},
};

module.exports = eslintrc;
