'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TaskAttachment } from '@/types';
import Image from 'next/image';
import { useEffect } from 'react';

interface AttachmentViewerProps {
  attachment: TaskAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AttachmentViewer({ attachment, isOpen, onClose }: AttachmentViewerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!attachment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-white/10" showCloseButton={true}>
        <div className="relative w-full h-full">

          {attachment.type === 'image' && (
            <div className="w-full h-[90vh] flex items-center justify-center p-8">
              <Image
                src={attachment.url}
                alt={attachment.name}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain rounded-lg"
                unoptimized
              />
            </div>
          )}

          {attachment.type === 'pdf' && (
            <div className="w-full h-[90vh] p-8">
              <iframe
                src={attachment.url}
                className="w-full h-full rounded-lg border border-white/10"
                title={attachment.name}
              />
            </div>
          )}

          {attachment.type === 'link' && (
            <div className="w-full h-[90vh] p-8 flex flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium text-white/90">{attachment.name}</h3>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pink-400 hover:text-pink-300 underline break-all"
                >
                  {attachment.url}
                </a>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    Ouvrir le lien
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/50">
            <span>{attachment.name}</span>
            {attachment.size && (
              <span>{(attachment.size / 1024).toFixed(1)} KB</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

