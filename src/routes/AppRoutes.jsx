import { Routes, Route } from "react-router";
import Activate from "@modules/auth/Activate";
import Login from "@modules/auth/Login";
import Layout from "@components/layout/Layout";
import NotFound from "@components/NotFound";
import BakeryIndex from "@modules/pos/bakery";
import SalesIndex from "@modules/inventory/sales";
import HoldSalesIndex from "@modules/inventory/sales/HoldIndex";
import PurchaseIndex from "@modules/inventory/purchase";
import PurchaseItemIndex from "@modules/inventory/purchase-item";
import PurchaseNewIndex from "@modules/inventory/purchase/NewIndex";
import PurchaseEditIndex from "@modules/inventory/purchase/EditIndex";
import StockIndex from "@modules/stock";
import StockEditIndex from "@modules/stock/EditIndex";
import CategoryIndex from "@modules/inventory/category";
import ParticularIndex from "@modules/inventory/particular";
import DashboardIndex from "@modules/dashboard";
import CustomersIndex from "@modules/core/customers";
import ConfigIndex from "@modules/inventory/config";
import SalesNewIndex from "@modules/inventory/sales/NewIndex";
import SalesEditIndex from "@modules/inventory/sales/EditIndex";
import RequisitionIndex from "@modules/inventory/requisition";
import RequisitionNewIndex from "@modules/inventory/requisition/NewIndex";
import RequisitionEditIndex from "@modules/inventory/requisition/EditIndex";
import InvoicePurchaseIndex from "@modules/inventory/invoice-purchase";
import InvoicePurchaseNewIndex from "@modules/inventory/invoice-purchase/NewIndex";
import InvoicePurchaseEditIndex from "@modules/inventory/invoice-purchase/EditIndex";
import PurchaseReturnIndex from "@modules/inventory/purchase-return";
import PurchaseReturnNewIndex from "@modules/inventory/purchase-return/NewIndex";
import PurchaseReturnEditIndex from "@modules/inventory/purchase-return/EditIndex";
import CategorySummary from "@modules/report/category-summary";
import DamageItem from "@modules/report/damage-item";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/activate" element={<Activate />} />
			<Route path="/login" element={<Login />} />
			<Route path="/" element={<Layout />}>
				<Route path="core">
					<Route index path="customers" element={<CustomersIndex />} />
				</Route>
				<Route path="report">
					<Route index path="category-summary" element={<CategorySummary />} />
					<Route index path="damage-item" element={<DamageItem />} />
				</Route>
				<Route path="inventory">
					<Route path="sales">
						<Route index element={<SalesIndex />} />
						<Route path="new" element={<SalesNewIndex />} />
						<Route path="hold" element={<HoldSalesIndex />} />
						<Route path="edit/:id" element={<SalesEditIndex />} />
					</Route>
					<Route path="purchase">
						<Route index element={<PurchaseIndex />} />
						<Route path="new" element={<PurchaseNewIndex />} />
						<Route path="edit/:id" element={<PurchaseEditIndex />} />
					</Route>
					<Route path="requisition">
						<Route index element={<RequisitionIndex />} />
						<Route path="new" element={<RequisitionNewIndex />} />
						<Route path="edit/:id" element={<RequisitionEditIndex />} />
					</Route>
					<Route path="invoice-purchase">
						<Route index element={<InvoicePurchaseIndex />} />
						<Route path="new" element={<InvoicePurchaseNewIndex />} />
						<Route path="edit/:id" element={<InvoicePurchaseEditIndex />} />
					</Route>
					<Route path="purchase-return">
						<Route index element={<PurchaseReturnIndex />} />
						<Route path="new" element={<PurchaseReturnNewIndex />} />
						<Route path="edit/:id" element={<PurchaseReturnEditIndex />} />
					</Route>
					<Route path="config" element={
						<ProtectedRoute allowedRoles={[ "role_sales_purchase_manager", "role_sales_purchase_admin", "role_sales_purchase_admin", "role_sales_purchase_admin" ]}>
							<ConfigIndex />
						</ProtectedRoute>
					} />
					<Route path="purchase-item" element={<PurchaseItemIndex />} />
					{/* <Route path="sales/edit/:id" element={<SalesEdit />} /> */}
					{/* <Route path="sales" element={<DashboardBarChart />} /> */}
					{/* <Route path="sales" element={<TestInput />} /> */}
					{/*
                    <Route path="sales-invoice" element={<SalesInvoice />} /> */}
					{/* <Route path="purchase/edit/:id" element={<PurchaseEdit />} /> */}
					{/* <Route path="purchase-invoice" element={<PurchaseInvoice />} /> */}
					<Route path="stock">
						<Route index element={<StockIndex />} />
						<Route path="edit/:id" element={<StockEditIndex />} />
					</Route>
					<Route path="category" element={<CategoryIndex />} />
					<Route path="particular" element={<ParticularIndex />} />
				</Route>
				<Route path="dashboard" element={<DashboardIndex />} />
				<Route path="pos">
					<Route path="bakery" element={<BakeryIndex />} />
				</Route>
			</Route>
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
}
