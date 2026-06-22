/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_protected/popover-test')({
  component: RouteComponent,
});

type PopoverFormValues = { popoverName: string; popoverEmail: string };

function PopoverSection() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState<PopoverFormValues | null>(null);

  const { control, handleSubmit, reset } = useForm<PopoverFormValues>({
    defaultValues: { popoverName: '', popoverEmail: '' },
  });

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="text-xl font-semibold">Popover</h2>

      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Counter Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Counter</PopoverTitle>
              <PopoverDescription>
                Current count: <strong>{count}</strong>
              </PopoverDescription>
            </PopoverHeader>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setCount((c) => c - 1)}>
                -1
              </Button>
              <Button size="sm" onClick={() => setCount((c) => c + 1)}>
                +1
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setCount(0)}>
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">Count outside: {count}</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">Controlled Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Controlled</PopoverTitle>
              <PopoverDescription>
                Open state managed externally: <strong>{isOpen ? 'open' : 'closed'}</strong>
              </PopoverDescription>
            </PopoverHeader>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </PopoverContent>
        </Popover>
        <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
          Open
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Form Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Form Input</PopoverTitle>
              <PopoverDescription>Type something and it updates outside</PopoverDescription>
            </PopoverHeader>
            <input
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Type here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Typed: {text || 'nothing yet'}</p>
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">Outside: {text || 'empty'}</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">RHF Form Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>React Hook Form</PopoverTitle>
              <PopoverDescription>RHF + Controller + Field inside a popover</PopoverDescription>
            </PopoverHeader>
            <form
              onSubmit={handleSubmit((data) => {
                setSubmitted(data);
              })}
              className="flex flex-col gap-4"
            >
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Controller
                    name="popoverName"
                    control={control}
                    rules={{ required: 'Name is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          placeholder="Enter name"
                          {...field}
                        />
                        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                      </>
                    )}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Controller
                    name="popoverEmail"
                    control={control}
                    rules={{
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                    }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          placeholder="Enter email"
                          type="email"
                          {...field}
                        />
                        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                      </>
                    )}
                  />
                </FieldContent>
              </Field>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Submit
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => reset()}>
                  Reset
                </Button>
              </div>
            </form>
            {submitted && (
              <p className="text-xs text-muted-foreground">
                Submitted: {submitted.popoverName} &lt;{submitted.popoverEmail}&gt;
              </p>
            )}
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">
          {submitted
            ? `Name: ${submitted.popoverName}, Email: ${submitted.popoverEmail}`
            : 'No submission yet'}
        </span>
      </div>
    </section>
  );
}

type ComboboxFormValues = { comboboxFruit: string };

function ComboboxSection() {
  const [value, setValue] = useState('');
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const chipsAnchor = useComboboxAnchor();
  const [comboboxSubmitted, setComboboxSubmitted] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<ComboboxFormValues>({
    defaultValues: { comboboxFruit: '' },
  });

  const fruits = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
    'Honeydew',
    'Kiwi',
    'Lemon',
  ];
  const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="text-xl font-semibold">Combobox</h2>

      <div className="flex flex-wrap items-center gap-4">
        <Combobox value={value} onValueChange={setValue}>
          <ComboboxInput showTrigger showClear placeholder="Pick a fruit..." />
          <ComboboxContent>
            <ComboboxList>
              {fruits.map((fruit) => (
                <ComboboxItem key={fruit} value={fruit}>
                  {fruit}
                </ComboboxItem>
              ))}
            </ComboboxList>
            <ComboboxEmpty>No fruit found</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
        <span className="text-sm text-muted-foreground">
          Selected: <strong>{value || 'none'}</strong>
        </span>
        <Button size="sm" variant="outline" onClick={() => setValue('')}>
          Clear
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setValue('Kiwi')}>
          Set Kiwi
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div className="w-72">
          <Combobox value={multiValue} onValueChange={setMultiValue} multiple>
            <div ref={chipsAnchor}>
              <ComboboxChips>
                <ComboboxChip />
                <ComboboxChipsInput placeholder="Type or pick colors..." />
              </ComboboxChips>
            </div>
            <ComboboxContent anchor={chipsAnchor} align="start">
              <ComboboxList>
                {colors.map((color) => (
                  <ComboboxItem key={color} value={color}>
                    {color}
                  </ComboboxItem>
                ))}
              </ComboboxList>
              <ComboboxEmpty>No color found</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </div>
        <span className="text-sm text-muted-foreground">
          Selected: <strong>{multiValue.length ? multiValue.join(', ') : 'none'}</strong>
        </span>
        <Button size="sm" variant="outline" onClick={() => setMultiValue([])}>
          Clear All
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setMultiValue(['Red', 'Blue'])}>
          Set Red & Blue
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <form
          onSubmit={handleSubmit((data) => {
            setComboboxSubmitted(data.comboboxFruit);
          })}
          className="flex items-end gap-3"
        >
          <Field>
            <FieldLabel>Pick a fruit</FieldLabel>
            <FieldContent>
              <Controller
                name="comboboxFruit"
                control={control}
                rules={{ required: 'Please pick a fruit' }}
                render={({ field, fieldState }) => (
                  <>
                    <Combobox value={field.value} onValueChange={field.onChange}>
                      <ComboboxInput showTrigger showClear placeholder="Fruit..." />
                      <ComboboxContent>
                        <ComboboxList>
                          {fruits.map((fruit) => (
                            <ComboboxItem key={fruit} value={fruit}>
                              {fruit}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                        <ComboboxEmpty>No fruit found</ComboboxEmpty>
                      </ComboboxContent>
                    </Combobox>
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </>
                )}
              />
            </FieldContent>
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Submit
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>
        <span className="text-sm text-muted-foreground">
          {comboboxSubmitted ? `Submitted: ${comboboxSubmitted}` : 'No submission yet'}
        </span>
      </div>
    </section>
  );
}

type SelectFormValues = { selectOption: string };

function SelectSection() {
  const [value, setValue] = useState('');
  const [selectSubmitted, setSelectSubmitted] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<SelectFormValues>({
    defaultValues: { selectOption: '' },
  });

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="text-xl font-semibold">Select</h2>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="option-1">Option 1</SelectItem>
              <SelectItem value="option-2">Option 2</SelectItem>
              <SelectItem value="option-3">Option 3</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Group 2</SelectLabel>
              <SelectItem value="option-4">Option 4</SelectItem>
              <SelectItem value="option-5">Option 5</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          Selected: <strong>{value || 'none'}</strong>
        </span>
        <Button size="sm" variant="outline" onClick={() => setValue('')}>
          Reset
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setValue('option-3')}>
          Set Option 3
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <form
          onSubmit={handleSubmit((data) => {
            setSelectSubmitted(data.selectOption);
          })}
          className="flex items-end gap-3"
        >
          <Field>
            <FieldLabel>Choose an option</FieldLabel>
            <FieldContent>
              <Controller
                name="selectOption"
                control={control}
                rules={{ required: 'Please select an option' }}
                render={({ field, fieldState }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Options</SelectLabel>
                          <SelectItem value="opt-a">Option A</SelectItem>
                          <SelectItem value="opt-b">Option B</SelectItem>
                          <SelectItem value="opt-c">Option C</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </>
                )}
              />
            </FieldContent>
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Submit
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>
        <span className="text-sm text-muted-foreground">
          {selectSubmitted ? `Submitted: ${selectSubmitted}` : 'No submission yet'}
        </span>
      </div>
    </section>
  );
}

function RouteComponent() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Popover Interaction Tests</h1>
      <PopoverSection />
      <ComboboxSection />
      <SelectSection />
    </div>
  );
}
