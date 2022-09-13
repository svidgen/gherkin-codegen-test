const prettier = require("prettier");
const js_jest = require('../js-jest');
const { helpers } = require('../lib/js');

module.exports = {
	...js_jest,
	init: [
		'npx create-react-app .',
		'npm i aws-amplify@custom-pk qunit'
	],
	specDirectory: 'src',
	amplify: {
		frontend: {
			frontend: 'javascript',
		},
		providers: {
			awscloudformation: {
				configLevel: 'project',
				useProfile: true,
				profileName: 'wirej' // need to pull this from ENV and/or use ENV secrets
			}
		}
	},
	manifests: {
		'src/App.js': ({streams}) => prettier.format(`
			import { useEffect } from 'react';
			import QUnit from 'qunit';
			import 'qunit/qunit/qunit.css';

			import { Amplify, DataStore, Predicates } from 'aws-amplify';
			import awsconfig from './aws-exports';
			const {
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
			} = require('./models');

			Amplify.configure(awsconfig);

			QUnit.start();
			QUnit.module("spec", async () => {
				QUnit.testStart(async () => {
					// just causes trouble until fix is merged.
					// await DataStore.clear();
					for (const M of [Customer, Order, LineItem, Product]) {
						await DataStore.delete(M, Predicates.ALL);
					}
				});
				${Object.keys(streams).map(name => `(() => {
					const addTests = require('./${name}');
					addTests(QUnit);
				})();`).join('\n')}
			});

			function App() {
			  return (
				<div className="App">
					<div id="qunit"></div>
					<div id="qunit-fixture"></div>
				</div>
			  );
			}

			export default App;
		`, { parser: 'babel'})
	},
	prologue: `
		const { Amplify, API, DataStore } = require('aws-amplify');
		const {
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
		} = require('./models');
		const mutations = require('./graphql/mutations');

		${helpers}

		const makeID = () => crypto.randomUUID();

		module.exports = (QUnit) => {
		`,
	epilogue: `
		};
	`,
	commands: {
		...js_jest.commands,
		beforeEach: ({name}) => `QUnit.test("${name}", async assert => {`,
		afterEach: ({name}) => '});',
		configureAmplify: () => `// Amplify configuration occurs in App.js`,
		datastoreClear: () => `// clearing in tests is temporarily skipped, pending clear/stop fix`,
		expectRefToEqualValue: ({reference, value}) => (
			`assert.equal(${reference}, ${JSON.stringify(value)});`
		),
		expectRefNotToBeArray: ({reference}) => (
			`assert.ok(!Array.isArray(${reference}));`
		),
		expectRefLengthToBe: ({reference, length}) => (
			`assert.equal(${reference}.length, ${length}, "the result is a list of 1");`
		),
		expectFirstItemToMatchRef: ({reference, expectedValueRef}) => (
			`
			console.log(JSON.stringify(${reference}[0]));
			assert.deepEqual(${reference}[0], ${expectedValueRef}, "the first item matches");
			`
		),
		expectFieldsToMatch: ({ actualRef, actualFields, expectedRef, expectedFields }) => {
			const lines = [];
			for (let i = 0; i < expectedFields.length; i++) {
				const actual = `${actualRef}.${actualFields[i]}`;
				const expected = `${expectedRef}.${expectedFields[i]}`;
				lines.push(`assert.equal(${actual}, ${expected});`);
			}
			return lines.join('\n');
		},
		expectAwaitedRefFieldsToMatch: ({ actualRef, actualFields, expectedRef, expectedFields }) => {
			const lines = [];
			for (let i = 0; i < expectedFields.length; i++) {
				const actual = `(await ${actualRef}).${actualFields[i]}`;
				const expected = `${expectedRef}.${expectedFields[i]}`;
				lines.push(`assert.equal(${actual}, ${expected});`);
			}
			return lines.join('\n');
		}
	}
};
