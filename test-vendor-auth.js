/**
 * Vendor Dashboard Authentication Testing Script
 * 
 * This script tests the cookie-based authentication migration for vendor dashboard.
 * It verifies that all API calls work without query-based IDs.
 * 
 * Test Email: adeyemicodes@gmail.com
 * OTP: Will be provided by user when sent
 */

const VENDOR_EMAIL = 'adeyemicodes@gmail.com';
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001/api';

// Test results tracking
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const message = `${status} - ${testName}${details ? ': ' + details : ''}`;

    if (passed) {
        testResults.passed.push(testName);
        console.log(`%c${message}`, 'color: green; font-weight: bold');
    } else {
        testResults.failed.push(testName);
        console.error(`%c${message}`, 'color: red; font-weight: bold');
    }
}

function logWarning(message) {
    testResults.warnings.push(message);
    console.warn(`%c⚠️  WARNING - ${message}`, 'color: orange; font-weight: bold');
}

function logInfo(message) {
    console.log(`%cℹ️  ${message}`, 'color: blue');
}

// Helper to wait for user input
function waitForUserInput(message) {
    return new Promise(resolve => {
        const response = prompt(message);
        resolve(response);
    });
}

// Helper to check if cookies are present
function checkCookies() {
    const cookies = document.cookie;
    const hasVendorToken = cookies.includes('vendorToken');
    return { cookies, hasVendorToken };
}

// Helper to intercept and log network requests
const interceptedRequests = [];
const originalFetch = window.fetch;

function setupNetworkInterceptor() {
    window.fetch = async function (...args) {
        const [url, options] = args;
        const requestInfo = {
            url: url.toString(),
            method: options?.method || 'GET',
            credentials: options?.credentials,
            timestamp: new Date().toISOString()
        };

        interceptedRequests.push(requestInfo);

        const response = await originalFetch.apply(this, args);
        return response;
    };
}

function restoreNetworkInterceptor() {
    window.fetch = originalFetch;
}

