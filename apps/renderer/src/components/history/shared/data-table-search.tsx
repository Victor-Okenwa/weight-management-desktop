import { Search } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableSearchProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export function DataTableSearch({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
}: DataTableSearchProps) {
  const [value, setValue] = React.useState(initialValue);

  const submit = React.useCallback(() => {
    onSearch(value.trim());
  }, [onSearch, value]);

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="h-8 w-40 lg:w-64"
      />
      <Button type="button" variant="secondary" className="h-8" onClick={submit}>
        <Search />
        Search
      </Button>
    </div>
  );
}
