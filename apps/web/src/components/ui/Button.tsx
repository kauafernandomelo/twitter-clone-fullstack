import type { ButtonHTMLAttributes, Ref } from 'react';

import { cn } from '@/lib/cn';

import { Spinner } from './Spinner';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  inverse: 'bg-foreground text-background hover:bg-foreground/90',
  outline: 'border border-border text-brand hover:bg-brand/10',
  secondary: 'border border-border text-foreground hover:bg-foreground/10',
  ghost: 'text-foreground hover:bg-foreground/10',
} as const;

const sizes = {
  sm: 'h-8 px-4 text-sm',
  md: 'h-10 px-5 text-[15px]',
  lg: 'h-13 px-8 text-[17px]',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-5 text-current" /> : children}
    </button>
  );
}
