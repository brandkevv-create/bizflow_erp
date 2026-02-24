"use client";

import { useEffect, useState } from "react";
import { ProductModal } from "@/components/modals/product-modal";
import { InvoiceModal } from "@/components/modals/invoice-modal";
import { CustomerModal } from "@/components/modals/customer-modal";
import { PaymentModal } from "@/components/modals/payment-modal";
import { EditCustomerModal } from "@/components/modals/edit-customer-modal";
import { EditInvoiceModal } from "@/components/modals/edit-invoice-modal";
import { ViewInvoiceModal } from "@/components/modals/view-invoice-modal";
import { ViewPaymentModal } from "@/components/modals/view-payment-modal";
import { ViewCustomerSheet } from "@/components/modals/view-customer-sheet";
import { PosCheckoutModal } from "@/components/modals/pos-checkout-modal";
import { TeamMemberModal } from "@/components/modals/team-member-modal";
import { IntegrationConfigModal } from "@/components/modals/integration-config-modal";
import { ManageCategoriesModal } from "@/components/modals/manage-categories-modal";
import { StockAdjustmentModal } from "@/components/modals/stock-adjustment-modal";

import { ManageLocationModal } from "@/components/modals/manage-location-modal";
import { ManageSupplierModal } from "@/components/modals/manage-supplier-modal";
import { AddPurchaseOrderModal } from "@/components/modals/add-purchase-order-modal";
import { ViewPurchaseOrderModal } from "@/components/modals/view-purchase-order-modal";
import { AddTransferModal } from "@/components/modals/add-transfer-modal";
import { AddStockTakeModal } from "@/components/modals/add-stock-take-modal";
import { AddExpenseModal } from "@/components/modals/add-expense-modal";
import { ManageExpenseCategoriesModal } from "@/components/modals/manage-expense-categories-modal";
import { ViewReturnModal } from "@/components/modals/view-return-modal";
import { ProcessReturnModal } from "@/components/modals/process-return-modal";

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <ProductModal />
            <InvoiceModal />
            <CustomerModal />
            <PaymentModal />
            <EditCustomerModal />
            <EditInvoiceModal />
            <ViewInvoiceModal />
            <ViewPaymentModal />
            <ViewCustomerSheet />
            <PosCheckoutModal />
            <TeamMemberModal />
            <IntegrationConfigModal />
            <ManageCategoriesModal />
            <StockAdjustmentModal />
            <ManageLocationModal />
            <AddTransferModal />
            <ManageSupplierModal />
            <AddPurchaseOrderModal />
            <ViewPurchaseOrderModal />
            <AddStockTakeModal />
            <AddExpenseModal />
            <ManageExpenseCategoriesModal />
            <ViewReturnModal />
            <ProcessReturnModal />
        </>
    )
}
