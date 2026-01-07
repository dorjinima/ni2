/* ---------- DOM references ---------- */
const hotelBtn = document.getElementById("hotelBtn");
const hotelForm = document.getElementById("hotelForm");
const hotelTableBody = document.getElementById("hotelTableBody");
const cancelBtn = hotelForm?.querySelector(".search-btn6");
const saveBtn = hotelForm?.querySelector(".add-btn6");
const rateTablesContainer = document.getElementById("rateTablesContainer");
const prevBtn = document.getElementById("prevHotelPageBtn");
const nextBtn = document.getElementById("nextHotelPageBtn");
const searchInput = document.getElementById("searchHotel");
const addTableBtn = document.getElementById("addTableBtn");
const yearSelectEl = document.getElementById("yearSelect");
const currentPageSpan = document.getElementById("currentPage");
const totalPagesSpan = document.getElementById("totalPages");

/* ---------- Config ---------- */
const HOTELS_PER_PAGE = 10;
const API_BASE =
  (window.API_BASE && String(window.API_BASE).replace(/\/+$/, "")) ||
  (location.hostname
    ? `${location.protocol}//${location.hostname}:3000`
    : location.origin);
console.info("Using API_BASE =", API_BASE);

/* ---------- State ---------- */
let currentPage = 1;
let editingHotelIndex = null;
let touristTypeTables = {};
let _yearSyncInProgress = false;
let currentSelectedYear = null;
let isEditMode = false;
let activeYearChip = null;

/* ---------- Utility Functions ---------- */
function el(sel, ctx = document) {
  return (ctx || document).querySelector(sel);
}
function els(sel, ctx = document) {
  return Array.from((ctx || document).querySelectorAll(sel) || []);
}
function safeAddEvent(node, event, handler) {
  if (!node) return;
  node.addEventListener(event, handler);
}
function capitalizeFirstLetter(str) {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function capitalizeWords(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/* ---------- Rate Removal Styles ---------- */
function addRateRemoveStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .rate-remove-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: background-color 0.3s ease;
    }
    .rate-remove-btn:hover {
      background: #ff0000;
    }
    .rate-entry-block {
      position: relative;
    }
    .tourist-type-tab-container {
      position: relative;
      display: inline-block;
    }
    .type-remove-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ff8800;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: background-color 0.3s ease;
    }
    .type-remove-btn:hover {
      background: #ff5500;
    }
  `;
  document.head.appendChild(style);
}

/* ---------- API Helper ---------- */
async function apiFetch(path, opts = {}) {
  const url =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(bodyText || `HTTP ${res.status}`);
    }
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  } catch (err) {
    console.error("API error:", err, "url:", url);
    throw err;
  }
}

/* ---------- Data Synchronization ---------- */
async function fetchAndSyncHotels() {
  try {
    const res = await apiFetch("/api/hotels?limit=0");
    let arr = [];
    if (!res) arr = [];
    else if (Array.isArray(res)) arr = res;
    else if (res.data && Array.isArray(res.data)) arr = res.data;
    else if (res.total !== undefined && Array.isArray(res.data)) arr = res.data;
    else arr = Array.isArray(res) ? res : [];
    localStorage.setItem("hotels", JSON.stringify(arr || []));
    return arr;
  } catch (err) {
    console.error("Failed to fetch hotels from server:", err);
    return JSON.parse(localStorage.getItem("hotels") || "[]");
  }
}

/* ---------- UI Helpers ---------- */
function toggleHotelsTable(show) {
  let tableEl = null;
  if (hotelTableBody) tableEl = hotelTableBody.closest("table");
  tableEl =
    tableEl ||
    document.getElementById("hotelTable") ||
    document.getElementById("hotelsTable") ||
    document.getElementById("hotelTableContainer") ||
    document.getElementById("hotelList");

  if (!tableEl) return;
  if (!tableEl.dataset._origDisplay) {
    const d = getComputedStyle(tableEl).display || "block";
    tableEl.dataset._origDisplay = d === "table" || d === "block" ? d : "table";
  }
  tableEl.style.display = show ? tableEl.dataset._origDisplay : "none";
}

function showTempMessage(message, type = "info") {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${
      type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"
    };
    color: white;
    border-radius: 4px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-size: 14px;
  `;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

/* ---------- Date Handling ---------- */
function parseDateString(dstr) {
  if (!dstr) return null;
  const s = String(dstr).trim();

  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;

  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    const dt = new Date(year, month, day);
    if (!isNaN(dt.getTime())) return dt;
  }

  const dmy2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmy2) {
    const day = parseInt(dmy2[1], 10);
    const month = parseInt(dmy2[2], 10) - 1;
    const yy = parseInt(dmy2[3], 10);
    const year = yy > 50 ? 1900 + yy : 2000 + yy;
    const dt = new Date(year, month, day);
    if (!isNaN(dt.getTime())) return dt;
  }

  const dmmm = s.match(/^(\d{1,2})[\/\-]([a-zA-Z]{3})[\/\-](\d{2})$/);
  if (dmmm) {
    const day = parseInt(dmmm[1], 10);
    const monthName = dmmm[2].toLowerCase();
    const yy = parseInt(dmmm[3], 10);
    const monthMap = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    if (monthMap.hasOwnProperty(monthName)) {
      const month = monthMap[monthName];
      const year = yy > 50 ? 1900 + yy : 2000 + yy;
      const dt = new Date(year, month, day);
      if (!isNaN(dt.getTime())) return dt;
    }
  }
  return null;
}

