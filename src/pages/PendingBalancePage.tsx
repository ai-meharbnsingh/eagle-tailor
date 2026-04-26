import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  ArrowLeft,
  Loader2,
  IndianRupee,
  User,
  BookOpen,
  FileText,
  Phone,
  Search,
} from "lucide-react";

export default function PendingBalancePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const { data: bills, isLoading } = trpc.bill.pendingBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const filtered = bills?.filter((bill) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      bill.customer?.name?.toLowerCase().includes(q) ||
      String(bill.folioNumber).includes(q) ||
      bill.customer?.phones?.some((p) => p.phone.includes(q))
    );
  }) ?? [];

  const totalPending = filtered.reduce((s, b) => s + Number(b.balanceDue), 0);

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
            <span className="text-sm font-semibold text-stone-700">Pending Balance · बकाया</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Total summary */}
        {!isLoading && bills && (
          <div className="bg-amber-100 border-2 border-stone-900 p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Total Outstanding · कुल बकाया
              </p>
              <p className="text-2xl font-bold text-stone-900 mt-1 flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {totalPending.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">{filtered.length} bill{filtered.length !== 1 ? "s" : ""}</p>
              <p className="text-xs text-stone-400">with balance due</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone or folio..."
            className="w-full pl-11 pr-4 py-3 border-2 border-stone-900 bg-white text-stone-900 placeholder-stone-400 outline-none focus:bg-stone-50 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <IndianRupee className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No outstanding balance</p>
            <p className="text-sm text-stone-400">सभी भुगतान हो चुके हैं</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bill) => (
              <button
                key={bill.id}
                onClick={() => navigate(`/bill/${bill.id}`)}
                className="w-full text-left bg-white border-2 border-stone-200 hover:border-stone-900 p-4 transition-colors shadow-[2px_2px_0px_0px_rgba(28,25,23,0.15)]"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: customer + bill info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="font-bold text-stone-900 truncate">{bill.customer?.name}</span>
                    </div>
                    {bill.customer?.phones?.[0] && (
                      <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                        <Phone className="w-3 h-3" />
                        <span>{bill.customer.phones[0].phone}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1 text-stone-600">
                        <FileText className="w-3.5 h-3.5" />
                        Folio #{bill.folioNumber}
                      </span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <BookOpen className="w-3.5 h-3.5" />
                        {bill.book?.name}
                      </span>
                      <span className="text-stone-400 text-xs">
                        {new Date(bill.billDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Right: amounts */}
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-amber-700 flex items-center justify-end gap-0.5">
                      <IndianRupee className="w-4 h-4" />
                      {Number(bill.balanceDue).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      of ₹{Number(bill.totalAmount).toLocaleString("en-IN")}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold ${
                      bill.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                      bill.status === "ready" ? "bg-green-100 text-green-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {bill.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
