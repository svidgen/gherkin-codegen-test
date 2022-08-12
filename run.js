// https://github.com/cucumber/cucumber-js/blob/ad1d11267d03cce9b98a9af27de99a93615ffcf5/docs/javascript_api.md

const { loadConfiguration, loadSupport, runCucumber } = require('@cucumber/cucumber/api');
const prettier = require("prettier");
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const OUTPUT_PATH = 'dist';


// TODO: `platform` should be a `Target` or `Output` object that can be added to the
// scope exposed to cucumber tests -- so sneak helper methods in if needed.
async function runTests(platform) {
	// things we need to specify about the environment
	const environment = {
	};

	const streams = {};

	// global.codegen = codegen;

	// not sure how else to ferry things into the cucumber execution context from here.
	global.PLATFORM = platform.name;
	global.platform = platform;
	global.emit = function(line) {
		const stream = global.world.pickle.uri.replace(/\//g, '-');
			streams[stream] = streams[stream] || [];
			streams[stream].push(line);
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
	return { success, streams };
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
		`,
		commands: {
			beforeEach: ({name}) => `it("${name}", async () => {`,
			afterEach: ({name}) => '});',
			configureAmplify: () => 'await Amplify.configure({});',
			datastoreClear: () => 'await DataStore.clear();',
			datastoreSchema: ({graphql}) => '// schema.json and models go here?',
			importModels: ({models}) => `const { ${models} } = require('./models');`,
			instantiateModel: ({varname, model, value}) => (
				`const ${varname} = new ${model}(${JSON.stringify(value)});`
			),
			datastoreSaveFromVariable: ({valueName, returnName}) => (
				`const ${returnName} = await DataStore.save(${valueName});`
			),
			datastoreQueryByRef: ({
				model,
				inputRef,
				outputName
			}) => (
				`const ${outputName} = await DataStore.query(${model}, ${inputRef});`
			),
			datastoreQueryByPredicate: ({
				outputName,
				model,
				predicate
			}) => {
				const condition = (c) => {
					// there should be a single condition.
					const operators = Object.keys(c);

					if (operators.length != 1) {
						throw new Error(`Only a single operator is supported, but found ${operators}`);
					}

					const op = operators.pop();
					return `("${op}", "${c[op]}")`;
				};

				const build = (p) => {
					const result = [
						'o => o'
					];

					for (const field of Object.keys(p)) {
						result.push(
							`.${field}${condition(p[field])}`
						);
					}

					// TODO: after predicate refactor, this gets more sane.
					return result.join('');
				};

				const predicateBuilder = build(predicate);

				return `const ${outputName} = await DataStore.query(${model}, ${predicateBuilder});`;
			},
			expectRefToEqualValue: ({reference, value}) => (
				`expect(${reference}).toEqual(${JSON.stringify(value)});`
			),
			expectRefNotToBeArray: ({reference}) => (
				`expect(Array.isArray(${reference})).toBe(false);`
			),
			expectRefLengthToBe: ({reference, length}) => (
				`expect(${reference}.length).toBe(${length});`
			),
			expectFirstItemToMatchRef: ({reference, expectedValueRef}) => (
				`expect(${reference}).toMatch(${expectedValueRef});`
			),
			expectFieldsToMatch: ({ actualRef, actualFields, expectedRef, expectedFields }) => {
				const lines = [];
				for (let i = 0; i < expectedFields.length; i++) {
					const actual = `${actualRef}.${actualFields[i]}`;
					const expected = `${expectedRef}.${expectedFields[i]}`;
					lines.push(`expect(${actual}).toEqual(${expected});`);
				}
				return lines.join('\n');
			}
		} // commands
	} // js
}; // platforms

rimraf.sync(OUTPUT_PATH);

for (const name of ['js']) {
	const platform = {...platforms[name], name};

	if (!platform) {
		console.log("Platform not found", name);
		break;
	}

	if (!fs.existsSync(OUTPUT_PATH)){
		fs.mkdirSync(`${OUTPUT_PATH}/${platform.name}`, { recursive: true });
	}

	runTests(platform).then(({success, streams }) => {
		for (const [stream, lines] of Object.entries(streams)) {
			const filePath = `${OUTPUT_PATH}/${platform.name}/${stream}.${platform.extension}`;
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
		}
	});
}
