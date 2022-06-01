// https://github.com/cucumber/cucumber-js/blob/ad1d11267d03cce9b98a9af27de99a93615ffcf5/docs/javascript_api.md

const { loadConfiguration, loadSupport, runCucumber } = require('@cucumber/cucumber/api');


async function runTests({ platform }) {
	// things we need to specify about the environment
	const environment = {
	};

	const lines = [];

	global.PLATFORM = 'js';
	global.emit = function(line) {
		lines.push(line);
	}

	// load configuration from a particular file, and override a specific option
	const { runConfiguration } = await loadConfiguration({ boats: 'yes' }, environment)

	const helper = function() {
		console.log('helper called');
	}

	// run cucumber, using the support code we loaded already
	const { success } = await runCucumber({ ...runConfiguration }, environment, callback_value => {
		// console.log('cb value', JSON.stringify(callback_value, null, 2));
	});
	return { success, lines };
}

for (const platform of ['js']) {
	runTests({platform}).then(({success, lines }) => {
		if (success) {
			console.log(lines.join('\n'));
		} else {
			console.log('Test steps are undefined');
		}
	});
}
