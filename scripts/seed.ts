import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Pinecone
if (!process.env.PINECONE_API_KEY) {
  throw new Error('Missing PINECONE_API_KEY environment variable');
}
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const indexName = process.env.PINECONE_INDEX || 'uwchat';
const index = pinecone.index(indexName);

// Simple chunk function for the script
const processFileContent = async (content: string): Promise<string[]> => {
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
};

async function seed() {
  // Path to corpus directory (one level up from ui directory)
  const dir = path.join(process.cwd(), '../corpus');
  console.log(`Reading files from ${dir}`);
  
  try {
    const files = await fs.readdir(dir);
    console.log(`Found ${files.length} files`);
    
    let processedCount = 0;
    for (const file of files) {
      if (!file.endsWith('.txt')) continue;
      
      console.log(`Processing ${file}...`);
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      const chunks = await processFileContent(content);
      console.log(`File ${file} split into ${chunks.length} chunks`);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `chunk-${Date.now()}-${i}-${file}`;
        const chunk = chunks[i];
        
        console.log(`Generating embedding for chunk ${i+1}/${chunks.length} of ${file}`);
        try {
          const embedding = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk,
          });
          
          console.log(`Upserting chunk ${i+1} to Pinecone`);
          await index.upsert([{
            id: chunkId,
            values: embedding.data[0].embedding,
            metadata: { 
              text: chunk, 
              fileName: file, 
              timestamp: new Date().toISOString(),
              chunkId
            },
          }]);
        } catch (error) {
          console.error(`Error processing chunk ${i+1} of ${file}:`, error);
          // Continue with the next chunk
        }
      }
      
      processedCount++;
      console.log(`Completed processing ${file} (${processedCount}/${files.length})`);
    }
    
    console.log('Knowledge base seeding complete!');
    console.log(`Processed ${processedCount} files`);
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

seed(); 