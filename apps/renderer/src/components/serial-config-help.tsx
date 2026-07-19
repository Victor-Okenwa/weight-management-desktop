import { InfoIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FieldLabel } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function SerialConfigHint() {
  return (
    <p
      role="note"
      className="md:col-span-2 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-100"
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
      <span>
        Hover the{' '}
        <InfoIcon
          className="inline size-3.5 align-text-bottom text-amber-700 dark:text-amber-300"
          aria-hidden
        />{' '}
        icon next to each field for details, or leave the recommended defaults.
      </span>
    </p>
  );
}

/** Shared body styling so multi-line tips (parity, etc.) match the port tooltip. */
export function SerialTooltipBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-xs space-y-1.5 text-left text-sm leading-relaxed [&_kbd]:rounded [&_kbd]:bg-muted [&_kbd]:px-1 [&_kbd]:py-0.5 [&_kbd]:text-xs [&_kbd]:text-accent-foreground [&_ol]:mt-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_strong]:font-semibold',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldInfoTooltip({ info }: { info: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Field details"
          onClick={(e) => e.preventDefault()}
        >
          <InfoIcon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-xs flex-col items-start gap-0 px-3 py-2.5 text-left"
      >
        <SerialTooltipBody>{info}</SerialTooltipBody>
      </TooltipContent>
    </Tooltip>
  );
}

export function FieldLabelWithInfo({
  htmlFor,
  children,
  info,
}: {
  htmlFor: string;
  children: ReactNode;
  info: ReactNode;
}) {
  return (
    <FieldLabel htmlFor={htmlFor} className="inline-flex items-center gap-1.5">
      <span>{children}</span>
      <FieldInfoTooltip info={info} />
    </FieldLabel>
  );
}
