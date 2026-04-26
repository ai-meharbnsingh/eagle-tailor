import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc, TOKEN_KEY } from "@/lib/trpc-client";

export default function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loginMutation = trpc.pinAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
      navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.message || "Invalid PIN");
      setLoading(false);
      setPin(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every((d) => d !== "")) {
      setLoading(true);
      loginMutation.mutate({ pin: newPin.join("") });
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      const newPin = paste.split("");
      setPin(newPin);
      setLoading(true);
      loginMutation.mutate({ pin: paste });
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/eagle-tailors-logo.png"
            alt="Eagle Tailors"
            className="h-32 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-stone-900 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Staff Login
            </h2>
            <p className="text-sm text-stone-500">
              Enter your 6-digit PIN
            </p>
          </div>

          {/* PIN Inputs */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 justify-center mb-4"
            onPaste={handlePaste}
          >
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg outline-none transition-all
                  ${error ? "border-red-500 bg-red-50" : "border-stone-300 focus:border-stone-900 focus:bg-stone-50"}
                `}
                disabled={loading}
                autoComplete="current-password"
              />
            ))}
          </form>

          {error && (
            <p className="text-center text-red-600 text-sm mb-4">{error}</p>
          )}

          {loading && (
            <div className="flex justify-center mb-4">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-500 mt-6">
          Eagle Tailors · Sadar Bazar · Meerut Cantt · +91 98375 28577
        </p>
      </div>
    </div>
  );
}
