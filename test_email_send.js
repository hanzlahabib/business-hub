
const http = require('http');

const data = JSON.stringify({
    to: 'test@example.com',
    subject: 'Test Email',
    body: 'This is a test email.',
    cvId: 'cv-123456789'
});

const options = {
    hostname: 'localhost',
    port: 3002, // Adjust if server runs on different port
    path: '/api/email/send',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('Response:', body));
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.write(data);
req.end();
