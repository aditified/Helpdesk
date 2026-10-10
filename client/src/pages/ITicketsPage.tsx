import { useState } from "react";
import { useNavigate } from "react-router";
import type { ITicketFiltersState } from "@/types/iticket";
import ITicketFilters from "@/components/iticket/ITicketFilters";
import ITicketTable from "@/components/iticket/ITicketTable";
import SimulateInstagramModal from "@/components/iticket/SimulateInstagramModal";
import InstagramSetupGuideModal from "@/components/iticket/InstagramSetupGuideModal";
import { Button } from "@/components/ui/button";
import { Instagram, PlusCircle, Settings2 } from "lucide-react";

export default function ITicketsPage() {
  const [filters, setFilters] = useState<ITicketFiltersState>({});
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">i-Ticket</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-pink-500/10 text-pink-500 border border-pink-500/20">
              <Instagram className="h-3 w-3" />
              <span>Instagram Direct</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Two-way Instagram messaging: Inbound DMs appear live, and replies are delivered to the customer&apos;s Instagram inbox.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsGuideOpen(true)}
            className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Connect Live Page</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsSimulateOpen(true)}
            className="text-xs h-8 gap-1.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Simulate Inbound DM</span>
          </Button>
        </div>
      </div>

      <ITicketFilters filters={filters} onChange={setFilters} />
      <ITicketTable filters={filters} />

      <SimulateInstagramModal
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        onSuccess={(ticketId) => navigate(`/i-tickets/${ticketId}`)}
      />

      <InstagramSetupGuideModal
        open={isGuideOpen}
        onOpenChange={setIsGuideOpen}
      />
    </div>
  );
}

