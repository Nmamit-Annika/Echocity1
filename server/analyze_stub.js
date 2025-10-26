// Simple Express stub that accepts an image_url and returns a mock analysis.
// Use this locally during development. To run:
//   node server/analyze_stub.js
// It will listen on http://localhost:8787

import { createServer } from 'http';

const port = process.env.PORT || 8787;

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/analyze') {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const image_url = payload.image_url;
        if (!image_url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'missing image_url' }));
          return;
        }

        console.log('Analyze request for', image_url);
        const lower = String(image_url).toLowerCase();
        const mock = lower.includes('pothole') ? 'pothole' : (lower.includes('trash') ? 'waste_overflow' : 'other');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ label: mock, confidence: 0.85, notes: 'mock analysis from local stub' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid json' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  }
});

server.listen(port, () => console.log(`Analyze stub listening on http://localhost:${port}`));
