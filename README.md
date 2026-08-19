# Text Vibe Check

Text Vibe Check is a Chrome extension that lets you select text from any webpage and estimate how likely it is to be AI-generated. The extension sends the selected text to a local Node.js server. The server calls OpenRouter and returns an integer score from `1` to `100`, which the extension displays as a percentage.

**Disclaimer:** Honestly I just did this project for fun and as a way for me to learn the chrome extension ecosystem from development and AI (`OpenRouter`) integration to testing the feature locally. I personally feel like there is no true way to determine how AI generated a content is with 100% certainty for all use cases, and there are plenty of outliers that needs to be considered in order for a (serious) project similar to mine to be very feasible. Nevertheless, this will hopefully pave way towards a bigger project I currently have in mind if I ever feel like implementing it in the near future. However, I do not discourage anyone from using my chrome extension, and as outlined in the prerequisites you can run this project locally and do some fun stuff I guess :) 

## Prerequisites

- Node.js 20 or later
- Google Chrome
- An OpenRouter API key

## Local setup

### 1. Create the environment file

Create `.env` in the project root:

```env
OPENROUTER_API=your_openrouter_api_key
PORT=3000
CHROME_URL=chrome-extension://YOUR_EXTENSION_ID
```

The `.env` file is ignored by Git. `CHROME_URL` must be the ID of the unpacked extension loaded in Chrome.

### 2. Load the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project’s `extension/` directory.
5. Copy the extension ID shown by Chrome.
6. Replace `YOUR_EXTENSION_ID` in `.env` with that ID.

The URL should look like this:

```env
CHROME_URL=chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef
```

### 3. Start the local server

From the project root:

```bash
cd server
npm run dev
```

The extension currently calls `http://localhost:3000`, so keep `PORT=3000` unless you also update the URL in `extension/scripts/background.js` and the host permission in `extension/manifest.json`.

### 4. Use the extension

1. Open a webpage containing text.
2. Open the Text Vibe Check extension.
3. Click **Pick text from page**.
4. Click the text area on the webpage that should be analyzed.
5. Reopen the extension if Chrome closed the popup.
6. Click **Submit**.

The popup shows a centered loader while the request is running, followed by the AI-generated likelihood score.

## API

The local server exposes:

```text
POST http://localhost:3000/text
```

Request body:

```json
"Text to analyze"
```

Successful response:

```json
{
  "vibe_rating": 75
}
```

The server validates that the returned score is an integer between `1` and `100`.

## Troubleshooting

- **CORS or network errors:** Confirm that `CHROME_URL` exactly matches the extension ID and restart the server after changing `.env`.
- **No response from the server:** Confirm the server is running on port `3000` and that `OPENROUTER_API` is valid.
- **Extension changes are not visible:** Return to `chrome://extensions` and click the extension’s reload button.
- **The score is not a scientific probability:** The percentage is an AI-generated heuristic score, not a calibrated or guaranteed detection probability.

## Contributors

- **Codex:** Generating most parts of this `README.md` and for auditing my (terrible) javascript code for some oversight in bugs. 
