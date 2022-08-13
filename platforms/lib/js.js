module.exports = {
	helpers:
`
const waitForObserve = ({
	model,
	predicate = undefined,
	count = 1,
	timeout = 5000
}) => new Promise((resolve, reject) => {
	let timer;
	const events = [];

	const subscription = DataStore.observe(model, predicate).subscribe(event => {
		events.push(event);
		if (events.length === count) {
			subscription.unsubscribe();
			clearTimeout(timer);
			resolve(events);
		}
	});

	timer = setTimeout(() => {
		subscription.unsubscribe();
		reject("observe() timed out");
	}, timeout);
});

const waitForSnapshots = ({
	model,
	predicate = undefined,
	time = 3000
}) => new Promise(resolve => {
	let timer;
	const snapshots = [];

	const subscription = DataStore.observeQuery(model, predicate).subscribe(({items}) => {
		snapshots.push(items);
	});

	timer = setTimeout(() => {
		subscription.unsubscribe();
		resolve(snapshots);
	}, time);
});
`
};
