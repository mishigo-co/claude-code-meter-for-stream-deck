import { createServer, IncomingMessage, ServerResponse } from "node:http";

export interface Update {
  tokens?: number;
  isThinking?: boolean;
  reset?: boolean;
  complete?: boolean;
}

export function startServer(port: number, onUpdate: (u: Update) => void): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200).end("ok");
      return;
    }
    if (req.method === "POST" && req.url === "/update") {
      let body = "";
      req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const update = JSON.parse(body) as Update;
          onUpdate(update);
          res.writeHead(200).end("ok");
        } catch {
          res.writeHead(400).end("bad json");
        }
      });
      return;
    }
    res.writeHead(404).end("not found");
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Context Meter server listening on http://127.0.0.1:${port}`);
  });
}
