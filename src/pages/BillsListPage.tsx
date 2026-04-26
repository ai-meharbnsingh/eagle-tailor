import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Search,
  IndianRupee,
  User,
  ChevronDown,
} from "lucide-react";
import type { Bill } from "@db/schema";

type BillListItem = Bill & {
  customer?: { name: string } | null;
  book?: { name: string } | null;
};

const VALID_STATUSES = ["pending", "cutting", "stitching", "ready", "delivered", "cancelled"] as const;
type BillStatus = (typeof VALID_STATUSES)[number];

const STATUS_LABELS: Record<BillStatus, string> = {
  pending: "Pending",
  cutting: "Cutting",
  stitching: "Stitching",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<BillStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  cutting: "bg-blue-100 text-blue-700",
  stitching: "bg-purple-100 text-purple-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

export default function BillsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") ?? undefined;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [offset, setOffset] = useState(0);
  const [allBills, setAllBills] = useState<BillListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset when filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffset(0);
    setAllBills([]);
  }, [statusFilter]);

  const validStatus = VALID_STATUSES.includes(statusFilter as BillStatus) ? (statusFilter as BillStatus) : undefined;
  const { data: page, isLoading, isFetching } = trpc.bill.list.useQuery(
    { status: validStatus, limit: PAGE_SIZE, offset },
    { enabled: isAuthenticated && !debouncedSearch },
  );

  const { data: searchResults, isLoading: searchLoading } = trpc.bill.search.useQuery(
    { query: debouncedSearch },
    { enabled: isAuthenticated && debouncedSearch.length > 1 },
  );

  // Accumulate pages for infinite scroll
  useEffect(() => {
    if (!page) return;
    if (offset === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllBills(page);
    } else {
      setAllBills((prev) => {
        const existingIds = new Set(prev.map((b) => b.id));
        return [...prev, ...page.filter((b) => !existingIds.has(b.id))];
      });
    }
  }, [page, offset]);

  const displayBills = debouncedSearch.length > 1
    ? (searchResults ?? []).filter((b) => !statusFilter || b.status === statusFilter)
    : allBills;

  const hasMore = !debouncedSearch && (page?.length ?? 0) === PAGE_SIZE;

  const title = statusFilter
    ? `${STATUS_LABELS[statusFilter as BillStatus] ?? statusFilter} Bills`
    : "All Bills";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <NavBar />

      {/* Sub-header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-11">
            <button onClick={() => navigate("/dashboard")} className="p-1.5 hover:bg-stone-100 rounded transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-stone-700">{title} · {statusFilter ? "" : "सभी बिल"}</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by folio number or customer name..."
            className="w-full pl-11 pr-4 py-3 border-2 border-stone-900 bg-white text-stone-900 placeholder-stone-400 outline-none focus:bg-stone-50 text-sm"
          />
        </div>

        {(isLoading && offset === 0) || searchLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
          </div>
        ) : displayBills.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No bills found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBills.map((bill) => (
              <button
                key={bill.id}
                onClick={() => navigate(`/bill/${bill.id}`)}
                className="w-full flex items-center gap-4 p-4 bg-white border-2 border-stone-200 hover:border-stone-900 text-left transition-colors shadow-[2px_2px_0px_0px_rgba(28,25,23,0.15)]"
              >
                <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-stone-900">Folio #{bill.folioNumber}</p>
                    <span className={`px-2 py-0.5 text-xs font-bold shrink-0 ${STATUS_COLORS[bill.status as BillStatus] ?? "bg-stone-100 text-stone-700"}`}>
                      {STATUS_LABELS[bill.status as BillStatus] ?? bill.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {bill.customer?.name}
                    </span>
                    <span>{bill.book?.name}</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {Number(bill.totalAmount).toLocaleString("en-IN")}
                    </span>
                    {Number(bill.balanceDue) > 0 && (
                      <span className="text-amber-700 font-semibold">
                        Due: ₹{Number(bill.balanceDue).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(bill.billDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={isFetching}
              className="flex items-center gap-2 px-6 py-3 border-2 border-stone-900 bg-white text-stone-900 font-semibold text-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              {isFetching ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
