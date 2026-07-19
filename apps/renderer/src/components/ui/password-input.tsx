import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type * as React from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  /** Extra classes on the outer input group. */
  groupClassName?: string;
};

function PasswordInput({ className, groupClassName, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup
      className={cn('h-auto min-h-12', groupClassName)}
      data-disabled={disabled ? true : undefined}
    >
      <InputGroupInput
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={cn('min-h-12', className)}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((prev) => !prev)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
