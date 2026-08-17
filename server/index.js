const http = require("http");

const server = http.createServer((req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": process.env.CHROME_URL,
    "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": 2592000,
  };

  const { url, method } = req;

  if (method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (url == "/text" && method == "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      res.writeHead(201, headers);
      res.end(
        JSON.stringify({
          message: "Data received successfully!",
          received: JSON.parse(body || "{}"),
        }),
      );
    });
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:3000`);
});
