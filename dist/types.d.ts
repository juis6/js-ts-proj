export interface Product {
    id?: number;
    name: string;
    price: number;
    description: string;
    category: string;
    stock: number;
    image_url?: string;
    created_at?: string;
    updated_at?: string;
}
export interface ProductCreateRequest {
    name: string;
    price: number;
    description: string;
    category: string;
    stock: number;
    image_url?: string;
}
export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
    id: number;
}
export interface ProductSearchQuery {
    name?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "name" | "price" | "stock" | "created_at";
    sortOrder?: "asc" | "desc";
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface ProductStats {
    totalProducts: number;
    totalValue: number;
    averagePrice: number;
    totalStock: number;
    categories: {
        [key: string]: number;
    };
}
//# sourceMappingURL=types.d.ts.map