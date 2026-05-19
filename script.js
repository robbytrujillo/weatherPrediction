let currentWeather = {};
let historyLimit = 3;

document.addEventListener("DOMContentLoaded", () => {
  getLocation();
  loadHistory();
});

function getLocation() {
  if (!navigator.geolocation) {
    alert("Browser tidak mendukung Geolocation");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      localStorage.setItem("userLat", lat);
      localStorage.setItem("userLon", lon);

      fetchWeather(lat, lon);
      fetchLocationName(lat, lon);
    },
    (error) => {
      console.log(error);
      document.getElementById("location").innerText = "Gagal mengambil lokasi";
    },
  );
}

async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m&forecast_days=1&timezone=auto`;

    const response = await fetch(url);
    const data = await response.json();

    // suhu sekarang
    const temp = Math.round(data.current.temperature_2m);

    // kode cuaca
    const code = data.current.weather_code;

    // kondisi cuaca
    const condition = getWeatherCondition(code);

    // simpan ke object global
    currentWeather = { temp, condition };

    // tampilkan suhu
    document.getElementById("temperature").innerText = `${temp}°C`;

    // tampilkan kondisi
    document.getElementById("condition").innerText = condition;

    // forecast
    const forecastGrid = document.getElementById("forecastGrid");

    forecastGrid.innerHTML = "";

    // jam sekarang
    const now = new Date();
    const currentHour = now.getHours();

    // cari jam sekarang di API
    let currentIndex = data.hourly.time.findIndex((time) => {
      return new Date(time).getHours() === currentHour;
    });

    // fallback jika tidak ditemukan
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    // tampilkan 3 jam ke depan
    for (
      let i = currentIndex;
      i < currentIndex + 3 && i < data.hourly.time.length;
      i++
    ) {
      const hour = new Date(data.hourly.time[i]).getHours();

      const t = Math.round(data.hourly.temperature_2m[i]);

      // label sekarang
      const label = hour === currentHour ? "Sekarang" : `${hour}:00`;

      forecastGrid.innerHTML += `
        <div class="forecast-item">
          <strong>${label}</strong><br>
          ${t}°C
        </div>
      `;
    }
  } catch (error) {
    console.log(error);

    document.getElementById("condition").innerText =
      "Gagal mengambil data cuaca";
  }
}

async function fetchLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    );

    const data = await response.json();

    document.getElementById("location").innerText =
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.county ||
      "Lokasi Anda";
  } catch (error) {
    console.log(error);

    document.getElementById("location").innerText = "Lokasi tidak ditemukan";
  }
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
    message =
      `Cuaca sedang hujan. Sebaiknya ` +
      `tunda aktivitas ${activity} ` +
      `atau bawa payung.`;
  } else if (currentWeather.temp > 32) {
    message =
      `Cuaca panas (${currentWeather.temp}°C). ` +
      `Gunakan pelindung saat ${activity}.`;
  } else {
    message = `Cuaca ${currentWeather.condition}. ` + `Aman untuk ${activity}.`;
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

  historyList.innerHTML = "";

  if (!history.length) {
    historyList.innerHTML = "<p>Belum ada aktivitas.</p>";

    return;
  }

  // tampilkan sesuai limit
  const visibleHistory = history.slice(0, historyLimit);

  visibleHistory.forEach((item) => {
    historyList.innerHTML += `
      <div class="history-item">
        <strong>${item.activity}</strong><br>
        ${item.recommendation}<br>
        <small>${item.time}</small>
      </div>
    `;
  });

  // tombol load more
  if (history.length > historyLimit) {
    historyList.innerHTML += `
      <button
        class="load-more-btn"
        onclick="loadMoreHistory()"
      >
        Load More
      </button>
    `;
  }
}

function loadMoreHistory() {
  historyLimit += 3;

  loadHistory();
}
