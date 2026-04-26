import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc-client";
import NavBar from "@/components/NavBar";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  IndianRupee,
  AlertCircle,
  Upload,
  BookOpen,
  Truck,
  Search,
  LogOut,
  ArrowRight,
  KeyRound,
  X,
  Check,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const changePin = trpc.pinAuth.changePin.useMutation({
    onSuccess: () => {
      setPinSuccess(true);
      setCurrentPin(""); setNewPin(""); setConfirmPin(""); setPinError("");
      setTimeout(() => { setShowChangePin(false); setPinSuccess(false); }, 1500);
    },
    onError: (e) => setPinError(e.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const statCards = [
    {
      label: "CUSTOMERS",
      hindi: "ग्राहक",
      value: stats?.customers ?? 0,
      icon: <Users className="w-5 h-5" />,
      bg: "bg-white",
      path: "/search",
    },
    {
      label: "TOTAL BILLS",
      hindi: "कुल बिल",
      value: stats?.totalBills ?? 0,
      icon: <FileText className="w-5 h-5" />,
      bg: "bg-white",
      path: "/bills",
    },
    {
      label: "PENDING DELIVERY",
      hindi: "पेंडिंग",
      value: stats?.pendingDelivery ?? 0,
      icon: <Clock className="w-5 h-5" />,
      bg: "bg-white",
      path: "/delivery",
    },
    {
      label: "DELIVERED",
      hindi: "डिलीवर",
      value: stats?.delivered ?? 0,
      icon: <CheckCircle className="w-5 h-5" />,
      bg: "bg-white",
      path: "/bills?status=delivered",
    },
  ];

  const quickActions = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Upload New Bill",
      hindi: "नया बिल अपलोड",
      path: "/upload",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Manage Books",
      hindi: "बही प्रबंधन",
      path: "/books",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Pending Deliveries",
      hindi: "पेंडिंग डिलीवरी",
      path: "/delivery",
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Search Customers",
      hindi: "ग्राहक खोजें",
      path: "/search",
    },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <NavBar
        rightSlot={
          <>
            <span className="text-xs text-stone-500 hidden sm:inline">{user?.name}</span>
            <button
              onClick={() => { setShowChangePin(true); setPinError(""); setPinSuccess(false); }}
              className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
              title="Change PIN"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        }
      />

      {/* Change PIN Modal */}
      {showChangePin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-stone-900 w-full max-w-sm p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Change PIN
              </h3>
              <button onClick={() => setShowChangePin(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinSuccess ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-700">PIN changed successfully</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Current PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => { setCurrentPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                    placeholder="••••••"
                    className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900 text-center text-xl tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">New PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                    placeholder="••••••"
                    className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900 text-center text-xl tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Confirm New PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                    placeholder="••••••"
                    className="w-full p-3 border-2 border-stone-300 outline-none focus:border-stone-900 text-center text-xl tracking-widest"
                  />
                </div>
                {pinError && <p className="text-sm text-red-600 text-center">{pinError}</p>}
                <button
                  onClick={() => {
                    if (newPin.length !== 6) return setPinError("New PIN must be 6 digits");
                    if (newPin !== confirmPin) return setPinError("PINs do not match");
                    changePin.mutate({ currentPin, newPin });
                  }}
                  disabled={changePin.isPending || currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}
                  className="w-full py-3 bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {changePin.isPending ? "Saving..." : "Update PIN"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-widest text-stone-500 uppercase">
              Digital Bahi Khata
            </span>
            <span className="text-xs text-stone-400">· डिजिटल बही खाता</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900">
            Find your book, <span className="text-amber-600">faster.</span>
          </h2>
          <p className="text-stone-600 mt-2 max-w-xl">
            The system never replaces your book — it only helps you find it faster.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Phone, folio, or name..."
              className="w-full pl-12 pr-4 py-4 border-2 border-stone-900 bg-white text-stone-900 placeholder-stone-400 outline-none focus:bg-stone-50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  if (val) navigate(`/search?q=${encodeURIComponent(val)}`);
                }
              }}
            />
          </div>
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input?.value) {
                navigate(`/search?q=${encodeURIComponent(input.value)}`);
              }
            }}
            className="px-8 py-4 bg-amber-500 text-stone-900 font-bold border-2 border-stone-900 hover:bg-amber-400 transition-colors"
          >
            SEARCH
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className={`${card.bg} p-5 border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] text-left hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-stone-500 uppercase">
                    {card.label}
                  </p>
                  <p className="text-[10px] text-stone-400">{card.hindi}</p>
                </div>
                <div className="w-10 h-10 bg-stone-900 flex items-center justify-center text-amber-400">
                  {card.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-stone-900">
                {statsLoading ? "—" : card.value}
              </p>
            </button>
          ))}
        </div>

        {/* Revenue Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="bg-stone-900 p-6 text-white border-2 border-stone-900">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                  TOTAL REVENUE · कुल कमाई
                </p>
              </div>
              <IndianRupee className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-3xl font-bold">
              {statsLoading
                ? "—"
                : formatCurrency(stats?.totalRevenue ?? 0)}
            </p>
          </div>
          <button
            onClick={() => navigate("/pending-balance")}
            className="bg-amber-100 p-6 border-2 border-stone-900 text-left hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                  PENDING BALANCE · बकाया
                </p>
              </div>
              <AlertCircle className="w-6 h-6 text-amber-700" />
            </div>
            <p className="text-3xl font-bold text-stone-900">
              {statsLoading
                ? "—"
                : formatCurrency(stats?.pendingBalance ?? 0)}
            </p>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-stone-900">Quick Actions</h3>
            <span className="text-sm text-stone-500">तेज कार्य</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-4 p-5 bg-white border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-left"
              >
                <div className="w-12 h-12 bg-stone-900 flex items-center justify-center text-amber-400 shrink-0">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900">{action.title}</h4>
                  <p className="text-xs text-stone-500">{action.hindi}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-stone-200 pt-6 mt-10">
          <p className="text-sm text-stone-500">
            Eagle Tailors · Sadar Bazar · Meerut Cantt · Ph: 2660605
          </p>
          <p className="text-xs text-stone-400 italic mt-1">
            "This system never replaces your book. It only helps you find it faster."
          </p>
        </div>
      </main>
    </div>
  );
}
