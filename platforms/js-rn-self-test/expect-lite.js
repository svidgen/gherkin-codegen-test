module.exports = `
/**
 * "Lite" implementation of jest expect style testing ... because
 * I thought I could just import \`expect\` from jest, and ... i guess i can't?
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
`;