function formatDate(date) {
  if (!date) return "";
  if (!(date instanceof Date)) date = parseDateString(date);
  if (!date || isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const yy = String(year).slice(-2);
  return `${day}-${month}-${yy}`;
}

function formatDateToDDMMYY(input) {
  if (!input) return "";
  let d = input instanceof Date ? input : parseDateString(input);
  if (!d || isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  const yy = String(year).slice(-2);
  return `${day}-${month}-${yy}`;
}

function parseDDMMYYToISO(s) {
  if (!s) return "";
  const dt = parseDateString(s);
  if (dt) {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  return "";
}

function getDateInputISO(selector) {
  const inp = el(selector);
  if (!inp) return "";
  if (inp.dataset && inp.dataset.iso) return inp.dataset.iso;
  if (inp.type === "date" && inp.value) return inp.value;
  const iso = parseDDMMYYToISO(inp.value || "");
  return iso || inp.value || "";
}

function attachDualDateInputBehavior(selector) {
  const inp = el(selector);
  if (!inp) return;
  if (inp.value && inp.type === "date") {
    inp.dataset.iso = inp.value;
    const fmt = formatDateToDDMMYY(inp.dataset.iso);
    try {
      inp.type = "text";
      inp.value = fmt;
    } catch {}
  }
  safeAddEvent(inp, "focus", () => {
    try {
      inp.type = "date";
      if (inp.dataset && inp.dataset.iso) inp.value = inp.dataset.iso;
      else {
        const iso = parseDDMMYYToISO(inp.value);
        if (iso) inp.value = iso;
      }
    } catch {}
  });
  safeAddEvent(inp, "change", () => {
    const iso = inp.value || "";
    if (!iso) {
      inp.dataset.iso = "";
      return;
    }
    inp.dataset.iso = iso;
    const formatted = formatDateToDDMMYY(iso);
    try {
      inp.type = "text";
      inp.value = formatted;
    } catch {}
  });
  safeAddEvent(inp, "blur", () => {
    if (inp.dataset && inp.dataset.iso) {
      const formatted = formatDateToDDMMYY(inp.dataset.iso);
      try {
        inp.type = "text";
        inp.value = formatted;
      } catch {}
      return;
    }
    const maybeISO = parseDDMMYYToISO(inp.value || "");
    if (maybeISO) {
      inp.dataset.iso = maybeISO;
      const formatted = formatDateToDDMMYY(maybeISO);
      try {
        inp.type = "text";
        inp.value = formatted;
      } catch {}
    }
  });
}
attachDualDateInputBehavior("#rateFrom");
attachDualDateInputBehavior("#rateTo");

/* ---------- Clone Container Management ---------- */
function setupClone(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.children.length === 0) {
    const wrapper = document.createElement("div");
    wrapper.className = "qty-room-wrapper2";

    if (containerId === "roomTypesContainer2") {
      wrapper.innerHTML = `
        <input type="text" placeholder="Room Type">
        <input type="number" placeholder="Qty" value="0">
        <button type="button" class="remove-room-btn">-</button>
        <button type="button" class="add-room-btn">+</button>
      `;
    } else if (containerId === "deptEmailContainer") {
      wrapper.innerHTML = `
        <input type="text" placeholder="Department">
        <input type="text" placeholder="Email">
        <button type="button" class="remove-room-btn">-</button>
        <button type="button" class="add-room-btn">+</button>
      `;
    } else if (containerId === "deptPhoneContainer") {
      wrapper.innerHTML = `
        <input type="text" placeholder="Department">
        <input type="text" placeholder="Phone">
        <button type="button" class="remove-room-btn">-</button>
        <button type="button" class="add-room-btn">+</button>
      `;
    }
    container.appendChild(wrapper);
  }

  const wrapperClass = container.querySelector(".qty-room-wrapper2")
    ? ".qty-room-wrapper2"
    : ".qty-room-wrapper";

  function updateRemoveBtns() {
    const wrappers = container.querySelectorAll(wrapperClass);
    wrappers.forEach((wrap) => {
      const rem = wrap.querySelector(".remove-room-btn");
      if (rem) rem.disabled = wrappers.length <= 1;
    });
  }

  function removeItemHandler(e) {
    const wrappers = container.querySelectorAll(wrapperClass);
    if (wrappers.length > 1) {
      e.target.closest(wrapperClass)?.remove();
      updateRemoveBtns();
    } else {
      const first = container.querySelector(wrapperClass);
      if (first) {
        els("input", first).forEach((i) => {
          i.value = i.type === "number" ? "0" : "";
        });
      }
    }
  }

  function addItemHandler() {
    const first = container.querySelector(wrapperClass);
    if (!first) return;
    const clone = first.cloneNode(true);

    els("input", clone).forEach((i) => {
      i.value = i.type === "number" ? "0" : "";
    });

    // Rebind fresh listeners to cloned buttons
    const rem = clone.querySelector(".remove-room-btn");
    const add = clone.querySelector(".add-room-btn");
    if (rem) {
      const remClone = rem.cloneNode(true);
      rem.replaceWith(remClone);
      remClone.addEventListener("click", removeItemHandler);
    }
    if (add) {
      const addClone = add.cloneNode(true);
      add.replaceWith(addClone);
      addClone.addEventListener("click", addItemHandler);
    }

    container.appendChild(clone);
    updateRemoveBtns();
  }

  // Rebind existing buttons cleanly
  els(".remove-room-btn", container).forEach((btn) => {
    const nb = btn.cloneNode(true);
    btn.replaceWith(nb);
    nb.addEventListener("click", removeItemHandler);
  });
  els(".add-room-btn", container).forEach((btn) => {
    const nb = btn.cloneNode(true);
    btn.replaceWith(nb);
    nb.addEventListener("click", addItemHandler);
  });

  updateRemoveBtns();
}

function resetCloneContainer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.children.length === 0) {
    setupClone(containerId);
    return;
  }

  const wrapperClass = container.querySelector(".qty-room-wrapper2")
    ? ".qty-room-wrapper2"
    : ".qty-room-wrapper";
  const wrappers = Array.from(container.querySelectorAll(wrapperClass));

  while (wrappers.length > 1) {
    wrappers.pop().remove();
  }

  const first = container.querySelector(wrapperClass);
  if (first) {
    els("input", first).forEach((i) => {
      i.value = i.type === "number" ? "0" : "";
    });
  }
  setupClone(containerId);
}

["deptEmailContainer", "deptPhoneContainer", "roomTypesContainer2"].forEach(
  setupClone
);

/* ---------- Format Department Data for Table ---------- */
function formatDeptDataForTable(data) {
  if (!data) return "";
  const parts = data.split(",");
  let result = "";
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1]) {
      if (result) result += "<br>";
      result += `${parts[i].trim()}: ${parts[i + 1].trim()}`;
    }
  }
  return result;
}

/* ---------- LocalStorage Helpers ---------- */
function getHotels() {
  return JSON.parse(localStorage.getItem("hotels") || "[]");
}
function saveHotelsToLocal(hotels) {
  localStorage.setItem("hotels", JSON.stringify(hotels || []));
}

/* ---------- Delete Hotel Function ---------- */
async function deleteHotel(hotel, index) {
  if (
    !confirm(
      `Are you sure you want to delete "${hotel.hotelName}"? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    const hotels = getHotels();
    const targetId = hotels[index]?._id || hotels[index]?.id || null;

    if (targetId) {
      await apiFetch(`/api/hotels/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
    }

    hotels.splice(index, 1);
    saveHotelsToLocal(hotels);
    await fetchAndSyncHotels();
    renderHotels();
    showTempMessage("Hotel deleted successfully!", "success");
  } catch (err) {
    console.error("Error deleting hotel:", err);
    try {
      const hotels = getHotels();
      hotels.splice(index, 1);
      saveHotelsToLocal(hotels);
      renderHotels();
      showTempMessage("Hotel deleted locally (server error)", "info");
    } catch (fallbackErr) {
      console.error("Fallback deletion failed:", fallbackErr);
      alert("Failed to delete hotel. Please check console for details.");
    }
  }
}

/* ---------- Rate Management ---------- */
function findEntryIndexByDate(year, type, from, to) {
  if (!touristTypeTables[year] || !Array.isArray(touristTypeTables[year][type]))
    return -1;
  return touristTypeTables[year][type].findIndex(
    (e) => e.from === from && e.to === to
  );
}

