import { ProductForm } from "@/features/inventory/components/product-form";

export default function NewProductPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
                <p className="text-slate-500">Create a new product record in your inventory.</p>
            </div>
            <ProductForm />
        </div>
    );
}
