import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import {
  appearanceOptions,
  BAUD_RATES,
  FLOW_CONTROL_OPTIONS,
  PARITY_FLAGS,
} from '@weight/shared/constants/index';
import { ArrowLeft, ArrowRight, Check, InfoIcon, Settings2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, toSnakeCaseObject } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';

export const Route = createFileRoute('/setup-wizard')({
  component: RouteComponent,
});

// ======================================================
// SCHEMA
// ======================================================

const formSchema = z.object({
  companyDetails: z.object({
    name: z.string().min(1, 'Company name is required'),

    email: z.email('Invalid email address').optional().or(z.literal('')),

    address: z.string().optional().or(z.literal('')),

    phone: z
      .string()
      .regex(/^\+?[0-9]*$/, 'Phone number can only contain + and numbers')
      .optional()
      .or(z.literal('')),
  }),

  hardware: z.object({
    port: z
      .string('Field is required')
      .regex(/^\d+$/, 'Port should only contain numbers')
      .transform((val) => (val ? `COM${val}` : val)),

    baudRate: z.string().min(1, 'Baud rate is required'),

    parity: z.enum(['none', 'even', 'odd', 'mark', 'space']),

    flowControl: z.enum(['none', 'xon', 'xoff', 'xany', 'rtscts']),

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
  }),

  preferences: z.object({
    defaultUnit: z.enum(['kg', 'ton', 'lb']),

    theme: z.enum(['light', 'dark', 'system']),
  }),
});

type FormSchemaType = z.infer<typeof formSchema>;

// ======================================================
// STEPS
// ======================================================

const steps = [
  {
    value: 'companyDetails',
    title: 'Company Details',
    description: 'Set your company info',
    fields: [
      'companyDetails.name',
      'companyDetails.address',
      'companyDetails.phone',
      'companyDetails.email',
    ] as const,
  },

  {
    value: 'hardware',
    title: 'Hardware Setup',
    description: 'Configure weighing device',
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
    description: 'Default units and theme',
    fields: ['preferences.defaultUnit', 'preferences.theme'] as const,
  },

  {
    value: 'overview',
    title: 'Overview',
    description: 'Review setup',
    fields: [] as const,
  },
] as const;

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

