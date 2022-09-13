const { defineParameterType, After, Before, Given, When, Then } = require('@cucumber/cucumber');

/**
 * to import from PLATFORM scope
 */

defineParameterType({
	name: 'fields',
	regexp: /\[(([\w\d_]+)(\s*,\s*[\w\d_]+)*)\]/,
	transformer: s => {
		return s.split(',').map(n => n.trim());
	}
});

defineParameterType({
	name: 'ref',
	regexp: /`(([\w\d_]+)(\.[\w\d_]+)*)`/,
	transformer: s => s
});

defineParameterType({
	name: 'name',
	regexp: /`([\w\d_]+)`/,
	transformer: s => s
});


// TODO: change to varname or something
function normalize(name) {
	return name.split(/\s+/g).join('_');
}

function randomString() {
	const chars = [];
	for (let i = 0; i < 32; i++) {
		chars.push(
			'0123456789abcdef'[Math.floor(Math.random() * 16)]
		);
	}
	return chars.join('');
}

// hoping this runs before each Scenario
Before((world) => {
	global.world = world;
	emit(platform.commands.beforeEach({name: `${world.pickle.uri}: ${world.pickle.name}`}));
});

// hoping this runs after each scenario
After((world) => {
	emit(platform.commands.afterEach({name: `${world.pickle.uri}: ${world.pickle.name}`}));
});

Given("a configured Amplify context", () => {
	emit(platform.commands.configureAmplify());
});

Given("a clean client database", () => {
	emit(platform.commands.datastoreClear());
});

Given("a new client schema", schema_graphql => {
	emit(platform.commands.datastoreSchema({}));
});

Given("I import {string} from models", models => {
	emit(platform.commands.importModels({models}));
});

When("I create a new {ref} as {name} with args", (model, varname, json) => {
	const value = JSON.parse(json);
	emit(platform.commands.instantiateModel({
		varname: normalize(varname), model, value
	}));
});

When("I create a new {ref} as {name} with randomized {fields}", (
	model, varname, fields
) => {
	const value = {};
	for (const k of fields) {
		value[k] = randomString();
	}
	emit(platform.commands.instantiateModel({
		varname: normalize(varname), model, value
	}));
});

When("I create a new {ref} as {name} with randomized {fields} and {name} set to {ref}", (
	model, varname, fields, prop, setTo
) => {
	const value = {};
	for (const k of fields) {
		value[k] = JSON.stringify(randomString());
	}
	value[prop] = setTo;
	emit(platform.commands.instantiateModelWithRef({
		varname: normalize(varname),
		model,
		ref: platform.commands.objectLiteral(value)
	}));
});

When("I save {name} and return {name}", (valueName, returnName) => {
	emit(platform.commands.datastoreSaveFromVariable({
		returnName: returnName,
		valueName: valueName
	}));
});

When('I query {ref} with {ref} into {name}', (model, inputRef, outputName) => {
	emit(platform.commands.datastoreQueryByRef({
		model,
		inputRef,
		outputName
	}));
});

When('I query {ref} into {name} with a predicate', (model, outputName, predicateJSON) => {
	emit(platform.commands.datastoreQueryByPredicate({
		outputName,
		model,
		predicate: JSON.parse(predicateJSON)
	}));
});

Then("{ref} should equal", (reference, valueJSON) => {
	emit(platform.commands.expectRefToEqualValue({
		reference,
		value: JSON.parse(valueJSON)
	}));
});

Then("{ref} should be a single item", (reference) => {
	emit(platform.commands.expectRefNotToBeArray({
		reference,
	}));
});

Then('{ref} should be a list of {int}', (reference, length) => {
	emit(platform.commands.expectRefLengthToBe({
		reference,
		length
	}));
});

Then('the first item of {ref} should match {ref}', (reference, expectedValueRef) => {
	emit(platform.commands.expectFirstItemToMatchRef({
		reference,
		expectedValueRef
	}));
});

Then('{ref} {fields} should match {ref} {fields}', (
	actualRef,
	actualFields,
	expectedRef,
	expectedFields
) => {
	emit(platform.commands.expectFieldsToMatch({
		actualRef,
		actualFields,
		expectedRef,
		expectedFields
	}));
});

Then('awaited {ref} {fields} should match {ref} {fields}', (
	actualRef,
	actualFields,
	expectedRef,
	expectedFields
) => {
	emit(platform.commands.expectAwaitedRefFieldsToMatch({
		actualRef,
		actualFields,
		expectedRef,
		expectedFields
	}));
});
