import { Message } from "@/types";

export const processFileContent = async (content: string): Promise<string[]> => {
  const chunkSize = 1000;
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
};

export const formatMessages = (messages: Message[], context: string): Message[] => {
  return [
    {
      role: "system",
      content: `You are a helpful assistant for University of Waterloo students. Answer based on the provided context.

If the user asks about a specific non-Waterloo location (like San Francisco, NYC, Toronto, etc.) by name, you can provide information about that location if it appears in the context.

If the user doesn't specify a location when asking about places to eat, restaurants, cafes, or other location-based queries, always assume they are asking about places in Waterloo or near the University of Waterloo campus.

If the context doesn't contain relevant information to answer the user's question, inform them that you don't have that specific information and offer to help with something else.`,
    },
    ...messages.slice(0, -1),
    {
      role: "user",
      content: `Context: ${context}

Question: ${messages[messages.length - 1].content}`,
    },
  ];
};
