import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  ArrowLeft,
  BookOpen,
  Search,
  Loader2,
  Edit2,
  Check,
  X,
  FileText,
  IndianRupee,
  User,
  Star,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  cutting: "bg-blue-100 text-blue-700",
  stitching: "bg-purple-100 text-purple-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function BookDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isValidId = Number.isFinite(numericId) && numericId > 0;
  const { isAuthenticated } = useAuth();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const utils = trpc.useUtils();

  const { data: book, isLoading: bookLoading } = trpc.book.byId.useQuery(
    { id: numericId },
    { enabled: isAuthenticated && isValidId },
  );

  const { data: bills, isLoading: billsLoading } = trpc.book.bills.useQuery(
    { bookId: numericId, search: search || undefined },
    { enabled: isAuthenticated && isValidId },
  );

  const { data: stats } = trpc.book.stats.useQuery(
    { bookId: numericId },
    { enabled: isAuthenticated && isValidId },
  );

  const updateBook = trpc.book.update.useMutation({
    onSuccess: () => {
      utils.book.byId.invalidate({ id: numericId });
      utils.book.list.invalidate();
      setEditing(false);
    },
  });

  const setCurrent = trpc.book.setCurrent.useMutation({
    onSuccess: () => {
      utils.book.byId.invalidate({ id: numericId });
      utils.book.list.invalidate();
      utils.book.current.invalidate();
    },
  });

  const startEdit = () => {
    if (!book) return;
    setEditName(book.name);
    setEditStart(String(book.startSerial));
    setEditEnd(book.endSerial ? String(book.endSerial) : "");
    setEditing(true);
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <p className="text-stone-500">Book not found</p>
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
            <button
              onClick={() => navigate("/books")}
              className="p-1.5 hover:bg-stone-100 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-400" />
              <span className="text-sm font-semibold text-stone-700">{book.name}</span>
              {book.isCurrent && (
                <span className="px-2 py-0.5 bg-amber-500 text-stone-900 text-xs font-bold">
                  CURRENT
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {!editing && !book.isCurrent && (
                <button
                  onClick={() => setCurrent.mutate({ id: book.id })}
                  disabled={setCurrent.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 border border-amber-400 text-amber-600 text-xs font-semibold hover:border-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                  title="Set as current book"
                >
                  <Star className="w-3.5 h-3.5" />
                  Set Current
                </button>
              )}
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
        {/* Edit Form */}
        {editing && (
          <div className="bg-white border-2 border-stone-900 p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
            <h3 className="text-sm font-bold text-stone-700 uppercase mb-4">Edit Book</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Start Serial
                  </label>
                  <input
                    type="number"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    End Serial
                  </label>
                  <input
                    type="number"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    placeholder="optional"
                    className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    updateBook.mutate({
                      id: book.id,
                      name: editName || undefined,
                      startSerial: parseInt(editStart) || undefined,
                      endSerial: editEnd ? parseInt(editEnd) : null,
                    })
                  }
                  disabled={updateBook.isPending || !editName || !editStart}
                  className="flex-1 py-3 bg-stone-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {updateBook.isPending ? "Saving..." : "Save Changes"}
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
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border-2 border-stone-900 p-4 text-center shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <p className="text-xs text-stone-500 uppercase font-bold mb-1">Bills</p>
              <p className="text-2xl font-bold text-stone-900">{stats.billCount}</p>
            </div>
            <div className="bg-white border-2 border-stone-900 p-4 text-center shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <p className="text-xs text-stone-500 uppercase font-bold mb-1">Last Folio</p>
              <p className="text-2xl font-bold text-stone-900">{stats.lastFolio ?? "—"}</p>
            </div>
            <div className="bg-white border-2 border-stone-900 p-4 text-center shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <p className="text-xs text-stone-500 uppercase font-bold mb-1">Revenue</p>
              <p className="text-xl font-bold text-stone-900 flex items-center justify-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {Number(stats.totalRevenue ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by folio, customer name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bills List */}
        {billsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
          </div>
        ) : bills?.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            {search ? "No bills match your search" : "No bills in this book yet"}
          </div>
        ) : (
          <div className="space-y-3">
            {bills?.map((bill) => (
              <button
                key={bill.id}
                onClick={() => navigate(`/bill/${bill.id}`)}
                className="w-full text-left bg-white border-2 border-stone-900 p-4 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-900 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">
                          Folio #{bill.folioNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold ${
                            statusColors[bill.status] ?? "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {bill.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-sm text-stone-500">
                          {bill.customer?.name ?? "Unknown"}
                        </span>
                        {bill.customer?.phones?.[0] && (
                          <span className="text-sm text-stone-400 ml-2">
                            {bill.customer.phones[0].phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-900 flex items-center gap-0.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {Number(bill.totalAmount).toLocaleString("en-IN")}
                    </p>
                    {Number(bill.balanceDue) > 0 && (
                      <p className="text-xs text-red-600 font-semibold mt-0.5">
                        Due: ₹{Number(bill.balanceDue).toLocaleString("en-IN")}
                      </p>
                    )}
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
