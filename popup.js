let currentImageData = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Check if there's an image from context menu
  chrome.storage.local.get(['currentImage', 'imageUrl'], (result) => {
    if (result.currentImage) {
      currentImageData = result.currentImage;
      displayImage(currentImageData);
      document.getElementById('analyzeBtn').style.display = 'block';
      
      // Clear storage
      chrome.storage.local.remove(['currentImage', 'imageUrl']);
    }
  });

  // Setup event listeners
  document.getElementById('uploadBox').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', handleFileSelect);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeCurrentImage);
});

// Handle file selection
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showError('Please select a valid image file');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    currentImageData = event.target.result;
    displayImage(currentImageData);
    document.getElementById('analyzeBtn').style.display = 'block';
    hideResults();
  };
  reader.readAsDataURL(file);
}

// Display image preview
function displayImage(imageData) {
  const previewSection = document.getElementById('previewSection');
  const imagePreview = document.getElementById('imagePreview');
  
  imagePreview.src = imageData;
  previewSection.classList.add('active');
}

// Analyze current image
async function analyzeCurrentImage() {
  if (!currentImageData) {
    showError('No image selected');
    return;
  }

  showLoading();
  hideResults();

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'analyzeImage',
      imageData: currentImageData
    });

    hideLoading();

    if (result.error) {
      showError(result.error);
      return;
    }

    displayResults(result);
  } catch (error) {
    hideLoading();
    showError('Failed to analyze image: ' + error.message);
  }
}

// Display analysis results
function displayResults(result) {
  const resultSection = document.getElementById('resultSection');
  const resultBadge = document.getElementById('resultBadge');
  const confidenceValue = document.getElementById('confidenceValue');
  const realProb = document.getElementById('realProb');
  const fakeProb = document.getElementById('fakeProb');
  const realBar = document.getElementById('realBar');
  const fakeBar = document.getElementById('fakeBar');
  const heatmapSection = document.getElementById('heatmapSection');

  // Set badge
  resultBadge.textContent = result.label;
  resultBadge.className = 'result-badge ' + (result.authentic ? 'authentic' : 'tampered');

  // Set confidence
  confidenceValue.textContent = result.confidence + '%';

  // Set probabilities
  realProb.textContent = result.probabilities.real + '%';
  fakeProb.textContent = result.probabilities.fake + '%';
  
  realBar.style.width = result.probabilities.real + '%';
  fakeBar.style.width = result.probabilities.fake + '%';

  // Show heatmap if image is tampered
  if (!result.authentic && result.heatmap) {
    heatmapSection.style.display = 'block';
    document.getElementById('heatmapImage').src = result.heatmap;
  } else {
    heatmapSection.style.display = 'none';
  }

  resultSection.classList.add('active');
}

// Show loading state
function showLoading() {
  document.getElementById('loadingSection').style.display = 'block';
  document.getElementById('analyzeBtn').disabled = true;
}

// Hide loading state
function hideLoading() {
  document.getElementById('loadingSection').style.display = 'none';
  document.getElementById('analyzeBtn').disabled = false;
}

// Hide results
function hideResults() {
  document.getElementById('resultSection').classList.remove('active');
}

// Show error message
function showError(message) {
  const resultSection = document.getElementById('resultSection');
  resultSection.innerHTML = `
    <div class="error">
      <strong>❌ Error</strong><br>
      ${message}
      <br><br>
      <small>Troubleshooting tips:</small><br>
      <small>• Make sure the backend server is running (python app.py)</small><br>
      <small>• Check if the server is accessible at http://localhost:5000/health</small><br>
      <small>• Verify the image format is supported (JPG, PNG)</small>
    </div>
  `;
  resultSection.classList.add('active');
}