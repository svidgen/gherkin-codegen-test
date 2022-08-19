const js_jest = require('../js-jest');
const { helpers } = require('../lib/js');

module.exports = {
	...js_jest,
	init: [
		'npx create-react-app .',
		'npm i aws-amplify qunit'
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
		'src/App.js': ({streams}) => `
			import { useEffect } from 'react';
			import QUnit from 'qunit';
			import 'qunit/qunit/qunit.css';

			import awsconfig from './aws-exports';
			Amplify.configure(awsconfig);

			QUnit.start();

			QUnit.module("spec", () => {
				QUnit.testDone(async () => {
					await DataStore.clear();
				});
				${Object.keys(streams).map(name => `(() => {
					const addTests = require('./${name}');
					addTests(Qunit);
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
		`
	},
	prologue: `
		const { Amplify, API, DataStore } = require('aws-amplify');
		const { BasicModel, Post, Comment } = require('./models');
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
		expectRefToEqualValue: ({reference, value}) => (
			`assert.equal(${reference}, ${JSON.stringify(value)});`
		),
		expectRefNotToBeArray: ({reference}) => (
			`assert.ok(!Array.isArray(${reference}));`
		),
		expectRefLengthToBe: ({reference, length}) => (
			`assert.equal(${reference}.length, ${length});`
		),
		expectFirstItemToMatchRef: ({reference, expectedValueRef}) => (
			`assert.equal(${reference}, ${expectedValueRef});`
		),
		expectFieldsToMatch: ({ actualRef, actualFields, expectedRef, expectedFields }) => {
			const lines = [];
			for (let i = 0; i < expectedFields.length; i++) {
				const actual = `${actualRef}.${actualFields[i]}`;
				const expected = `${expectedRef}.${expectedFields[i]}`;
				lines.push(`assert.equal(${actual}, ${expected});`);
			}
			return lines.join('\n');
		}
	}
};
