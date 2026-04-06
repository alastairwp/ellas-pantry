#!/usr/bin/env node
const http = require("http");
const crypto = require("crypto");
const { execFile } = require("child_process");

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET;
const DEPLOY_SCRIPT = "/var/www/ellas-pantry/scripts/deploy.sh";
const REPO_DIR = "/var/www/ellas-pantry";
const BRANCH = "main";

if (!SECRET) {
  console.error("WEBHOOK_SECRET env var is required");
  process.exit(1);
}

let deploying = false;

function verify(body, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  const expected = `sha256=${hmac}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function deploy() {
  if (deploying) {
    console.log("Deploy already in progress, skipping");
    return;
  }
  deploying = true;
  console.log(`[${new Date().toISOString()}] Starting deploy...`);

  // Pull first, then run deploy script
  execFile("git", ["pull", "--ff-only"], { cwd: REPO_DIR }, (err, stdout, stderr) => {
    if (err) {
      console.error("git pull failed:", stderr);
      deploying = false;
      return;
    }
    console.log("git pull:", stdout.trim());

    execFile("bash", [DEPLOY_SCRIPT], { cwd: REPO_DIR, timeout: 300000 }, (err, stdout, stderr) => {
      deploying = false;
      if (err) {
        console.error("Deploy failed:", stderr || err.message);
        return;
      }
      console.log(`[${new Date().toISOString()}] Deploy complete`);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const signature = req.headers["x-hub-signature-256"];

    if (!verify(body, signature)) {
      console.warn("Invalid signature");
      res.writeHead(401);
      res.end("Invalid signature");
      return;
    }

    const event = req.headers["x-github-event"];
    if (event !== "push") {
      res.writeHead(200);
      res.end("Ignored event: " + event);
      return;
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end("Bad JSON");
      return;
    }

    if (payload.ref !== `refs/heads/${BRANCH}`) {
      res.writeHead(200);
      res.end("Ignored branch: " + payload.ref);
      return;
    }

    console.log(`Push to ${BRANCH} by ${payload.pusher?.name}`);
    res.writeHead(200);
    res.end("Deploying");
    deploy();
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Webhook listener on 127.0.0.1:${PORT}/webhook`);
});
