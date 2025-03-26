import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { index } from '@/lib/pinecone';
import { processFileContent } from '@/lib/utils';
import { z } from 'zod';

const embedRequestSchema = z.object({
  content: z.string(),
  fileName: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, fileName } = embedRequestSchema.parse(body);
    
    // Process content into chunks
    const chunks = await processFileContent(content);
    console.log(`File ${fileName} split into ${chunks.length} chunks`);
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `chunk-${Date.now()}-${i}`;
      console.log(`Processing chunk ${i+1}/${chunks.length} for ${fileName}`);
      
      // Generate embedding
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunks[i],
      });
      
      // Store in Pinecone
      await index.upsert([{
        id: chunkId,
        values: embedding.data[0].embedding,
        metadata: {
          text: chunks[i],
          fileName,
          timestamp: new Date().toISOString(),
          chunkId,
        },
      }]);
      
      console.log(`Chunk ${i+1} embedded and stored`);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully processed ${chunks.length} chunks from ${fileName}` 
    });
  } catch (error) {
    console.error("Embed API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 