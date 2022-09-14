import { Amplify, API, DataStore, Predicates } from 'aws-amplify';
import {
	Customer,
	Order,
	LineItem,
	Product,
	HasOneParent,
	DefaultPKParent,
	DefaultPKChild,
	CompositePKParent,
	CompositePKChild,
	ImplicitChild,
	StrangeExplicitChild,
	ChildSansBelongsTo
} from './src/models';
import * as mutations from './src/graphql/mutations';
import awsconfig from './src/aws-exports';

Amplify.configure(awsconfig);

const makeID = () => {
    const chars = [];
    for (let i = 0; i < 32; i++) {
        chars.push(
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        );
    }
    return chars.join('');
};

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

/**
 * "Lite" implementation of jest expect style testing ... because
 * I thought I could just import `expect` from jest, and ... i guess i can't?
 * 
 * Anyway. Super quick, lite hackish bridge until I decide on something better.
 * 
 * @param {*} value 
 * @returns 
 */
const expect = (value) => {
    return {
        toBeDefined: () => {
            return value !== undefined;
        },
        toBe: (expected) => {
          return value === expected;
        },
        toEqual: (expected) => {
            if (Array.isArray(expected)) {
                expect(value.length).toEqual(expected.length);
                for (let i = 0; i < expected.length; i++) {
                    expect(value[i]).toEqual(expected[i]);
                }
            } else if (typeof expected === 'object') {
                expect(Object.keys(value)).toEqual(Object.keys(expected));
                for (const key of Object.keys(expected)) {
                    expect(value[key]).toEqual(expected[key]);
                }
            } else {
                return value === expected;
            }
        },
        toBeGreaterThanOrEqual: (expected) => {
          return value >= expected;
        },
        toBeFalsy: () => {
            return !value;
        },
        rejects: {
            toThrow: async () => {
                try {
                    await value();
                } catch (err) {
                    return true;
                }

                // didn't throw!
                throw new Error("Expected and error");
            }
        }
    }
}

export default async function({ describe, test, getTestName }) {

    Amplify.configure(awsconfig);

    await DataStore.clear();
    await new Promise(unsleep => setTimeout(unsleep, 3000));

	for (const M of [
		Customer,
		Order,
		LineItem,
		Product,
		HasOneParent,
		DefaultPKParent,
		DefaultPKChild,
		CompositePKParent,
		CompositePKChild,
		ImplicitChild,
		StrangeExplicitChild,
		ChildSansBelongsTo
	]) {
		await DataStore.delete(M, Predicates.ALL);
	}

	// ***** <INDEX /> *****

};
