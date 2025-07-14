const API_BASE = "/api";
let products = [];
let stats = {};

const productModal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");
const productsContainer = document.getElementById("productsContainer");
const statsGrid = document.getElementById("statsGrid");
const modalTitle = document.getElementById("modalTitle");

document.addEventListener("DOMContentLoaded", function () {
  loadProducts();
  loadStats();
  setupEventListeners();
});

function setupEventListeners() {
  document.querySelector(".close").addEventListener("click", closeModal);

  window.addEventListener("click", function (e) {
    if (e.target === productModal) {
      closeModal();
    }
  });

  productForm.addEventListener("submit", handleFormSubmit);

  document
    .getElementById("searchName")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchProducts();
      }
    });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && productModal.style.display === "block") {
      closeModal();
    }
  });
}

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    showError("Помилка з'єднання з сервером: " + error.message);
    throw error;
  }
}

async function loadProducts() {
  try {
    showLoading();
    const response = await apiRequest("/products");
    products = response.data;
    renderProducts(products);
  } catch (error) {
    showError("Помилка завантаження товарів");
    productsContainer.innerHTML =
      '<div class="error">Не вдалося завантажити товари</div>';
  }
}

async function loadStats() {
  try {
    const response = await apiRequest("/stats");
    stats = response.data;
    renderStats(stats);
  } catch (error) {
    console.error("Error loading stats:", error);
    showError("Помилка завантаження статистики");
  }
}

async function searchProducts() {
  try {
    showLoading();

    const query = {
      name: document.getElementById("searchName").value.trim(),
      category: document.getElementById("searchCategory").value,
      minPrice: document.getElementById("minPrice").value
        ? parseFloat(document.getElementById("minPrice").value)
        : undefined,
      maxPrice: document.getElementById("maxPrice").value
        ? parseFloat(document.getElementById("maxPrice").value)
        : undefined,
      sortBy: document.getElementById("sortBy").value,
      sortOrder: document.getElementById("sortOrder").value,
    };

    Object.keys(query).forEach((key) => {
      if (query[key] === "" || query[key] === undefined) {
        delete query[key];
      }
    });

    const queryString = new URLSearchParams(query).toString();
    const response = await apiRequest(`/products?${queryString}`);
    products = response.data;

    renderProducts(products);

    if (products.length === 0) {
      showInfo(
        "За вашим запитом товарів не знайдено. Спробуйте змінити параметри пошуку."
      );
    }
  } catch (error) {
    console.error("Search error:", error);
    showError("Помилка пошуку товарів");
  }
}

function clearSearch() {
  document.getElementById("searchName").value = "";
  document.getElementById("searchCategory").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.getElementById("sortBy").value = "created_at";
  document.getElementById("sortOrder").value = "desc";

  loadProducts();
}

function showLoading() {
  productsContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Завантаження товарів...</p>
    </div>
  `;
}

function renderProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="loading">
        <p>📦 Товари не знайдено</p>
      </div>
    `;
    return;
  }

  const productsGrid = document.createElement("div");
  productsGrid.className = "products-grid";

  products.forEach((product) => {
    const productCard = createProductCard(product);
    productsGrid.appendChild(productCard);
  });

  productsContainer.innerHTML = "";
  productsContainer.appendChild(productsGrid);
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  const createdDate = new Date(product.created_at).toLocaleDateString("uk-UA");
  const stockStatus =
    product.stock > 0 ? `На складі: ${product.stock} шт` : "Немає в наявності";
  const stockClass = product.stock > 0 ? "" : 'style="color: #dc3545;"';

  const categoryEmojis = {
    Електроніка: "📱",
    "Побутова техніка": "🏠",
    Одяг: "👕",
    Книги: "📚",
    Спорт: "⚽",
  };

  const categoryEmoji = categoryEmojis[product.category] || "📦";

  card.innerHTML = `
    <div class="product-header">
      ${categoryEmoji} ${escapeHtml(product.category)}
    </div>
    <div class="product-info">
      <div class="product-name">${escapeHtml(product.name)}</div>
      <div class="product-price">${product.price.toFixed(2)} грн</div>
      <div class="product-description">${escapeHtml(
        product.description || "Без опису"
      )}</div>
      <div class="product-details">
        <div><strong>Категорія:</strong> ${escapeHtml(product.category)}</div>
        <div ${stockClass}><strong>Статус:</strong> ${stockStatus}</div>
        <div><strong>Створено:</strong> ${createdDate}</div>
        <div><strong>ID:</strong> #${product.id}</div>
      </div>
      <div class="product-actions">
        <button class="btn btn-secondary" onclick="editProduct(${
          product.id
        })" title="Редагувати товар">
          ✏️ Редагувати
        </button>
        <button class="btn btn-danger" onclick="deleteProduct(${
          product.id
        })" title="Видалити товар">
          🗑️ Видалити
        </button>
      </div>
    </div>
  `;

  return card;
}

