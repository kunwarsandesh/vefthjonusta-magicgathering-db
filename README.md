# Debugging Tips for Test Failures

If you're experiencing test failures, here are some troubleshooting steps:

## 1. Authentication Tests Failing

The most common issue is with the login test failing (401 Unauthorized instead of 200 OK). This could be caused by:

- **Password Hashing Issue**: The test is creating a user with a hashed password, but the comparison might be failing. Check how bcrypt is implemented in your auth service.

```javascript
// Check your authService.js
// Make sure bcrypt.compare() is being used correctly
const isPasswordValid = await bcrypt.compare(password, user.password);
```

- **JWT Token Generation**: Verify that your JWT token is being generated properly.

- **Database Connection**: Ensure the test is connecting to the same database your app uses.

## 2. Duplicate User Errors

If you're seeing "Duplicate entry 'testuser' for key 'users.username'", it means:

- The cleanup between test runs isn't working properly
- Multiple test files are trying to create the same user

The fixed setup.js addresses this by cleaning up before initializing test data.

## 3. Manual Test Run

You can isolate and run individual test files:

```bash
npx mocha --exit --timeout 10000 test/auth.test.js
```

This helps identify which specific test is causing issues.

## 4. Check Database State

You can manually verify database state during testing:

```sql
-- Connect to your test database
SELECT * FROM users WHERE username = 'testuser';
```

## 5. Enable Debug Logging

Add more console.log statements to:
- Your test files 
- The setup.js file
- Your authentication service

Example:
```javascript
// Add to auth.test.js
console.log('Login response body:', res.body);
console.log('Login status:', res.status);
```

## 6. Check HTTP vs HTTPS

If you're using HTTPS in production but HTTP in tests, cookie-related authentication might fail. Make sure:

- Cookies are being properly set and read
- Token is being properly passed in the Authorization header

## 7. Environment-Specific Issues

Make sure your .env file is properly loaded during testing. Add:

```javascript
// Add at the top of test/index.js
require('dotenv').config();
```

These steps should help identify and resolve the issues with your test suite.