import sqlite3 from "sqlite3";
import {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductSearchQuery,
  ProductStats,
} from "./types";

export class Database {
  private db: sqlite3.Database;
  private isInitialized: boolean = false;

  constructor(dbPath: string = "./shop.db") {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err);
      } else {
        console.log("Connected to SQLite database");
      }
    });
  }

  // Ініціалізація таблиць з Promise
  public initTables(): Promise<void> {
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
        } else {
          console.log("Products table ready");
          this.isInitialized = true;
          resolve();
        }
      });
    });
  }

  // Перевірка ініціалізації
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initTables();
    }
  }

  public async getAllProducts(): Promise<Product[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM products ORDER BY created_at DESC",
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Product[]);
          }
        }
      );
    });
  }

  public async getProductById(id: number): Promise<Product | null> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve((row as Product) || null);
        }
      });
    });
  }

  public async createProduct(product: ProductCreateRequest): Promise<Product> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const { name, price, description, category, stock, image_url } = product;
      const query = `
        INSERT INTO products (name, price, description, category, stock, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [name, price, description, category, stock, image_url],
        function (err) {
          if (err) {
            reject(err);
          } else {
            const createdId = this.lastID;
            resolve({
              id: createdId,
              ...product,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  public async updateProduct(
    id: number,
    updates: Partial<ProductCreateRequest>
  ): Promise<Product | null> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).filter(
        (key) => updates[key as keyof ProductCreateRequest] !== undefined
      );
      if (fields.length === 0) {
        reject(new Error("No fields to update"));
        return;
      }

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map(
        (field) => updates[field as keyof ProductCreateRequest]
      );
      values.push(id);

      const query = `
        UPDATE products 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(query, values, function (err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          resolve({ id, ...updates } as Product);
        }
      });
    });
  }

  public async deleteProduct(id: number): Promise<boolean> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  public async searchProducts(query: ProductSearchQuery): Promise<Product[]> {
    await this.ensureInitialized();
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
        if (err) {
          reject(err);
        } else {
          resolve(rows as Product[]);
        }
      });
    });
  }

  public async getProductStats(): Promise<ProductStats> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const queries = [
        "SELECT COUNT(*) as totalProducts, SUM(price * stock) as totalValue, AVG(price) as averagePrice, SUM(stock) as totalStock FROM products",
        "SELECT category, COUNT(*) as count FROM products GROUP BY category",
      ];

      this.db.get(queries[0], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        this.db.all(queries[1], (err, categoryRows: any[]) => {
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

  public close(): void {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("Database connection closed");
      }
    });
  }
}
