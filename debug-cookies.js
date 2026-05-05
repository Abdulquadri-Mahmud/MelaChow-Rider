/**
 * Cookie Debugging Script
 * Run this in browser console to diagnose cookie issues
 */

console.log('%c🔍 COOKIE DIAGNOSTICS', 'color: purple; font-size: 18px; font-weight: bold');
console.log('='.repeat(60));

// 1. Check all cookies
console.log('\n%c1️⃣ All Cookies:', 'color: blue; font-weight: bold');
const allCookies = document.cookie;
console.log(allCookies || '(No cookies found)');

// 2. Parse and display cookies
console.log('\n%c2️⃣ Parsed Cookies:', 'color: blue; font-weight: bold');
if (allCookies) {
    allCookies.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        console.log(`  ${name}: ${value?.substring(0, 50)}${value?.length > 50 ? '...' : ''}`);
    });
} else {
    console.log('  (None)');
}

// 3. Check for vendorToken specifically
console.log('\n%c3️⃣ Vendor Token Check:', 'color: blue; font-weight: bold');
const hasVendorToken = allCookies.includes('vendorToken');
console.log(`  Has vendorToken: ${hasVendorToken ? '✅ YES' : '❌ NO'}`);

// 4. Check localStorage (should NOT have token)
console.log('\n%c4️⃣ LocalStorage Check:', 'color: blue; font-weight: bold');
const vendorPayload = localStorage.getItem('VendorPayload');
const vendorToken = localStorage.getItem('vendorToken');
console.log(`  VendorPayload: ${vendorPayload ? '⚠️ EXISTS (should be removed)' : '✅ Not present'}`);
console.log(`  vendorToken: ${vendorToken ? '⚠️ EXISTS (should be removed)' : '✅ Not present'}`);

// 5. Check current URL and environment
console.log('\n%c5️⃣ Environment:', 'color: blue; font-weight: bold');
console.log(`  Current URL: ${window.location.href}`);
console.log(`  Protocol: ${window.location.protocol}`);
console.log(`  Domain: ${window.location.hostname}`);
console.log(`  Port: ${window.location.port}`);

// 6. Test API request with credentials
console.log('\n%c6️⃣ Testing API Request...', 'color: blue; font-weight: bold');
fetch('http://localhost:3001/api/vendors/get-vendor', {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(async response => {
        console.log(`  Status: ${response.status} ${response.statusText}`);
        console.log(`  Headers:`, response.headers);

        // Check if Set-Cookie header is present (won't be visible in browser)
        const data = await response.json();
        console.log(`  Response:`, data);

        if (response.status === 401) {
            console.error('  ❌ UNAUTHORIZED - Cookie not being sent or invalid');
        } else if (response.ok) {
            console.log('  ✅ SUCCESS - Cookie is working');
        }
    })
    .catch(error => {
        console.error('  ❌ ERROR:', error.message);
    });

// 7. Check axios configuration
console.log('\n%c7️⃣ Checking Axios Config...', 'color: blue; font-weight: bold');
setTimeout(() => {
    try {
        // Try to access axios instance if available
        const axiosCheck = `
        Check these in your code:
        - axios.defaults.withCredentials should be true
        - axios.defaults.baseURL should be http://localhost:3001/api
        - No Authorization headers should be set manually
        `;
        console.log(axiosCheck);
    } catch (e) {
        console.log('  (Axios not directly accessible in console)');
    }
}, 1000);

console.log('\n' + '='.repeat(60));
console.log('%c📋 NEXT STEPS:', 'color: orange; font-weight: bold');
console.log('1. Check if vendorToken cookie exists above');
console.log('2. If missing, check backend response after login');
console.log('3. If present but 401, check cookie domain/path');
console.log('4. Open DevTools → Application → Cookies to see HttpOnly cookies');
console.log('='.repeat(60));
