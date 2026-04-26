import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import Home from './pages/Home'
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import SearchPage from "./pages/SearchPage"
import UploadBillPage from "./pages/UploadBillPage"
import BooksPage from "./pages/BooksPage"
import BookDetailPage from "./pages/BookDetailPage"
import DeliveryPage from "./pages/DeliveryPage"
import CustomerDetailPage from "./pages/CustomerDetailPage"
import BillDetailPage from "./pages/BillDetailPage"
import BillsListPage from "./pages/BillsListPage"
import PendingBalancePage from "./pages/PendingBalancePage"
import NotFound from "./pages/NotFound"

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center"><div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
      <Route path="/upload" element={<RequireAuth><UploadBillPage /></RequireAuth>} />
      <Route path="/books" element={<RequireAuth><BooksPage /></RequireAuth>} />
      <Route path="/books/:id" element={<RequireAuth><BookDetailPage /></RequireAuth>} />
      <Route path="/delivery" element={<RequireAuth><DeliveryPage /></RequireAuth>} />
      <Route path="/customer/:id" element={<RequireAuth><CustomerDetailPage /></RequireAuth>} />
      <Route path="/bill/:id" element={<RequireAuth><BillDetailPage /></RequireAuth>} />
      <Route path="/bills" element={<RequireAuth><BillsListPage /></RequireAuth>} />
      <Route path="/pending-balance" element={<RequireAuth><PendingBalancePage /></RequireAuth>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
