'use client';

import {useEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';
import {Button} from '@/components/ui/button';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // The blocking script in layout.tsx sets the class before paint; read it here.
  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* localStorage unavailable; theme just won't persist */
    }
    setIsDark(next);
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {/* Render the moon until mounted so SSR and first client render match. */}
      {mounted && isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
