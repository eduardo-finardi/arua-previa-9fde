// Servidor local só para ver o site durante o desenvolvimento: node server.js
// Em produção basta publicar os arquivos (index.html, css, js, img, video) em qualquer hospedagem.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3020;
const ROOT = __dirname;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Não encontrado");
        return;
      }
      const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
      if (range) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
        res.writeHead(206, {
          "Content-Type": type,
          "Content-Range": `bytes ${start}-${end}/${st.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Type": type,
          "Content-Length": st.size,
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-cache",
        });
        fs.createReadStream(file).pipe(res);
      }
    });
  })
  .listen(PORT, () => console.log(`Quadriciclo Aruã em http://localhost:${PORT}`));
