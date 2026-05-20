import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { BAUD_RATES, FLOW_CONTROL_OPTIONS, PARITY_FLAGS } from '@weight/shared/constants/index';
import { ArrowLeft, ArrowRight, Check, InfoIcon, Settings2Icon } from 'lucide-react';
import { useState } from 'react';
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

    baudrate: z.string().min(1, 'Baud rate is required'),

    parity: z.enum(['none', 'even', 'odd', 'mark', 'space']),

    flowcontrol: z.enum(['none', 'xon', 'xoff', 'xany', 'rtscts']),

    stopbits: z
      .number()
      .int()
      .positive()
      .refine((v) => v === 1 || v === 2, {
        message: 'Stop bits must be 1 or 2',
      }),

    databits: z
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
      'hardware.baudrate',
      'hardware.parity',
      'hardware.flowcontrol',
      'hardware.stopbits',
      'hardware.databits',
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

function RouteComponent() {
  const [stepIndex, setStepIndex] = useState(0);

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
        baudrate: '2400',
        parity: 'none',
        flowcontrol: 'none',
        stopbits: 1,
        databits: 8,
        autoOpen: false,
        indicator: '',
      },

      preferences: {
        defaultUnit: 'kg',
        theme: 'system',
      },
    },
  });

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
    console.log(data);

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
                      <p
                        className={cn(
                          'text-sm font-medium',

                          isActive && 'text-primary',
                        )}
                      >
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
                    <FieldLabel htmlFor="company-name">Company Name</FieldLabel>

                    <Input
                      {...field}
                      id="company-name"
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
                    <FieldLabel htmlFor="company-email">Company Email</FieldLabel>

                    <Input
                      {...field}
                      id="company-email"
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
                    <FieldLabel htmlFor="company-address">Company Address</FieldLabel>

                    <Input
                      {...field}
                      id="company-address"
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
                    <FieldLabel htmlFor="company-phone">Phone Number</FieldLabel>

                    <Input
                      {...field}
                      id="company-phone"
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
                    <FieldLabel htmlFor="hardware-port">Port</FieldLabel>
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
                name="hardware.baudrate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="responsive" data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="baudrate">Baud Rate</FieldLabel>
                    </FieldContent>
                    <Select
                      name={field.name}
                      value={field.value}
                      defaultValue="2400"
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="baudrate"
                        className="min-h-12"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        {BAUD_RATES.map((rate) => (
                          <SelectItem key={rate} value={rate}>
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
                    <FieldLabel htmlFor="hardware-parity">Parity</FieldLabel>
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

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="hardware.flowcontrol"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="hardware-flowcontrol">Flow Control</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      defaultValue="none"
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="hardware-flowcontrol"
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="hardware.stopbits"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="hardware-stopbits">Stop Bits</FieldLabel>
                    <Input
                      {...field}
                      id="hardware-stopbits"
                      className="min-h-12"
                      type="number"
                      min={1}
                      max={2}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="hardware.databits"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="hardware-databits">Data Bits</FieldLabel>
                    <Input
                      {...field}
                      id="hardware-databits"
                      className="min-h-12"
                      type="number"
                      min={5}
                      max={8}
                    />
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
                  </Field>
                )}
              />

              <Controller
                name="hardware.indicator"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="hardware-indicator">Indicator</FieldLabel>
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
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Preferences</h2>

              <p className="text-muted-foreground">Add your preferences fields here.</p>
            </div>
          )}

          {/* ======================================================
              OVERVIEW
          ====================================================== */}

          {currentStep.value === 'overview' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Overview</h2>

              <pre className="bg-muted overflow-auto rounded-xl p-4 text-sm">
                {JSON.stringify(form.getValues(), null, 2)}
              </pre>
            </div>
          )}

          {/* ======================================================
              FOOTER
          ====================================================== */}

          <div className="mt-12 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={stepIndex === 0}>
              <ArrowLeft />
              Previous
            </Button>

            <div className="text-muted-foreground text-sm">
              Step {stepIndex + 1} of {steps.length}
            </div>

            {stepIndex === steps.length - 1 ? (
              <Button type="submit">Complete</Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </article>
  );
}
