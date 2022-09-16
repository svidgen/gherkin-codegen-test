const { execSync } = require('child_process');
const cliSelect = require('cli-select');
const platforms = require('./platforms');

(async () => {
	const platform = (await cliSelect({
		values: Object.keys(platforms)
	})).value;

	// TODO: check to see if `dist/platform` has been generated ...

	execSync(`code dist/${platform}`);
})();
