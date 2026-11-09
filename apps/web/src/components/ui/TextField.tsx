import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  useId,
  useState,
} from 'react';

import { cn } from '@/lib/cn';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

// Input com label flutuante (estilo Twitter). Funciona com o register() do react-hook-form.
// O truque do label: placeholder=" " + a variante peer-placeholder-shown do Tailwind.
export function TextField({
  label,
  error,
  endAdornment,
  id,
  maxLength,
  className,
  onChange,
  ref,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [length, setLength] = useState(0);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setLength(event.target.value.length);
    onChange?.(event);
  }

  return (
    <div className={className}>
      <div
        className={cn(
          'relative rounded-md border transition-colors focus-within:ring-1',
          error
            ? 'border-danger focus-within:ring-danger'
            : 'border-border focus-within:border-brand focus-within:ring-brand',
        )}
      >
        <input
          {...props}
          ref={ref}
          id={inputId}
          maxLength={maxLength}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={handleChange}
          className={cn(
            'peer w-full rounded-md bg-transparent px-2 pt-6 pb-2 text-[17px] outline-none',
            endAdornment && 'pr-12',
          )}
        />
        <label
          htmlFor={inputId}
          className={cn(
            'pointer-events-none absolute top-1.5 left-2 text-[13px] transition-all',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-[17px]',
            'peer-focus:top-1.5 peer-focus:text-[13px]',
            error ? 'text-danger' : 'text-muted peer-focus:text-brand',
          )}
        >
          {label}
        </label>
        {maxLength !== undefined && (
          <span
            aria-hidden="true"
            className="text-muted absolute top-1.5 right-2 hidden text-[13px] peer-focus:block"
          >
            {length} / {maxLength}
          </span>
        )}
        {endAdornment && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">{endAdornment}</div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-danger mt-1 px-2 text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}
