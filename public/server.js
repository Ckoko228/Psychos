const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public")); // папка для фронтенда

// Храним, кто взял машину (только одна машина)
let claim = null;
const COOLDOWN_MS = 90 * 60 * 1000; // 1.5 часа

// Проверка таймаута
function isCooldownExpired() {
  if (!claim) return true;
  return (Date.now() - claim.timestamp) > COOLDOWN_MS;
}

// API получить состояние машины
app.get("/api/claim", (req, res) => {
  if (claim && !isCooldownExpired()) {
    res.json({ taken: true, user: claim.user });
  } else {
    claim = null;
    res.json({ taken: false });
  }
});

// API взять машину
app.post("/api/claim", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "Нужно указать user" });

  if (claim && !isCooldownExpired()) {
    return res.status(400).json({ error: "Машина уже занята" });
  }

  claim = { user, timestamp: Date.now() };
  res.json({ success: true });
});

// API отказаться от машины
app.post("/api/release", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "Нужно указать user" });

  if (!claim || claim.user !== user) {
    return res.status(400).json({ error: "Ты не владелец машины" });
  }

  claim = null;
  res.json({ success: true });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
