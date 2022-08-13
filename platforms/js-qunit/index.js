const js_jest = require('../js-jest');
const { helpers } = require('../lib/js');

module.exports = {
	...js_jest,
	prologue: `
		import { useEffect } from 'react';
		import QUnit from 'qunit';
		import 'qunit/qunit/qunit.css';

		import { Amplify, API, DataStore } from 'aws-amplify';
		import { BasicModel, Post, Comment } from './models';
		import * as mutations from './graphql/mutations';

		import awsconfig from './aws-exports';

		Amplify.configure(awsconfig);

		${helpers}

		const makeID = () => crypto.randomUUID();

		QUnit.start();
		QUnit.module("spec", () => {
			QUnit.testDone(async () => {
				await DataStore.clear();
			});
		`,
	epilogue: `
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
