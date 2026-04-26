import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  Clock,
  CheckCircle,
  Loader2,
  User,
  Phone,
  FileText,
} from "lucide-react";

export default function DeliveryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: deliveries, isLoading } = trpc.bill.dueDeliveries.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const utils = trpc.useUtils();
  const updateBill = trpc.bill.update.useMutation({
    onSuccess: () => {
      utils.bill.dueDeliveries.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    cutting: "bg-blue-100 text-blue-700",
    stitching: "bg-purple-100 text-purple-700",
    ready: "bg-green-100 text-green-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending · लंबित",
    cutting: "Cutting · कटिंग",
    stitching: "Stitching · सिलाई",
    ready: "Ready · तैयार",
    delivered: "Delivered · डिलीवर",
    cancelled: "Cancelled · रद्द",
  };

  const statusFlow = ["pending", "cutting", "stitching", "ready", "delivered"] as const;
  type BillStatus = (typeof statusFlow)[number] | "cancelled";

  const advanceStatus = (current: string): BillStatus => {
    const idx = statusFlow.indexOf(current as typeof statusFlow[number]);
    if (idx >= 0 && idx < statusFlow.length - 1) {
      return statusFlow[idx + 1];
    }
    return current as BillStatus;
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
          </div>
        )}

        {deliveries && deliveries.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-stone-700">
              All caught up!
            </p>
            <p className="text-sm text-stone-500">No pending deliveries</p>
          </div>
        )}

        <div className="space-y-4">
          {deliveries?.map((bill: typeof deliveries[number]) => (
            <div
              key={bill.id}
              className="bg-white border-2 border-stone-900 p-5 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900">
                        Folio #{bill.folioNumber}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold ${
                          statusColors[bill.status] ?? "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {statusLabels[bill.status] ?? bill.status}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500">
                      {bill.book?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-900">
                    ₹{Number(bill.totalAmount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-stone-500">
                    Due: ₹{Number(bill.balanceDue).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-400" />
                  <span className="text-sm font-semibold text-stone-700">
                    {bill.customer?.name}
                  </span>
                </div>
                {bill.customer?.phones?.[0] && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <span className="text-sm text-stone-600">
                      {bill.customer.phones[0].phone}
                    </span>
                  </div>
                )}
                {bill.deliveryDate && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-stone-600">
                      Due: {new Date(bill.deliveryDate).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {bill.status !== "delivered" && bill.status !== "cancelled" && (
                  <button
                    onClick={() =>
                      updateBill.mutate({
                        id: bill.id,
                        status: advanceStatus(bill.status),
                      })
                    }
                    disabled={updateBill.isPending}
                    className="px-4 py-2 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {updateBill.isPending ? "Updating..." : "Advance Status"}
                  </button>
                )}
                {bill.status === "ready" && (
                  <button
                    onClick={() =>
                      updateBill.mutate({
                        id: bill.id,
                        status: "delivered",
                        actualDeliveryDate: new Date().toISOString().split("T")[0],
                      })
                    }
                    disabled={updateBill.isPending}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Mark Delivered
                  </button>
                )}
                <button
                  onClick={() => navigate(`/bill/${bill.id}`)}
                  className="px-4 py-2 border-2 border-stone-300 text-stone-600 text-sm font-semibold hover:border-stone-900 hover:text-stone-900 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
