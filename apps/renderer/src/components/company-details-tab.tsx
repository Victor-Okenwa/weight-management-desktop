import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type CompanyDetails, companyDetailsSchema } from '@/routes/setup-wizard';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from './ui/field';
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

      toast.success('Updates are successful');
    } catch (error) {
      console.log((error as Error).message || 'Something went wrong');
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* COMPANY NAME */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Company Name</FieldLabel>

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

              {/* EMAIL */}
              <Controller
                name="email"
                defaultValue={settings?.companyEmail}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Company Email</FieldLabel>

                    <Input
                      {...field}
                      id="email"
                      className="min-h-12"
                      placeholder="company@example.com"
                    />

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* ADDRESS */}
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address">Company Address</FieldLabel>

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

              {/* PHONE */}
              <Controller
                name="phone"
                defaultValue={settings?.companyPhone}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>

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
            </FieldGroup>

            <Button disabled={form.formState.isSubmitting} className="mt-8 px-16 py-7">
              {form.formState.isSubmitting ? (
                <>
                  <Spinner /> Updating details...
                </>
              ) : (
                'Update Details'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
