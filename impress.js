/* ------------------ IMPREST / ADVANCE MANAGER (FULL REWRITE) ------------------ */
(function () {
  // ---------- Cached DOM ----------
  const impressAdvanceBtn = document.querySelector(
    'li[data-section="impressAdvance"]'
  );
  const impressAdvanceSection = document.getElementById("impressAdvance");

  const impressForm = document.getElementById("impressForm");
  const advanceGuideForm = document.getElementById("advanceGuideForm");
  const advanceVehForm = document.getElementById("applyAdvanceVehBtn");

  const applyImpressBtn = document.getElementById("applyImpressBtn");
  const applyAdvanceGuideBtn = document.getElementById("applyAdvanceGuideBtn");
  const applyAdvanceVehActionBtn = document.getElementById(
    "applyAdvanceVehActionBtn"
  );

  // print/save buttons inside forms (query by text or style might be unreliable; use button selectors inside each form)
  const impressFormPrintBtn = impressForm?.querySelector(
    "button:nth-last-child(2)"
  ); // "Print and Save"
  const advanceGuidePrintBtn = advanceGuideForm?.querySelector(
    "button:nth-last-child(2)"
  );
  const advanceVehPrintBtn = advanceVehForm?.querySelector(
    "button:nth-last-child(2)"
  );

  // ensure table exists (you already have a table in markup; but create if missing)
  let impressTable = impressAdvanceSection.querySelector("table");
  if (!impressTable) {
    impressTable = document.createElement("table");
    impressTable.style.cssText =
      "width:100%; border-collapse:collapse; border:transparent;";
    impressAdvanceSection.appendChild(impressTable);
  }

  // create/ensure thead
  let impressThead = impressTable.querySelector("thead");
  if (!impressThead) {
    impressThead = document.createElement("thead");
    impressThead.innerHTML = `
      <tr>
        <th class="col-date">Date</th>
        <th class="col-ref">Reference No</th>
        <th class="col-file">File/Group</th>
        <th class="col-payment">Payment Type</th>
        <th class="col-party">Party</th>
        <th class="col-rate-type">Rate Type</th>
        <th class="col-pax">No. of Pax</th>
        <th class="col-amount">Amount</th>
        <th class="col-action">Action</th>
      </tr>
    `;
    impressTable.appendChild(impressThead);
  }

  let impressTableBody = impressTable.querySelector("tbody");
  if (!impressTableBody) {
    impressTableBody = document.createElement("tbody");
    impressTableBody.id = "impressAdvanceTableBody";
    impressTable.appendChild(impressTableBody);
  }

  // ---------- Persistent lastNumber ----------
  const LASTNUM_KEY = "impressAdvance_lastNumber_v1";
  const STORAGE_KEY = "impressAdvance_rows_v1";

  function loadLastNumber() {
    try {
      const raw = localStorage.getItem(LASTNUM_KEY);
      if (!raw) return { Neptune: 0, Ideal: 0 };
      return JSON.parse(raw);
    } catch (e) {
      return { Neptune: 0, Ideal: 0 };
    }
  }
  function saveLastNumber(obj) {
    localStorage.setItem(LASTNUM_KEY, JSON.stringify(obj));
  }
  const lastNumber = loadLastNumber();

  // ---------- Utilities ----------
  function getCompanyAndRefInputForForm(formEl) {
    if (!formEl) return {};
    const companySelect = formEl.querySelector("select");
    // try to find reference input with placeholder containing "Auto" or label "Reference No"
    const referenceInput =
      formEl.querySelector(
        'input[placeholder*="Auto"], input[placeholder*="Auto (Check Comment)"], input[placeholder*="Auto (auto)"]'
      ) ||
      Array.from(formEl.querySelectorAll("input")).find((i) => {
        const label = formEl.querySelector('label[for="' + (i.id || "") + '"]');
        return label && /Reference\s*No/i.test(label.textContent || "");
      }) ||
      null;
    return { companySelect, referenceInput };
  }

  function companyKeyFromValue(val = "") {
    if (!val) return null;
    if (val.toLowerCase().includes("neptune")) return "Neptune";
    if (val.toLowerCase().includes("ideal")) return "Ideal";
    return null;
  }

  // ---------- Reference generation ----------
  function generateReferenceNoForForm(formEl) {
    const { companySelect, referenceInput } =
      getCompanyAndRefInputForForm(formEl);
    if (!companySelect || !referenceInput) return;

    const companyVal = companySelect.value || "";
    const key = companyKeyFromValue(companyVal);
    if (!key) {
      referenceInput.value = "";
      return;
    }

    let prefix = key === "Neptune" ? "NHB/25/ADV/IMP/" : "ITC/25/ADV/IMP/";
    const next = (lastNumber[key] || 0) + 1;
    referenceInput.value = prefix + String(next).padStart(3, "0");
  }

  function incrementLastNumberForForm(formEl) {
    const { companySelect } = getCompanyAndRefInputForForm(formEl);
    if (!companySelect) return;
    const key = companyKeyFromValue(companySelect.value || "");
    if (!key) return;
    lastNumber[key] = (lastNumber[key] || 0) + 1;
    saveLastNumber(lastNumber);
  }

  // ---------- Row management ----------
  function createRowElement(rowData) {
    // rowData: { date, ref, file, paymentType, party, rateType, pax, amount, status }
    const tr = document.createElement("tr");
    tr.dataset.rowId =
      rowData.id || String(Date.now()) + Math.random().toString(36).slice(2, 6);

    tr.innerHTML = `
      <td class="col-date"><input type="date" class="in-date" value="${
        rowData.date || ""
      }" style="width:100%; padding:6px; border:none;" /></td>
      <td class="col-ref"><input type="text" class="in-ref" value="${
        rowData.ref || ""
      }" readonly style="width:100%; padding:6px; border:none; background:#f2f2f2;" /></td>
      <td class="col-file"><input type="text" class="in-file" value="${
        rowData.file || ""
      }" placeholder="File no / Group" style="width:100%; padding:6px; border:none;" /></td>
      <td class="col-payment">
        <select class="payment-type" style="width:100%; padding:6px; border:none;">
          <option value="Imprest">Imprest</option>
          <option value="AdvanceGuide">Advance (Guide)</option>
          <option value="AdvanceVehicle">Advance (Vehicle)</option>
        </select>
      </td>
      <td class="col-party"><input type="text" class="in-party" value="${
        rowData.party || ""
      }" placeholder="Party Name" style="width:100%; padding:6px; border:none;" /></td>
      <td class="col-rate-type">
        <select class="rate-type" style="width:100%; padding:6px; border:none;">
          <option value="">-- Rate Type --</option>
          <option value="EP">EP</option>
          <option value="CP">CP</option>
          <option value="MAP">MAP</option>
          <option value="AP">AP</option>
        </select>
      </td>
      <td class="col-pax"><input type="number" min="0" class="no-of-pax" value="${
        rowData.pax || ""
      }" placeholder="No. of Pax" style="width:100%; padding:6px; border:none;" /></td>
      <td class="col-amount"><input type="number" min="0" class="amount-input" value="${
        rowData.amount || ""
      }" placeholder="Amount" style="width:100%; padding:6px; border:none;" /></td>
      <td class="col-action">
        <select class="row-action" style="width:100%; padding:6px; border:none;">
          <option value="Edit">Edit</option>
          <option value="Delete">Delete</option>
          <option value="Closed">Closed</option>
        </select>
      </td>
    `;

    // set paymentType & rateType & status
    const paymentSelect = tr.querySelector(".payment-type");
    paymentSelect.value = rowData.paymentType || "Imprest";

    const rateSelect = tr.querySelector(".rate-type");
    if (rowData.rateType) rateSelect.value = rowData.rateType;

    // action handler
    const actionSelect = tr.querySelector(".row-action");
    actionSelect.addEventListener("change", (e) => handleRowAction(e, tr));

    // payment change -> visibility
    paymentSelect.addEventListener("change", () => updateRowVisibility(tr));

    // disable inputs if status is closed
    if (rowData.status === "Closed") setRowClosed(tr, true);

    updateRowVisibility(tr);
    return tr;
  }

  function addRow(formEl, paymentType = "Imprest") {
    // read the ref from the form provided (if any)
    const { referenceInput } = getCompanyAndRefInputForForm(
      formEl || impressForm
    );
    if (!referenceInput || !referenceInput.value) {
      // try generate once and proceed anyway
      if (formEl) generateReferenceNoForForm(formEl);
      if (!referenceInput || !referenceInput.value) {
        console.warn("Reference number missing, row will not be added.");
        return;
      }
    }

    const rowData = {
      id: null,
      date: "",
      ref: referenceInput.value,
      file: "",
      paymentType,
      party: "",
      rateType: "",
      pax: "",
      amount: "",
      status: "",
    };

    const tr = createRowElement(rowData);
    impressTableBody.appendChild(tr);

    incrementLastNumberForForm(formEl || impressForm);
    // regenerate ref in the form so the user sees next ref
    if (formEl) generateReferenceNoForForm(formEl);

    // persist rows
    persistAllRowsToStorage();
  }

  function updateRowVisibility(row) {
    const paymentSelect = row.querySelector(".payment-type");
    const isImprest =
      paymentSelect && paymentSelect.value.toLowerCase() === "imprest";
    // show/hide rate/pax/amount depending on whether it's impress
    ["col-rate-type", "col-pax", "col-amount"].forEach((cls) => {
      const cell = row.querySelector(`.${cls}`);
      if (cell) cell.style.display = isImprest ? "" : "none";
    });

    // update header visibility depending on whether any row shows those columns
    const anyImprest = Array.from(impressTableBody.querySelectorAll("tr")).some(
      (r) => {
        const sel = r.querySelector(".payment-type");
        return sel && sel.value.toLowerCase() === "imprest";
      }
    );
    ["col-rate-type", "col-pax", "col-amount"].forEach((cls) => {
      const th = impressTable.querySelector(`th.${cls}`);
      if (th) th.style.display = anyImprest ? "" : "none";
    });
  }

  function handleRowAction(e, row) {
    const action = e.target.value;
    switch (action) {
      case "Edit":
        row.querySelectorAll("input, select").forEach((i) => {
          i.removeAttribute("readonly");
          i.removeAttribute("disabled");
          i.style.background = "";
        });
        break;
      case "Delete":
        row.remove();
        persistAllRowsToStorage();
        break;
      case "Closed":
        setRowClosed(row, true);
        persistAllRowsToStorage();
        break;
    }
    // reset select to "Edit" to avoid accidental repeat of the same action
    e.target.value = "Edit";
    updateRowVisibility(row);
  }

  function setRowClosed(row, closed = true) {
    row.querySelectorAll("input, select").forEach((i) => {
      if (closed) {
        i.setAttribute("readonly", true);
        i.setAttribute("disabled", true);
        i.style.background = "#e0e0e0";
      } else {
        i.removeAttribute("readonly");
        i.removeAttribute("disabled");
        i.style.background = "";
      }
    });
    // ensure action select remains usable - leave last action selector enabled for UI (optional)
    const actionSelect = row.querySelector(".row-action");
    if (actionSelect) {
      actionSelect.removeAttribute("disabled");
      actionSelect.style.background = "";
    }
  }

  // ---------- Storage ----------
  function gatherRowsFromDOM() {
    const rows = [];
    for (const tr of impressTableBody.querySelectorAll("tr")) {
      const id = tr.dataset.rowId || null;
      const date = tr.querySelector(".in-date")?.value || "";
      const ref = tr.querySelector(".in-ref")?.value || "";
      const file = tr.querySelector(".in-file")?.value || "";
      const paymentType = tr.querySelector(".payment-type")?.value || "";
      const party = tr.querySelector(".in-party")?.value || "";
      const rateType = tr.querySelector(".rate-type")?.value || "";
      const pax = tr.querySelector(".no-of-pax")?.value || "";
      const amount = tr.querySelector(".amount-input")?.value || "";
      // infer closed by disabled attribute on inputs
      const anyInput = tr.querySelector("input, select");
      const status =
        anyInput && (anyInput.disabled || anyInput.readOnly) ? "Closed" : "";

      rows.push({
        id,
        date,
        ref,
        file,
        paymentType,
        party,
        rateType,
        pax,
        amount,
        status,
      });
    }
    return rows;
  }

  function persistAllRowsToStorage() {
    const rows = gatherRowsFromDOM();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }

  function loadRowsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function renderRowsFromStorage() {
    const rows = loadRowsFromStorage();
    impressTableBody.innerHTML = "";
    rows.forEach((r) => {
      const tr = createRowElement(r);
      // preserve id
      if (r.id) tr.dataset.rowId = r.id;
      impressTableBody.appendChild(tr);
    });
    // ensure header visibility matches
    Array.from(impressTableBody.querySelectorAll("tr")).forEach(
      updateRowVisibility
    );
  }

  // ---------- Print & Save ----------
  function printAndSaveRows(formEl) {
    // gather rows and open a new window with printable table
    const rows = gatherRowsFromDOM();
    if (!rows.length) {
      alert("No rows to print or save.");
      return;
    }

    // Save to storage first
    persistAllRowsToStorage();

    // Build HTML for print
    const html = buildPrintHTML(rows);
    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup blocked — allow popups for this site to print.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    // call print; note: some browsers block programmatic print; user can press print in new window
    try {
      w.print();
    } catch (err) {
      /* ignore */
    }
  }

  function buildPrintHTML(rows) {
    // simple printable table
    const header = `<style>
      body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#000}
      table{width:100%;border-collapse:collapse}
      th,td{padding:8px;border:1px solid #ddd;text-align:left}
      th{background:#f5f5f5}
    </style>`;
    const rowsHtml = rows
      .map(
        (r) => `
      <tr>
        <td>${r.date || ""}</td>
        <td>${r.ref || ""}</td>
        <td>${r.file || ""}</td>
        <td>${r.paymentType || ""}</td>
        <td>${r.party || ""}</td>
        <td>${r.rateType || ""}</td>
        <td>${r.pax || ""}</td>
        <td>${r.amount || ""}</td>
        <td>${r.status || ""}</td>
      </tr>`
      )
      .join("");

    return `<!doctype html><html><head><meta charset="utf-8"><title>Imprest/Advance Print</title>${header}</head><body>
      <h2>Imprest / Advance Report</h2>
      <table><thead>
      <tr><th>Date</th><th>Reference No</th><th>File/Group</th><th>Payment Type</th><th>Party</th><th>Rate Type</th><th>No. Pax</th><th>Amount</th><th>Status</th></tr>
      </thead><tbody>${rowsHtml}</tbody></table>
      </body></html>`;
  }

  // ---------- Pagination (simple placeholders) ----------
  const prevBtn = impressAdvanceSection.querySelector("#prevHotelPageBtn");
  const nextBtn = impressAdvanceSection.querySelector("#nextHotelPageBtn");
  let currentPage = 1;
  const PAGE_SIZE = 10;

  function renderPage(page = 1) {
    const rows = loadRowsFromStorage();
    const start = (page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    impressTableBody.innerHTML = "";
    pageRows.forEach((r) => {
      const tr = createRowElement(r);
      if (r.id) tr.dataset.rowId = r.id;
      impressTableBody.appendChild(tr);
    });
    // updatePrev/Next disabled state
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = start + PAGE_SIZE >= rows.length;
  }

  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    });
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      const rows = loadRowsFromStorage();
      if (currentPage * PAGE_SIZE < rows.length) {
        currentPage++;
        renderPage(currentPage);
      }
    });

  // ---------- Show/Hide forms ----------
  function hideAllForms() {
    [impressForm, advanceGuideForm, advanceVehForm].forEach((f) => {
      if (f) f.style.display = "none";
    });
    // show table container
    if (impressTable.parentElement)
      impressTable.parentElement.style.display = "";
  }

  function showImpressForm() {
    hideAllForms();
    if (impressForm) {
      impressForm.style.display = "block";
      generateReferenceNoForForm(impressForm);
    }
  }
  function showAdvanceGuideForm() {
    hideAllForms();
    if (advanceGuideForm) {
      advanceGuideForm.style.display = "block";
      generateReferenceNoForForm(advanceGuideForm);
    }
  }
  function showAdvanceVehicleForm() {
    hideAllForms();
    if (advanceVehForm) {
      advanceVehForm.style.display = "block";
      generateReferenceNoForForm(advanceVehForm);
    }
  }

  // ---------- Listeners ----------
  // toggle whole section
  impressAdvanceBtn?.addEventListener("click", () => {
    const current = getComputedStyle(impressAdvanceSection).display;
    impressAdvanceSection.style.display = current === "none" ? "block" : "none";
    // render first page upon show
    if (getComputedStyle(impressAdvanceSection).display !== "none") {
      renderPage(1);
    }
  });

  // Buttons to open forms + add initial row
  applyImpressBtn?.addEventListener("click", () => {
    showImpressForm();
    addRow(impressForm, "Imprest");
    persistAllRowsToStorage();
  });
  applyAdvanceGuideBtn?.addEventListener("click", () => {
    showAdvanceGuideForm();
    addRow(advanceGuideForm, "AdvanceGuide");
    persistAllRowsToStorage();
  });
  applyAdvanceVehActionBtn?.addEventListener("click", () => {
    showAdvanceVehicleForm();
    addRow(advanceVehForm, "AdvanceVehicle");
    persistAllRowsToStorage();
  });

  // company select changes inside ANY form -> regenerate that form's ref
  [impressForm, advanceGuideForm, advanceVehForm].forEach((formEl) => {
    if (!formEl) return;
    const sel = formEl.querySelector("select");
    if (!sel) return;
    sel.addEventListener("change", () => generateReferenceNoForForm(formEl));
  });

  // print and save buttons for each form
  if (impressFormPrintBtn)
    impressFormPrintBtn.addEventListener("click", () =>
      printAndSaveRows(impressForm)
    );
  if (advanceGuidePrintBtn)
    advanceGuidePrintBtn.addEventListener("click", () =>
      printAndSaveRows(advanceGuideForm)
    );
  if (advanceVehPrintBtn)
    advanceVehPrintBtn.addEventListener("click", () =>
      printAndSaveRows(advanceVehForm)
    );

  // when any input in table changes -> persist
  impressTableBody.addEventListener("input", () => persistAllRowsToStorage());
  impressTableBody.addEventListener("change", () => persistAllRowsToStorage());

  // load existing rows on init
  function init() {
    // restore stored rows into table and show first page
    renderPage(1);
  }

  init();

  // expose some helpers for debugging (optional)
  window.__impressAdvance = {
    addRow: (formName, type) => {
      const mapping = {
        impress: impressForm,
        guide: advanceGuideForm,
        vehicle: advanceVehForm,
      };
      addRow(mapping[formName] || impressForm, type || "Imprest");
      persistAllRowsToStorage();
    },
    getRows: loadRowsFromStorage,
    clearAllRows: () => {
      localStorage.removeItem(STORAGE_KEY);
      impressTableBody.innerHTML = "";
    },
  };
})();
