import { createContext, useContext } from 'react';

export interface SelectionState {
  selectedIds: Set<number>;
  onSelectionChange: (id: number, checked: boolean) => void;
  onSelectionChangeAll: (ids: number[], checked: boolean) => void;
}

export const SelectionContext = createContext<SelectionState>({
  selectedIds: new Set(),
  onSelectionChange: () => {},
  onSelectionChangeAll: () => {},
});

export function useSelection() {
  return useContext(SelectionContext);
}
