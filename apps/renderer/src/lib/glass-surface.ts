import { cn } from '@/lib/utils';

export const glassSurfaceClassName = cn(
  'relative isolate overflow-hidden rounded-xl border border-border/60 bg-card/40',
  'shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_6%,transparent)] backdrop-blur-md',
  'before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:z-10 before:h-px',
  'before:bg-gradient-to-r before:from-transparent before:via-primary/25 before:to-transparent',
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-50',
  'after:bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_70%)]',
);
