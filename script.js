let currentWeather = {};

document.addEventListener("DOMContentLoaded", () => {
  getLocation();
  loadHistory();
});

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      localStorage.setItem("userLat", lat);
      localStorage.setItem("userLon", lon);

      fetchWeather(lat, lon);
      fetchLocationName(lat, lon);
    });
  }
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m&forecast_days=1&timezone=auto`;

  const response = await fetch(url);
  const data = await response.json();

  // const temp = data.current.temperature_2m;
  const temp = Math.round(data.current.temperature_2m);
  const code = data.current.weather_code;
  const condition = getWeatherCondition(code);

  currentWeather = { temp, condition };

  document.getElementById("temperature").innerText = `${temp}°C`;
  document.getElementById("condition").innerText = condition;

  const forecastGrid = document.getElementById("forecastGrid");
  forecastGrid.innerHTML = "";

  for (let i = 1; i <= 3; i++) {
    const hour = new Date(data.hourly.time[i]).getHours();
    // const t = data.hourly.temperature_2m[i];
    const t = Math.round(data.hourly.temperature_2m[i]);

    forecastGrid.innerHTML += `
      <div class="forecast-item">
        <strong>${hour}:00</strong><br>${t}°C
      </div>
    `;
  }
}

async function fetchLocationName(lat, lon) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
  );

  const data = await response.json();

  document.getElementById("location").innerText =
    data.address.city ||
    data.address.town ||
    data.address.village ||
    "Lokasi Anda";
}

function getWeatherCondition(code) {
  if (code <= 1) return "Cerah";
  if (code <= 3) return "Berawan";
  if (code <= 55) return "Gerimis";
  if (code <= 65) return "Hujan";
  return "Cuaca Buruk";
}

function checkRecommendation() {
  const activity = document.getElementById("activitySelect").value;
  const box = document.getElementById("recommendationBox");

  let message = "";

  if (currentWeather.condition.includes("Hujan")) {
    message = `Cuaca sedang hujan. Sebaiknya tunda aktivitas ${activity} atau bawa payung.`;
  } else if (currentWeather.temp > 32) {
    message = `Cuaca panas (${currentWeather.temp}°C). Gunakan pelindung saat ${activity}.`;
  } else {
    message = `Cuaca ${currentWeather.condition}. Aman untuk ${activity}.`;
  }

  box.innerText = message;

  saveHistory(activity, message);
}

function saveHistory(activity, recommendation) {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  history.unshift({
    activity,
    recommendation,
    time: new Date().toLocaleString("id-ID"),
  });

  localStorage.setItem("weatherHistory", JSON.stringify(history.slice(0, 5)));

  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  const historyList = document.getElementById("historyList");

  if (!history.length) {
    historyList.innerHTML = "Belum ada aktivitas.";
    return;
  }

  historyList.innerHTML = history
    .map(
      (item) => `
      <div class="history-item">
        <strong>${item.activity}</strong><br>
        ${item.recommendation}<br>
        <small>${item.time}</small>
      </div>
    `,
    )
    .join("");
}