function mergeRoomsIntoEntry(entry, newRooms) {
  if (!entry || !Array.isArray(entry.rooms)) {
    entry.rooms = newRooms.map((r) => ({
      rt: r.rt,
      qty: parseInt(r.qty || 0, 10) || 0,
      ep: r.ep ? { ...r.ep } : {},
      cp: r.cp ? { ...r.cp } : {},
      map: r.map ? { ...r.map } : {},
      ap: r.ap ? { ...r.ap } : {},
    }));
    return;
  }

  newRooms.forEach((nr) => {
    const existingIdx = entry.rooms.findIndex((r) => r.rt === nr.rt);
    const normalized = {
      rt: nr.rt,
      qty: parseInt(nr.qty || 0, 10) || 0,
      ep: nr.ep ? { ...nr.ep } : {},
      cp: nr.cp ? { ...nr.cp } : {},
      map: nr.map ? { ...nr.map } : {},
      ap: nr.ap ? { ...nr.ap } : {},
    };
    if (existingIdx !== -1) {
      entry.rooms[existingIdx] = normalized;
    } else {
      entry.rooms.push(normalized);
    }
  });
}

/* ---------- Rate Entry Removal ---------- */
function removeRateEntry(year, type, entryIdx) {
  if (
    !confirm(
      "Are you sure you want to remove this rate entry? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    if (!touristTypeTables[year] || !touristTypeTables[year][type]) {
      showTempMessage("Rate entry not found.", "error");
      return;
    }

    // Remove the specific entry
    touristTypeTables[year][type].splice(entryIdx, 1);

    // If this was the last entry for this type, remove the type entirely
    if (touristTypeTables[year][type].length === 0) {
      delete touristTypeTables[year][type];
    }

    // If this was the last type for this year, remove the year entirely
    if (Object.keys(touristTypeTables[year]).length === 0) {
      delete touristTypeTables[year];
    }

    // Re-render the rate tables for the current year
    if (currentSelectedYear === year) {
      renderGroupedTypeTabsForYear(year);
      updateYearDisplay(year);
    }

    showTempMessage("Rate entry removed successfully!", "success");
  } catch (err) {
    console.error("Error removing rate entry:", err);
    showTempMessage("Failed to remove rate entry.", "error");
  }
}

