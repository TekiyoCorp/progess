'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

interface AICommandInputProps {
  onCommand: (command: string) => Promise<void>;
}

export function AICommandInput({ onCommand }: AICommandInputProps) {
  const [value, setValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isProcessing) return;

    setIsProcessing(true);
    setResponse(null);
    
    try {
      // Appeler l'API de guidance
      const res = await fetch('/api/ai/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: value.trim(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          currentTime: new Date().toISOString(),
          problems: [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.guidance);
      }
      
      await onCommand(value.trim());
      setValue('');
    } catch (error) {
      console.error('Error processing command:', error);
      setResponse('Erreur lors de la communication avec l\'IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-[300px]">
      {/* Animation Apple Intelligence - Dégradé périphérique */}
      <AnimatePresence>
        {isProcessing && (
          <>
            {/* Dégradé en haut */}
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="fixed top-0 left-0 right-0 h-[200px] pointer-events-none z-[9998]"
              style={{
                background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.2), transparent)',
              }}
            />
            
            {/* Dégradé en bas */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="fixed bottom-0 left-0 right-0 h-[200px] pointer-events-none z-[9998]"
              style={{
                background: 'linear-gradient(to top, rgba(219, 39, 119, 0.3), rgba(147, 51, 234, 0.2), transparent)',
              }}
            />
            
            {/* Dégradé à gauche */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="fixed top-0 left-0 bottom-0 w-[200px] pointer-events-none z-[9998]"
              style={{
                background: 'linear-gradient(to right, rgba(147, 51, 234, 0.25), rgba(59, 130, 246, 0.15), transparent)',
              }}
            />
            
            {/* Dégradé à droite */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="fixed top-0 right-0 bottom-0 w-[200px] pointer-events-none z-[9998]"
              style={{
                background: 'linear-gradient(to left, rgba(219, 39, 119, 0.25), rgba(147, 51, 234, 0.15), transparent)',
              }}
            />
          </>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="relative space-y-2">
        {isProcessing ? (
          <Loader2 className="h-3 w-3 text-purple-400 animate-spin shrink-0" />
        ) : (
          <Image src="/star.svg" alt="" width={12} height={12} className="shrink-0" />
        )}

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-3 py-2 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="text-[10px] text-white/70 prose prose-invert prose-xs max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0 break-words">{children}</p>,
                    strong: ({ children }) => <strong className="text-white/90 font-semibold">{children}</strong>,
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
