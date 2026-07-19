import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FieldLabelWithInfo } from '@/components/serial-config-help';
import { type CompanyDetails, companyDetailsSchema } from '@/routes/setup-wizard';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Field, FieldError } from './ui/field';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';

export function CompanyDetailsTab() {
  const { settings } = useSettingsStore();
  const form = useForm<CompanyDetails>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      address: settings?.companyAddress || '',
      email: settings?.companyEmail || '',
      name: settings?.companyName,
      phone: settings?.companyPhone || '',
    },
  });

  async function onSubmit(data: CompanyDetails) {
    try {
      await window.electronAPI.updateSettings({
        companyName: data.name,
        companyEmail: data.email,
        companyAddress: data.address,
        companyPhone: data.phone,
      });

      toast.success('Company details updated');
      location.reload();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update company details');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
        <CardDescription>
          Shown on printed tickets and station branding. Company name is required.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-5 md:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabelWithInfo
                    htmlFor="name"
                    info={
                      <span>
                        Legal or trading name printed on tickets and shown in the app. This field is
                        required.
                      </span>
                    }
                  >
                    Company Name
                  </FieldLabelWithInfo>
                  <Input
                    {...field}
                    id="name"
                    className="min-h-12 capitalize"
                    placeholder="Solution Road Equipments and Spars Limited"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabelWithInfo
                    htmlFor="email"
                    info={
                      <span>
                        Contact email for your company. Optional, but useful on tickets and for
                        support.
                      </span>
                    }
                  >
                    Company Email
                  </FieldLabelWithInfo>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    className="min-h-12"
                    placeholder="company@example.com"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabelWithInfo
                    htmlFor="address"
                    info={
                      <span>
                        Business address printed on tickets. Keep it short enough to fit on a
                        receipt.
                      </span>
                    }
                  >
                    Company Address
                  </FieldLabelWithInfo>
                  <Input
                    {...field}
                    id="address"
                    className="min-h-12"
                    placeholder="123 Main Street"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabelWithInfo
                    htmlFor="phone"
                    info={
                      <span>
                        Phone number customers can call. Include country code when possible (e.g.{' '}
                        <strong>+234…</strong>).
                      </span>
                    }
                  >
                    Phone Number
                  </FieldLabelWithInfo>
                  <Input
                    {...field}
                    id="phone"
                    className="min-h-12"
                    placeholder="+23480123456789"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="flex justify-end border-t border-border/60 pt-5">
            <Button
              type="submit"
              size="lg"
              disabled={form.formState.isSubmitting}
              className="min-w-44"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Spinner /> Updating...
                </>
              ) : (
                'Update Details'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
