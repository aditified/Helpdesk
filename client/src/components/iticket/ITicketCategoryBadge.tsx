import type { ITicketCategory } from "@/types/iticket";
import { Badge } from "@/components/ui/badge";

export const categoryLabels: Record<ITicketCategory, string> = {
  admission: "Admission",
  fees: "Fees & Billing",
  technical_issue: "Technical Issue",
  account: "Account & Access",
  general_query: "General Query",
  complaint: "Complaint",
  other: "Other",
};

export default function ITicketCategoryBadge({
  category,
  className = "",
}: {
  category: ITicketCategory;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={`font-normal tracking-normal text-xs py-0.5 px-2 ${className}`}
    >
      {categoryLabels[category] ?? category}
    </Badge>
  );
}
