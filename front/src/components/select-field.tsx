import type { ComponentProps, ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPTY_SELECT_VALUE } from '@/lib/select-values'

type SelectFieldProps = Omit<
  ComponentProps<typeof SelectTrigger>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> & {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  name?: string
  required?: boolean
  placeholder?: string
}

/** Shared composition of shadcn Select, including labels, empty options and form refs. */
export function SelectField({
  value,
  onValueChange,
  children,
  className,
  name,
  required,
  disabled,
  placeholder,
  ...triggerProps
}: SelectFieldProps) {
  return (
    <div data-slot="select-field" className={className}>
      <Select
        value={value === '' ? EMPTY_SELECT_VALUE : value}
        onValueChange={(next) => onValueChange(next === EMPTY_SELECT_VALUE ? '' : next)}
        name={name}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger className="w-full" {...triggerProps}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectGroup>{children}</SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
