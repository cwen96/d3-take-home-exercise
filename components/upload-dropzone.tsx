'use client';

import {useRef, useState} from 'react';
import {Upload} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

const ACCEPT = 'application/json,.json';

/** Large drag-and-drop target shown in the empty state. */
export function UploadDropzone({
  onFile,
  busy,
}: {
  onFile: (file: File) => void;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={e => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        'flex flex-col items-center rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <Upload className="mb-3 size-8 text-muted-foreground" />
      <p className="text-sm font-medium">Drop an alerts JSON file here</p>
      <p className="mb-4 text-xs text-muted-foreground">
        or choose a file to begin triage
      </p>
      <Button onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? 'Loading…' : 'Choose file'}
      </Button>
    </div>
  );
}

/** Compact upload button reused in the toolbar to re-upload a file. */
export function UploadButton({
  onFile,
  busy,
}: {
  onFile: (file: File) => void;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <Upload />
        {busy ? 'Loading…' : 'Upload JSON'}
      </Button>
    </>
  );
}
