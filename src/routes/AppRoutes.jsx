import { Routes, Route } from 'react-router'
import Activate from '@modules/auth/Activate'
import Login from '@modules/auth/Login'
import Layout from '@components/layout/Layout'
import NotFound from '@components/NotFound'
import BakeryIndex from '@modules/pos/bakery'
import SalesIndex from '@modules/inventory/sales'
// import PurchaseIndex from '@modules/inventory/purchase'
import StockIndex from '@modules/stock'
import DashboardIndex from '@modules/dashboard'
import CustomersIndex from '@modules/core/customers'

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/activate" element={<Activate />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
                <Route path="core">
                    <Route index path="customers" element={<CustomersIndex />} />
                </Route>
                <Route path="inventory">
                    <Route path="sales" element={<SalesIndex />} />
                    {/* <Route path="purchase" element={<PurchaseIndex />} /> */}
                    {/* <Route path="sales/edit/:id" element={<SalesEdit />} /> */}
                    {/* <Route path="sales" element={<DashboardBarChart />} /> */}
                    {/* <Route path="sales" element={<TestInput />} /> */}
                    {/* <Route path="purchase" element={<PurchaseIndex />} />
                    <Route path="sales-invoice" element={<SalesInvoice />} /> */}
                    {/* <Route path="purchase/edit/:id" element={<PurchaseEdit />} /> */}
                    {/* <Route path="purchase-invoice" element={<PurchaseInvoice />} /> */}
                    <Route path="stock" element={<StockIndex />} />
                </Route>
                <Route path="dashboard" element={<DashboardIndex />} />
                <Route path="pos">
                    <Route path="bakery" element={<BakeryIndex />} />
                </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
