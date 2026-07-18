/* eslint-disable react-refresh/only-export-components */
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  appearanceOptions,
  BAUD_RATES,
  FLOW_CONTROL_OPTIONS,
  PARITY_FLAGS,
} from '@weight/shared/constants/index';
import type { BaudRate, DataBits, SerialPortInfo, StopBits } from '@weight/shared/types/index';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  EthernetPortIcon,
  InfoIcon,
  KeyRound,
  Settings2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { SoftwareUnlockStep } from '@/components/setup/software-unlock-step';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
import { logger } from '@/lib/logger';
import { cn, getTicketPrefix } from '@/lib/utils';

export const Route = createFileRoute('/setup-wizard')({
  component: RouteComponent,
});

// ======================================================
// SCHEMA
// ======================================================

export const companyDetailsSchema = z.object({
  name: z.string().min(1, 'Company name is required').trim(),
  email: z.string().email('Invalid email address').trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[0-9]*$/, 'Phone number can only contain + and numbers')
    .optional()
    .or(z.literal('')),
});

export type CompanyDetails = z.infer<typeof companyDetailsSchema>;

export const hardwareSchema = z.object({
  port: z
    .string({ message: 'Field is required' })
    .regex(/^\d+$/, 'Port should only contain numbers')
    .transform((val) => (val ? `COM${val}` : val)),
  baudRate: z.string().min(1, 'Baud rate is required'),
  parity: z.enum(['none', 'even', 'odd', 'mark', 'space']),
  flowControl: z.enum(['none', 'xon/xoff', 'hardware']),
  stopBits: z
    .number()
    .int()
    .positive()
    .refine((v) => v === 1 || v === 2, {
      message: 'Stop bits must be 1 or 2',
    }),
  dataBits: z
    .number()
    .int()
    .positive()
    .refine((v) => [5, 6, 7, 8].includes(v), {
      message: 'Data bits must be 5, 6, 7, or 8',
    }),
  autoOpen: z.boolean(),
  indicator: z.string().min(1, 'Indicator is required'),
});

export type Hardware = z.infer<typeof hardwareSchema>;

export const preferencesSchema = z.object({
  defaultUnit: z.enum(['kg', 'ton', 'lb']),
  theme: z.enum(['light', 'dark', 'system']),
  ticketPrefix: z
    .string()
    .min(1, 'Ticket prefix is required')
    .max(3, 'You cannot go beyond 3 letters')
    .default('SRE'),
  ticketFooter: z
    .string()
    .trim()
    .min(1, 'Ticket footer is required')
    .default('Thank you for your custom.'),
});

export type Preferences = z.infer<typeof preferencesSchema>;

const licenseJsonSchema = z
  .string()
  .min(1, 'License is required')
  .superRefine((value, ctx) => {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      for (const key of ['machineId', 'issuedAt', 'expiresAt', 'signature'] as const) {
        if (typeof parsed[key] !== 'string' || parsed[key].length === 0) {
          ctx.addIssue({
            code: 'custom',
            message: `License must include a non-empty "${key}" field`,
          });
        }
      }
    } catch {
      ctx.addIssue({ code: 'custom', message: 'License must be valid JSON' });
    }
  });

export const softwareUnlockSchema = z.object({
  licenseJson: licenseJsonSchema,
  activated: z.boolean().refine((value) => value === true, {
    message: 'Activate the license to continue',
  }),
  expiresAt: z.string(),
});

export type SoftwareUnlock = z.infer<typeof softwareUnlockSchema>;

export const formSchema = z.object({
  softwareUnlock: softwareUnlockSchema,
  companyDetails: companyDetailsSchema,
  hardware: hardwareSchema,
  preferences: preferencesSchema,
});

type FormSchemaType = z.infer<typeof formSchema>;

// ======================================================
// STEPS
// ======================================================

