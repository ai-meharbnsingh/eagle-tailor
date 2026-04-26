import { useNavigate, useLocation } from "react-router";
import { Home, Search, Camera, BookOpen, Truck } from "lucide-react";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Search", path: "/search", icon: Search },
  { label: "Upload", path: "/upload", icon: Camera },
  { label: "Books", path: "/books", icon: BookOpen },
  { label: "Delivery", path: "/delivery", icon: Truck },
];

interface NavBarProps {
  rightSlot?: ReactNode;
}

export default function NavBar({ rightSlot }: NavBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center h-28 gap-6">

          {/* Logo — left, h-24 */}
          <button onClick={() => navigate("/dashboard")} className="flex-shrink-0 focus:outline-none">
            <img
              src="/eagle-tailors-logo.png"
              alt="Eagle Tailors"
              className="h-24 w-auto object-contain"
            />
          </button>

          {/* Nav tabs — centered, same line */}
          <nav className="flex items-center gap-2 flex-1 justify-center">
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
              const isActive =
                pathname === path ||
                (path === "/search" && pathname.startsWith("/search")) ||
                (path === "/books" && pathname.startsWith("/books"));
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? "text-stone-900 bg-amber-50"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-amber-600" : ""}`} />
                  <span className="hidden sm:inline">{label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right slot — same line, bigger */}
          {rightSlot && (
            <div className="flex items-center gap-3 flex-shrink-0 [&_button]:p-3 [&_button]:rounded-xl [&_button]:text-stone-500 [&_button:hover]:bg-stone-100 [&_button:hover]:text-stone-900 [&_svg]:w-5 [&_svg]:h-5 [&_span]:text-sm [&_span]:font-medium [&_span]:text-stone-600">
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
