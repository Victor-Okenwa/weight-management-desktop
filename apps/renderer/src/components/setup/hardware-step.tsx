import { BAUD_RATES, FLOW_CONTROL_OPTIONS, PARITY_FLAGS } from '@weight/shared/constants/index';
import type { SerialPortInfo } from '@weight/shared/types/index';
import { EthernetPortIcon, InfoIcon } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RequiredLabel, requiredFields } from './required-label';

type HardwareFields = {
  hardware: {
    port: string;
    baudRate: string;
    parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
    flowControl: 'none' | 'xon/xoff' | 'hardware';
    stopBits: number;
    dataBits: number;
    autoOpen: boolean;
    indicator: string;
  };
};

type HardwareStepProps = {
  ports: SerialPortInfo[];
};

export function HardwareStep({ ports }: HardwareStepProps) {
  const { control, setValue } = useFormContext<HardwareFields>();

  function selectPort(path: string | undefined) {
    const match = /COM(\d+)/i.exec(path || '');
    if (match?.[1]) {
      setValue('hardware.port', match[1]);
    } else if (typeof path === 'string') {
      setValue('hardware.port', path);
    }
  }

  return (
    <div className="space-y-4 gap-4 grid md:grid-cols-2 grid-cols-1 items-start">
      <div className="md:col-span-2">
        <hgroup>
          <h2 className="text-2xl font-bold tracking-tight">Hardware setup</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Connect the weighing indicator so live weight can be captured at this station.
          </p>
        </hgroup>
      </div>

      <Controller
        name="hardware.port"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="hardware-port">
              {requiredFields['hardware.port'] ? <RequiredLabel>Port</RequiredLabel> : <>Port</>}
            </FieldLabel>
            <InputGroup className="min-h-12!">
              <InputGroupInput
                defaultValue={3}
                {...field}
                type="number"
                id="hardware-port"
                placeholder="3"
              />
              <InputGroupAddon>COM</InputGroupAddon>

              <Popover>
                <PopoverTrigger asChild>
                  <InputGroupButton>
                    <EthernetPortIcon />
                  </InputGroupButton>
                </PopoverTrigger>

                <PopoverContent className="w-80 p-4">
                  <h4 className="text-md font-semibold mb-2">Available Ports</h4>
                  {ports && ports.length > 0 ? (
                    <ul className="grid gap-2">
                      {ports.map((port, idx) => (
                        <Button
                          type="button"
                          variant={
                            String(port.path).replace('COM', '') === String(field.value)
                              ? 'secondary'
                              : 'outline'
                          }
                          key={port.path ?? idx}
                          className={`border rounded-lg p-2 flex gap-1 transition cursor-pointer text-left justify-between ${
                            String(port.path).replace('COM', '') === String(field.value)
                              ? 'border-primary bg-primary/10'
                              : 'border-border'
                          }`}
                          onClick={() => selectPort(port.path)}
                          onKeyUp={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              selectPort(port.path);
                            }
                          }}
                          tabIndex={0}
                        >
                          <span className="font-mono font-medium text-sm">{port.path}</span>
                          {port.manufacturer && (
                            <span className="text-xs text-muted-foreground">
                              {port.manufacturer}
                            </span>
                          )}
                          {port.serialNumber && (
                            <span className="text-xs text-muted-foreground">
                              Serial: {port.serialNumber}
                            </span>
                          )}
                          {port.friendlyName && (
                            <span className="text-xs text-muted-foreground">
                              {port.friendlyName}
                            </span>
                          )}
                        </Button>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground text-sm block p-2">
                      No serial ports found.
                    </span>
                  )}
                </PopoverContent>
              </Popover>
            </InputGroup>

            <Tooltip>
              <TooltipTrigger type="button" className="text-foreground/50 text-xs flex gap-1">
                <InfoIcon className="size-4" />
                Hover to see details on how to get your port or leave it as 3
              </TooltipTrigger>

              <TooltipContent>
                <div className="text-sm max-w-xs">
                  <strong>How to locate Device Manager:</strong>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>
                      <span>
                        Press{' '}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs text-accent-foreground">
                          Windows
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs text-accent-foreground">
                          X
                        </kbd>{' '}
                        on your keyboard.
                      </span>
                    </li>
                    <li>
                      <span>
                        Select <span className="font-semibold">Device Manager</span> from the menu.
                      </span>
                    </li>
                    <li>
                      <span>
                        In Device Manager, expand{' '}
                        <span className="font-semibold">&quot;Ports (COM &amp; LPT)&quot;</span>.
                      </span>
                    </li>
                    <li>
                      <span>
                        Find the device that matches your hardware (e.g., &quot;USB Serial
                        Device&quot;), and note the number listed as{' '}
                        <span className="font-semibold">COM#</span>.
                      </span>
                    </li>
                    <li>
                      <span>
                        Enter that number above (e.g., <span className="font-mono">3</span> for{' '}
                        <span className="font-mono">COM3</span>).
                      </span>
                    </li>
                  </ol>
                </div>
              </TooltipContent>
            </Tooltip>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="hardware.baudRate"
        control={control}
        render={({ field, fieldState }) => (
          <Field orientation="responsive" data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel htmlFor="hardware-baudRate">
                {requiredFields['hardware.baudRate'] ? (
                  <RequiredLabel>Baud Rate</RequiredLabel>
                ) : (
                  <>Baud Rate</>
                )}
              </FieldLabel>
            </FieldContent>
            <Select
              name={field.name}
              value={field.value}
              defaultValue="2400"
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="hardware-baudRate"
                className="min-h-12"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent position="item-aligned">
                {BAUD_RATES.map((rate) => (
                  <SelectItem key={rate} value={String(rate)}>
                    {rate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FieldDescription>Set Baud Rate to 2400 if you are unsure</FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="hardware.parity"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="hardware-parity">
              {requiredFields['hardware.parity'] ? (
                <RequiredLabel>Parity</RequiredLabel>
              ) : (
                <>Parity</>
              )}
            </FieldLabel>
            <Select
              name={field.name}
              value={field.value}
              defaultValue="none"
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="hardware-parity"
                className="min-h-12 w-full"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {PARITY_FLAGS.map((flag) => (
                  <SelectItem key={flag} value={flag}>
                    {flag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FieldDescription>
              <span>
                Parity is a form of error checking used in serial communication to detect accidental
                changes to raw data. For most modern weighing devices, <strong>none</strong> is
                recommended unless your device specifically requires even, odd, mark, or space
                parity. Selecting <strong>none</strong> ensures simpler and more compatible
                communication.
              </span>
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="hardware.flowControl"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="hardware-flowControl">
              {requiredFields['hardware.flowControl'] ? (
                <RequiredLabel>Flow Control</RequiredLabel>
              ) : (
                <>Flow Control</>
              )}
            </FieldLabel>
            <Select
              name={field.name}
              value={field.value}
              defaultValue="none"
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="hardware-flowControl"
                className="min-h-12 w-full"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {FLOW_CONTROL_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FieldDescription>
              <span>
                Flow control manages the way data is sent between your station and the weighing
                device to prevent data loss or overflow. In most cases, especially for standard
                weighing devices, <strong>none</strong> is recommended. Use other options only if
                your device documentation requires them.
              </span>
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="hardware.stopBits"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="hardware-stopBits">
              {requiredFields['hardware.stopBits'] ? (
                <RequiredLabel>Stop Bits</RequiredLabel>
              ) : (
                <>Stop Bits</>
              )}
            </FieldLabel>
            <Select
              name={field.name}
              value={String(field.value)}
              onValueChange={(val) => field.onChange(Number(val))}
              defaultValue="1"
            >
              <SelectTrigger
                id="hardware-stopBits"
                className="min-h-12 w-full"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FieldDescription>
              <span>
                Stop bits define the end of a byte in serial communication. For most devices,{' '}
                <strong>1</strong> stop bit is standard and recommended. Only choose{' '}
                <strong>2</strong> stop bits if your hardware documentation specifically requires
                it.
              </span>
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="hardware.dataBits"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="hardware-dataBits">
              {requiredFields['hardware.dataBits'] ? (
                <RequiredLabel>Data Bits</RequiredLabel>
              ) : (
                <>Data Bits</>
              )}
            </FieldLabel>
            <Select
              name={field.name}
              value={String(field.value)}
              onValueChange={(val) => field.onChange(Number(val))}
              defaultValue="8"
            >
              <SelectTrigger
                id="hardware-dataBits"
                className="min-h-12 w-full"
                aria-invalid={fieldState?.invalid}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[5, 6, 7, 8].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FieldDescription>
              Set the number of data bits per character. Common values are 7 or 8, but check your
              device specifications for the correct setting. But we recommend setting it to 8 as
              most indicators are compatible to it.
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="hardware.autoOpen"
        control={control}
        render={({ field }) => (
          <Field>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border"
                id="hardware-autoOpen"
              />
              <span>Auto Open Connection</span>
            </label>

            <FieldDescription>
              Automatically open and connect to the device when the application starts. We recommend
              leaving this unchecked unless you want the connection to be established on startup.
            </FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="hardware.indicator"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="hardware-indicator">
              {requiredFields['hardware.indicator'] ? (
                <RequiredLabel>Indicator</RequiredLabel>
              ) : (
                <>Indicator</>
              )}
            </FieldLabel>
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              defaultValue={'d300'}
            >
              <SelectTrigger
                id="hardware-indicator"
                className="min-h-12"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select indicator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="d300">D300</SelectItem>
              </SelectContent>
            </Select>

            <FieldDescription>
              Choose the type of indicator your hardware uses. We recommend selecting{' '}
              <span className="font-semibold">D300</span> unless you have been provided a different
              option.
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}
