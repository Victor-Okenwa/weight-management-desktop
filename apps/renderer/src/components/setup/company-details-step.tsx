import { Controller, useFormContext } from 'react-hook-form';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RequiredLabel, requiredFields } from './required-label';

type CompanyDetailsFields = {
  companyDetails: {
    name: string;
    email?: string;
    address?: string;
    phone?: string;
  };
};

export function CompanyDetailsStep() {
  const { control } = useFormContext<CompanyDetailsFields>();

  return (
    <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <hgroup>
          <h2 className="text-2xl font-bold tracking-tight">Company details</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Shown on tickets and station records. You can edit these later in Settings.
          </p>
        </hgroup>
      </div>

      <Controller
        name="companyDetails.name"
        control={control}
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

      <Controller
        name="companyDetails.email"
        control={control}
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

      <Controller
        name="companyDetails.address"
        control={control}
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

      <Controller
        name="companyDetails.phone"
        control={control}
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
  );
}
