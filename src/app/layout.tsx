import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/components/providers/modal-provider";
import { ToastContainer } from "@/components/ui/toast-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AuthListener } from "@/features/auth/components/auth-listener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BizFlow ERP - Business Management System",
  description: "Complete business management solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ModalProvider />
        <ToastContainer />
        <ConfirmDialog />
        <AuthListener />
      </body>
    </html>
  );
}
