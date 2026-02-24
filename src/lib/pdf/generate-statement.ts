import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/store/customers-store';

export async function generateAccountStatement(customer: Customer) {
    // Fetch data
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: true });

    if (invError) throw invError;

    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*, invoice:invoices(invoice_number)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: true });

    if (payError) throw payError;

    // Compile a chronological ledger
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ledger: any[] = [];

    invoices?.forEach(inv => {
        ledger.push({
            date: new Date(inv.issue_date || inv.created_at),
            type: 'Invoice',
            ref: inv.invoice_number,
            debit: Number(inv.total_amount),
            credit: 0
        });
    });

    payments?.forEach(pay => {
        ledger.push({
            date: new Date(pay.date || pay.created_at),
            type: 'Payment',
            ref: pay.invoice?.invoice_number ? `Pay for ${pay.invoice.invoice_number}` : (pay.reference || 'Payment'),
            debit: 0,
            credit: Number(pay.amount)
        });
    });

    // Sort chronologically
    ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    const tableData = ledger.map(entry => {
        balance += (entry.debit - entry.credit);
        return [
            entry.date.toLocaleDateString(),
            entry.type,
            entry.ref,
            entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-',
            entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-',
            `$${balance.toFixed(2)}`
        ];
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('STATEMENT OF ACCOUNT', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Company Info (Right)
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('BizFlow ERP', pageWidth - 14, 22, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('123 Business Street', pageWidth - 14, 28, { align: 'right' });
    doc.text('City, State 12345', pageWidth - 14, 33, { align: 'right' });

    // Customer Info
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Bill To:', 14, 45);
    doc.setFontSize(11);
    doc.text(customer.company_name || customer.name, 14, 52);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    if (customer.company_name) doc.text(customer.name, 14, 57);
    doc.text(customer.email, 14, customer.company_name ? 62 : 57);
    if (customer.phone) doc.text(customer.phone, 14, customer.company_name ? 67 : 62);

    // Summary Box
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(pageWidth - 74, 42, 60, 30, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.text('Amount Due', pageWidth - 44, 52, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${Math.max(0, balance).toFixed(2)}`, pageWidth - 44, 62, { align: 'center' });

    // Table
    autoTable(doc, {
        startY: 85,
        head: [['Date', 'Transaction', 'Reference', 'Amount', 'Payment', 'Balance']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
        styles: { textColor: [51, 65, 85], fontSize: 9, cellPadding: 5 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        },
    });

    // Save PDF
    doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
