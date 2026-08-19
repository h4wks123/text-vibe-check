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

    req.on("end", async () => {
      try {
        const data = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "Qwen/Qwen3.8-27B:floor",
              max_tokens: 1000,
              messages: [
                {
                  role: "user",
                  content: body,
                },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "rating",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      vibe_rating: {
                        type: "number",
                        description:
                          "From a scale of 1 to 100 percent, how likely do you think the content is AI generated? Respond with only a number.",
                      },
                    },
                  },
                  required: ["vibe_rating"],
                  additionalProperties: false,
                },
              },
            }),
          },
        );

        const jsonResponse = await data.json();
        console.log(jsonResponse);

        res.writeHead(201, headers);
        res.end(
          JSON.stringify({
            message: "Data received successfully!",
            received: jsonResponse,
          }),
        );
      } catch (error) {
        console.error(error);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:3000`);
});
