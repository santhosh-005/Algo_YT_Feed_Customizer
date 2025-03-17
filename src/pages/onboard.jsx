import React from 'react'

const Onboard = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-DT9jXZAAIlyYDQKzBna9e1xVLltZZK.png"
            alt="Tetua.ai Logo"
            className="w-8 h-8 rounded"
          />
          <span className="text-lg font-semibold">Tetua.ai</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 -mt-20">
        {/* Gradient Logo */}
        <div className="w-48 h-48 relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-20" />
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20 50 Q 35 20 50 50 Q 65 80 80 50"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <circle cx="80" cy="50" r="6" fill="#CBD5E1" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-2xl font-semibold text-center">Welcome to Tetua!</h1>
        <p className="text-gray-500 text-center max-w-xs">
          "Sharing information effortlessly with a smart AI in just a single click."
        </p>

        {/* Web Access Button */}
        <button className="w-full max-w-xs py-2 px-4 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mt-4">
          Web Access
        </button>

        {/* Get Started Button */}
        <button className="w-full max-w-xs py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors mt-2">
          Get Started
        </button>
      </div>
    </div>
  )
}

export default Onboard 
