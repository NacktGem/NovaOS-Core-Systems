import express from 'express';\nimport crypto from 'crypto';\nimport fs from 'fs';\nimport jwt from 'jsonwebtoken';\nimport fetch from 'node-fetch';\nimport dotenv from 'dotenv';\n\ndotenv.config(); // Load .env variables\n\nconst app = express();\nconst port = 443; // Use 443 if running behind a proxy/Cloudflare\napp.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }));\n\nconst {\n  GITHUB_APP_ID,\n  GITHUB_APP_INSTALLATION_ID,\n  GITHUB_APP_WEBHOOK_SECRET,\n  GITHUB_APP_PRIVATE_KEY_PATH\n} = process.env;\n\nconst PRIVATE_KEY = fs.readFileSync(GITHUB_APP_PRIVATE_KEY_PATH, 'utf8');\n\n// -- Verify webhook signature\nfunction verifySignature(req) {\n  const signature = req.headers['x-hub-signature-256'];\n  const digest = 'sha256=' + crypto.createHmac('sha256', GITHUB_APP_WEBHOOK_SECRET)\n    .update(req.rawBody).digest('hex');\n  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));\n}\n\n// -- GitHub Webhook Handler\napp.post('/api/github/webhook', (req, res) => {\n  if (!verifySignature(req)) return res.status(401).send('Invalid signature');\n\n  const event = req.headers['x-github-event'];\n  console.log(`🚀 Webhook received: ${event}`);\n  console.log(JSON.stringify(req.body, null, 2));\n\n  // TODO: Dispatch to agents (Nova, Lyra) or automation\n  res.send('OK');\n});\n\n// -- Generate App JWT\nfunction createJWT() {\n  const now = Math.floor(Date.now() / 1000);\n  return jwt.sign(\n    { iat: now - 60, exp: now + 600, iss: GITHUB_APP_ID },\n    PRIVATE_KEY,\n    { algorithm: 'RS256' }\n  );\n}\n\n// -- Exchange JWT for installation access token\nasync function getInstallationToken() {\n  const jwtToken = createJWT();\n  const res = await fetch(`https://api.github.com/app/installations/${GITHUB_APP_INSTALLATION_ID}/access_tokens`, {\n    method: 'POST',\n    headers: {\n      Authorization: `Bearer ${jwtToken}`,\n      Accept: 'application/vnd.github+json'\n    }\n  });\n  const data = await res.json();\n  return data.token;\n}\n\n// -- Route for token debugging\napp.get('/github/token', async (req, res) => {\n  const token = await getInstallationToken();\n  res.send({ token });\n});\n\napp.listen(port, () => {\n  console.log(`🧠 NovaOS GitHub Agent listening on https://api.blackrosecollective.studio`);\n});\n
import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

const app = express();
const port = 443; // Use 443 if running behind a proxy/Cloudflare
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }));

const {
    GITHUB_APP_ID,
    GITHUB_APP_INSTALLATION_ID,
    GITHUB_APP_WEBHOOK_SECRET,
    GITHUB_APP_PRIVATE_KEY_PATH
  } = process.env;

const PRIVATE_KEY = fs.readFileSync(GITHUB_APP_PRIVATE_KEY_PATH, 'utf8');

// -- Verify webhook signature
function verifySignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    const digest = 'sha256=' + crypto.createHmac('sha256', GITHUB_APP_WEBHOOK_SECRET)
      .update(req.rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

// -- GitHub Webhook Handler
app.post('/api/github/webhook', (req, res) => {
    if (!verifySignature(req)) return res.status(401).send('Invalid signature');

           const event = req.headers['x-github-event'];
    console.log(`🚀 Webhook received: ${event}`);
    console.log(JSON.stringify(req.body, null, 2));

           // TODO: Dispatch to agents (Nova, Lyra) or automation
           res.send('OK');
  });

// -- Generate App JWT
function createJWT() {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
          { iat: now - 60, exp: now + 600, iss: GITHUB_APP_ID },
          PRIVATE_KEY,
          { algorithm: 'RS256' }
        );
  }

// -- Exchange JWT for installation access token
async function getInstallationToken() {
    const jwtToken = createJWT();
    const res = await fetch(`https://api.github.com/app/installations/${GITHUB_APP_INSTALLATION_ID}/access_tokens`, {
          method: 'POST',
          headers: {
                  Authorization: `Bearer ${jwtToken}`,
                  Accept: 'application/vnd.github+json'
                }
        });
    const data = await res.json();
    return data.token;
  }

// -- Route for token debugging
app.get('/github/token', async (req, res) => {
    const token = await getInstallationToken();
    res.send({ token });
  });

app.listen(port, () => {
    console.log(`🧠 NovaOS GitHub Agent listening on https://api.blackrosecollective.studio`);
  });
