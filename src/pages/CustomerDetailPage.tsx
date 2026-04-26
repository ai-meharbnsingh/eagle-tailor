import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
  IndianRupee,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react";

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isValidId = Number.isFinite(numericId) && numericId > 0;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhones, setEditPhones] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const utils = trpc.useUtils();

  const { data: customer, isLoading } = trpc.customer.byId.useQuery(
    { id: numericId },
    { enabled: isAuthenticated && isValidId },
  );

  const { data: stats } = trpc.customer.stats.useQuery(
    { id: numericId },
    { enabled: isAuthenticated && isValidId },
  );

  const updateCustomer = trpc.customer.update.useMutation({
    onSuccess: () => {
      utils.customer.byId.invalidate({ id: numericId });
      setEditing(false);
    },
  });

  const startEdit = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditAddress(customer.address ?? "");
    setEditPhones(customer.phones?.map((p) => p.phone) ?? []);
    setEditing(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <p className="text-stone-500">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <NavBar />

      {/* Sub-header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-11">
            <button onClick={() => navigate("/search")} className="p-1.5 hover:bg-stone-100 rounded transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-stone-700">Customer Profile</span>
            <div className="ml-auto">
              {!editing && (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 px-3 py-1.5 border border-stone-300 text-stone-600 text-xs font-semibold hover:border-stone-900 hover:text-stone-900 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Customer Info Card */}
        <div className="bg-white border-2 border-stone-900 p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
          {editing ? (
            /* Edit Form */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Address (optional)"
                  className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Phone Numbers</label>
                <div className="space-y-2">
                  {editPhones.map((ph, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="tel"
                        value={ph}
                        onChange={(e) => {
                          const next = [...editPhones];
                          next[i] = e.target.value;
                          setEditPhones(next);
                        }}
                        className="flex-1 p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                      />
                      {editPhones.length > 1 && (
                        <button
                          onClick={() => setEditPhones((prev) => prev.filter((_, j) => j !== i))}
                          className="p-3 border-2 border-red-200 text-red-500 hover:border-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setEditPhones((prev) => [...prev, ""])}
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add phone number
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    updateCustomer.mutate({
                      id: customer.id,
                      name: editName || undefined,
                      address: editAddress || undefined,
                      phones: editPhones.filter(Boolean).map((ph, i) => ({ phone: ph, isPrimary: i === 0 })),
                    })
                  }
                  disabled={updateCustomer.isPending || !editName}
                  className="flex-1 py-3 bg-stone-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {updateCustomer.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-5 py-3 border-2 border-stone-300 text-stone-600 font-semibold text-sm hover:border-stone-900 transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-stone-900">{customer.name}</h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  {customer.phones?.map((p) => (
                    <div key={p.id} className="flex items-center gap-1 text-sm text-stone-600">
                      <Phone className="w-4 h-4" />
                      <span>{p.phone}</span>
                      {p.isPrimary && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
                {customer.address && (
                  <div className="flex items-center gap-1 text-sm text-stone-500 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {!editing && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-stone-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-900">{stats?.totalBills ?? 0}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">Total Bills</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-900">₹{Number(stats?.totalAmount ?? 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">₹{Number(stats?.totalBalance ?? 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">Balance Due</p>
              </div>
            </div>
          )}
        </div>

        {/* Bill History */}
        <h3 className="text-lg font-bold text-stone-900 mb-4">Order History · ऑर्डर इतिहास</h3>
        <div className="space-y-3">
          {customer.bills?.map((bill) => (
            <button
              key={bill.id}
              onClick={() => navigate(`/bill/${bill.id}`)}
              className="w-full flex items-center gap-4 p-4 bg-white border-2 border-stone-200 hover:border-stone-900 text-left transition-colors"
            >
              <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-stone-900">Folio #{bill.folioNumber}</p>
                  <span className={`px-2 py-0.5 text-xs font-bold ${bill.status === "delivered" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {bill.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 flex-wrap">
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
                  <span>{new Date(bill.billDate).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
            </button>
          ))}
          {(!customer.bills || customer.bills.length === 0) && (
            <p className="text-center text-stone-500 py-8">No bills yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
