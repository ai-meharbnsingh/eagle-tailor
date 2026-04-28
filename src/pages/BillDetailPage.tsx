import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import { useRef } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  User,
  Phone,
  IndianRupee,
  Calendar,
  Truck,
  BookOpen,
  Edit2,
  Check,
  X,
  Plus,
  CreditCard,
  ImagePlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Upload,
  Search,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
async function uploadImage(file: File): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/api/upload/bill`, { method: "POST", body: formData, credentials: "include" });
  const data = await res.json();
  if (!data.success) throw new Error("Upload failed");
  return { imageUrl: data.imageUrl, thumbnailUrl: data.thumbnailUrl };
}

const STATUS_FLOW = ["pending", "cutting", "stitching", "ready", "delivered"] as const;

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  cutting: "bg-blue-100 text-blue-700",
  stitching: "bg-purple-100 text-purple-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function BillDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isValidId = Number.isFinite(numericId) && numericId > 0;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editTotal, setEditTotal] = useState("");
  const [editAdvance, setEditAdvance] = useState("");
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editBookId, setEditBookId] = useState<number | null>(null);
  const [editFolio, setEditFolio] = useState("");
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [editCustomerLabel, setEditCustomerLabel] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("");

  const amountNum = parseFloat(payAmount);
  const isValidAmount = !isNaN(amountNum) && amountNum > 0;

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [uploadingImg, setUploadingImg] = useState(false);
  const addImgRef = useRef<HTMLInputElement>(null);
  const editImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const utils = trpc.useUtils();

  const { data: bill, isLoading } = trpc.bill.byId.useQuery(
    { id: numericId },
    { enabled: isAuthenticated && isValidId },
  );

  const { data: books } = trpc.book.list.useQuery(undefined, {
    enabled: isAuthenticated && editing,
  });

  const editFolioNum = parseInt(editFolio);
  const folioChanged =
    !!bill &&
    (editBookId !== bill.bookId || editFolioNum !== bill.folioNumber);
  const { data: editFolioTaken } = trpc.book.checkFolio.useQuery(
    { bookId: editBookId ?? 0, folioNumber: editFolioNum },
    {
      enabled:
        editing &&
        !!editBookId &&
        !isNaN(editFolioNum) &&
        editFolioNum > 0 &&
        folioChanged,
    },
  );

  const { data: customerResults } = trpc.customer.search.useQuery(
    { query: customerQuery },
    { enabled: editing && showCustomerSearch && customerQuery.length > 1 },
  );

  const updateBill = trpc.bill.update.useMutation({
    onSuccess: () => {
      utils.bill.byId.invalidate({ id: numericId });
      utils.dashboard.stats.invalidate();
      utils.book.bills.invalidate();
      utils.bill.byCustomer.invalidate();
      setEditing(false);
      setShowCustomerSearch(false);
      setCustomerQuery("");
    },
    onError: (err) => {
      alert(err.message || "Failed to update bill");
    },
  });

  const { data: payments } = trpc.payment.listByBill.useQuery(
    { billId: numericId },
    { enabled: isAuthenticated && isValidId },
  );

  const addPayment = trpc.payment.add.useMutation({
    onSuccess: () => {
      utils.payment.listByBill.invalidate({ billId: numericId });
      utils.bill.byId.invalidate({ id: numericId });
      utils.dashboard.stats.invalidate();
      setShowAddPayment(false);
      setPayAmount("");
      setPayNote("");
      setPayDate(new Date().toISOString().slice(0, 10));
    },
    onError: (err) => {
      alert(err.message || "Failed to record payment");
    },
  });

  const addBillImg = trpc.bill.addImage.useMutation({
    onSuccess: () => utils.bill.byId.invalidate({ id: numericId }),
    onError: (err) => {
      alert(err.message || "Failed to add image");
    },
  });

  const delBillImg = trpc.bill.deleteImage.useMutation({
    onSuccess: () => {
      utils.bill.byId.invalidate({ id: numericId });
      setActiveImageIdx(0);
    },
    onError: (err) => {
      alert(err.message || "Failed to delete image");
    },
  });

  const handleAddImages = async (files: FileList | null) => {
    if (!files || !bill) return;
    setUploadingImg(true);
    try {
      const results = await Promise.all(Array.from(files).map(uploadImage));
      await Promise.all(results.map((r, i) =>
        addBillImg.mutateAsync({ billId: bill.id, imageUrl: r.imageUrl, thumbnailUrl: r.thumbnailUrl, sortOrder: (bill.images?.length ?? 0) + i })
      ));
    } catch { alert("Image upload failed"); }
    finally { setUploadingImg(false); }
  };

  const startEdit = () => {
    if (!bill) return;
    setEditTotal(String(Number(bill.totalAmount)));
    setEditAdvance(String(Number(bill.advancePaid)));
    setEditDeliveryDate(
      bill.deliveryDate ? new Date(bill.deliveryDate).toISOString().slice(0, 10) : "",
    );
    setEditRemarks(bill.remarks ?? "");
    setEditBookId(bill.bookId);
    setEditFolio(String(bill.folioNumber));
    setEditCustomerId(bill.customerId);
    setEditCustomerLabel(bill.customer?.name ?? "");
    setShowCustomerSearch(false);
    setCustomerQuery("");
    setEditing(true);
  };

  const advanceStatus = () => {
    if (!bill) return;
    const idx = STATUS_FLOW.indexOf(bill.status as typeof STATUS_FLOW[number]);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      const next = STATUS_FLOW[idx + 1];
      updateBill.mutate({
        id: bill.id,
        status: next,
        actualDeliveryDate:
          next === "delivered"
            ? new Date().toISOString().split("T")[0]
            : undefined,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <p className="text-stone-500">Bill not found</p>
      </div>
    );
  }

  const canAdvance =
    bill.status !== "delivered" && bill.status !== "cancelled";

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <NavBar />
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-11">
            <button
              onClick={() => navigate("/bills")}
              className="p-1.5 hover:bg-stone-100 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-stone-700">Bill Detail</span>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Image Gallery */}
        {(() => {
          const images = bill.images && bill.images.length > 0
            ? bill.images
            : (bill.imageUrl ? [{ id: -1, imageUrl: bill.imageUrl, thumbnailUrl: bill.thumbnailUrl }] : []);
          const current = images[activeImageIdx];
          return (
            <div className="mb-6 bg-white border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              {/* Main image */}
              {current ? (
                <div className="relative">
                  <img
                    src={current.imageUrl}
                    alt={`Bill ${bill.folioNumber} photo ${activeImageIdx + 1}`}
                    className="w-full object-contain max-h-[460px] bg-stone-50"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIdx((i) => Math.max(0, i - 1))}
                        disabled={activeImageIdx === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-stone-900/70 text-white flex items-center justify-center rounded-full disabled:opacity-30"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setActiveImageIdx((i) => Math.min(images.length - 1, i + 1))}
                        disabled={activeImageIdx === images.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-stone-900/70 text-white flex items-center justify-center rounded-full disabled:opacity-30"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <span className="absolute bottom-2 right-2 bg-stone-900/70 text-white text-xs px-2 py-1 rounded-full">
                        {activeImageIdx + 1} / {images.length}
                      </span>
                    </>
                  )}
                  {current.id !== -1 && (
                    <button
                      onClick={() => { if (confirm("Delete this photo?")) delBillImg.mutate({ imageId: current.id }); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white flex items-center justify-center rounded-full hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-stone-400 text-sm">No photos yet</div>
              )}

              {/* Thumbnails row + add button */}
              <div className="flex gap-2 p-2 overflow-x-auto border-t border-stone-200">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIdx(i)}
                    className={`flex-shrink-0 w-14 h-14 border-2 overflow-hidden ${i === activeImageIdx ? "border-amber-500" : "border-stone-200"}`}
                  >
                    <img src={img.thumbnailUrl ?? img.imageUrl} className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  onClick={() => addImgRef.current?.click()}
                  disabled={uploadingImg}
                  className="flex-shrink-0 w-14 h-14 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center hover:border-stone-600 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {uploadingImg ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                </button>
                <input
                  ref={addImgRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAddImages(e.target.files)}
                />
              </div>
            </div>
          );
        })()}

        {/* Bill Info Card */}
        <div className="bg-white border-2 border-stone-900 p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-stone-900 flex items-center justify-center text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  Folio #{bill.folioNumber}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <BookOpen className="w-4 h-4 text-stone-400" />
                  <span className="text-sm text-stone-500">
                    {bill.book?.name}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-sm font-bold ${
                statusColors[bill.status] ?? "bg-stone-100 text-stone-700"
              }`}
            >
              {bill.status.toUpperCase()}
            </span>
          </div>

          {/* Status progression */}
          {canAdvance && !editing && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={advanceStatus}
                disabled={updateBill.isPending}
                className="flex-1 py-2 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                {updateBill.isPending ? "Updating..." : `→ Mark as ${STATUS_FLOW[STATUS_FLOW.indexOf(bill.status as typeof STATUS_FLOW[number]) + 1] ?? ""}`}
              </button>
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
                  className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Mark Delivered
                </button>
              )}
            </div>
          )}

          {/* Customer */}
          <div className="p-4 bg-stone-50 border border-stone-200 mb-4">
            <button
              onClick={() => bill.customer && navigate(`/customer/${bill.customer.id}`)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-stone-400" />
                <span className="font-semibold text-stone-700 hover:underline">
                  {bill.customer?.name}
                </span>
              </div>
              {bill.customer?.phones?.[0] && (
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Phone className="w-4 h-4" />
                  <span>{bill.customer.phones[0].phone}</span>
                </div>
              )}
            </button>
          </div>

          {/* Edit Form */}
          {editing ? (
            <div className="space-y-4">
              {/* Book + Folio (move bill / fix wrong folio) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Book · बही
                  </label>
                  <select
                    value={editBookId ?? ""}
                    onChange={(e) => setEditBookId(parseInt(e.target.value) || null)}
                    className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900"
                  >
                    {books?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}{b.isCurrent ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Folio Number · फोलियो
                  </label>
                  <input
                    type="number"
                    value={editFolio}
                    onChange={(e) => setEditFolio(e.target.value)}
                    className={`w-full p-3 border-2 outline-none ${editFolioTaken ? "border-red-500 focus:border-red-500" : "border-stone-300 focus:border-stone-900"}`}
                  />
                  {editFolioTaken && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">
                      ⚠ Folio #{editFolio} already used in selected book
                    </p>
                  )}
                  {folioChanged && !editFolioTaken && editFolio && (
                    <p className="text-xs text-green-600 mt-1">✓ Available</p>
                  )}
                </div>
              </div>

              {/* Customer (fix wrong customer assignment) */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                  Customer · ग्राहक
                </label>
                {!showCustomerSearch ? (
                  <div className="flex items-center justify-between p-3 bg-stone-50 border-2 border-stone-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-semibold text-stone-900">{editCustomerLabel}</span>
                      {editCustomerId !== bill.customerId && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200 text-stone-900">CHANGED</span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCustomerSearch(true)}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        value={customerQuery}
                        onChange={(e) => setCustomerQuery(e.target.value)}
                        placeholder="Search by phone or name..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900 text-sm"
                      />
                    </div>
                    {customerResults && customerResults.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setEditCustomerId(c.id);
                              setEditCustomerLabel(c.name);
                              setShowCustomerSearch(false);
                              setCustomerQuery("");
                            }}
                            className="w-full flex items-center gap-2 p-2 border-2 border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-left transition-colors"
                          >
                            <User className="w-4 h-4 text-stone-400" />
                            <div>
                              <p className="text-sm font-semibold text-stone-900">{c.name}</p>
                              <p className="text-xs text-stone-500">{c.phones?.[0]?.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => { setShowCustomerSearch(false); setCustomerQuery(""); }}
                      className="text-xs text-stone-500 hover:text-stone-900 underline"
                    >
                      Cancel customer change
                    </button>
                  </div>
                )}
              </div>

              {/* Photos (camera + gallery, multiple) */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                  Add Photos · फोटो जोड़ें
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (editImgRef.current) { editImgRef.current.capture = "environment"; editImgRef.current.click(); } }}
                    disabled={uploadingImg}
                    className="flex-1 py-2.5 bg-stone-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    Camera
                  </button>
                  <button
                    onClick={() => { if (editImgRef.current) { editImgRef.current.capture = ""; editImgRef.current.click(); } }}
                    disabled={uploadingImg}
                    className="flex-1 py-2.5 border-2 border-stone-900 text-stone-900 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Gallery
                  </button>
                  <input
                    ref={editImgRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { handleAddImages(e.target.files); e.target.value = ""; }}
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">Photos appear in the gallery above. Tap a photo's trash icon to remove it.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Advance Paid
                  </label>
                  <input
                    type="number"
                    value={editAdvance}
                    onChange={(e) => setEditAdvance(e.target.value)}
                    className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                  className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                  Remarks
                </label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={2}
                  className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (folioChanged && editFolioTaken) {
                      alert(`Folio #${editFolio} is already used in the selected book.`);
                      return;
                    }
                    if (!editBookId || !editFolioNum || editFolioNum <= 0) {
                      alert("Please select a book and enter a valid folio number.");
                      return;
                    }
                    updateBill.mutate({
                      id: bill.id,
                      totalAmount: parseFloat(editTotal) || 0,
                      advancePaid: parseFloat(editAdvance) || 0,
                      deliveryDate: editDeliveryDate || undefined,
                      remarks: editRemarks || undefined,
                      bookId: editBookId,
                      folioNumber: editFolioNum,
                      customerId: editCustomerId ?? undefined,
                    });
                  }}
                  disabled={updateBill.isPending || (folioChanged && !!editFolioTaken)}
                  className="flex-1 py-3 bg-stone-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {updateBill.isPending ? "Saving..." : "Save Changes"}
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
            <>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    <span className="text-xs text-stone-500 uppercase font-bold">
                      Bill Date
                    </span>
                  </div>
                  <p className="font-semibold text-stone-900">
                    {new Date(bill.billDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
                {bill.deliveryDate && (
                  <div className="p-4 bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-stone-400" />
                      <span className="text-xs text-stone-500 uppercase font-bold">
                        Delivery
                      </span>
                    </div>
                    <p className="font-semibold text-stone-900">
                      {new Date(bill.deliveryDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-stone-900 text-white text-center">
                  <p className="text-xs text-stone-400 uppercase mb-1">Total</p>
                  <p className="text-xl font-bold flex items-center justify-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {Number(bill.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-4 bg-amber-100 border-2 border-stone-900 text-center">
                  <p className="text-xs text-stone-500 uppercase mb-1">Advance</p>
                  <p className="text-xl font-bold text-stone-900 flex items-center justify-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {Number(bill.advancePaid).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-4 bg-stone-100 border-2 border-stone-900 text-center">
                  <p className="text-xs text-stone-500 uppercase mb-1">Balance</p>
                  <p className="text-xl font-bold text-stone-900 flex items-center justify-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {Number(bill.balanceDue).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {bill.remarks && (
                <div className="mt-4 p-4 bg-stone-50 border border-stone-200">
                  <p className="text-xs text-stone-500 uppercase font-bold mb-1">
                    Remarks
                  </p>
                  <p className="text-sm text-stone-700">{bill.remarks}</p>
                </div>
              )}
            </>
          )}
        </div>
        {/* Payment History */}
        <div className="bg-white border-2 border-stone-900 p-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-400" />
              <h3 className="font-bold text-stone-900">Payment History</h3>
            </div>
            <button
              onClick={() => setShowAddPayment((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Payment
            </button>
          </div>

          {/* Add Payment Form */}
          {showAddPayment && (
            <div className="mb-4 p-4 bg-stone-50 border border-stone-200">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0"
                    className="w-full p-2.5 border-2 border-stone-300 outline-none focus:border-stone-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-2.5 border-2 border-stone-300 outline-none focus:border-stone-900 text-sm"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs font-bold text-stone-500 uppercase block mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g., Cash, UPI, remaining balance"
                  className="w-full p-2.5 border-2 border-stone-300 outline-none focus:border-stone-900 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!isValidAmount) return;
                    addPayment.mutate({
                      billId: numericId,
                      amount: amountNum,
                      paidAt: payDate,
                      note: payNote || undefined,
                    });
                  }}
                  disabled={addPayment.isPending || !payAmount || !payDate || !isValidAmount}
                  className="flex-1 py-2.5 bg-stone-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {addPayment.isPending ? "Saving..." : "Record Payment"}
                </button>
                <button
                  onClick={() => setShowAddPayment(false)}
                  className="px-4 py-2.5 border-2 border-stone-300 text-stone-600 font-semibold text-sm hover:border-stone-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Payment list */}
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">
              No payments recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-900 flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {Number(p.amount).toLocaleString("en-IN")}
                    </p>
                    {p.note && (
                      <p className="text-xs text-stone-500 mt-0.5">{p.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.paidAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
