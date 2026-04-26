import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../api/router";
import NavBar from "@/components/NavBar";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Customer = RouterOutputs["customer"]["search"][number];
import {
  Camera,
  Upload,
  Search,
  User,
  Plus,
  Check,
  Loader2,
  X,
  ImagePlus,
  RotateCw,
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

async function rotateFile(file: File, degrees: number): Promise<File> {
  if (degrees === 0) return file;
  const bitmap = await createImageBitmap(file);
  const swap = degrees === 90 || degrees === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? bitmap.height : bitmap.width;
  canvas.height = swap ? bitmap.width : bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })), "image/jpeg", 0.9);
  });
}

export default function UploadBillPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // Multi-image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageRotations, setImageRotations] = useState<number[]>([]);

  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const [folioNumber, setFolioNumber] = useState("");
  const [folioManuallyChanged, setFolioManuallyChanged] = useState(false);
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [remarks, setRemarks] = useState("");

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const { data: currentBook } = trpc.book.current.useQuery(undefined, { enabled: isAuthenticated });
  const { data: books } = trpc.book.list.useQuery(undefined, { enabled: isAuthenticated });
  const activeBookId = selectedBookId ?? currentBook?.id ?? 0;

  const { data: nextFolio } = trpc.book.nextFolio.useQuery(
    { bookId: activeBookId },
    { enabled: !!activeBookId && isAuthenticated },
  );

  useEffect(() => { if (currentBook && !selectedBookId) setSelectedBookId(currentBook.id); }, [currentBook, selectedBookId]);
  useEffect(() => {
    if (nextFolio !== undefined && !folioManuallyChanged) setFolioNumber(String(nextFolio));
  }, [nextFolio, folioManuallyChanged]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => { if (url) URL.revokeObjectURL(url); });
      objectUrlsRef.current = [];
    };
  }, []);

  const parsedFolio = parseInt(folioNumber);
  const { data: folioTaken } = trpc.book.checkFolio.useQuery(
    { bookId: activeBookId, folioNumber: parsedFolio },
    { enabled: !!activeBookId && !isNaN(parsedFolio) && parsedFolio > 0 && folioManuallyChanged },
  );

  const { data: searchResults } = trpc.customer.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 1 && isAuthenticated },
  );

  const addBillImage = trpc.bill.addImage.useMutation();

  const createCustomer = trpc.customer.create.useMutation({
    onSuccess: (data) => { if (data) { setSelectedCustomer(data); setShowNewCustomer(false); setSearchQuery(""); } },
  });

  const createBill = trpc.bill.create.useMutation({
    onSuccess: () => {
      setCreateSuccess(true);
      setTimeout(() => { setCreateSuccess(false); resetForm(); }, 2000);
    },
  });

  const resetForm = () => {
    setImageFiles([]); setImagePreviews([]); setImageRotations([]);
    setSelectedCustomer(null); setSearchQuery("");
    setFolioManuallyChanged(false);
    setFolioNumber(nextFolio ? String(nextFolio) : "");
    setBillDate(new Date().toISOString().split("T")[0]);
    setDeliveryDate(""); setTotalAmount(""); setAdvancePaid(""); setRemarks("");
    setNewName(""); setNewPhone(""); setNewAddress("");
  };

  const handleFilesSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    objectUrlsRef.current.push(...newUrls);
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newUrls]);
    setImageRotations((prev) => [...prev, ...newFiles.map(() => 0)]);
  };

  const removeImage = (index: number) => {
    const url = imagePreviews[index];
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== url);
    }
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageRotations((prev) => prev.filter((_, i) => i !== index));
  };

  const rotateImage = (index: number) => {
    setImageRotations((prev) => prev.map((r, i) => i === index ? (r + 90) % 360 : r));
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !activeBookId || !folioNumber) return;
    setUploading(true);
    try {
      // Apply rotations then upload all images concurrently
      const rotatedFiles = await Promise.all(imageFiles.map((f, i) => rotateFile(f, imageRotations[i] ?? 0)));
      const uploaded = rotatedFiles.length > 0
        ? await Promise.all(rotatedFiles.map(uploadImage))
        : [{ imageUrl: "", thumbnailUrl: "" }];

      // Create bill with first image as primary
      const bill = await createBill.mutateAsync({
        bookId: activeBookId,
        customerId: selectedCustomer.id,
        folioNumber: parseInt(folioNumber),
        imageUrl: uploaded[0]?.imageUrl || undefined,
        thumbnailUrl: uploaded[0]?.thumbnailUrl || undefined,
        billDate,
        deliveryDate: deliveryDate || undefined,
        totalAmount: parseFloat(totalAmount) || 0,
        advancePaid: parseFloat(advancePaid) || 0,
        remarks: remarks || undefined,
      });

      // Save additional images (index 1+) to billImages table
      if (bill && uploaded.length > 1) {
        await Promise.all(
          uploaded.slice(1).map((img, i) =>
            addBillImage.mutateAsync({ billId: bill.id, imageUrl: img.imageUrl, thumbnailUrl: img.thumbnailUrl, sortOrder: i + 1 })
          )
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save bill. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = selectedCustomer && activeBookId && folioNumber && billDate && !uploading && !folioTaken;

  if (authLoading) return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {createSuccess && (
          <div className="mb-6 p-4 bg-green-100 border-2 border-green-600 text-green-800 font-semibold flex items-center gap-2">
            <Check className="w-5 h-5" />
            Bill saved successfully! · बिल सफलतापूर्वक सेव हो गया
          </div>
        )}

        {/* Multi-Image Upload */}
        <div className="bg-white border-2 border-stone-900 p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">BILL PHOTOS</span>
              <span className="text-xs text-stone-400">· बिल के फोटो</span>
            </div>
            <span className="text-xs text-stone-400">{imageFiles.length} photo{imageFiles.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Thumbnails grid */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden">
                  <img
                    src={src}
                    style={{ transform: `rotate(${imageRotations[i] ?? 0}deg)` }}
                    className="w-full h-full object-cover border-2 border-stone-200 transition-transform duration-200"
                  />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-stone-900 text-[10px] font-bold px-1.5 py-0.5">PRIMARY</span>
                  )}
                  <button
                    onClick={() => rotateImage(i)}
                    className="absolute bottom-1 left-1 w-6 h-6 bg-stone-900/80 text-white flex items-center justify-center rounded-full hover:bg-stone-900"
                    title="Rotate"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-stone-900 text-white flex items-center justify-center rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Add more tile */}
              <button
                onClick={() => { if (fileInputRef.current) { fileInputRef.current.capture = ""; fileInputRef.current.click(); } }}
                className="aspect-square border-2 border-dashed border-stone-300 flex flex-col items-center justify-center hover:border-stone-600 hover:bg-stone-50 transition-colors"
              >
                <ImagePlus className="w-6 h-6 text-stone-400 mb-1" />
                <span className="text-xs text-stone-400">Add</span>
              </button>
            </div>
          )}

          {imagePreviews.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-stone-500 hover:bg-stone-50 transition-colors mb-4"
            >
              <Camera className="w-10 h-10 text-stone-400 mb-3" />
              <p className="font-semibold text-stone-600">Tap to add photos</p>
              <p className="text-xs text-stone-400 mt-1">Multiple photos supported</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFilesSelect(e.target.files)}
            className="hidden"
          />

          <div className="flex gap-3">
            <button
              onClick={() => { if (fileInputRef.current) { fileInputRef.current.capture = "environment"; fileInputRef.current.click(); } }}
              className="flex-1 py-2.5 bg-stone-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Camera
            </button>
            <button
              onClick={() => { if (fileInputRef.current) { fileInputRef.current.capture = ""; fileInputRef.current.click(); } }}
              className="flex-1 py-2.5 border-2 border-stone-900 text-stone-900 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Gallery
            </button>
          </div>
        </div>

        {/* Book & Folio */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold tracking-wider text-stone-500 uppercase block mb-2">BOOK · बही</label>
            <select
              value={activeBookId || ""}
              onChange={(e) => { setSelectedBookId(parseInt(e.target.value)); setFolioNumber(""); setFolioManuallyChanged(false); }}
              className="w-full p-3 border-2 border-stone-300 bg-white text-stone-900 outline-none focus:border-stone-900"
            >
              {books?.map((b) => (
                <option key={b.id} value={b.id}>{b.name} {b.isCurrent ? "(current)" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider text-stone-500 uppercase block mb-2">FOLIO NUMBER · फोलियो</label>
            <input
              type="number"
              value={folioNumber}
              onChange={(e) => {
                setFolioNumber(e.target.value);
                setFolioManuallyChanged(true);
              }}
              className={`w-full p-3 border-2 bg-white text-stone-900 outline-none ${folioTaken ? "border-red-500 focus:border-red-500" : "border-stone-300 focus:border-stone-900"}`}
            />
            {folioTaken && (
              <p className="text-xs text-red-600 mt-1 font-semibold">
                ⚠ Folio #{folioNumber} already taken — suggested: #{nextFolio}
              </p>
            )}
            {!folioTaken && folioManuallyChanged && folioNumber && (
              <p className="text-xs text-green-600 mt-1">✓ Available</p>
            )}
          </div>
        </div>

        {/* Customer */}
        <div className="bg-white border-2 border-stone-900 p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">CUSTOMER · ग्राहक</span>
          </div>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-4 bg-stone-50 border-2 border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-amber-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-stone-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-stone-500">{selectedCustomer.phones?.[0]?.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by phone or name..."
                  className="w-full pl-11 pr-4 py-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900"
                />
              </div>
              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2 mb-4">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setSearchQuery(""); }}
                      className="w-full flex items-center gap-3 p-3 border-2 border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-left transition-colors"
                    >
                      <User className="w-5 h-5 text-stone-400" />
                      <div>
                        <p className="font-semibold text-stone-900 text-sm">{c.name}</p>
                        <p className="text-xs text-stone-500">{c.phones?.[0]?.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowNewCustomer(true)}
                className="w-full py-3 border-2 border-dashed border-stone-400 text-stone-500 font-semibold text-sm flex items-center justify-center gap-2 hover:border-stone-900 hover:text-stone-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Customer · नया ग्राहक जोड़ें
              </button>
            </>
          )}
          {showNewCustomer && (
            <div className="mt-4 p-4 border-2 border-stone-200 bg-stone-50">
              <h4 className="font-bold text-stone-900 mb-3">New Customer</h4>
              <div className="space-y-3">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Customer name..." className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900" />
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number..." className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900" />
                <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Address (optional)..." className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900" />
                <div className="flex gap-3">
                  <button
                    onClick={() => { if (newName && newPhone) createCustomer.mutate({ name: newName, address: newAddress || undefined, phones: [{ phone: newPhone, isPrimary: true }] }); }}
                    disabled={createCustomer.isPending || !newName || !newPhone}
                    className="flex-1 py-3 bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {createCustomer.isPending ? "Creating..." : "Create Customer"}
                  </button>
                  <button onClick={() => setShowNewCustomer(false)} className="px-4 py-3 border-2 border-stone-300 text-stone-600 font-semibold text-sm hover:border-stone-900 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dates & Amounts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold tracking-wider text-stone-500 uppercase block mb-2">BILL DATE</label>
            <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider text-stone-500 uppercase block mb-2">DELIVERY DATE</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold tracking-wider text-stone-500 uppercase block mb-2">TOTAL AMOUNT</label>
            <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0" className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider text-stone-500 uppercase block mb-2">ADVANCE PAID</label>
            <input type="number" value={advancePaid} onChange={(e) => setAdvancePaid(e.target.value)} placeholder="0" className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900" />
          </div>
        </div>
        <div className="mb-8">
          <label className="text-xs font-bold tracking-wider text-stone-500 uppercase block mb-2">REMARKS</label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any notes about this order..." rows={3} className="w-full p-3 border-2 border-stone-300 bg-white outline-none focus:border-stone-900 resize-none" />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors ${canSubmit ? "bg-amber-500 text-stone-900 border-2 border-stone-900 hover:bg-amber-400 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]" : "bg-stone-300 text-stone-500 border-2 border-stone-300 cursor-not-allowed"}`}
        >
          {uploading || createBill.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Saving...</>
          ) : (
            <><Upload className="w-5 h-5" />Save Bill · बिल सेव करें</>
          )}
        </button>
      </main>
    </div>
  );
}
