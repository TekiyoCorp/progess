'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Archive, AlertCircle, X, MessageSquare, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder } from '@/types';

interface TaskContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onBlock: (reason: string) => void;
  onSendToAI?: (taskTitle: string) => void;
  onAddToFolder?: (folderId: string) => void;
  folders?: Folder[];
  taskTitle?: string;
}

export function TaskContextMenu({ 
  x, 
  y, 
  onClose, 
  onDuplicate, 
  onArchive, 
  onBlock,
  onSendToAI,
  onAddToFolder,
  folders = [],
  taskTitle = '',
}: TaskContextMenuProps) {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [folderMenuTimeout, setFolderMenuTimeout] = useState<NodeJS.Timeout | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const handleBlock = () => {
    if (blockReason.trim()) {
      onBlock(blockReason);
      setShowBlockModal(false);
      setBlockReason('');
      onClose();
    }
  };

  const handleDuplicate = () => {
    onDuplicate();
    onClose();
  };

  const handleArchive = () => {
    onArchive();
    onClose();
  };

  const handleSendToAI = () => {
    if (onSendToAI && taskTitle) {
      onSendToAI(taskTitle);
    }
    onClose();
  };

  const handleAddToFolder = async (folderId: string) => {
    if (onAddToFolder) {
      await onAddToFolder(folderId);
      setShowFolderMenu(false);
    }
    onClose();
  };

  const handleMouseEnterFolder = () => {
    if (folderMenuTimeout) {
      clearTimeout(folderMenuTimeout);
      setFolderMenuTimeout(null);
    }
    setShowFolderMenu(true);
  };

  const handleMouseLeaveFolder = () => {
    const timeout = setTimeout(() => {
      setShowFolderMenu(false);
    }, 150); // Petit délai pour permettre de passer au sous-menu
    setFolderMenuTimeout(timeout);
  };

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (folderMenuTimeout) {
        clearTimeout(folderMenuTimeout);
      }
    };
  }, [folderMenuTimeout]);

  return (
    <>
      {/* Menu contextuel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-visible context-menu-container"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          minWidth: '180px',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          {onSendToAI && (
            <button
              onClick={handleSendToAI}
              className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Envoyer à l'IA
            </button>
          )}
          
          {onAddToFolder && folders.length > 0 && (
            <div 
              className="relative"
              onMouseEnter={handleMouseEnterFolder}
              onMouseLeave={handleMouseLeaveFolder}
            >
              <div
                className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3 h-3" />
                Ajouter à un dossier
                <span className="ml-auto text-[10px] text-white/40">→</span>
              </div>
              
              <AnimatePresence>
                {showFolderMenu && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full top-0 ml-1 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden min-w-[180px] max-h-[200px] overflow-y-auto z-[60] folder-submenu"
                    onMouseEnter={() => {
                      if (folderMenuTimeout) {
                        clearTimeout(folderMenuTimeout);
                        setFolderMenuTimeout(null);
                      }
                    }}
                    onMouseLeave={handleMouseLeaveFolder}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {folders.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-white/40">
                        Aucun dossier disponible
                      </div>
                    ) : (
                      folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToFolder(folder.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {folder.name}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div className="border-t border-white/10 my-1" />
          
          <button
            onClick={handleDuplicate}
            className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Copy className="w-3 h-3" />
            Dupliquer
          </button>
          
          <button
            onClick={handleArchive}
            className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Archive className="w-3 h-3" />
            Archiver
          </button>
          
          <button
            onClick={() => setShowBlockModal(true)}
            className="w-full px-4 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
          >
            <AlertCircle className="w-3 h-3" />
            Bloquer
          </button>
        </div>
      </motion.div>

      {/* Overlay pour fermer le menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onMouseDown={(e) => {
          // Ne pas fermer si on clique sur le menu ou le sous-menu
          const target = e.target as HTMLElement;
          if (!target.closest('.context-menu-container') && !target.closest('.folder-submenu')) {
            onClose();
          }
        }}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Modal de blocage */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowBlockModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 bg-black/90 border border-white/10 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Bloquer la tâche</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowBlockModal(false)}
                >
                  <X className="h-3 w-3 text-white/40" />
                </Button>
              </div>
              
              <p className="text-xs text-white/60 mb-4">
                Indiquez la raison du blocage de cette tâche :
              </p>
              
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: En attente du retour client"
                className="mb-4 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBlock();
                  } else if (e.key === 'Escape') {
                    setShowBlockModal(false);
                  }
                }}
              />
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBlockModal(false)}
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleBlock}
                  disabled={!blockReason.trim()}
                  className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  Bloquer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

