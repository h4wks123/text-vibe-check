chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "text-checker-selected-text") {
    chrome.storage.local.set({
      selectedText: message.text || "",
      selectedAt: Date.now(),
    });
  }
});
