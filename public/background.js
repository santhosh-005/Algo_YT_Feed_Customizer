const YOUTUBE_API_KEY = "AIzaSyATC4q6RDehb_rKg1W9Shht7imrazsbg28";
const GEMINI_API_KEY = "AIzaSyCPrH4D9ZCaECa1djVPhUzqIqP8lr9QIxI";

chrome.sidePanel.setOptions({ path: 'index.html' });

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

const embeddingCache = new Map();

async function getVideoEmbedding(text) {
  const cacheKey = text.slice(0, 100);
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT"
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.embedding?.values;
    
    if (embedding) {
      embeddingCache.set(cacheKey, embedding);
      if (embeddingCache.size > 1000) {
        const oldestKey = embeddingCache.keys().next().value;
        embeddingCache.delete(oldestKey);
      }
    }

    return embedding;
  } catch (error) {
    console.error("Error fetching embedding:", error);
    return null;
  }
}

async function fetchRecommendedVideos(searchQuery, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const enhancedQuery = `${searchQuery} education`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(enhancedQuery)}&type=video&videoDuration=long&videoDefinition=high&maxResults=50&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("RECOMMENDED VIDEOS",data);

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from YouTube API');
      }

      return data.items.map(video => ({
        id: video.id.videoId,
        title: video.snippet.title,
        description: video.snippet.description || "",
        fullText: `${video.snippet.title} ${video.snippet.description || ""}`,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        channelTitle: video.snippet.channelTitle
      }));
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      if (attempt === maxRetries - 1) {
        throw new Error(`Failed to fetch videos after ${maxRetries} attempts: ${lastError.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

async function processLikedVideos(likedVideos, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < likedVideos.length; i += batchSize) {
    const batch = likedVideos.slice(i, i + batchSize);
    const batchPromises = batch.map(async (video) => {
      const embedding = await getVideoEmbedding(video.title + " " + video.description);
      return embedding ? { ...video, embedding } : null;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(video => video !== null));
  }
  
  return results;
}

async function processRecommendedVideos(searchQuery) {
  const videos = await fetchRecommendedVideos(searchQuery);
  return processLikedVideos(videos);
}

function cosineSimilarity(vec1, vec2) {
  if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length !== vec2.length) {
    return 0;
  }
  
  try {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
}

function findBestMatches(likedVideos, recommendedVideos, maxRecommendations = 10, minSimilarity = 0.5) {
  if (!Array.isArray(likedVideos) || !Array.isArray(recommendedVideos) || likedVideos.length === 0 || recommendedVideos.length === 0) {
    return recommendedVideos.slice(0, maxRecommendations);
  }
  
  try {
    const results = recommendedVideos.map(recVideo => {
      let maxSimilarity = -1;
      let bestMatch = null;
      
      for (const likedVideo of likedVideos) {
        if (!recVideo.embedding || !likedVideo.embedding) continue;
        
        const similarity = cosineSimilarity(recVideo.embedding, likedVideo.embedding);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = likedVideo.title;
        }
      }
      
      return {
        ...recVideo,
        similarity: maxSimilarity,
        matchedWith: bestMatch
      };
    });
    
    return results
      .filter(item => item.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxRecommendations);
  } catch (error) {
    console.error('Error finding matches:', error);
    return recommendedVideos.slice(0, maxRecommendations);
  }
}

async function searchVideosAndRecommend(searchQuery) {
  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(token);
      });
    });

    const processedRecommendedVideos = await processRecommendedVideos(searchQuery);

    if (!token) {
      return processedRecommendedVideos.slice(0, 5);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=LL`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        await new Promise((resolve) => {
          chrome.identity.removeCachedAuthToken({ token: token }, resolve);
        });
        throw new Error('Authentication expired');
      }
      throw new Error(`Failed to fetch liked videos: ${response.statusText}`);
    }

    const data = await response.json();
    const processedLikedVideos = await processLikedVideos(data.items);
    
    return findBestMatches(processedLikedVideos, processedRecommendedVideos);
  } catch (error) {
    console.error('Error in searchVideosAndRecommend:', error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === "searchVideos") {
    console.log('Processing search request for query:', message.query);
    searchVideosAndRecommend(message.query)
      .then(recommendations => {
        console.log('Search completed, recommendations:', recommendations);
        sendResponse({ success: true, recommendations });
      })
      .catch(error => {
        console.error("Error in searchVideos:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("YouTube Feed Customizer installed");
  }
});