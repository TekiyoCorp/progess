'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, AlertCircle, Folder, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch, SearchResult } from '@/hooks/useSearch';
import { Task, Problem, Folder as FolderType } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { query, setQuery, results, selectedIndex, selectNext, selectPrevious, getSelectedResult } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Gérer les raccourcis clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          const selected = getSelectedResult();
          if (selected) {
            handleSelectResult(selected);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectNext, selectPrevious, getSelectedResult, onClose]);

  const handleSelectResult = (result: SearchResult) => {
    // TODO: Naviguer vers l'élément ou ouvrir un détail
    console.log('Selected:', result);
    onClose();
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4 text-pink-400" />;
      case 'problem':
        return <AlertCircle className="h-4 w-4 text-purple-400" />;
      case 'folder':
        return <Folder className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[20vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-white/40" />
                    <Input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher des tâches, problèmes, dossiers..."
                      className="flex-1 bg-transparent border-none text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] text-white/40 bg-white/5 rounded border border-white/10">
                      ESC
                    </kbd>
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                  {results.length === 0 && query && (
                    <div className="p-8 text-center">
                      <p className="text-white/40 text-sm">
                        Aucun résultat pour "{query}"
                      </p>
                    </div>
                  )}

                  {results.length === 0 && !query && (
                    <div className="p-8 text-center">
                      <Search className="h-12 w-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">
                        Commencez à taper pour rechercher
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <kbd className="px-2 py-1 text-[10px] text-white/40 bg-white/5 rounded border border-white/10">
                          ↑↓ Navigation
                        </kbd>
                        <kbd className="px-2 py-1 text-[10px] text-white/40 bg-white/5 rounded border border-white/10">
                          ↵ Sélectionner
                        </kbd>
                      </div>
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="py-2">
                      {results.map((result, index) => (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => handleSelectResult(result)}
                          className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                            index === selectedIndex
                              ? 'bg-white/10'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          {getResultIcon(result.type)}
                          
                          <div className="flex-1 text-left">
                            <div className="text-sm text-white font-medium">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-white/40 mt-0.5">
                                {result.subtitle}
                              </div>
                            )}
                          </div>

                          {index === selectedIndex && (
                            <ArrowRight className="h-4 w-4 text-white/40" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                  <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-white/40">
                      <div className="flex items-center gap-1">
                        <span>{results.length}</span>
                        <span>résultat{results.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 text-[10px] text-white/40 bg-white/5 rounded border border-white/10">
                        ↑↓
                      </kbd>
                      <span className="text-[10px] text-white/40">pour naviguer</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