const steps = [
  {
    value: 'softwareUnlock',
    title: 'Unlock',
    description: 'Activate this PC',
    fields: ['softwareUnlock.licenseJson', 'softwareUnlock.activated'] as const,
  },
  {
    value: 'companyDetails',
    title: 'Company',
    description: 'Station identity',
    fields: [
      'companyDetails.name',
      'companyDetails.address',
      'companyDetails.phone',
      'companyDetails.email',
    ] as const,
  },

  {
    value: 'hardware',
    title: 'Hardware',
    description: 'Scale link',
    fields: [
      'hardware.port',
      'hardware.baudRate',
      'hardware.parity',
      'hardware.flowControl',
      'hardware.stopBits',
      'hardware.dataBits',
      'hardware.autoOpen',
      'hardware.indicator',
    ] as const,
  },

  {
    value: 'preferences',
    title: 'Preferences',
    description: 'Units & tickets',
    fields: [
      'preferences.defaultUnit',
      'preferences.theme',
      'preferences.ticketPrefix',
      'preferences.ticketFooter',
    ] as const,
  },

  {
    value: 'overview',
    title: 'Review',
    description: 'Confirm & finish',
    fields: [] as const,
  },
] as const;

// Helper functions to detect required fields given schema
// Map of required fields
const requiredFields: Record<string, boolean> = {
  'softwareUnlock.licenseJson': true,
  'softwareUnlock.activated': true,
  'companyDetails.name': true,
  'companyDetails.email': false,
  'companyDetails.address': false,
  'companyDetails.phone': false,
  'hardware.port': true,
  'hardware.baudrate': true,
  'hardware.parity': true,
  'hardware.flowcontrol': true,
  'hardware.stopbits': true,
  'hardware.databits': true,
  'hardware.autoOpen': false,
  'hardware.indicator': true,
  'preferences.defaultUnit': true,
  'preferences.theme': true,
  'preferences.ticketPrefix': true,
  'preferences.ticketFooter': true,
};

// ======================================================
// COMPONENT
// ======================================================

// For field labels, add a red asterisk if required
function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children}
      <span className="text-red-600 pl-0.5" aria-hidden="true">
        *
      </span>
    </span>
  );
}

function serialPortToFormValue(serialPort: string | undefined): string {
  if (!serialPort) return '3';
  const match = /^COM(\d+)$/i.exec(serialPort.trim());
  if (match?.[1]) return match[1];
  return serialPort.replace(/^COM/i, '') || '3';
}

