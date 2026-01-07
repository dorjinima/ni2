(function () {
  "use strict";

  // Storage key
  const STORAGE_KEY = "waterKhadar_clean_v2";

  // Helper to get element by id
  const $ = (id) => document.getElementById(id);

  // DOM ready
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // Elements referenced in your HTML
    const form = $("addForm");
    const container = $("waterFormContainer");
    const addBtn = $("waterAddBtn");
    const cancelBtn = $("cancelBtn2025");
    const tableBody = $("waterTableBody");
    const searchInput = $("search");
    const searchBtn = $("searchBtn");
    const tableWrap = document.querySelector(".table-wrap");

    const guideText = $("guideText");
    const fileNo = $("fileNo");
    const driverName = $("driverName"); // optional - may be null
    const billNo = $("billNo");
    const qtyWaterTotalEl = $("qtyWaterTotal");
    const qtyKhadarTotalEl = $("qtyKhadarTotal");
    const itemsArea = $("itemsArea");

    // optional date inputs - may not exist in provided HTML but supported if added
    const arrivalDateEl = $("arrivalDate");
    const departureDateEl = $("departureDate");

    // Pagination
    const prevBtn = $("prevwaterkPageBtn");
    const nextBtn = $("nextwaterkPageBtn");
    const PAGE_SIZE = 8;
    let currentPage = 0;

    // Editing state
    let editIndex = null;

    // utility: safe JSON parse
    function safeParse(json) {
      try {
        return JSON.parse(json || "[]");
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
    }

    function loadAll() {
      return safeParse(localStorage.getItem(STORAGE_KEY));
    }
    function saveAll(rows) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }

    const num = (v) => {
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };

    const esc = (s) =>
      s == null
        ? ""
        : String(s).replace(
            /[&<>"']/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              }[c])
          );

    const ymd = (v) => {
      if (!v && v !== 0) return "";
      const dt = new Date(v);
      if (isNaN(dt)) return String(v);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(dt.getDate()).padStart(2, "0")}`;
    };

    // Migrate some legacy driver keys if present (keeps data robust)
    (function migrateLegacyDriverKeys() {
      const rows = loadAll();
      let changed = false;
      rows.forEach((r) => {
        if (!r.driverName && (r.driver || r.driver_name || r.dname)) {
          r.driverName = r.driver || r.driver_name || r.dname || "";
          changed = true;
        }
      });
      if (changed) saveAll(rows);
    })();

    // Create a single item row (date, particular select, qty, store, balance, remark, buttons)
    function createItemRow(data = {}) {
      const wrapper = document.createElement("div");
      wrapper.className = "items-row";
      wrapper.style.cssText =
        "display:flex;gap:8px;align-items:center;flex-wrap:nowrap;";

      // date
      const d = document.createElement("input");
      d.type = "date";
      d.name = "itemDate[]";
      d.className = "col-date";
      d.value = data.date ? ymd(data.date) : "";
      d.style.cssText =
        "border-radius:6px;height:34px;padding:6px 8px;border:1px solid #ddd;width:120px;flex:0 0 120px;box-sizing:border-box;";

      // particular (Water / Khadar)
      const part = document.createElement("select");
      part.name = "itemParticular[]";
      part.className = "col-part";
      part.style.cssText =
        "border-radius:6px;height:34px;padding:6px 8px;border:1px solid #ddd;width:140px;flex:0 0 140px;box-sizing:border-box;";
      ["Water", "Khadar"].forEach((v) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        part.appendChild(o);
      });
      part.value = data.particular || "Water";

      // qty
      const qty = document.createElement("input");
      qty.type = "number";
      qty.min = "0";
      qty.step = "1";
      qty.name = "itemQty[]";
      qty.className = "col-qty";
      qty.placeholder = "Qty";
      qty.value = data.qty !== undefined ? data.qty : 0;
      qty.style.cssText =
        "border-radius:6px;height:34px;padding:6px 8px;border:1px solid #ddd;width:90px;flex:0 0 90px;box-sizing:border-box;";
      qty.addEventListener("input", updateBalances);

      // store
      const store = document.createElement("select");
      store.name = "itemStore[]";
      store.className = "col-store";
      store.style.cssText =
        "border-radius:6px;height:34px;padding:6px 8px;border:1px solid #ddd;width:120px;flex:0 0 120px;box-sizing:border-box;";
      ["Office", "Shop"].forEach((v) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        store.appendChild(o);
      });
      store.value = data.store || "Office";

      // balance display
      const balanceDiv = document.createElement("div");
      balanceDiv.className = "col-balance";
      balanceDiv.style.cssText =
        "width:90px;flex:0 0 90px;display:flex;align-items:center;justify-content:center;background:#f7efe0;border:2px solid #e5d1a9;font-weight:700;color:#6b512d;border-radius:6px;height:34px;box-sizing:border-box;";
      balanceDiv.textContent = "0";

      // remark
      const remark = document.createElement("input");
      remark.type = "text";
      remark.name = "itemRemark[]";
      remark.className = "col-remark";
      remark.placeholder = "Remark / Taken by";
      remark.value = data.remark || "";
      remark.style.cssText =
        "border-radius:6px;height:34px;padding:6px 8px;border:1px solid #ddd;width:160px;flex:0 0 160px;box-sizing:border-box;font-size:13px;";

      // buttons
      const btnWrap = document.createElement("div");
      btnWrap.style.cssText =
        "display:flex;gap:6px;flex:0 0 70px;justify-content:center;";
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn-add";
      addBtn.title = "Add row";
      addBtn.style.cssText =
        "background:#4e7a2b;color:#fff;border-radius:6px;padding:6px 10px;border:0;cursor:pointer;font-weight:700;height:34px;box-sizing:border-box;";
      addBtn.textContent = "+";
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-remove";
      removeBtn.title = "Remove row";
      removeBtn.style.cssText =
        "background:#d32f2f;color:#fff;border-radius:6px;padding:6px 8px;border:0;cursor:pointer;font-weight:700;height:34px;box-sizing:border-box;";
      removeBtn.textContent = "−";
      btnWrap.appendChild(addBtn);
      btnWrap.appendChild(removeBtn);

      // mark auto-created rows if needed
      if (data.__autoCreated) wrapper.dataset.auto = "1";

      addBtn.addEventListener("click", () => {
        // insert a new blank row after this one
        wrapper.parentNode.insertBefore(createItemRow({}), wrapper.nextSibling);
        updateBalances();
      });
      removeBtn.addEventListener("click", () => {
        const all = itemsArea.querySelectorAll(".items-row");
        if (all.length <= 1) {
          // keep one empty row rather than removing last
          d.value = "";
          part.value = "Water";
          qty.value = 0;
          store.value = "Office";
          remark.value = "";
        } else wrapper.remove();
        updateBalances();
      });

      part.addEventListener("change", updateBalances);
      store.addEventListener("change", updateBalances);

      wrapper.append(d, part, qty, store, balanceDiv, remark, btnWrap);
      return wrapper;
    }

    // Ensure there is at least one row in itemsArea
    function ensureAtLeastOneRow() {
      if (!itemsArea.querySelector(".items-row"))
        itemsArea.appendChild(createItemRow({}));
    }

    // If Data-Details table exists, attempt to compute pax -> totals
    function getNights() {
      if (!arrivalDateEl?.value || !departureDateEl?.value) return 1;
      const arr = new Date(arrivalDateEl.value),
        dep = new Date(departureDateEl.value);
      return Math.max(1, Math.ceil((dep - arr) / (1000 * 60 * 60 * 24)));
    }

    function calculateTotalsFromPax() {
      // A graceful approach: if no #Data-Details table is present, bail out
      const dataTable = document.querySelector("#Data-Details tbody");
      if (!dataTable) return;
      let totalPax = 0;
      dataTable
        .querySelectorAll("input[type='number']")
        .forEach((inp) => (totalPax += num(inp.value)));
      const nights = getNights();
      if (qtyWaterTotalEl) qtyWaterTotalEl.value = totalPax * 2 * nights;
      if (qtyKhadarTotalEl) qtyKhadarTotalEl.value = totalPax * 1;
      updateBalances();
      autoFillKhadarIfNeeded();
    }

    // If Khadar total set but no Khadar rows entered, auto fill one
    function autoFillKhadarIfNeeded() {
      const kTot = num(qtyKhadarTotalEl?.value);
      if (!kTot) return;
      const rows = Array.from(itemsArea.querySelectorAll(".items-row"));
      const khadarSum = rows.reduce(
        (sum, r) =>
          sum +
          (r.querySelector(".col-part").value === "Khadar"
            ? num(r.querySelector(".col-qty").value)
            : 0),
        0
      );
      if (khadarSum > 0) return;
      const emptyRow = rows.find(
        (r) =>
          !r.querySelector(".col-date").value &&
          (!r.querySelector(".col-qty").value ||
            r.querySelector(".col-qty").value == 0) &&
          !r.querySelector(".col-remark").value
      );
      if (emptyRow) {
        emptyRow.querySelector(".col-part").value = "Khadar";
        emptyRow.querySelector(".col-qty").value = kTot;
        emptyRow.dataset.auto = "1";
      } else
        itemsArea.appendChild(
          createItemRow({
            particular: "Khadar",
            qty: kTot,
            store: "Office",
            __autoCreated: true,
          })
        );
      updateBalances();
    }

    // Recalculate taken sums and update balance display per row
    function updateBalances() {
      const wTot = num(qtyWaterTotalEl?.value);
      const kTot = num(qtyKhadarTotalEl?.value);
      let wSum = 0,
        kSum = 0;
      Array.from(itemsArea.querySelectorAll(".items-row")).forEach((row) => {
        const part = row.querySelector(".col-part"),
          qtyEl = row.querySelector(".col-qty"),
          balDiv = row.querySelector(".col-balance"),
          q = num(qtyEl.value);
        if (part.value === "Water") wSum += q;
        if (part.value === "Khadar") kSum += q;
        if (balDiv)
          balDiv.textContent =
            part.value === "Water" ? String(wTot - wSum) : String(kTot - kSum);
      });
      if (qtyWaterTotalEl) qtyWaterTotalEl.dataset.taken = String(wSum);
      if (qtyKhadarTotalEl) qtyKhadarTotalEl.dataset.taken = String(kSum);
    }

    // Collect form into a data object for storage
    function collectForm() {
      const rowsEls = Array.from(itemsArea.querySelectorAll(".items-row"));
      const itemDate = rowsEls.map(
        (r) => r.querySelector(".col-date").value || ""
      );
      const itemParticular = rowsEls.map(
        (r) => r.querySelector(".col-part").value || "Water"
      );
      const itemQty = rowsEls.map((r) =>
        num(r.querySelector(".col-qty").value || 0)
      );
      const itemStore = rowsEls.map(
        (r) => r.querySelector(".col-store").value || "Office"
      );
      const itemRemark = rowsEls.map(
        (r) => r.querySelector(".col-remark").value || ""
      );
      let wSum = 0,
        kSum = 0;
      itemParticular.forEach((p, i) => {
        if (p === "Water") wSum += itemQty[i];
        if (p === "Khadar") kSum += itemQty[i];
      });
      return {
        fileNo: fileNo.value.trim(),
        guide: guideText.value.trim(),
        driverName: driverName ? driverName.value.trim() : "",
        billNo: billNo.value.trim(),
        date: itemDate[0] || "",
        qtyWaterTotal: num(qtyWaterTotalEl.value),
        qtyTakenWater: itemParticular.map((p, i) =>
          p === "Water" ? itemQty[i] : 0
        ),
        itemParticular,
        itemQty,
        itemStore,
        itemDate,
        itemRemark,
        remark: itemRemark.join(" / "),
        balanceWater: num(qtyWaterTotalEl.value) - wSum,
        qtyKhadarTotal: num(qtyKhadarTotalEl.value),
        qtyTakenKhadar: itemParticular.map((p, i) =>
          p === "Khadar" ? itemQty[i] : 0
        ),
        balanceKhadar: num(qtyKhadarTotalEl.value) - kSum,
      };
    }

    // render table (with optional filter and pagination)
    function render(filter = "") {
      if (!tableBody) return;
      const rows = loadAll();
      // filter
      const filteredEntries = rows
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => {
          if (!filter) return true;
          const hay = (
            (r.fileNo || "") +
            " " +
            (r.guide || "") +
            " " +
            (r.driverName || "") +
            " " +
            (r.billNo || "") +
            " " +
            (r.remark || "")
          ).toLowerCase();
          return hay.includes(filter.toLowerCase());
        });

      // Pagination calculations
      const total = filteredEntries.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      currentPage = Math.min(currentPage, pages - 1);
      const start = currentPage * PAGE_SIZE;
      const pageSlice = filteredEntries.slice(start, start + PAGE_SIZE);

      tableBody.innerHTML = "";
      if (!pageSlice.length) {
        tableBody.innerHTML = `<tr><td colspan="10" style="padding:12px;text-align:center;color:#777;">No records</td></tr>`;
        updatePaginationControls(pages);
        return;
      }

      pageSlice.forEach(({ r, idx }) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="padding:10px;border:none;">${esc(r.fileNo || "-")}</td>
          <td style="padding:10px;border:none;">${esc(r.guide || "-")}</td>
          <td style="padding:10px;border:none;">${num(
            r.qtyWaterTotal
          )} / ${r.qtyTakenWater.reduce((a, b) => a + b, 0)} / ${
          r.balanceWater
        }</td>
          <td style="padding:10px;border:none;">${num(
            r.qtyKhadarTotal
          )} / ${r.qtyTakenKhadar.reduce((a, b) => a + b, 0)} / ${
          r.balanceKhadar
        }</td>
          <td style="padding:10px;border:none;">-</td>
          <td style="padding:10px;border:none;">${esc(r.billNo || "-")}</td>
          <td style="padding:10px;border:none;">${esc(r.date || "-")}</td>
          <td style="padding:10px;border:none;">${esc(r.remark || "-")}</td>
          <td style="padding:10px;border:none;">
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="icon-btn" data-idx="${idx}" data-action="edit" title="Edit" style="background:transparent;border:none;cursor:pointer;font-size:16px;">✏️</button>
              <button class="icon-btn" data-idx="${idx}" data-action="delete" title="Delete" style="background:transparent;border:none;cursor:pointer;font-size:16px;color:#d32f2f;">❌</button>
            </div>
          </td>
        `;
        // attach handlers
        tr.querySelectorAll(".icon-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const i = Number(btn.dataset.idx);
            btn.dataset.action === "edit" ? loadToForm(i) : deleteRecord(i);
          });
        });
        tableBody.appendChild(tr);
      });

      updatePaginationControls(pages);
    }

    function updatePaginationControls(totalPages) {
      if (prevBtn) prevBtn.disabled = currentPage <= 0;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
    }

    // delete a record
    function deleteRecord(i) {
      if (!confirm("Delete this record?")) return;
      const rows = loadAll();
      rows.splice(i, 1);
      saveAll(rows);
      // if deleting last on current page, move to previous page if needed
      const totalAfter = rows.length;
      const pagesAfter = Math.max(1, Math.ceil(totalAfter / PAGE_SIZE));
      if (currentPage >= pagesAfter) currentPage = Math.max(0, pagesAfter - 1);
      render(searchInput.value);
    }

    // load record into form for editing
    function loadToForm(i) {
      const rows = loadAll();
      const r = rows[i];
      if (!r) return;
      editIndex = i;
      container.hidden = false;
      if (tableWrap) tableWrap.style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });

      fileNo.value = r.fileNo || "";
      guideText.value = r.guide || "";
      if (driverName) driverName.value = r.driverName || "";
      billNo.value = r.billNo || "";
      if (qtyWaterTotalEl) qtyWaterTotalEl.value = r.qtyWaterTotal || 0;
      if (qtyKhadarTotalEl) qtyKhadarTotalEl.value = r.qtyKhadarTotal || 0;

      itemsArea.innerHTML = "";
      const len = r.itemParticular?.length || 0;
      for (let j = 0; j < len; j++) {
        itemsArea.appendChild(
          createItemRow({
            date: r.itemDate?.[j] || "",
            particular: r.itemParticular[j] || "Water",
            qty: r.itemQty[j] || 0,
            store: r.itemStore[j] || "Office",
            remark: r.itemRemark?.[j] || "",
          })
        );
      }
      ensureAtLeastOneRow();
      updateBalances();
      autoFillKhadarIfNeeded();
    }

    // form submit - save new or edited
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = collectForm();
      if (!data.fileNo) return alert("File No / Guest is required");
      const rows = loadAll();
      if (editIndex !== null) rows[editIndex] = data;
      else rows.unshift(data); // newest on top
      saveAll(rows);
      // reset UI
      form.reset();
      itemsArea.innerHTML = "";
      ensureAtLeastOneRow();
      container.hidden = true;
      if (tableWrap) tableWrap.style.display = "";
      editIndex = null;
      currentPage = 0; // jump to first page to show latest
      render(searchInput.value);
    });

    // add new button: show form
    addBtn.addEventListener("click", () => {
      editIndex = null;
      container.hidden = false;
      if (tableWrap) tableWrap.style.display = "none";
      form.reset();
      itemsArea.innerHTML = "";
      ensureAtLeastOneRow();
      updateBalances();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // cancel button
    cancelBtn.addEventListener("click", () => {
      container.hidden = true;
      if (tableWrap) tableWrap.style.display = "";
      form.reset();
      itemsArea.innerHTML = "";
      editIndex = null;
      ensureAtLeastOneRow();
      updateBalances();
    });

    // total inputs update balances; khadar input triggers autoFill
    [qtyWaterTotalEl, qtyKhadarTotalEl].forEach((el) =>
      el?.addEventListener("input", () => {
        updateBalances();
        if (el === qtyKhadarTotalEl) autoFillKhadarIfNeeded();
      })
    );

    // optional: if arrival/departure or Data-Details numbers change, recalc totals
    [arrivalDateEl, departureDateEl].forEach((el) =>
      el?.addEventListener("input", calculateTotalsFromPax)
    );
    document
      .querySelectorAll("#Data-Details input[type='number']")
      .forEach((inp) => inp.addEventListener("input", calculateTotalsFromPax));

    // search
    searchInput.addEventListener("input", () => {
      currentPage = 0;
      render(searchInput.value);
    });
    searchBtn?.addEventListener("click", () => {
      currentPage = 0;
      render(searchInput.value);
    });

    // pagination handlers
    prevBtn?.addEventListener("click", () => {
      if (currentPage > 0) {
        currentPage--;
        render(searchInput.value);
      }
    });
    nextBtn?.addEventListener("click", () => {
      // compute pages from filtered length
      const rows = loadAll();
      const filtered = rows.filter((r) => {
        const f = searchInput.value || "";
        if (!f) return true;
        const hay = (
          (r.fileNo || "") +
          " " +
          (r.guide || "") +
          " " +
          (r.driverName || "") +
          " " +
          (r.billNo || "") +
          " " +
          (r.remark || "")
        ).toLowerCase();
        return hay.includes(f.toLowerCase());
      });
      const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (currentPage < pages - 1) {
        currentPage++;
        render(searchInput.value);
      }
    });

    // initial setup
    ensureAtLeastOneRow();
    updateBalances();
    render();

    // If there is a qtyKhadarTotal prefilled, attempt auto fill
    autoFillKhadarIfNeeded();
  }
})();
