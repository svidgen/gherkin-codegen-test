const prettier = require("prettier");
const js_jest = require('./js-jest');

module.exports = {
	...js_jest,
	prologue: `
		QUnit.start();
		QUnit.module("spec", () => {
			QUnit.testDone(async () => {
				await DataStore.clear();
			});
		`,
	epilogue: `
		});
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