/* ---------- Tourist Type Removal ---------- */
function removeTouristType(year, type) {
  if (
    !confirm(
      `Are you sure you want to remove all rate entries for "${type}" in ${year}? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    if (touristTypeTables[year] && touristTypeTables[year][type]) {
      delete touristTypeTables[year][type];

      // If this was the last type for this year, remove the year entirely
      if (Object.keys(touristTypeTables[year]).length === 0) {
        delete touristTypeTables[year];
      }

      // Re-render the rate tables for the current year
      if (currentSelectedYear === year) {
        renderGroupedTypeTabsForYear(year);
        updateYearDisplay(year);
      }

      showTempMessage(
        `Tourist type "${type}" removed successfully!`,
        "success"
      );
    }
  } catch (err) {
    console.error("Error removing tourist type:", err);
    showTempMessage("Failed to remove tourist type.", "error");
  }
}

/* ---------- Year Selection System ---------- */
function populateYearSelect(select) {
  if (!select) return;
  const placeholder = select.querySelector('option[value=""]') ?? null;
  select.innerHTML = "";
  if (placeholder) select.appendChild(placeholder);

  const START = 2025;
  const END = 2055;

  for (let y = START; y <= END; y++) {
    const o = document.createElement("option");
    o.value = String(y);

    const hasData =
      touristTypeTables[y] && Object.keys(touristTypeTables[y]).length > 0;
    o.textContent = hasData ? `${y} 📊` : String(y);
    o.dataset.hasData = hasData;

    if (hasData) {
      o.style.fontWeight = "bold";
      o.style.color = "#2E7D32";
    }
    select.appendChild(o);
  }
  if (select.querySelector('option[value=""]')) select.value = "";
}

function createYearChip(year) {
  const hasData =
    touristTypeTables[year] && Object.keys(touristTypeTables[year]).length > 0;

  const chip = document.createElement("span");
  chip.className = "year-chip";
  chip.dataset.year = String(year);
  chip.dataset.hasData = hasData;

  chip.textContent = hasData ? `${year} 📊` : String(year);
  chip.style.cssText = `
    display: inline-block;
    padding: 6px 12px;
    margin: 4px;
    background: ${hasData ? "#2E7D32" : "#4CAF50"};
    color: white;
    border-radius: 16px;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
    border: ${hasData ? "2px solid #1B5E20" : "none"};
    font-weight: ${hasData ? "bold" : "normal"};
  `;

  chip.addEventListener("mouseenter", () => {
    if (chip.style.background !== "#9C27B0") {
      chip.style.background = hasData ? "#7B1FA2" : "#AB47BC";
    }
    chip.style.transform = "scale(1.05)";
  });

  chip.addEventListener("mouseleave", () => {
    if (chip.style.background !== "#9C27B0") {
      chip.style.background = hasData ? "#2E7D32" : "#4CAF50";
    }
    chip.style.transform = "scale(1)";
  });

  return chip;
}

function insertAfter(newNode, refNode) {
  if (!refNode || !refNode.parentNode) return;
  if (refNode.nextSibling)
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
  else refNode.parentNode.appendChild(newNode);
}

function applyYearSelectHandlers(select) {
  if (!select) return;

  const rateControlElements = [
    "#roomTypesContainer2",
    "#touristType",
    "#remarks",
    "#currency",
    "#rateFrom",
    "#rateTo",
    "#addTableBtn",
    ".rate-controls",
    "#rateTablesContainer",
  ];

  function toggleRateControls(show, year) {
    rateControlElements.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (show) {
          if (element.dataset._origDisplay) {
            element.style.display = element.dataset._origDisplay;
          } else {
            element.style.display = "";
          }
          element
            .querySelectorAll("input, select, textarea, button")
            .forEach((el) => {
              el.disabled = false;
            });
        } else {
          if (!element.dataset._origDisplay) {
            element.dataset._origDisplay = getComputedStyle(element).display;
          }
          element.style.display = "none";
          element
            .querySelectorAll("input, select, textarea, button")
            .forEach((el) => {
              el.disabled = true;
            });
        }
      });
    });

    const roomWrappers = document.querySelectorAll(
      "#roomTypesContainer2 .qty-room-wrapper2, #roomTypesContainer2 .qty-room-wrapper"
    );
    roomWrappers.forEach((wrapper) => {
      wrapper.querySelectorAll("input, button, select").forEach((element) => {
        element.style.display = show ? "" : "none";
        element.disabled = !show;
      });
    });

    if (show && year) {
      if (currentSelectedYear !== year) {
        clearRateForm();
      }
      renderGroupedTypeTabsForYear(year);
    } else {
      rateTablesContainer.innerHTML =
        "<p>Select a year and click the year chip to view rate data.</p>";
    }
  }

  toggleRateControls(false);

  select.addEventListener("change", () => {
    if (_yearSyncInProgress) return;

    const selectedYear = String(select.value || "").trim();
    if (selectedYear) {
      _yearSyncInProgress = true;
      currentSelectedYear = selectedYear;

      if (!touristTypeTables[selectedYear]) {
        touristTypeTables[selectedYear] = {};
      }

      document.querySelectorAll("select[id^='yearSelect']").forEach((other) => {
        if (other === select) return;
        if (other.value !== selectedYear) {
          other.value = selectedYear;
          const evt = new Event("change", { bubbles: true });
          other.dispatchEvent(evt);
        }
      });

      try {
        document
          .querySelectorAll(".year-chip")
          .forEach((chip) => chip.remove());
        const chip = createYearChip(selectedYear);
        insertAfter(chip, select);
        activeYearChip = chip;

        if (isEditMode) {
          toggleRateControls(true, selectedYear);
          chip.style.background = "#9C27B0";
        } else {
          chip.addEventListener("click", () => {
            document.querySelectorAll(".year-chip").forEach((c) => {
              const hasData = c.dataset.hasData === "true";
              c.style.background = hasData ? "#2E7D32" : "#4CAF50";
            });
            toggleRateControls(true, selectedYear);
            chip.style.background = "#9C27B0";
            activeYearChip = chip;
          });
        }
      } catch (err) {
        console.error("Error creating year chip:", err);
      }

      _yearSyncInProgress = false;
    } else {
      currentSelectedYear = null;
      toggleRateControls(false);
      activeYearChip = null;
    }
  });

  select.toggleRateControls = toggleRateControls;
  select.getCurrentYear = () => currentSelectedYear;
  select.getActiveChip = () => activeYearChip;
}

function initializeYearSelects() {
  document.querySelectorAll("select[id^='yearSelect']").forEach((sel) => {
    if (!sel.dataset.initialized) {
      populateYearSelect(sel);
      applyYearSelectHandlers(sel);
      sel.dataset.initialized = "true";
    }
  });
}
initializeYearSelects();

const yearObserver = new MutationObserver((mutations) => {
  mutations.forEach((m) => {
    m.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        const newYearSelects =
          node.querySelectorAll?.("select[id^='yearSelect']") || [];
        newYearSelects.forEach((sel) => {
          if (!sel.dataset.initialized || sel.dataset.initialized === "false") {
            populateYearSelect(sel);
            applyYearSelectHandlers(sel);
            sel.dataset.initialized = "true";
          }
        });
        if (
          node.matches &&
          node.matches("select[id^='yearSelect']") &&
          (!node.dataset.initialized || node.dataset.initialized === "false")
        ) {
          populateYearSelect(node);
          applyYearSelectHandlers(node);
          node.dataset.initialized = "true";
        }
      }
    });
  });
});
yearObserver.observe(document.body, { childList: true, subtree: true });

/* ---------- Rate Table Management ---------- */
if (addTableBtn) {
  addTableBtn.type = "button";
  addTableBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const year = currentSelectedYear;
    if (!year) {
      alert("Please select a year first.");
      return;
    }

    const type = (el("#touristType")?.value || "").trim();
    const from = getDateInputISO("#rateFrom") || "";
    const to = getDateInputISO("#rateTo") || "";
    const remarks = (el("#remarks")?.value || "").trim();
    const currency = el("#currency")?.value || "";

    const rooms = Array.from(
      document.querySelectorAll("#roomTypesContainer2 .qty-room-wrapper2")
    )
      .map((wrap) => {
        const rt = wrap.querySelector('input[type="text"]')?.value.trim() || "";
        const qtyRaw = wrap.querySelector('input[type="number"]')?.value || "0";
        const qty = parseInt(qtyRaw, 10) || 0;
        return rt && qty > 0
          ? { rt, qty, ep: {}, cp: {}, map: {}, ap: {} }
          : null;
      })
      .filter(Boolean);

    if (!type || !from || !to || !currency || rooms.length === 0) {
      alert(
        "Please fill all fields and add at least one room type with quantity > 0."
      );
      return;
    }

    if (!touristTypeTables[year]) touristTypeTables[year] = {};
    if (!Array.isArray(touristTypeTables[year][type]))
      touristTypeTables[year][type] = [];

    const idx = findEntryIndexByDate(year, type, from, to);
    if (idx !== -1) {
      mergeRoomsIntoEntry(touristTypeTables[year][type][idx], rooms);
      touristTypeTables[year][type][idx].remarks = remarks;
      touristTypeTables[year][type][idx].currency = currency;
    } else {
      touristTypeTables[year][type].push({
        from,
        to,
        remarks,
        currency,
        rooms,
      });
    }

    renderGroupedTypeTabsForYear(year);
    showTempMessage("Rate table added successfully!", "success");
    updateYearDisplay(year);
    clearRateForm();
  });
}

function updateYearDisplay(year) {
  const hasData =
    touristTypeTables[year] && Object.keys(touristTypeTables[year]).length > 0;

  const ysel = document.getElementById("yearSelect");
  if (ysel) {
    const option = ysel.querySelector(`option[value="${year}"]`);
    if (option) {
      option.textContent = hasData ? `${year} 📊` : String(year);
      option.dataset.hasData = hasData;
      option.style.fontWeight = hasData ? "bold" : "normal";
      option.style.color = hasData ? "#2E7D32" : "";
    }
  }

  const chip = document.querySelector(`.year-chip[data-year="${year}"]`);
  if (chip) {
    chip.textContent = hasData ? `${year} 📊` : String(year);
    chip.dataset.hasData = hasData;
    chip.style.background = hasData ? "#2E7D32" : "#4CAF50";
    chip.style.border = hasData ? "2px solid #1B5E20" : "none";
    chip.style.fontWeight = hasData ? "bold" : "normal";

    // If no data and we're not in edit mode, maybe hide the rate controls
    if (!hasData && !isEditMode && currentSelectedYear === year) {
      const ysel = document.getElementById("yearSelect");
      if (ysel && ysel.toggleRateControls) {
        ysel.toggleRateControls(false);
      }
    }
  }
}

function clearRateForm() {
  const touristType = el("#touristType");
  if (touristType) touristType.value = "";

  const remarks = el("#remarks");
  if (remarks) remarks.value = "";

  const currency = el("#currency");
  if (currency) currency.value = "";

  const rateFrom = el("#rateFrom");
  if (rateFrom) {
    rateFrom.value = "";
    rateFrom.dataset.iso = "";
  }
  const rateTo = el("#rateTo");
  if (rateTo) {
    rateTo.value = "";
    rateTo.dataset.iso = "";
  }
}

function renderGroupedTypeTabsForYear(year, activeTypeHint = null) {
  if (!rateTablesContainer) return;

  const yearData = touristTypeTables[year];
  if (!yearData) {
    rateTablesContainer.innerHTML = `<p>No rate data for ${year}. Add rate tables using the form above.</p>`;
    return;
  }

  rateTablesContainer.innerHTML = "";

  const types = Object.keys(yearData).filter(
    (t) => Array.isArray(yearData[t]) && yearData[t].length > 0
  );
  if (types.length === 0) {
    rateTablesContainer.innerHTML = `<p>No rate entries for ${year} yet.</p>`;
    return;
  }

  const tabsHeader = document.createElement("div");
  tabsHeader.className = "rate-type-tabs";
  tabsHeader.style.cssText = `
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    padding-top: 12px;
    margin-top: 6px;
  `;

  const contents = document.createElement("div");
  contents.className = "rate-type-contents";

  const activeType =
    activeTypeHint && types.includes(activeTypeHint)
      ? activeTypeHint
      : types[0];

  types.forEach((type) => {
    const firstEntry = yearData[type]?.[0] || null;
    const fromDate = firstEntry ? parseDateString(firstEntry.from) : null;
    const toDate = firstEntry ? parseDateString(firstEntry.to) : null;
    const displayDate =
      fromDate && toDate
        ? `${formatDate(fromDate)}  To  ${formatDate(toDate)}`
        : firstEntry && firstEntry.from && firstEntry.to
        ? `${firstEntry.from}  To  ${firstEntry.to}`
        : "";

    // Create tab container
    const tabContainer = document.createElement("div");
    tabContainer.className = "tourist-type-tab-container";
    tabContainer.style.cssText = `display: inline-block; position: relative;`;

    const tabBtn = document.createElement("button");
    tabBtn.type = "button";
    tabBtn.className = "rate-type-tab-btn";
    tabBtn.style.cssText = `
      padding: 10px 14px;
      border: 1px solid #ccc;
      border-radius: 8px;
      cursor: pointer;
      background: ${type === activeType ? "#b7dfb9b4" : "#fff"};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-width: 180px;
      text-align: center;
    `;

    tabBtn.innerHTML = displayDate
      ? `
        <div style="font-weight:600; line-height:1.2; font-size:14px; color:#000;">
          ${type}
        </div>
        <div style="font-size:13px; color:#333; line-height:1.2; margin-top:3px;">
          ${displayDate}
        </div>`
      : `
        <div style="font-weight:500; line-height:1.2; font-size:14px; color:#000;">
          ${type}
        </div>`;

    // Add type remove button
    const typeRemoveBtn = document.createElement("button");
    typeRemoveBtn.className = "type-remove-btn";
    typeRemoveBtn.textContent = "×";
    typeRemoveBtn.title = "Remove all entries for this tourist type";
    typeRemoveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTouristType(year, type);
    });

    tabContainer.appendChild(tabBtn);
    tabContainer.appendChild(typeRemoveBtn);
    tabsHeader.appendChild(tabContainer);

    const panel = document.createElement("div");
    panel.className = "rate-type-panel";
    panel.dataset.type = type;
    panel.dataset.year = year;
    panel.style.display = type === activeType ? "block" : "none";

    yearData[type].forEach((entry, entryIdx) => {
      const block = document.createElement("div");
      block.className = "rate-entry-block";
      block.style.cssText = `
        border: 1px solid #e0e0e0;
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 10px;
        position: relative;
      `;
      block.dataset.type = type;
      block.dataset.year = year;
      block.dataset.index = String(entryIdx);

      // Add rate entry remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "rate-remove-btn";
      removeBtn.textContent = "×";
      removeBtn.title = "Remove this rate entry";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeRateEntry(year, type, entryIdx);
      });

      const header = document.createElement("div");
      header.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        margin-bottom: 8px;
        padding-top: 8px;
      `;

      const title = document.createElement("div");
      const entryLabels = ["A", "B", "C", "D"];
      const entryLabel = entryLabels[entryIdx] || `E ${entryIdx + 1}`;
      title.innerHTML = `<strong>${type} - ${entryLabel}</strong>`;
      title.style.cssText = `
        margin-bottom: 4px;
        color: #537c36;
        font-size: 20px;
        font-weight: 800;
      `;

      const meta = document.createElement("div");
      meta.style.cssText = `font-size: 14px; color: #333;`;
      const fromF = parseDateString(entry.from)
        ? formatDate(parseDateString(entry.from))
        : entry.from || "";
      const toF = parseDateString(entry.to)
        ? formatDate(parseDateString(entry.to))
        : entry.to || "";
      meta.textContent = `Valid: ${fromF}${
        fromF && toF
          ? " to " + toF
          : entry.from && entry.to
          ? " to " + entry.to
          : ""
      } | ${entry.currency || ""}${entry.remarks ? " | " + entry.remarks : ""}`;

      header.appendChild(title);
      header.appendChild(meta);
      block.appendChild(removeBtn);
      block.appendChild(header);

      const tableWrapper = document.createElement("div");
      tableWrapper.style.overflowX = "auto";

      const table = document.createElement("table");
      table.setAttribute("cellpadding", "5");
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        table-layout: auto;
        border: 1px solid #ccc;
      `;

      const categories = ["EP", "CP", "MAP", "AP"];
      const subCols = ["Dbl", "Sgl", "EB", "CWB", "CNB"];

      const categoryBg = {
        ep: "#eaf7ea",
        cp: "#f7e3e3",
        map: "#fff6e0",
        ap: "#e6f0ff",
      };

      const borderCellStyle = `
        border: 1px solid #c9c9c9;
        text-align: center;
      `;

      const thead = document.createElement("thead");
      const tr1 = document.createElement("tr");
      const tr2 = document.createElement("tr");

      const thRoom = document.createElement("th");
      thRoom.rowSpan = 2;
      thRoom.textContent = "Room Category";
      thRoom.style.cssText = `
        ${borderCellStyle}
        font-size: 14px; 
        font-weight: 600; 
        white-space: nowrap;
        min-width: 150px;
        background:#f9f9f9;
      `;
      tr1.appendChild(thRoom);

      const thQty = document.createElement("th");
      thQty.rowSpan = 2;
      thQty.textContent = "Qty";
      thQty.style.cssText = `
        ${borderCellStyle}
        font-size: 14px;
        min-width: 60px;
        background:#f9f9f9;
      `;
      tr1.appendChild(thQty);

      categories.forEach((c) => {
        const th = document.createElement("th");
        th.colSpan = subCols.length;
        th.textContent = c;
        th.style.cssText = `
          ${borderCellStyle}
          font-size: 14px;
          min-width: 250px;
          background: ${categoryBg[c.toLowerCase()] || "#fff"};
        `;
        tr1.appendChild(th);
      });

      categories.forEach((c) => {
        const key = c.toLowerCase();
        subCols.forEach((sc) => {
          const th = document.createElement("th");
          th.textContent = sc;
          th.style.cssText = `
            ${borderCellStyle}
            font-size: 14px;
            min-width: 50px;
            background: ${categoryBg[key] || "#fff"};
          `;
          tr2.appendChild(th);
        });
      });

      thead.appendChild(tr1);
      thead.appendChild(tr2);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      (entry.rooms || []).forEach((room, roomIdx) => {
        const tr = document.createElement("tr");

        const tdRt = document.createElement("td");
        tdRt.innerHTML = `<div style="display:inline-flex; gap:10px; align-items:center; font-size:14px; white-space:nowrap; text-align:center; justify-content:center; width:100%;"><span>${room.rt}</span></div>`;
        tdRt.style.cssText = borderCellStyle;
        tr.appendChild(tdRt);

        const tdQty = document.createElement("td");
        tdQty.textContent = room.qty;
        tdQty.style.cssText = borderCellStyle;
        tr.appendChild(tdQty);

        categories.forEach((c) => {
          const catKey = c.toLowerCase();
          subCols.forEach((sc) => {
            const td = document.createElement("td");
            td.className = catKey;
            td.style.cssText = `
              ${borderCellStyle}
              background: ${categoryBg[catKey] || "transparent"};
              padding: 0;
            `;

            const input = document.createElement("input");
            input.type = "text";
            input.value = (room[catKey] && room[catKey][sc]) || "";
            input.style.cssText = `
              width: 100%; 
              font-size: 14px; 
              background: transparent; 
              border: 0; 
              padding: 6px 4px;
              text-align: center;
              box-sizing: border-box;
            `;
            input.dataset.year = year;
            input.dataset.type = type;
            input.dataset.entryIdx = String(entryIdx);
            input.dataset.roomIdx = String(roomIdx);
            input.dataset.cat = catKey;
            input.dataset.sub = sc;

            input.addEventListener("input", (e) => {
              const y = e.target.dataset.year;
              const t = e.target.dataset.type;
              const ei = parseInt(e.target.dataset.entryIdx, 10);
              const ri = parseInt(e.target.dataset.roomIdx, 10);
              const cat = e.target.dataset.cat;
              const sub = e.target.dataset.sub;
              const val = e.target.value.trim();

              if (!touristTypeTables[y] || !touristTypeTables[y][t]) return;
              if (!touristTypeTables[y][t][ei]) return;
              if (!touristTypeTables[y][t][ei].rooms) return;
              if (!touristTypeTables[y][t][ei].rooms[ri]) return;

              if (!touristTypeTables[y][t][ei].rooms[ri][cat])
                touristTypeTables[y][t][ei].rooms[ri][cat] = {};
              touristTypeTables[y][t][ei].rooms[ri][cat][sub] = val;
            });

            td.appendChild(input);
            tr.appendChild(td);
          });
        });

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      tableWrapper.appendChild(table);
      block.appendChild(tableWrapper);
      panel.appendChild(block);
    });

    contents.appendChild(panel);

    tabBtn.addEventListener("click", () => {
      const allBtns = tabsHeader.querySelectorAll(".rate-type-tab-btn");
      allBtns.forEach((b) => (b.style.background = "#fff"));
      tabBtn.style.background = "#b7dfb9b4";
      const panels = contents.querySelectorAll(".rate-type-panel");
      panels.forEach(
        (p) => (p.style.display = p.dataset.type === type ? "block" : "none")
      );
    });
  });

  rateTablesContainer.appendChild(tabsHeader);
  rateTablesContainer.appendChild(contents);
}

function collectRates() {
  const rates = {};
  Object.keys(touristTypeTables).forEach((year) => {
    rates[year] = {};
    Object.keys(touristTypeTables[year]).forEach((type) => {
      rates[year][type] = touristTypeTables[year][type].map((entry) => {
        const rooms = (entry.rooms || []).map((r) => ({
          rt: r.rt,
          qty: r.qty,
          ep: r.ep ? { ...r.ep } : {},
          cp: r.cp ? { ...r.cp } : {},
          map: r.map ? { ...r.map } : {},
          ap: r.ap ? { ...r.ap } : {},
        }));
        return {
          from: entry.from,
          to: entry.to,
          remarks: entry.remarks,
          currency: entry.currency,
          rooms,
        };
      });
    });
  });
  return rates;
}

/* ---------- Department Helpers ---------- */
function getDeptData(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return "";
  const arr = [];
  container
    .querySelectorAll(".qty-room-wrapper, .qty-room-wrapper2")
    .forEach((wrap) => {
      const ins = els("input", wrap);
      ins.forEach((i) => arr.push(i.value.trim()));
    });
  return arr.filter(Boolean).join(",");
}

/* ---------- Hotels Table Management ---------- */
function addHotelRow(hotel, serialNo, index) {
  const row = document.createElement("tr");

  const phones = formatDeptDataForTable(hotel.phones || "");
  const emails = formatDeptDataForTable(hotel.emails || "");
  const location = hotel.location || ""; // FIXED: Removed capitalizeFirstLetter call

  row.innerHTML = `
    <td>${serialNo}</td>
    <td>${hotel.hotelName || ""}</td>
    <td>${location}</td>
    <td>${hotel.tcbRating || ""}</td>
    <td>${phones}</td>
    <td>${emails}</td>
    <td>
      <button class="edit-btn" type="button" title="Edit Hotel">✏️</button>
      <button class="delete-btn" type="button" title="Delete Hotel">❌</button>
    </td>
  `;

  const editBtn = row.querySelector(".edit-btn");
  if (editBtn) {
    editBtn.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
      margin-right: 5px;
      font-size: 14px;
      transition: background-color 0.3s ease;
    `;
    editBtn.addEventListener("mouseenter", () => {
      editBtn.style.background = "#45a049";
    });
    editBtn.addEventListener("mouseleave", () => {
      editBtn.style.background = "#4CAF50";
    });
    editBtn.addEventListener("click", () => editHotel(hotel, index));
  }

  const deleteBtn = row.querySelector(".delete-btn");
  if (deleteBtn) {
    deleteBtn.style.cssText = `
      background: none;
      color: #ff4444;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 5px;
      border-radius: 4px;
      transition: background-color 0.3s ease;
    `;
    deleteBtn.addEventListener("mouseenter", () => {
      deleteBtn.style.background = "rgba(255, 68, 68, 0.1)";
    });
    deleteBtn.addEventListener("mouseleave", () => {
      deleteBtn.style.background = "none";
    });
    deleteBtn.addEventListener("click", () => deleteHotel(hotel, index));
  }

  hotelTableBody.appendChild(row);
}

function renderHotels() {
  if (!hotelTableBody) return;
  hotelTableBody.innerHTML = "";
  const hotels = getHotels();
  const total = hotels.length;
  const totalPages = Math.max(1, Math.ceil(total / HOTELS_PER_PAGE));

  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }

  const start = (currentPage - 1) * HOTELS_PER_PAGE;
  const end = Math.min(start + HOTELS_PER_PAGE, total);
  const pageSlice = hotels.slice(start, end);

  pageSlice.forEach((h, i) => addHotelRow(h, start + i + 1, start + i));
  updatePagination(total);
}

function updatePagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / HOTELS_PER_PAGE));
  if (currentPageSpan) currentPageSpan.textContent = currentPage;
  if (totalPagesSpan) totalPagesSpan.textContent = totalPages;

  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.backgroundColor = currentPage === 1 ? "#cccccc" : "#537c36";
    prevBtn.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";
  }
  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.style.backgroundColor =
      currentPage === totalPages ? "#cccccc" : "#537c36";
    nextBtn.style.cursor =
      currentPage === totalPages ? "not-allowed" : "pointer";
  }
}

function hidePaginationButtons() {
  const paginationNav = document.querySelector(".pagination");
  if (paginationNav) paginationNav.style.display = "none";
}
function showPaginationButtons() {
  const paginationNav = document.querySelector(".pagination");
  if (paginationNav) paginationNav.style.display = "flex";
  updatePagination(getHotels().length);
}

/* ---------- Form Management ---------- */
function openHotelFormForAdd() {
  isEditMode = false;
  editingHotelIndex = null;

  if (hotelForm) {
    try {
      hotelForm.reset();
    } catch {}
  }

  ["deptEmailContainer", "deptPhoneContainer", "roomTypesContainer2"].forEach(
    (containerId) => {
      const container = document.getElementById(containerId);
      if (container) {
        container
          .querySelectorAll(".qty-room-wrapper, .qty-room-wrapper2")
          .forEach((wrapper) => wrapper.remove());

        const wrapper = document.createElement("div");
        wrapper.className = "qty-room-wrapper2";

        if (containerId === "roomTypesContainer2") {
          wrapper.innerHTML = `
            <input type="text" placeholder="Room Type">
            <input type="number" placeholder="Qty" value="0">
            <button type="button" class="remove-room-btn">-</button>
            <button type="button" class="add-room-btn">+</button>
          `;
        } else if (containerId === "deptEmailContainer") {
          wrapper.innerHTML = `
            <input type="text" placeholder="Department">
            <input type="text" placeholder="Email">
            <button type="button" class="remove-room-btn">-</button>
            <button type="button" class="add-room-btn">+</button>
          `;
        } else if (containerId === "deptPhoneContainer") {
          wrapper.innerHTML = `
            <input type="text" placeholder="Department">
            <input type="text" placeholder="Phone">
            <button type="button" class="remove-room-btn">-</button>
            <button type="button" class="add-room-btn">+</button>
          `;
        }
        container.appendChild(wrapper);
      }
    }
  );

  ["deptEmailContainer", "deptPhoneContainer", "roomTypesContainer2"].forEach(
    setupClone
  );

  touristTypeTables = {};
  currentSelectedYear = null;
  if (rateTablesContainer) rateTablesContainer.innerHTML = "";

  const ysel = document.getElementById("yearSelect");
  if (ysel) ysel.value = "";
  document.querySelectorAll(".year-chip").forEach((chip) => chip.remove());

  clearRateForm();

  if (hotelForm) hotelForm.style.display = "block";
  if (hotelBtn) hotelBtn.textContent = "Add New Hotel";
  toggleHotelsTable(false);
  hidePaginationButtons();

  if (ysel && ysel.toggleRateControls) ysel.toggleRateControls(false);

  if (rateTablesContainer) {
    rateTablesContainer.innerHTML =
      "<p>Select a year and click the year chip to add rate data.</p>";
  }
}

