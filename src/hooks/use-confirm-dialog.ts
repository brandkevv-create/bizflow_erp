"use client";

import { create } from 'zustand';

interface ConfirmDialogStore {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    showDialog: (config: {
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'warning' | 'info';
    }) => void;
    closeDialog: () => void;
}

export const useConfirmDialog = create<ConfirmDialogStore>((set) => ({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    showDialog: (config) => set({
        isOpen: true,
        title: config.title,
        message: config.message,
        onConfirm: config.onConfirm,
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        type: config.type || 'danger'
    }),
    closeDialog: () => set({
        isOpen: false,
        onConfirm: null
    })
}));
