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

## Deployment to Vercel

This application is configured to be deployed on Vercel. Follow these steps to deploy:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the following environment variables in the Vercel dashboard:
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_ENVIRONMENT`
   - `PINECONE_INDEX`
   - `PINECONE_HOST`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`
4. Deploy the application

### Rate Limiting

The application is configured to limit users to 100 chat requests per IP address per day. This is implemented using Upstash Redis. Make sure to set up a Redis database at [Upstash](https://upstash.com/) and add the appropriate environment variables.

### reCAPTCHA

The application uses Google reCAPTCHA v2 to prevent spam. You need to:

1. Register your site at [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Create a new reCAPTCHA v2 "I'm not a robot" Checkbox
3. Add your domain to the list of approved domains
4. Copy the Site Key and Secret Key to the environment variables

# chatUW
