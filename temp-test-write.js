const http = require('https');

// Helper to make request
function request(url, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        ...headers
      }
    };
    
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody
        });
      });
    });
    
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTest() {
  console.log("1. Logging in...");
  const loginRes = await request(
    'https://www.technogrips-vienna.at/admin/index.php',
    'POST',
    {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    'username=joachim.nauen%40gmail.com&password=technogrips-vienna'
  );
  
  console.log(`Login status: ${loginRes.statusCode}`);
  const cookies = loginRes.headers['set-cookie'];
  if (!cookies) {
    console.error("❌ Login failed: No cookies returned!");
    return;
  }
  const sessionCookie = cookies[0].split(';')[0];
  console.log(`Session Cookie: ${sessionCookie}`);

  console.log("\n2. Making a PUT request to update tracking.title...");
  const putBody = JSON.stringify({
    updates: [
      {
        section: 'tracking',
        key: 'title',
        value_de: 'Kran-Simulator Test',
        value_en: 'Crane Simulator Test'
      }
    ]
  });
  
  const putRes = await request(
    'https://www.technogrips-vienna.at/api/content.php',
    'PUT',
    {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    },
    putBody
  );
  
  console.log(`PUT Status Code: ${putRes.statusCode}`);
  console.log(`PUT Response Body: ${putRes.body}`);

  console.log("\n3. Verifying if update is visible in GET content...");
  const getRes = await request('https://www.technogrips-vienna.at/api/content.php', 'GET');
  const getObj = JSON.parse(getRes.body);
  console.log(`GET tracking.title de value: ${getObj.tracking?.title?.de}`);
  
  if (getObj.tracking?.title?.de === 'Kran-Simulator Test') {
    console.log("\n✅ Success! Database writes are persistent and writable on production server!");
    
    // Revert back to original
    console.log("\nReverting back to original title...");
    await request(
      'https://www.technogrips-vienna.at/api/content.php',
      'PUT',
      {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      JSON.stringify({
        updates: [
          {
            section: 'tracking',
            key: 'title',
            value_de: 'Kran-Interaktives Menü',
            value_en: 'Crane Interactive Menu'
          }
        ]
      })
    );
  } else {
    console.error("\n❌ Error: Database did not update or persist!");
  }
}

runTest();
