// ================== GUIDE BANK DETAILS DATA ======================
const guideBankData = {
  "Karma Dorji": {
    bankName: "Bhutan National Bank",
    accountName: "Karma Dorji",
    accountNo: "20001234567"
  },
  "Sonam Thinley": {
    bankName: "Bank of Bhutan",
    accountName: "Sonam Thinley",
    accountNo: "11004599877"
  },
  "Tashi Wangchuk": {
    bankName: "T Bank",
    accountName: "Tashi Wangchuk",
    accountNo: "00987654321"
  }
  // Add more guides here...
};

// ================== GUIDE DSA & ADJUSTMENT JS =====================//
document.addEventListener("DOMContentLoaded", () => {
  // --- Elements (main) ---
  const rootSection = document.getElementById("guideDsaSection");
  const gdsDutyTable = document.getElementById("gdsDutyTable");
  const gdsOtherAmt = document.getElementById("gdsOtherAmt");
  const gdsDutyTotal = document.getElementById("gdsDutyTotal");
  const gdsDutyGst = document.getElementById("gdsDutyGst");
  const gdsDutyTotalInclGst = document.getElementById("gdsDutyTotalInclGst");
  const gdsTotalDsa = document.getElementById("gdsTotalDsa");
  const gdsTotalExp = document.getElementById("gdsTotalExp");
  const gdsLessImprest = document.getElementById("gdsLessImprest");
  const gdsPayable = document.getElementById("gdsPayable");
  const printGds = document.getElementById("printGds");
  const cancelGds = document.getElementById("cancelGds");

  // bank/guide fields
  const gdsGuide = document.getElementById("gdsGuide");
  const gdsBankName = document.getElementById("gdsBankName");
  const gdsAccountName = document.getElementById("gdsAccountName");
  const gdsAccountNo = document.getElementById("gdsAccountNo");

  // Imprest input in expenses area (sync to gdsLessImprest)
  const gdsImprestTaken = document.getElementById("gdsImprestTaken");

  // Helper: find the "Total Amount" input inside Imprest section (unnamed in HTML)
  function findImprestTotalInput() {
    // look for label with 'Total Amount' inside rootSection, return its next input
    const labels = rootSection.querySelectorAll("label");
    for (const lbl of labels) {
      if (lbl.textContent.trim().toLowerCase().includes("total amount")) {
        // next element sibling could be input or wrapper; search forward for input
        let el = lbl.nextElementSibling;
        while (el) {
          if (el.tagName && el.tagName.toLowerCase() === "input") return el;
          el = el.nextElementSibling;
        }
      }
    }
    return null;
  }
  const impostTotalInput = findImprestTotalInput();

  // ------- DUTY TOTALS -------
  function updateDutyTotals() {
    let total = 0;
    gdsDutyTable.querySelectorAll(".gds-duty-row").forEach((row) => {
      const amtEl = row.querySelector(".gds-amount");
      const amount = parseFloat(amtEl?.value) || 0;
      total += amount;
    });

    const otherAmtVal = parseFloat(gdsOtherAmt.value) || 0;
    const gstVal = parseFloat(gdsDutyGst.value) || 0;

    // total (basic) shown in gdsDutyTotal
    gdsDutyTotal.value = (total + otherAmtVal).toFixed(2);

    // amount including GST
    gdsDutyTotalInclGst.value = (total + otherAmtVal + gstVal).toFixed(2);

    // sync Total DSA field
    gdsTotalDsa.value = parseFloat(gdsDutyTotalInclGst.value || 0).toFixed(2);

    // update payable
    updateOverallTotals();
  }

  function updateOverallTotals() {
    const totalDsa = parseFloat(gdsTotalDsa.value) || 0;
    const totalExp = parseFloat(gdsTotalExp.value) || 0;
    const lessImprest = parseFloat(gdsLessImprest.value) || 0;
    const payable = totalDsa + totalExp - lessImprest;
    gdsPayable.value = payable.toFixed(2);
  }

  // Delegated input handler for duty amounts (and Enter to add)
  gdsDutyTable.addEventListener("input", (e) => {
    if (e.target.classList.contains("gds-amount")) updateDutyTotals();
  });
  gdsDutyTable.addEventListener("keydown", (e) => {
    if (e.target.classList && e.target.classList.contains("gds-amount") && e.key === "Enter") {
      e.preventDefault();
      addDutyRow();
    }
  });

  // ------- ADD / MANAGE DUTY ROWS -------
  function addDutyRow(prefill = {}) {
    const row = document.createElement("div");
    row.classList.add("gds-duty-row");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "100px 150px 220px 220px 80px 130px";
    row.style.gap = "10px";

    row.innerHTML = `
      <input type="text" class="gds-day" placeholder="Day" value="${escapeHtml(prefill.day||"")}"
        style="padding:6px; border:1px solid #9fbf92; border-radius:4px; width:100%; text-align:center;">
      <input type="date" class="gds-date" value="${prefill.date||""}"
        style="padding:6px; border:1px solid #9fbf92; border-radius:4px; width:100%; text-align:center;">
      <input type="text" class="gds-from" placeholder="From" value="${escapeHtml(prefill.from||"")}"
        style="padding:6px; border:1px solid #9fbf92; border-radius:4px; width:100%;">
      <input type="text" class="gds-to" placeholder="To" value="${escapeHtml(prefill.to||"")}"
        style="padding:6px; border:1px solid #9fbf92; border-radius:4px; width:100%;">
      <input type="number" class="gds-amount" placeholder="0.00" value="${prefill.amount||0}"
        style="padding:6px; border:1px solid #9fbf92; border-radius:4px; text-align:right; width:100%;">
      <input type="text" class="gds-remarks" placeholder="Remarks" value="${escapeHtml(prefill.remarks||"")}"
        style="padding:6px; border:1px solid #9fbf92; border-radius:4px; width:100%;">
    `;
    gdsDutyTable.appendChild(row);
  }

  // small escape helper for attribute injection safety
  function escapeHtml(str) {
    return String(str).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // ------- EXPENSE ROWS MANAGEMENT (clone/delete & sum) -------
  // find the expense container (the big block with the three rows)
  // I'll select the block by searching inside rootSection for the occurrence of inputs matching the grid template used in the HTML
  const expenseContainer = (() => {
    // The expense rows are the immediate children inside the Imprest & Other Expenses block; detect by looking for repeated grid containers with 7 columns
    const candidates = rootSection.querySelectorAll("div");
    for (const c of candidates) {
      const children = Array.from(c.children);
      // detect a grid row: it has inputs and two buttons with + and ×
      if (children.length >= 7) {
        const btns = children.filter(ch => ch.tagName.toLowerCase() === "button");
        if (btns.length >= 2) {
          // accept this container as expense container
          return c;
        }
      }
    }
    return null;
  })();

  // utility to sum bill amounts inside expenseContainer and put result into gdsTotalExp and the printed "Total Amount" input
  function updateExpensesTotal() {
    let sum = 0;
    if (!expenseContainer) {
      gdsTotalExp.value = (0).toFixed(2);
      if (impostTotalInput) impostTotalInput.value = (0).toFixed(2);
      updateOverallTotals();
      return;
    }
    // find all bill amount inputs (type=number) inside expenseContainer rows
    const billInputs = expenseContainer.querySelectorAll('input[type="number"]');
    billInputs.forEach(inp => {
      sum += parseFloat(inp.value) || 0;
    });
    gdsTotalExp.value = sum.toFixed(2);
    if (impostTotalInput) impostTotalInput.value = sum.toFixed(2);
    updateOverallTotals();
  }

  // attach delegated click handler for + and × buttons inside expenseContainer
  if (expenseContainer) {
    expenseContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const row = btn.closest("div");
      const isAdd = btn.textContent.trim() === "+";
      const isRemove = btn.textContent.trim() === "×" || btn.textContent.trim().toLowerCase() === "x" || btn.textContent.trim() === "✕";

      if (isAdd) {
        // clone row
        const clone = row.cloneNode(true);
        // clear values in cloned inputs (except maybe keep date)
        clone.querySelectorAll("input").forEach(input => {
          if (input.type === "number") input.value = 0;
          else input.value = "";
        });
        row.parentNode.insertBefore(clone, row.nextSibling);
        // after cloning, ensure new inputs update totals when changed
        updateExpensesTotal();
      } else if (isRemove) {
        // remove row; ensure at least one row remains
        const rows = Array.from(row.parentNode.children).filter(c => c !== null && c.tagName && c.tagName.toLowerCase() === "div");
        if (rows.length <= 1) {
          // just clear inputs
          row.querySelectorAll("input").forEach(i => {
            if (i.type === "number") i.value = 0;
            else i.value = "";
          });
        } else {
          row.remove();
        }
        updateExpensesTotal();
      }
    });

    // delegated input handler in expenseContainer for any bill amount changes
    expenseContainer.addEventListener("input", (e) => {
      if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === "input") {
        // if it's a number input (bill amount) update totals
        if (e.target.type === "number") updateExpensesTotal();
      }
    });

    // initial compute
    updateExpensesTotal();
  }

  // sync gdsImprestTaken to gdsLessImprest
  if (gdsImprestTaken) {
    gdsImprestTaken.addEventListener("input", () => {
      gdsLessImprest.value = (parseFloat(gdsImprestTaken.value) || 0).toFixed(2);
      updateOverallTotals();
    });
  }

  // also update when gdsLessImprest itself is edited
  if (gdsLessImprest) {
    gdsLessImprest.addEventListener("input", updateOverallTotals);
  }

  // other inputs affect totals
  if (gdsOtherAmt) gdsOtherAmt.addEventListener("input", updateDutyTotals);
  if (gdsDutyGst) gdsDutyGst.addEventListener("input", updateDutyTotals);
  if (gdsTotalExp) gdsTotalExp.addEventListener("input", updateOverallTotals);

  // ------- AUTO-FILL BANK DETAILS WHEN GUIDE IS SELECTED or TYPED -------
  if (gdsGuide) {
    const fillBank = (val) => {
      const selectedGuide = (val || "").trim();
      if (guideBankData[selectedGuide]) {
        gdsBankName.value = guideBankData[selectedGuide].bankName || "";
        gdsAccountName.value = guideBankData[selectedGuide].accountName || "";
        gdsAccountNo.value = guideBankData[selectedGuide].accountNo || "";
      } else {
        gdsBankName.value = "";
        gdsAccountName.value = "";
        gdsAccountNo.value = "";
      }
    };

    // handle both change and input (so typing guide name works)
    gdsGuide.addEventListener("change", () => fillBank(gdsGuide.value));
    gdsGuide.addEventListener("input", () => fillBank(gdsGuide.value));

    // populate on load if value exists
    if (gdsGuide.value) fillBank(gdsGuide.value);
  }

  // ------- PRINT / SAVE -------
  printGds.addEventListener("click", () => {
    const data = {
      meta: {
        dateEntry: document.getElementById("gdsDateEntry")?.value || "",
        company: document.getElementById("gdsCompany")?.value || "",
        refNo: document.getElementById("gdsRefNo")?.value || "",
        bookingId: document.getElementById("gdsBookingId")?.value || "",
        bookingName: document.getElementById("gdsBookingName")?.value || "",
        arrival: document.getElementById("gdsArrival")?.value || "",
        departure: document.getElementById("gdsDeparture")?.value || ""
      },
      guide: {
        name: gdsGuide?.value || "",
        licence: document.getElementById("gdsLicence")?.value || "",
        contact: document.getElementById("gdsContact")?.value || "",
        bankName: gdsBankName?.value || "",
        accountName: gdsAccountName?.value || "",
        accountNo: gdsAccountNo?.value || ""
      },
      dutySummary: {
        otherAmt: parseFloat(gdsOtherAmt?.value) || 0,
        total: parseFloat(gdsDutyTotal?.value) || 0,
        gst: parseFloat(gdsDutyGst?.value) || 0,
        totalInclGst: parseFloat(gdsDutyTotalInclGst?.value) || 0,
        totalDsa: parseFloat(gdsTotalDsa?.value) || 0
      },
      duties: [],
      expenses: {
        totalExpenses: parseFloat(gdsTotalExp?.value) || 0,
        imprestTaken: parseFloat(gdsImprestTaken?.value) || 0,
        lessImprest: parseFloat(gdsLessImprest?.value) || 0
      },
      payable: parseFloat(gdsPayable?.value) || 0
    };

    // collect duties
    gdsDutyTable.querySelectorAll(".gds-duty-row").forEach((row) => {
      data.duties.push({
        day: row.querySelector(".gds-day")?.value || "",
        date: row.querySelector(".gds-date")?.value || "",
        from: row.querySelector(".gds-from")?.value || "",
        to: row.querySelector(".gds-to")?.value || "",
        amount: parseFloat(row.querySelector(".gds-amount")?.value) || 0,
        remarks: row.querySelector(".gds-remarks")?.value || ""
      });
    });

    // collect expense rows (attempt to pick from expenseContainer)
    if (expenseContainer) {
      const expenseRows = Array.from(expenseContainer.children).filter(ch => ch.tagName && ch.tagName.toLowerCase() === "div");
      data.expenses.details = expenseRows.map(r => {
        const inputs = r.querySelectorAll("input");
        // based on your markup: date, type, party, bill no, bill amount, buttons...
        return {
          dateOfExp: inputs[0]?.value || "",
          expenseType: inputs[1]?.value || "",
          party: inputs[2]?.value || "",
          billNo: inputs[3]?.value || "",
          billAmount: parseFloat(inputs[4]?.value) || 0,
          remarks: "" // your row doesn't have explicit remarks field
        };
      });
    }

    console.log("Guide DSA Data:", data);

    // open print window
    const printWindow = window.open('', '', 'height=700,width=900,scrollbars=yes');
    printWindow.document.write('<html><head><title>Guide DSA</title>');
    printWindow.document.write('<style>body{font-family:Arial,Helvetica,sans-serif;padding:18px} pre{white-space:pre-wrap;word-wrap:break-word}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Guide DSA — Print Preview</h2>');
    printWindow.document.write('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  });

  // ------- CANCEL / RESET -------
  cancelGds.addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset the form?")) return;

    // reset text inputs / selects inside guideDsaSection
    rootSection.querySelectorAll("input, select").forEach(el => {
      if (el.tagName.toLowerCase() === "select") {
        el.selectedIndex = 0;
      } else if (el.type === "number" || el.type === "text" || el.type === "date") {
        el.value = "";
      } else {
        // other input types
        el.value = "";
      }
    });

    // Reset duty rows to a single default row
    gdsDutyTable.innerHTML = "";
    addDutyRow();

    // Reset expense rows to single default row (if found)
    if (expenseContainer) {
      // find original pattern of a single row (first grid row)
      const firstRow = expenseContainer.querySelector("div");
      if (firstRow) {
        expenseContainer.innerHTML = "";
        // create a fresh row using structure from your HTML
        const newRow = document.createElement("div");
        newRow.style.display = "grid";
        newRow.style.gridTemplateColumns = "150px 1fr 160px 120px 140px 40px 40px";
        newRow.style.gap = "8px";
        newRow.innerHTML = `
          <input placeholder="Date of Exp" style="padding:8px; border:1px solid #b8c9a1; border-radius:4px;">
          <input placeholder="Expense Type" style="padding:8px; border:1px solid #b8c9a1; border-radius:4px;">
          <input placeholder="Party" style="padding:8px; border:1px solid #b8c9a1; border-radius:4px;">
          <input placeholder="Bill No" style="padding:8px; border:1px solid #b8c9a1; border-radius:4px;">
          <input placeholder="Bill Amount" type="number" style="padding:8px; border:1px solid #b8c9a1; border-radius:4px;" value="0">
          <button type="button" style="width:40px; height:40px; font-size:20px; font-weight:bold; color:#2e7d32; background:#dff0d8; border:none; border-radius:4px; cursor:pointer;">+</button>
          <button type="button" style="width:40px; height:40px; font-size:20px; font-weight:bold; color:#c62828; background:#f8d7da; border:none; border-radius:4px; cursor:pointer;">×</button>
        `;
        expenseContainer.appendChild(newRow);
      }
    }

    // reset totals
    gdsDutyTotal.value = "0.00";
    gdsDutyTotalInclGst.value = "0.00";
    gdsTotalDsa.value = "0.00";
    gdsTotalExp.value = "0.00";
    gdsLessImprest.value = "0.00";
    if (impostTotalInput) impostTotalInput.value = "0.00";
    gdsPayable.value = "0.00";
  });

  // initialize: ensure at least one duty row exists (if none in HTML)
  if (!gdsDutyTable.querySelector(".gds-duty-row")) addDutyRow();

  // initial totals calc
  updateDutyTotals();
  updateExpensesTotal();
  updateOverallTotals();
});
