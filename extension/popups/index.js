const selectedText = document.getElementById("text-checker__selected-text");
const pickButton = document.getElementById("text-checker__pick-button");
const submitButton = document.getElementById("text-checker__submit-button");
const textIsValid = document.getElementById("text-checker__is-valid");
const status = document.getElementById("text-checker__status");
textIsValid.style.display = "none";

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

  try {
    const data = await fetch("http://localhost:3000/text", {
      method: "POST",
      body: JSON.stringify(text),
    });
    const result = await data.json();

    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

function enablePagePicker() {
  if (window.__textCheckerPickerActive) return;
  window.__textCheckerPickerActive = true;

  let highlightedElement = null;
  let previousOutline = "";

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

    toasterValidText(validText);
  };

  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("click", handleClick, true);
}

function toasterValidText(isValid) {
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
    "border-radius:6px",
    "background:#000000",
    "color:#e7e9ea",
    "font:14px sans-serif",
    "border: 1px solid #e7e9ea",
    "border-radius: 10px",
  ].join(";");

  document.documentElement.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}

showSavedText();
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.selectedText) {
    selectedText.value = changes.selectedText.newValue || "";
  }
});
