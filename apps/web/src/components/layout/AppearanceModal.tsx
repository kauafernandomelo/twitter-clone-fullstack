import { Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme';

const OPTIONS = [
  {
    value: 'system',
    label: 'Automático',
    description: 'Segue o tema do seu sistema',
    icon: Monitor,
  },
  { value: 'light', label: 'Claro', description: 'Fundo branco', icon: Sun },
  { value: 'dark', label: 'Escuro', description: 'Fundo preto', icon: Moon },
] as const satisfies {
  value: ThemePreference;
  label: string;
  description: string;
  icon: unknown;
}[];

export function AppearanceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Aparência" variant="compact">
      <ThemePicker />
    </Modal>
  );
}

function ThemePicker() {
  const [selected, setSelected] = useState<ThemePreference>(getThemePreference);

  function choose(value: ThemePreference) {
    setSelected(value);
    setThemePreference(value); // aplica na hora, sem botão "salvar"
  }

  return (
    <div className="px-4 pb-6">
      <p className="mb-4 text-[15px] text-muted">A escolha fica salva neste navegador.</p>
      <div role="radiogroup" aria-label="Tema" className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map(({ value, label, description, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected === value}
            onClick={() => choose(value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors',
              selected === value
                ? 'border-brand bg-brand/10'
                : 'border-border hover:bg-foreground/5',
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
            <span className="font-bold">{label}</span>
            <span className="text-[13px] text-muted">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
