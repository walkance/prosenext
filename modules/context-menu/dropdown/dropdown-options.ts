import {DropdownDirectionInterface} from './models/dropdown-direction';

export interface DropdownOptions {
  disableDropdown?: boolean;
  maxHeight?: number;
  maxWidth?: number;
  minWidth?: string;
  fixedDropdownContentWidth?: number;
  fixedWidth?: number;
  fixedHeight?: number;
  textLabel?: string;
  priorityPosition?: DropdownDirectionInterface;

  emit?: (event: string, payload?: unknown) => void;
}
