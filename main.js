const { execSync } = require('child_process');

for (const target of [
	'js-jest',
	'js-qunit'
]) {
	console.log(`generating ${target} ...`);
	execSync(`node generate.js ${target}`, {
		stdio: [
			'ignore',
			'inherit',
			'inherit'
		]
	});
	console.log(`${target} done.`);
}

console.log("All donesy.");
