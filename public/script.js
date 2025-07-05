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
