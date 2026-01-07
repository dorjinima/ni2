
document.addEventListener("DOMContentLoaded", () => {
  // ---------- CONFIG ----------
  const config = {
    kmRateCols: [4, 5, 6, 7, 8],
    dayRateCols: [10, 11, 12, 13, 14],
    fixedColumns: 4,
    minRows: 1,
    minKmAllowed: 100,
    historyKey: "itineraryHistory",
    historyLimit: 50,
    saveKey: "fleetTableSavedState_v1",
    serverAutosave: true, // try POST to /api/sdf on saves
    serverListEndpoint: "/api/sdf",
    serverSaveEndpoint: "/api/sdf",
    serverGetByIdEndpoint: "/api/sdf/", // append id
  };

  // ---------- DOM refs ----------
  const fleetTable = document.getElementById("fleetTable");
  const fleetBody = document.getElementById("fleetBody");
  const horizontalCloneBtn = document.getElementById("horizontalCloneBtn");
  const horizontalCloneDayBtn = document.getElementById(
    "horizontalCloneDayBtn"
  );

  // Optional UI hooks (if present in your HTML)
  const btnManualSave = document.getElementById("btnManualSave");
  const btnListSnapshots = document.getElementById("btnListSnapshots");
  const snapshotListContainer = document.getElementById(
    "snapshotListContainer"
  );
  const btnClearSavedState = document.getElementById("btnClearSavedState");
  const kmRangeOptions = document.getElementById("kmRangeOptions");

  if (!fleetTable || !fleetBody) {
    console.warn("fleetTable or fleetBody not found. Initialization aborted.");
    return;
  }

  // ---------- inject stylesheet ----------
  (function injectStyles() {
    const css = `
      .itinerary-error { background-color: #ffdddd !important; }
      .itinerary-highlight { background-color: #fff3c4 !important; transition: background-color 0.4s; }
      .km-error-cell { background-color: #ffe6e6; color: #b30000; }
      .inline-suggestion-input {
        width: 100%;
        box-sizing: border-box;
        padding: 4px 6px;
        margin: 0;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 3px;
        font: inherit;
        color: inherit;
        background: transparent;
      }
      .km-error-marker { color: #b30000; font-weight: 700; margin-left: 6px; }
      .snapshot-list { max-height: 240px; overflow:auto; padding:8px; border:1px solid #eee; background:#fafafa; }
      .snapshot-item { padding:6px; border-bottom:1px solid #efefef; display:flex; justify-content:space-between; gap:8px; }
      .snapshot-item button { padding:4px 8px; cursor:pointer; }
    `;
    const s = document.createElement("style");
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  })();

  // ---------- state ----------
  let kmBaseRates = [];
  let dayBaseRates = [];
  let kmRangePercents = [];

  // ---------- helpers: debounce ----------
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ---------- local history helpers ----------
  function readHistory() {
    try {
      const raw = localStorage.getItem(config.historyKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function saveHistory(arr) {
    try {
      localStorage.setItem(
        config.historyKey,
        JSON.stringify(arr.slice(0, config.historyLimit))
      );
    } catch {}
  }
  function addToHistory(value) {
    if (!value) return;
    const v = String(value).trim();
    if (!v) return;
    const hist = readHistory();
    const filtered = [
      v,
      ...hist.filter((x) => x.toLowerCase() !== v.toLowerCase()),
    ];
    saveHistory(filtered);
  }

  // ---------- Save / Load State (local + server) ----------
  function buildSnapshotMeta() {
    return {
      tHeadHTML: fleetTable.tHead ? fleetTable.tHead.innerHTML : null,
      tBodyHTML: fleetBody.innerHTML,
      kmRateCols: config.kmRateCols,
      dayRateCols: config.dayRateCols,
      minKmAllowed: config.minKmAllowed,
      kmRangeHTML: kmRangeOptions ? kmRangeOptions.innerHTML : null,
      timestamp: Date.now(),
    };
  }

  // Local storage save
  function saveStateLocal() {
    try {
      localStorage.setItem(config.saveKey, JSON.stringify(buildSnapshotMeta()));
      // console.log("Saved state locally.");
    } catch (err) {
      console.error("Failed to save local state:", err);
    }
  }
  const saveStateLocalDebounced = debounce(saveStateLocal, 250);

  // Save snapshot to server (POST /api/sdf)
  async function saveStateServer() {
    if (!config.serverAutosave) return null;
    try {
      // server expects rows: [] non-empty; we'll construct a compact rows array and put markup into meta
      const rows = Array.from(fleetBody.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.cells).map((c) => (c ? (c.innerText || "").trim() : ""))
      );
      // ensure it's not empty - if empty, server route requires non-empty rows
      const payload = {
        savedAt: new Date().toISOString(),
        validFrom: "",
        validTo: "",
        rows: rows.length ? rows : [["empty"]],
        meta: buildSnapshotMeta(),
      };
      const res = await fetch(config.serverSaveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        console.warn("Server save failed:", res.status, txt);
        return null;
      }
      const data = await res.json();
      if (data && data._id)
        localStorage.setItem(config.saveKey + "_lastId", data._id);
      // console.log("Saved snapshot to server:", data._id || data);
      return data;
    } catch (err) {
      console.warn("Failed to save snapshot to server:", err);
      return null;
    }
  }

  // Combined save used by UI: local first then attempt server (fire-and-forget)
  function saveState() {
    try {
      saveStateLocal();
      // server save async
      saveStateServer().then((r) => {
        if (r) console.log("Snapshot saved to server:", r._id || r);
      });
    } catch (err) {
      console.error("saveState error:", err);
    }
  }
  const saveStateDebounced = debounce(saveState, 400);

  // Load from localStorage (sync)
  function loadStateLocal() {
    try {
      const raw = localStorage.getItem(config.saveKey);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (state.tHeadHTML && fleetTable.tHead) {
        try {
          fleetTable.tHead.innerHTML = state.tHeadHTML;
        } catch (e) {
          console.warn("restore tHead:", e);
        }
      }
      if (state.tBodyHTML) fleetBody.innerHTML = state.tBodyHTML;
      if (Array.isArray(state.kmRateCols)) config.kmRateCols = state.kmRateCols;
      if (Array.isArray(state.dayRateCols))
        config.dayRateCols = state.dayRateCols;
      if (typeof state.minKmAllowed === "number")
        config.minKmAllowed = state.minKmAllowed;
      if (state.kmRangeHTML && kmRangeOptions)
        kmRangeOptions.innerHTML = state.kmRangeHTML;
      return true;
    } catch (err) {
      console.warn("Failed to load local state:", err);
      return false;
    }
  }

  // Load latest snapshot from server (tries GET /api/sdf?limit=1)
  async function loadStateFromServer() {
    if (!config.serverAutosave) return false;
    try {
      const res = await fetch(config.serverListEndpoint + "?limit=1");
      if (!res.ok) {
        console.warn("Server snapshot load failed:", res.status);
        return false;
      }
      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) return false;
      const doc = arr[0];
      const meta = doc.meta || {};
      if (meta.tHeadHTML && fleetTable.tHead) {
        try {
          fleetTable.tHead.innerHTML = meta.tHeadHTML;
        } catch (e) {
          console.warn("thead restore:", e);
        }
      }
      if (meta.tBodyHTML) fleetBody.innerHTML = meta.tBodyHTML;
      if (Array.isArray(meta.kmRateCols)) config.kmRateCols = meta.kmRateCols;
      if (Array.isArray(meta.dayRateCols))
        config.dayRateCols = meta.dayRateCols;
      if (typeof meta.minKmAllowed === "number")
        config.minKmAllowed = meta.minKmAllowed;
      if (meta.kmRangeHTML && kmRangeOptions)
        kmRangeOptions.innerHTML = meta.kmRangeHTML;
      console.log("Loaded snapshot from server:", doc._id || doc);
      return true;
    } catch (err) {
      console.warn("Failed to load state from server:", err);
      return false;
    }
  }

  // Top-level load: try server -> fallback local
  async function loadState() {
    const serverOk = await loadStateFromServer();
    if (serverOk) return true;
    return loadStateLocal();
  }

  // ---------- editable cells ----------
  function makeAllCellsEditable() {
    const headRows = fleetTable.tHead?.rows || [];
    for (let r = 0; r < headRows.length; r++) {
      const row = headRows[r];
      for (let cell of row.cells) {
        if (
          r === 0 ||
          cell.querySelector("button") ||
          (cell.colSpan && cell.colSpan > 1)
        ) {
          cell.contentEditable = false;
          continue;
        }
        if (r === 1 || r === 2) {
          cell.contentEditable = true;
          cell.style.minWidth = "100px";
        } else {
          cell.contentEditable = false;
        }
      }
    }

    fleetBody.querySelectorAll("tr").forEach((row) => {
      for (let cell of row.cells) {
        if (!cell.querySelector("button")) {
          cell.contentEditable = true;
          cell.style.minWidth = "100px";
        } else {
          cell.contentEditable = false;
        }
      }
    });
  }

  // ---------- header / rates helpers ----------
  function getBaseRates(cols) {
    const out = [];
    cols.forEach((idx) => {
      const cell = fleetTable.tHead?.rows[2]?.cells?.[idx];
      if (!cell) out.push(0);
      else {
        const text = (cell.innerText || "").trim();
        const num = parseFloat(text.replace(/[^0-9.]/g, ""));
        out.push(isNaN(num) ? 0 : num);
      }
    });
    return out;
  }
  function findHeaderIdxByText(substring) {
    const firstRow = fleetTable.tHead?.rows[0];
    if (!firstRow) return -1;
    for (let i = 0; i < firstRow.cells.length; i++) {
      if ((firstRow.cells[i].innerText || "").includes(substring)) return i;
    }
    return -1;
  }

  // ---------- KM range UI ----------
  function rebuildRangePercentsFromUI() {
    kmRangePercents = [];
    if (!kmRangeOptions) return;
    const checkboxes = kmRangeOptions.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        const key = cb.value || "";
        const percentInput = cb.parentElement
          ? cb.parentElement.querySelector('input[type="number"]')
          : null;
        const percent = percentInput ? parseFloat(percentInput.value || 0) : 0;
        const [minStr, maxStr] = key.split("-");
        const min = parseInt(minStr, 10) || 0;
        const max = parseInt(maxStr, 10) || 0;
        kmRangePercents.push({
          min,
          max,
          percent: isNaN(percent) ? 0 : percent,
          key,
        });
      }
    });
  }
  function getPercentForKm(estKm) {
    for (let rp of kmRangePercents)
      if (estKm >= rp.min && estKm <= rp.max) return rp.percent;
    return null;
  }
  function attachKmRangeListeners() {
    if (!kmRangeOptions) return;
    const checkboxes = kmRangeOptions.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", () => {
        const percentInput = cb.parentElement
          ? cb.parentElement.querySelector('input[type="number"]')
          : null;
        if (percentInput)
          percentInput.style.display = cb.checked ? "inline-block" : "none";
        rebuildRangePercentsFromUI();
        recalcAllRows();
        saveStateDebounced();
      });
      const percentInput = cb.parentElement
        ? cb.parentElement.querySelector('input[type="number"]')
        : null;
      if (percentInput) {
        percentInput.addEventListener("input", () => {
          rebuildRangePercentsFromUI();
          recalcAllRows();
          saveStateDebounced();
        });
        percentInput.addEventListener("wheel", (e) => e.preventDefault(), {
          passive: false,
        });
      }
    });
  }

  // ---------- remove/clear ----------
  function removeOrClearRow(row) {
    const rows = fleetBody.querySelectorAll("tr");
    if (!row) return;
    if (rows.length > config.minRows) {
      row.remove();
      recalcAllRows();
      checkAllKmAndMark();
      saveStateDebounced();
    } else {
      for (let i = 0; i < row.cells.length; i++) {
        if (!row.cells[i].querySelector("button")) row.cells[i].innerText = "";
      }
      recalcRow(row, { silent: true });
      checkAllKmAndMark();
      saveStateDebounced();
    }
  }

  // ---------- validation ----------
  function highlightExistingRow(existingRow, focusCellIdx = 2) {
    if (!existingRow) return;
    existingRow.scrollIntoView({ behavior: "smooth", block: "center" });
    existingRow.classList.add("itinerary-highlight");
    setTimeout(() => existingRow.classList.remove("itinerary-highlight"), 1400);
    const cell = existingRow.cells[focusCellIdx];
    if (cell) {
      try {
        const range = document.createRange();
        range.selectNodeContents(cell);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch {}
    }
  }

  function validateRow(row, { showAlerts = false } = {}) {
    if (!row) return true;
    const fromCell = row.cells[0];
    const toCell = row.cells[2];
    const from = (fromCell?.innerText || "").trim();
    const to = (toCell?.innerText || "").trim();

    row.classList.remove("itinerary-error");

    if (from && to && from.toLowerCase() === to.toLowerCase()) {
      removeOrClearRow(row);
      return false;
    }

    const rows = Array.from(fleetBody.querySelectorAll("tr"));
    for (let r of rows) {
      if (r === row) continue;
      const f = (r.cells[0]?.innerText || "").trim();
      const t = (r.cells[2]?.innerText || "").trim();
      if (
        f &&
        t &&
        from &&
        to &&
        f.toLowerCase() === from.toLowerCase() &&
        t.toLowerCase() === to.toLowerCase()
      ) {
        highlightExistingRow(r, 2);
        removeOrClearRow(row);
        return false;
      }
    }

    return true;
  }

  // ---------- prompt helper ----------
  function promptForKmIfNeeded(row) {
    if (!row) return;
    const from = (row.cells[0]?.innerText || "").trim();
    const to = (row.cells[2]?.innerText || "").trim();
    const estCell = row.cells[3];
    if (!estCell) return;

    const raw = estCell.innerText.trim();
    const parsedKm = parseFloat(raw);
    const hasKm = raw !== "";
    const kmNumeric = isNaN(parsedKm) ? null : parsedKm;

    if (
      from &&
      to &&
      (!hasKm || (kmNumeric !== null && kmNumeric < config.minKmAllowed))
    ) {
      try {
        const defaultVal = hasKm ? String(raw) : String(config.minKmAllowed);
        const userInput = window.prompt(
          `Enter estimated KM for "${from} → ${to}" (minimum ${config.minKmAllowed}). Leave blank to keep current value:`,
          defaultVal
        );
        if (userInput === null) return;
        const v = (userInput || "").trim();
        if (v === "") return;
        const parsed = parseFloat(v.replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) {
          estCell.innerText = String(parsed);
          addToHistory(String(parsed));
          validateRow(row, { showAlerts: false });
          recalcRow(row, { silent: false });
          checkAllKmAndMark();
          saveStateDebounced();
        }
      } catch (err) {
        console.error("Prompt error:", err);
      }
    }
  }

  // ---------- recalculation ----------
  function recalcRow(row, { silent = true } = {}) {
    if (!row) return;
    validateRow(row, { showAlerts: !silent });

    const estKmRaw = (row.cells[3]?.innerText || "").trim();
    const estKm = parseFloat(estKmRaw);
    const estKmNumeric = isNaN(estKm) ? 0 : estKm;
    const kmForCalc =
      estKmNumeric < config.minKmAllowed ? config.minKmAllowed : estKmNumeric;
    const matchedPercent = getPercentForKm(kmForCalc);

    config.kmRateCols.forEach((colIndex, i) => {
      const cell = row.cells[colIndex];
      if (!cell) return;
      const baseKm = kmBaseRates[i] || 0;
      const kmRate = Math.round(kmForCalc * baseKm);
      cell.innerText = isNaN(kmRate) ? "0" : String(kmRate);
    });

    config.dayRateCols.forEach((colIndex, i) => {
      const cell = row.cells[colIndex];
      if (!cell) return;
      const baseDay = dayBaseRates[i] || 0;
      const finalDay =
        matchedPercent !== null
          ? Math.round(baseDay * (1 + matchedPercent / 100))
          : Math.round(baseDay);
      cell.innerText = isNaN(finalDay) ? "0" : String(finalDay);
    });

    markKmErrorForRow(row);
  }

  function recalcAllRows() {
    kmBaseRates = getBaseRates(config.kmRateCols);
    dayBaseRates = getBaseRates(config.dayRateCols);
    rebuildRangePercentsFromUI();
    fleetBody
      .querySelectorAll("tr")
      .forEach((row) => recalcRow(row, { silent: true }));
    checkAllKmAndMark();
    saveStateDebounced();
  }

  // ---------- row creation ----------
  function createEmptyRow() {
    const tr = document.createElement("tr");
    const headerCols = fleetTable.tHead?.rows[1]?.cells?.length || 16;
    for (let i = 0; i < headerCols; i++) {
      const td = document.createElement("td");
      td.innerText = "";
      td.style.textAlign = "center";
      td.style.padding = "12px";
      tr.appendChild(td);
    }
    const tdBtn = document.createElement("td");
    tdBtn.style.textAlign = "center";
    tdBtn.style.whiteSpace = "nowrap";
    const plus = document.createElement("button");
    plus.innerText = "+";
    plus.style.cssText = "padding:4px 8px; margin-right:4px; cursor:pointer;";
    const minus = document.createElement("button");
    minus.innerText = "-";
    minus.style.cssText = "padding:4px 8px; cursor:pointer;";
    tdBtn.appendChild(plus);
    tdBtn.appendChild(minus);
    tr.appendChild(tdBtn);
    return tr;
  }

  function addRow() {
    const rows = fleetBody.querySelectorAll("tr");
    const lastRow = rows[rows.length - 1];
    const newRow = lastRow ? lastRow.cloneNode(true) : createEmptyRow();

    for (let i = 0; i < config.fixedColumns; i++) {
      if (newRow.cells[i]) {
        newRow.cells[i].innerText = "";
        if (!newRow.cells[i].querySelector("button"))
          newRow.cells[i].contentEditable = true;
      }
    }

    newRow.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

    for (let cell of newRow.cells) {
      if (!cell.querySelector("button")) {
        cell.contentEditable = true;
        cell.style.minWidth = "100px";
      } else {
        cell.contentEditable = false;
      }
    }

    fleetBody.appendChild(newRow);
    attachRowValidationListeners(newRow);
    recalcRow(newRow, { silent: true });
    checkAllKmAndMark();
    saveStateDebounced();
  }

  function removeRow(row) {
    removeOrClearRow(row);
  }

  // ---------- clone columns ----------
  function cloneColumn(rateType) {
    const isKmRate = rateType === "km";
    const colsArray = isKmRate ? config.kmRateCols : config.dayRateCols;
    const headerText = isKmRate
      ? "Vehicle Type and Rates (KM)"
      : "Vehicle Type and Rates (Day)";
    const headRows = fleetTable.tHead?.rows || [];
    const lastColIndex = colsArray[colsArray.length - 1];
    const insertIndex = lastColIndex + 1;

    const headerIdx = findHeaderIdxByText(headerText);
    if (headerIdx !== -1) {
      const th = headRows[0].cells[headerIdx];
      th.colSpan = (parseInt(th.colSpan, 10) || 0) + 1;
    }

    [1, 2].forEach((rowIndex) => {
      const row = headRows[rowIndex];
      if (!row) return;
      const refCell = row.cells[lastColIndex];
      const cloneCell = refCell
        ? refCell.cloneNode(true)
        : document.createElement("th");
      cloneCell.querySelectorAll &&
        cloneCell
          .querySelectorAll("[id]")
          .forEach((el) => el.removeAttribute("id"));
      if (cloneCell.tagName === "TH" || cloneCell.tagName === "TD") {
        cloneCell.contentEditable = true;
        cloneCell.style.minWidth = "100px";
      }
      row.insertBefore(cloneCell, row.cells[insertIndex] || null);
    });

    fleetBody.querySelectorAll("tr").forEach((bodyRow) => {
      const refCell = bodyRow.cells[lastColIndex];
      const cloneCell = refCell
        ? refCell.cloneNode(true)
        : document.createElement("td");
      cloneCell.querySelectorAll &&
        cloneCell
          .querySelectorAll("[id]")
          .forEach((el) => el.removeAttribute("id"));
      if (cloneCell.tagName === "TD") {
        cloneCell.contentEditable = true;
        cloneCell.style.minWidth = "100px";
      }
      bodyRow.insertBefore(cloneCell, bodyRow.cells[insertIndex] || null);
    });

    colsArray.push(insertIndex);

    if (isKmRate) {
      config.dayRateCols = config.dayRateCols.map((col) =>
        col > lastColIndex ? col + 1 : col
      );
    } else {
      config.kmRateCols = config.kmRateCols.map((col) =>
        col > lastColIndex ? col + 1 : col
      );
    }

    kmBaseRates = getBaseRates(config.kmRateCols);
    dayBaseRates = getBaseRates(config.dayRateCols);
    recalcAllRows();

    // reapply listeners and editability
    makeAllCellsEditable();
    fleetBody
      .querySelectorAll("tr")
      .forEach((r) => attachRowValidationListeners(r));
    saveStateDebounced();
  }

  // ---------- UI wiring ----------
  fleetBody.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName === "BUTTON") {
      const row = target.closest("tr");
      if (!row) return;
      const txt = (target.innerText || "").trim();
      if (txt === "+") addRow();
      else if (txt === "-") removeRow(row);
    }
  });

  fleetTable.addEventListener(
    "input",
    debounce((e) => {
      const cell = e.target;
      const row =
        cell && typeof cell.closest === "function" ? cell.closest("tr") : null;
      if (!row) return;
      if (
        row.parentNode === fleetTable.tHead &&
        fleetTable.tHead.rows[2] &&
        row === fleetTable.tHead.rows[2]
      ) {
        kmBaseRates = getBaseRates(config.kmRateCols);
        dayBaseRates = getBaseRates(config.dayRateCols);
        recalcAllRows();
        saveStateDebounced();
        return;
      }
      if (row.parentNode === fleetBody) {
        recalcRow(row, { silent: true });
        checkAllKmAndMark();
        saveStateDebounced();
      }
    }, 300)
  );

  fleetBody.addEventListener("focusout", (e) => {
    const row =
      e.target && typeof e.target.closest === "function"
        ? e.target.closest("tr")
        : null;
    if (!row) return;
    // prompt only when appropriate
    promptForKmIfNeeded(row);
    validateRow(row, { showAlerts: false });
    recalcRow(row, { silent: false });
    checkAllKmAndMark();
    saveStateDebounced();
  });

  fleetTable.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      const row =
        e.target && typeof e.target.closest === "function"
          ? e.target.closest("tr")
          : null;
      if (row && row.parentNode === fleetBody) addRow();
    }
  });

  horizontalCloneBtn?.addEventListener("click", () => cloneColumn("km"));
  horizontalCloneDayBtn?.addEventListener("click", () => cloneColumn("day"));

  // ---------- attach row listeners ----------
  function attachRowValidationListeners(row) {
    if (!row || row.parentNode !== fleetBody) return;

    [0, 2].forEach((i) => {
      const cell = row.cells[i];
      if (!cell) return;
      cell.contentEditable = true;

      // show inline input on focus
      cell.addEventListener("focus", () =>
        setTimeout(() => showInlineInput(cell), 0)
      );

      cell.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          cell.blur();
        }
      });
    });

    const kmCell = row.cells[3];
    if (kmCell) {
      kmCell.contentEditable = true;
      kmCell.addEventListener("focusout", () => {
        validateRow(row, { showAlerts: false });
        recalcRow(row, { silent: false });
        checkAllKmAndMark();
        saveStateDebounced();
      });
      kmCell.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          kmCell.blur();
        }
      });
    }
  }

  // ---------- inline input ----------
  function showInlineInput(cell) {
    if (!cell) return;
    if (
      cell._inline &&
      cell._inline.input &&
      typeof cell._inline.input.focus === "function"
    ) {
      try {
        cell._inline.input.focus();
      } catch {}
      return;
    }

    if (window.__activeInline && window.__activeInline.commit) {
      try {
        window.__activeInline.commit();
      } catch {}
    }

    const prevText = cell.innerText.trim();
    cell.innerText = "";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-suggestion-input";
    input.value = prevText;
    input.autocomplete = "off";

    const datalistId =
      "inline-datalist-" + Date.now() + Math.floor(Math.random() * 1000);
    const list = document.createElement("datalist");
    list.id = datalistId;
    const hist = readHistory();
    hist.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h;
      list.appendChild(opt);
    });
    input.setAttribute("list", datalistId);

    cell.appendChild(list);
    cell.appendChild(input);

    function cleanup() {
      if (!cell._inline) return;
      try {
        cell.removeChild(input);
      } catch {}
      try {
        cell.removeChild(list);
      } catch {}
      delete cell._inline;
      if (window.__activeInline) delete window.__activeInline;
    }

    function commit() {
      if (!cell._inline) return;
      const v = input.value.trim();
      cell.innerText = v;
      if (v) addToHistory(v);
      cleanup();
    }

    cell._inline = { input, commit };
    window.__activeInline = { cell, input, commit };

    setTimeout(() => {
      try {
        input.focus();
        input.select();
      } catch {}
    }, 0);

    input.addEventListener("blur", () => setTimeout(commit, 0));
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        cell.innerText = prevText;
        cleanup();
      } else if (ev.key === "Tab") setTimeout(() => commit(), 0);
    });
  }

  // ---------- KM marking ----------
  function markKmErrorForRow(row) {
    if (!row) return;
    const estCell = row.cells[3];
    if (!estCell) return;
    const raw = estCell.innerText.trim();
    const km = parseFloat(raw);
    const kmNumeric = isNaN(km) ? 0 : km;
    if (raw === "" || kmNumeric < config.minKmAllowed) {
      estCell.classList.add("km-error-cell");
      estCell.title = `Estimated KM (${raw || 0}) is less than minimum ${
        config.minKmAllowed
      }`;
      if (!estCell.querySelector(".km-error-marker")) {
        const marker = document.createElement("span");
        marker.className = "km-error-marker";
        marker.textContent = " ⚠";
        estCell.appendChild(marker);
      }
    } else {
      estCell.classList.remove("km-error-cell");
      estCell.title = "";
      const existing = estCell.querySelector(".km-error-marker");
      if (existing) existing.remove();
    }
  }

  function checkAllKmAndMark() {
    fleetBody.querySelectorAll("tr").forEach((row) => markKmErrorForRow(row));
  }

  // ---------- export / exposures ----------
  function exportTableData() {
    const data = [];
    const headers = [];
    const headerRow = fleetTable.tHead?.rows[0];
    if (headerRow) {
      for (let cell of headerRow.cells) headers.push(cell.innerText.trim());
    }
    const rows = fleetBody.querySelectorAll("tr");
    rows.forEach((row) => {
      const rowData = {};
      for (let i = 0; i < row.cells.length; i++) {
        if (headers[i])
          rowData[headers[i]] = (row.cells[i].innerText || "").trim();
      }
      data.push(rowData);
    });
    console.log("Table Data:", data);
    alert("Data exported to console. Check developer tools (F12).");
    return data;
  }

  window.saveChanges = function () {
    recalcAllRows();
    alert("All rates updated successfully!");
    saveStateDebounced();
  };
  window.addRow = addRow;
  window.cloneKmColumn = () => cloneColumn("km");
  window.cloneDayColumn = () => cloneColumn("day");
  window.exportTableData = exportTableData;

  // ---------- Snapshot list & restore helpers (UI friendly) ----------
  async function listSnapshots() {
    try {
      const res = await fetch(config.serverListEndpoint);
      if (!res.ok) {
        console.warn("Failed to list snapshots:", res.status);
        return [];
      }
      const arr = await res.json();
      return Array.isArray(arr) ? arr : [];
    } catch (err) {
      console.warn("Failed to list snapshots:", err);
      return [];
    }
  }

  async function restoreSnapshotById(id) {
    try {
      const res = await fetch(config.serverGetByIdEndpoint + id);
      if (!res.ok) {
        alert("Failed to fetch snapshot: " + res.status);
        return false;
      }
      const doc = await res.json();
      const meta = doc.meta || {};
      if (meta.tHeadHTML && fleetTable.tHead) {
        try {
          fleetTable.tHead.innerHTML = meta.tHeadHTML;
        } catch (e) {
          console.warn("thead restore:", e);
        }
      }
      if (meta.tBodyHTML) fleetBody.innerHTML = meta.tBodyHTML;
      if (Array.isArray(meta.kmRateCols)) config.kmRateCols = meta.kmRateCols;
      if (Array.isArray(meta.dayRateCols))
        config.dayRateCols = meta.dayRateCols;
      if (typeof meta.minKmAllowed === "number")
        config.minKmAllowed = meta.minKmAllowed;
      if (meta.kmRangeHTML && kmRangeOptions)
        kmRangeOptions.innerHTML = meta.kmRangeHTML;
      // re-wire
      makeAllCellsEditable();
      fleetBody
        .querySelectorAll("tr")
        .forEach((r) => attachRowValidationListeners(r));
      recalcAllRows();
      saveStateDebounced();
      alert("Snapshot restored.");
      return true;
    } catch (err) {
      console.error("restoreSnapshotById error:", err);
      alert("Restore failed (see console).");
      return false;
    }
  }

  // UI binder for listing snapshots in container (if provided)
  async function renderSnapshotList() {
    if (!snapshotListContainer) return;
    snapshotListContainer.innerHTML =
      "<div class='snapshot-list'>Loading...</div>";
    const arr = await listSnapshots();
    if (!arr.length) {
      snapshotListContainer.innerHTML =
        "<div class='snapshot-list'>No snapshots found.</div>";
      return;
    }
    const frag = document.createDocumentFragment();
    const wrapper = document.createElement("div");
    wrapper.className = "snapshot-list";
    arr.forEach((s) => {
      const item = document.createElement("div");
      item.className = "snapshot-item";
      const left = document.createElement("div");
      left.innerText = `${new Date(
        s.meta?.timestamp || s.createdAt || Date.now()
      ).toLocaleString()} • ${s._id || ""}`;
      const right = document.createElement("div");
      const btnRestore = document.createElement("button");
      btnRestore.innerText = "Restore";
      btnRestore.addEventListener("click", () => restoreSnapshotById(s._id));
      const btnDelete = document.createElement("button");
      btnDelete.innerText = "Delete";
      btnDelete.addEventListener("click", async () => {
        if (!confirm("Delete this snapshot?")) return;
        try {
          const del = await fetch(config.serverListEndpoint + "/" + s._id, {
            method: "DELETE",
          });
          if (!del.ok) {
            alert("Delete failed");
            return;
          }
          alert("Deleted.");
          renderSnapshotList();
        } catch (err) {
          console.warn("Delete snapshot failed:", err);
          alert("Delete failed");
        }
      });
      right.appendChild(btnRestore);
      right.appendChild(btnDelete);
      item.appendChild(left);
      item.appendChild(right);
      wrapper.appendChild(item);
    });
    snapshotListContainer.innerHTML = "";
    snapshotListContainer.appendChild(wrapper);
  }

  // ---------- Optional UI button wiring ----------
  if (btnManualSave) {
    btnManualSave.addEventListener("click", async () => {
      saveStateLocal();
      const res = await saveStateServer();
      if (res) alert("Saved snapshot to server: " + (res._id || "OK"));
      else alert("Local save complete. Server save failed or unavailable.");
    });
  }
  if (btnListSnapshots) {
    btnListSnapshots.addEventListener("click", async () =>
      renderSnapshotList()
    );
  }
  if (btnClearSavedState) {
    btnClearSavedState.addEventListener("click", () => {
      if (
        !confirm(
          "Clear local saved state? This will not delete server snapshots."
        )
      )
        return;
      localStorage.removeItem(config.saveKey);
      localStorage.removeItem(config.saveKey + "_lastId");
      alert("Local saved state cleared.");
    });
  }

  // ---------- initialization ----------
  async function initialize() {
    // Attempt to load server state first, fallback to local
    await loadState();

    makeAllCellsEditable();
    kmBaseRates = getBaseRates(config.kmRateCols);
    dayBaseRates = getBaseRates(config.dayRateCols);
    attachKmRangeListeners();
    rebuildRangePercentsFromUI();

    // attach listeners for existing rows
    fleetBody
      .querySelectorAll("tr")
      .forEach((r) => attachRowValidationListeners(r));

    recalcAllRows();
    checkAllKmAndMark();

    // ensure autosave sync between DOM & persisted meta
    saveStateDebounced();
  }

  // kick off
  initialize();
});
