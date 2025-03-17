import React, { Suspense } from 'react';

function VideoCard({ video }) {
  return (
    <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
      <div className="w-[180px] min-h-[200px] border border-gray-700 p-2 rounded-md space-y-2 hover:bg-gray-800 transition-all duration-300">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-[120px] object-cover rounded-md"
        />
        <div className="space-y-1">
          <p className="text-[14px] text-white line-clamp-2 font-medium">{video.title}</p>
          <p className="text-[12px] text-gray-400">{video.channelTitle}</p>
        </div>
      </div>
    </a>
  );
}

const VideoGrid = ({ videos, loading, error }) => {
  if (loading) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="w-full text-center py-8 text-gray-400">
        No videos found. Try searching for something else.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 justify-center">
        <Suspense fallback={
          <div className="w-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-white"></div>
          </div>
        }>
          {videos.map((video, index) => (
            <VideoCard key={video.id || index} video={video} />
          ))}
        </Suspense>
      </div>
    </div>
  );
};

export default VideoGrid; 