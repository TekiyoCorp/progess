'use client';

import { useRef, useState } from 'react';
import { Plus, Link as LinkIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskAttachmentUploaderProps {
  taskId: string;
  onAttachmentAdded: (attachment: any) => void;
}

export function TaskAttachmentUploader({ taskId, onAttachmentAdded }: TaskAttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);
        formData.append('type', file.type.startsWith('image/') ? 'image' : 'pdf');

        const response = await fetch('/api/tasks/upload-attachment', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Upload failed');
        }

        const { attachment } = await response.json();
        console.log('✅ [Attachment] Upload successful, attachment:', attachment);

        // Passer l'attachment au callback pour mise à jour optimiste
        onAttachmentAdded(attachment);
      }

      // Attendre un peu pour que Supabase ait le temps de mettre à jour
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('❌ [Attachment] Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload du fichier';
      alert(errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddLink = async () => {
    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) return;

    try {
      // Valider l'URL
      let urlObj: URL;
      try {
        // Ajouter https:// si pas de protocol
        const urlToParse = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
          ? trimmedUrl
          : `https://${trimmedUrl}`;
        urlObj = new URL(urlToParse);
      } catch (error) {
        alert('URL invalide. Veuillez entrer une URL valide (ex: example.com ou https://example.com)');
        return;
      }

      const response = await fetch('/api/tasks/add-attachment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          url: urlObj.href,
          name: urlObj.hostname,
        }),
      });

      if (!response.ok) throw new Error('Failed to add link');

      const { attachment } = await response.json();
      setLinkUrl('');
      setShowLinkInput(false);
      onAttachmentAdded(attachment);
    } catch (error) {
      console.error('❌ [Attachment] Link error:', error);
      alert('Erreur lors de l\'ajout du lien');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        aria-label="Upload file"
      >
        {isUploading ? (
          <div className="h-3 w-3 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="h-3 w-3 text-white/40" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setShowLinkInput(!showLinkInput)}
        aria-label="Add link"
      >
        <LinkIcon className="h-3 w-3 text-white/40" />
      </Button>

      {showLinkInput && (
        <div className="flex items-center gap-1 bg-black/40 rounded px-2 py-1">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLink();
              if (e.key === 'Escape') {
                setShowLinkInput(false);
                setLinkUrl('');
              }
            }}
            placeholder="https://..."
            className="bg-transparent border-none outline-none text-xs text-white/70 w-32"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={handleAddLink}
          >
            <Plus className="h-3 w-3 text-white/60" />
          </Button>
        </div>
      )}
    </div>
  );
}

