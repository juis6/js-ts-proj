import express from "express";
import cors from "cors";
import path from "path";
import { Database } from "./database";
import { Product, ApiResponse, ProductSearchQuery } from "./types";

const app = express();
const PORT = 3000;
const db = new Database();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

async function initApp() {
  await db.initTables();
}

app.get("/api/products", async (req, res) => {
  try {
    const query = req.query as unknown as ProductSearchQuery;
    let products;

    if (Object.keys(query).length === 0) {
      products = await db.getAllProducts();
    } else {
      products = await db.searchProducts(query);
    }

    const response: ApiResponse<Product[]> = { success: true, data: products };
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await db.getProductById(parseInt(req.params.id));
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const productData: Omit<Product, "id" | "created_at" | "updated_at"> =
      req.body;
    const product = await db.createProduct(productData);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Partial<Product> = req.body;
    const product = await db.updateProduct(id, updates);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const deleted = await db.deleteProduct(parseInt(req.params.id));
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const stats = await db.getProductStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

initApp().then(() => {
  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
  );
});

process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});
