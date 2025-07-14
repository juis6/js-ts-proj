import sqlite3 from "sqlite3";
import { Product, ProductSearchQuery, ProductStats } from "./types";

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = "./shop.db") {
    this.db = new sqlite3.Database(dbPath);
  }

  initTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      this.db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getAllProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM products ORDER BY created_at DESC",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Product[]);
        }
      );
    });
  }

  getProductById(id: number): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve((row as Product) || null);
      });
    });
  }

  createProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<Product> {
    return new Promise((resolve, reject) => {
      const { name, price, description, category, stock } = product;
      const sql =
        "INSERT INTO products (name, price, description, category, stock) VALUES (?, ?, ?, ?, ?)";

      this.db.run(
        sql,
        [name, price, description, category, stock],
        function (err) {
          if (err) reject(err);
          else
            resolve({
              id: this.lastID,
              ...product,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
      );
    });
  }

  updateProduct(
    id: number,
    updates: Partial<Product>
  ): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).filter(
        (key) => updates[key as keyof Product] !== undefined
      );
      if (fields.length === 0) {
        reject(new Error("No fields to update"));
        return;
      }

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => updates[field as keyof Product]);
      values.push(id);

      const sql = `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

      this.db.run(sql, values, function (err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else resolve({ id, ...updates } as Product);
      });
    });
  }

  deleteProduct(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  searchProducts(query: ProductSearchQuery): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM products WHERE 1=1";
      const params: any[] = [];

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
      } else {
        sql += " ORDER BY created_at DESC";
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Product[]);
      });
    });
  }

  getProductStats(): Promise<ProductStats> {
    return new Promise((resolve, reject) => {
      const statsQuery =
        "SELECT COUNT(*) as totalProducts, SUM(price * stock) as totalValue, AVG(price) as averagePrice, SUM(stock) as totalStock FROM products";
      const categoriesQuery =
        "SELECT category, COUNT(*) as count FROM products GROUP BY category";

      this.db.get(statsQuery, (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        this.db.all(categoriesQuery, (err, categoryRows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          const categories: { [key: string]: number } = {};
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

  close(): void {
    this.db.close();
  }
}
