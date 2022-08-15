const js_jest = require('./js-jest');
const js_rn_self_test = require('./js-rn-self-test');
const js_qunit = require('./js-qunit');

/**
 * The output platform definitions.
 *
 * Each platform entry listed here must specify a
 * 	format function,
 * 	prologue,
 * 	epilogue,
 * 	and all commands requested by the test runner.
 *
 * Refer to the `jstest` platform as an example.
 *
 * The key will be used as the platform's final `name` when writing artifacts.
 */
module.exports = {
	'js-jest': js_jest,
	'js-rn-self-test': js_rn_self_test,
	'js-qunit': js_qunit
};
