const selectedText = document.getElementById("text-checker__selected-text");
const pickButton = document.getElementById("text-checker__pick-button");
const submitButton = document.getElementById("text-checker__submit-button");
const textIsValid = document.getElementById("text-checker__is-valid");
const status = document.getElementById("text-checker__status");
const loader = document.getElementById("text-checker__loader");
const resultMessage = document.getElementById("text-checker__result");
const ANALYSIS_STATE_KEY = "textCheckerAnalysis";
textIsValid.style.display = "none";

function renderAnalysisState(state) {
  const isLoading = state?.status === "loading";

  loader.style.display = isLoading ? "flex" : "none";
  submitButton.disabled = isLoading;

  if (state?.status === "success") {
    resultMessage.textContent = `${state.vibe_rating}% likely AI-generated`;
  } else if (state?.status === "error") {
    resultMessage.textContent = state.error || "Unable to analyze the text.";
  }
}

chrome.storage.local.get({ [ANALYSIS_STATE_KEY]: null }, (data) => {
  renderAnalysisState(data[ANALYSIS_STATE_KEY]);
});

chrome.runtime.sendMessage({ type: "text-checker-resume-analysis" });

function showSavedText() {
  chrome.storage.local.get({ selectedText: "" }, (data) => {
    selectedText.value = data.selectedText;
  });
}

selectedText.addEventListener("input", () => {
  chrome.runtime.sendMessage({
    type: "text-checker-selected-text",
    text: selectedText.value,
  });
});

pickButton.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    status.textContent = "No active webpage was found.";
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: enablePagePicker,
    });
  } catch (error) {
    console.error(error);
    status.textContent = "This page does not allow extensions to select text.";
  }
});

submitButton.addEventListener("click", async () => {
  const data = await chrome.storage.local.get({
    selectedText: "",
  });
  const text = data.selectedText.trim();
  const validText = text && text.length <= 1000;

  if (!validText) {
    textIsValid.style.display = "block";
    return;
  }

  textIsValid.style.display = "none";
  resultMessage.textContent = "";
  loader.style.display = "flex";
  submitButton.disabled = true;

  chrome.runtime.sendMessage({
    type: "text-checker-analyze-text",
    text,
  });
});

function enablePagePicker() {
  if (window.__textCheckerPickerActive) return;
  window.__textCheckerPickerActive = true;

  let highlightedElement = null;
  let previousOutline = "";

  const showToast = (isValid) => {
    const toast = document.createElement("div");

    toast.textContent = isValid
      ? "Text captured. Reopen the extension to view it."
      : "No text found or text must be less than or equal to 1000 characters.";
    toast.style.cssText = [
      "position:fixed",
      "z-index:2147483647",
      "top:16px",
      "right:16px",
      "padding:10px 14px",
      "border-radius:10px",
      "background:#000000",
      "color:#e7e9ea",
      "font:14px sans-serif",
      "border:1px solid #e7e9ea",
    ].join(";");

    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const restoreHighlight = () => {
    if (highlightedElement) {
      highlightedElement.style.outline = previousOutline;
      highlightedElement = null;
    }
  };

  const handleMouseOver = (event) => {
    const element = event.target;
    if (!(element instanceof Element)) return;

    restoreHighlight();
    highlightedElement = element;
    previousOutline = element.style.outline;
    element.style.outline = "1px solid #e7e9ea";
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const element = event.target;
    const text = (element.innerText || element.textContent || "").trim();
    const validText = text && text.length <= 1000;

    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("click", handleClick, true);
    restoreHighlight();
    window.__textCheckerPickerActive = false;

    if (validText) {
      chrome.runtime.sendMessage({
        type: "text-checker-selected-text",
        text,
      });
    }

    showToast(validText);
  };

  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("click", handleClick, true);
}

showSavedText();
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes.selectedText) {
    selectedText.value = changes.selectedText.newValue || "";
  }

  if (changes[ANALYSIS_STATE_KEY]) {
    renderAnalysisState(changes[ANALYSIS_STATE_KEY].newValue);
  }
});
