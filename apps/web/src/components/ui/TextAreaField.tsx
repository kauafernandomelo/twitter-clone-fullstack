import { type ChangeEvent, type Ref, type TextareaHTMLAttributes, useId, useState } from 'react';

import { cn } from '@/lib/cn';

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
};

// Mesma ideia do TextField (label flutuante + contador), para textos longos como a bio.
export function TextAreaField({
  label,
  error,
  id,
  maxLength,
  className,
  onChange,
  defaultValue,
  ref,
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [length, setLength] = useState(String(defaultValue ?? '').length);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
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
        <textarea
          {...props}
          ref={ref}
          id={inputId}
          rows={rows}
          maxLength={maxLength}
          defaultValue={defaultValue}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={handleChange}
          className="peer w-full resize-none rounded-md bg-transparent px-2 pt-6 pb-2 text-[17px] outline-none"
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
            className="absolute top-1.5 right-2 hidden text-[13px] text-muted peer-focus:block"
          >
            {length} / {maxLength}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 px-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
