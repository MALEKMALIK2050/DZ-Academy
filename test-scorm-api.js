const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/supports/upload-scorm',
  method: 'POST',
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    console.log(`BODY: ${data.substring(0, 500)}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
