const prettier = require("prettier");
const { helpers } = require('../lib/js');
const expectLite= require('./expect-lite');
const base = require('../js-jest');

module.exports = {
	...base,
	prologue: `
		import awsconfig from './src/aws-exports';
		import { Amplify, API, DataStore } from 'aws-amplify';
		import { BasicModel, Post, Comment } from './src/models';
		import * as mutations from './src/graphql/mutations';
		
		${helpers}

		${expectLite}

		describe("spec", () => {
			afterEach(async () => {
				await DataStore.clear();
			});
		`,
	epilogue: `
		});
		`,
	commands: {
		...base.commands,
		beforeEach: ({name}) => `test("${name}", async () => {`,
		afterEach: ({name}) => '});',
		configureAmplify: () => 'await Amplify.configure(awsconfig);',
		datastoreClear: () => 'await DataStore.clear();',
		importModels: ({models}) => `const { ${models} } = require('./models');`,
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
	}
};
