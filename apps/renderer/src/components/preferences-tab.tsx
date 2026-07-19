import { zodResolver } from '@hookform/resolvers/zod';
import { appearanceOptions } from '@weight/shared/constants/index';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { useSettingsStore } from '@/store/settingsStore';
import { type Theme, useTheme } from './providers/theme-provider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Spinner } from './ui/spinner';

const preferencesSchema = z.object({
  defaultUnit: z.literal('kg'),
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

type Preferences = z.infer<typeof preferencesSchema>;

export function PreferencesTab() {
  const { settings } = useSettingsStore();
  const { setTheme } = useTheme();
  const [isThemeLoading, setIsThemeLoading] = useState(false);

  const form = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultUnit: 'kg',
      ticketPrefix: settings?.ticketPrefix,
      ticketFooter: settings?.ticketFooter,
    },
  });

  async function handleThemeChange(theme: Theme) {
    setIsThemeLoading(true);

    try {
      //   if (settings?.theme === theme) return;
      await window.electronAPI.updateSettings({
        theme: theme,
      });

      toast.success('Theme change');
      setTheme(theme);
    } catch (error) {
      console.log((error as Error).message || 'Something went wrong');
    } finally {
      setIsThemeLoading(false);
    }
  }

  async function onSubmit(data: Preferences) {
    try {
      await window.electronAPI.updateSettings({
        weightUnit: data.defaultUnit,
        ticketPrefix: data.ticketPrefix,
        ticketFooter: data.ticketFooter,
      });

      toast.success('Updates are successful');
      location.reload();
    } catch (error) {
      console.log((error as Error).message || 'Something went wrong');
    }
  }

  return (
    <article className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Change Theme</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-4">
          {appearanceOptions.map((theme) => (
            <Button
              className="flex flex-col h-fit! justify-start items-start text-left! py-5 px-5 grow"
              key={theme.value}
              disabled={isThemeLoading}
              onClick={() => handleThemeChange(theme.value)}
              variant={settings?.theme === theme.value.toLowerCase() ? 'default' : 'outline'}
            >
              {isThemeLoading ? (
                <div>
                  <Spinner /> Applying changes
                </div>
              ) : (
                <>
                  <strong>{theme.label}</strong>
                  <p>{theme.description}</p>
                </>
              )}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <Controller
                name="defaultUnit"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="defaultUnit">Default Unit</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      defaultValue="kg"
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="defaultUnit"
                        className="min-h-12"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Choose the default unit for weight measurements. Only{' '}
                      <span className="font-semibold">kg</span> is supported for now.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="ticketPrefix"
                defaultValue={settings?.ticketPrefix}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ticketPrefix">Ticket Prefix</FieldLabel>
                    <Input
                      {...field}
                      id="ticketPrefix"
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
                name="ticketFooter"
                defaultValue={settings?.ticketFooter}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ticketFooter">Ticket Footer</FieldLabel>
                    <Input
                      {...field}
                      id="ticketFooter"
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

            <Button disabled={form.formState.isSubmitting} className="mt-8 px-16 py-7">
              {form.formState.isSubmitting ? (
                <>
                  <Spinner /> Updating Preferences...
                </>
              ) : (
                'Update Preferences'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </article>
  );
}
