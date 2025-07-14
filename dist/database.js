"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
class Database {
    constructor(dbPath = "./shop.db") {
        this.isInitialized = false;
        this.db = new sqlite3_1.default.Database(dbPath, (err) => {
            if (err) {
                console.error("Error opening database:", err);
            }
            else {
                console.log("Connected to SQLite database");
            }
        });
    }
    // Ініціалізація таблиць з Promise
    initTables() {
        return new Promise((resolve, reject) => {
            const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
            this.db.run(createProductsTable, (err) => {
                if (err) {
                    console.error("Error creating products table:", err);
                    reject(err);
                }
                else {
                    console.log("Products table ready");
                    this.isInitialized = true;
                    resolve();
                }
            });
        });
    }
    // Перевірка ініціалізації
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initTables();
        }
    }
    async getAllProducts() {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM products ORDER BY created_at DESC", (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    async getProductById(id) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row || null);
                }
            });
        });
    }
    async createProduct(product) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            const { name, price, description, category, stock, image_url } = product;
            const query = `
        INSERT INTO products (name, price, description, category, stock, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
            this.db.run(query, [name, price, description, category, stock, image_url], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    const createdId = this.lastID;
                    resolve({
                        id: createdId,
                        ...product,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                }
            });
        });
    }
    async updateProduct(id, updates) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates).filter((key) => updates[key] !== undefined);
            if (fields.length === 0) {
                reject(new Error("No fields to update"));
                return;
            }
            const setClause = fields.map((field) => `${field} = ?`).join(", ");
            const values = fields.map((field) => updates[field]);
            values.push(id);
            const query = `
        UPDATE products 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
            this.db.run(query, values, function (err) {
                if (err) {
                    reject(err);
                }
                else if (this.changes === 0) {
                    resolve(null);
                }
                else {
                    resolve({ id, ...updates });
                }
            });
        });
    }
    async deleteProduct(id) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes > 0);
                }
            });
        });
    }
    async searchProducts(query) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            let sql = "SELECT * FROM products WHERE 1=1";
            const params = [];
            if (query.name) {
                sql += " AND name LIKE ?";
                params.push(`%${query.name}%`);
            }
            if (query.category) {
                sql += " AND category = ?";
                params.push(query.category);
            }
            if (query.minPrice !== undefined) {
                sql += " AND price >= ?";
                params.push(query.minPrice);
            }
            if (query.maxPrice !== undefined) {
                sql += " AND price <= ?";
                params.push(query.maxPrice);
            }
            if (query.sortBy) {
                const sortOrder = query.sortOrder || "asc";
                sql += ` ORDER BY ${query.sortBy} ${sortOrder}`;
            }
            else {
                sql += " ORDER BY created_at DESC";
            }
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    async getProductStats() {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            const queries = [
                "SELECT COUNT(*) as totalProducts, SUM(price * stock) as totalValue, AVG(price) as averagePrice, SUM(stock) as totalStock FROM products",
                "SELECT category, COUNT(*) as count FROM products GROUP BY category",
            ];
            this.db.get(queries[0], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.db.all(queries[1], (err, categoryRows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const categories = {};
                    categoryRows.forEach((row) => {
                        categories[row.category] = row.count;
                    });
                    resolve({
                        totalProducts: row.totalProducts || 0,
                        totalValue: row.totalValue || 0,
                        averagePrice: row.averagePrice || 0,
                        totalStock: row.totalStock || 0,
                        categories,
                    });
                });
            });
        });
    }
    close() {
        this.db.close((err) => {
            if (err) {
                console.error("Error closing database:", err);
            }
            else {
                console.log("Database connection closed");
            }
        });
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map