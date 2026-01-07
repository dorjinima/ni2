// ============================
// Sidebar Navigation + Refresh
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const sidebarItems = document.querySelectorAll(".sidebar ul li");

  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      let sectionId = item.getAttribute("data-section");

      // If no data-section, try extracting from onclick attribute
      if (!sectionId) {
        const onclickAttr = item.getAttribute("onclick");
        if (onclickAttr) {
          const match = onclickAttr.match(/\(['"]([^'"]+)['"]\)/);
          if (match) {
            sectionId = match[1];
          }
        }
      }

      if (!sectionId) return;

      const target = document.getElementById(sectionId);

      // If already active, refresh the section
      if (target && target.classList.contains("active")) {
        refreshSection(sectionId);
      } else {
        requestPinAndShow(sectionId);
      }
    });
  });
});

// Show a section and update sidebar active state
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((sec) => {
    sec.classList.remove("active");
    sec.style.display = "none";
  });

  // Show target section
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

  // Update active state in sidebar
  document.querySelectorAll(".sidebar ul li").forEach((item) => {
    const isActive =
      item.getAttribute("data-section") === sectionId ||
      (item.getAttribute("onclick") &&
        item.getAttribute("onclick").includes(`'${sectionId}'`));

    item.classList.toggle("active", isActive);
  });
}

// Wrapper for PIN-secured sections
function requestPinAndShow(sectionId) {
  showSection(sectionId);
}

// Refresh a section when clicked again
function refreshSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target) return;

  target.style.display = "none";
  setTimeout(() => {
    target.style.display = "block";
  }, 150);
}

//login js//
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
  const confirmLogout = confirm("Are you sure you want to log out?");
  if (confirmLogout) {
    localStorage.removeItem("currentUser");

    window.location.href = "index.html";
  }
});

const quotes = [
  "Failure is a great teacher.",
  "Be persistent and never give up hope.",
  "Why dwell on negativity?",
  "If you don't have any shadows, you're not in the light.",
  "You are absolutely unique, just like everyone else.",
  "You don't always need a plan; just breathe and see what happens.",
  "To keep your balance in life, you must keep moving.",
  "Nothing is impossible. The word says 'I'm possible!'",
  "Life doesn't have to be perfect to be wonderful.",
  "In dark moments, focus to see the light.",
  "Don't take yourself too seriously; learn to laugh at obstacles.",
  "Keep your face to the sunshine and shadows will fall behind.",
  "I'm not knocking on old doors; I'll create my own.",
  "Stand up and go, and life will open up for you.",
  "Once you face your fear, nothing is as hard as you think.",
  "Ask, 'What's the worst that can happen?' then push further.",
  "Dreams don't come true just by dreaming; hard work makes them happen.",
  "Let us make our future now.",
  "Believe you can and you're halfway there.",
  "Every day is a new beginning.",
  "Success is not final, failure is not fatal",
  "Happiness depends upon ourselves.",
  "Don't watch the clock; do what it does. Keep going.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
];

function updateClock() {
  const now = new Date();

  // --- DIGITAL CLOCK + DAY + DATE ---
  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("day").textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
  });
  document.getElementById("date").textContent = now.toLocaleDateString(
    "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  // --- GREETING ---//
  const hour = now.getHours();
  let greeting = "";
  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }
  document.getElementById("greeting").textContent = `${greeting},`;
  const dayIndex = now.getDay();
  document.getElementById("quote").textContent =
    quotes[dayIndex % quotes.length];

  // --- ANALOG CLOCK ---//
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  document.querySelector(
    ".hand.second"
  ).style.transform = `rotate(${secondDeg}deg)`;
  document.querySelector(
    ".hand.minute"
  ).style.transform = `rotate(${minuteDeg}deg)`;
  document.querySelector(
    ".hand.hour"
  ).style.transform = `rotate(${hourDeg}deg)`;
}

updateClock();
setInterval(updateClock, 1000);
// Bar Chart
const barCtx = document.getElementById("barChart").getContext("2d");
const barChart = new Chart(barCtx, {
  type: "bar",
  data: {
    labels: ["Guide", "Vehicle", "PP-Photo", "DOCS"],
    datasets: [
      {
        label: "Groups Running",
        data: [12, 19, 3, 5, 2],
        backgroundColor: "#4e73df",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  },
});

// Pie Chart
const pieCtx = document.getElementById("pieChart").getContext("2d");
const pieChart = new Chart(pieCtx, {
  type: "pie",
  data: {
    labels: ["Pending", "Verify", "Approved"],
    datasets: [
      {
        data: [9, 5, 3],
        backgroundColor: ["#228B22", "#1cc88a", "#f6c23e"],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
});
