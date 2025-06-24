
import React, { useState, useCallback, useRef, useEffect } from 'react';
import PromptInput from './components/PromptInput';
import ResponseDisplay from './components/ResponseDisplay';
import { streamGenerateContent } from './services/geminiService';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [streamedResponse, setStreamedResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const responseDisplayRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }
    if (!process.env.API_KEY) {
      setError("API_KEY environment variable not set. Please ensure it is configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setStreamedResponse('');
    setError(null);

    try {
      const stream = streamGenerateContent(currentPrompt);
      for await (const chunk of stream) {
        setStreamedResponse((prev) => prev + chunk);
      }
    } catch (e: any) {
      console.error("Error generating content:", e);
      setError(e.message || "An unexpected error occurred. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (responseDisplayRef.current) {
      responseDisplayRef.current.scrollTop = responseDisplayRef.current.scrollHeight;
    }
  }, [streamedResponse]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-slate-100 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-3xl mx-auto bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8 mt-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-sky-400">Gemini AI Text Streamer</h1>
          <p className="text-slate-400 mt-2">Enter a prompt and watch the AI generate text in real-time.</p>
        </header>

        <PromptInput onSubmit={handleSubmit} currentPrompt={prompt} setPrompt={setPrompt} isLoading={isLoading} />

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading && !streamedResponse && (
          <div className="mt-6 flex flex-col items-center justify-center text-slate-400">
            <div className="spinner h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-lg">Generating response...</p>
          </div>
        )}
        
        {(streamedResponse || (isLoading && streamedResponse)) && (
          <ResponseDisplay responseText={streamedResponse} ref={responseDisplayRef} isLoading={isLoading && streamedResponse.length > 0} />
        )}
        
      </div>
      <footer className="w-full max-w-3xl mx-auto text-center py-8 text-slate-500 text-sm">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
