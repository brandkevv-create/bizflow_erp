import { useSettingsStore } from '@/store/settings-store';
import { useCallback } from 'react';

export function useFormatCurrency() {
    const { business } = useSettingsStore();

    const formatCurrency = useCallback((value: number | string) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) {
            return String(value);
        }

        // Default to USD if business.currency is strangely empty or not loaded
        const currencyCode = business?.currency || 'USD';

        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(numValue);
        } catch (e) {
            // Fallback if the currency code is somehow invalid 
            // (e.g., if a user previously had "USD - US Dollar" saved in the DB)
            console.warn(`Invalid currency code detected: "${currencyCode}". Falling back to basic formatting.`);
            return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }, [business?.currency]);

    return formatCurrency;
}
