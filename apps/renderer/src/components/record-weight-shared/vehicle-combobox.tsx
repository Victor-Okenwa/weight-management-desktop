import type { Vehicle } from '@weight/shared/types/index';
import { useState } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { FieldDescription } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function VehicleCombobox({
  vehicles,
  value,
  onChange,
  disabled = false,
  allowNew = true,
}: {
  vehicles: Vehicle[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  allowNew?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!allowNew) {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select vehicle..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.name}>
                {v.name} | {v.tareWeight}
              </SelectItem>
            ))}
            {vehicles.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No vehicles available</div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="relative">
      <Combobox open={open} onOpenChange={setOpen} modal={false}>
        <div className="flex">
          <ComboboxInput
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            className="uppercase"
            placeholder="Type vehicle number..."
            disabled={disabled}
          />
          {value &&
            (() => {
              const selectedVehicle = vehicles.find((v) => v.name === value);
              if (selectedVehicle) {
                return (
                  <div className="ml-2 flex items-center text-xs text-muted-foreground">
                    Tare: {selectedVehicle.tareWeight},{' '}
                    <span className="ml-1">{selectedVehicle.tareUnit}</span>
                  </div>
                );
              }
              return null;
            })()}
        </div>
        <ComboboxContent className="w-full p-1 z-50" align="start" sideOffset={4}>
          {vehicles.length > 0 || value === '' ? (
            <ComboboxList>
              {vehicles.map((vehicle) => (
                <ComboboxItem
                  key={vehicle.id}
                  value={vehicle.name}
                  onClick={() => {
                    onChange(vehicle.name);
                    setOpen(false);
                  }}
                  className="relative flex w-full cursor-default items-center justify-between gap-2 rounded-sm bg-transparent py-1.5 pr-8 pl-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                >
                  <span>{vehicle.name}</span>
                  <b>
                    {vehicle.tareWeight}, <small>{vehicle.tareUnit}</small>
                  </b>
                </ComboboxItem>
              ))}
            </ComboboxList>
          ) : (
            <ComboboxEmpty>
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No vehicles available</div>
            </ComboboxEmpty>
          )}
        </ComboboxContent>
      </Combobox>
      <FieldDescription className="text-xs">
        Input new vehicle name, if you input an already existing vehicle the current tare weight
        will replace the old tare weight.
      </FieldDescription>
    </div>
  );
}
