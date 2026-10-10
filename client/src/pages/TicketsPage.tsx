import { useState } from "react";
import { type TicketStatus } from "core/constants/ticket-status.ts";
import { type TicketCategory } from "core/constants/ticket-category.ts";
import { Role } from "core/constants/role.ts";
import { useSession } from "@/lib/auth-client";
import TicketsTable from "./TicketsTable";
import TicketsFilters from "./TicketsFilters";

export interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
  search?: string;
}

export default function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const { data: session } = useSession();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          {session?.user?.role === Role.agent && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing tickets assigned to you
            </p>
          )}
        </div>
      </div>
      <TicketsFilters filters={filters} onChange={setFilters} />
      <TicketsTable filters={filters} />
    </div>
  );
}
