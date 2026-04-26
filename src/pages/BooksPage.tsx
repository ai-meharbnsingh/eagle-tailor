import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  BookOpen,
  Plus,
  Trash2,
  Star,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";

export default function BooksPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newCurrent, setNewCurrent] = useState(false);

  const utils = trpc.useUtils();

  const { data: books, isLoading } = trpc.book.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createBook = trpc.book.create.useMutation({
    onSuccess: () => {
      utils.book.list.invalidate();
      setShowCreate(false);
      setNewName("");
      setNewStart("");
      setNewEnd("");
      setNewCurrent(false);
    },
  });

  const setCurrent = trpc.book.setCurrent.useMutation({
    onSuccess: () => {
      utils.book.list.invalidate();
      utils.book.current.invalidate();
    },
  });

  const deleteBook = trpc.book.delete.useMutation({
    onSuccess: () => {
      utils.book.list.invalidate();
    },
    onError: (err) => {
      alert(err.message);
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

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-900">All Books</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
          </div>
        )}

        <div className="space-y-4">
          {books?.map((book: typeof books[number]) => (
            <div
              key={book.id}
              className={`p-5 border-2 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] cursor-pointer hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all ${
                book.isCurrent
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-900 bg-white"
              }`}
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center ${
                      book.isCurrent
                        ? "bg-amber-500 text-stone-900"
                        : "bg-stone-900 text-amber-400"
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900">{book.name}</h3>
                      {book.isCurrent && (
                        <span className="px-2 py-0.5 bg-amber-500 text-stone-900 text-xs font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500">
                      Folios: {book.startSerial}
                      {book.endSerial ? ` - ${book.endSerial}` : "+"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!book.isCurrent && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrent.mutate({ id: book.id }); }}
                      disabled={setCurrent.isPending}
                      className="p-2 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Set as current"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${book.name}"?\n\nThis will permanently delete the book and ALL its bills, payments, and images. Customer records will NOT be deleted.`)) {
                        deleteBook.mutate({ id: book.id });
                      }
                    }}
                    disabled={deleteBook.isPending}
                    className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Book Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-stone-900 w-full max-w-md p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-900">New Book</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1 hover:bg-stone-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Book 2025-26"
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
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      placeholder="1"
                      className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                      End Serial
                    </label>
                    <input
                      type="number"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      placeholder="500 (optional)"
                      className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCurrent}
                    onChange={(e) => setNewCurrent(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-stone-700">Set as current book</span>
                </label>
                <button
                  onClick={() =>
                    createBook.mutate({
                      name: newName,
                      startSerial: parseInt(newStart),
                      endSerial: newEnd ? parseInt(newEnd) : undefined,
                      isCurrent: newCurrent,
                    })
                  }
                  disabled={
                    createBook.isPending || !newName || !newStart
                  }
                  className="w-full py-3 bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {createBook.isPending ? "Creating..." : "Create Book"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
