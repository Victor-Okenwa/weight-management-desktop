import { zodResolver } from '@hookform/resolvers/zod';
import { BAUD_RATES, FLOW_CONTROL_OPTIONS, PARITY_FLAGS } from '@weight/shared/constants/index';
import type { BaudRate, DataBits, SerialPortInfo } from '@weight/shared/types/index';
import { EthernetPortIcon, InfoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/lib/logger';
import { useSettingsStore } from '@/store/settingsStore';
import { type Hardware, hardwareSchema } from '../routes/setup-wizard';

export function SerialConfigurationsTab() {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const { settings } = useSettingsStore();

  const form = useForm<Hardware>({
    resolver: zodResolver(hardwareSchema),
    defaultValues: {
      port: settings?.serialPort ? String(settings.serialPort).replace(/^COM/i, '') : '',

      flowControl: settings?.flowControl || 'none',
      stopBits: settings?.stopBits || 1,
      baudRate: String(settings?.baudRate) || '2400',
      parity: settings?.parity || 'none',
      dataBits: Number(settings?.parity) || 8,
      autoOpen: settings?.autoOpen || false,
      indicator: settings?.indicatorType,
    },
  });

  useEffect(() => {
    async function fetchPorts() {
      const ports = await window.electronAPI.listSerialPorts();
      setPorts(ports);
    }

    fetchPorts();
  }, []);

  async function onSubmit(data: Hardware) {
    try {
      await window.electronAPI.updateSettings({
        serialPort: data.port,
        baudRate: data.baudRate as unknown as BaudRate,
        parity: data.parity,
        flowControl: data.flowControl,
        stopBits: data.stopBits,
        dataBits: data.dataBits as DataBits,
        autoOpen: data.autoOpen,
        indicatorType: data.indicator,
      });

      toast.success('Updates are successful');
    } catch (error) {
      toast.error((error as Error).message || 'Something went wrong');
      logger('error', (error as Error).message || 'Failed to update serial config');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serial and Device Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="">
          <div className="space-y-4 gap-4 grid md:grid-cols-2 grid-cols-1 items-start">
            <Controller
              name="port"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="port">Port</FieldLabel>
                  <InputGroup className="min-h-12!">
                    <InputGroupInput
                      defaultValue={3}
                      {...field}
                      type="number"
                      id="port"
                      placeholder="3"
                    />
                    <InputGroupAddon>COM</InputGroupAddon>
                    <Popover>
                      <PopoverTrigger asChild>
                        <InputGroupButton>
                          <EthernetPortIcon />
                        </InputGroupButton>
                      </PopoverTrigger>

                      <PopoverTrigger>
                        {/* Popover content: Map of available serial ports */}
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
                                  onClick={() => {
                                    // Extract just the numeric part of 'COM#', fallback to whole
                                    const match = /COM(\d+)/i.exec(port.path || '');
                                    if (match?.[1]) {
                                      form.setValue('port', match[1]);
                                    } else if (typeof port.path === 'string') {
                                      form.setValue('port', port.path);
                                    }
                                  }}
                                  onKeyUp={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      // accessibility for keyboard users
                                      const match = /COM(\d+)/i.exec(port.path || '');
                                      if (match?.[1]) {
                                        form.setValue('port', match[1]);
                                      } else if (typeof port.path === 'string') {
                                        form.setValue('port', port.path);
                                      }
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
                      </PopoverTrigger>
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
                              Select <span className="font-semibold">Device Manager</span> from the
                              menu.
                            </span>
                          </li>
                          <li>
                            <span>
                              In Device Manager, expand{' '}
                              <span className="font-semibold">
                                &quot;Ports (COM &amp; LPT)&quot;
                              </span>
                              .
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
                              Enter that number above (e.g., <span className="font-mono">3</span>{' '}
                              for <span className="font-mono">COM3</span>).
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
              name="baudRate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field orientation="responsive" data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="baudRate">Baud Rate</FieldLabel>
                  </FieldContent>
                  <Select
                    name={field.name}
                    value={field.value}
                    defaultValue="2400"
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="baudRate"
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
              name="parity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="parity">Parity</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    defaultValue="none"
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="parity"
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
                      Parity is a form of error checking used in serial communication to detect
                      accidental changes to raw data. For most modern weighing devices,{' '}
                      <strong>none</strong> is recommended unless your device specifically requires
                      even, odd, mark, or space parity. Selecting <strong>none</strong> ensures
                      simpler and more compatible communication.
                    </span>
                  </FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="flowControl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="flowControl">Flow Control</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    defaultValue="none"
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="flowControl"
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
                      Flow control manages the way data is sent between your station and the
                      weighing device to prevent data loss or overflow. In most cases, especially
                      for standard weighing devices, <strong>none</strong> is recommended. Use other
                      options only if your device documentation requires them.
                    </span>
                  </FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="stopBits"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="stopBits">Stop Bits</FieldLabel>
                  <Select
                    name={field.name}
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                    defaultValue="1"
                  >
                    <SelectTrigger
                      id="stopBits"
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
                      <strong>2</strong> stop bits if your hardware documentation specifically
                      requires it.
                    </span>
                  </FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="dataBits"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="dataBits">Data Bits</FieldLabel>
                  <Select
                    name={field.name}
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                    defaultValue="8"
                  >
                    <SelectTrigger
                      id="dataBits"
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
                    Set the number of data bits per character. Common values are 7 or 8, but check
                    your device specifications for the correct setting. But we recommend setting it
                    to 8 as most indicators are compatible to it.
                  </FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="autoOpen"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border"
                      id="autoOpen"
                    />
                    <span>Auto Open Connection</span>
                  </label>

                  <FieldDescription>
                    Automatically open and connect to the device when the application starts. We
                    recommend leaving this unchecked unless you want the connection to be
                    established on startup.
                  </FieldDescription>
                </Field>
              )}
            />
            <Controller
              name="indicator"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="indicator">Indicator</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={'d300'}
                  >
                    <SelectTrigger
                      id="indicator"
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
                    <span className="font-semibold">D300</span> unless you have been provided a
                    different option.
                  </FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <Button disabled={form.formState.isSubmitting} className="mt-4 px-16 py-7">
            {form.formState.isSubmitting ? (
              <>
                <Spinner /> Updating Configurations...
              </>
            ) : (
              'Update Configurations'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
