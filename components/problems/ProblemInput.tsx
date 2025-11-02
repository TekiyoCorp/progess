'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';

interface ProblemInputProps {
  onAdd: (title: string) => Promise<void>;
}

export function ProblemInput({ onAdd }: ProblemInputProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim() || loading) return;

    setLoading(true);
    try {
      await onAdd(value.trim());
      setValue('');
    } catch (error) {
      console.error('Error adding problem:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5 items-center justify-start">
      {loading ? (
        <Loader2 className="h-3 w-3 text-white/40 shrink-0 animate-spin" />
      ) : (
        <Plus className="h-3 w-3 text-white/40 shrink-0" />
      )}
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ajouter un problème"
        disabled={loading}
        className="flex-1 !bg-transparent border-none text-xs h-6 px-0 focus-visible:ring-0 text-white/60 placeholder:text-white/30 shadow-none text-left"
        aria-label="Description du blocage"
      />
    </form>
  );
}
