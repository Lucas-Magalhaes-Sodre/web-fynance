import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function PremiumCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('soft-card rounded-2xl', className)} {...props} />;
}