function RouteComponent() {
  const [stepIndex, setStepIndex] = useState(0);
  const { loadSettings, updateSetting } = useSettingsStore();

  const currentStep = steps[stepIndex];

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),

    defaultValues: {
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
      },
    },
  });

  // Helper functions to detect required fields given schema
  // Map of required fields
  const requiredFields: Record<string, boolean> = {
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
  };

  // ======================================================
  // NAVIGATION
  // ======================================================

  async function handleNext() {
    const isValid = await form.trigger(currentStep.fields);

    if (!isValid) {
      toast.info('Please complete all required fields');

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
    console.log(toSnakeCaseObject(data));

    toast.success('Setup completed successfully');
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <article className="px-4 py-12">
      <Card className="bg-background mx-auto max-w-6xl p-6">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center gap-4">
          <Badge className="size-12 rounded-md [&>svg]:size-7!">
            <Settings2Icon />
          </Badge>

          <div>
            <small className="text-sm uppercase text-blue-600">First-time setup</small>

            <h1 className="text-3xl font-bold">Configure your station</h1>
          </div>
        </div>

        {/* ======================================================
            CUSTOM STEPPER
        ====================================================== */}

        <div className="mt-10">
          <div className="flex items-start justify-between gap-2 overflow-x-auto">
            {steps.map((step, index) => {
              const isCompleted = index < stepIndex;
              const isActive = index === stepIndex;

              return (
                <div key={step.value} className="flex flex-1 items-start">
                  {/* STEP */}

                  <button
                    type="button"
                    onClick={() => {
                      if (index <= stepIndex) {
                        setStepIndex(index);
                      }
                    }}
                    className="group flex flex-col items-center text-center"
                  >
                    {/* CIRCLE */}

                    <div
                      className={cn(
                        'flex size-12 items-center justify-center rounded-full border-2 font-semibold transition-all',
                        isCompleted && 'border-green-500 bg-green-500 text-white',
                        isActive && 'border-primary bg-primary text-white',
                        !isCompleted && !isActive && 'bg-background text-muted-foreground',
                      )}
                    >
                      {isCompleted ? <Check className="size-5" /> : index + 1}
                    </div>

                    {/* TEXT */}

                    <div className="mt-3">
                      <p className={cn('text-sm font-medium', isActive && 'text-primary')}>
                        {step.title}
                      </p>

                      <p className="text-muted-foreground mt-1 text-xs">{step.description}</p>
                    </div>
                  </button>

                  {/* LINE */}

                  {index < steps.length - 1 && (
                    <div className="mx-2 mt-6 h-[2px] flex-1 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================
            FORM
        ====================================================== */}

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-12">
          {/* ======================================================
              COMPANY DETAILS
          ====================================================== */}

          {currentStep.value === 'companyDetails' && (
            <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                      className="min-h-12"
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
                        weighing device to prevent data loss or overflow. In most cases, especially
                        for standard weighing devices, <strong>none</strong> is recommended. Use
                        other options only if your device documentation requires them.
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
                      Set the number of data bits per character. Common values are 7 or 8, but check
                      your device specifications for the correct setting. But we recommend setting
                      it to 8 as most indicators are compatible to it.
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
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="lb">Pounds (lb)</SelectItem>
                        <SelectItem value="oz">Ounces (oz)</SelectItem>
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
            </div>
          )}

          {/* ======================================================
              OVERVIEW
          ====================================================== */}

          {currentStep.value === 'overview' && (
            <div className="space-y-4">
              <hgroup>
                <h2 className="text-2xl font-bold">Overview</h2>
                <small>
                  Please crosscheck if all fields are correct. You can modify these fields later in
                  settings.
                </small>
              </hgroup>

              {/* Company Details */}
              <div>
                <h3 className="font-semibold mb-2">Company Details</h3>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Name:</span>{' '}
                    {form.getValues('companyDetails.name')?.trim() ? (
                      form.getValues('companyDetails.name')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{' '}
                    {form.getValues('companyDetails.email')?.trim() ? (
                      form.getValues('companyDetails.email')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{' '}
                    {form.getValues('companyDetails.address')?.trim() ? (
                      form.getValues('companyDetails.address')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{' '}
                    {form.getValues('companyDetails.phone')?.trim() ? (
                      form.getValues('companyDetails.phone')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* Hardware */}
              <div>
                <h3 className="font-semibold mb-2">Hardware</h3>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Port:</span>{' '}
                    {form.getValues('hardware.port')?.trim() ? (
                      form.getValues('hardware.port')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Baudrate:</span>{' '}
                    {form.getValues('hardware.baudRate')?.trim() ? (
                      form.getValues('hardware.baudRate')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Parity:</span>{' '}
                    {form.getValues('hardware.parity')?.trim() ? (
                      form.getValues('hardware.parity')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Flow Control:</span>{' '}
                    {form.getValues('hardware.flowControl')?.trim() ? (
                      form.getValues('hardware.flowControl')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Stop Bits:</span>{' '}
                    {form.getValues('hardware.stopBits') !== undefined &&
                    form.getValues('hardware.stopBits') !== null ? (
                      form.getValues('hardware.stopBits')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Data Bits:</span>{' '}
                    {form.getValues('hardware.dataBits') !== undefined &&
                    form.getValues('hardware.dataBits') !== null ? (
                      form.getValues('hardware.dataBits')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>

                  <div>
                    <span className="font-medium">Auto Open:</span>{' '}
                    {typeof form.getValues('hardware.autoOpen') === 'boolean' ? (
                      form.getValues('hardware.autoOpen') ? (
                        'Yes'
                      ) : (
                        'No'
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Indicator:</span>{' '}
                    {form.getValues('hardware.indicator')?.trim() ? (
                      form.getValues('hardware.indicator')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* Preferences */}
              <div>
                <h3 className="font-semibold mb-2">Preferences</h3>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Default Unit:</span>{' '}
                    {form.getValues('preferences.defaultUnit')?.trim() ? (
                      form.getValues('preferences.defaultUnit')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Theme:</span>{' '}
                    {form.getValues('preferences.theme')?.trim() ? (
                      form.getValues('preferences.theme')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
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
      </Card>
    </article>
  );
}
