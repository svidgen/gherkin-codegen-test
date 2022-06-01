const { defineParameterType, After, Before, Given, When, Then } = require('@cucumber/cucumber');

/**
 * to import from PLATFORM scope
 */


// TODO: change to varname or something
function normalize(name) {
	return name.split(/\s+/g).join('_');
}

// hoping this runs before each Scenario
Before((world) => {
	switch (PLATFORM) {
		case 'js':
			// emit(`before world js: ${JSON.stringify(world, null, 2)}`);
			emit(`it("${world.pickle.uri}: ${world.pickle.name}", async () => {`);
			break;
		case 'ios':
			emit(`before world ios: ${JSON.stringify(world, null, 2)}`);
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
			emit('Amplify.configure({});');
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
			emit(`DataStore.clear();`);
			break;
		case 'ios':
			emit(`clean db world ios`);
			break;
		default:
			throw new Error('clean: Invalid PLATFORM: ' + PLATFORM);
	}
});

Given("a new client schema", schema_graphql => {
	emit('just testing:\n' + schema_graphql);
});

Given("I import {string} from models", model => {
	switch (PLATFORM) {
		case 'js':
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

When("I save {string} with return value {string}", (obj, varname) => {
	// js version
	emit(`const ${normalize(varname)} = await DataStore.save(${obj});`);
});

Then("{string} should have {string}", (varname, fieldname) => {
	// js veresion
	emit(`expect(${normalize(varname)}).toHave(${fieldname});`);
});

Then("{string} field {string} should equal", (varname, fieldname, json) => {
	// js version
	emit(`expect(${normalize(varname)}.${fieldname}).toEqual(${json});`);
});

Then("nothing is on fire", () => {
	throw new Error("Not yet defined");
});
