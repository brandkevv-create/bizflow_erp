"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useInventoryStore } from "@/store/inventory-store";
import { cn } from "@/lib/utils";

const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sku: z.string().min(3, "SKU must be at least 3 characters"),
    category: z.string().min(1, "Category is required"),
    price: z.number().min(0, "Price must be positive"),
    cost: z.number().min(0, "Cost must be positive"),
    stock: z.number().int().min(0, "Stock must be a positive integer"),
    status: z.enum(["active", "draft", "archived"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm() {
    const router = useRouter();
    const addProduct = useInventoryStore((state) => state.addProduct);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            status: "active",
            price: 0,
            cost: 0,
            stock: 0,
        },
    });

    const onSubmit = async (data: ProductFormValues) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        addProduct(data);
        router.push("/dashboard/inventory");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Product Name</label>
                    <input
                        {...register("name")}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            errors.name && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="e.g. Ergonomic Office Chair"
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">SKU</label>
                    <input
                        {...register("sku")}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            errors.sku && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="e.g. FUR-001"
                    />
                    {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select
                        {...register("category")}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            errors.category && "border-red-500 focus:ring-red-500"
                        )}
                    >
                        <option value="">Select a category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Accessories">Accessories</option>
                    </select>
                    {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select
                        {...register("status")}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Price ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register("price", { valueAsNumber: true })}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            errors.price && "border-red-500 focus:ring-red-500"
                        )}
                    />
                    {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Cost ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register("cost", { valueAsNumber: true })}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            errors.cost && "border-red-500 focus:ring-red-500"
                        )}
                    />
                    {errors.cost && <p className="text-xs text-red-500">{errors.cost.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Stock Quantity</label>
                    <input
                        type="number"
                        {...register("stock", { valueAsNumber: true })}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            errors.stock && "border-red-500 focus:ring-red-500"
                        )}
                    />
                    {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Creating..." : "Create Product"}
                </button>
            </div>
        </form>
    );
}
