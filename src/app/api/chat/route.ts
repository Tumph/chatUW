import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { index } from '@/lib/pinecone';
import { formatMessages } from '@/lib/utils';
import { z } from 'zod';
import { Citation } from '@/types';
import axios from 'axios';
import { redis } from '@/lib/redis';

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  query: z.string(),
  recaptcha: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Log that we're starting to process a request
    console.log('Chat API: Processing new request');
    
    // Parse the request body
    const body = await req.json();
    const { messages, query, recaptcha } = chatRequestSchema.parse(body);
    console.log(`Chat API: Received query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
    
    // Verify reCAPTCHA
    try {
      console.log('Chat API: Verifying reCAPTCHA');
      const recaptchaResponse = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: recaptcha,
          },
        }
      );
      
      if (!recaptchaResponse.data.success) {
        console.error('Chat API: reCAPTCHA verification failed', recaptchaResponse.data);
        return NextResponse.json({
          success: false,
          message: { 
            role: 'assistant', 
            content: 'reCAPTCHA verification failed. Please try again.' 
          },
          error: 'reCAPTCHA verification failed'
        }, { status: 400 });
      }
    } catch (recaptchaError) {
      console.error('Chat API: Error verifying reCAPTCHA', recaptchaError);
      return NextResponse.json({
        success: false,
        message: { 
          role: 'assistant', 
          content: 'Error verifying reCAPTCHA. Please try again.' 
        },
        error: 'Error verifying reCAPTCHA'
      }, { status: 500 });
    }
    
    // Check rate limit
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const key = `rate_limit:${ip}`;
    
    try {
      // Get current count
      const count = await redis.get(key);
      const currentCount = count ? parseInt(count as string) : 0;
      
      // Check if over limit
      if (currentCount >= 100) {
        console.log(`Chat API: Rate limit exceeded for IP ${ip}`);
        return NextResponse.json({
          success: false,
          message: { 
            role: 'assistant', 
            content: 'You have reached the daily limit of 100 questions. Please try again tomorrow.' 
          },
          error: 'Rate limit exceeded',
          rateLimitRemaining: 0
        }, { status: 429 });
      }
      
      // Increment count and set expiration (24 hours) if it's the first request
      await redis.incr(key);
      if (currentCount === 0) {
        await redis.expire(key, 86400); // 24 hours in seconds
      }
      
      // Calculate remaining requests
      const remaining = 100 - (currentCount + 1);
      console.log(`Chat API: Rate limit remaining for IP ${ip}: ${remaining}`);
      
    } catch (redisError) {
      // Log rate limiting error but continue with request
      console.error('Chat API: Error checking rate limit', redisError);
    }
    
    // Simple fallback response in case Pinecone isn't working correctly
    // This ensures the chat UI remains functional even if vector search is down
    const defaultResponse = {
      success: true,
      message: {
        role: 'assistant' as const,
        content: "I'm unable to search my knowledge base at the moment, but I can still try to help with general information about the University of Waterloo."
      },
      rateLimitRemaining: 100 // Default value, will be updated later
    };
    
    try {
      // Generate embedding for the query
      console.log('Chat API: Generating embeddings');
      
      // Check if the query is about places (restaurants, cafes, etc.) but doesn't mention Waterloo
      const isLocationQuery = /\b(place|restaurant|cafe|eat|food|dining|bar|pub)\b/i.test(query);
      const mentionsLocation = /\b(waterloo|kitchener|cambridge|ontario|canada|uwaterloo|uw|university)\b/i.test(query);
      const mentionsOtherLocation = /\b(nyc|sf|la|los angeles|san francisco|toronto|nyc|new york|vancouver|montreal|boston|chicago|seattle|austin|portland|ottawa|calgary|edmonton|halifax|london|hamilton|mississauga|brampton|markham|richmond hill|oakville|burlington|guelph|kingston|windsor|victoria|winnipeg|saskatoon|regina|st. john's|fredericton|charlottetown|whitehorse|yellowknife)\b/i.test(query);
      
      // If it's a location query without mentioning a location, force Waterloo context
      // But if it explicitly mentions another location, leave it as is
      const contextualizedQuery = isLocationQuery && !mentionsLocation && !mentionsOtherLocation
        ? `Places to ${query} in Waterloo` 
        : query;
        
      console.log(`Chat API: Contextualized query: "${contextualizedQuery.substring(0, 50)}${contextualizedQuery.length > 50 ? '...' : ''}"`);
      
      const queryEmbedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: contextualizedQuery,
      });
      
      // Query the Pinecone index with the embedding
      console.log('Chat API: Querying Pinecone');
      const results = await index.query({
        vector: queryEmbedding.data[0].embedding,
        topK: 5,
        includeMetadata: true,
      });
      
      // Check if we have matches from Pinecone
      if (!results.matches || results.matches.length === 0) {
        console.log('Chat API: No matches found in Pinecone');
        return NextResponse.json({
          success: true,
          message: {
            role: 'assistant',
            content: "I couldn't find specific information to answer your question. Please try asking something else about UWaterloo.",
          },
          rateLimitRemaining: await getRemainingRequests(ip)
        });
      }
      
      console.log(`Chat API: Found ${results.matches.length} relevant matches`);
      
      // Process the matches into citations
      const citations: Citation[] = results.matches.map((match) => ({
        text: String(match.metadata?.text || ''),
        chunkId: String(match.metadata?.chunkId || match.id),
        metadata: { 
          fileName: match.metadata?.fileName ? String(match.metadata.fileName) : undefined, 
          timestamp: match.metadata?.timestamp ? String(match.metadata.timestamp) : undefined 
        },
      }));
      
      const context = citations.map((c) => c.text).join('\n');
      const messagesWithContext = formatMessages(messages, context);
      
      // Generate completion with OpenAI
      console.log('Chat API: Generating OpenAI completion');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messagesWithContext,
        temperature: 0.7,
        max_tokens: 500,
      });
      
      console.log('Chat API: Successfully generated response');
      return NextResponse.json({
        success: true,
        message: {
          role: 'assistant',
          content: completion.choices[0].message.content || '',
          citations,
        },
        rateLimitRemaining: await getRemainingRequests(ip)
      });
    } catch (innerError) {
      // Log the inner error but continue to provide a fallback response
      console.error("Chat API inner error (Pinecone/OpenAI):", innerError);
      const response = { ...defaultResponse };
      try {
        response.rateLimitRemaining = await getRemainingRequests(ip);
      } catch (error) {
        console.error("Error getting rate limit:", error);
      }
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Chat API outer error:", error);
    return NextResponse.json({
      success: false,
      message: { 
        role: 'assistant', 
        content: 'An error occurred while processing your request.' 
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Helper function to get remaining requests
async function getRemainingRequests(ip: string): Promise<number> {
  try {
    const key = `rate_limit:${ip}`;
    const count = await redis.get(key);
    return count ? Math.max(0, 100 - parseInt(count as string)) : 100;
  } catch (error) {
    console.error("Error getting remaining requests:", error);
    return 100; // Default to 100 if there's an error
  }
} 