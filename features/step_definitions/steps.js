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
	switch (PLATFORM) {
		case 'js':
			// emit(`before world js: ${JSON.stringify(world, null, 2)}`);
			emit(`it("${world.pickle.uri}: ${world.pickle.name}", async () => {`);

			// top level feature description, could be used to printOnce()
			// emit(`/* ${world.gherkinDocument.feature.description} */`);
			//
			break;
		case 'ios':
			emit(world, `before world ios: ${JSON.stringify(world, null, 2)}`);
			break;
		default:
			throw new Error('Before: Invalid PLATFORM: ' + PLATFORM);
	}
});

// hoping this runs after each scenario
After((world) => {
	switch (PLATFORM) {
		case 'js':
			// emit(`after world js: ${JSON.stringify(world, null, 2)}`);
			emit('});');
			break;
		case 'ios':
			emit(`after world ios: ${JSON.stringify(world, null, 2)}`);
			break;
		default:
			throw new Error('After: Invalid PLATFORM: ' + PLATFORM);
	}
});

Given("a configured Amplify context", () => {
	switch (PLATFORM) {
		case 'js':
			emit('await Amplify.configure({});');
			break;
		case 'ios':
			emit('context ios');
			break;
		default:
			throw new Error('context: Invalid PLATFORM: ' + PLATFORM);
	}
});

Given("a clean client database", () => {
	switch (PLATFORM) {
		case 'js':
			emit(`await DataStore.clear();`);
			break;
		case 'ios':
			emit(`clean db world ios`);
			break;
		default:
			throw new Error('clean: Invalid PLATFORM: ' + PLATFORM);
	}
});

Given("a new client schema", schema_graphql => {
	// emit('just testing:\n' + schema_graphql);
	emit('// schema.json and models go here.');
	// emit(codegen(schema_graphql));
});

Given("I import {string} from models", model => {
	switch (PLATFORM) {
		case 'js':
			emit('// might not even have to do this if we emit schema info inline ^^');
			emit(`const { ${model} } = require('./models');`);
			break;
		case 'ios':
			emit(`import ios: ${model}`);
			break;
		default:
			throw new Error('import: Invalid PLATFORM: ' + PLATFORM);
	}
});

When("I create a new {string} as {string} with args", (model, varname, json) => {
	// js version
	emit(`const ${normalize(varname)} = new ${model}(${json});`);
});

When("I create a new {string} as {string} with randomized {fields}",
(model, varname, fields) => {
	// js version
	const initialization = {};
	for (const k of fields) {
		initialization[k] = randomString();
	}
	emit(`const ${normalize(varname)} = new ${model}(${JSON.stringify(initialization)});`);
});

When("I save {string} with return value {string}", (obj, varname) => {
	// js version
	emit(`const ${normalize(varname)} = await DataStore.save(${obj});`);
});

When('I query {string} with {string} field {string} into {string}', (table, obj, prop, varname) => {
	// js version
	emit(`const ${normalize(varname)} = await DataStore.query(${table}, ${obj}.${prop});`);
});

When('I query {string} into {string} with a predicate', (table, varname, predicateJson) => {

	// TODO: supports only flat conditions currently. no and/or/not groups yet.

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

	const predicate = build(JSON.parse(predicateJson));

	emit(`const ${normalize(varname)} = await DataStore.query(${table}, ${predicate});`);
});

Then("{string} should have {string}", (varname, fieldname) => {
	// js veresion
	emit(`expect(${normalize(varname)}).toHave("${fieldname}");`);
});

Then("{string} field {string} should equal", (varname, fieldname, json) => {
	// js version
	emit(`expect(${normalize(varname)}.${fieldname}).toEqual(${json});`);
});

Then("{string} should be a single item", (varname) => {
	// js version
	emit(`expect(Array.isArray(${normalize(varname)})).toBe(false);`);
});

Then('{string} should be a list of {int}', (varname, length) => {
	// js version
	emit(`expect(${normalize(varname)}.length).toBe(${length});`);
});

Then('the first item of {string} should match {string}', (varname, expectedVarname) => {
	// js version
	emit(`expect(${normalize(varname)}).toMatch(${normalize(expectedVarname)});`);
});

Then('{string} {fields} should match {string} {fields}', (
	varname_actual,
	fields_actual,
	varname_expected,
	fields_expected
) => {
	for (let i = 0; i < fields_actual.length; i++) {
		const actual = `${normalize(varname_actual)}.${fields_actual[i]}`;
		const expected = `${normalize(varname_expected)}.${fields_expected[i]}`;
		emit(`expect(${actual}).toEqual(${expected});`);
	}
});

Then("nothing is on fire", () => {
	throw new Error("Not yet defined");
});
