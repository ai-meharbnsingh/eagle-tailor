import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  Search,
  User,
  Phone,
  FileText,
  MapPin,
  Loader2,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from "lucide-react";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPhones, setNewPhones] = useState([{ phone: "", isPrimary: true }]);

  const utils = trpc.useUtils();

  const createCustomer = trpc.customer.create.useMutation({
    onSuccess: (data) => {
      if (!data) return;
      utils.customer.list.invalidate();
      setShowAdd(false);
      setNewName("");
      setNewAddress("");
      setNewPhones([{ phone: "", isPrimary: true }]);
      navigate(`/customer/${data.id}`);
    },
  });

  function addPhone() {
    setNewPhones((prev) => [...prev, { phone: "", isPrimary: false }]);
  }

  function removePhone(i: number) {
    setNewPhones((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (next.length > 0 && !next.some((p) => p.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  }

  function setPrimary(i: number) {
    setNewPhones((prev) => prev.map((p, idx) => ({ ...p, isPrimary: idx === i })));
  }

  function handleCreate() {
    const phones = newPhones.filter((p) => p.phone.trim().length >= 5);
    if (!newName.trim() || phones.length === 0) return;
    createCustomer.mutate({
      name: newName.trim(),
      address: newAddress.trim() || undefined,
      phones,
    });
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isSearching = debouncedQuery.length > 1;

  const { data: allCustomers, isLoading: allLoading } = trpc.customer.list.useQuery(undefined, {
    enabled: isAuthenticated && !isSearching,
  });

  const { data: searchedCustomers, isLoading: searchLoading } = trpc.customer.search.useQuery(
    { query: debouncedQuery },
    { enabled: isSearching && isAuthenticated },
  );

  const { data: bills } = trpc.bill.search.useQuery(
    { query: debouncedQuery },
    { enabled: isSearching && isAuthenticated },
  );

  const customers = isSearching ? searchedCustomers : allCustomers;
  const isLoading = isSearching ? searchLoading : allLoading;

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">Customers</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by phone, folio, or customer name..."
            className="w-full pl-12 pr-4 py-4 border-2 border-stone-900 bg-white text-stone-900 placeholder-stone-400 outline-none focus:bg-stone-50"
            autoFocus
          />
        </div>

        {/* Results */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
          </div>
        )}

        {/* Customers */}
        {customers && customers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">
              {isSearching ? "Customers · ग्राहक" : `All Customers · सभी ग्राहक (${customers.length})`}
            </h2>
            <div className="space-y-2">
              {customers.map((customer: typeof customers[number]) => (
                <button
                  key={customer.id}
                  onClick={() => navigate(`/customer/${customer.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 bg-white border-2 border-stone-200 hover:border-stone-900 text-left transition-colors"
                >
                  <div className="w-9 h-9 bg-stone-900 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 truncate">{customer.name}</p>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {customer.phones?.map((p: { id: number; phone: string; isPrimary: boolean }) => (
                        <span key={p.id} className="flex items-center gap-1 text-sm text-stone-500">
                          <Phone className="w-3 h-3" />
                          {p.phone}
                          {p.isPrimary && <span className="text-xs text-amber-600 font-semibold">(P)</span>}
                        </span>
                      ))}
                      {customer.address && (
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{customer.address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bills */}
        {bills && bills.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">
              Bills · बिल
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bills.map((bill: typeof bills[number]) => (
                <button
                  key={bill.id}
                  onClick={() => navigate(`/bill/${bill.id}`)}
                  className="p-5 bg-white border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] text-left hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-stone-900">
                          Folio #{bill.folioNumber}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 font-semibold ${
                            bill.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : bill.status === "ready"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 mt-1">
                        {bill.customer?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        {bill.book?.name} · ₹{Number(bill.totalAmount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isSearching &&
          (!customers || customers.length === 0) &&
          (!bills || bills.length === 0) &&
          !isLoading && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No results found</p>
              <p className="text-sm text-stone-400">कोई परिणाम नहीं मिला</p>
            </div>
          )}
      </main>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-stone-900 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900">New Customer</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900 text-sm"
                  autoFocus
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Optional"
                  className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900 text-sm"
                />
              </div>

              {/* Phones */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Phone Numbers *</label>
                <div className="space-y-2">
                  {newPhones.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={p.phone}
                        onChange={(e) => setNewPhones((prev) => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))}
                        placeholder="Phone number"
                        className="flex-1 p-3 border-2 border-stone-300 outline-none focus:border-stone-900 text-sm"
                      />
                      <button
                        onClick={() => setPrimary(i)}
                        title="Set as primary"
                        className={`px-2 py-1 text-xs font-bold border-2 transition-colors ${p.isPrimary ? "bg-amber-500 border-amber-500 text-stone-900" : "border-stone-300 text-stone-400 hover:border-stone-500"}`}
                      >
                        P
                      </button>
                      {newPhones.length > 1 && (
                        <button onClick={() => removePhone(i)} className="p-2 text-stone-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addPhone} className="mt-2 text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add another number
                </button>
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={handleCreate}
                disabled={createCustomer.isPending || !newName.trim() || !newPhones.some((p) => p.phone.trim().length >= 5)}
                className="flex-1 py-3 bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                {createCustomer.isPending ? "Saving..." : "Save Customer"}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-5 py-3 border-2 border-stone-300 text-stone-600 font-semibold text-sm hover:border-stone-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
