import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DialogScrollBodyProps {
  children: ReactNode;
  className?: string;
  maxHeightClassName?: string;
}

export function DialogScrollBody({
  children,
  className,
  maxHeightClassName = 'max-h-[min(60vh,32rem)]',
}: DialogScrollBodyProps) {
  return (
    <ScrollArea className={cn('w-full overflow-y-auto', maxHeightClassName, className)}>
      <div className="pe-3">{children}</div>
    </ScrollArea>
  );
}
