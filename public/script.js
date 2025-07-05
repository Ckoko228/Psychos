const car = {
  id: 1,
  name: "BMW M5 F90",
  img: "https://s3.iimg.su/s/03/nm87ykpGaRDnww9aBVJpUQd6oq4NBo3oDFOpwfcX.png" 
};

const COOLDOWN_MS = 90 * 60 * 1000; // 1.5 часа в миллисекундах

// Сохраняем данные в localStorage
function saveClaim(data) {
  localStorage.setItem("claim", JSON.stringify(data));
}

// Загружаем данные из localStorage
function loadClaim() {
  return JSON.parse(localStorage.getItem("claim"));
}

// Проверяем, истек ли таймер
function isCooldownExpired(timestamp) {
  if (!timestamp) return true;
  return (Date.now() - timestamp) > COOLDOWN_MS;
}

function renderCar() {
  const container = document.getElementById("car-list");
  const nickname = document.getElementById("nickname").value.trim();
  let claim = loadClaim();

  // Если время аренды истекло — освобождаем машину
  if (claim && isCooldownExpired(claim.timestamp)) {
    claim = null;
    localStorage.removeItem("claim");
  }

  container.innerHTML = "";

  const carDiv = document.createElement("div");
  carDiv.className = "car";

  let innerHTML = `
    <img src="${car.img}" alt="${car.name}" />
    <h3>${car.name}</h3>
  `;

  if (claim) {
    innerHTML += `<p class="taken-by">🚫 Занято: <b>${claim.user}</b></p>`;

    if (nickname && nickname === claim.user) {
      innerHTML += `<button id="release-btn">Отказаться</button>`;
    }
  } else {
    innerHTML += `<button id="take-btn">Взять</button>`;
  }

  carDiv.innerHTML = innerHTML;
  container.appendChild(carDiv);

  if (!claim) {
    document.getElementById("take-btn").addEventListener("click", () => {
      const nicknameNow = document.getElementById("nickname").value.trim();
      if (!nicknameNow) {
        alert("Пожалуйста, введите ваш ник!");
        return;
      }
      saveClaim({ user: nicknameNow, timestamp: Date.now() });
      renderCar();
    });
  } else if (nickname && nickname === claim.user) {
    document.getElementById("release-btn").addEventListener("click", () => {
      localStorage.removeItem("claim");
      renderCar();
    });
  }
}

document.getElementById("nickname").addEventListener("input", renderCar);
document.addEventListener("DOMContentLoaded", renderCar);
const usernameInput = document.getElementById("username");
const claimBtn = document.getElementById("claimBtn");
const releaseBtn = document.getElementById("releaseBtn");
const status = document.getElementById("status");

async function checkStatus() {
  const res = await fetch("/api/claim");
  const data = await res.json();

  if (data.taken) {
    status.textContent = `Машина занята пользователем: ${data.user}`;
  } else {
    status.textContent = "Машина свободна";
  }
}

claimBtn.addEventListener("click", async () => {
  const user = usernameInput.value.trim();
  if (!user) return alert("Укажи ник!");

  const res = await fetch("/api/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user }),
  });

  const data = await res.json();
  if (data.success) {
    status.textContent = "Ты взял машину!";
  } else {
    alert(data.error);
  }

  checkStatus();
});

releaseBtn.addEventListener("click", async () => {
  const user = usernameInput.value.trim();
  if (!user) return alert("Укажи ник!");

  const res = await fetch("/api/release", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user }),
  });

  const data = await res.json();
  if (data.success) {
    status.textContent = "Ты отказался от машины.";
  } else {
    alert(data.error);
  }

  checkStatus();
});

setInterval(checkStatus, 3000);
checkStatus();
function updateStatus() {
  fetch("/api/claim")
    .then(res => res.json())
    .then(data => {
      document.getElementById("status").textContent = data.taken 
        ? `Машина занята: ${data.user}` 
        : "Машина свободна";
    })
    .catch(() => {
      document.getElementById("status").textContent = "Ошибка соединения";
    });
}

// Вызываем сразу и потом повторно
updateStatus();
setInterval(updateStatus, 1000);
