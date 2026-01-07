// ================= GROUP CHART MAIN JAVASCRIPT =================
document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "groupChartRecords";
  const addGroupBtn = document.getElementById("addgroupbht");
  const groupForm = document.getElementById("addGroupchartForm");
  const searchInput = document.getElementById("searchHotel");
  const searchBtn = document.getElementById("searchHotelBtn");

  const styledTableBody = document.querySelector(
    "table[aria-label='Group Chart Table'] tbody"
  );

  const tableContainer = document.querySelector(
    "div[style*='max-height:400px']"
  );

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) =>
    Array.from((root || document).querySelectorAll(sel));

  // Early return if groupForm doesn't exist (for other pages)
  if (!groupForm) {
    initSideBtns();
    return;
  }

  /* ============================
     Storage helpers
  ============================ */
  function readStorage() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      console.error("Failed parse storage", e);
      return [];
    }
  }

  function writeStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed write storage", e);
    }
  }

  /* ============================
     Render main table with ALL DATA
  ============================ */
  /* ============================
     Render main table with ALL DATA
  ============================ */
  function renderMainTable() {
    const data = readStorage();
    if (!styledTableBody) return;

    styledTableBody.innerHTML = "";

    if (!data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 18; // matches table columns (including Actions)
      td.style.textAlign = "center";
      td.style.color = "#888";
      td.style.padding = "20px";
      td.textContent = "No records found. Add a new group to see records here.";
      tr.appendChild(td);
      styledTableBody.appendChild(tr);
      return;
    }

    data.forEach((record, idx) => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid #e0e0e0";

      const makeCell = (txt) => {
        const td = document.createElement("td");
        td.style.border = "none";
        td.style.padding = "8px 10px";
        td.style.textAlign = "center";
        td.style.fontSize = "13px";
        td.textContent = txt === undefined || txt === null ? "-" : txt;
        return td;
      };

      // 1. Sl No.
      tr.appendChild(makeCell(idx + 1));

      // 2. Date of Confirmation
      tr.appendChild(makeCell(record.confirmationDate || "-"));

      // 3. Booking Id
      tr.appendChild(makeCell(record.fileNo || "-"));

      // 4. Company
      tr.appendChild(makeCell(record.company || "-"));

      // 5. Group Name / Guest Name
      tr.appendChild(makeCell(record.groupName || "-"));

      // 6. Hotel Name (first hotel)
      let hotelName = "-";
      if (Array.isArray(record.hotelDetails) && record.hotelDetails.length) {
        hotelName =
          record.hotelDetails[0].hotelName ||
          record.hotelDetails[0].category ||
          "-";
      }
      tr.appendChild(makeCell(hotelName));

      // 7. Room Booking (count)
      const roomCount = Array.isArray(record.hotelDetails)
        ? record.hotelDetails.length
        : 0;
      tr.appendChild(makeCell(roomCount ? `${roomCount} rooms` : "-"));

      // 8. No of Pax (Regional)
      tr.appendChild(makeCell(record.paxRgnl || 0));

      // 9. No of Pax (Int'l)
      tr.appendChild(makeCell(record.paxIntl || 0));

      // 10. Arrival Date
      tr.appendChild(makeCell(record.arrivalDate || "-"));

      // 11. Departure Date
      tr.appendChild(makeCell(record.departureDate || "-"));

      // 12. No of Nights
      tr.appendChild(makeCell(record.noOfNights || "-"));

      // 13. Arrival Sector & Details
      tr.appendChild(makeCell(record.arrivalSector || "-"));

      // 14. Departure Sector & Details
      tr.appendChild(makeCell(record.departureSector || "-"));

      // 15. Guide Details
      tr.appendChild(makeCell(record.guideDetails || "-"));

      // 16. Vehicle Details (Bhutan)
      tr.appendChild(makeCell(record.vehicleDetailsBhutan || "-"));

      // 17. Vehicle Details (India)
      tr.appendChild(makeCell(record.vehicleDetailsIndia || "-"));

      // 18. Actions
      const actionTd = document.createElement("td");
      actionTd.style.textAlign = "center";
      actionTd.style.border = "none";
      actionTd.style.padding = "8px";

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className = "edit-btn";
      editBtn.style.cssText =
        "padding:4px 12px;margin-right:6px;background:#4CAF50;color:#fff;border:none;border-radius:4px;cursor:pointer";
      editBtn.addEventListener("click", () => openEditModal(idx, record));

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";
      delBtn.style.cssText =
        "padding:4px 12px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer";
      delBtn.addEventListener("click", () => {
        if (!confirm("Are you sure to delete this record?")) return;
        const all = readStorage();
        all.splice(idx, 1);
        writeStorage(all);
        renderMainTable();
      });

      actionTd.appendChild(editBtn);
      actionTd.appendChild(delBtn);
      tr.appendChild(actionTd);

      styledTableBody.appendChild(tr);
    });
  }
  /* ============================
     Open edit modal
  ============================ */
  function openEditModal(index, record) {
    try {
      groupForm.style.display = "block";
      const wrapperNode = document.querySelector(".group-form-actions");
      if (wrapperNode) wrapperNode.style.display = "flex";

      if (tableContainer) tableContainer.style.display = "none";

      // Populate all form fields
      const elems = groupForm.querySelectorAll("input, select, textarea");
      elems.forEach((el) => {
        const key = el.name || el.id;
        if (!key) return;
        if (record.hasOwnProperty(key)) {
          if (el.type === "checkbox") {
            el.checked = Boolean(record[key]);
          } else {
            el.value = record[key];
          }
        }
      });

      // Populate company and fileNo
      const companySelect = document.getElementById("groupchart-company");
      const bookingInput = document.getElementById("groupchart-fileNo");

      if (companySelect && record.company) {
        companySelect.value = record.company;
        companySelect.dispatchEvent(new Event("change"));
      }

      if (bookingInput && record.fileNo) {
        bookingInput.value = record.fileNo;
      }

      // Set edit index
      let editIndexField = groupForm.querySelector('input[name="__editIndex"]');
      if (!editIndexField) {
        editIndexField = document.createElement("input");
        editIndexField.type = "hidden";
        editIndexField.name = "__editIndex";
        groupForm.appendChild(editIndexField);
      }
      editIndexField.value = index;

      groupForm.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error("openEditModal failed", e);
      alert("Error loading record for editing.");
    }
  }

  /* ============================
     Search functionality
  ============================ */
  function initSearch() {
    if (!searchBtn || !searchInput) return;

    searchBtn.addEventListener("click", () => {
      const term = searchInput.value.trim().toLowerCase();
      const all = readStorage();

      if (!term) {
        renderMainTable();
        return;
      }

      const filtered = all.filter((r) => {
        return (
          (r.groupName && r.groupName.toLowerCase().includes(term)) ||
          (r.company && r.company.toLowerCase().includes(term)) ||
          (r.fileNo && r.fileNo.toLowerCase().includes(term)) ||
          (r.notes && r.notes.toLowerCase().includes(term))
        );
      });

      if (!styledTableBody) return;
      styledTableBody.innerHTML = "";

      if (!filtered.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 19;
        td.style.textAlign = "center";
        td.style.color = "#888";
        td.style.padding = "20px";
        td.textContent = "No matching records found";
        tr.appendChild(td);
        styledTableBody.appendChild(tr);
        return;
      }

      // Display filtered results
      filtered.forEach((record, idx) => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #e0e0e0";

        const makeCell = (txt) => {
          const td = document.createElement("td");
          td.style.border = "none";
          td.style.padding = "8px 10px";
          td.style.textAlign = "center";
          td.style.fontSize = "13px";
          td.textContent = txt === undefined || txt === null ? "-" : txt;
          return td;
        };

        tr.appendChild(makeCell(idx + 1));
        tr.appendChild(makeCell(record.confirmationDate || "-"));

        const bookingGuestCell = document.createElement("td");
        bookingGuestCell.style.border = "none";
        bookingGuestCell.style.padding = "8px 10px";
        bookingGuestCell.style.textAlign = "center";
        bookingGuestCell.innerHTML = `
          <div style="font-weight:500;">${record.fileNo || "-"}</div>
          <div style="font-size:12px; color:#666;">${
            record.groupName || ""
          }</div>
        `;
        tr.appendChild(bookingGuestCell);

        tr.appendChild(makeCell(record.company || "-"));

        let hotelCategory = "-";
        if (record.hotelDetails && record.hotelDetails.length > 0) {
          const firstHotel = record.hotelDetails[0];
          hotelCategory = firstHotel.hotelName || firstHotel.category || "-";
        }
        tr.appendChild(makeCell(hotelCategory));

        const roomCount = record.hotelDetails
          ? Array.isArray(record.hotelDetails)
            ? record.hotelDetails.length
            : 1
          : 0;
        tr.appendChild(makeCell(roomCount > 0 ? `${roomCount} rooms` : "-"));

        tr.appendChild(makeCell(record.paxRgnl || 0));
        tr.appendChild(makeCell(record.paxIntl || 0));

        const totalPax =
          Number(record.paxRgnl || 0) + Number(record.paxIntl || 0);
        tr.appendChild(makeCell(totalPax));

        tr.appendChild(makeCell(record.arrivalDate || "-"));
        tr.appendChild(makeCell(record.departureDate || "-"));
        tr.appendChild(makeCell(record.noOfNights || "-"));
        tr.appendChild(makeCell(record.arrivalSector || "-"));
        tr.appendChild(makeCell(record.departureSector || "-"));
        tr.appendChild(makeCell(record.guideDetails || "-"));
        tr.appendChild(makeCell(record.vehicleDetailsBhutan || "-"));
        tr.appendChild(makeCell(record.vehicleDetailsIndia || "-"));
        tr.appendChild(makeCell(record.notes || "-"));

        const actionTd = document.createElement("td");
        actionTd.style.textAlign = "center";
        actionTd.style.border = "none";
        actionTd.style.padding = "8px";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.style.padding = "4px 12px";
        editBtn.style.marginRight = "6px";
        editBtn.style.background = "#4CAF50";
        editBtn.style.color = "white";
        editBtn.style.border = "none";
        editBtn.style.borderRadius = "4px";
        editBtn.style.cursor = "pointer";
        editBtn.addEventListener("click", () => {
          const all = readStorage();
          const originalIndex = all.findIndex(
            (r) =>
              r.fileNo === record.fileNo &&
              r.groupName === record.groupName &&
              r.confirmationDate === record.confirmationDate
          );
          if (originalIndex !== -1) {
            openEditModal(originalIndex, record);
          }
        });

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.style.padding = "4px 12px";
        delBtn.style.background = "#f44336";
        delBtn.style.color = "white";
        delBtn.style.border = "none";
        delBtn.style.borderRadius = "4px";
        delBtn.style.cursor = "pointer";
        delBtn.addEventListener("click", () => {
          if (!confirm("Are you sure to delete this record?")) return;
          const all = readStorage();
          const originalIndex = all.findIndex(
            (r) =>
              r.fileNo === record.fileNo &&
              r.groupName === record.groupName &&
              r.confirmationDate === record.confirmationDate
          );
          if (originalIndex !== -1) {
            all.splice(originalIndex, 1);
            writeStorage(all);
            initSearch();
          }
        });

        actionTd.appendChild(editBtn);
        actionTd.appendChild(delBtn);
        tr.appendChild(actionTd);
        styledTableBody.appendChild(tr);
      });
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchBtn.click();
      }
    });
  }

  /* ============================
     Tab switching
  ============================ */
  function initTabs() {
    const tabButtons = $$(".tab-button");
    const tabContents = $$(".tab-content");

    if (!tabButtons.length || !tabContents.length) {
      console.warn("Tab elements not found");
      return;
    }

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.dataset.tab;
        tabContents.forEach((tc) =>
          tc.classList.toggle("active", tc.id === target)
        );
      });
    });

    const activeBtn = document.querySelector(".tab-button.active");
    if (activeBtn) {
      const targ = activeBtn.dataset.tab;
      tabContents.forEach((tc) =>
        tc.classList.toggle("active", tc.id === targ)
      );
    }
  }

  /* ============================
     Add group toggle
  ============================ */
  function initAddGroupToggle() {
    if (!addGroupBtn) return;
    addGroupBtn.addEventListener("click", () => {
      const computed = getComputedStyle(groupForm);
      const showForm =
        computed.display === "none" ||
        groupForm.style.display === "none" ||
        groupForm.style.display === "";
      groupForm.style.display = showForm ? "block" : "none";

      const wrapperNode = document.querySelector(".group-form-actions");
      if (wrapperNode) wrapperNode.style.display = showForm ? "flex" : "none";

      if (tableContainer) tableContainer.style.display = showForm ? "none" : "";
      if (showForm)
        groupForm.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (tableContainer)
        tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ============================
     Itinerary generation
  ============================ */
  function generateItinerary() {
    const arrivalInput = document.getElementById("arrivalDate");
    const departureInput = document.getElementById("departureDate");
    const arrivalStationInput = document.getElementById("arrivalStation");
    const departureStationInput = document.getElementById("departureStation");
    const tbody = document.querySelector("#itineraryTable tbody");

    if (!arrivalInput || !departureInput || !tbody) return;

    tbody.innerHTML = "";

    const arrivalDateStr = arrivalInput.value;
    const departureDateStr = departureInput.value;

    if (!arrivalDateStr || !departureDateStr) {
      alert("Please enter both arrival and departure dates.");
      return;
    }

    const start = new Date(arrivalDateStr);
    const end = new Date(departureDateStr);

    if (end < start) {
      alert("Departure date must be after arrival date.");
      return;
    }

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < totalDays; i++) {
      const row = document.createElement("tr");

      const dayCell = document.createElement("td");
      dayCell.textContent = `Day ${i + 1}`;
      row.appendChild(dayCell);

      const dateCell = document.createElement("td");
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      dateCell.textContent = currentDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      row.appendChild(dateCell);

      const fromCell = document.createElement("td");
      const fromInput = document.createElement("input");
      fromInput.type = "text";
      fromInput.placeholder = "From";
      if (i === 0 && arrivalStationInput)
        fromInput.value = arrivalStationInput.value || "";
      fromCell.appendChild(fromInput);
      row.appendChild(fromCell);

      const dayTripCell = document.createElement("td");
      const dayTripInput = document.createElement("input");
      dayTripInput.type = "text";
      dayTripInput.placeholder = "Day Trip";
      dayTripCell.appendChild(dayTripInput);
      row.appendChild(dayTripCell);

      const toCell = document.createElement("td");
      const toInput = document.createElement("input");
      toInput.type = "text";
      toInput.placeholder = "To";
      if (i === totalDays - 1 && departureStationInput)
        toInput.value = departureStationInput.value || "";
      toCell.appendChild(toInput);
      row.appendChild(toCell);

      tbody.appendChild(row);
    }
  }
  window.generateItinerary = generateItinerary;

  /* ============= PERMIT / VISA SECTION GROUP CHART =============== */
  function initTravelerTable() {
    const departureInput = document.getElementById("departureDate");
    const tableBody = document.querySelector("#travelerTable tbody");
    if (!tableBody) return;

    /* ================= AGE ================= */
    function calculateAge(row) {
      const dobInput = row.querySelector('input[name="dob"]');
      const ageInput = row.querySelector('input[name="age"]');
      if (!dobInput || !ageInput) return;

      const dob = new Date(dobInput.value);
      if (isNaN(dob)) return (ageInput.value = "");

      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      if (
        today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      )
        age--;

      ageInput.value = age >= 0 ? `${age} yrs` : "";
    }

    /* ================= VALIDITY ================= */
    function calculateValidity(row) {
      const expiryInput = row.querySelector('input[name="expiryDate"]');
      const validityInput = row.querySelector('input[name="validity"]');
      if (!expiryInput || !validityInput) return;

      const expiry = new Date(expiryInput.value);
      const departure = new Date(departureInput?.value || Date.now());
      if (isNaN(expiry)) return (validityInput.value = "");
      if (expiry < departure) return (validityInput.value = "Expired");

      let years = expiry.getFullYear() - departure.getFullYear();
      let months = expiry.getMonth() - departure.getMonth();
      let days = expiry.getDate() - departure.getDate();

      if (days < 0) {
        months--;
        days += new Date(expiry.getFullYear(), expiry.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      validityInput.value = `${years * 12 + months} months, ${days} days`;
    }

    /* ================= VISA SWITCHING (FINAL) ================= */
    const visaTop = document.getElementById("visaType_top");
    const visaArrival = document.getElementById("visaType_arrival");
    const onlinePanel = document.getElementById("visaPanelOnline");
    const arrivalPanel = document.getElementById("visaPanelArrival");

    if (!visaTop || !onlinePanel || !arrivalPanel) return;

    function show(el) {
      el.style.display = "block";
    }
    function hide(el) {
      el.style.display = "none";
    }

    function switchVisa(value, source) {
      if (source !== "top" && visaTop) visaTop.value = value;
      if (source !== "arrival" && visaArrival) visaArrival.value = value;

      if (value === "arrival") {
        hide(onlinePanel);
        show(arrivalPanel);
      } else {
        show(onlinePanel);
        hide(arrivalPanel);
      }
    }

    visaTop.addEventListener("change", () => switchVisa(visaTop.value, "top"));

    if (visaArrival) {
      visaArrival.addEventListener("change", () =>
        switchVisa(visaArrival.value, "arrival")
      );
    }

    /* INIT */
    switchVisa(visaTop.value, "top");
  }

  /* ============================
     Display-Details sync for PAX
  ============================ */
  function updateDisplayTable() {
    const inputRows = document.querySelectorAll("#Data-Details tbody tr");
    const displayRows = document.querySelectorAll("#Display-Details tbody tr");
    if (!inputRows.length || !displayRows.length) return;
    let totalRgnl = 0,
      totalIntl = 0,
      totalOthr = 0;

    inputRows.forEach((row, i) => {
      const inputs = row.querySelectorAll("input");
      const rgnl = Number(inputs[0].value) || 0;
      const intl = Number(inputs[1].value) || 0;
      const othr = Number(inputs[2].value) || 0;
      const displayCells = displayRows[i]
        ? displayRows[i].querySelectorAll("td")
        : null;
      if (displayCells && displayCells.length >= 4) {
        displayCells[1].textContent = rgnl;
        displayCells[2].textContent = intl;
        displayCells[3].textContent = othr;
      }
      totalRgnl += rgnl;
      totalIntl += intl;
      totalOthr += othr;
    });

    const totalRow = displayRows[displayRows.length - 1];
    if (totalRow) {
      const tds = totalRow.querySelectorAll("td");
      if (tds.length >= 4) {
        tds[1].textContent = totalRgnl;
        tds[2].textContent = totalIntl;
        tds[3].textContent = totalOthr;
      }
    }
  }

  function attachDataDetailListeners() {
    $$("#Data-Details input").forEach((inp) =>
      inp.addEventListener("input", updateDisplayTable)
    );
  }

  /* ============================
     Auto clone traveler rows
  ============================ */
  function autoCloneTravelerRows() {
    let totalVisitors = 1;
    const paxTable = document.querySelector("#Display-Details");
    if (paxTable) {
      const rows = paxTable.querySelectorAll("tbody tr");
      const lastRow = rows[rows.length - 1];
      if (lastRow) {
        const cells = lastRow.querySelectorAll("td");
        totalVisitors = [...cells]
          .slice(1)
          .reduce((sum, c) => sum + (parseInt(c.textContent.trim()) || 0), 0);
      }
    }
    if (totalVisitors <= 0) totalVisitors = 1;

    const permitTable = document.querySelector("#travelerTable tbody");
    const firstRow = permitTable.querySelector("tr");
    if (!firstRow) return;

    permitTable.innerHTML = "";

    for (let i = 0; i < totalVisitors; i++) {
      const clone = firstRow.cloneNode(true);
      clone.querySelectorAll("input, select").forEach((el) => (el.value = ""));
      const numCell = clone.querySelector("td:first-child");
      if (numCell) numCell.textContent = i + 1;
      const nameField = clone.querySelector('input[name="name"]');
      if (nameField) nameField.placeholder = "Traveler " + (i + 1);
      permitTable.appendChild(clone);
    }

    attachAutoCalculations();
  }

  /* ============================
   Traveller and document Auto age and Validity calculation
============================ */
  function attachAutoCalculations() {
    const rows = document.querySelectorAll("#travelerTable tbody tr");
    const departureInput = document.getElementById("departureDate");

    /* ===== HEADER CELLS (CORRECT INDEXES) ===== */
    const expiryHeader = document.querySelector(
      "#travelerTable thead th:nth-child(8)" // Expiry Date
    );
    const validityHeader = document.querySelector(
      "#travelerTable thead th:nth-child(9)" // Validity
    );

    /* ===== DATE DIFFERENCE HELPER ===== */
    function diffYMD(from, to) {
      let f = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      let t = new Date(to.getFullYear(), to.getMonth(), to.getDate());

      if (t < f) return { years: 0, months: 0, days: -1 };

      let years = t.getFullYear() - f.getFullYear();
      let months = t.getMonth() - f.getMonth();
      let days = t.getDate() - f.getDate();

      if (days < 0) {
        months -= 1;
        days += new Date(t.getFullYear(), t.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      return { years, months, days };
    }

    function fmtUnit(n, s, p) {
      return `${n} ${n === 1 ? s : p}`;
    }

    /* ===== CHECK IF ANY PASSPORT EXISTS ===== */
    function anyPassportSelected() {
      return [
        ...document.querySelectorAll('select[name="travelDocument"]'),
      ].some((sel) => sel.value === "Passport");
    }

    /* ===== PROCESS EACH ROW ===== */
    rows.forEach((row) => {
      const expiryInput = row.querySelector('input[name="expiryDate"]');
      const validityInput = row.querySelector('input[name="validity"]');
      const dobInput = row.querySelector('input[name="dob"]');
      const ageInput = row.querySelector('input[name="age"]');
      const docSelect = row.querySelector('select[name="travelDocument"]');

      if (
        !expiryInput ||
        !validityInput ||
        !dobInput ||
        !ageInput ||
        !docSelect
      )
        return;

      const expiryCell = expiryInput.closest("td");
      const validityCell = validityInput.closest("td");

      /* ===== DOCUMENT TYPE VISIBILITY ===== */
      function updateVisibility() {
        const hide =
          docSelect.value === "Voter ID" ||
          docSelect.value === "Birth Certificate";

        // Expiry & Validity cells only
        expiryCell.style.display = hide ? "none" : "";
        validityCell.style.display = hide ? "none" : "";

        if (hide) {
          expiryInput.value = "";
          validityInput.value = "";
        } else if (expiryInput.value) {
          expiryInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // Headers (GLOBAL)
        const showHeaders = anyPassportSelected();
        expiryHeader.style.display = showHeaders ? "" : "none";
        validityHeader.style.display = showHeaders ? "" : "none";
      }

      updateVisibility();
      docSelect.addEventListener("change", updateVisibility);

      /* ===== VALIDITY CALCULATION (PASSPORT ONLY) ===== */
      expiryInput.addEventListener("change", () => {
        if (docSelect.value !== "Passport") return;

        const expiry = new Date(expiryInput.value);
        const depVal = departureInput?.value;

        if (!depVal) return (validityInput.value = "Select departure date");

        const departure = new Date(depVal);
        if (isNaN(expiry)) return (validityInput.value = "");
        if (expiry < departure) return (validityInput.value = "Expired");

        const diff = diffYMD(departure, expiry);
        if (diff.days === -1) return (validityInput.value = "Expired");

        const months = diff.years * 12 + diff.months;
        if (months < 6)
          return (validityInput.value = "Invalid – require 6 months");

        validityInput.value = `${fmtUnit(months, "mth", "mths")} ${fmtUnit(
          diff.days,
          "day",
          "days"
        )}`;
      });

      /* ===== AGE CALCULATION ===== */
      dobInput.addEventListener("change", () => {
        const dob = new Date(dobInput.value);
        if (isNaN(dob)) return (ageInput.value = "");

        const diff = diffYMD(dob, new Date());
        if (diff.days === -1) return (ageInput.value = "Invalid DOB");

        ageInput.value =
          `${fmtUnit(diff.years, "yr", "yrs")} ` +
          `${fmtUnit(diff.months, "mth", "mths")} ` +
          `${fmtUnit(diff.days, "day", "days")}`;
      });
    });
  }

  /* ===== REATTACH AFTER CLONE ===== */
  document.querySelectorAll(".clone-row-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      autoCloneTravelerRows();
      setTimeout(attachAutoCalculations, 10);
    });
  });

  /* ============================
     Rooming list add/remove
  ============================ */
  function initRoomingList() {
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("addInnerRowBtn")) {
        const table = e.target
          .closest(".guestInnerTable")
          .querySelector("tbody");
        const newRow = table.rows[0].cloneNode(true);
        newRow.querySelectorAll("input").forEach((i) => (i.value = ""));
        table.appendChild(newRow);
      }
      if (e.target.classList.contains("removeInnerRowBtn")) {
        const row = e.target.closest("tr");
        const table = e.target
          .closest(".guestInnerTable")
          .querySelector("tbody");
        if (table.rows.length > 1) row.remove();
      }
      if (e.target.classList.contains("addMainRowBtn")) {
        const mainTable = document.querySelector("#roomingListTable tbody");
        const newRow = e.target.closest(".mainRow").cloneNode(true);
        newRow.querySelectorAll("input").forEach((i) => (i.value = ""));
        mainTable.appendChild(newRow);
      }
      if (e.target.classList.contains("removeMainRowBtn")) {
        const row = e.target.closest(".mainRow");
        const mainTable = document.querySelector("#roomingListTable tbody");
        if (mainTable.rows.length > 1) row.remove();
      }
    });
  }

  /* ============================
     Side buttons
  ============================ */
  function initSideBtns() {
    document.querySelectorAll(".sideBtn").forEach((btn) => {
      btn.addEventListener("click", function () {
        document
          .querySelectorAll(".sideBtn")
          .forEach((b) => (b.style.background = "#4e9f50"));
        this.style.background = "#3e8e41";
        document
          .querySelectorAll(".content-section")
          .forEach((sec) => (sec.style.display = "none"));
        const target = this.dataset.content;
        const el = document.getElementById(target);
        if (el) el.style.display = "block";
      });
    });
  }

  /* ============================
     Print/share welcome letter
  ============================ */
  function printWelcomeLetter() {
    const buttons = document.querySelectorAll(".action-btn");
    buttons.forEach((btn) => (btn.style.display = "none"));
    const contentEl = document.getElementById("welcome");
    if (!contentEl) {
      buttons.forEach((btn) => (btn.style.display = ""));
      return;
    }
    const content = contentEl.innerHTML;
    const w = window.open("", "", "height=700,width=900");
    w.document.write("<html><head><title>Welcome Letter</title>");
    w.document.write(
      "<style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;padding:20px;} h3{color:#2e5939;}</style>"
    );
    w.document.write("</head><body>");
    w.document.write(content);
    w.document.write("</body></html>");
    w.document.close();
    w.onload = function () {
      w.focus();
      w.print();
      w.close();
      buttons.forEach((btn) => (btn.style.display = ""));
    };
  }
  window.printWelcomeLetter = printWelcomeLetter;

  function shareWelcomeLetter() {
    const contentEl = document.getElementById("welcome");
    if (!contentEl) return alert("Nothing to share");
    const text =
      contentEl.innerText || contentEl.textContent || "Welcome Letter";
    if (navigator.share) {
      navigator
        .share({ title: "Welcome Letter", text })
        .catch((err) => console.warn("Share cancelled", err));
    } else {
      navigator.clipboard &&
        navigator.clipboard
          .writeText(text)
          .then(() => {
            alert("Welcome letter text copied to clipboard.");
          })
          .catch(() => {
            alert("Share not available on this browser.");
          });
    }
  }
  window.shareWelcomeLetter = shareWelcomeLetter;

  /* ============================
     SERVICES INCLUSION SECTION
  ============================ */
  function attachAsSpecifiedListener() {
    const root = document.getElementById("serviceForm");
    if (!root) return;
    const arrivalDateInput = document.getElementById("arrivalDate");
    const departureDateInput = document.getElementById("departureDate");
    const arrivalStationInput = document.getElementById("arrivalStation");
    const departureStationInput = document.getElementById("departureStation");

    function fmt(d) {
      const dd = d.getDate();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}-${monthNames[d.getMonth()]}-${yy}`;
    }

    function dateRange(a, b) {
      if (!(a instanceof Date) || !(b instanceof Date) || isNaN(a) || isNaN(b))
        return [];
      const arr = [];
      const start = a <= b ? new Date(a) : new Date(b);
      const end = a <= b ? new Date(b) : new Date(a);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
        arr.push(new Date(d));
      return arr;
    }

    function parseDateFromInput(input) {
      if (!input) return null;
      const v = (input.value || "").trim();
      if (!v) return null;
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      if (iso.test(v)) return new Date(v + "T00:00:00");
      const d = new Date(v);
      if (!isNaN(d)) return d;
      return null;
    }

    function buildAsSpecifiedTable(section, dates = []) {
      const wrapper = document.createElement("div");
      wrapper.className = "as-specified-wrapper";
      wrapper.style.marginTop = "10px";

      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "separate";
      table.style.borderSpacing = "5px 0";
      table.style.fontSize = "13px";

      const tbody = document.createElement("tbody");

      function addRow(dateValue = "") {
        const tr = document.createElement("tr");
        function styleInput(input) {
          input.style.width = "75%";
          input.style.padding = "5px";
          input.style.margin = "5px";
          input.style.border = "1px solid #ccc";
          input.style.borderRadius = "4px";
          input.style.boxSizing = "border-box";
          input.style.display = "inline-block";
        }

        const tdDate = document.createElement("td");
        tdDate.style.padding = "0";
        const dateInput = document.createElement("input");
        dateInput.type = "text";
        dateInput.value = dateValue;
        dateInput.readOnly = true;
        dateInput.placeholder = "Enter date";
        styleInput(dateInput);
        tdDate.appendChild(dateInput);

        const tdPlace = document.createElement("td");
        tdPlace.style.padding = "0";
        const placeInput = document.createElement("input");
        placeInput.type = "text";
        placeInput.className = "as-place";
        placeInput.placeholder = "Enter place name";
        styleInput(placeInput);
        tdPlace.appendChild(placeInput);

        const tdRemarks = document.createElement("td");
        tdRemarks.style.padding = "0";
        const remarksInput = document.createElement("input");
        remarksInput.type = "text";
        remarksInput.placeholder = "Enter remarks";
        styleInput(remarksInput);
        tdRemarks.appendChild(remarksInput);

        const tdAction = document.createElement("td");
        tdAction.style.padding = "0";
        tdAction.style.textAlign = "center";
        tdAction.style.whiteSpace = "nowrap";

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "x";
        removeBtn.style.color = "red";
        removeBtn.style.border = "none";
        removeBtn.style.background = "transparent";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.fontSize = "16px";
        removeBtn.style.marginRight = "5px";
        removeBtn.addEventListener("click", () => tr.remove());

        const addBtn = document.createElement("button");
        addBtn.textContent = "+";
        addBtn.style.border = "none";
        addBtn.style.background = "transparent";
        addBtn.style.cursor = "pointer";
        addBtn.style.fontSize = "16px";
        addBtn.style.color = "#537C36";
        addBtn.addEventListener("click", () => {
          const newRow = addRow("");
          tbody.insertBefore(newRow, tr.nextSibling);
        });

        tdAction.appendChild(removeBtn);
        tdAction.appendChild(addBtn);

        tr.appendChild(tdDate);
        tr.appendChild(tdPlace);
        tr.appendChild(tdRemarks);
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
        return tr;
      }

      function rebuildRowsWithDates(dateList = []) {
        tbody.innerHTML = "";
        dateList.forEach((d) => addRow(d));
      }

      rebuildRowsWithDates(dates);
      wrapper.__obj = { rebuildRowsWithDates };

      table.appendChild(tbody);
      wrapper.appendChild(table);
      section.appendChild(wrapper);

      return { wrapper, table, tbody };
    }

    root.addEventListener("change", (e) => {
      const sel = e.target;
      if (!sel || sel.tagName !== "SELECT") return;
      const text = (
        sel.options[sel.selectedIndex]?.text ||
        sel.value ||
        ""
      ).toLowerCase();

      const section = (function topLevelSection(el) {
        let cur = el;
        while (cur && cur.parentElement && cur.parentElement !== root)
          cur = cur.parentElement;
        return cur && cur.parentElement === root ? cur : null;
      })(sel);

      if (!section) return;
      const EXIST_CLASS = "as-specified-wrapper";

      if (text.includes("as specified")) {
        if (section.querySelector("." + EXIST_CLASS)) return;
        const arrival = parseDateFromInput(arrivalDateInput);
        const departure = parseDateFromInput(departureDateInput);
        let dates = [];
        if (arrival && departure)
          dates = dateRange(arrival, departure).map((d) => fmt(d));
        else if (arrival) dates = [fmt(arrival)];
        else if (departure) dates = [fmt(departure)];

        const tableObj = buildAsSpecifiedTable(section, dates);
        if (tableObj.tbody.children.length) {
          const first = tableObj.tbody.querySelector(".as-place");
          const last = tableObj.tbody.querySelector("tr:last-child .as-place");
          if (first && arrivalStationInput?.value)
            first.value = arrivalStationInput.value;
          if (last && departureStationInput?.value)
            last.value = departureStationInput.value;
        }
        return;
      }

      const existing = section.querySelector("." + EXIST_CLASS);
      if (existing) existing.remove();
    });

    function refreshAll() {
      const arrival = parseDateFromInput(arrivalDateInput);
      const departure = parseDateFromInput(departureDateInput);
      let dates = [];
      if (arrival && departure)
        dates = dateRange(arrival, departure).map((d) => fmt(d));
      else if (arrival) dates = [fmt(arrival)];
      else if (departure) dates = [fmt(departure)];
      document.querySelectorAll(".as-specified-wrapper").forEach((w) => {
        w.__obj?.rebuildRowsWithDates?.(dates);
      });
    }

    arrivalDateInput?.addEventListener("change", refreshAll);
    departureDateInput?.addEventListener("change", refreshAll);
    arrivalStationInput?.addEventListener("input", refreshAll);
    departureStationInput?.addEventListener("input", refreshAll);
  }

  /* ============================
     Entry fees and expense management
  ============================ */
  function initEntryFees() {
    const container = document.getElementById("expenseContainer");
    if (!container) return;
    const PLACES_API = `${window.location.protocol}//${window.location.hostname}:3000/api/expenses`;

    let placeNames = [];
    async function loadPlaceNames() {
      try {
        const res = await fetch(PLACES_API);
        if (!res.ok) throw new Error("Failed to load places");
        const data = await res.json();
        placeNames = Array.from(
          new Set(
            (data || [])
              .map((r) => (r && r.Name ? String(r.Name).trim() : ""))
              .filter(Boolean)
          )
        );
      } catch (err) {
        console.warn("Could not load place names:", err);
        placeNames = [];
      }
    }

    function applyCompactSizing(el) {
      if (!el) return;
      el.style.height = "44px";
      el.style.lineHeight = "20px";
      if (el.style.display && el.style.display.indexOf("flex") !== -1) {
        el.style.alignItems = "center";
      }
    }

    function updateNumbers() {
      const items = container.querySelectorAll(".expense-item");
      items.forEach((item, index) => {
        const label = item.querySelector("label");
        if (label) label.textContent = `${9 + index}. Select Expense Type`;
      });
    }

    const AUTO_REMARK_TYPES = [
      "cultural",
      "archery",
      "National",
      "Birthday",
      "Chocolates",
      "Candle",
      "Cock",
      "Conference",
      "Bonfire",
      "Gifts and Compliments",
      "Hot-Stone-Bath",
      "Liquor",
      "Others",
    ];

    function createRemarkAmountForSlot(slot) {
      if (!slot) return;
      if (slot.querySelector(".remarkAmountContainer")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "remarkAmountContainer";
      wrapper.style.display = "inline-flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "8px";
      wrapper.style.marginLeft = "8px";

      const remark = document.createElement("textarea");
      remark.name = "entryRemark";
      remark.placeholder = "Remarks / Notes / Venue";
      remark.rows = 1;
      remark.style.padding = "6px 8px";
      remark.style.border = "1px solid #d1d5db";
      remark.style.borderRadius = "6px";
      remark.style.fontSize = "14px";
      remark.style.minWidth = "220px";
      remark.style.resize = "none";
      remark.style.overflow = "hidden";
      applyCompactSizing(remark);

      remark.addEventListener("input", () => {
        remark.style.height = "auto";
        const h = Math.min(80, remark.scrollHeight);
        remark.style.height = `${h}px`;
      });

      const amount = document.createElement("input");
      amount.type = "number";
      amount.name = "entryAmount";
      amount.placeholder = "Amount";
      amount.style.padding = "6px 8px";
      amount.style.border = "1px solid #d1d5db";
      amount.style.borderRadius = "6px";
      amount.style.fontSize = "14px";
      amount.style.width = "120px";
      applyCompactSizing(amount);

      wrapper.appendChild(remark);
      wrapper.appendChild(amount);

      const otherInputs = slot.querySelector(".otherInputs");
      if (otherInputs) otherInputs.insertAdjacentElement("afterend", wrapper);
      else slot.appendChild(wrapper);
    }

    function removeRemarkAmount(slot) {
      if (!slot) return;
      const old = slot.querySelector(".remarkAmountContainer");
      if (old) old.remove();
    }

    function sanitizeClone(clone) {
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

      clone.querySelectorAll("input, textarea").forEach((inp) => {
        if (["text", "number", "tel", "email"].includes(inp.type))
          inp.value = "";
        else if (inp.type === "checkbox" || inp.type === "radio")
          inp.checked = false;
        else if (inp.tagName.toLowerCase() === "textarea") inp.value = "";
      });

      clone.querySelectorAll("select").forEach((sel) => {
        try {
          sel.selectedIndex = 0;
        } catch (err) {}
      });

      const oldSlot = clone.querySelector(".entryFormContainer");
      if (oldSlot) oldSlot.innerHTML = "";

      clone
        .querySelectorAll("input, select, textarea, .multiDisplay")
        .forEach((el) => {
          applyCompactSizing(el);
        });
    }

    function createPlaceMultiSelectForSlot(slot) {
      if (!slot) return;
      slot.innerHTML = "";

      const wrapper = document.createElement("div");
      wrapper.className = "entryMultiSelect";
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.style.width = "300px";
      wrapper.style.maxWidth = "300px";
      wrapper.style.fontSize = "14px";

      const display = document.createElement("div");
      display.className = "multiDisplay";
      display.style.minHeight = "44px";
      display.style.height = "44px";
      display.style.lineHeight = "20px";
      display.style.padding = "6px 8px";
      display.style.border = "1px solid #d1d5db";
      display.style.borderRadius = "6px";
      display.style.background = "#fff";
      display.style.cursor = "pointer";
      display.style.display = "flex";
      display.style.alignItems = "center";
      display.style.gap = "8px";
      display.style.flexWrap = "nowrap";
      display.style.overflow = "hidden";
      display.style.alignContent = "center";

      const chipsContainer = document.createElement("div");
      chipsContainer.className = "chipsContainer";
      chipsContainer.style.display = "flex";
      chipsContainer.style.gap = "6px";
      chipsContainer.style.flex = "1 1 auto";
      chipsContainer.style.alignItems = "center";
      chipsContainer.style.overflowX = "auto";
      chipsContainer.style.whiteSpace = "nowrap";
      chipsContainer.style.maxWidth = "100%";
      chipsContainer.style.paddingBottom = "2px";
      chipsContainer.style.scrollBehavior = "smooth";
      chipsContainer.style.webkitOverflowScrolling = "touch";

      chipsContainer.style.outline = "none";
      const placeholderSpan = document.createElement("span");
      placeholderSpan.className = "placeholderText";
      placeholderSpan.textContent = "Select Place";
      placeholderSpan.style.color = "#6b7280";
      placeholderSpan.style.fontSize = "14px";
      chipsContainer.appendChild(placeholderSpan);
      display.appendChild(chipsContainer);

      const chevron = document.createElement("span");
      chevron.innerHTML = "▾";
      chevron.style.marginLeft = "4px";
      chevron.style.fontSize = "12px";
      chevron.style.color = "#374151";
      display.appendChild(chevron);

      const panel = document.createElement("div");
      panel.className = "optionsPanel";
      panel.style.position = "absolute";
      panel.style.top = "calc(100% + 6px)";
      panel.style.left = "0";
      panel.style.right = "0";
      panel.style.maxHeight = "220px";
      panel.style.overflow = "auto";
      panel.style.border = "1px solid #e5e7eb";
      panel.style.borderRadius = "8px";
      panel.style.background = "#fff";
      panel.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
      panel.style.padding = "8px";
      panel.style.zIndex = "999";
      panel.style.display = "none";

      const hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.className = "entryPlaceHidden";
      hiddenInput.name = "entryPlaces";

      function makeOption(name, value) {
        const row = document.createElement("div");
        row.className = "optionRow";
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.padding = "6px 8px";
        row.style.borderRadius = "6px";
        row.style.cursor = "pointer";
        row.style.userSelect = "none";

        const chkWrap = document.createElement("span");
        chkWrap.style.display = "inline-flex";
        chkWrap.style.alignItems = "center";
        chkWrap.style.justifyContent = "center";
        chkWrap.style.width = "18px";
        chkWrap.style.height = "18px";
        chkWrap.style.border = "1px solid #d1d5db";
        chkWrap.style.borderRadius = "4px";
        chkWrap.style.flex = "0 0 18px";
        chkWrap.style.background = "#fff";

        const realChk = document.createElement("input");
        realChk.type = "checkbox";
        realChk.style.display = "none";
        realChk.dataset.value = value;

        const label = document.createElement("span");
        label.textContent = name;
        label.style.flex = "1 1 auto";
        label.style.fontSize = "14px";
        label.style.color = "black";

        const checkMark = document.createElement("span");
        checkMark.className = "checkMark";
        checkMark.style.display = "none";
        checkMark.innerHTML = "✓";
        checkMark.style.color = "#fff";
        checkMark.style.fontSize = "10px";

        function updateVisual(sel) {
          if (sel) {
            chkWrap.style.background = "#06b5d45f";
            chkWrap.style.border = "1px solid #06b5d45f";
            checkMark.style.display = "inline-block";
          } else {
            chkWrap.style.background = "#fff";
            chkWrap.style.border = "1px solid #d1d5db";
            checkMark.style.display = "none";
          }
        }

        row.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const isChecked = !realChk.checked;
          realChk.checked = isChecked;
          updateVisual(isChecked);
          refreshSelectionFromPanel();
        });

        chkWrap.appendChild(checkMark);
        row.appendChild(chkWrap);
        row.appendChild(realChk);
        row.appendChild(label);

        return row;
      }

      placeNames.forEach((n) => {
        const r = makeOption(n, n);
        panel.appendChild(r);
      });

      const otherRow = makeOption(
        "Others (enter site/event & amount)",
        "__others__"
      );
      panel.appendChild(otherRow);

      const footer = document.createElement("div");
      footer.style.display = "flex";
      footer.style.justifyContent = "space-between";
      footer.style.alignItems = "center";
      footer.style.marginTop = "6px";
      footer.style.paddingTop = "6px";
      footer.style.borderTop = "1px solid #f3f4f6";

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.textContent = "Clear";
      clearBtn.style.border = "none";
      clearBtn.style.background = "transparent";
      clearBtn.style.cursor = "pointer";
      clearBtn.style.color = "#374151";

      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.textContent = "Done";
      doneBtn.style.border = "none";
      doneBtn.style.background = "transparent";
      doneBtn.style.cursor = "pointer";
      doneBtn.style.color = "#374151";

      clearBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        panel.querySelectorAll('input[type="checkbox"]').forEach((c) => {
          c.checked = false;
          const row = c.closest(".optionRow");
          if (row) {
            const chkWrap = row.querySelector("span");
            if (chkWrap) {
              chkWrap.style.background = "#fff";
              chkWrap.style.border = "1px solid #d1d5db";
              const cm = row.querySelector(".checkMark");
              if (cm) cm.style.display = "none";
            }
          }
        });
        refreshSelectionFromPanel();
      });

      doneBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        panel.style.display = "none";
      });
      footer.appendChild(clearBtn);
      footer.appendChild(doneBtn);
      panel.appendChild(footer);

      function refreshSelectionFromPanel() {
        const checked = Array.from(
          panel.querySelectorAll('input[type="checkbox"]')
        )
          .filter((c) => c.checked)
          .map((c) => c.dataset.value);

        hiddenInput.value = checked.join(",");
        chipsContainer.innerHTML = "";
        if (checked.length === 0) {
          chipsContainer.appendChild(placeholderSpan);
        } else {
          checked.forEach((val) => {
            const chip = document.createElement("span");
            chip.className = "chip";
            chip.textContent = val === "__others__" ? "Others" : val;
            chip.style.padding = "4px 8px";
            chip.style.fontSize = "13px";
            chip.style.borderRadius = "999px";
            chip.style.background = "#06b5d4e7";
            chip.style.color = "#fff";
            chip.style.display = "inline-block";
            chip.style.whiteSpace = "nowrap";
            chip.style.maxWidth = "none";
            chip.style.overflow = "visible";
            chip.style.textOverflow = "clip";

            chip.style.cursor = "default";
            chip.addEventListener("click", (ev) => {
              ev.stopPropagation();
              const targetVal = val;
              panel.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                if (c.dataset.value === targetVal) {
                  c.checked = false;
                  const row = c.closest(".optionRow");
                  if (row) {
                    const chkWrap = row.querySelector("span");
                    if (chkWrap) {
                      chkWrap.style.background = "#fff";
                      chkWrap.style.border = "1px solid #d1d5db";
                      const cm = row.querySelector(".checkMark");
                      if (cm) cm.style.display = "none";
                    }
                  }
                }
              });
              refreshSelectionFromPanel();
            });

            chipsContainer.appendChild(chip);
          });
        }

        const item = slot.closest(".expense-item");
        if (!item) return;
        const slotForItem = findEntrySlot(item);
        if (!slotForItem) return;

        if (checked.includes("__others__")) {
          createOtherInputsForSlot(slotForItem);
        } else {
          clearOtherInputs(slotForItem);
        }
      }

      display.addEventListener("click", (ev) => {
        ev.stopPropagation();
        panel.style.display = panel.style.display === "none" ? "block" : "none";
      });

      chipsContainer.addEventListener("wheel", (ev) => {
        if (chipsContainer.scrollWidth > chipsContainer.clientWidth) {
          if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
            ev.preventDefault();
            chipsContainer.scrollLeft += ev.deltaY;
          }
        }
      });

      wrapper.appendChild(display);
      wrapper.appendChild(panel);
      wrapper.appendChild(hiddenInput);
      slot.appendChild(wrapper);

      refreshSelectionFromPanel();
    }

    function clearPlaceSlot(slot) {
      if (!slot) return;
      slot.innerHTML = "";
    }

    function createOtherInputsForSlot(slot) {
      if (!slot) return;
      if (slot.querySelector(".otherInputs")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "otherInputs";
      wrapper.style.display = "inline-flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "8px";
      wrapper.style.marginLeft = "8px";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.name = "entryOtherName";
      nameInput.placeholder = "Site / Event name";
      nameInput.style.padding = "6px 8px";
      nameInput.style.border = "1px solid #d1d5db";
      nameInput.style.borderRadius = "6px";
      nameInput.style.fontSize = "14px";
      nameInput.style.minWidth = "160px";
      applyCompactSizing(nameInput);

      const amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.name = "entryOtherAmount";
      amountInput.placeholder = "Amount";
      amountInput.style.padding = "6px 8px";
      amountInput.style.border = "1px solid #d1d5db";
      amountInput.style.borderRadius = "6px";
      amountInput.style.fontSize = "14px";
      amountInput.style.width = "100px";
      applyCompactSizing(amountInput);

      wrapper.appendChild(nameInput);
      wrapper.appendChild(amountInput);
      slot.appendChild(wrapper);
    }

    function clearOtherInputs(slot) {
      if (!slot) return;
      const old = slot.querySelector(".otherInputs");
      if (old) old.remove();
    }

    function findEntrySlot(item) {
      let slot = item.querySelector(".entryFormContainer");
      if (!slot) {
        const sel = item.querySelector(".expenseSelect");
        if (!sel) return null;
        slot = document.createElement("div");
        slot.className = "entryFormContainer";
        sel.insertAdjacentElement("afterend", slot);
        slot.style.display = "inline-flex";
        slot.style.alignItems = "center";
        slot.style.gap = "8px";
        slot.style.marginLeft = "8px";
      }
      return slot;
    }

    container.addEventListener("change", (e) => {
      if (e.target.classList.contains("expenseSelect")) {
        const sel = e.target;
        const item = sel.closest(".expense-item");
        if (!item) return;
        const slot = findEntrySlot(item);
        if (!slot) return;

        if (sel.value === "entry") {
          createPlaceMultiSelectForSlot(slot);
        } else {
          clearPlaceSlot(slot);
        }

        clearOtherInputs(slot);

        if (AUTO_REMARK_TYPES.includes(sel.value)) {
          createRemarkAmountForSlot(slot);
        } else {
          removeRemarkAmount(slot);
        }
        return;
      }
    });

    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("addExpenseBtn")) {
        const current = e.target.closest(".expense-item");
        if (!current) return;

        const clone = current.cloneNode(true);
        sanitizeClone(clone);

        const clonedSelect = clone.querySelector(".expenseSelect");
        if (clonedSelect) {
          try {
            clonedSelect.selectedIndex = 0;
          } catch (err) {}
          clonedSelect.value = "";
          clonedSelect.removeAttribute("name");
          applyCompactSizing(clonedSelect);
        }
        clone
          .querySelectorAll("input, select, textarea, .multiDisplay")
          .forEach((el) => {
            applyCompactSizing(el);
          });

        clone.style.background = "#f5f5f5";
        clone.style.padding = "14px 16px";
        clone.style.borderRadius = "8px";
        clone.style.marginBottom = "14px";

        current.after(clone);

        const clonedSlot = findEntrySlot(clone);
        if (clonedSlot) clearPlaceSlot(clonedSlot);

        updateNumbers();
        return;
      }

      if (e.target.classList.contains("removeExpenseBtn")) {
        const current = e.target.closest(".expense-item");
        if (!current) return;
        const total = container.querySelectorAll(".expense-item").length;
        if (total > 1) {
          current.remove();
          updateNumbers();
        } else {
          alert("At least one expense type must remain.");
        }
        return;
      }
    });

    document.addEventListener("click", (ev) => {
      container.querySelectorAll(".entryMultiSelect").forEach((ms) => {
        const panel = ms.querySelector(".optionsPanel");
        if (!panel) return;
        if (!ms.contains(ev.target)) panel.style.display = "none";
      });
    });

    (async () => {
      await loadPlaceNames();

      container.querySelectorAll(".expense-item").forEach((item) => {
        item
          .querySelectorAll("input, select, textarea, .multiDisplay")
          .forEach((el) => {
            applyCompactSizing(el);
          });

        const sel = item.querySelector(".expenseSelect");
        const slot = findEntrySlot(item);
        if (sel && slot) {
          if (sel.value === "entry") createPlaceMultiSelectForSlot(slot);
          else clearPlaceSlot(slot);
        }

        const hidden = item.querySelector(".entryPlaceHidden");
        if (hidden && String(hidden.value).split(",").includes("__others__")) {
          createOtherInputsForSlot(slot);
        }

        if (sel && AUTO_REMARK_TYPES.includes(sel.value)) {
          createRemarkAmountForSlot(slot);
        }
      });

      updateNumbers();
    })();
  }

  /* ============================
     CLONE/REMOVE FOR SECTIONS 3-7
  ============================ */
  function initSectionCloneRemoval() {
    document.addEventListener("click", function (e) {
      const button = e.target;
      if (button.tagName !== "BUTTON") return;

      const buttonText = button.textContent.trim();
      const isCloneButton = buttonText === "+";
      const isRemoveButton = buttonText === "-";

      if (!isCloneButton && !isRemoveButton) return;

      let section =
        button.closest(".service-section") ||
        button.closest('div[style*="background:#f5f5f5"]') ||
        button.closest('div[style*="background: #f5f5f5"]') ||
        button.closest('div[class*="section"]') ||
        button.closest("div");

      while (
        section &&
        section.tagName === "DIV" &&
        !section.hasAttribute("id") &&
        !section.querySelector("label b") &&
        !section.style.background
      ) {
        section = section.parentElement;
      }

      if (!section) return;

      const serviceForm = document.getElementById("serviceForm");
      if (serviceForm && !serviceForm.contains(section)) return;

      if (isCloneButton) {
        cloneSection(section);
      } else if (isRemoveButton) {
        removeSection(section);
      }
    });

    function cloneSection(originalSection) {
      try {
        let originalToClone = originalSection;
        const hasLabel = originalSection.querySelector("label b");

        if (!hasLabel) {
          const container = originalSection.parentElement;
          const allDivs = container.querySelectorAll(
            'div[style*="background:#f5f5f5"], div[style*="background: #f5f5f5"]'
          );

          for (const div of allDivs) {
            if (div.querySelector("label b")) {
              originalToClone = div;
              break;
            }
          }
        }

        const label = originalToClone.querySelector("label b");
        if (!label) {
          alert("Cannot find original section to clone from.");
          return;
        }

        const labelText = label.textContent;
        const sectionNumberMatch = labelText.match(/^(\d+)\./);
        if (!sectionNumberMatch) return;

        const sectionNumber = parseInt(sectionNumberMatch[1]);
        if (sectionNumber < 3 || sectionNumber > 7) return;

        const clone = originalToClone.cloneNode(true);

        const labelElement = clone.querySelector("label b");
        if (labelElement) {
          const labelContainer = labelElement.closest("label");
          if (labelContainer) {
            labelContainer.remove();
          }
        }

        clone.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
          if (
            heading.textContent.toLowerCase().includes("section") ||
            heading.textContent.match(/\d+\./)
          ) {
            heading.remove();
          }
        });

        clone.style.borderTop = "2px dashed #ccc";
        clone.style.marginTop = "10px";
        clone.style.paddingTop = "10px";

        clone.querySelectorAll("select").forEach((select) => {
          select.selectedIndex = 0;
        });

        clone.querySelectorAll('input[type="number"]').forEach((input) => {
          if (input.placeholder === "Qty") {
            input.value = "1";
          } else {
            input.value = "";
          }
        });

        clone.querySelectorAll('input[type="text"]').forEach((input) => {
          input.value = "";
        });

        clone.querySelectorAll("textarea").forEach((textarea) => {
          textarea.value = "";
        });

        originalToClone.parentNode.insertBefore(
          clone,
          originalToClone.nextSibling
        );

        setTimeout(() => {
          clone.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      } catch (error) {
        console.error("Error cloning section:", error);
        alert("Error cloning section. Please try again.");
      }
    }

    function removeSection(sectionToRemove) {
      try {
        const label = sectionToRemove.querySelector("label b");
        if (label) {
          alert(
            "Cannot remove the original section. Please remove the cloned sections below it."
          );
          return;
        }

        const container = sectionToRemove.parentNode;
        const allSections = container.querySelectorAll(
          'div[style*="background:#f5f5f5"], div[style*="background: #f5f5f5"]'
        );
        const clonedSections = Array.from(allSections).filter((section) => {
          return !section.querySelector("label b");
        });

        if (clonedSections.length <= 1) {
          alert("Cannot remove the only cloned section.");
          return;
        }

        sectionToRemove.remove();
      } catch (error) {
        console.error("Error removing section:", error);
        alert("Error removing section. Please try again.");
      }
    }
  }

  /* ============================
     Save/Cancel form actions - FIXED VERSION
  ============================ */
  function injectFormActions() {
    if (!groupForm) return;
    if (document.querySelector(".group-form-actions")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "group-form-actions";
    wrapper.style.display = "none";
    wrapper.style.justifyContent = "flex-end";
    wrapper.style.gap = "10px";
    wrapper.style.marginTop = "18px";
    wrapper.style.paddingTop = "8px";
    wrapper.style.borderTop = "1px dashed #e2e8f0";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "btn-cancel";
    cancelBtn.style.padding = "8px 12px";
    cancelBtn.style.border = "1px solid #cfcfcf";
    cancelBtn.style.background = "#fff";
    cancelBtn.style.borderRadius = "6px";
    cancelBtn.style.cursor = "pointer";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save";
    saveBtn.className = "btn-save";
    saveBtn.style.padding = "8px 14px";
    saveBtn.style.border = "none";
    saveBtn.style.background = "#2e8b57";
    saveBtn.style.color = "#fff";
    saveBtn.style.borderRadius = "6px";
    saveBtn.style.cursor = "pointer";

    wrapper.appendChild(cancelBtn);
    wrapper.appendChild(saveBtn);

    const orderedSelectors = [
      "#serviceForm",
      "#hotelForm5",
      "#itineraryForm",
      "#guideForm",
      "#vehicleFormV4",
      "#permitForm",
      "#voucherForm",
    ];
    let lastFound = null;
    for (const sel of orderedSelectors) {
      const el = document.querySelector(sel);
      if (el) lastFound = el;
    }

    if (lastFound && lastFound.parentNode) {
      lastFound.parentNode.insertBefore(wrapper, lastFound.nextSibling);
    } else {
      groupForm.appendChild(wrapper);
    }

    function resetFormFields() {
      groupForm.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.closest(".group-form-actions")) return;
        if (el.type === "checkbox" || el.type === "radio") el.checked = false;
        else el.value = "";
      });
      try {
        updateDisplayTable();
      } catch (e) {}
    }

    function collectTableRows(tableSelector) {
      const table = document.querySelector(tableSelector);
      if (!table) return null;
      const tbody = table.querySelector("tbody");
      if (!tbody) return null;
      const rows = Array.from(tbody.querySelectorAll("tr"));
      return rows.map((tr) => {
        const rowData = {};
        tr.querySelectorAll("input, select, textarea").forEach((el) => {
          if (el.closest(".group-form-actions")) return;
          const key = el.name || el.dataset.key || el.className || null;
          if (!key) return;
          if (el.type === "checkbox") rowData[key] = el.checked;
          else rowData[key] = el.value;
        });
        if (Object.keys(rowData).length === 0) {
          Array.from(tr.cells).forEach(
            (cell, i) => (rowData[`col${i}`] = cell.textContent.trim())
          );
        }
        return rowData;
      });
    }

    function collectAsSpecified() {
      const wrappers = document.querySelectorAll(".as-specified-wrapper");
      const out = [];
      wrappers.forEach((w) => {
        const tbody = w.querySelector("tbody");
        if (!tbody) return;
        Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
          const date = tr.querySelector(".as-date")?.value || "";
          const place = tr.querySelector(".as-place")?.value || "";
          const remarks = tr.querySelector(".as-remarks")?.value || "";
          if (date || place || remarks) out.push({ date, place, remarks });
        });
      });
      return out;
    }

    function collectSectionData(section) {
      const data = {};
      const label = section.querySelector("label b");
      if (label) {
        data.sectionTitle = label.textContent;
      }

      section.querySelectorAll("select").forEach((select, index) => {
        data[`select_${index}`] = select.value;
      });

      section.querySelectorAll("input").forEach((input, index) => {
        if (input.type === "number" || input.type === "text") {
          data[`input_${index}`] = input.value;
        }
      });

      return data;
    }

    function collectAllSections() {
      const sections = document.querySelectorAll(
        'div[style*="background:#f5f5f5"][style*="border-radius:6px"]'
      );
      const sectionData = [];

      sections.forEach((section) => {
        sectionData.push(collectSectionData(section));
      });

      return sectionData;
    }

    saveBtn.addEventListener("click", () => {
      try {
        const record = {};

        // Collect all basic form fields
        const elements = groupForm.querySelectorAll("input, select, textarea");
        elements.forEach((el) => {
          if (el.closest(".group-form-actions")) return;
          const key = el.name || el.id;
          if (!key) return;
          if (el.type === "checkbox") {
            record[key] = el.checked;
          } else if (el.type === "radio") {
            if (el.checked) record[key] = el.value;
          } else {
            record[key] = el.value;
          }
        });

        // Ensure all required fields are collected
        // Basic information
        if (!record.confirmationDate) {
          const dateField = groupForm.querySelector(
            '#confirmationDate, [name="confirmationDate"]'
          );
          record.confirmationDate = dateField
            ? dateField.value
            : new Date().toISOString().slice(0, 10);
        }

        if (!record.fileNo) {
          const fileField = groupForm.querySelector(
            '#fileNo, #groupchart-fileNo, [name="fileNo"]'
          );
          record.fileNo = fileField ? fileField.value : "";
        }

        if (!record.groupName) {
          const groupField = groupForm.querySelector(
            '#groupName, [name="groupName"]'
          );
          record.groupName = groupField ? groupField.value : "";
        }

        if (!record.company) {
          const companyField = groupForm.querySelector(
            '#company, #groupchart-company, [name="company"]'
          );
          record.company = companyField ? companyField.value : "";
        }

        // PAX details
        if (!record.paxRgnl) {
          const paxRgnlField = groupForm.querySelector(
            '#paxRgnl, [name="paxRgnl"]'
          );
          record.paxRgnl = paxRgnlField ? Number(paxRgnlField.value) || 0 : 0;
        }

        if (!record.paxIntl) {
          const paxIntlField = groupForm.querySelector(
            '#paxIntl, [name="paxIntl"]'
          );
          record.paxIntl = paxIntlField ? Number(paxIntlField.value) || 0 : 0;
        }

        // Travel details
        if (!record.arrivalDate) {
          const arrivalField = groupForm.querySelector(
            '#arrivalDate, [name="arrivalDate"]'
          );
          record.arrivalDate = arrivalField ? arrivalField.value : "";
        }

        if (!record.departureDate) {
          const departureField = groupForm.querySelector(
            '#departureDate, [name="departureDate"]'
          );
          record.departureDate = departureField ? departureField.value : "";
        }

        if (!record.noOfNights) {
          const nightsField = groupForm.querySelector(
            '#noOfNights, [name="noOfNights"]'
          );
          record.noOfNights = nightsField ? nightsField.value : "";
        }

        // Sector details
        if (!record.arrivalSector) {
          const arrivalSectorField = groupForm.querySelector(
            '#arrivalSector, [name="arrivalSector"]'
          );
          record.arrivalSector = arrivalSectorField
            ? arrivalSectorField.value
            : "";
        }

        if (!record.departureSector) {
          const departureSectorField = groupForm.querySelector(
            '#departureSector, [name="departureSector"]'
          );
          record.departureSector = departureSectorField
            ? departureSectorField.value
            : "";
        }

        // Guide details
        if (!record.guideDetails) {
          const guideField = groupForm.querySelector(
            '#guideDetails, [name="guideDetails"]'
          );
          record.guideDetails = guideField ? guideField.value : "";
        }

        // Vehicle details
        if (!record.vehicleDetailsBhutan) {
          const vehicleBhutanField = groupForm.querySelector(
            '#vehicleDetailsBhutan, [name="vehicleDetailsBhutan"]'
          );
          record.vehicleDetailsBhutan = vehicleBhutanField
            ? vehicleBhutanField.value
            : "";
        }

        if (!record.vehicleDetailsIndia) {
          const vehicleIndiaField = groupForm.querySelector(
            '#vehicleDetailsIndia, [name="vehicleDetailsIndia"]'
          );
          record.vehicleDetailsIndia = vehicleIndiaField
            ? vehicleIndiaField.value
            : "";
        }

        // Notes
        if (!record.notes) {
          const notesField = groupForm.querySelector('#notes, [name="notes"]');
          record.notes = notesField ? notesField.value : "";
        }

        // Calculate total pax
        record.paxTotal =
          (Number(record.paxRgnl) || 0) + (Number(record.paxIntl) || 0);

        // Collect hotel details
        const hotelDetails = collectTableRows("#hotelDetailsTable5") || null;
        if (hotelDetails && hotelDetails.length)
          record.hotelDetails = hotelDetails;

        // Collect traveler details
        const travelers = collectTableRows("#travelerTable") || null;
        if (travelers && travelers.length) record.travelerDetails = travelers;

        // Collect rooming list
        const roomingList = collectTableRows("#roomingListTable") || null;
        if (roomingList && roomingList.length) record.roomingList = roomingList;

        // Collect itinerary
        const itinerary = collectTableRows("#itineraryTable") || null;
        if (itinerary && itinerary.length) record.itinerary = itinerary;

        // Collect as specified
        const asSpecified = collectAsSpecified();
        if (asSpecified.length) record.asSpecified = asSpecified;

        // Collect all section data
        const allSections = collectAllSections();
        if (allSections.length) record.allSections = allSections;

        const editIndexField = groupForm.querySelector(
          'input[name="__editIndex"]'
        );
        const all = readStorage();

        if (editIndexField && editIndexField.value !== "") {
          const idx = Number(editIndexField.value);
          if (!isNaN(idx) && idx >= 0 && idx < all.length) {
            all[idx] = record;
            writeStorage(all);
          } else {
            all.unshift(record);
            writeStorage(all);
          }
          editIndexField.value = "";
        } else {
          all.unshift(record);
          writeStorage(all);
        }

        renderMainTable();
        resetFormFields();
        groupForm.style.display = "none";
        const wrapperNodeAfterSave = document.querySelector(
          ".group-form-actions"
        );
        if (wrapperNodeAfterSave) wrapperNodeAfterSave.style.display = "none";

        if (tableContainer) tableContainer.style.display = "";

        if (styledTableBody) {
          styledTableBody.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }

        alert("Record saved successfully!");
      } catch (err) {
        console.error("Save failed", err);
        alert("Failed to save record. Check console for details.");
      }
    });

    cancelBtn.addEventListener("click", () => {
      try {
        const ok = confirm("Discard changes and close form?");
        if (!ok) return;
      } catch (e) {}
      resetFormFields();
      try {
        groupForm.style.display = "none";
      } catch (e) {}
      const wrapperNodeAfterCancel = document.querySelector(
        ".group-form-actions"
      );
      if (wrapperNodeAfterCancel) wrapperNodeAfterCancel.style.display = "none";

      if (tableContainer) tableContainer.style.display = "";
    });
  }

  /* ============================
     Initialize all functionality
  ============================ */
  function initAll() {
    try {
      const computed = getComputedStyle(groupForm);
      if (computed.display !== "none") groupForm.style.display = "none";
    } catch (e) {}

    injectFormActions();
    initTabs();
    initAddGroupToggle();
    initSearch();
    initTravelerTable();
    initRoomingList();
    initSideBtns();
    attachDataDetailListeners();
    attachAsSpecifiedListener();
    initEntryFees();
    initSectionCloneRemoval();

    renderMainTable();
    updateDisplayTable();
    attachAutoCalculations();
  }

  // Initialize Guide Section (moved from IIFE)
  function initGuideSection() {
    const API_URL = `${location.protocol}//${location.hostname}:3000/api/guides`;
    const MIN_CHARS = 1;
    let guideData = [];

    // Add styles for guide suggestions
    const style = document.createElement("style");
    style.textContent = `
      .guide-suggestions {
        position: absolute;
        z-index: 9999;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.12);
        max-height: 260px;
        overflow:auto;
        font-size:14px;
      }
      .guide-suggestion-item {
        padding:8px 10px;
        cursor:pointer;
        border-bottom:1px solid rgba(0,0,0,0.04);
      }
      .guide-suggestion-item:hover, .guide-suggestion-item:focus {
        background:#f3f7ff;
        outline:none;
      }
    `;
    document.head.appendChild(style);

    async function loadGuides() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        guideData = Array.isArray(json) ? json : json.data || [];
      } catch (err) {
        console.warn("Failed to fetch guides:", err);
        guideData = [];
      }
    }

    function getName(g) {
      return (g && (g.name || g.fullName || g.guideName || "")) || "";
    }

    function getPhone(g) {
      return (g && (g.phone || g.contact || g.phoneNumber || "")) || "";
    }

    function createBox() {
      const box = document.createElement("div");
      box.className = "guide-suggestions";
      box.style.display = "none";
      document.body.appendChild(box);
      return box;
    }

    function placeBox(box, input) {
      const r = input.getBoundingClientRect();
      box.style.left = r.left + window.scrollX + "px";
      box.style.top = r.bottom + window.scrollY + 6 + "px";
      box.style.minWidth = Math.max(200, r.width) + "px";
    }

    function findMatches(q, limit = 8) {
      if (!q) return [];
      const s = q.toLowerCase();
      const matches = [];
      for (let i = 0; i < guideData.length; i++) {
        const g = guideData[i];
        const name = getName(g).toLowerCase();
        const phone = getPhone(g).toLowerCase();
        if (name.includes(s) || phone.includes(s)) {
          matches.push(g);
          if (matches.length >= limit) break;
        }
      }
      return matches;
    }

    function escapeHtml(s) {
      if (s === undefined || s === null) return "";
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function makeItem(g) {
      const item = document.createElement("div");
      item.className = "guide-suggestion-item";
      const name = getName(g);
      const phone = getPhone(g);
      item.innerHTML =
        `<div style="font-weight:600">${escapeHtml(name)}</div>` +
        (phone
          ? `<div style="font-size:12px;color:#555;margin-top:4px;">${escapeHtml(
              phone
            )}</div>`
          : "");
      item.dataset.name = name;
      item.dataset.phone = phone;
      item._raw = g;
      return item;
    }

    function attachRow(entry) {
      if (!entry) return;
      if (entry.__guideAttached) return;
      entry.__guideAttached = true;

      const nameInput = entry.querySelector(".guide-name");
      const phoneInput = entry.querySelector(".guide-phone");
      if (!nameInput) return;

      const box = createBox();
      entry.__guideBox = box;

      let timer = null;
      nameInput.addEventListener("input", () => {
        const v = (nameInput.value || "").trim();
        if (v.length < MIN_CHARS) {
          box.style.display = "none";
          return;
        }

        clearTimeout(timer);
        timer = setTimeout(() => {
          const matches = findMatches(v, 8);
          box.innerHTML = "";
          if (!matches.length) {
            box.style.display = "none";
            return;
          }
          matches.forEach((g) => {
            const item = makeItem(g);
            item.addEventListener("click", () => {
              nameInput.value = getName(g);
              if (phoneInput) phoneInput.value = getPhone(g);
              nameInput.dataset.guideId = g._id || g.id || "";
              box.style.display = "none";
              nameInput.focus();
            });
            item.addEventListener("keydown", (ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                item.click();
              }
              if (ev.key === "ArrowDown") {
                ev.preventDefault();
                if (item.nextElementSibling) item.nextElementSibling.focus();
              }
              if (ev.key === "ArrowUp") {
                ev.preventDefault();
                if (item.previousElementSibling)
                  item.previousElementSibling.focus();
                else nameInput.focus();
              }
            });
            box.appendChild(item);
          });
          placeBox(box, nameInput);
          box.style.display = "block";
        }, 120);
      });

      nameInput.addEventListener("blur", () => {
        setTimeout(() => {
          if (box) box.style.display = "none";
        }, 180);
        const typed = (nameInput.value || "").trim();
        if (typed) {
          const exact = guideData.find(
            (g) => getName(g).toLowerCase() === typed.toLowerCase()
          );
          if (exact && phoneInput) {
            phoneInput.value = getPhone(exact);
            nameInput.dataset.guideId = exact._id || exact.id || "";
          } else {
            const loose = guideData.find((g) =>
              getName(g).toLowerCase().startsWith(typed.toLowerCase())
            );
            if (loose && phoneInput) {
              phoneInput.value = getPhone(loose);
              nameInput.dataset.guideId = loose._id || loose.id || "";
            }
          }
        }
      });

      nameInput.addEventListener("keydown", (ev) => {
        if (ev.key === "ArrowDown") {
          const first = box.querySelector(".guide-suggestion-item");
          if (first) {
            ev.preventDefault();
            first.focus();
          }
        } else if (ev.key === "Escape") {
          box.style.display = "none";
        }
      });
    }

    function attachAllRows() {
      const rows = document.querySelectorAll("#allocateGuideForm .guide-entry");
      rows.forEach((r) => attachRow(r));
    }

    function wireCloneRemove() {
      const addBtn = document.querySelector("#guideForm .add-btn");
      const form = document.getElementById("allocateGuideForm");
      if (!form) return;

      if (addBtn) {
        addBtn.addEventListener("click", () => {
          const first = form.querySelector(".guide-entry");
          if (!first) return;
          const clone = first.cloneNode(true);
          clone.querySelectorAll("input, textarea, select").forEach((inp) => {
            const ph = (inp.placeholder || "").toLowerCase();
            if (!/sl/i.test(ph)) inp.value = "";
            inp.removeAttribute("data-guide-id");
          });
          clone.__guideAttached = false;
          form.appendChild(clone);
          form.querySelectorAll(".guide-entry").forEach((entry, idx) => {
            const s = entry.querySelector(".sl-input");
            if (s) s.value = idx + 1;
          });
          attachRow(clone);
        });
      }

      form.addEventListener("click", (e) => {
        if (!e.target.classList.contains("remove-btn")) return;
        const entries = form.querySelectorAll(".guide-entry");
        if (entries.length > 1) {
          const toRemove = e.target.closest(".guide-entry");
          if (!toRemove) return;
          if (toRemove.__guideBox) {
            try {
              toRemove.__guideBox.remove();
            } catch (_) {}
          }
          toRemove.remove();
          form.querySelectorAll(".guide-entry").forEach((entry, i) => {
            const sl = entry.querySelector(".sl-input");
            if (sl) sl.value = i + 1;
          });
        } else {
          alert("At least one guide entry is required.");
        }
      });
    }

    async function init() {
      await loadGuides();
      attachAllRows();
      wireCloneRemove();
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // Initialize Vehicle Section (moved from IIFE)
  function initVehicleV4() {
    const form = document.getElementById("allocateVech4Form");
    if (!form) return;
    const addBtn = document.querySelector("#vehicleFormV4 .add-btn-v4");
    const API_URL = `${location.protocol}//${location.hostname}:3000/api/cars`;

    async function ensureCarData() {
      if (Array.isArray(window.carData)) return;
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const j = await res.json();
        window.carData = Array.isArray(j) ? j : j.data || [];
      } catch (err) {
        console.warn("Could not load carData:", err);
        window.carData = [];
      }
    }

    const getDriverName = (c) =>
      (c && (c.driverName || c.driver || c.driver_name || "")) || "";
    const getDriverContact = (c) =>
      (c &&
        (c.driverContact ||
          c.driver_contact ||
          c.driverPhone ||
          c.driver_phone ||
          "")) ||
      "";
    const getVehicleType = (c) =>
      (c && (c.vehicleType || c.vehType || c.type || "")) || "";

    function createBox() {
      const box = document.createElement("div");
      box.className = "v4-suggestions";
      Object.assign(box.style, {
        position: "absolute",
        zIndex: 9999,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "6px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        maxHeight: "220px",
        overflowY: "auto",
        fontSize: "13px",
        display: "none",
      });
      document.body.appendChild(box);
      return box;
    }

    function placeBox(box, input) {
      const r = input.getBoundingClientRect();
      box.style.left = r.left + window.scrollX + "px";
      box.style.top = r.bottom + window.scrollY + 6 + "px";
      box.style.minWidth = Math.max(220, r.width) + "px";
    }

    function escapeHtml(s) {
      if (s === undefined || s === null) return "";
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function findMatches(q, limit = 8) {
      if (!q) return [];
      const s = q.toLowerCase();
      const data = Array.isArray(window.carData) ? window.carData : [];
      const out = [];
      for (let i = 0; i < data.length && out.length < limit; i++) {
        const c = data[i];
        const name = getDriverName(c).toLowerCase();
        const phone = getDriverContact(c).toLowerCase();
        if ((name && name.includes(s)) || (phone && phone.includes(s)))
          out.push(c);
      }
      return out;
    }

    function makeSuggestionItem(car) {
      const el = document.createElement("div");
      el.className = "v4-suggestion-item";
      el.tabIndex = 0;
      const name = getDriverName(car);
      const phone = getDriverContact(car);
      const vtype = getVehicleType(car);
      el.innerHTML =
        `<div style="font-weight:600">${escapeHtml(name)}</div>` +
        (phone || vtype
          ? `<div style="font-size:12px;color:#666;margin-top:4px">${escapeHtml(
              phone
            )}${vtype ? " • " + escapeHtml(vtype) : ""}</div>`
          : "");
      Object.assign(el.style, {
        padding: "8px 10px",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        cursor: "pointer",
      });
      el._car = car;
      return el;
    }

    function attachToRow(row) {
      if (!row || row.__v4Attached) return;
      row.__v4Attached = true;

      const inputs = Array.from(row.querySelectorAll("input"));
      const driverInput = inputs[0];
      const contactInput = inputs[1];
      const vehTypeInput = inputs[2];

      if (!driverInput) return;

      const box = createBox();
      row.__v4Box = box;

      let timer = null;
      driverInput.addEventListener("input", async (ev) => {
        const q = (driverInput.value || "").trim();
        if (!q) {
          box.style.display = "none";
          return;
        }

        clearTimeout(timer);
        timer = setTimeout(async () => {
          await ensureCarData();
          const matches = findMatches(q, 8);
          box.innerHTML = "";
          if (!matches.length) {
            box.style.display = "none";
            return;
          }
          matches.forEach((car) => {
            const item = makeSuggestionItem(car);
            item.addEventListener("click", () => {
              driverInput.value = getDriverName(car);
              if (contactInput) contactInput.value = getDriverContact(car);
              if (vehTypeInput) vehTypeInput.value = getVehicleType(car);
              driverInput.dataset.carId = car._id || car.id || "";
              box.style.display = "none";
              driverInput.focus();
            });
            item.addEventListener("keydown", (ev2) => {
              if (ev2.key === "Enter") {
                ev2.preventDefault();
                item.click();
              }
              if (ev2.key === "ArrowDown") {
                ev2.preventDefault();
                if (item.nextElementSibling) item.nextElementSibling.focus();
              }
              if (ev2.key === "ArrowUp") {
                ev2.preventDefault();
                if (item.previousElementSibling)
                  item.previousElementSibling.focus();
                else driverInput.focus();
              }
            });
            box.appendChild(item);
          });
          placeBox(box, driverInput);
          box.style.display = "block";
        }, 120);
      });

      driverInput.addEventListener("blur", async () => {
        setTimeout(() => {
          if (box) box.style.display = "none";
        }, 160);
        const v = (driverInput.value || "").trim();
        if (!v) return;
        await ensureCarData();
        const exact = (window.carData || []).find(
          (c) => getDriverName(c).toLowerCase() === v.toLowerCase()
        );
        if (exact) {
          if (contactInput) contactInput.value = getDriverContact(exact);
          if (vehTypeInput) vehTypeInput.value = getVehicleType(exact);
          driverInput.dataset.carId = exact._id || exact.id || "";
        } else {
          const loose = (window.carData || []).find((c) =>
            getDriverName(c).toLowerCase().startsWith(v.toLowerCase())
          );
          if (loose) {
            if (contactInput) contactInput.value = getDriverContact(loose);
            if (vehTypeInput) vehTypeInput.value = getVehicleType(loose);
            driverInput.dataset.carId = loose._id || loose.id || "";
          }
        }
      });

      driverInput.addEventListener("keydown", (ev) => {
        if (ev.key === "ArrowDown") {
          const first = box.querySelector(
            ".v4-suggestion-item, .v4-suggestion-item"
          );
          if (first) {
            ev.preventDefault();
            first.focus();
          }
        } else if (ev.key === "Escape") {
          box.style.display = "none";
        }
      });
    }

    function attachAll() {
      const rows = form.querySelectorAll(".vech4-entry");
      rows.forEach((r) => attachToRow(r));
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const first = form.querySelector(".vech4-entry");
        if (!first) return;
        const clone = first.cloneNode(true);
        clone.querySelectorAll("input, textarea, select").forEach((inp) => {
          const ph = (inp.placeholder || "").toLowerCase();
          if (!/sl/i.test(ph)) inp.value = "";
          inp.removeAttribute("data-car-id");
        });
        clone.__v4Attached = false;
        if (clone.__v4Box)
          try {
            clone.__v4Box.remove();
          } catch (e) {}
        const all = form.querySelectorAll(".vech4-entry");
        const sl = clone.querySelector(".sl-input-v4");
        if (sl) sl.value = all.length + 1;
        form.appendChild(clone);
        attachToRow(clone);
      });
    }

    form.addEventListener("click", (e) => {
      if (!e.target.classList.contains("remove-btn-v4")) return;
      const entries = form.querySelectorAll(".vech4-entry");
      if (entries.length > 1) {
        const toRemove = e.target.closest(".vech4-entry");
        if (toRemove && toRemove.__v4Box)
          try {
            toRemove.__v4Box.remove();
          } catch (_) {}
        toRemove.remove();
        form.querySelectorAll(".vech4-entry").forEach((entry, i) => {
          const sl = entry.querySelector(".sl-input-v4");
          if (sl) sl.value = i + 1;
        });
      } else {
        alert("At least one vehicle entry is required.");
      }
    });

    ensureCarData().then(attachAll);
  }

  /* ============================
     Initialize Guide and Vehicle sections
  ============================ */
  initGuideSection();
  initVehicleV4();

  /* ============================
     Initialize all
  ============================ */
  initAll();
  window.renderMainTable = renderMainTable;
  window.generateItinerary = generateItinerary;
  window.updateDisplayTable = updateDisplayTable;
  window.autoCloneTravelerRows = autoCloneTravelerRows;
});

