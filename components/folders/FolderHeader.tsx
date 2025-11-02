'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Folder, Trash2, Check, X, ChevronDown, ChevronRight, Euro } from 'lucide-react';
import { motion } from 'framer-motion';
import { Folder as FolderType } from '@/types';

interface FolderHeaderProps {
  folder: FolderType;
  name: string;
  isExpanded: boolean;
  taskCount: number;
  onToggle: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onUpdatePrice?: (price: number) => void;
}

export function FolderHeader({ 
  folder,
  name, 
  isExpanded, 
  taskCount, 
  onToggle, 
  onRename, 
  onDelete,
  onUpdatePrice,
}: FolderHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState(folder.price || 0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingPrice && priceInputRef.current) {
      priceInputRef.current.focus();
      priceInputRef.current.select();
    }
  }, [isEditingPrice]);

  const handleRename = () => {
    if (editedName.trim() && editedName !== name) {
      onRename(editedName.trim());
    } else {
      setEditedName(name);
    }
    setIsEditingName(false);
  };

  const handleCancel = () => {
    setEditedName(name);
    setIsEditingName(false);
  };

  const handlePriceUpdate = () => {
    if (editedPrice !== folder.price && onUpdatePrice) {
      onUpdatePrice(editedPrice);
    }
    setIsEditingPrice(false);
  };

  return (
    <div className="flex items-center gap-2 group py-1.5">
      {/* Toggle expand/collapse */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="h-5 w-5 shrink-0"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-white/60" />
        ) : (
          <ChevronRight className="h-3 w-3 text-white/60" />
        )}
      </Button>

      {/* Folder icon */}
      <Folder className="h-3 w-3 text-white/60 shrink-0" />

      {/* Folder name or input */}
      {isEditingName ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={nameInputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') handleCancel();
            }}
            className="flex-1 !bg-transparent border-none text-xs h-6 px-1 focus-visible:ring-0 text-white/70 shadow-none outline-none border-b border-white/20"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRename}
            className="h-5 w-5 shrink-0"
          >
            <Check className="h-3 w-3 text-green-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-5 w-5 shrink-0"
          >
            <X className="h-3 w-3 text-white/40" />
          </Button>
        </div>
      ) : (
        <>
          <span
            onClick={() => setIsEditingName(true)}
            className="flex-1 text-xs text-white/70 cursor-pointer truncate"
          >
            {name}
          </span>

          {/* Prix éditable */}
          {isEditingPrice ? (
            <div className="flex items-center gap-1">
              <input
                ref={priceInputRef}
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePriceUpdate();
                  if (e.key === 'Escape') {
                    setEditedPrice(folder.price || 0);
                    setIsEditingPrice(false);
                  }
                }}
                onBlur={handlePriceUpdate}
                className="w-20 bg-transparent text-[10px] text-white/70 outline-none border-b border-white/20 text-right px-1"
              />
              <span className="text-[10px] text-white/40">€</span>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingPrice(true)}
              className="flex items-center gap-0.5 cursor-pointer hover:text-white/80"
            >
              <Euro className="h-2.5 w-2.5 text-white/40" />
              <span className="text-[10px] text-white/50">
                {folder.price?.toLocaleString() || '0'}
              </span>
            </div>
          )}

          <span className="text-[10px] text-white/40">
            ({taskCount})
          </span>
        </>
      )}

      {/* Delete button */}
      {!isEditingName && !isEditingPrice && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 className="h-3 w-3 text-white/40" />
        </Button>
      )}
    </div>
  );
}
