import { useEffect, useState } from 'react';
import { Grid, Row, Col } from 'react-native-easy-grid';
import { Text, ScrollView } from 'react-native';

import getTests from './tests';

function App() {

  const [results, setResults] = useState([]);

  const tests = [];
  let suiteName = [];
  let testName = undefined;

  const getTestName = () => `${[...suiteName, testName].join(' > ')}`;

  /**
   * Describes a test collection.
   * 
   * For now, executes the test collection immediately.
   * 
   * @param {string} name 
   * @param {function} exec 
   */
  const describe = (name, exec) => {
    suiteName.push(name);
    exec()
    suiteName.pop();
  };

  describe.skip = () => {
    // TODO
  };
  
  /**
   * Describes a single test.
   * 
   * For now, executes that test immediately.
   * 
   * @param {string} name 
   * @param {function} exec 
   */
  const test = async (name, exec) => {
    testName = name;
    tests.push({
      name: getTestName(),
      exec
    });
    testName = undefined;
  };
  test.skip = () => {
    // TODO
  };

  const runAllTests = async () => {
    while (tests.length > 0) {
      const { name, exec } = tests.shift();
      testName = name;
      try {
        await exec();
  
        // if no errors, the test passes.
        setResults(existingResults => [
          ...existingResults,
          {
            name,
            outcome: "PASSED",
            error: ''
          }
        ]);
      } catch (error) {
        setResults(existingResults => [
          ...existingResults,
          {
            name,
            outcome: "FAILED",
            error: error.message
          }
        ]);
      }
      testName = undefined;
    }
  };

  useEffect(() => {
    setResults([]);
    getTests({describe, test, getTestName}).then(runAllTests);
  }, [])

  return (
    <ScrollView>
      <Grid>
        <Row>
          <Col size={3}><Text>Name</Text></Col>
          <Col size={1}><Text>Result</Text></Col>
        </Row>
        {results.map(result => (<>
          <Row>
            <Col size={3}><Text>{result.name}</Text></Col>
            <Col size={1}><Text>{result.outcome}</Text></Col>
          </Row>
          <Row>
            <Col size={4}><Text>{result.error}</Text></Col>
          </Row>
          </>))}
      </Grid>
    </ScrollView>
  );
}

export default App;

