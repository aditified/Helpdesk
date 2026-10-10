import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { ITicketFiltersState, ITicketStatus, ITicketCategory } from "@/types/iticket";
import { categoryLabels } from "./ITicketCategoryBadge";

const ALL = "__all__";

interface ITicketFiltersProps {
  filters: ITicketFiltersState;
  onChange: (filters: ITicketFiltersState) => void;
  unreadCount?: number;
}

export default function ITicketFilters({
  filters,
  onChange,
}: ITicketFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value || undefined })
          }
          className="pl-8"
        />
      </div>

      <Select
        value={filters.status ?? ALL}
        onValueChange={(value) =>
          onChange({
            ...filters,
            status: value === ALL ? undefined : (value as ITicketStatus),
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category ?? ALL}
        onValueChange={(value) =>
          onChange({
            ...filters,
            category: value === ALL ? undefined : (value as ITicketCategory),
          })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
