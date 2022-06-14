// https://github.com/cucumber/cucumber-js/blob/ad1d11267d03cce9b98a9af27de99a93615ffcf5/docs/javascript_api.md

const { loadConfiguration, loadSupport, runCucumber } = require('@cucumber/cucumber/api');

const { parse } = require('graphql');

// const codegen = require('amplify-codegen');
// const generateModels = require('amplify-codegen/commands/models');
// const mockFs = require('mock-fs');
// const graphqlCodegen = require('@graphql-codegen/core');
// const fs = require('fs');
// const path = require('path');


/*
 * ref
 *
export declare class PostCustomPKSort {
	public readonly id: string;
	public readonly postId: number;
	public readonly title: string;
	public readonly description?: string;
}
*/

function codegen(graphql) {
	// return JSON.stringify(parse(graphql), null, 2);
	const definitions = parse(graphql).definitions;
	return JSON.stringify(definitions.map(d => {
		const name = d.name.value;
		const isModel = d.directives.findIndex(dir => dir.name === 'model') > -1;
		const fields = d.fields.map(field => ({
			name: field.name.value,
			// type: field.type.name.value,
		}));
		return {
			name, isModel, fields
		};
	}), null, 2);
}


console.log('codegen keys', Object.keys(codegen));

async function runTests({ platform }) {
	// things we need to specify about the environment
	const environment = {
	};

	const lines = [];

	global.codegen = codegen;

	global.PLATFORM = 'js';
	global.emit = function(line) {
		lines.push(line);
	};

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
