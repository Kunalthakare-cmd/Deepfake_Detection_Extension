// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getImageData") {
    getImageAsBase64(request.imageUrl)
      .then(imageData => {
        sendResponse({ imageData });
      })
      .catch(error => {
        console.error('Error getting image data:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

// Function to convert image URL to base64
async function getImageAsBase64(imageUrl) {
  try {
    // Create a canvas to draw the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          resolve(dataUrl);
        } catch (e) {
          // If CORS issue, try fetching the image
          fetchImageAsBase64(imageUrl).then(resolve).catch(reject);
        }
      };
      
      img.onerror = () => {
        // Fallback to fetch if direct load fails
        fetchImageAsBase64(imageUrl).then(resolve).catch(reject);
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    throw error;
  }
}

// Fallback method using fetch
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Unable to fetch image: ' + error.message);
  }
}