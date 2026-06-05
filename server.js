const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 4173);
const PUBLIC_DIR = __dirname;
const MAX_BODY_BYTES = 64 * 1024;
const ALLOWED_DATE_VALUES = new Set([
  "2026-06-07",
  "2026-06-08",
  "2026-06-09",
  "2026-06-11",
]);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeEmailHtml(submission) {
  const rows = [
    ["Decision", submission.decision],
    ["Date idea", submission.datePlan],
    ["Date", submission.date],
    ["Time", submission.time],
    ["Note", submission.note],
    ["Submitted", submission.submittedAt],
  ].filter(([, value]) => value);

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <th align="left" style="padding: 8px 12px; border-bottom: 1px solid #eadfd2;">${escapeHtml(label)}</th>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eadfd2;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #18201f;">
      <h1 style="margin: 0 0 12px;">Second date response</h1>
      <table cellspacing="0" cellpadding="0" style="border-collapse: collapse; min-width: 320px;">
        ${tableRows}
      </table>
    </div>
  `;
}

function makeEmailText(submission) {
  return [
    `Decision: ${submission.decision}`,
    submission.datePlan ? `Date idea: ${submission.datePlan}` : "",
    submission.date ? `Date: ${submission.date}` : "",
    submission.time ? `Time: ${submission.time}` : "",
    submission.note ? `Note: ${submission.note}` : "",
    submission.submittedAt ? `Submitted: ${submission.submittedAt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.TO_EMAIL && process.env.FROM_EMAIL);
}

async function sendEmail(submission) {
  if (!isConfigured()) {
    console.log("Second date response received without email config:");
    console.log(makeEmailText(submission));
    return { mode: "preview" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [process.env.TO_EMAIL],
      reply_to: process.env.REPLY_TO_EMAIL || undefined,
      subject: `Second date answer: ${submission.decision}`,
      html: makeEmailHtml(submission),
      text: makeEmailText(submission),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return { mode: "email" };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function validateSubmission(submission) {
  if (!submission || typeof submission !== "object") {
    return "Missing submission.";
  }

  if (!["Yes", "No"].includes(submission.decision)) {
    return "Missing decision.";
  }

  if (submission.decision === "Yes") {
    if (!submission.datePlan || !submission.date || !submission.time) {
      return "Missing date details.";
    }

    if (!ALLOWED_DATE_VALUES.has(submission.date)) {
      return "Please choose an available date.";
    }
  }

  return "";
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const normalizedPath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/decision") {
    try {
      const rawBody = await readBody(request);
      const submission = JSON.parse(rawBody);
      const validationError = validateSubmission(submission);

      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }

      const result = await sendEmail(submission);
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      console.error(error);
      sendJson(response, 500, { error: "Unable to send response." });
    }
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(PORT, () => {
  const emailMode = isConfigured() ? "email enabled" : "preview mode";
  console.log(`Second date app running at http://localhost:${PORT} (${emailMode})`);
});
