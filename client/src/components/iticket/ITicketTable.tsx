import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ITicket, ITicketFiltersState } from "@/types/iticket";
import { fetchITickets } from "@/lib/iticket/iticketService";
import { categoryLabels } from "./ITicketCategoryBadge";
import ITicketStatusBadge from "./ITicketStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

const columns: ColumnDef<ITicket>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <Link
        to={`/i-tickets/${row.original.id}`}
        className="link font-medium"
      >
        {row.original.subject ||
          row.original.messages?.[0]?.text ||
          row.original.lastMessage}
      </Link>
    ),
  },
  {
    id: "sender",
    accessorKey: "displayName",
    header: "Sender",
    cell: ({ row }) => (
      <div>
        <div>{row.original.displayName}</div>
        <div className="text-sm text-muted-foreground">
          @{row.original.username}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ITicketStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) =>
      row.original.category ? (
        <Badge variant="secondary">
          {categoryLabels[row.original.category] ?? row.original.category}
        </Badge>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString(),
  },
];

const PAGE_SIZE = 10;

interface ITicketTableProps {
  filters?: ITicketFiltersState;
  tickets?: ITicket[];
  total?: number;
  page?: number;
  pageSize?: number;
  isLoading?: boolean;
  onPageChange?: (newPage: number) => void;
  onResetFilters?: () => void;
}

export default function ITicketTable({
  filters = {},
  tickets: initialTickets,
  total: initialTotal,
  isLoading: initialLoading,
}: ITicketTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters]);

  const sortBy = (sorting[0]?.id as any) ?? "createdAt";
  const sortOrder = sorting[0]?.desc ?? true ? "desc" : "asc";

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ["i-tickets", sortBy, sortOrder, filters, pagination.pageIndex],
    queryFn: () =>
      fetchITickets({
        filters,
        sortBy,
        sortOrder,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }),
    enabled: initialTickets === undefined,
  });

  const tickets = initialTickets ?? data?.tickets ?? [];
  const total = initialTotal ?? data?.total ?? 0;
  const isLoading = initialLoading ?? (initialTickets === undefined ? queryLoading : false);
  const pageCount = Math.ceil(total / pagination.pageSize);

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    manualSorting: true,
    manualPagination: true,
    enableMultiSort: false,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {!isLoading && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "No tickets"
              : `Showing ${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of ${total} tickets`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              Page {pagination.pageIndex + 1} of {pageCount || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
