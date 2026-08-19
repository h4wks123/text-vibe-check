const ANALYSIS_STATE_KEY = "textCheckerAnalysis";
let activeRequestId = null;

async function analyzeText(text, requestId = crypto.randomUUID()) {
  if (activeRequestId) return;
  activeRequestId = requestId;

  await chrome.storage.local.set({
    [ANALYSIS_STATE_KEY]: {
      requestId,
      status: "loading",
      text,
    },
  });

  try {
    const response = await fetch("http://localhost:3000/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(text),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "The text could not be analyzed.");
    }

    await chrome.storage.local.set({
      [ANALYSIS_STATE_KEY]: {
        requestId,
        status: "success",
        vibe_rating: result.vibe_rating,
      },
    });
  } catch (error) {
    console.error(error);
    await chrome.storage.local.set({
      [ANALYSIS_STATE_KEY]: {
        requestId,
        status: "error",
        error: "Unable to analyze the text.",
      },
    });
  } finally {
    activeRequestId = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "text-checker-selected-text") {
    chrome.storage.local.set({
      selectedText: message.text || "",
    });
  }

  if (message.type === "text-checker-analyze-text") {
    analyzeText(message.text).then(() => sendResponse({ accepted: true }));
    return true;
  }

  if (message.type === "text-checker-resume-analysis") {
    chrome.storage.local.get({ [ANALYSIS_STATE_KEY]: null }, (data) => {
      const state = data[ANALYSIS_STATE_KEY];

      if (state?.status === "loading" && state.text) {
        analyzeText(state.text, state.requestId).then(() =>
          sendResponse({ resumed: true }),
        );
      } else {
        sendResponse({ resumed: false });
      }
    });
    return true;
  }
});
