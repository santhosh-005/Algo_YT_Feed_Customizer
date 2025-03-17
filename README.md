# Glgo - Your Personal YouTube Discovery Engine

Glgo is an intelligent recommendation system that analyzes your YouTube preferences to surface videos you'll genuinely want to watch. By examining your liked videos and search interests, Glgo creates a tailored viewing experience that goes beyond standard YouTube recommendations.

## How Glgo Works

1. **YouTube Data Collection**: Fetches your liked videos and search results through the YouTube API
2. **Text Embedding Generation**: Converts video titles and descriptions into vector representations using Gemini's embedding model
3. **Similarity Analysis**: Compares your preferences with potential recommendations using cosine similarity measurements
4. **Personalized Delivery**: Presents you with videos that match your unique interests, filtered through a relevance threshold

## Technical Foundation

### Embedding API Implementation

Glgo uses Gemini's specialized embedding model rather than the standard Gemini Flash API:

```javascript
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
```

### Performance Optimizations

- **Intelligent Caching**: Stores API responses and embeddings in memory to reduce redundant processing
- **Batch Processing**: Groups embedding generation tasks for efficiency
- **Modular Architecture**: Utilizes well-structured, independent functions for improved maintainability

## The Science Behind Recommendations: Cosine Similarity

Glgo's recommendation engine relies on cosine similarity - a mathematical technique that measures the directional similarity between vectors:

1. Each video is transformed into a multi-dimensional vector based on its content
2. These vectors capture the semantic essence of the videos
3. Videos with vectors pointing in similar directions receive higher similarity scores (0-1)
4. Only videos scoring above 0.5 qualify for recommendation, ensuring quality matches

## Future Development Roadmap

- **FAISS Integration**: Plans to implement Facebook AI Similarity Search for dramatically improved speed and scalability as the video database expands
- **Enhanced Content Analysis**: Deeper understanding of video themes and context
- **User Preference Learning**: Adaptive system that evolves with your changing interests