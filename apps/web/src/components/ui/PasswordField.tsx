import { Eye, EyeOff } from 'lucide-react';
import { type ComponentProps, useState } from 'react';

import { TextField } from './TextField';

export function PasswordField(
  props: Omit<ComponentProps<typeof TextField>, 'type' | 'endAdornment'>,
) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="rounded-full p-1.5 text-muted hover:bg-foreground/10 hover:text-foreground"
        >
          <Icon className="size-5" />
        </button>
      }
    />
  );
}
