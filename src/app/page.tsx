import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-black">
      <h1 className="text-2xl font-bold text-center my-6 text-white">chatUW</h1>
      
      <Chat />
      
      <footer className="max-w-4xl mx-auto mt-10 text-center text-sm text-gray-500">
        <p>Powered by Next.js, OpenAI, and Pinecone</p>
      </footer>
    </main>
  );
}
