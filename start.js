const { execSync } = require('child_process');
const process = require('process');
const cliSelect = require('cli-select');
const platforms = require('./platforms');

(async () => {
	const platform = (await cliSelect({
		values: Object.keys(platforms)
	})).value;

	// TODO: check to see if `dist/platform` has been generated ...

	process.chdir(`dist/${platform}`);

	// TODO: pull this command from `platforms`
	execSync(platforms[platform].startCommand || `yarn start`, {
		stdio: [
			'inherit',
			'inherit',
			'inherit'
		]
	});

	console.log('All donesy.');
})();
