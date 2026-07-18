import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { RequiredLabel, requiredFields } from './required-label';

export type SecurityFormFields = {
  security: {
    mode: 'none' | 'required';
    password: string;
    confirmPassword: string;
  };
};

export function SecurityStep() {
  const { control } = useFormContext<SecurityFormFields>();
  const mode = useWatch({ control, name: 'security.mode' });

  return (
    <div className="space-y-7">
      <hgroup>
        <h2 className="text-2xl font-bold tracking-tight">Station security</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose whether this station needs a password every time the app opens. If you forget a
          password, you must request a new license from Solution Road Tech Support.
        </p>
      </hgroup>

      <Controller
        name="security.mode"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>
              {requiredFields['security.mode'] ? (
                <RequiredLabel>Access mode</RequiredLabel>
              ) : (
                <>Access mode</>
              )}
            </FieldLabel>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-3 grid gap-3"
            >
              <Label
                htmlFor="security-mode-none"
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border bg-background/40 p-4 transition-colors',
                  field.value === 'none'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border/80',
                )}
              >
                <RadioGroupItem value="none" id="security-mode-none" className="mt-0.5" />
                <span className="space-y-1">
                  <span className="block font-medium">Passwordless</span>
                  <span className="text-muted-foreground block text-sm font-normal">
                    Anyone with access to this PC can open the app after license unlock.
                  </span>
                </span>
              </Label>
              <Label
                htmlFor="security-mode-required"
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border bg-background/40 p-4 transition-colors',
                  field.value === 'required'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border/80',
                )}
              >
                <RadioGroupItem value="required" id="security-mode-required" className="mt-0.5" />
                <span className="space-y-1">
                  <span className="block font-medium">Require password</span>
                  <span className="text-muted-foreground block text-sm font-normal">
                    Enter a password on every app launch. Forgetting it means clearing the license
                    and requesting a new one.
                  </span>
                </span>
              </Label>
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {mode === 'required' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="security.password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="security-password">
                  <RequiredLabel>Password</RequiredLabel>
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id="security-password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                />
                <FieldDescription>Minimum 6 characters.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="security.confirmPassword"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="security-confirm">
                  <RequiredLabel>Confirm password</RequiredLabel>
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id="security-confirm"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      )}
    </div>
  );
}
