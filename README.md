# University of Waterloo RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot built with Next.js, OpenAI, and Pinecone. The chatbot answers questions about the University of Waterloo using a knowledge base of textified websites and articles.

## Features

- Processes and embeds a knowledge base of 35-40 text files about UWaterloo
- Stores document embeddings in Pinecone for efficient vector search
- Uses OpenAI's GPT-4o-mini for natural language processing
- Provides answers with citations to source material
- Clean and responsive web interface

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- OpenAI API Key
- Pinecone Account and API Key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index_name
PINECONE_HOST=your_pinecone_host_url
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the knowledge base:
   ```bash
   npm run seed
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

The project is structured as follows:

- `/src/app` - Next.js app directory
- `/src/components` - React components
- `/src/lib` - Utility functions and API clients
- `/src/types` - TypeScript type definitions
- `/scripts` - Data processing scripts

## Deployment

The application can be deployed on Vercel:

```bash
npm run build
vercel deploy
```

Make sure to add the environment variables to your Vercel project.
# chatUW
