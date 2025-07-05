const car = {
  id: 1,
  name: "BMW M5 F90",
  img: "https://s3.iimg.su/s/03/nm87ykpGaRDnww9aBVJpUQd6oq4NBo3oDFOpwfcX.png" 
};

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

let claim = null;
const COOLDOWN_MS = 90 * 60 * 1000;

function isCooldownExpired() {
  if (!claim) return true;
  return (Date.now() - claim.timestamp) > COOLDOWN_MS;
}

app.get("/api/claim", (req, res) => {
  if (claim && !isCooldownExpired()) {
    res.json({ taken: true, user: claim.user });
  } else {
    claim = null;
    res.json({ taken: false });
  }
});

app.post("/api/claim", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "Нужно указать user" });

  if (claim && !isCooldownExpired()) {
    return res.status(400).json({ error: "Машина уже занята" });
  }

  claim = { user, timestamp: Date.now() };

  // Рассылаем всем клиентам обновление
  io.emit("claimUpdate", { taken: true, user: claim.user });

  res.json({ success: true });
});

app.post("/api/release", (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "Нужно указать user" });

  if (!claim || claim.user !== user) {
    return res.status(400).json({ error: "Ты не владелец машины" });
  }

  claim = null;

  // Рассылаем всем клиентам обновление
  io.emit("claimUpdate", { taken: false });

  res.json({ success: true });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server started on port ${PORT}`);
});
