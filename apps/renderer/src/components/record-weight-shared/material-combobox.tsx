import { useRef, useState } from 'react';
import type { Material } from '@weight/shared/types/index';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

export function MaterialCombobox({
  materials,
  value,
  onChange,
  disabled = false,
}: {
  materials: Material[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const materialNames = materials.map((m) => m.name);

  return (
    <div className="relative">
      <Combobox open={open} onOpenChange={setOpen}>
        <ComboboxInput
          ref={inputRef}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type material name..."
          disabled={disabled}
        />
        <ComboboxContent className="w-full p-1" align="start" sideOffset={4}>
          {materialNames.length > 0 || value === '' ? (
            <ComboboxList>
              {value === '' && (
                <ComboboxItem
                  key="none"
                  value=""
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                    setTimeout(() => {
                      inputRef?.current?.focus();
                    }, 0);
                  }}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 pr-8 pl-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                >
                  None
                </ComboboxItem>
              )}
              {materialNames
                .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
                .map((name) => (
                  <ComboboxItem
                    key={name}
                    value={name}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setTimeout(() => {
                        inputRef?.current?.focus();
                      }, 0);
                    }}
                    className="relative flex w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 pr-8 pl-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                  >
                    {name}
                  </ComboboxItem>
                ))}
            </ComboboxList>
          ) : (
            <ComboboxEmpty>
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No materials available
              </div>
            </ComboboxEmpty>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
