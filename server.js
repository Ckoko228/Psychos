const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// Подключение к базе
const db = new sqlite3.Database("./data.db");

// Создание таблицы, если нет
db.run(`
  CREATE TABLE IF NOT EXISTS car_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    taken_at INTEGER NOT NULL
  )
`);

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // фронтенд из public

const COOLDOWN_MS = 90 * 60 * 1000; // 1.5 часа

// Проверка доступности машины
app.get("/api/claim", (req, res) => {
  db.get("SELECT * FROM car_status ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: "DB Error" });

    if (!row) return res.json({ taken: false });

    const elapsed = Date.now() - row.taken_at;
    if (elapsed > COOLDOWN_MS) {
      // Слишком давно — удалим
      db.run("DELETE FROM car_status", () => {
        res.json({ taken: false });
      });
    } else {
      res.json({ taken: true, user: row.user });
    }
  });
});

// Взять машину
app.post("/api/claim", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "Нужно указать user" });

  db.get("SELECT * FROM car_status ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: "DB Error" });

    if (row && Date.now() - row.taken_at < COOLDOWN_MS) {
      return res.status(400).json({ error: "Машина уже занята" });
    }

    db.run("DELETE FROM car_status"); // удалим старую запись
    db.run(
      "INSERT INTO car_status (user, taken_at) VALUES (?, ?)",
      [user, Date.now()],
      () => {
        res.json({ success: true });
      }
    );
  });
});

// Отказаться от машины
app.post("/api/release", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "Нужно указать user" });

  db.get("SELECT * FROM car_status ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: "DB Error" });

    if (!row || row.user !== user) {
      return res.status(400).json({ error: "Ты не владелец машины" });
    }

    db.run("DELETE FROM car_status", () => {
      res.json({ success: true });
    });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
