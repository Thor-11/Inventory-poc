import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RecoveryScreen from './components/RecoveryScreen';
import { useInventory } from './context/InventoryContext';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductDetails from './pages/ProductDetails';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import StockAdjustment from './pages/StockAdjustment';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

export default function App() {
  const { problems } = useInventory();
  if (problems.length > 0) return <RecoveryScreen />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="stock-in" element={<StockIn />} />
        <Route path="stock-out" element={<StockOut />} />
        <Route path="stock-adjustment" element={<StockAdjustment />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/low-stock" element={<Navigate to="/reports?tab=low-stock" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