function renderStats(stats) {
  const statsCards = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalProducts}</div>
      <div class="stat-label">Всього товарів</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalValue.toFixed(2)}</div>
      <div class="stat-label">Загальна вартість (грн)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.averagePrice.toFixed(2)}</div>
      <div class="stat-label">Середня ціна (грн)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalStock}</div>
      <div class="stat-label">Всього на складі</div>
    </div>
  `;

  statsGrid.innerHTML = statsCards;
}

function showAddProductModal() {
  modalTitle.textContent = "Додати новий товар";
  productForm.reset();
  document.getElementById("productId").value = "";
  productModal.style.display = "block";

  setTimeout(() => {
    document.getElementById("productName").focus();
  }, 100);
}

function closeModal() {
  productModal.style.display = "none";
  productForm.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById("productName").value.trim(),
    price: parseFloat(document.getElementById("productPrice").value),
    description: document.getElementById("productDescription").value.trim(),
    category: document.getElementById("productCategory").value,
    stock: parseInt(document.getElementById("productStock").value),
  };

  if (!formData.name || !formData.price || !formData.category) {
    showError("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }

  if (formData.price < 0) {
    showError("Ціна не може бути від'ємною");
    return;
  }

  if (formData.stock < 0) {
    showError("Кількість на складі не може бути від'ємною");
    return;
  }

  const productId = document.getElementById("productId").value;

  try {
    if (productId) {
      await apiRequest(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      showSuccess("Товар успішно оновлено! 🎉");
    } else {
      await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      showSuccess("Товар успішно додано! 🎉");
    }

    closeModal();
    loadProducts();
    loadStats();
  } catch (error) {
    console.error("Form submission error:", error);
    showError("Помилка при збереженні товару");
  }
}

async function editProduct(id) {
  try {
    const response = await apiRequest(`/products/${id}`);
    const product = response.data;

    modalTitle.textContent = "Редагувати товар";
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productDescription").value =
      product.description || "";
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productStock").value = product.stock;

    productModal.style.display = "block";

    setTimeout(() => {
      document.getElementById("productName").focus();
    }, 100);
  } catch (error) {
    console.error("Edit product error:", error);
    showError("Помилка при завантаженні товару для редагування");
  }
}

async function deleteProduct(id) {
  const product = products.find((p) => p.id === id);
  const productName = product ? product.name : `ID ${id}`;

  if (
    !confirm(
      `Ви впевнені, що хочете видалити товар "${productName}"?\n\nЦю дію не можна буде скасувати.`
    )
  ) {
    return;
  }

  try {
    await apiRequest(`/products/${id}`, {
      method: "DELETE",
    });
    showSuccess("Товар успішно видалено! 🗑️");
    loadProducts();
    loadStats();
  } catch (error) {
    console.error("Delete product error:", error);
    showError("Помилка при видаленні товару");
  }
}

function showError(message) {
  showNotification(message, "error");
}

function showSuccess(message) {
  showNotification(message, "success");
}

function showInfo(message) {
  showNotification(message, "info");
}

function showNotification(message, type = "info") {
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    max-width: 400px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  `;

  switch (type) {
    case "error":
      notification.style.backgroundColor = "#f8d7da";
      notification.style.color = "#721c24";
      notification.style.border = "1px solid #f5c6cb";
      break;
    case "success":
      notification.style.backgroundColor = "#d4edda";
      notification.style.color = "#155724";
      notification.style.border = "1px solid #c3e6cb";
      break;
    case "info":
      notification.style.backgroundColor = "#cce7ff";
      notification.style.color = "#004085";
      notification.style.border = "1px solid #99d3ff";
      break;
  }

  document.body.appendChild(notification);

  setTimeout(
    () => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    },
    type === "error" ? 5000 : 3000
  );
}

const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
