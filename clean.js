const { execSync } = require('child_process');
const process = require('process');

const rimraf = require('rimraf');

const ROOT = process.cwd();

console.log("Removing amplify backends ...");

for (const target of [
	'js-jest',
	'js-qunit',
	'js-rn-self-test'
]) {
	try {
		console.log(`Removing backend for ${target} ...`);
		process.chdir(`${ROOT}/dist/${target}`);

		let amplifyDeleteOutput = '';
		try {
			amplifyDeleteOutput = execSync(`amplify delete --force`, {
				stdio: [
					'ignore',
					'inherit',
					'inherit'
				]
			});
		} catch (error) {
			console.error([
				`We tried to delete an Amplify backend for ${target}, but couldn't.`
				`If a backend for ${target} exists, you need to delete it manually.`
			].join('\n'));
		}


		console.log(`${target} done.`);
	} catch (error) {
		if (error.message.includes('no such file')) {
			console.log(`Target ${target} is already clean!`);
		} else {
			console.error(`Cleaning error in ${target}`, error);
		}
	} finally {
		process.chdir(ROOT);
	}
}

console.log('Removing `dist` artifacts ...');
rimraf.sync(`${ROOT}/dist`);

console.log("All donesy.");