function editHotel(hotel, index) {
  isEditMode = true;
  editingHotelIndex = index;

  hidePaginationButtons();

  if (hotelForm) hotelForm.style.display = "block";
  toggleHotelsTable(false);
  if (hotelBtn) hotelBtn.textContent = "Edit Hotel";

  const originalRoomsData = hotel.roomsData || [];

  const inputs = hotelForm.querySelectorAll(
    ".form-row input[type='text'], select"
  );
  if (inputs && inputs.length >= 4) {
    inputs[0].value = hotel.hotelName || "";
    inputs[1].value = hotel.location || ""; // FIXED: Removed capitalizeFirstLetter call
    inputs[2].value = hotel.tcbRating || "";
    inputs[3].value = hotel.category || "";
  }

  const emailContainer = document.getElementById("deptEmailContainer");
  if (emailContainer) {
    emailContainer.innerHTML = "";
    const emailPairs = (hotel.emails || "").split(",");
    const pairCount = Math.max(1, Math.ceil(emailPairs.length / 2));
    for (let i = 0; i < pairCount; i++) {
      const wrapper = document.createElement("div");
      wrapper.className = "qty-room-wrapper2";
      wrapper.innerHTML = `
        <input type="text" placeholder="Department" value="${
          emailPairs[i * 2] || ""
        }">
        <input type="text" placeholder="Email" value="${
          emailPairs[i * 2 + 1] || ""
        }">
        <button type="button" class="remove-room-btn">-</button>
        <button type="button" class="add-room-btn">+</button>
      `;
      emailContainer.appendChild(wrapper);
    }
  }

  const phoneContainer = document.getElementById("deptPhoneContainer");
  if (phoneContainer) {
    phoneContainer.innerHTML = "";
    const phonePairs = (hotel.phones || "").split(",");
    const pairCount = Math.max(1, Math.ceil(phonePairs.length / 2));
    for (let i = 0; i < pairCount; i++) {
      const wrapper = document.createElement("div");
      wrapper.className = "qty-room-wrapper2";
      wrapper.innerHTML = `
        <input type="text" placeholder="Department" value="${
          phonePairs[i * 2] || ""
        }">
        <input type="text" placeholder="Phone" value="${
          phonePairs[i * 2 + 1] || ""
        }">
        <button type="button" class="remove-room-btn">-</button>
        <button type="button" class="add-room-btn">+</button>
      `;
      phoneContainer.appendChild(wrapper);
    }
  }

  const roomContainer = document.getElementById("roomTypesContainer2");
  if (roomContainer) {
    roomContainer.innerHTML = "";
    const roomsToDisplay =
      originalRoomsData.length > 0 ? originalRoomsData : [{ rt: "", qty: "0" }];
    roomsToDisplay.forEach((room) => {
      const wrapper = document.createElement("div");
      wrapper.className = "qty-room-wrapper2";
      wrapper.innerHTML = `
        <input type="text" placeholder="Room Type" value="${room.rt || ""}">
        <input type="number" placeholder="Qty" value="${room.qty || "0"}">
        <button type="button" class="remove-room-btn">-</button>
        <button type="button" class="add-room-btn">+</button>
      `;
      roomContainer.appendChild(wrapper);
    });
  }

  ["deptEmailContainer", "deptPhoneContainer", "roomTypesContainer2"].forEach(
    setupClone
  );

  touristTypeTables = {};
  if (hotel.rates) {
    touristTypeTables = JSON.parse(JSON.stringify(hotel.rates));
  }

  const ysel = document.getElementById("yearSelect");
  if (ysel) {
    document.querySelectorAll(".year-chip").forEach((chip) => chip.remove());
    const availableYears = Object.keys(touristTypeTables);
    if (availableYears.length > 0) {
      const firstYear = availableYears[0];
      ysel.value = firstYear;
      currentSelectedYear = firstYear;
      const changeEvent = new Event("change", { bubbles: true });
      ysel.dispatchEvent(changeEvent);
    } else {
      ysel.value = "";
      currentSelectedYear = null;
      if (ysel.toggleRateControls) ysel.toggleRateControls(false);
      if (rateTablesContainer) {
        rateTablesContainer.innerHTML =
          "<p>No rate data available. Select a year and add rate tables.</p>";
      }
    }
  }
}

