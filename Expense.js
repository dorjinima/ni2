document.addEventListener("DOMContentLoaded", () => {
  // ---------- DOM References ----------
  const expenseBtn = document.getElementById("expenseBtn");
  const expenseForm = document.getElementById("expenseForm");
  const cancelBtn = expenseForm.querySelector(".cancel-btn");
  const saveBtn = expenseForm.querySelector(".save-btn");
  const expenseTableBody = document.getElementById("expenseTableBody");
  const expenseTableContainer = document.querySelector(
    ".expense-table-container"
  );
  const searchInput = document.getElementById("searchHotel");
  const prevBtn = document.getElementById("preventryPageBtn");
  const nextBtn = document.getElementById("nextentryPageBtn");

  const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api/expenses`;

  let expenses = [];
  let editId = null;
  let currentPage = 1;
  const rowsPerPage = 10;
  let currentSearch = "";

  // ---------- Apply table header styles ----------
  function applyTableHeaderStyle() {
    const thead = document.querySelector(".expense-table-container thead");
    if (thead) {
      thead.style.backgroundColor = "#f5f5f5"; // Light gray background for header
    }
  }

  // ---------- Update pagination buttons ----------
  function updatePaginationButtons() {
    const totalPages = Math.ceil(expenses.length / rowsPerPage) || 1;

    // Update Previous button
    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
      prevBtn.style.opacity = currentPage === 1 ? "0.5" : "1";
      prevBtn.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";
    }

    // Update Next button
    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.style.opacity = currentPage === totalPages ? "0.5" : "1";
      nextBtn.style.cursor =
        currentPage === totalPages ? "not-allowed" : "pointer";
    }
  }

  // ---------- Fetch Expenses ----------
  async function fetchExpenses() {
    try {
      const url = currentSearch
        ? `${API_URL}?q=${encodeURIComponent(currentSearch)}`
        : API_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      expenses = await res.json();

      const maxPage = Math.ceil(expenses.length / rowsPerPage) || 1;
      if (currentPage > maxPage) currentPage = maxPage;

      renderTable();
      updatePaginationButtons(); // Add this line
      applyTableHeaderStyle(); // Apply header background after rendering
    } catch (err) {
      console.error(err);
      expenseTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red; padding:15px;">Failed to load expenses</td></tr>`;
    }
  }

  // ---------- Save Expense ----------
  async function saveExpense(expense) {
    const method = editId ? "PUT" : "POST";
    const url = editId ? `${API_URL}/${editId}` : API_URL;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    if (!res.ok) throw new Error("Failed to save expense");
    return await res.json();
  }

  // ---------- Delete Expense ----------
  async function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) await fetchExpenses();
  }

  // ---------- Get Form Data ----------
  function getExpenseFormData() {
    const Name = document.getElementById("Name").value.trim();
    const Location = document
      .getElementById("expensePlaceLocation")
      .value.trim();
    const VisitingHours = document
      .getElementById("expenseVisitingHours")
      .value.trim();
    const Remarks = document.getElementById("expenseRemarks").value.trim();
    const IntlAdult = document.getElementById("expenseIntlAdult").value.trim();
    const IntlChild = document.getElementById("expenseIntlChild").value.trim();
    const RegAdult = document.getElementById("expenseRegAdult").value.trim();
    const RegChild = document.getElementById("expenseRegChild").value.trim();

    if (!Name || !Location) {
      alert("⚠️ Name and Location are required.");
      return null;
    }

    return {
      Name,
      Location,
      VisitingHours,
      Remarks,
      IntlTourists: `Adult: ${IntlAdult} | Child: ${IntlChild}`,
      ReglTourists: `Adult: ${RegAdult} | Child: ${RegChild}`,
    };
  }

  // ---------- Set Form Data for Edit ----------
  function setExpenseFormData(expense) {
    document.getElementById("Name").value = expense.Name || "";
    document.getElementById("expensePlaceLocation").value =
      expense.Location || "";
    document.getElementById("expenseVisitingHours").value =
      expense.VisitingHours || "";
    document.getElementById("expenseRemarks").value = expense.Remarks || "";

    const intl = expense.IntlTourists ? expense.IntlTourists.match(/\d+/g) : [];
    const reg = expense.ReglTourists ? expense.ReglTourists.match(/\d+/g) : [];

    document.getElementById("expenseIntlAdult").value = intl[0] || "";
    document.getElementById("expenseIntlChild").value = intl[1] || "";
    document.getElementById("expenseRegAdult").value = reg[0] || "";
    document.getElementById("expenseRegChild").value = reg[1] || "";

    expenseForm.style.display = "block";
    if (expenseTableContainer) expenseTableContainer.style.display = "none";
  }

  // ---------- Render Table ----------
  function renderTable(list = expenses) {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginated = list.slice(start, end);

    expenseTableBody.innerHTML = "";
    if (!paginated.length) {
      expenseTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:15px;">No expenses found</td></tr>`;
      return;
    }

    paginated.forEach((expense, i) => {
      const row = document.createElement("tr");
      row.style.borderBottom = "none";
      row.style.height = "52px";
      row.style.color = "#000";

      row.innerHTML = `
        <td style="padding:8px; text-align:center;">${start + i + 1}</td>
        <td style="padding:8px;">${expense.Name}</td>
        <td style="padding:8px;">${expense.Location}</td>
        <td style="padding:8px; text-align:left; white-space:pre-wrap; line-height:1.5;">${
          expense.VisitingHours
        }</td>
        <td style="padding:8px;">${expense.IntlTourists}</td>
        <td style="padding:8px;">${expense.ReglTourists}</td>
        <td style="padding:8px; white-space:pre-wrap; line-height:1.5;">${
          expense.Remarks
        }</td>
        <td style="padding:8px; text-align:center;">
          <button class="edit-btn" data-id="${
            expense._id
          }" style="margin-right:6px; padding:4px 8px; background:none; border:none; cursor:pointer;">✏️</button>
          <button class="delete-btn" data-id="${
            expense._id
          }" style="padding:4px 8px; background:none; border:none; cursor:pointer; color:red;">❌</button>
        </td>
      `;

      row.querySelector(".edit-btn").addEventListener("click", () => {
        editId = expense._id;
        setExpenseFormData(expense);
      });

      row
        .querySelector(".delete-btn")
        .addEventListener("click", () => deleteExpense(expense._id));

      expenseTableBody.appendChild(row);
    });
  }

  // ---------- Go to Next Page ----------
  function goToNextPage() {
    const totalPages = Math.ceil(expenses.length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      updatePaginationButtons();
    }
  }

  // ---------- Go to Previous Page ----------
  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      updatePaginationButtons();
    }
  }

  // ---------- Event Listeners ----------
  expenseBtn.addEventListener("click", () => {
    expenseForm.style.display = "block";
    expenseForm.reset();
    editId = null;

    if (expenseTableContainer) expenseTableContainer.style.display = "none";
  });

  cancelBtn.addEventListener("click", () => {
    if (!confirm("Cancel editing?")) return;
    expenseForm.style.display = "none";
    expenseForm.reset();
    editId = null;

    if (expenseTableContainer) expenseTableContainer.style.display = "block";
  });

  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const expense = getExpenseFormData();
    if (!expense) return;

    if (!confirm(editId ? "Update this expense?" : "Add new expense?")) return;

    try {
      await saveExpense(expense);
      alert(editId ? "✅ Expense updated" : "✅ Expense added");
      expenseForm.style.display = "none";
      expenseForm.reset();
      editId = null;

      if (expenseTableContainer) expenseTableContainer.style.display = "block";
      await fetchExpenses();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save expense");
    }
  });

  // ---------- Search ----------
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    fetchExpenses();
  });

  // ---------- Auto-resize Textareas ----------
  ["expenseVisitingHours", "expenseRemarks"].forEach((id) => {
    const textarea = document.getElementById(id);
    textarea.style.overflow = "hidden";
    textarea.style.resize = "none";
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    });
  });

  // ---------- Pagination Event Listeners ----------
  if (prevBtn) {
    prevBtn.addEventListener("click", goToPreviousPage);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", goToNextPage);
  }

  // ---------- Initial Load ----------
  expenseForm.style.display = "none";
  fetchExpenses();
});