function RouteComponent() {
  const [stepIndex, setStepIndex] = useState(0);
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const router = useRouter();

  const currentStep = steps[stepIndex];

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      softwareUnlock: {
        licenseJson: '',
        activated: false,
        expiresAt: '',
      },

      companyDetails: {
        name: '',
        address: '',
        phone: '',
        email: '',
      },

      hardware: {
        port: '3',
        baudRate: '2400',
        parity: 'none',
        flowControl: 'none',
        stopBits: 1,
        dataBits: 8,
        autoOpen: false,
        indicator: '',
      },

      preferences: {
        defaultUnit: 'kg',
        theme: 'light',
        ticketPrefix: 'SRE',
        ticketFooter: 'thank you for your custom',
      },
    },
  });

  const unlockActivated = useWatch({
    control: form.control,
    name: 'softwareUnlock.activated',
  });
  const unlockExpiresAt = useWatch({
    control: form.control,
    name: 'softwareUnlock.expiresAt',
  });

  useEffect(() => {
    async function fetchPorts() {
      const ports = await window.electronAPI.listSerialPorts();
      setPorts(ports);
    }

    void fetchPorts();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateWizard() {
      if (!window.electronAPI) {
        setHydrated(true);
        return;
      }

      try {
        const [settings, licenseStatus] = await Promise.all([
          window.electronAPI.getAllSettings(),
          window.electronAPI.getLicenseStatus(),
        ]);

        if (cancelled) return;

        // Fully ready station — no need to show setup
        if (licenseStatus.setupCompleted && licenseStatus.activated) {
          await router.navigate({ to: '/' });
          return;
        }

        const unit = settings?.weightUnit;
        const defaultUnit = unit === 'kg' || unit === 'ton' || unit === 'lb' ? unit : 'kg';
        const theme =
          settings?.theme === 'light' || settings?.theme === 'dark' || settings?.theme === 'system'
            ? settings.theme
            : 'light';
        const parity = settings?.parity;
        const flowControl = settings?.flowControl;

        form.reset({
          softwareUnlock: {
            licenseJson: licenseStatus.licenseJson ?? '',
            activated: licenseStatus.activated,
            expiresAt: licenseStatus.expiresAt ?? '',
          },
          companyDetails: {
            name: settings?.companyName ?? '',
            address: settings?.companyAddress ?? '',
            phone: settings?.companyPhone ?? '',
            email: settings?.companyEmail ?? '',
          },
          hardware: {
            port: serialPortToFormValue(settings?.serialPort),
            baudRate: String(settings?.baudRate ?? 2400),
            parity:
              parity === 'none' ||
              parity === 'even' ||
              parity === 'odd' ||
              parity === 'mark' ||
              parity === 'space'
                ? parity
                : 'none',
            flowControl:
              flowControl === 'none' || flowControl === 'xon/xoff' || flowControl === 'hardware'
                ? flowControl
                : 'none',
            stopBits: settings?.stopBits === 2 ? 2 : 1,
            dataBits: ([5, 6, 7, 8] as const).includes(settings?.dataBits as 5 | 6 | 7 | 8)
              ? (settings?.dataBits as 5 | 6 | 7 | 8)
              : 8,
            autoOpen: settings?.autoOpen ?? false,
            indicator: settings?.indicatorType ?? '',
          },
          preferences: {
            defaultUnit,
            theme,
            ticketPrefix: settings?.ticketPrefix || 'SRE',
            ticketFooter: settings?.ticketFooter || 'thank you for your custom',
          },
        });

        // Resume after unlock (crash mid-setup) — skip unlock step
        if (licenseStatus.activated) {
          setStepIndex(1);
        }
      } catch (error) {
        logger('error', (error as Error).message);
        toast.error('Could not load saved station details');
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    void hydrateWizard();
    return () => {
      cancelled = true;
    };
  }, [form, router]);

  // ======================================================
  // NAVIGATION
  // ======================================================

  async function handleNext() {
    const isValid = await form.trigger(currentStep.fields);

    if (!isValid) {
      if (currentStep.value === 'softwareUnlock') {
        toast.info('Activate a valid license before continuing');
      } else {
        toast.info('Please complete all required fields');
      }
      return;
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  }

  // ======================================================
  // SUBMIT
  // ======================================================

  async function onSubmit(data: FormSchemaType) {
    try {
      const existing = await window.electronAPI.getAllSettings();
      const prefix = data.preferences.ticketPrefix || getTicketPrefix(data.companyDetails.name);
      const portValue = data.hardware.port.startsWith('COM')
        ? data.hardware.port
        : `COM${data.hardware.port}`;

      await window.electronAPI.updateSettings({
        companyName: data.companyDetails.name.toLowerCase(),
        companyAddress: data.companyDetails.address ?? '',
        companyPhone: data.companyDetails.phone ?? '',
        companyEmail: data.companyDetails.email ?? '',
        companyLogoPath: existing?.companyLogoPath ?? '',
        ticketPrefix: prefix,
        ticketFooter: data.preferences.ticketFooter ?? 'Thank you for your custom',
        nextTicketNumber: existing?.nextTicketNumber ?? 1,
        serialPort: portValue,
        baudRate: Number(data.hardware.baudRate) as unknown as BaudRate,
        dataBits: data.hardware.dataBits as unknown as DataBits,
        parity: data.hardware.parity,
        stopBits: data.hardware.stopBits as unknown as StopBits,
        flowControl: data.hardware.flowControl,
        autoOpen: data.hardware.autoOpen,
        indicatorType: data.hardware.indicator,
        weightUnit: data.preferences.defaultUnit,
        stableTolerance: existing?.stableTolerance ?? 0.5,
        stableDurationMs: existing?.stableDurationMs ?? 3000,
        theme: data.preferences.theme,
        autoPrint: existing?.autoPrint ?? false,
        printerName: existing?.printerName ?? '',
        printCopies: existing?.printCopies ?? 1,
      });

      // Station lifecycle lives on `installation`, not settings
      await window.electronAPI.completeSetup({});

      toast.success('Setup completed successfully');
      router.navigate({ to: '/' });
    } catch (error) {
      logger('error', (error as Error).message);
      toast.error('An error occurred while completing setup.');
    }
  }

  if (!hydrated) {
    return (
      <article className="flex min-h-[50vh] items-center justify-center px-4 py-10">
        <p className="text-muted-foreground text-sm">Loading station setup…</p>
      </article>
    );
  }

  return (
    <article className="px-4 py-10 md:py-12">
      <Card className="bg-background mx-auto max-w-6xl overflow-hidden border-border/70 shadow-sm">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-start gap-4 border-b border-border/60 px-6 py-6">
          <Badge className="size-12 shrink-0 rounded-md [&>svg]:size-7!">
            {currentStep.value === 'softwareUnlock' ? <KeyRound /> : <Settings2Icon />}
          </Badge>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400">
              First-time setup
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Configure your station
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              Unlock this PC, then set company details, scale hardware, and ticket preferences.
            </p>
          </div>
        </div>

        {/* ======================================================
            CUSTOM STEPPER
        ====================================================== */}

        <div className="px-4 pt-8 md:px-6">
          <div className="flex items-start justify-between gap-1 overflow-x-auto pb-1">
            {steps.map((step, index) => {
              const isCompleted = index < stepIndex;
              const isActive = index === stepIndex;

              return (
                <div key={step.value} className="flex min-w-0 flex-1 items-start">
                  <button
                    type="button"
                    onClick={() => {
                      if (index <= stepIndex) {
                        setStepIndex(index);
                      }
                    }}
                    className="group flex min-w-18 flex-col items-center text-center sm:min-w-0"
                  >
                    <div
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all md:size-10',
                        isCompleted && 'border-emerald-500 bg-emerald-500 text-white',
                        isActive &&
                          !isCompleted &&
                          'border-primary bg-primary text-primary-foreground',
                        !isCompleted &&
                          !isActive &&
                          'border-border bg-background text-muted-foreground',
                      )}
                    >
                      {isCompleted ? <Check className="size-4" /> : index + 1}
                    </div>

                    <div className="mt-2 px-0.5">
                      <p
                        className={cn(
                          'text-[11px] font-medium sm:text-xs md:text-sm',
                          isActive && 'text-primary',
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-muted-foreground mt-0.5 hidden text-[10px] leading-tight sm:block md:text-xs">
                        {step.description}
                      </p>
                    </div>
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'mx-1 mt-4 h-px min-w-3 flex-1 md:mx-2',
                        index < stepIndex ? 'bg-emerald-500/70' : 'bg-border',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================
            FORM
        ====================================================== */}

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 bg-accent/15 px-6 py-6">
            {currentStep.value !== 'softwareUnlock' && currentStep.value !== 'overview' && (
              <div className="mb-6 text-muted-foreground text-sm">
                <span className="text-destructive">*</span> Indicates required field
              </div>
            )}

            {/* ======================================================
              SOFTWARE UNLOCK
          ====================================================== */}

            {currentStep.value === 'softwareUnlock' && (
              <SoftwareUnlockStep
                activated={Boolean(unlockActivated)}
                expiresAt={unlockExpiresAt ?? ''}
              />
            )}

            {/* ======================================================
              COMPANY DETAILS
          ====================================================== */}

            {currentStep.value === 'companyDetails' && (
              <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <hgroup>
                    <h2 className="text-2xl font-bold tracking-tight">Company details</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Shown on tickets and station records. You can edit these later in Settings.
                    </p>
                  </hgroup>
                </div>
                {/* COMPANY NAME */}
                <Controller
                  name="companyDetails.name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="companyDetails-name">
                        {requiredFields['companyDetails.name'] ? (
                          <RequiredLabel>Company Name</RequiredLabel>
                        ) : (
                          <>Company Name</>
                        )}
                      </FieldLabel>

                      <Input
                        {...field}
                        id="companyDetails-name"
                        className="min-h-12 capitalize"
                        placeholder="Solution Road Equipments and Spars Limited"
                      />

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {/* EMAIL */}
                <Controller
                  name="companyDetails.email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="companyDetails-email">
                        {requiredFields['companyDetails.email'] ? (
                          <RequiredLabel>Company Email</RequiredLabel>
                        ) : (
                          <>Company Email</>
                        )}
                      </FieldLabel>

                      <Input
                        {...field}
                        id="companyDetails-email"
                        className="min-h-12"
                        placeholder="company@example.com"
                      />

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {/* ADDRESS */}
                <Controller
                  name="companyDetails.address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="companyDetails-address">
                        {requiredFields['companyDetails.address'] ? (
                          <RequiredLabel>Company Address</RequiredLabel>
                        ) : (
                          <>Company Address</>
                        )}
                      </FieldLabel>

                      <Input
                        {...field}
                        id="companyDetails-address"
                        className="min-h-12"
                        placeholder="123 Main Street"
                      />

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {/* PHONE */}
                <Controller
                  name="companyDetails.phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="companyDetails-phone">
                        {requiredFields['companyDetails.phone'] ? (
                          <RequiredLabel>Phone Number</RequiredLabel>
                        ) : (
                          <>Phone Number</>
                        )}
                      </FieldLabel>

                      <Input
                        {...field}
                        id="companyDetails-phone"
                        className="min-h-12"
                        placeholder="+23480123456789"
                      />

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            )}

            {/* ======================================================
              HARDWARE
          ====================================================== */}

            {currentStep.value === 'hardware' && (
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
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="hardware-port">
                        {requiredFields['hardware.port'] ? (
                          <RequiredLabel>Port</RequiredLabel>
                        ) : (
                          <>Port</>
                        )}
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
                                        form.setValue('hardware.port', match[1]);
                                        console.log(field.value);
                                      } else if (typeof port.path === 'string') {
                                        form.setValue('hardware.port', port.path);
                                      }
                                    }}
                                    onKeyUp={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        // accessibility for keyboard users
                                        const match = /COM(\d+)/i.exec(port.path || '');
                                        if (match?.[1]) {
                                          form.setValue('hardware.port', match[1]);
                                        } else if (typeof port.path === 'string') {
                                          form.setValue('hardware.port', port.path);
                                        }
                                      }
                                    }}
                                    tabIndex={0}
                                  >
                                    <span className="font-mono font-medium text-sm">
                                      {port.path}
                                    </span>
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
                        <TooltipTrigger
                          type="button"
                          className="text-foreground/50 text-xs flex gap-1"
                        >
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
                                  Select <span className="font-semibold">Device Manager</span> from
                                  the menu.
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
                                  Enter that number above (e.g.,{' '}
                                  <span className="font-mono">3</span> for{' '}
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
                  control={form.control}
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
                  control={form.control}
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
                          Parity is a form of error checking used in serial communication to detect
                          accidental changes to raw data. For most modern weighing devices,{' '}
                          <strong>none</strong> is recommended unless your device specifically
                          requires even, odd, mark, or space parity. Selecting <strong>none</strong>{' '}
                          ensures simpler and more compatible communication.
                        </span>
                      </FieldDescription>

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="hardware.flowControl"
                  control={form.control}
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
                          Flow control manages the way data is sent between your station and the
                          weighing device to prevent data loss or overflow. In most cases,
                          especially for standard weighing devices, <strong>none</strong> is
                          recommended. Use other options only if your device documentation requires
                          them.
                        </span>
                      </FieldDescription>

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="hardware.stopBits"
                  control={form.control}
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
                          Stop bits define the end of a byte in serial communication. For most
                          devices, <strong>1</strong> stop bit is standard and recommended. Only
                          choose <strong>2</strong> stop bits if your hardware documentation
                          specifically requires it.
                        </span>
                      </FieldDescription>

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="hardware.dataBits"
                  control={form.control}
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
                        Set the number of data bits per character. Common values are 7 or 8, but
                        check your device specifications for the correct setting. But we recommend
                        setting it to 8 as most indicators are compatible to it.
                      </FieldDescription>

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="hardware.autoOpen"
                  control={form.control}
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
                        Automatically open and connect to the device when the application starts. We
                        recommend leaving this unchecked unless you want the connection to be
                        established on startup.
                      </FieldDescription>
                    </Field>
                  )}
                />

                <Controller
                  name="hardware.indicator"
                  control={form.control}
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
                        <span className="font-semibold">D300</span> unless you have been provided a
                        different option.
                      </FieldDescription>

                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            )}

            {/* ======================================================
              PREFERENCES
          ====================================================== */}

            {currentStep.value === 'preferences' && (
              <div className="space-y-7">
                <hgroup>
                  <h2 className="text-2xl font-bold tracking-tight">Preferences</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Defaults for weight units, appearance, and printed tickets.
                  </p>
                </hgroup>
                <Controller
                  name="preferences.defaultUnit"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="preferences-defaultUnit">
                        {requiredFields['preferences.defaultUnit'] ? (
                          <RequiredLabel>Default Unit</RequiredLabel>
                        ) : (
                          <>Default Unit</>
                        )}
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        defaultValue="kg"
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="preferences-defaultUnit"
                          className="min-h-12"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="ton">Tons (ton)</SelectItem>
                          <SelectItem value="lb">Pounds (lb)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Select the default unit for weight measurements.
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="preferences.theme"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="preferences-theme">
                        {requiredFields['preferences.theme'] ? (
                          <RequiredLabel>Appearance</RequiredLabel>
                        ) : (
                          <>Appearance</>
                        )}
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                        defaultValue="light"
                      >
                        <SelectTrigger
                          id="preferences-theme"
                          className="min-h-12 w-full text-left!"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {appearanceOptions.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value}>
                              <div>
                                <div className="font-semibold">{theme.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {theme.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FieldDescription>Select your preferred theme(s)</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="preferences.ticketPrefix"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="preferences-ticketPrefix">
                        {requiredFields['preferences.ticketPrefix'] ? (
                          <RequiredLabel>Ticket Prefix</RequiredLabel>
                        ) : (
                          <>Ticket Prefix</>
                        )}
                      </FieldLabel>
                      <Input
                        {...field}
                        id="preferences-ticketPrefix"
                        className="min-h-12 uppercase"
                        placeholder="SRE"
                        maxLength={3}
                      />
                      <FieldDescription>
                        The prefix used for ticket numbers, e.g. "SRE".
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="preferences.ticketFooter"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="preferences-ticketFooter">
                        {requiredFields['preferences.ticketFooter'] ? (
                          <RequiredLabel>Ticket Footer</RequiredLabel>
                        ) : (
                          <>Ticket Footer</>
                        )}
                      </FieldLabel>
                      <Input
                        {...field}
                        id="preferences-ticketFooter"
                        className="min-h-12"
                        placeholder="Thank you for your custom"
                      />
                      <FieldDescription>
                        The message displayed at the bottom of the printed ticket.
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            )}

            {/* ======================================================
              OVERVIEW
          ====================================================== */}

            {currentStep.value === 'overview' && (
              <div className="space-y-6">
                <hgroup>
                  <h2 className="text-2xl font-bold tracking-tight">Review</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Confirm everything looks right. You can change these later in Settings.
                  </p>
                </hgroup>

                <div className="grid gap-4 md:grid-cols-2">
                  <section className="rounded-lg border border-border/70 bg-background/50 p-4">
                    <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      License
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Status</dt>
                        <dd className="font-medium">
                          {unlockActivated ? 'Unlocked' : 'Not activated'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Expires</dt>
                        <dd className="font-medium font-mono text-xs">{unlockExpiresAt || '—'}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="rounded-lg border border-border/70 bg-background/50 p-4">
                    <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      Company
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Name</dt>
                        <dd className="font-medium text-right">
                          {form.getValues('companyDetails.name')?.trim() || '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="font-medium text-right">
                          {form.getValues('companyDetails.phone')?.trim() || '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="font-medium text-right break-all">
                          {form.getValues('companyDetails.email')?.trim() || '—'}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="rounded-lg border border-border/70 bg-background/50 p-4">
                    <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      Hardware
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Port</dt>
                        <dd className="font-medium font-mono">
                          {form.getValues('hardware.port')
                            ? `COM${form.getValues('hardware.port')}`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Baud</dt>
                        <dd className="font-medium">
                          {form.getValues('hardware.baudRate') || '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Indicator</dt>
                        <dd className="font-medium capitalize">
                          {form.getValues('hardware.indicator') || '—'}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="rounded-lg border border-border/70 bg-background/50 p-4">
                    <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      Preferences
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Unit</dt>
                        <dd className="font-medium">{form.getValues('preferences.defaultUnit')}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Theme</dt>
                        <dd className="font-medium capitalize">
                          {form.getValues('preferences.theme')}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Ticket prefix</dt>
                        <dd className="font-medium font-mono">
                          {form.getValues('preferences.ticketPrefix')}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </div>
            )}

            {/* ======================================================
              FOOTER
          ====================================================== */}

            <div className="mt-12 flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Step {stepIndex + 1} of {steps.length}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={stepIndex === 0}
                >
                  <ArrowLeft />
                  Previous
                </Button>

                {stepIndex < steps.length - 1 && (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ArrowRight />
                  </Button>
                )}

                {stepIndex === steps.length - 1 && <Button type="submit">Complete</Button>}
              </div>
            </div>
          </form>
        </FormProvider>
      </Card>
    </article>
  );
}