function resetForm() {
  isEditMode = false;
  editingHotelIndex = null;

  if (hotelForm) {
    try {
      hotelForm.reset();
    } catch {}
  }

  touristTypeTables = {};
  currentSelectedYear = null;
  if (rateTablesContainer) rateTablesContainer.innerHTML = "";

  const ysel = document.getElementById("yearSelect");
  if (ysel) ysel.value = "";
  document.querySelectorAll(".year-chip").forEach((chip) => chip.remove());

  clearRateForm();

  ["deptEmailContainer", "deptPhoneContainer", "roomTypesContainer2"].forEach(
    (containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      const wrapperClass = container.querySelector(".qty-room-wrapper2")
        ? ".qty-room-wrapper2"
        : ".qty-room-wrapper";
      container.querySelectorAll(wrapperClass).forEach((wrap) => {
        els("input", wrap).forEach((i) => {
          i.value = i.type === "number" ? "0" : "";
        });
      });
    }
  );
}

/* ---------- Event Listeners ---------- */
if (saveBtn) {
  try {
    saveBtn.type = "button";
  } catch {}
  saveBtn.addEventListener("click", async () => {
    const inputs = hotelForm.querySelectorAll(
      ".form-row input[type='text'], select"
    );
    const hotelName = inputs[0]?.value.trim() || "";
    const location = capitalizeFirstLetter(inputs[1]?.value.trim() || "");
    const tcbRating = inputs[2]?.value.trim() || "";
    const category = inputs[3]?.value.trim() || "";

    if (!hotelName || !location) {
      alert("Hotel Name & Location required");
      return;
    }

    if (
      !confirm(
        isEditMode
          ? "Do you want to update this hotel?"
          : "Do you want to save this hotel?"
      )
    )
      return;

    const emails = getDeptData("deptEmailContainer");
    const phones = getDeptData("deptPhoneContainer");

    const roomWrappers = document.querySelectorAll(
      "#roomTypesContainer2 .qty-room-wrapper2, #roomTypesContainer2 .qty-room-wrapper"
    );
    const roomsData = Array.from(roomWrappers)
      .map((wrap) => {
        const rt = wrap.querySelector('input[type="text"]')?.value.trim() || "";
        const qty =
          parseInt(
            wrap.querySelector('input[type="number"]')?.value || "0",
            10
          ) || 0;
        return rt ? { rt, qty } : null;
      })
      .filter(Boolean);

    const rates = collectRates();

    const newHotel = {
      hotelName,
      location,
      tcbRating,
      category,
      emails,
      phones,
      rooms: roomsData.map((r) => r.rt).join(","),
      roomsData,
      rates,
    };

    try {
      const hotels = getHotels();
      let targetId = null;
      if (
        editingHotelIndex !== null &&
        editingHotelIndex >= 0 &&
        editingHotelIndex < hotels.length
      ) {
        targetId =
          hotels[editingHotelIndex]._id || hotels[editingHotelIndex].id || null;
      }

      if (targetId) {
        await apiFetch(`/api/hotels/${encodeURIComponent(targetId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newHotel),
        });
      } else {
        await apiFetch("/api/hotels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newHotel),
        });
      }

      await fetchAndSyncHotels();
      renderHotels();

      alert(
        isEditMode ? "Hotel updated successfully!" : "Hotel saved successfully!"
      );

      if (isEditMode) {
        resetForm();
        if (hotelForm) hotelForm.style.display = "none";
        if (hotelBtn) hotelBtn.textContent = "Add New Hotel";
        toggleHotelsTable(true);
        showPaginationButtons();
      } else {
        openHotelFormForAdd();
      }
    } catch (err) {
      console.error(err);
      alert("Save failed — check console for details.");
    }
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    resetForm();
    if (hotelForm) hotelForm.style.display = "none";
    if (hotelBtn) hotelBtn.textContent = "Add New Hotel";
    toggleHotelsTable(true);
    showPaginationButtons();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const q = (e.target.value || "").toLowerCase();
    document.querySelectorAll("#hotelTableBody tr").forEach((row) => {
      const name = (row.cells[1]?.textContent || "").toLowerCase();
      row.style.display = name.includes(q) ? "" : "none";
    });
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    const hotels = getHotels();
    const totalPages = Math.max(1, Math.ceil(hotels.length / HOTELS_PER_PAGE));
    if (currentPage > 1) {
      currentPage--;
      renderHotels();
      updatePagination(hotels.length);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    const hotels = getHotels();
    const totalPages = Math.max(1, Math.ceil(hotels.length / HOTELS_PER_PAGE));
    if (currentPage < totalPages) {
      currentPage++;
      renderHotels();
      updatePagination(hotels.length);
    }
  });
}

if (hotelForm) hotelForm.style.display = "none";
safeAddEvent(hotelBtn, "click", () => {
  openHotelFormForAdd();
});

/* ---------- Initialize Application ---------- */
window.addEventListener("load", async () => {
  addRateRemoveStyles(); // Add rate removal styles
  await fetchAndSyncHotels();
  renderHotels();
  if (rateTablesContainer) rateTablesContainer.innerHTML = "";
  toggleHotelsTable(true);
  showPaginationButtons();
});

document.addEventListener("DOMContentLoaded", function () {
  if (prevBtn) {
    prevBtn.addEventListener("mouseenter", function () {
      if (!this.disabled) {
        this.style.backgroundColor = "#45a049";
      }
    });
    prevBtn.addEventListener("mouseleave", function () {
      if (!this.disabled) {
        this.style.backgroundColor = "#537c36";
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("mouseenter", function () {
      if (!this.disabled) {
        this.style.backgroundColor = "#45a049";
      }
    });
    nextBtn.addEventListener("mouseleave", function () {
      if (!this.disabled) {
        this.style.backgroundColor = "#537c36";
      }
    });
  }
});
