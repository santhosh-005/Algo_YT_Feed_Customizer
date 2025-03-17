
const TOKEN_STORAGE_KEY = 'youtube_auth_token';
const TOKEN_EXPIRY_KEY = 'youtube_token_expiry';
const TOKEN_EXPIRY_BUFFER = 300000; 

export const getGoogleAuthToken = async () => {
  try {
    const cachedToken = await getCachedToken();
    if (cachedToken) {
      return cachedToken;
    }

    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('Auth Error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        await cacheToken(token);
        resolve(token);
      });
    });
  } catch (error) {
    console.error('Error in getGoogleAuthToken:', error);
    throw new Error('Failed to authenticate with Google. Please try again.');
  }
};

export const revokeToken = async () => {
  try {
    const token = await getCachedToken();
    if (token) {
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token: token }, resolve);
      });
      await chrome.storage.local.remove([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY]);
    }
  } catch (error) {
    console.error('Error revoking token:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const FetchYouTubeLikedVideos = async (token) => {
  try {
    const url = "https://www.googleapis.com/youtube/v3/playlistItems";
    const params = new URLSearchParams({
      part: "snippet",
      maxResults: "50", 
      playlistId: "LL",
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await revokeToken();
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("LIKED VIDEOS", data);
    return data.items;
  } catch (error) {
    console.error("Error fetching YouTube liked videos:", error);
    throw error;
  }
};

const getCachedToken = async () => {
  const { [TOKEN_STORAGE_KEY]: token, [TOKEN_EXPIRY_KEY]: expiry } = await chrome.storage.local.get([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY]);
  
  if (!token || !expiry) {
    return null;
  }

  if (Date.now() >= (expiry - TOKEN_EXPIRY_BUFFER)) {
    await chrome.storage.local.remove([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY]);
    return null;
  }

  return token;
};

// Set token expiry to 1 hour from now
const cacheToken = async (token) => {
  const expiry = Date.now() + 3600000;
  await chrome.storage.local.set({
    [TOKEN_STORAGE_KEY]: token,
    [TOKEN_EXPIRY_KEY]: expiry
  });
};

// Check auth state
export const checkAuthState = async () => {
  try {
    const token = await getCachedToken();
    return !!token;
  } catch {
    return false;
  }
};