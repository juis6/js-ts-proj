import { Product, ProductCreateRequest, ProductSearchQuery, ProductStats } from "./types";
export declare class Database {
    private db;
    private isInitialized;
    constructor(dbPath?: string);
    initTables(): Promise<void>;
    private ensureInitialized;
    getAllProducts(): Promise<Product[]>;
    getProductById(id: number): Promise<Product | null>;
    createProduct(product: ProductCreateRequest): Promise<Product>;
    updateProduct(id: number, updates: Partial<ProductCreateRequest>): Promise<Product | null>;
    deleteProduct(id: number): Promise<boolean>;
    searchProducts(query: ProductSearchQuery): Promise<Product[]>;
    getProductStats(): Promise<ProductStats>;
    close(): void;
}
//# sourceMappingURL=database.d.ts.map