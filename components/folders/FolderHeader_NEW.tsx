'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Folder, Trash2, ChevronDown, ChevronRight, Euro } from 'lucide-react';
import { Folder as FolderType } from '@/types';

interface FolderHeaderProps {
  folder: FolderType;
  isExpanded: boolean;
  taskCount: number;
  onToggle: () => void;
  onRename: (id: string, newName: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onDelete: (id: string) => void;
}

export function FolderHeader({ 
  folder,
  isExpanded, 
  taskCount, 
  onToggle, 
  onRename,
  onUpdatePrice, 
  onDelete 
}: FolderHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedName, setEditedName] = useState(folder.name);
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

  const handleNameUpdate = () => {
    if (editedName.trim() && editedName !== folder.name) {
      onRename(folder.id, editedName.trim());
    } else {
      setEditedName(folder.name);
    }
    setIsEditingName(false);
  };

  const handlePriceUpdate = () => {
    if (editedPrice !== folder.price) {
      onUpdatePrice(folder.id, editedPrice);
    }
    setIsEditingPrice(false);
  };

  return (
    <div className="flex items-center gap-2 group py-1.5">
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

      <Folder className="h-3 w-3 text-white/60 shrink-0" />

      {isEditingName ? (
        <input
          ref={nameInputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleNameUpdate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNameUpdate();
            if (e.key === 'Escape') {
              setEditedName(folder.name);
              setIsEditingName(false);
            }
          }}
          className="flex-1 bg-transparent text-xs text-white/90 outline-none border-b border-white/20 px-1"
        />
      ) : (
        <span
          onClick={() => setIsEditingName(true)}
          className="flex-1 text-xs text-white/70 cursor-pointer truncate hover:text-white/90"
        >
          {folder.name}
        </span>
      )}

      {isEditingPrice ? (
        <div className="flex items-center gap-1">
          <input
            ref={priceInputRef}
            type="number"
            value={editedPrice}
            onChange={(e) => setEditedPrice(parseInt(e.target.value) || 0)}
            onBlur={handlePriceUpdate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePriceUpdate();
              if (e.key === 'Escape') {
                setEditedPrice(folder.price || 0);
                setIsEditingPrice(false);
              }
            }}
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

      <span className="text-[10px] text-white/40">({taskCount})</span>

      {!isEditingName && !isEditingPrice && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(folder.id)}
          className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 className="h-3 w-3 text-white/40" />
        </Button>
      )}
    </div>
  );
}

