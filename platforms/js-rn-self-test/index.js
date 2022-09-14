const fs = require('fs');
const prettier = require("prettier");
const { helpers } = require('../lib/js');
const expectLite= require('./expect-lite');
const base = require('../js-jest');

module.exports = {
	...base,
	init: [
		'npx create-expo-app .',
		'npm i ' + [
			'@expo/webpack-config',
			'@react-native-async-storage/async-storage',
			'@react-native-community/netinfo',
			'aws-amplify',
			'react-dom@18.0.0',
			'react-native-web',
			'react-native-easy-grid'
		].join(' '),
	],
	amplify: {
		frontend: {
			frontend: 'javascript',
		},
		providers: {
			awscloudformation: {
				configLevel: 'project',
				useProfile: true,
				profileName: 'wirej',
			}
		}
	},
	manifests: {
		'App.js': ({streams}) => fs.readFileSync(`${__dirname}/template/App.js`).toString(),
		'tests.js': ({streams}) => {
			const template = fs.readFileSync(`${__dirname}/template/tests.js`).toString()
			const index = Object.keys(streams).map(name => `
				(() => {
					const addTests = require('./${name}');
					addTests({describe, test, getTestName});
				})();
			`).join('\n');
			return prettier.format(template.replace('// ***** <INDEX /> *****', index), {
				parser: 'babel'
			});
		}
	},
	prologue: `
		import awsconfig from './src/aws-exports';
		import { Amplify, API, DataStore } from 'aws-amplify';
		import {
			Customer,
			Order,
			LineItem,
			Product,
			HasOneParent,
			DefaultPKParent,
			DefaultPKChild,
			CompositePKParent,
			CompositePKChild,
			ImplicitChild,
			StrangeExplicitChild,
			ChildSansBelongsTo
		} from './src/models';
		import * as mutations from './src/graphql/mutations';
		
		${helpers}

		${expectLite}

		module.exports = ({ describe, test, getTestName }) => {
		`,
	epilogue: `
		};
		`,
	commands: {
		...base.commands,
		beforeEach: ({name}) => `test("${name}", async () => {`,
		afterEach: ({name}) => '});',
		configureAmplify: () => 'await Amplify.configure(awsconfig);',
		datastoreClear: () => 'await DataStore.clear();',
		importModels: ({models}) => `const { ${models} } = require('./src/models');`,
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
		}
	}
};
