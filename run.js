// https://github.com/cucumber/cucumber-js/blob/ad1d11267d03cce9b98a9af27de99a93615ffcf5/docs/javascript_api.md

const { loadConfiguration, loadSupport, runCucumber } = require('@cucumber/cucumber/api');
const prettier = require("prettier");
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const OUTPUT_PATH = 'dist';

// const { parse } = require('graphql');

// const codegen = require('amplify-codegen');
// const generateModels = require('amplify-codegen/commands/models');
// const mockFs = require('mock-fs');
// const graphqlCodegen = require('@graphql-codegen/core');


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

/*
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
*/


// console.log('codegen keys', Object.keys(codegen));


// TODO: `platform` should be a `Target` or `Output` object that can be added to the
// scope exposed to cucumber tests -- so sneak helper methods in if needed.
async function runTests(platform) {
	// things we need to specify about the environment
	const environment = {
	};

	const lines = [];

	// global.codegen = codegen;

	// not sure how else to ferry things into the cucumber execution context from here.
	global.PLATFORM = platform.name;
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

const platforms = {
	js: {
		extension: 'js',
		format: code => prettier.format(code, { parser: "babel" }),
		prologue: `
		describe("spec", () => {
			afterEach(async () => {
				await DataStore.clear();
			});
		`,
		epilogue: `
		});
		`
	}
};

rimraf.sync(OUTPUT_PATH);
if (!fs.existsSync(OUTPUT_PATH)){
	fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

for (const name of ['js']) {
	const platform = {...platforms[name], name};
	
	if (!platform) {
		console.log("Platform not found", name);
		break;
	}

	const filePath = `${OUTPUT_PATH}/${platform.name}.${platform.extension}`;

	runTests(platform).then(({success, lines }) => {
		const code = platform.format([
			platform.prologue,
			...lines,
			platform.epilogue
		].join('\n'));

		if (success) {
			fs.writeFileSync(filePath, code);
			console.log(`wrote ${platform.name} to ${filePath}`);
		} else {
			console.log('Test steps are undefined');
		}
	});
}
