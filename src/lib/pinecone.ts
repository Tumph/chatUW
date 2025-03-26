import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('Missing PINECONE_API_KEY environment variable');
}

// Initialize the Pinecone client with the API key
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Get the index name from environment variables or use default
const indexName = process.env.PINECONE_INDEX || 'uwchat';

// Get the Pinecone index
export const index = pinecone.index(indexName);
