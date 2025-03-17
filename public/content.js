// Content script for YouTube Feed Customizer Chrome extension

let extensionActive = true;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
let isRecommendationsEnabled = true;

// Connection management
function checkExtensionConnection() {
  if (chrome.runtime.id) {
    return true;
  }
  extensionActive = false;
  return false;
}

async function attemptReconnection() {
  if (!extensionActive && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    console.log(`Reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
    reconnectAttempts++;
    
    try {
      if (checkExtensionConnection()) {
        console.log('Reconnection successful');
        extensionActive = true;
        reconnectAttempts = 0;
        await init();
        return true;
      }
    } catch (error) {
      console.log('Reconnection failed:', error);
    }
    
    setTimeout(attemptReconnection, 5000);
  }
  return false;
}

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!checkExtensionConnection()) {
    attemptReconnection();
    return false;
  }
  
  if (message.action === "getVideoInfo") {
    try {
    const videoId = getYouTubeVideoId();
    const videoTitle = document.querySelector('h1.title')?.textContent?.trim() || '';
    const videoDescription = document.querySelector('div#description-inline-expander')?.textContent?.trim() || '';
    
    sendResponse({
      success: true,
      videoInfo: {
        id: videoId,
        title: videoTitle,
        description: videoDescription,
        url: window.location.href
      }
    });
    } catch (error) {
      console.error('Error getting video info:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true;
});

// YouTube video utilities
function getYouTubeVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v') || '';
}

function isYouTubeVideoPage() {
  return window.location.href.includes('youtube.com/watch') && getYouTubeVideoId();
}

function initialize() {
  console.log("Content script initialized");
  
  if (isYouTubeVideoPage()) {
    chrome.runtime.sendMessage({
      action: "onYouTubeVideoPage",
      videoId: getYouTubeVideoId()
    });
  }
}

// YouTube integration
let lastSearchQuery = '';
let isProcessing = false;
let retryCount = 0;
const MAX_RETRIES = 10;

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

function getSearchQueryFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('search_query') || '';
}

function createRecommendationElement(video) {
  const similarity = video.similarity ? Math.round(video.similarity * 100) : 0;
  const matchedWith = video.matchedWith || '';
  
  const element = document.createElement('div');
  element.className = 'algo-badge ' + (similarity >= 70 ? 'high-match' : similarity >= 50 ? 'medium-match' : 'low-match');
  element.style.cssText = `
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 12px;
    color: white;
    font-weight: 500;
    gap: 8px;
    width: fit-content;
    position: relative;
    z-index: 4;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `;
  
  element.innerHTML = `
    <span class="match-percentage">${similarity}% Match</span>
    ${matchedWith ? `<div class="algo-matched-with" style="
      font-size: 12px;
      opacity: 0.9;
      border-left: 1px solid rgba(255, 255, 255, 0.3);
      padding-left: 8px;
      position: relative;
      z-index: 5;
    ">Based on: ${matchedWith}</div>` : ''}
  `;
  
  return element;
}

async function injectRecommendations(recommendations) {
  console.log('Injecting recommendations:', recommendations);
  
  try {
    const containers = [
      'ytd-section-list-renderer#contents',
      'ytd-two-column-search-results-renderer',
      '#primary > ytd-section-list-renderer',
      '#contents.ytd-section-list-renderer'
    ];

    let resultsContainer = null;
    for (const selector of containers) {
      try {
        resultsContainer = await waitForElement(selector, 2000);
        if (resultsContainer) {
          console.log('Found container:', selector);
          break;
        }
      } catch (e) {
        console.log(`Container not found: ${selector}`);
      }
    }

    if (!resultsContainer) {
      resultsContainer = document.querySelector('#primary') || document.querySelector('ytd-section-list-renderer');
      if (!resultsContainer) {
        throw new Error('No suitable container found');
      }
    }

    const existingContainer = document.querySelector('.algo-recommended-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const recommendedContainer = document.createElement('ytd-item-section-renderer');
    recommendedContainer.className = 'algo-recommended-container style-scope ytd-section-list-renderer';
    recommendedContainer.style.cssText = `
      display: block;
      margin: 0 0 16px 0;
      background: var(--yt-spec-brand-background-primary, white);
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      z-index: 1;
      max-height: 600px;
    `;

    const contentWrapper = document.createElement('div');
    contentWrapper.id = 'contents';
    contentWrapper.className = 'style-scope ytd-item-section-renderer';
    contentWrapper.style.cssText = `
      padding: 16px;
      border: 1px solid var(--yt-spec-10-percent-layer);
      border-radius: 12px;
      position: relative;
      z-index: 2;
      overflow-y: auto;
      max-height: 600px;
      scrollbar-width: thin;
      scrollbar-color: var(--yt-spec-text-secondary) transparent;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .algo-recommended-container #contents::-webkit-scrollbar {
        width: 8px;
      }
      .algo-recommended-container #contents::-webkit-scrollbar-track {
        background: transparent;
      }
      .algo-recommended-container #contents::-webkit-scrollbar-thumb {
        background-color: var(--yt-spec-text-secondary);
        border-radius: 4px;
        border: 2px solid transparent;
      }
      .algo-recommended-container #contents::-webkit-scrollbar-thumb:hover {
        background-color: var(--yt-spec-text-primary);
      }
    `;
    document.head.appendChild(style);

    const header = document.createElement('div');
    header.className = 'style-scope ytd-shelf-renderer';
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      position: relative;
      z-index: 3;
    `;
    header.innerHTML = `
      <h2 class="style-scope ytd-shelf-renderer" style="
        font-size: 16px;
        font-weight: 500;
        color: var(--yt-spec-text-primary);
        margin: 0;
        display: flex;
        align-items: center;
      ">
        <svg style="width: 24px; height: 24px; margin-right: 8px; fill: currentColor;" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
        </svg>
        Algo Recommendation Based on Your Likes
      </h2>
    `;

    const videoGrid = document.createElement('div');
    videoGrid.className = 'style-scope ytd-shelf-renderer';
    videoGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 16px;
      margin: 0 -8px;
      padding-right: 8px;
    `;

    recommendations.forEach(video => {
      const videoCard = document.createElement('div');
      videoCard.className = 'style-scope ytd-grid-video-renderer';
      videoCard.style.cssText = `
        display: flex;
        flex-direction: column;
        margin: 0 8px;
        position: relative;
        z-index: 2;
      `;

      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.style.cssText = `
        position: relative;
        width: 100%;
        padding-top: 56.25%;
        margin-bottom: 8px;
        border-radius: 8px;
        overflow: hidden;
        z-index: 2;
      `;

      const thumbnail = document.createElement('a');
      thumbnail.href = `https://www.youtube.com/watch?v=${video.id}`;
      thumbnail.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3;
      `;
      thumbnail.innerHTML = `
        <img src="${video.thumbnail}" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
        " alt="${video.title}">
      `;
      thumbnailContainer.appendChild(thumbnail);

      const titleContainer = document.createElement('div');
      titleContainer.style.cssText = `
        margin-bottom: 4px;
      `;
      
      const title = document.createElement('a');
      title.href = `https://www.youtube.com/watch?v=${video.id}`;
      title.className = 'yt-simple-endpoint style-scope ytd-grid-video-renderer';
      title.style.cssText = `
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        color: var(--yt-spec-text-primary);
        text-decoration: none;
        margin: 0;
      `;
      title.textContent = video.title;
      titleContainer.appendChild(title);

      const badge = createRecommendationElement(video);

      videoCard.appendChild(thumbnailContainer);
      videoCard.appendChild(titleContainer);
      videoCard.appendChild(badge);
      videoGrid.appendChild(videoCard);
    });

    contentWrapper.appendChild(header);
    contentWrapper.appendChild(videoGrid);
    recommendedContainer.appendChild(contentWrapper);

    try {
      const firstResult = resultsContainer.querySelector('ytd-video-renderer, ytd-item-section-renderer');
      if (firstResult) {
        resultsContainer.insertBefore(recommendedContainer, firstResult);
        console.log('Recommendations injected before first result');
        return;
      }

      const contents = resultsContainer.querySelector('#contents');
      if (contents) {
        contents.insertBefore(recommendedContainer, contents.firstChild);
        console.log('Recommendations injected into contents');
        return;
      }

      resultsContainer.insertBefore(recommendedContainer, resultsContainer.firstChild);
      console.log('Recommendations injected at container start');

    } catch (insertError) {
      console.error('Insertion error, using fallback:', insertError);
      resultsContainer.appendChild(recommendedContainer);
      console.log('Recommendations appended using fallback');
    }

  } catch (error) {
    console.error('Injection error:', error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retry ${retryCount}/${MAX_RETRIES}`);
      setTimeout(() => injectRecommendations(recommendations), 1000);
    }
  }
}

function createToggleButton() {
  const toggleButton = document.createElement('div');
  toggleButton.className = 'algo-toggle-button';
  toggleButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--yt-spec-brand-background-primary);
    border: 1px solid var(--yt-spec-10-percent-layer);
    border-radius: 24px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--yt-spec-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    transition: all 0.2s ease;
  `;

  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 16px;
    height: 16px;
    border-radius: 50%;
    transition: all 0.3s ease;
  `;

  const text = document.createElement('span');
  
  const loadingSpinner = document.createElement('div');
  loadingSpinner.style.cssText = `
    width: 16px;
    height: 16px;
    border: 2px solid var(--yt-spec-text-secondary);
    border-top: 2px solid var(--yt-spec-text-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: none;
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
  
  function updateButtonState(isLoading = false) {
    if (isLoading) {
      icon.style.display = 'none';
      loadingSpinner.style.display = 'block';
      text.textContent = 'Loading recommendations...';
      toggleButton.style.cursor = 'default';
      toggleButton.style.opacity = '0.7';
    } else {
      icon.style.display = 'block';
      loadingSpinner.style.display = 'none';
      icon.style.backgroundColor = isRecommendationsEnabled ? '#22c55e' : '#64748b';
      text.textContent = isRecommendationsEnabled ? 'Recommendations ON' : 'Recommendations OFF';
      toggleButton.title = isRecommendationsEnabled ? 'Click to disable recommendations' : 'Click to enable recommendations';
      toggleButton.style.cursor = 'pointer';
      toggleButton.style.opacity = '1';
    }
  }

  toggleButton.appendChild(icon);
  toggleButton.appendChild(loadingSpinner);
  toggleButton.appendChild(text);
  updateButtonState();

  toggleButton.addEventListener('mouseenter', () => {
    if (!isProcessing) {
      toggleButton.style.transform = 'translateY(-2px)';
      toggleButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    }
  });

  toggleButton.addEventListener('mouseleave', () => {
    toggleButton.style.transform = 'translateY(0)';
    toggleButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  });

  toggleButton.addEventListener('click', async () => {
    if (isProcessing) return;
    
    isRecommendationsEnabled = !isRecommendationsEnabled;
    updateButtonState();
    
    await chrome.storage.local.set({ isRecommendationsEnabled });

    if (!isRecommendationsEnabled) {
      const existingContainer = document.querySelector('.algo-recommended-container');
      if (existingContainer) {
        existingContainer.remove();
      }
    } else {
      processSearchResults();
    }
  });

  document.body.appendChild(toggleButton);
  
  return updateButtonState;
}

let updateToggleButtonState;

async function processSearchResults() {
  if (!checkExtensionConnection()) {
    await attemptReconnection();
    return;
  }

  if (!isRecommendationsEnabled) {
    console.log('Recommendations disabled');
    return;
  }

  const currentQuery = getSearchQueryFromURL();
  console.log('Search query:', currentQuery);
  
  if (currentQuery && currentQuery !== lastSearchQuery && !isProcessing) {
    console.log('Processing search...');
    isProcessing = true;
    lastSearchQuery = currentQuery;
    retryCount = 0;
    
    updateToggleButtonState(true);
    
    try {
      console.log('Requesting recommendations');
      const response = await chrome.runtime.sendMessage({
        action: "searchVideos",
        query: currentQuery
      });
      
      if (response.success) {
        await injectRecommendations(response.recommendations);
      } else {
        console.error('Response error:', response.error);
      }
    } catch (error) {
      console.error('Search processing error:', error);
      if (error.message.includes('Extension context invalidated')) {
        await attemptReconnection();
      }
    } finally {
      isProcessing = false;
      updateToggleButtonState(false);
    }
  }
}

function observeNavigationChanges() {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('URL changed:', url);
      if (location.pathname === '/results') {
        console.log('Search results page detected');
        setTimeout(processSearchResults, 1000);
      }
    }
  }).observe(document, { subtree: true, childList: true });

  const resultsObserver = new MutationObserver(() => {
    if (location.pathname === '/results' && document.querySelector('ytd-video-renderer')) {
      console.log('Search results updated');
      processSearchResults();
    }
  });

  resultsObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

async function init() {
  if (!checkExtensionConnection()) {
    console.log('Extension connection unavailable');
    await attemptReconnection();
    return;
  }

  console.log('Initializing');
  
  try {
    const result = await chrome.storage.local.get('isRecommendationsEnabled');
    if (result.hasOwnProperty('isRecommendationsEnabled')) {
      isRecommendationsEnabled = result.isRecommendationsEnabled;
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }

  updateToggleButtonState = createToggleButton();
  
  observeNavigationChanges();
  
  if (window.location.pathname === '/results') {
    console.log('Initial search page processing');
    setTimeout(processSearchResults, 1500);
  }
}

window.addEventListener('error', async (event) => {
  if (event.error?.message?.includes('Extension context invalidated')) {
    console.log('Context invalidated');
    await attemptReconnection();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

chrome.runtime.onMessage.addListener((message) => {
  console.log('Message received:', message);
  return true;
});