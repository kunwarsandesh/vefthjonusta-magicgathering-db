const { execSync } = require('child_process');
const { cleanDatabase, cleanupTestData } = require('./setup');

// Flag to track if tests succeed
let testsSucceeded = false;

async function runTests() {
  try {
    console.log('Starting tests...');
    
    // Clean up any existing test data first
    await cleanupTestData();
    
    // Run Mocha tests
    execSync('npx mocha --exit --timeout 10000 test/auth.test.js test/card.test.js test/inventory.test.js test/deck.test.js', { stdio: 'inherit' });
    
    // If we get here, tests passed
    testsSucceeded = true;
    console.log('\n✅ All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Tests failed');
    process.exit(1);
  } finally {
    // Clean up database if tests succeeded
    try {
      await cleanDatabase();
      console.log('\n🧹 Database cleaned up successfully');
    } catch (error) {
      console.error('\n❌ Error cleaning up database:', error.message);
    }
    
    // Exit process
    process.exit(testsSucceeded ? 0 : 1);
  }
}

// Run the tests
runTests();