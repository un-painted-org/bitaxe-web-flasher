import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SelectorProps = {
  onValueChange: (value: string) => void;
  disabled?: boolean;
  values?: string[];
  placeholder?: string;
}

export default function BoardVersionSelector({ onValueChange, disabled, placeholder = '', values = [] }: SelectorProps) {
  return (
    <Select onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {values.map((value) => (
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
