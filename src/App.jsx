import React, { useState, useEffect } from 'react';
import { getGoogleAuthToken, checkAuthState, revokeToken, FetchYouTubeLikedVideos } from './services/oauth';
import CoursesGrid from "./components/CourseGrid";
import VideoGrid from "./components/VideoGrid";

function App() {
  const [query, setQuery] = useState('');
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLiked, setLoadingLiked] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    try {
      const isAuthed = await checkAuthState();
      setIsAuthenticated(isAuthed);
      if (isAuthed) {
        getLikedVideos();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await getGoogleAuthToken();
      setIsAuthenticated(true);
      getLikedVideos();
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await revokeToken();
      setIsAuthenticated(false);
      setLikedVideos([]);
      setSearchResults([]);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const getLikedVideos = async () => {
    try {
      setLoadingLiked(true);
      setError(null);
      const token = await getGoogleAuthToken();
      const videos = await FetchYouTubeLikedVideos(token);
      setLikedVideos(videos);
    } catch (error) {
      console.error("Error fetching liked videos:", error);
      setError(error.message);
      if (error.message.includes('Authentication expired')) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoadingLiked(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setSearchResults([]); // Clear previous results
      
      // Send message to background script to trigger search
      const response = await chrome.runtime.sendMessage({
        action: "searchVideos",
        query: query.trim()
      });

      if (!response.success) {
        throw new Error(response.error || 'Search failed');
      }

      // Set the search results
      if (response.recommendations) {
        setSearchResults(response.recommendations.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle || 'Unknown Channel',
          description: video.description
        })));
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (keywords) => {
    setQuery(keywords);
    // Focus the search input
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.focus();
    }
    // Trigger search immediately when category is selected
    await handleSearch();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSearch();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <div className="p-6 flex-1 flex flex-col items-center">
        {!isAuthenticated ? (
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Welcome to Algo</h2>
            <p className="text-gray-400 mb-6">
              Sign in with your Google account to get personalized YouTube recommendations based on your liked videos.
            </p>
            <button
              onClick={handleSignIn}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
            >
              Continue with Google
            </button>
          </div>
        ) : (
          <>
            <div className="w-full max-w-6xl">
              <form onSubmit={handleSubmit} className="w-full max-w-md mb-6 mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for videos..."
                    className="w-full p-3 pr-12 border rounded-lg shadow-sm bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-red-500 outline-none"
                    disabled={loading}
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-white"></div>
                    </div>
                  )}
                </div>
              </form>
              
              {!searchResults.length && (
                <CoursesGrid onCategorySelect={handleCategorySelect} />
              )}

              {searchResults.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-200">Recommended Videos</h2>
                  <VideoGrid 
                    videos={searchResults}
                    loading={loading}
                    error={error}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <footer className="bg-gray-800 p-4 text-center text-sm text-gray-400">
        Algo - YouTube Feed Customizer
      </footer>
    </div>
  );
}

export default App;
