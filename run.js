// https://github.com/cucumber/cucumber-js/blob/ad1d11267d03cce9b98a9af27de99a93615ffcf5/docs/javascript_api.md

const { loadConfiguration, loadSupport, runCucumber } = require('@cucumber/cucumber/api');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const process = require('process');

const { js_jest, js_qunit } = require('./platforms');

const TARGET = process.argv[2];

const OUTPUT_PATH = 'dist';


// TODO: `platform` should be a `Target` or `Output` object that can be added to the
// scope exposed to cucumber tests -- so sneak helper methods in if needed.
async function runTests(platform) {
	// things we need to specify about the environment
	const environment = {};

	/**
	 * output streams, each of which will end up as a file.
	 */
	const streams = {};

	/**
	 * For now, we're dropping things into `global` that our "test runner" needs access to.
	 * (I'm not sure how else to shuttle things into the test runner context.)
	 */
	global.platform = platform;
	global.emit = function(line) {
		const stream = global.world.pickle.uri.replace(/\//g, '-');
			streams[stream] = streams[stream] || [];
			streams[stream].push(line);
		};

	// load configuration from a particular file, and override a specific option
	const { runConfiguration } = await loadConfiguration()

	// console.log(platform.name, runConfiguration);

	const helper = function() {
		console.log('helper called');
	}

	// run cucumber, using the support code we loaded already
	const { success } = await runCucumber({ ...runConfiguration }, environment);
	return { success, streams };
}

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
const platforms = {
	'js-jest': js_jest,
	'js-qunit': js_qunit
}; // platforms

(async () => {
	// cucumber doesn't like it when we invoke it twice ... not sure why!
	// but, for now that means we need to perform our looping outside the proc.
	// for (const name of ['js-jest', 'js-qunit']) {
		// const platform = {...platforms[name], name};
		const platform = {...platforms[TARGET], name: TARGET};

		if (!platform) {
			console.log("Platform not found", TARGET);
			return;
		}

		if (!fs.existsSync(`${OUTPUT_PATH}/${platform.name}`)){
			fs.mkdirSync(`${OUTPUT_PATH}/${platform.name}`, { recursive: true });
		}

		const { success, streams } = await runTests(platform);
		for (const [stream, lines] of Object.entries(streams)) {
			const filePath = `${OUTPUT_PATH}/${platform.name}/${stream}.${platform.extension}`;
			const code = platform.format([
				platform.prologue,
				...lines,
				platform.epilogue
			].join('\n'));

			if (success) {
				fs.writeFileSync(filePath, code);
				console.log(`Wrote ${platform.name} artifact ${filePath} ...`);
			} else {
				console.log('Test steps are undefined');
			}
		}
	// }
})();
