const { execSync } = require('child_process');
const targets = require('./platforms');

for (const target of Object.keys(targets)) {
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
