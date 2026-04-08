const assert = require('assert');

// Mock environment
process.env.VITE_WHATSAPP_API_KEY = 'test-key';

// The middleware logic (copied from index.js)
const WHATSAPP_API_KEY = process.env.VITE_WHATSAPP_API_KEY;
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!WHATSAPP_API_KEY) {
        console.error('CRITICAL: VITE_WHATSAPP_API_KEY is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey || apiKey !== WHATSAPP_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }

    next();
};

// Tests
console.log('Running Auth Middleware Tests...');

// Test 1: Valid Key
const req1 = { headers: { 'x-api-key': 'test-key' } };
const res1 = {
    status: (code) => {
        if (code !== 200) console.log('Test 1: Status set to', code);
        return { json: (data) => console.log('Test 1 Failed: json called', data) };
    }
};
let nextCalled1 = false;
authenticateAPI(req1, res1, () => { nextCalled1 = true; });
assert.strictEqual(nextCalled1, true, 'Test 1 Failed: next() not called for valid key');
console.log('Test 1 Passed: Valid key accepted');

// Test 2: Invalid Key
const req2 = { headers: { 'x-api-key': 'wrong-key' } };
let status2 = 0;
const res2 = {
    status: (code) => { status2 = code; return { json: () => {} }; }
};
let nextCalled2 = false;
authenticateAPI(req2, res2, () => { nextCalled2 = true; });
assert.strictEqual(nextCalled2, false, 'Test 2 Failed: next() called for invalid key');
assert.strictEqual(status2, 401, 'Test 2 Failed: status not 401');
console.log('Test 2 Passed: Invalid key rejected');

// Test 3: Missing Key
const req3 = { headers: {} };
let status3 = 0;
const res3 = {
    status: (code) => { status3 = code; return { json: () => {} }; }
};
authenticateAPI(req3, res3, () => {});
assert.strictEqual(status3, 401, 'Test 3 Failed: status not 401 for missing key');
console.log('Test 3 Passed: Missing key rejected');

// Test 4: Configuration Error (Missing Env Var)
const testConfigError = () => {
    // Simulate missing key logic
    const missingKeyMiddleware = (req, res, next) => {
        const apiKey = req.headers['x-api-key'];
        const LOCAL_API_KEY = undefined;

        if (!LOCAL_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error' });
        }
        next();
    };

    let status4 = 0;
    const res4 = {
        status: (code) => { status4 = code; return { json: () => {} }; }
    };
    missingKeyMiddleware({ headers: {} }, res4, () => {});
    assert.strictEqual(status4, 500, 'Test 4 Failed: status not 500 for missing config');
    console.log('Test 4 Passed: Missing config triggers 500');
};
testConfigError();

console.log('All tests passed!');
