import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  type StepperProps,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import { getTicketPrefix } from '@/lib/utils';

export const Route = createFileRoute('/setup-wizard')({
  component: RouteComponent,
});

// Multi-step form schema: full object of all three
const formSchema = z.object({
  // Company Details section
  companyDetails: z.object({
    name: z.string().min(1, 'Company name is required'),
    email: z.email('Invalid email address').optional().or(z.literal('')), // allow empty string for optional email
    address: z.string().optional().or(z.literal('')), // address optional, allow empty
    phone: z
      .string()
      .regex(/^\+?[0-9]*$/, 'Phone number can only contain + and numbers')
      .optional()
      .or(z.literal('')), // phone optional, allow empty
  }),
  // Hardware section
  hardware: z.object({
    port: z.string().min(1, 'Port is required'),
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
  // Preferences section
  preferences: z.object({
    defaultUnit: z.enum(['kg', 'ton', 'lb']),
    theme: z.enum(['light', 'dark', 'system']),
  }),
});

type FormSchemaType = z.infer<typeof formSchema>;

const steps = [
  {
    value: 'companyDetails' as const,
    title: 'Company Details',
    description: 'Set your company info (for receipts, etc)',
    fields: [
      'companyDetails.name',
      'companyDetails.address',
      'companyDetails.phone',
      'companyDetails.email',
    ] as const,
  },
  {
    value: 'hardware' as const,
    title: 'Hardware Setup',
    description: 'Configure your weighing device connection',
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
    value: 'preferences' as const,
    title: 'Preferences',
    description: 'Set your default units and theme',
    fields: ['preferences.defaultUnit', 'preferences.theme'] as const,
  },
  {
    value: 'overview' as const,
    title: 'Overview',
    description: 'Review your setup before finishing',
    fields: [] as const,
  },
];
type StepValues = (typeof steps)[number]['value'];
function RouteComponent() {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyDetails: {
        name: '',
        address: '',
        phone: '',
      },
      hardware: {
        port: '',
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

  const [step, setStep] = useState<StepValues>('companyDetails');

  const [ticketPrefix, setTicketPrefix] = useState(
    getTicketPrefix(form.getValues('companyDetails.address') as string),
  );

  const stepIndex = steps.findIndex((s) => s.value === step);

  const onValidate: NonNullable<StepperProps['onValidate']> = useCallback(
    async (_value, direction) => {
      if (direction === 'prev') return true;

      const stepData = steps.find((s) => s.value === step);
      if (!stepData) return true;

      const isValid = await form.trigger(stepData.fields);

      if (!isValid) {
        toast.info('Please complete all required fields to continue');
      }

      return isValid;
    },
    [form, step],
  );

  async function onSubmit() {}

  useEffect(() => {
    const name = form.getValues('companyDetails.name') as string;

    setTicketPrefix(getTicketPrefix(name));
  }, [form.getValues('companyDetails.name')]);

  return (
    <article className="px-4 py-12">
      <Card className="bg-background">
        <hgroup>
          <small>First-time setup</small>
          <h1>Configure your station</h1>
        </hgroup>

        <form id="form-setup" onSubmit={form.handleSubmit(onSubmit)}>
          <Stepper
            value={step}
            onValueChange={(value) => setStep(value as StepValues)}
            onValidate={onValidate}
          >
            <CardHeader>
              <StepperList>
                {steps.map((step) => (
                  <StepperItem key={step.value} value={step.value}>
                    <StepperTrigger>
                      <StepperIndicator />
                      <div className="flex flex-col gap-px">
                        <StepperTitle>{step.title}</StepperTitle>
                        <StepperDescription>{step.description}</StepperDescription>
                      </div>
                    </StepperTrigger>
                    <StepperSeparator className="mx-4" />
                  </StepperItem>
                ))}
              </StepperList>
            </CardHeader>

            <section className="bg-accent/30 border-background border-x-12 py-4 px-5 rounded-lg">
              <StepperContent value="companyDetails">
                <FieldGroup className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Controller
                      name="companyDetails.name"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="form-setup-name">Company Name</FieldLabel>
                          <Input
                            {...field}
                            id="form-setup-name"
                            aria-invalid={fieldState.invalid}
                            className="min-h-12"
                            placeholder="Solution Road Equipments and Spars Limited"
                            autoComplete="off"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    {ticketPrefix}
                  </div>

                  <Controller
                    name="companyDetails.email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-setup-email">Company email</FieldLabel>
                        <Input
                          {...field}
                          id="form-setup-email"
                          aria-invalid={fieldState.invalid}
                          className="min-h-12"
                          placeholder="solutionroadlimited@exmple.com"
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="companyDetails.address"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-setup-address">Company Address</FieldLabel>
                        <Input
                          {...field}
                          id="form-setup-address"
                          aria-invalid={fieldState.invalid}
                          className="min-h-12"
                          placeholder="123 Main Street, City, Country"
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="companyDetails.phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-setup-phone">Phone Number</FieldLabel>
                        <Input
                          {...field}
                          id="form-setup-phone"
                          aria-invalid={fieldState.invalid}
                          className="min-h-12"
                          placeholder="+23480123456789"
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </StepperContent>
            </section>

            <CardFooter></CardFooter>
          </Stepper>
        </form>
      </Card>
    </article>
  );
}
