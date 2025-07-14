import { Database } from "./database";

const db = new Database();

const sampleProducts = [
  {
    name: "Смартфон Samsung Galaxy S24",
    price: 25000,
    description:
      "Найновіший смартфон Samsung з відмінною камерою та потужним процесором",
    category: "Електроніка",
    stock: 25,
  },
  {
    name: "Навушники Sony WH-1000XM5",
    price: 8500,
    description: "Бездротові навушники з активним шумозаглушенням",
    category: "Електроніка",
    stock: 30,
  },
  {
    name: "Кофеварка Delonghi Magnifica",
    price: 15000,
    description: "Автоматична кофеварка з вбудованою кавомолкою",
    category: "Побутова техніка",
    stock: 10,
  },
  {
    name: "Пилосос Dyson V15 Detect",
    price: 18000,
    description: "Бездротовий пилосос з лазерним детектором пилу",
    category: "Побутова техніка",
    stock: 8,
  },
  {
    name: "Футболка Nike Dri-FIT",
    price: 1200,
    description: "Спортивна футболка з технологією відведення вологи",
    category: "Одяг",
    stock: 50,
  },
  {
    name: 'Книга "Чистий код"',
    price: 800,
    description: "Посібник з написання якісного коду від Роберта Мартіна",
    category: "Книги",
    stock: 15,
  },
  {
    name: "Гантелі 2x5кг",
    price: 2500,
    description: "Професійні гантелі для домашніх тренувань",
    category: "Спорт",
    stock: 20,
  },
  {
    name: "Ноутбук ASUS ROG",
    price: 45000,
    description: "Ігровий ноутбук з відеокартою RTX 4060",
    category: "Електроніка",
    stock: 5,
  },
  {
    name: "Планшет iPad Air",
    price: 22000,
    description: 'Планшет Apple з чіпом M1 та дисплеєм 10.9"',
    category: "Електроніка",
    stock: 12,
  },
  {
    name: "Мікрохвильова піч LG",
    price: 3500,
    description: "Мікрохвильова піч з грилем, 25 л",
    category: "Побутова техніка",
    stock: 18,
  },
  {
    name: "Кросівки Adidas Ultraboost",
    price: 4200,
    description: "Спортивні кросівки для бігу з технологією Boost",
    category: "Одяг",
    stock: 35,
  },
  {
    name: 'Книга "JavaScript: повний довідник"',
    price: 1200,
    description: "Повний довідник з JavaScript програмування",
    category: "Книги",
    stock: 8,
  },
];

async function initDatabase() {
  try {
    await db.initTables();

    const existingProducts = await db.getAllProducts();
    if (existingProducts.length > 0) {
      console.log(
        `Database already contains ${existingProducts.length} products. Skipping initialization.`
      );
      console.log(
        "To reinitialize, delete the shop.db file and run this command again."
      );
      return;
    }

    for (const product of sampleProducts) {
      await db.createProduct(product);
    }

    console.log("Database initialized successfully!");

    const stats = await db.getProductStats();
    console.log(`Total Products: ${stats.totalProducts}`);
    console.log(`Total Value: ${stats.totalValue.toFixed(2)} грн`);
    console.log(`Average Price: ${stats.averagePrice.toFixed(2)} грн`);
    console.log(`Total Stock: ${stats.totalStock}`);
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    db.close();
  }
}

initDatabase();
