'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface RevenueInputProps {
  onUpdate: (amount: number) => void;
}

export function RevenueInput({ onUpdate }: RevenueInputProps) {
  const [revenue, setRevenue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Charger depuis localStorage
    const saved = localStorage.getItem('tekiyo_monthly_goal');
    if (saved) {
      setRevenue(saved);
    }
  }, []);

  const handleSubmit = () => {
    const amount = parseFloat(revenue.replace(/\s/g, '').replace(',', '.'));
    if (!isNaN(amount)) {
      localStorage.setItem('tekiyo_monthly_goal', amount.toString());
      onUpdate(amount);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] text-white/40">Objectif:</span>
      {isEditing ? (
        <>
          <Input
            type="text"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="50000"
            className="h-5 text-xs w-20 px-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
          <span className="text-[10px] text-white/40">€</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSubmit}
            className="h-5 w-5"
          >
            <Check className="h-3 w-3 text-white/60" />
          </Button>
        </>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-white/60 hover:text-white/90 transition-colors"
        >
          {revenue ? `${parseFloat(revenue).toLocaleString('fr-FR')} €` : 'Définir'}
        </button>
      )}
    </div>
  );
}

