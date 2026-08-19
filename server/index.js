const http = require("http");

function getRating(openRouterResponse) {
  const content = openRouterResponse?.choices?.[0]?.message?.content;
  const parsedContent =
    typeof content === "string" ? JSON.parse(content) : content;
  const rating = parsedContent?.vibe_rating;

  if (!Number.isInteger(rating) || rating < 1 || rating > 100) {
    throw new Error("The model returned a rating outside the 1-100 range.");
  }

  return rating;
}

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
                  role: "system",
                  content:
                    "Return the AI-generated likelihood as one integer percentage from 1 to 100. Do not use a 0-1 probability or a 1-5 rating.",
                },
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
                        type: "integer",
                        minimum: 1,
                        maximum: 100,
                        description:
                          "An integer percentage from 1 to 100 representing how likely the content is AI-generated.",
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
        const rating = getRating(jsonResponse);

        res.writeHead(200, { ...headers, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            vibe_rating: rating,
          }),
        );
      } catch (error) {
        console.error(error);
        res.writeHead(502, { ...headers, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:3000`);
});
