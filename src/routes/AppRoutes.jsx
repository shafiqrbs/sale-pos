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
import DashboardIndex from "@modules/dashboard";
import CustomersIndex from "@modules/core/customers";
import ConfigIndex from "@modules/inventory/config";
import SalesNewIndex from "@modules/inventory/sales/NewIndex";
import SalesEditIndex from "@modules/inventory/sales/EditIndex";
import RequisitionIndex from "@modules/inventory/requisition";
import RequisitionNewIndex from "@modules/inventory/requisition/NewIndex";
import RequisitionEditIndex from "@modules/inventory/requisition/EditIndex";
import PurchaseReturnIndex from "@modules/inventory/purchase-return";
import PurchaseReturnNewIndex from "@modules/inventory/purchase-return/NewIndex";
import PurchaseReturnEditIndex from "@modules/inventory/purchase-return/EditIndex";
import CategorySummary from "@modules/report/category-summary";

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
					<Route path="purchase-return">
						<Route index element={<PurchaseReturnIndex />} />
						<Route path="new" element={<PurchaseReturnNewIndex />} />
						<Route path="edit/:id" element={<PurchaseReturnEditIndex />} />
					</Route>
					<Route path="config" element={<ConfigIndex />} />
					<Route path="purchase-item" element={<PurchaseItemIndex />} />
					{/* <Route path="sales/edit/:id" element={<SalesEdit />} /> */}
					{/* <Route path="sales" element={<DashboardBarChart />} /> */}
					{/* <Route path="sales" element={<TestInput />} /> */}
					{/*
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
	);
}