(function () {
  "use strict";

  /* =========================
     CONFIG
     ========================= */
  const BASE_RATE_NAMES = ["Contract", "Special", "FOC"];
  const FIXED_ROOM_TOKENS = ["sgl", "dbl", "eb", "cwb", "cnb"];
  const ID = {
    cardsHolder: "hotelCardsContainer",
    destSelect: "destSelect",
    addTabBtn: "addTabBtn",
    tabsContainer: "destTabs",
    summaryContainer: "summaryDestinations",
  };

  /* =========================
     DOM REFERENCES
     ========================= */
  const cardsHolder = document.getElementById(ID.cardsHolder);
  const destSelect = document.getElementById(ID.destSelect);
  const addTabBtn = document.getElementById(ID.addTabBtn);
  const tabsContainer = document.getElementById(ID.tabsContainer);
  const summaryContainer = document.getElementById(ID.summaryContainer);

  if (
    !cardsHolder ||
    !destSelect ||
    !addTabBtn ||
    !tabsContainer ||
    !summaryContainer
  ) {
    console.warn("Hotel module: required DOM nodes not found; aborting.");
    return;
  }

  /* =========================
     STATE & UTIL
     ========================= */
  let hotelsCache = null;
  const destData = {};

  const uid = (p = "id") =>
    `${p}${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;

  const templateCard = cardsHolder.querySelector(".hotel-card");
  if (!templateCard) {
    console.warn("Hotel module: template .hotel-card not found.");
    return;
  }

  const noop = () => {};
  const escapeHtml = (s) =>
    String(s || "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );

  function scrollIntoView(el) {
    try {
      el && el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {}
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mo = d.toLocaleString("en-GB", { month: "short" });
    return `${dd}-${mo}-${d.getFullYear()}`;
  }

  /* =========================
     HOTEL LOADING
     ========================= */
  async function loadHotels() {
    if (hotelsCache) return hotelsCache.slice();
    try {
      if (typeof window.getHotels === "function") {
        const r = window.getHotels();
        if (r && typeof r.then === "function") hotelsCache = (await r) || [];
        else hotelsCache = r || [];
      } else if (Array.isArray(window.getHotels))
        hotelsCache = window.getHotels.slice();
    } catch (e) {
      console.warn("Hotel module: window.getHotels error", e);
    }
    if (!Array.isArray(hotelsCache)) {
      try {
        const raw = localStorage.getItem("hotels");
        hotelsCache = raw ? JSON.parse(raw) : [];
      } catch (e) {
        hotelsCache = [];
      }
    }
    hotelsCache = Array.isArray(hotelsCache) ? hotelsCache : [];
    return hotelsCache.slice();
  }

  function getHotelsForLocationSync(locationLabel, allHotels) {
    if (!locationLabel) return allHotels;
    const needle = String(locationLabel).trim().toLowerCase();
    if (!needle) return allHotels;
    return (allHotels || []).filter((h) => {
      const hloc = String(h.location || h.locationName || "").toLowerCase();
      return hloc && hloc.indexOf(needle) !== -1;
    });
  }

  /* =========================
     ROOM CATEGORY EXTRACTION
     ========================= */
  function extractRoomCategoryFromMatch(match) {
    const out = [];
    if (!match) return out;
    const seen = new Set();

    const push = (cat, qty) => {
      cat = cat == null ? "" : String(cat).trim();
      if (seen.has(cat)) return;
      seen.add(cat);
      out.push({
        category: cat,
        qty: qty == null ? null : Number(qty),
      });
    };

    if (Array.isArray(match.roomsData)) {
      match.roomsData.forEach((r) => {
        const category = r.category || r.cat || r.roomCategory || "";
        const qty = r.qty || r.stock || r.available || r.capacity || null;
        push(category, qty);
      });
    }

    if (Array.isArray(match.roomCategories)) {
      match.roomCategories.forEach((cat) => {
        if (typeof cat === "object" && cat) {
          push(cat.category || cat.name || "", cat.qty || null);
        } else if (typeof cat === "string") {
          push(cat, null);
        }
      });
    }

    if (match.rates && typeof match.rates === "object") {
      try {
        Object.keys(match.rates).forEach((year) => {
          const yearObj = match.rates[year] || {};
          Object.keys(yearObj).forEach((rateType) => {
            (yearObj[rateType] || []).forEach((entry) => {
              if (Array.isArray(entry.rooms) && entry.rooms.length) {
                entry.rooms.forEach((rr) => {
                  const category =
                    rr.category ||
                    rr.cat ||
                    rr.roomCategory ||
                    entry.category ||
                    "";
                  const qty =
                    rr.qty || rr.stock || rr.available || entry.qty || null;
                  push(category, qty);
                });
              } else {
                const category =
                  entry.category || entry.cat || entry.roomCategory || "";
                const qty = entry.qty || entry.stock || entry.available || null;
                push(category, qty);
              }
            });
          });
        });
      } catch (e) {}
    }

    if (Array.isArray(match.roomTypes)) {
      match.roomTypes.forEach((rt) => {
        if (typeof rt === "object" && rt) {
          push(rt.category || rt.class || "", rt.qty || null);
        }
      });
    }

    return out;
  }

  /* =========================
     UI HELPERS
     ========================= */
  function makeBadge(text, opts = {}) {
    const el = document.createElement("span");
    el.textContent = text || "";
    el.style.display = "inline-block";
    el.style.padding = "4px 8px";
    el.style.borderRadius = "14px";
    el.style.fontSize = "12px";
    el.style.fontWeight = "600";
    el.style.lineHeight = "1";
    el.style.verticalAlign = "middle";
    el.style.whiteSpace = "nowrap";
    if (opts.bg) {
      el.style.background = opts.bg;
      el.style.color = opts.color || "#fff";
    } else {
      el.style.background = "#efefef";
      el.style.color = "#222";
    }
    if (opts.marginLeft) el.style.marginLeft = opts.marginLeft;
    if (opts.marginRight) el.style.marginRight = opts.marginRight;
    if (opts.gray) {
      el.style.background = "#f5f5f5";
      el.style.color = "#666";
      el.style.fontWeight = "700";
    }
    return el;
  }

  /* =========================
     CARD BUILDING
     ========================= */
  function buildCardForDest(destLabel) {
    const clone = templateCard.cloneNode(true);
    clone.dataset.destId = destLabel;
    clone.dataset.instance = uid("inst");

    // Reset all fields
    clone.querySelectorAll("input, select, textarea").forEach((el) => {
      if (el.tagName.toLowerCase() === "select") el.selectedIndex = 0;
      else el.value = "";
      el.disabled = false;
      if (el.name === "specialAmount" || el.classList.contains("specialAmount"))
        el.style.display = "none";
    });

    // Hide all conditional sections
    clone
      .querySelectorAll(
        ".specialReqRow, .replacedWrap, .cancelWrap, .cancelAmtWrap"
      )
      .forEach((el) => {
        el.style.display = "none";
      });

    ensureRateOptions(clone);
    setCardHeader(clone, destLabel);
    clone.style.display = "";
    ensureHotelSelectAndPopulate(clone, destLabel, "");
    return clone;
  }

  async function ensureHotelSelectAndPopulate(
    card,
    locationLabel,
    selectedHotelName
  ) {
    if (!card) return null;
    const existing = card.querySelector('[name="hotelName"]');
    const allHotels = await loadHotels();
    const hotels = getHotelsForLocationSync(locationLabel, allHotels);

    if (
      existing &&
      existing.tagName &&
      existing.tagName.toLowerCase() === "select"
    ) {
      populateSelectWithHotels(existing, hotels, selectedHotelName);
      return existing;
    }

    if (existing) {
      const sel = document.createElement("select");
      sel.name = "hotelName";
      sel.className = existing.className || "";
      sel.style.cssText = existing.style.cssText || "";
      if (existing.id) sel.id = existing.id;
      sel.setAttribute(
        "aria-label",
        existing.getAttribute("aria-label") || "Hotel Name"
      );
      populateSelectWithHotels(sel, hotels, selectedHotelName);
      existing.parentNode.replaceChild(sel, existing);
      return sel;
    }

    const form =
      card.querySelector("form.hotelForm") || card.querySelector("form");
    if (form) {
      const wrapper = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = "Hotel Name";
      label.style.display = "block";
      label.style.fontWeight = "600";
      label.style.marginBottom = "6px";
      wrapper.appendChild(label);
      const sel = document.createElement("select");
      sel.name = "hotelName";
      sel.style.width = "100%";
      sel.style.height = "40px";
      sel.style.padding = "8px";
      sel.style.borderRadius = "8px";
      sel.style.border = "1px solid rgba(0,0,0,0.08)";
      populateSelectWithHotels(sel, hotels, selectedHotelName);
      wrapper.appendChild(sel);
      form.insertAdjacentElement("afterbegin", wrapper);
      return sel;
    }
    return null;
  }

  function populateSelectWithHotels(selectEl, hotels, selectedName) {
    if (!selectEl) return;
    const prev = selectEl.value || "";
    selectEl.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Select Hotel";
    selectEl.appendChild(ph);
    (hotels || []).forEach((h) => {
      const name = (h.hotelName || h.name || "").toString();
      const o = document.createElement("option");
      o.value = name;
      o.textContent = name || "Unnamed";
      selectEl.appendChild(o);
    });

    if (selectedName) {
      const match = Array.from(selectEl.options).some(
        (opt) => opt.value === selectedName
      );
      if (match) selectEl.value = selectedName;
    } else if (
      prev &&
      Array.from(selectEl.options).some((opt) => opt.value === prev)
    ) {
      selectEl.value = prev;
    } else selectEl.selectedIndex = 0;

    if ((hotels || []).length === 1 && selectEl.options.length > 1) {
      selectEl.selectedIndex = 1;
      selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function ensureRateOptions(card) {
    Array.from(
      card.querySelectorAll(
        'select[name="rate"], select.rateSelect, select.rate'
      )
    ).forEach((rateEl) => {
      if (!rateEl) return;
      rateEl.innerHTML = "";
      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "Select One";
      rateEl.appendChild(ph);
      BASE_RATE_NAMES.forEach((n) => {
        const o = document.createElement("option");
        o.value = n;
        o.textContent = n;
        rateEl.appendChild(o);
      });
    });
  }

  function setCardHeader(card, text) {
    if (!card) return;
    const hdr =
      card.querySelector(".card-title") ||
      card.querySelector("[data-card-title]") ||
      card.querySelector(":scope > div")?.querySelector("div");
    if (hdr) hdr.textContent = text;
  }

  /* =========================
     POPULATE ROOM OPTIONS
     ========================= */
  async function populateRoomOptions(card, hotelName) {
    if (!card) return;
    hotelName = (
      hotelName ||
      (card.querySelector('[name="hotelName"]') || {}).value ||
      ""
    ).trim();

    const roomCategoryEl = card.querySelector(
      '[name="roomCategory"], select.roomCategory, select[name="roomCategory"]'
    );
    const qtyEl = card.querySelector(
      '[name="qty"], input.qty, input[name="qty"]'
    );

    const allHotels = await loadHotels();
    const needle = hotelName.toLowerCase();
    let match = null;

    if (needle) {
      match = (allHotels || []).find(
        (h) =>
          String(h.hotelName || h.name || "")
            .trim()
            .toLowerCase() === needle
      );
    }

    const roomCategoriesSet = new Set();
    const categoryMap = {};

    if (match) {
      try {
        const extracted = extractRoomCategoryFromMatch(match) || [];
        extracted.forEach((r) => {
          const cat = (r.category || "").toString().trim();
          if (!cat) return;

          roomCategoriesSet.add(cat);
          if (r.qty != null && !isNaN(Number(r.qty)) && !categoryMap[cat]) {
            categoryMap[cat] = Number(r.qty);
          }
        });
      } catch (e) {
        console.warn("populateRoomOptions: error", e);
      }
    }

    let roomCategoryOptions = Array.from(roomCategoriesSet).map((cat) => ({
      value: cat,
      label: cat,
    }));

    if (!roomCategoryOptions.length) {
      roomCategoryOptions = FIXED_ROOM_TOKENS.map((t) => ({
        value: t,
        label: t.toUpperCase(),
      }));
    }

    card._categoryMap = categoryMap;

    if (roomCategoryEl) {
      const prevCat = (roomCategoryEl.value || "").trim();
      roomCategoryEl.innerHTML = "";

      const phCat = document.createElement("option");
      phCat.value = "";
      phCat.textContent = "Room Category";
      roomCategoryEl.appendChild(phCat);

      roomCategoryOptions.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = String(o.value);
        opt.textContent = String(o.label);
        roomCategoryEl.appendChild(opt);
      });

      if (
        prevCat &&
        Array.from(roomCategoryEl.options).some((op) => op.value === prevCat)
      ) {
        roomCategoryEl.value = prevCat;
      } else {
        roomCategoryEl.selectedIndex = 0;
      }

      try {
        if (roomCategoryEl.options.length === 2) {
          roomCategoryEl.selectedIndex = 1;
          roomCategoryEl.dispatchEvent(new Event("change", { bubbles: true }));
        }
      } catch (e) {}

      roomCategoryEl.onchange = function () {
        try {
          const cat = (roomCategoryEl.value || "").toString();
          if (qtyEl) {
            const map = card._categoryMap || {};
            if (
              map.hasOwnProperty(cat) &&
              map[cat] != null &&
              !isNaN(map[cat])
            ) {
              qtyEl.value = Math.max(0, Math.round(Number(map[cat])));
            }
          }
        } catch (e) {}

        saveCardToDestData(card);
      };

      if (roomCategoryEl.value) {
        roomCategoryEl.dispatchEvent(new Event("change"));
      }
    }

    return match;
  }

  /* =========================
     TOGGLE FUNCTIONS FOR ROOM BLOCKS
     ========================= */
  function toggleReqVisibilityForRoomBlock(roomBlock) {
    const specialReqSelect = roomBlock.querySelector(
      'select[name="specialReq"]'
    );
    const specialReqRow = roomBlock.querySelector(".specialReqRow");

    if (!specialReqSelect || !specialReqRow) return;

    const show = (specialReqSelect.value || "").toLowerCase() === "yes";
    specialReqRow.style.display = show ? "block" : "none";

    if (!show) {
      const reqType = roomBlock.querySelector('input[name="reqType"]');
      const amt = roomBlock.querySelector('input[name="amt"]');
      if (reqType) reqType.value = "";
      if (amt) amt.value = "";
    }
  }

  function toggleBookingFieldsForRoomBlock(roomBlock) {
    const bookingStatusSelect = roomBlock.querySelector(
      'select[name="bookingStatus"]'
    );
    const replacedWrap = roomBlock.querySelector(".replacedWrap");
    const cancelWrap = roomBlock.querySelector(".cancelWrap");
    const cancelAmtWrap = roomBlock.querySelector(".cancelAmtWrap");

    if (!bookingStatusSelect) return;

    const status = bookingStatusSelect.value;

    // Show/hide replaced wrapper
    if (replacedWrap) {
      replacedWrap.style.display = status === "Replaced" ? "block" : "none";
    }

    // Show/hide cancellation wrapper
    if (cancelWrap) {
      cancelWrap.style.display = status === "Cancelled" ? "block" : "none";

      // Hide cancellation amount if cancellation wrapper is hidden
      if (status !== "Cancelled" && cancelAmtWrap) {
        cancelAmtWrap.style.display = "none";
      }
    }
  }

  function toggleCancelAmountForRoomBlock(roomBlock) {
    const cancellationTypeSelect = roomBlock.querySelector(
      'select[name="cancellationType"]'
    );
    const cancelAmtWrap = roomBlock.querySelector(".cancelAmtWrap");
    const bookingStatusSelect = roomBlock.querySelector(
      'select[name="bookingStatus"]'
    );

    if (!cancellationTypeSelect || !cancelAmtWrap || !bookingStatusSelect)
      return;

    // Only show cancellation amount if:
    // 1. Booking status is "Cancelled"
    // 2. Cancellation type is "Chargeable"
    if (bookingStatusSelect.value === "Cancelled") {
      cancelAmtWrap.style.display =
        cancellationTypeSelect.value === "Chargeable" ? "block" : "none";
    } else {
      cancelAmtWrap.style.display = "none";
    }

    // Clear cancellation amount if not chargeable
    if (cancellationTypeSelect.value !== "Chargeable") {
      const cancellationAmt = roomBlock.querySelector(
        'input[name="cancellationAmt"]'
      );
      if (cancellationAmt) cancellationAmt.value = "";
    }
  }

  /* =========================
     SETUP ROOM BLOCK EVENTS
     ========================= */
  function setupRoomBlockEvents(roomBlock, card) {
    // Special request toggle
    const specialReqSelect = roomBlock.querySelector(
      'select[name="specialReq"]'
    );
    if (specialReqSelect) {
      specialReqSelect.addEventListener("change", function () {
        toggleReqVisibilityForRoomBlock(roomBlock);
        saveCardToDestData(card);
      });
    }

    // Booking status toggle
    const bookingStatusSelect = roomBlock.querySelector(
      'select[name="bookingStatus"]'
    );
    if (bookingStatusSelect) {
      bookingStatusSelect.addEventListener("change", function () {
        toggleBookingFieldsForRoomBlock(roomBlock);
        toggleCancelAmountForRoomBlock(roomBlock);
        saveCardToDestData(card);
      });
    }

    // Cancellation type toggle
    const cancellationTypeSelect = roomBlock.querySelector(
      'select[name="cancellationType"]'
    );
    if (cancellationTypeSelect) {
      cancellationTypeSelect.addEventListener("change", function () {
        toggleCancelAmountForRoomBlock(roomBlock);
        saveCardToDestData(card);
      });
    }

    // Clone room button
    const cloneRoomBtn = roomBlock.querySelector(".cloneRoomBtn");
    if (cloneRoomBtn) {
      cloneRoomBtn.addEventListener("click", function () {
        cloneRoomBlock(this);
      });
    }

    // Remove room button
    const removeRoomBtn = roomBlock.querySelector(".RcloneRoomBtn");
    if (removeRoomBtn) {
      removeRoomBtn.addEventListener("click", function () {
        removeRoomBlock(this);
      });
    }

    // Add change/input events to all inputs and selects
    roomBlock.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("change", () => saveCardToDestData(card));
      el.addEventListener("input", () => saveCardToDestData(card));
    });

    // Initialize visibility based on current values
    toggleReqVisibilityForRoomBlock(roomBlock);
    toggleBookingFieldsForRoomBlock(roomBlock);
    toggleCancelAmountForRoomBlock(roomBlock);
  }

  /* =========================
     RATE ROWS
     ========================= */
  function addRateRow(card) {
    const wrap =
      card.querySelector(".rateRows") ||
      card.querySelector(".rateRow")?.parentNode;
    if (!wrap) return;
    const row = document.createElement("div");
    row.className = "rateRow";
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.alignItems = "center";

    const sel = document.createElement("select");
    sel.name = "rate";
    sel.className = "rateSelect";
    sel.style.flex = "1";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Select One";
    sel.appendChild(ph);
    BASE_RATE_NAMES.forEach((n) => {
      const o = document.createElement("option");
      o.value = n;
      o.textContent = n;
      sel.appendChild(o);
    });

    const amt = document.createElement("input");
    amt.type = "number";
    amt.name = "specialAmount";
    amt.placeholder = "Amt";
    amt.style.width = "100px";
    amt.style.display = "none";
    amt.min = "0";
    amt.step = "0.01";

    sel.addEventListener("change", () => {
      if (amt)
        amt.style.display =
          sel.value === "Special" || sel.value === "Special Rate" ? "" : "none";
      if (sel.value === "FOC") {
        amt.value = "0";
        amt.disabled = true;
      } else amt.disabled = false;
      saveCardToDestData(card);
    });

    row.appendChild(sel);
    row.appendChild(amt);
    wrap.appendChild(row);
  }

  function removeRateRow(card) {
    const wrap = card.querySelector(".rateRows") || card;
    if (!wrap) return;
    const rows = wrap.querySelectorAll(".rateRow");
    if (rows.length <= 1) {
      const sel = wrap.querySelector('select[name="rate"], select.rateSelect');
      const amt = wrap.querySelector('input[name="specialAmount"]');
      if (sel) sel.selectedIndex = 0;
      if (amt) {
        amt.value = "";
        amt.style.display = "none";
        amt.disabled = false;
      }
    } else rows[rows.length - 1].remove();
  }

  function applyRateBehavior(card) {
    const s = (sel) => card.querySelector(sel);
    const rateEl = s('[name="rate"], select.rateSelect, select.rate');
    const specialAmt = s('[name="specialAmount"]');
    const amtEl = s('[name="amt"]');
    if (!rateEl) return;
    const rate = rateEl.value;
    if (rate === "FOC") {
      if (specialAmt) {
        specialAmt.value = "0";
        specialAmt.disabled = true;
        specialAmt.style.display = "none";
      }
      if (amtEl) {
        amtEl.value = "0";
        amtEl.disabled = true;
      }
    } else if (rate === "Special" || rate === "Special Rate") {
      if (specialAmt) {
        specialAmt.disabled = false;
        specialAmt.style.display = "";
        specialAmt.type = "number";
      }
      if (amtEl) amtEl.disabled = false;
    } else {
      if (specialAmt) {
        specialAmt.disabled = true;
        specialAmt.style.display = "none";
        specialAmt.value = "";
      }
      if (amtEl) amtEl.disabled = false;
    }
  }

  /* =========================
     DATE CALC
     ========================= */
  function attachDateCalc(card) {
    const chkIn = card.querySelector('[name="checkIn"]');
    const chkOut = card.querySelector('[name="checkOut"]');
    const nights = card.querySelector('[name="nights"]');
    if (!chkIn || !chkOut || !nights) return;
    function calc() {
      if (!chkIn.value || !chkOut.value) return;
      const d1 = new Date(chkIn.value),
        d2 = new Date(chkOut.value);
      nights.value =
        d2 > d1 ? Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) : 0;
    }
    chkIn.addEventListener("change", () => {
      calc();
      saveCardToDestData(card);
    });
    chkOut.addEventListener("change", () => {
      calc();
      saveCardToDestData(card);
    });
  }

  /* =========================
     SAVE / POPULATE ENTRY DATA
     ========================= */
  function saveCardToDestData(card) {
    const dest = card.dataset.destId;
    if (!dest) return;

    // Collect data from all room blocks
    const roomBlocks = card.querySelectorAll(".roomBlock");
    const entries = [];

    roomBlocks.forEach((roomBlock) => {
      const s = (sel) => roomBlock.querySelector(sel);
      const entry = {
        id: card.dataset.instance || uid("inst"),
        roomBlockId: roomBlock.dataset.blockId || uid("block"),
        hotelName: (card.querySelector('[name="hotelName"]') || { value: "" })
          .value,
        checkIn: (card.querySelector('[name="checkIn"]') || { value: "" })
          .value,
        checkOut: (card.querySelector('[name="checkOut"]') || { value: "" })
          .value,
        nights: (card.querySelector('[name="nights"]') || { value: "" }).value,
        mealPlan: (card.querySelector('[name="mealPlan"]') || { value: "" })
          .value,
        nationality: (s('[name="nationality"]') || { value: "" }).value,
        roomType: (s('[name="roomType"]') || { value: "" }).value,
        roomCategory: (s('[name="roomCategory"]') || { value: "" }).value,
        qty: (s('[name="qty"]') || { value: "" }).value,
        rate: (s('[name="rate"]') || { value: "" }).value,
        specialRate: (s('[name="specialAmount"]') || { value: "" }).value,
        specialReq: (s('[name="specialReq"]') || { value: "" }).value,
        reqType: (s('[name="reqType"]') || { value: "" }).value,
        amt: (s('[name="amt"]') || { value: "" }).value,
        bookingStatus: (s('[name="bookingStatus"]') || { value: "" }).value,
        replacedFrom: (s('[name="replacedFrom"]') || { value: "" }).value,
        cancellationType: (s('[name="cancellationType"]') || { value: "" })
          .value,
        cancellationAmt: (s('[name="cancellationAmt"]') || { value: "" }).value,
      };
      entries.push(entry);
    });

    if (!Array.isArray(destData[dest])) destData[dest] = [];

    // Remove old entries for this card
    destData[dest] = destData[dest].filter(
      (e) => e.id !== card.dataset.instance
    );

    // Add new entries
    destData[dest].push(...entries);

    renderSummary();
  }

  function populateCardFromData(card, dest) {
    const arr = destData[dest] || [];
    const cardEntries = arr.filter((e) => e.id === card.dataset.instance);

    if (cardEntries.length === 0) return;

    // Populate common fields from first entry
    const firstEntry = cardEntries[0];
    const s = (sel) => card.querySelector(sel);

    if (s('[name="hotelName"]'))
      s('[name="hotelName"]').value = firstEntry.hotelName || "";
    if (s('[name="checkIn"]'))
      s('[name="checkIn"]').value = firstEntry.checkIn || "";
    if (s('[name="checkOut"]'))
      s('[name="checkOut"]').value = firstEntry.checkOut || "";
    if (s('[name="nights"]'))
      s('[name="nights"]').value = firstEntry.nights || "";
    if (s('[name="mealPlan"]'))
      s('[name="mealPlan"]').value = firstEntry.mealPlan || "Select One";

    ensureHotelSelectAndPopulate(
      card,
      card.dataset.destId || dest || "",
      firstEntry.hotelName || ""
    )
      .then(() => populateRoomOptions(card, firstEntry.hotelName || ""))
      .catch(noop);

    ensureRateOptions(card);
    applyRateBehavior(card);

    // Clear existing room blocks except the first one
    const roomBlocks = card.querySelectorAll(".roomBlock");
    for (let i = 1; i < roomBlocks.length; i++) {
      roomBlocks[i].remove();
    }

    // Keep first room block and populate it
    const firstRoomBlock = card.querySelector(".roomBlock");
    if (firstRoomBlock && cardEntries[0]) {
      populateRoomBlockFromData(firstRoomBlock, cardEntries[0]);
    }

    // Create additional room blocks if needed
    for (let i = 1; i < cardEntries.length; i++) {
      const newRoomBlock = firstRoomBlock.cloneNode(true);
      newRoomBlock.dataset.blockId = uid("block");
      firstRoomBlock.insertAdjacentElement("afterend", newRoomBlock);
      populateRoomBlockFromData(newRoomBlock, cardEntries[i]);
      setupRoomBlockEvents(newRoomBlock, card);
    }

    renderSummary();
  }

  function populateRoomBlockFromData(roomBlock, data) {
    const s = (sel) => roomBlock.querySelector(sel);

    if (s('[name="nationality"]'))
      s('[name="nationality"]').value = data.nationality || "";
    if (s('[name="roomType"]'))
      s('[name="roomType"]').value = data.roomType || "";
    if (s('[name="roomCategory"]'))
      s('[name="roomCategory"]').value = data.roomCategory || "";
    if (s('[name="qty"]')) s('[name="qty"]').value = data.qty || "";
    if (s('[name="rate"]')) s('[name="rate"]').value = data.rate || "";
    if (s('[name="specialAmount"]'))
      s('[name="specialAmount"]').value = data.specialRate || "";
    if (s('[name="specialReq"]'))
      s('[name="specialReq"]').value = data.specialReq || "";
    if (s('[name="reqType"]')) s('[name="reqType"]').value = data.reqType || "";
    if (s('[name="amt"]')) s('[name="amt"]').value = data.amt || "";
    if (s('[name="bookingStatus"]'))
      s('[name="bookingStatus"]').value = data.bookingStatus || "";
    if (s('[name="replacedFrom"]'))
      s('[name="replacedFrom"]').value = data.replacedFrom || "";
    if (s('[name="cancellationType"]'))
      s('[name="cancellationType"]').value = data.cancellationType || "";
    if (s('[name="cancellationAmt"]'))
      s('[name="cancellationAmt"]').value = data.cancellationAmt || "";
  }

  /* =========================
     CARD EVENT BINDING
     ========================= */
  function bindCardEvents(card) {
    if (!card || card._bound) return;
    card._bound = true;

    if (!card.dataset.destId) card.dataset.destId = "";

    if (card.dataset.destId) {
      populateCardFromData(card, card.dataset.destId);
      setCardHeader(card, card.dataset.destId);
    }

    ensureRateOptions(card);

    // Setup events for all room blocks
    const roomBlocks = card.querySelectorAll(".roomBlock");
    roomBlocks.forEach((roomBlock) => {
      if (!roomBlock.dataset.blockId) {
        roomBlock.dataset.blockId = uid("block");
      }
      setupRoomBlockEvents(roomBlock, card);
    });

    // Clone card button
    const cloneBtn = card.querySelector(".cloneCardBtn");
    if (cloneBtn) {
      cloneBtn.addEventListener("click", () => {
        const clone = card.cloneNode(true);
        clone.dataset.instance = uid("inst");

        // Reset all fields
        clone.querySelectorAll("input, select, textarea").forEach((el) => {
          if (el.tagName.toLowerCase() === "select") el.selectedIndex = 0;
          else el.value = "";
          el.disabled = false;
          if (el.name === "specialAmount") el.style.display = "none";
        });

        // Hide all conditional sections
        clone
          .querySelectorAll(
            ".specialReqRow, .replacedWrap, .cancelWrap, .cancelAmtWrap"
          )
          .forEach((el) => {
            el.style.display = "none";
          });

        const dest = card.dataset.destId || destSelect.value || "";
        clone.dataset.destId = dest;
        setCardHeader(clone, dest || "Hotel Service");

        ensureRateOptions(clone);
        ensureHotelSelectAndPopulate(
          clone,
          clone.dataset.destId || destSelect.value || "",
          (card.querySelector('[name="hotelName"]') || {}).value || ""
        ).catch(noop);

        clone._bound = false;
        card.insertAdjacentElement("afterend", clone);
        bindCardEvents(clone);
        applyRateBehavior(clone);

        const hn = clone.querySelector('[name="hotelName"]');
        if (hn) hn.focus();
        scrollIntoView(clone);
        renderSummary();
      });
    }

    // Remove card button
    const removeCardBtn = card.querySelector(".RcloneCardBtn");
    if (removeCardBtn) {
      removeCardBtn.addEventListener("click", function () {
        if (!confirm("Remove this hotel card?")) return;
        const dest = card.dataset.destId;
        const instanceId = card.dataset.instance;

        card.remove();

        if (Array.isArray(destData[dest])) {
          destData[dest] = destData[dest].filter((e) => e.id !== instanceId);
          if (!destData[dest].length) delete destData[dest];
        }

        renderSummary();
      });
    }

    // Rate buttons
    const addRateBtn = card.querySelector(".addRateBtn");
    const removeRateBtn = card.querySelector(".removeRateBtn");
    if (addRateBtn)
      addRateBtn.addEventListener("click", () => addRateRow(card));
    if (removeRateBtn)
      removeRateBtn.addEventListener("click", () => removeRateRow(card));

    attachDateCalc(card);

    // Hotel name change
    const hotelField = card.querySelector('[name="hotelName"]');
    if (hotelField) {
      hotelField.addEventListener("change", (ev) => {
        try {
          const hn = (ev.target.value || "").trim();
          populateRoomOptions(card, hn);
          saveCardToDestData(card);
        } catch (e) {
          console.warn("hotel change handler failed", e);
        }
      });
    }

    applyRateBehavior(card);
  }

  function getCardsForDest(destLabel) {
    return Array.from(cardsHolder.querySelectorAll(".hotel-card")).filter(
      (c) => (c.dataset.destId || "") === destLabel
    );
  }

  /* =========================
     REMOVE ROOM BLOCK FUNCTION
     ========================= */
  function removeRoomBlock(btn) {
    const roomBlock = btn.closest(".roomBlock");
    if (!roomBlock) return;

    const card = roomBlock.closest(".hotel-card");
    const roomBlocks = card.querySelectorAll(".roomBlock");

    if (roomBlocks.length <= 1) {
      alert(
        "Cannot remove the only room block. You can remove the entire card instead."
      );
      return;
    }

    if (!confirm("Remove this room block?")) return;

    roomBlock.remove();
    saveCardToDestData(card);
  }

  /* =========================
     CLONE ROOM BLOCK FUNCTION - FIXED
     ========================= */
  function cloneRoomBlock(btn) {
    const roomBlock = btn.closest(".roomBlock");
    if (!roomBlock) return;

    const clone = roomBlock.cloneNode(true);

    // Reset all values in cloned room block
    clone.querySelectorAll("input, select").forEach((el) => {
      if (el.tagName.toLowerCase() === "select") {
        el.selectedIndex = 0;
      } else {
        el.value = "";
      }
      el.disabled = false;
    });

    // Hide all conditional sections in the clone
    clone
      .querySelectorAll(
        ".specialReqRow, .replacedWrap, .cancelWrap, .cancelAmtWrap"
      )
      .forEach((el) => {
        el.style.display = "none";
      });

    // Assign new block ID
    clone.dataset.blockId = uid("block");

    const card = roomBlock.closest(".hotel-card");

    if (card) {
      roomBlock.insertAdjacentElement("afterend", clone);
      setupRoomBlockEvents(clone, card);
      saveCardToDestData(card);
    }
  }

  /* =========================
     TAB UI
     ========================= */
  function findTabFor(destLabel) {
    return Array.from(tabsContainer.querySelectorAll(".dest-tab")).find(
      (t) => t.dataset.dest === destLabel
    );
  }

  function createTab(destLabel) {
    let existing = findTabFor(destLabel);
    if (existing) {
      activateTab(existing);
      return existing;
    }

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "dest-tab";
    tab.dataset.dest = destLabel;
    tab.innerHTML = `<span class="tabLabel" style="padding:6px 10px;display:inline-block">${escapeHtml(
      destLabel
    )}</span><span class="closeTab" title="Close" role="button" style="margin-left:8px;border:0;background:transparent;cursor:pointer;user-select:none;">✖</span>`;
    tabsContainer.appendChild(tab);

    tab.addEventListener("click", (ev) => {
      if (ev.target.classList.contains("closeTab")) return;
      activateTab(tab);
    });

    tab.querySelector(".closeTab").addEventListener("click", (ev) => {
      ev.stopPropagation();
      const thisDest = tab.dataset.dest;
      getCardsForDest(thisDest).forEach((c) => (c.style.display = "none"));
      tab.remove();
      if (!getCardsForDest(thisDest).length) {
        delete destData[thisDest];
        renderSummary();
      }
      const next = tabsContainer.querySelector(".dest-tab");
      if (next) activateTab(next);
    });

    activateTab(tab);
    return tab;
  }

  async function activateTab(tabEl) {
    const dest = tabEl.dataset.dest;

    // Update tab styling
    Array.from(tabsContainer.querySelectorAll(".dest-tab")).forEach((t) => {
      t.classList.toggle("active", t === tabEl);
      t.style.backgroundColor = t === tabEl ? "#3b5f23" : "#dfead9";
      t.style.color = t === tabEl ? "#fff" : "inherit";
      t.setAttribute("aria-pressed", t === tabEl ? "true" : "false");
    });

    // Hide all cards
    Array.from(cardsHolder.querySelectorAll(".hotel-card")).forEach(
      (c) => (c.style.display = "none")
    );

    // Show cards for this destination or create new one
    const cards = getCardsForDest(dest);
    if (!cards.length) {
      const newCard = buildCardForDest(dest);
      cardsHolder.appendChild(newCard);
      bindCardEvents(newCard);
      try {
        await ensureHotelSelectAndPopulate(newCard, dest, "");
      } catch (e) {}
      newCard.style.display = "";
      scrollIntoView(newCard);
    } else {
      cards.forEach((c) => {
        c.style.display = "";
        setCardHeader(c, dest);
        ensureHotelSelectAndPopulate(
          c,
          dest,
          (c.querySelector('[name="hotelName"]') || {}).value || ""
        ).catch(noop);
        populateCardFromData(c, dest);
      });
      scrollIntoView(cards[0]);
    }

    destSelect.value = dest;
    renderSummary();
  }

  /* =========================
     SUMMARY RENDER
     ========================= */
  function renderSummary() {
    summaryContainer.innerHTML = "";
    const destKeys = Object.keys(destData || {});

    if (!destKeys.length) {
      summaryContainer.innerHTML = `
      <div style="color:#666;font-size:13px;text-align:center;padding:20px;">
        No hotel summary yet. Add hotels or fill the form to see live updates.
      </div>`;
      return;
    }

    destKeys.forEach((dest) => {
      const entries = (destData[dest] || []).filter(Boolean);
      if (!entries.length) return;

      const destHeader = document.createElement("div");
      Object.assign(destHeader.style, {
        background: "#537c36",
        color: "#fff",
        padding: "6px 10px",
        borderRadius: "6px",
        marginBottom: "10px",
        fontWeight: "600",
        fontSize: "14px",
      });
      destHeader.textContent = dest;
      summaryContainer.appendChild(destHeader);

      // Group entries by card
      const cardIds = [...new Set(entries.map((e) => e.id))];

      cardIds.forEach((cardId, cardIndex) => {
        const cardEntries = entries.filter((e) => e.id === cardId);
        const firstEntry = cardEntries[0];

        const cardEl = document.createElement("div");
        Object.assign(cardEl.style, {
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid rgba(0,0,0,.06)",
          background: cardIndex % 2 === 0 ? "#fafafa" : "#f5f5f5",
          marginBottom: "8px",
        });

        // Hotel info line
        const hotelLine = document.createElement("div");
        Object.assign(hotelLine.style, {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "8px",
        });

        const hotelName = document.createElement("span");
        hotelName.textContent = firstEntry.hotelName || "Unnamed Hotel";
        hotelName.style.fontWeight = "600";
        hotelName.style.color = "#1b4f1b";
        hotelLine.appendChild(hotelName);

        if (firstEntry.checkIn && firstEntry.checkOut) {
          const nights = Math.round(
            (new Date(firstEntry.checkOut) - new Date(firstEntry.checkIn)) /
              (1000 * 60 * 60 * 24)
          );
          if (nights > 0) hotelLine.appendChild(makeBadge(`${nights}N`));
        }

        if (firstEntry.mealPlan)
          hotelLine.appendChild(makeBadge(firstEntry.mealPlan));

        if (firstEntry.checkIn && firstEntry.checkOut) {
          hotelLine.appendChild(
            makeBadge(
              `${new Date(
                firstEntry.checkIn
              ).toLocaleDateString()} - ${new Date(
                firstEntry.checkOut
              ).toLocaleDateString()}`,
              { bg: "#eef2f7", color: "#555" }
            )
          );
        }

        cardEl.appendChild(hotelLine);

        // Room blocks
        cardEntries.forEach((entry, roomIndex) => {
          const roomLine = document.createElement("div");
          Object.assign(roomLine.style, {
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            fontSize: "13px",
            marginTop: roomIndex === 0 ? "0" : "6px",
            paddingLeft: "4px",
          });

          if (entry.nationality)
            roomLine.appendChild(
              makeBadge(entry.nationality, { bg: "#e0e7ff", color: "#3730a3" })
            );

          const categoryText = document.createElement("span");
          categoryText.textContent = `${entry.roomCategory || "-"}-${
            entry.roomType || "-"
          }`;
          roomLine.appendChild(categoryText);

          if (entry.qty)
            roomLine.appendChild(
              makeBadge(entry.qty, { bg: "#e0f2fe", color: "#075985" })
            );

          const status = document.createElement("span");
          status.style.fontSize = "12px";
          status.style.fontWeight = "600";
          status.style.padding = "3px 8px";
          status.style.borderRadius = "4px";

          if (entry.bookingStatus === "Cancelled") {
            status.style.background = "#fee2e2";
            status.style.color = "#dc2626";
            status.textContent = "Cancelled";
          } else if (entry.bookingStatus === "Replaced") {
            status.style.background = "#fef3c7";
            status.style.color = "#d97706";
            status.textContent = "Replaced";
          } else {
            status.style.background = "#d1fae5";
            status.style.color = "#065f46";
            status.textContent = "Confirmed";
          }

          roomLine.appendChild(status);
          cardEl.appendChild(roomLine);
        });

        summaryContainer.appendChild(cardEl);
      });
    });
  }
  /* =========================
     INIT / BOOT
     ========================= */
  function init() {
    // Hide all existing cards
    Array.from(cardsHolder.querySelectorAll(".hotel-card")).forEach((c, i) => {
      c.classList.add("hc-hidden");
      c.style.display = "none";
      if (!c.dataset.destId) c.dataset.instance = `base-${i}`;
      bindCardEvents(c);
    });

    // Add tab button event
    addTabBtn.addEventListener("click", () => {
      const dest = (destSelect.value || "").trim();
      if (!dest) {
        alert("Please choose a destination first.");
        destSelect.focus();
        return;
      }
      createTab(dest);
    });

    // Destination select events
    destSelect.addEventListener("change", () => {
      const dest = (destSelect.value || "").trim();
      if (!dest) return;
      createTab(dest);
    });

    destSelect.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        addTabBtn.click();
      }
    });

    // Compatibility helpers
    window.toggleTick = function (label) {
      if (!label) return;
      const input = label.querySelector('input[type="checkbox"]');
      const box = label.querySelector(".chkbox");
      const text = label.querySelector(".lbltext");
      if (!input || !box || !text) return;
      input.checked = !input.checked;
      if (input.checked) {
        box.textContent = "✔";
        box.style.background = "#3ba029";
        box.style.color = "#fff";
        box.style.borderColor = "#3ba029";
        text.style.color = "#3ba029";
        text.style.fontWeight = "600";
      } else {
        box.textContent = "";
        box.style.background = "transparent";
        box.style.color = "";
        box.style.borderColor = "#3ba029";
        text.style.color = "#000";
        text.style.fontWeight = "400";
      }
    };

    window.initHotelTable = function () {
      console.log("Hotel table initialization placeholder");
    };
    window.cloneRoomBlock = cloneRoomBlock;
    // Initial render
    renderSummary();

    // Try to sync hotels
    try {
      if (typeof window.fetchAndSyncHotels === "function") {
        const maybe = window.fetchAndSyncHotels();
        if (maybe && typeof maybe.then === "function") maybe.catch(noop);
      }
    } catch (e) {}
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

//Auto Generation Booking Id for Ideal Travel Creations //
const companySelect = document.getElementById("groupchart-company");
const bookingInput = document.getElementById("groupchart-fileNo");
let idealCounter = parseInt(localStorage.getItem("idealCounter") || "25100");

if (companySelect && bookingInput) {
  companySelect.addEventListener("change", function () {
    const company = this.value;

    if (company === "Ideal Travel Creations") {
      idealCounter++;
      const bookingID = "IDEAL-" + idealCounter;

      bookingInput.value = bookingID;
      bookingInput.readOnly = true;

      localStorage.setItem("idealCounter", idealCounter);
    } else if (company === "Neptune Holidays Bhutan") {
      bookingInput.value = "";
      bookingInput.readOnly = false;
    } else {
      bookingInput.value = "";
      bookingInput.readOnly = false;
    }
  });
}
