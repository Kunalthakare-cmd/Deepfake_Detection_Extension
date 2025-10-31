// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkImageAuthenticity",
    title: "Check Image Authenticity",
    contexts: ["image"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "checkImageAuthenticity") {
    // Send message to content script to get image data
    chrome.tabs.sendMessage(tab.id, {
      action: "getImageData",
      imageUrl: info.srcUrl
    }, (response) => {
      if (response && response.imageData) {
        // Store image data for popup to access
        chrome.storage.local.set({
          currentImage: response.imageData,
          imageUrl: info.srcUrl
        }, () => {
          // Open popup
          chrome.action.openPopup();
        });
      }
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeImage") {
    analyzeImage(request.imageData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Function to analyze image with backend
async function analyzeImage(imageData) {
  try {
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageData })
    });

    if (!response.ok) {
      throw new Error('Server error: ' + response.status);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}