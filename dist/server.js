"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const db = new database_1.Database();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
// Initialize database tables before starting server
async function initializeApp() {
    try {
        await db.initTables();
        console.log("✅ Database tables initialized");
    }
    catch (error) {
        console.error("❌ Error initializing database:", error);
        process.exit(1);
    }
}
// Routes
app.get("/api/products", async (req, res) => {
    try {
        const query = req.query;
        let products;
        if (Object.keys(query).length === 0) {
            products = await db.getAllProducts();
        }
        else {
            products = await db.searchProducts(query);
        }
        const response = {
            success: true,
            data: products,
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        res.status(500).json(response);
    }
});
app.get("/api/products/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const product = await db.getProductById(id);
        if (!product) {
            const response = {
                success: false,
                error: "Product not found",
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: product,
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        res.status(500).json(response);
    }
});
app.post("/api/products", async (req, res) => {
    try {
        const productData = req.body;
        // Validation
        if (!productData.name || !productData.price || !productData.category) {
            const response = {
                success: false,
                error: "Name, price, and category are required",
            };
            res.status(400).json(response);
            return;
        }
        const product = await db.createProduct(productData);
        const response = {
            success: true,
            data: product,
            message: "Product created successfully",
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        res.status(500).json(response);
    }
});
app.put("/api/products/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        const product = await db.updateProduct(id, updates);
        if (!product) {
            const response = {
                success: false,
                error: "Product not found",
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: product,
            message: "Product updated successfully",
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        res.status(500).json(response);
    }
});
app.delete("/api/products/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await db.deleteProduct(id);
        if (!deleted) {
            const response = {
                success: false,
                error: "Product not found",
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            message: "Product deleted successfully",
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        res.status(500).json(response);
    }
});
app.get("/api/stats", async (req, res) => {
    try {
        const stats = await db.getProductStats();
        const response = {
            success: true,
            data: stats,
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
        res.status(500).json(response);
    }
});
// Serve frontend
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
});
// Start server
initializeApp().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down server...");
    db.close();
    process.exit(0);
});
//# sourceMappingURL=server.js.map