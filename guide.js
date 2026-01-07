document.addEventListener("DOMContentLoaded", () => {
  // ---------- CONFIG ----------
  const API_URL = `${location.protocol}//${location.hostname}:3000/api/guides`;
  const rowsPerPage = 10;

  // ---------- DOM ----------
  const guideForm = document.getElementById("guideForm");
  const guideTableBody = document.getElementById("guideTableBody");
  const guideTableContainer = document.querySelector(".guide-table-container");
  const guideBtn = document.getElementById("guideBtn");
  const cancelBtn = guideForm ? guideForm.querySelector(".cancel-btn") : null;
  const saveBtn = guideForm ? guideForm.querySelector(".save-btn") : null;
  const searchInput = document.getElementById("searchGuide");
  const searchBtn = document.getElementById("searchGuideBtn");
  // <-- changed IDs to match your HTML
  const prevPageBtn = document.getElementById("prevguidePageBtn");
  const nextPageBtn = document.getElementById("nextguidePageBtn");

  // ---------- STATE ----------
  let guideData = [];
  let editId = null;
  let currentPage = 1;
  let currentSearch = "";

  // ---------- HELPERS ----------
  const qs = (id) => document.getElementById(id);

  const debounce = (fn, delay = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const showToast = (msg) => {
    if (window.toastr) toastr.info(msg);
    else alert(msg);
  };

  const getField = (obj = {}, ...keys) => {
    for (const k of keys) {
      if (
        obj[k] !== undefined &&
        obj[k] !== null &&
        String(obj[k]).trim() !== ""
      )
        return obj[k];
    }
    return "";
  };

  const getFormValue = (id) => {
    const el = qs(id);
    return el ? String(el.value || "").trim() : "";
  };

  // ---------- FORM DATA ----------
  const getGuideFormData = () => {
    const data = {
      name: getFormValue("guideName"),
      specialize: getFormValue("guideSpecialize"),
      gender: getFormValue("guideGender"),
      language: getFormValue("guideLanguage"),
      license: getFormValue("guideLicense"),
      phone: getFormValue("guidePhone"),
      email: getFormValue("guideEmail"),
      address: getFormValue("guideAddress"),
      gstNo: getFormValue("guideGST"),
      tpnNo: getFormValue("guideTPN"),
      bankName: getFormValue("guideBankName"),
      bankAccountName: getFormValue("guideBankAccountName"),
      bankAccountNumber: getFormValue("guideBankAccountNumber"),
      remark: getFormValue("Remark"),
      joinDate: new Date().toISOString().split("T")[0],
    };

    if (!data.name) {
      showToast("Guide name is required");
      return null;
    }
    if (!data.gender) {
      showToast("Gender is required");
      return null;
    }
    return data;
  };

  const setGuideFormData = (g = {}) => {
    qs("guideName").value = getField(g, "name", "fullName", "guideName");
    qs("guideSpecialize").value =
      getField(g, "specialize", "speciality", "specialization") || "Culture";
    qs("guideGender").value = getField(g, "gender", "sex") || "Male";
    qs("guideLanguage").value = getField(g, "language", "languages", "lang");
    qs("guideLicense").value = getField(g, "license", "licenseNo");
    qs("guidePhone").value = getField(g, "phone", "contact", "phoneNumber");
    qs("guideEmail").value = getField(g, "email", "mail", "emailAddress");
    qs("guideAddress").value = getField(g, "address", "presentAddress", "addr");
    qs("guideGST").value = getField(g, "gstNo", "GST", "gst") || "";
    qs("guideTPN").value = getField(g, "tpnNo", "TPN", "tpn") || "";
    qs("guideBankName").value = getField(g, "bankName", "bank", "bank_name");
    qs("guideBankAccountName").value = getField(
      g,
      "bankAccountName",
      "accountName",
      "account_name"
    );
    qs("guideBankAccountNumber").value = getField(
      g,
      "bankAccountNumber",
      "accountNumber",
      "account_number"
    );
    qs("Remark").value = getField(g, "remark", "remarks", "notes");
  };

  const resetForm = () => {
    if (!guideForm) return;
    guideForm.reset();
    editId = null;
  };

  const toggleForm = (show) => {
    if (!guideForm || !guideTableContainer) return;
    guideForm.style.display = show ? "block" : "none";
    guideTableContainer.style.display = show ? "none" : "block";
    if (show) {
      const firstInput = guideForm.querySelector("input, select");
      if (firstInput) firstInput.focus();
    }
  };

  // ---------- PAGINATION HELPER (minimal) ----------
  const updatePaginationState = () => {
    const totalPages = Math.max(1, Math.ceil(guideData.length / rowsPerPage));
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
  };

  // ---------- FETCH / CRUD ----------
  const fetchGuides = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      guideData = Array.isArray(json) ? json : json.data || [];

      if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        guideData = guideData.filter(
          (g) =>
            getField(g, "name", "fullName", "guideName")
              .toLowerCase()
              .includes(searchLower) ||
            getField(g, "gender", "sex").toLowerCase().includes(searchLower)
        );
      }

      const maxPages = Math.max(1, Math.ceil(guideData.length / rowsPerPage));
      if (currentPage > maxPages) currentPage = maxPages;

      renderTable();
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load guides");
      guideData = [];
      renderTable();
    }
  };

  const saveGuide = async (payload) => {
    if (!confirm("Do you want to save the guide details?")) return; // Confirmation
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Save failed:", res.status, txt);
        showToast("❌ Failed to save guide");
        return;
      }
      await fetchGuides();
      resetForm();
      toggleForm(false);
      showToast(editId ? "✅ Guide updated" : "✅ Guide added");
      editId = null;
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to save guide");
    }
  };

  const deleteGuide = async (id) => {
    if (!confirm("Are you sure you want to delete this guide?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Delete failed:", res.status, txt);
        showToast("❌ Failed to delete guide");
        return;
      }
      await fetchGuides();
      showToast("✅ Guide deleted");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to delete guide");
    }
  };

  // ---------- RENDER ----------
  const renderTable = () => {
    if (!guideTableBody) return;
    guideTableBody.innerHTML = "";

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = guideData.slice(start, end);

    if (!pageData.length) {
      guideTableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:20px;">No guides found</td></tr>`;
      updatePaginationState();
      return;
    }

    pageData.forEach((g, i) => {
      const tr = document.createElement("tr");

      const tdSeq = document.createElement("td");
      tdSeq.textContent = start + i + 1;
      const tdName = document.createElement("td");
      tdName.textContent = getField(g, "name", "fullName", "guideName");
      const tdSpec = document.createElement("td");
      tdSpec.textContent = getField(
        g,
        "specialize",
        "speciality",
        "specialization"
      );
      const tdGender = document.createElement("td");
      tdGender.textContent = getField(g, "gender", "sex");
      const tdLang = document.createElement("td");
      tdLang.textContent = getField(g, "language", "languages", "lang");
      const tdLicense = document.createElement("td");
      tdLicense.textContent = getField(g, "license", "licenseNo");
      const tdEmail = document.createElement("td");
      const emailValue = getField(g, "email", "mail", "emailAddress");
      tdEmail.innerHTML = emailValue
        ? `<a href="mailto:${emailValue}" style="color:blue;text-decoration:underline">${emailValue}</a>`
        : "";
      const tdPhone = document.createElement("td");
      const phoneValue = getField(g, "phone", "contact", "phoneNumber");
      tdPhone.innerHTML = phoneValue
        ? `<a href="tel:${phoneValue}" style="color:green;text-decoration:underline">${phoneValue}</a>`
        : "";
      const tdGST = document.createElement("td");
      tdGST.textContent = getField(g, "gstNo", "GST", "gst");
      const tdTPN = document.createElement("td");
      tdTPN.textContent = getField(g, "tpnNo", "TPN", "tpn");

      const tdAction = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "✏️";
      editBtn.style.border = "none";
      editBtn.style.background = "none";
      editBtn.style.padding = "10px";
      editBtn.style.cursor = "pointer";
      editBtn.addEventListener("click", () => {
        setGuideFormData(g);
        editId = g._id || g.id;
        toggleForm(true);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "❌";
      delBtn.style.border = "none";
      delBtn.style.background = "none";
      delBtn.style.color = "red";
      delBtn.style.cursor = "pointer";
      delBtn.addEventListener("click", () => deleteGuide(g._id || g.id));

      tdAction.appendChild(editBtn);
      tdAction.appendChild(delBtn);

      tr.append(
        tdSeq,
        tdName,
        tdSpec,
        tdGender,
        tdLang,
        tdLicense,
        tdEmail,
        tdPhone,
        tdAction
      );
      guideTableBody.appendChild(tr);
    });

    updatePaginationState();
  };

  // ---------- EVENTS ----------
  if (searchInput)
    searchInput.addEventListener(
      "input",
      debounce(() => {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        fetchGuides();
      }, 300)
    );

  if (searchBtn)
    searchBtn.addEventListener("click", () => {
      currentSearch = searchInput.value.trim();
      fetchGuides();
    });

  if (prevPageBtn)
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });

  if (nextPageBtn)
    nextPageBtn.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(guideData.length / rowsPerPage));
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });

  if (guideBtn)
    guideBtn.addEventListener("click", () => {
      resetForm();
      toggleForm(true);
    });

  if (cancelBtn)
    cancelBtn.addEventListener("click", () => {
      if (!confirm("Do you want to cancel? Unsaved changes will be lost."))
        return;
      resetForm();
      toggleForm(false);
    });

  if (guideForm)
    guideForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const payload = getGuideFormData();
      if (!payload) return;
      saveGuide(payload);
    });

  // ---------- INIT ----------
  toggleForm(false);
  fetchGuides();
});
