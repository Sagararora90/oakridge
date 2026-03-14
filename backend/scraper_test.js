const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new tough.CookieJar();
const client = wrapper(axios.create({ jar }));

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

async function testFetch() {
  try {
    console.log('1. Fetching ROOT login page...');
    const response = await client.get('https://csoethp.codebrigade.in/', { headers: HEADERS });
    
    console.log('\n--- STATUS ---');
    console.log(response.status);
    
    if (response.data.includes('txtUsername') || response.data.includes('loginForm')) {
       console.log('\n[SUCCESS] Reached login page.');
       
       // Extract salt or CSRF if present
       const saltMatch = response.data.match(/var\s+salt\s*=\s*['"]([^'"]+)['"]/);
       if (saltMatch) {
         console.log('Found Salt:', saltMatch[1]);
       } else {
         console.log('No Salt JS variable found.');
       }

       // Look for form validation JS
       if (response.data.includes('md5')) {
         console.log('Login uses MD5 hashing on the client side.');
       }
    } else {
       console.log('\n[INFO] Did not find standard login fields. Check output manually.');
    }
  } catch (error) {
    console.error('Error fetching portal:', error.message);
  }
}

testFetch();
