'use client';
import { useState } from 'react';
import { Message } from '@/types';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    const newMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    
    try {
      console.log("Sending request to chat API...");
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMessage], query: input }),
      });
      
      // Even if we get a non-200 response, try to parse the JSON first
      // as it might contain useful error information
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
          throw new Error("Could not parse server response");
        }
      } else {
        // Not a JSON response
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
      }
      
      // Now handle the response based on its status
      if (!response.ok) {
        if (data && data.error) {
          throw new Error(data.error);
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      }
      
      // At this point we have a valid JSON response with 200 status
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        // Show error to user
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error || 'Something went wrong'}` 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: `Sorry, there was an error processing your request. Please try again later. (Error: ${error instanceof Error ? error.message : 'Unknown error'})` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">      
      <div className="bg-zinc-800 p-4 rounded-lg min-h-[400px] mb-4 overflow-y-auto text-white">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center my-8">
            Ask a question about Waterloo
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 p-3 rounded ${msg.role === 'user' ? 'bg-blue-900' : 'bg-zinc-700'}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 flex justify-center items-center p-4">
            <div className="animate-pulse">Processing your request...</div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about UWaterloo..."
          className="flex-1 p-2 border rounded bg-zinc-700 text-white placeholder-gray-400 border-zinc-600"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-700 text-white rounded disabled:bg-zinc-600"
        >
          Send
        </button>
      </form>
    </div>
  );
} 