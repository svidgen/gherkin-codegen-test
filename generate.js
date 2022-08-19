// https://github.com/cucumber/cucumber-js/blob/ad1d11267d03cce9b98a9af27de99a93615ffcf5/docs/javascript_api.md

const { loadConfiguration, loadSupport, runCucumber } = require('@cucumber/cucumber/api');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const process = require('process');
const { execSync } = require('child_process');

// const { js_jest, js_qunit } = require('./platforms');
const platforms = require('./platforms');

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
 * Simulate `cp -r`.
 *
 * https://stackoverflow.com/a/22185855/779572
 *
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
var copyRecursiveSync = function(src, dest) {
	var exists = fs.existsSync(src);
	var stats = exists && fs.statSync(src);
	var isDirectory = exists && stats.isDirectory();
	if (isDirectory) {
		fs.mkdirSync(dest);
		fs.readdirSync(src).forEach(function(childItemName) {
			copyRecursiveSync(path.join(src, childItemName),
				path.join(dest, childItemName));
		});
	} else {
		fs.copyFileSync(src, dest);
	}
};

(async () => {
	// cucumber doesn't like it when we invoke it twice ... not sure why!
	// but, for now that means we need to perform our looping outside the proc.
	const platform = {...platforms[TARGET], name: TARGET};

	if (!platform) {
		console.log("Platform not found", TARGET);
		return;
	}

	const platformOutputDirectory = [
		OUTPUT_PATH,
		platform.name
	].join('/');

	const specOutputDirectory = [
		platformOutputDirectory,
		platform.specDirectory
	].filter(p => p).join('/');

	if (!fs.existsSync(platformOutputDirectory)) {
		fs.mkdirSync(platformOutputDirectory, { recursive: true });

		const POP_CD = process.cwd();
		process.chdir(platformOutputDirectory);

		if (platform.init) {
			for (const command of platform.init) {
				console.log(`Running \`${command}\` ...`);
				execSync(command, { stdio: [ 'ignore', 'inherit', 'inherit' ] });
			}
		}

		if (platform.amplify) {
			// double-stringify for encoding JSON "as a string" for use as CLI args
			const amplify = JSON.stringify(JSON.stringify(platform.amplify.amplify || {}));
			const frontend = JSON.stringify(JSON.stringify(platform.amplify.frontend || {}));
			const providers = JSON.stringify(JSON.stringify(platform.amplify.providers || {}));

			const initCommand = [
				'amplify init --yes',
				'--amplify', amplify,
				'--frontend', frontend,
				'--providers', providers
			].join(' ');

			console.log(`Running \`${initCommand}\` ...`);

			execSync(initCommand, {
				stdio: [
					'ignore',
					'inherit',
					'inherit'
				]
			});
		}

		process.chdir(POP_CD);
	}

	if (!fs.existsSync(specOutputDirectory)) {
		fs.mkdirSync(specOutputDirectory, { recursive: true });
	}

	const { success, streams } = await runTests(platform);
	for (const [stream, lines] of Object.entries(streams)) {
		const filePath = [
			specOutputDirectory,
			`${stream}.${platform.extension}`
		].join('/');
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
})();
