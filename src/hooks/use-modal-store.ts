import { create } from 'zustand';

export type ModalType =
    | 'ADD_PRODUCT'
    | 'EDIT_PRODUCT'
    | 'ADD_INVOICE'
    | 'EDIT_INVOICE'
    | 'ADD_PAYMENT'
    | 'ADD_CUSTOMER'
    | 'EDIT_CUSTOMER'
    | 'VIEW_CUSTOMER'
    | 'POS_CHECKOUT'
    | 'ADD_TEAM_MEMBER'
    | 'EDIT_TEAM_MEMBER'
    | 'CONFIGURE_INTEGRATION'
    | 'MANAGE_CATEGORIES'
    | 'VIEW_INVOICE'
    | 'VIEW_PAYMENT'
    | 'STOCK_ADJUSTMENT'
    | 'MANAGE_LOCATION'
    | 'ADD_TRANSFER'
    | 'MANAGE_SUPPLIER'
    | 'ADD_PURCHASE_ORDER'
    | 'VIEW_PURCHASE_ORDER'
    | 'NEW_AUDIT'
    | 'ADD_EXPENSE'
    | 'MANAGE_EXPENSE_CATEGORIES'
    | 'VIEW_RETURN'
    | 'PROCESS_RETURN'
    | null;

interface ModalStore {
    type: ModalType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any; // Keeping any for now as data shape varies widely, or use Record<string, unknown> if possible but likely breaks usage
    isOpen: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onOpen: (type: ModalType, data?: any) => void;
    onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
    type: null,
    data: {},
    isOpen: false,
    onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
    onClose: () => set({ type: null, isOpen: false, data: {} })
}));
