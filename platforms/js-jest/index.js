const prettier = require("prettier");
const { helpers } = require('../lib/js');

module.exports = {
	extension: 'js',
	format: code => prettier.format(code, { parser: "babel" }),
	prologue: `
		${helpers}

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
		objectLiteral: (value) => {
			const assignments = [];
			for (const [key, v] of Object.entries(value)) {
				assignments.push(`${key}: ${v}`);
			}
			return `{${assignments.join(',')}}`;
		},
		beginTrying: () => `try {`,
		catchAndAssertMatch: ({message}) => (
			`} catch (error) {
				// TODO
			}`
		),
		instantiateModel: ({varname, model, value}) => (
			`const ${varname} = new ${model}(${JSON.stringify(value)});`
		),
		instantiateModelWithRef: ({varname, model, ref}) => (
			`const ${varname} = new ${model}(${ref});`
		),
		datastoreModelCopy: ({model, fromName, toName, updates}) => (
			`const ${toName} = ${model}.copyOf(${fromName}, draft => {
				${Object.entries(updates).map(([key, value]) => {
					`draft[${key}] = JSON.stringify(${value});`
				})}
			});`
		),
		datastoreSaveFromVariable: ({valueName, returnName}) => (
			`const ${returnName} = await DataStore.save(${valueName});`
		),
		datastoreDeleteAll: ({model}) => (
			`await DataStore.delete(${model}, Predicates.ALL);`
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
				// return `("${op}", "${c[op]}")`;
				return `.${op}(${JSON.stringify(c[op])})`;
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
		expectObjectsTomatch: ({value, expected}) => (
			`expect(${value}).toMatch(${expectedValueRef});`
		),
		expectFirstItemToMatchRef: ({reference, expectedValueRef}) => (
			`expect(${reference}[0]).toMatch(${expectedValueRef});`
		),
		expectFieldsToMatch: ({ actualRef, actualFields, expectedRef, expectedFields }) => {
			const lines = [];
			for (let i = 0; i < expectedFields.length; i++) {
				const actual = `${actualRef}.${actualFields[i]}`;
				const expected = `${expectedRef}.${expectedFields[i]}`;
				lines.push(`expect(${actual}).toEqual(${expected});`);
			}
			return lines.join('\n');
		},
		expectAwaitedRefFieldsToMatch: ({ actualRef, actualFields, expectedRef, expectedFields }) => {
			const lines = [];
			for (let i = 0; i < expectedFields.length; i++) {
				const actual = `(await ${actualRef}).${actualFields[i]}`;
				const expected = `${expectedRef}.${expectedFields[i]}`;
				lines.push(`expect(${actual}).toEqual(${expected});`);
			}
			return lines.join('\n');
		}
	}
};

