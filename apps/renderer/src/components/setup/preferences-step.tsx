import { appearanceOptions } from '@weight/shared/constants/index';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RequiredLabel, requiredFields } from './required-label';

type PreferencesFields = {
  preferences: {
    defaultUnit: 'kg' | 'ton' | 'lb';
    theme: 'light' | 'dark' | 'system';
    ticketPrefix: string;
    ticketFooter: string;
  };
};

export function PreferencesStep() {
  const { control } = useFormContext<PreferencesFields>();

  return (
    <div className="space-y-7">
      <hgroup>
        <h2 className="text-2xl font-bold tracking-tight">Preferences</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Defaults for weight units, appearance, and printed tickets.
        </p>
      </hgroup>

      <Controller
        name="preferences.defaultUnit"
        control={control}
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
            <FieldDescription>Select the default unit for weight measurements.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="preferences.theme"
        control={control}
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
                      <div className="text-sm text-muted-foreground">{theme.description}</div>
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
        control={control}
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
            <FieldDescription>The prefix used for ticket numbers, e.g. "SRE".</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="preferences.ticketFooter"
        control={control}
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
  );
}