// Test Suite
async function runVendorAuthTests() {
    console.clear();
    console.log('%c🧪 VENDOR DASHBOARD AUTHENTICATION TEST SUITE', 'color: purple; font-size: 20px; font-weight: bold');
    console.log('%c' + '='.repeat(60), 'color: purple');
    console.log('');

    try {
        // Setup
        setupNetworkInterceptor();

        // Test 1: Initial State Check
        logInfo('Test 1: Checking initial authentication state...');
        const initialCookies = checkCookies();
        if (initialCookies.hasVendorToken) {
            logWarning('Vendor token already exists. Recommend clearing cookies first.');
            const shouldContinue = confirm('Vendor token found. Clear cookies and continue?');
            if (shouldContinue) {
                document.cookie.split(";").forEach(c => {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                logInfo('Cookies cleared');
            }
        }
        logTest('Initial State Check', true);

        // Test 2: Navigate to Login Page
        logInfo('Test 2: Navigating to vendor login page...');
        if (window.location.pathname !== '/vendors/auth/login') {
            logInfo('Redirecting to login page...');
            window.location.href = `${BASE_URL}/vendors/auth/login`;
            return; // Script will need to be re-run after redirect
        }
        logTest('Login Page Navigation', true);

        // Test 3: Check Login Form
        logInfo('Test 3: Checking login form...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page load
        const emailInput = document.querySelector('input[type="email"]');
        const submitButton = document.querySelector('button[type="submit"]');

        if (!emailInput || !submitButton) {
            logTest('Login Form Check', false, 'Form elements not found');
            return;
        }
        logTest('Login Form Check', true);

        // Test 4: Submit Login
        logInfo('Test 4: Submitting login form...');
        emailInput.value = VENDOR_EMAIL;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));

        logInfo(`Email set to: ${VENDOR_EMAIL}`);
        logInfo('Please click the login button manually and wait for OTP...');

        alert('Please click the Sign In button now. Click OK to continue after you see the OTP verification page.');

        // Test 5: OTP Verification
        logInfo('Test 5: Waiting for OTP verification page...');
        if (!window.location.pathname.includes('verify')) {
            logWarning('Not on verification page. Please navigate there manually.');
        }

        const otp = await waitForUserInput('Enter the 6-digit OTP you received:');
        if (!otp || otp.length !== 6) {
            logTest('OTP Input', false, 'Invalid OTP format');
            return;
        }

        logInfo('OTP received. Please enter it in the form and submit...');
        alert('Please enter the OTP in the form and click Verify. Click OK after verification completes.');

        // Test 6: Check Cookie After Login
        logInfo('Test 6: Verifying authentication cookie...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const postLoginCookies = checkCookies();

        if (!postLoginCookies.hasVendorToken) {
            logTest('Cookie Verification', false, 'vendorToken cookie not found');
            logInfo('Available cookies: ' + postLoginCookies.cookies);
            return;
        }
        logTest('Cookie Verification', true, 'vendorToken cookie present');

        // Test 7: Navigate to Dashboard
        logInfo('Test 7: Navigating to vendor dashboard...');
        if (!window.location.pathname.includes('/vendors/dashboard')) {
            window.location.href = `${BASE_URL}/vendors/dashboard`;
            alert('Script will continue after dashboard loads. Re-run the script on dashboard page.');
            return;
        }
        logTest('Dashboard Navigation', true);

        // Test 8: Check Network Requests for Query Parameters
        logInfo('Test 8: Analyzing network requests...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for API calls

        const vendorRequests = interceptedRequests.filter(req =>
            req.url.includes('/vendors/')
        );

        logInfo(`Found ${vendorRequests.length} vendor API requests`);

        const requestsWithIdParam = vendorRequests.filter(req =>
            req.url.includes('?id=') || req.url.includes('&id=')
        );

        if (requestsWithIdParam.length > 0) {
            logTest('Query Parameter Check', false, `Found ${requestsWithIdParam.length} requests with ?id= parameter`);
            requestsWithIdParam.forEach(req => {
                console.error('❌ Request with ID param:', req.url);
            });
        } else {
            logTest('Query Parameter Check', true, 'No query-based IDs found');
        }

        // Test 9: Check Credentials Configuration
        logInfo('Test 9: Checking credentials configuration...');
        const requestsWithoutCredentials = vendorRequests.filter(req =>
            !req.credentials || req.credentials !== 'include'
        );

        if (requestsWithoutCredentials.length > 0) {
            logWarning(`${requestsWithoutCredentials.length} requests missing credentials: 'include'`);
        }
        logTest('Credentials Configuration', requestsWithoutCredentials.length === 0);

        // Test 10: Test Specific Endpoints
        logInfo('Test 10: Testing specific vendor endpoints...');

        const endpointsToTest = [
            { name: 'Get Vendor Details', url: '/vendors/get-vendor' },
            { name: 'Get Wallet', url: '/vendors/get-wallet' },
            { name: 'Get Orders', url: '/vendors/orders' }
        ];

        for (const endpoint of endpointsToTest) {
            try {
                const response = await fetch(`${API_URL}${endpoint.url}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok && data.success !== false) {
                    logTest(`Endpoint: ${endpoint.name}`, true, `Status ${response.status}`);
                } else {
                    logTest(`Endpoint: ${endpoint.name}`, false, `Status ${response.status} - ${data.message || 'Unknown error'}`);
                }
            } catch (error) {
                logTest(`Endpoint: ${endpoint.name}`, false, error.message);
            }
        }

        // Test 11: Check React Query Cache
        logInfo('Test 11: Checking React Query cache...');
        const queryCache = window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.queryCache;
        if (queryCache) {
            const vendorQuery = queryCache.getAll().find(q =>
                q.queryKey.includes('vendors') || q.queryKey.includes('vendor')
            );

            if (vendorQuery) {
                logTest('React Query Cache', true, 'Vendor data cached');
                logInfo('Cached data:', vendorQuery.state.data);
            } else {
                logWarning('No vendor data found in React Query cache');
            }
        } else {
            logWarning('React Query DevTools not available');
        }

        // Test 12: Test Navigation to Other Pages
        logInfo('Test 12: Testing navigation to other dashboard pages...');
        const pagesToTest = [
            '/vendors/my-foods',
            '/vendors/order',
            '/vendors/transactions',
            '/vendors/profile'
        ];

        logInfo('Please manually navigate to these pages and verify they load:');
        pagesToTest.forEach(page => logInfo(`  - ${page}`));

        const navTestPassed = confirm('Did all dashboard pages load successfully?');
        logTest('Dashboard Navigation Test', navTestPassed);

        // Test 13: Test Logout
        logInfo('Test 13: Testing logout functionality...');
        const testLogout = confirm('Do you want to test logout? (This will end the session)');

        if (testLogout) {
            // Find logout button (adjust selector as needed)
            logInfo('Please click the logout button manually...');
            alert('Click logout, then click OK after redirect to login page');

            const postLogoutCookies = checkCookies();
            if (postLogoutCookies.hasVendorToken) {
                logTest('Logout Cookie Cleanup', false, 'vendorToken still present after logout');
            } else {
                logTest('Logout Cookie Cleanup', true, 'vendorToken cleared');
            }

            if (window.location.pathname.includes('/vendors/auth/login')) {
                logTest('Logout Redirect', true, 'Redirected to login page');
            } else {
                logTest('Logout Redirect', false, 'Not redirected to login page');
            }
        }

    } catch (error) {
        console.error('Test suite error:', error);
        logTest('Test Suite Execution', false, error.message);
    } finally {
        // Cleanup
        restoreNetworkInterceptor();

        // Print Summary
        console.log('');
        console.log('%c' + '='.repeat(60), 'color: purple');
        console.log('%c📊 TEST SUMMARY', 'color: purple; font-size: 18px; font-weight: bold');
        console.log('%c' + '='.repeat(60), 'color: purple');
        console.log('');
        console.log(`%c✅ Passed: ${testResults.passed.length}`, 'color: green; font-weight: bold');
        console.log(`%c❌ Failed: ${testResults.failed.length}`, 'color: red; font-weight: bold');
        console.log(`%c⚠️  Warnings: ${testResults.warnings.length}`, 'color: orange; font-weight: bold');
        console.log('');

        if (testResults.passed.length > 0) {
            console.log('%cPassed Tests:', 'color: green; font-weight: bold');
            testResults.passed.forEach(test => console.log(`  ✅ ${test}`));
            console.log('');
        }

        if (testResults.failed.length > 0) {
            console.log('%cFailed Tests:', 'color: red; font-weight: bold');
            testResults.failed.forEach(test => console.log(`  ❌ ${test}`));
            console.log('');
        }

        if (testResults.warnings.length > 0) {
            console.log('%cWarnings:', 'color: orange; font-weight: bold');
            testResults.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
            console.log('');
        }

        // Overall Result
        const overallPassed = testResults.failed.length === 0;
        const overallStatus = overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
        const overallColor = overallPassed ? 'green' : 'red';

        console.log('%c' + '='.repeat(60), 'color: purple');
        console.log(`%c${overallStatus}`, `color: ${overallColor}; font-size: 20px; font-weight: bold`);
        console.log('%c' + '='.repeat(60), 'color: purple');

        // Export results
        window.vendorAuthTestResults = testResults;
        console.log('');
        console.log('%cTest results saved to: window.vendorAuthTestResults', 'color: blue');
    }
}

// Auto-run or manual trigger
console.log('%c🧪 Vendor Authentication Test Script Loaded', 'color: green; font-size: 16px; font-weight: bold');
console.log('%cRun: runVendorAuthTests()', 'color: blue; font-size: 14px');
console.log('');
console.log('This script will test:');
console.log('  ✓ Cookie-based authentication');
console.log('  ✓ Removal of query-based IDs');
console.log('  ✓ API endpoint functionality');
console.log('  ✓ Dashboard navigation');
console.log('  ✓ Logout functionality');
console.log('');
console.log(`Test Email: ${VENDOR_EMAIL}`);
console.log('');

// Export function to global scope
window.runVendorAuthTests = runVendorAuthTests;
