const { spawn } = require('child_process');
const http = require('http');

const server = spawn('npm', ['run', 'start', '--', '-p', '3001'], { stdio: 'pipe' });

server.stdout.on('data', async (data) => {
  const msg = data.toString();
  console.log(msg);
  if (msg.includes('Ready in') || msg.includes('started server on') || msg.includes('Ready on')) {
    console.log("Server is ready. Fetching page...");
    
    // Fetch HTML
    http.get('http://localhost:3001/dashboard/menu/view', {
      headers: { 'Cookie': 'kravy_auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWNmNWRlMTM2NWFhY2VhYTU4ZTI1ZDMiLCJpYXQiOjE3ODkzNjQyNjYsImV4cCI6MTc4OTQ1MDY2Nn0.eny_dTwa7yB6EBpRZOZDaSQTiOYSZ12uvN7j6FcTxfY' }
    }, (res) => {
      console.log("HTML Status:", res.statusCode);
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log("HTML length:", body.length);
        const match = body.match(/_next\/static\/chunks\/app\/dashboard\/layout-[a-z0-9]+\.js/g);
        console.log("HTML Layout Chunks referenced:", match);
        
        if (match && match.length > 0) {
          console.log("Fetching chunk:", match[0]);
          http.get('http://localhost:3001/' + match[0], (chunkRes) => {
            console.log("Chunk Status:", chunkRes.statusCode);
            process.kill(-server.pid);
            process.exit(0);
          });
        } else {
          console.log("No layout chunk found.");
          process.kill(-server.pid);
          process.exit(0);
        }
      });
    });
  }
});

server.stderr.on('data', data => console.error(data.toString()));
