import { Bird } from 'lucide-react';

import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <Bird aria-label="Twitter Clone" role="img" className={cn('text-foreground', className)} />
  );
}
