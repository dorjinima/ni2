(function () {
  "use strict";

  /* =================== CONFIG =================== */
  const CONFIG = {
    LOGOS: {
      IDEAL: "https://i.redd.it/kmvyvdig2c5g1.jpeg",
      NEPTUNE:
        "https://i.pinimg.com/1200x/d0/9d/71/d09d717c2a67f81ecd739598613bbc4a.jpg",
    },
    API: {
      BASE_URL: `${window.location.protocol}//${window.location.hostname}:3000/api`,
      ENDPOINTS: {
        LETTERS: "/letters",
        LETTER_BY_ID: (id) => `/letters/${encodeURIComponent(id)}`,
      },
    },
    STORAGE_KEYS: {
      LETTERS: "letters_records_v1",
      COUNTER_PREFIX: "letters_counter_",
    },
    PAGINATION: { PAGE_SIZE: 10, DEFAULT_PAGE: 1 },
    PRINT: {
      PAPER_SIZE: "A4",
      // top/bottom 18mm; left/right 25.4mm (1 inch)
      MARGINS: "18mm 25.4mm",
      FOOTER_BOTTOM_MARGIN: "12mm",
      // watermark URL
      WATERMARK_URL:
        "https://i.pinimg.com/1200x/13/1b/4f/131b4f5f46e5fe49089ae13a0a398b15.jpg",
      HIDE_TO_ROW: true,
      HIDE_SUBJECT_LABEL: true,
    },
  };

  /* =================== STATE =================== */
  const state = {
    letters: [],
    filteredLetters: [],
    editingIndex: null,
    originalEditRecord: null,
    currentPage: CONFIG.PAGINATION.DEFAULT_PAGE,
    currentSearch: "",
    pageSize: CONFIG.PAGINATION.PAGE_SIZE,
  };

  /* =================== DOM HELPERS =================== */
  const DOM = {
    lettersSection: () => document.getElementById("lettersSection"),
    recordsBody: () => document.getElementById("recordsBody"),
    writeNewBtn: () => document.getElementById("writeNewBtn"),
    option1: () => document.getElementById("option1"),
    option2: () => document.getElementById("option2"),
    createDate: () => document.getElementById("createDate"),
    companySelect: () => document.getElementById("companySelect"),
    autoRef: () => document.getElementById("autoRef"),
    docType: () => document.getElementById("docType"),
    concerned: () => document.getElementById("concerned"),
    subject: () => document.getElementById("subject"),
    mainContent: () => document.getElementById("mainContent"),
    createBtn: () => document.getElementById("createBtn"),
    cancelBtn: () => document.getElementById("cancelBtn"),
    searchInput: () =>
      document.querySelector('#lettersSection input[type="text"]'),
    searchBtn: () => document.getElementById("searchGuideBtn"),
    prevPageBtn: () => document.getElementById("prevletterPageBtn"),
    nextPageBtn: () => document.getElementById("nextletterPageBtn"),
    pageInfo: () => document.getElementById("lettersPageInfo"),
  };

  /* =================== UTILITIES =================== */
  class Utils {
    static formatDateForDisplay(date = new Date()) {
      const day = String(date.getDate()).padStart(2, "0");
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
      const month = monthNames[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    }

    static padNumber(num, length = 3) {
      return String(num).padStart(length, "0");
    }

    static escapeHtml(text) {
      if (text == null) return "";
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return String(text).replace(/[&<>"']/g, (ch) => map[ch]);
    }

    static escapeAttribute(text) {
      if (text == null) return "";
      return String(text).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    static debounce(fn, wait = 250) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    }
  }

  /* =================== BRAND MANAGEMENT =================== */
  class BrandManager {
    static getBrandInfo(companyName = "") {
      const name = (companyName || "").toLowerCase();
      if (name.includes("neptune")) {
        return {
          logo: CONFIG.LOGOS.NEPTUNE,
          type: "NEPTUNE",
          header: this.generateNeptuneHeader(),
          footer: "",
          prefix: "NHB",
        };
      }
      return {
        logo: CONFIG.LOGOS.IDEAL,
        type: "IDEAL",
        header: this.generateIdealHeader(),
        footer: this.generateIdealFooter(),
        prefix: "ITC",
      };
    }

    static generateNeptuneHeader() {
      return `
        <div style="max-width:770px;margin:14px auto 0;font-family:'Aptos Display','Aptos', 'Calibri','Segoe UI',sans-serif;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 4px;">
            <div style="flex:0 0 auto;">
              <img src="${CONFIG.LOGOS.NEPTUNE}" style="width:160px;height:auto;display:block;object-fit:contain;" alt="Neptune logo" />
            </div>
            <div style="flex:1;padding-left:20px;text-align:right;font-size:11px;color:#333;line-height:1.25;">
              <div style="font-weight:700;color:#111;">Neptune Holidays Bhutan</div>
              <div>Lamdrup Village, Mewang Gewog</div>
              <div>Kasadrapchhu, Thimphu · Post Box No. 1196</div>
              <div>Phone: +975 17124946 / 17112189 · Email: neptuneholidays@example.com</div>
              <div>www.neptuneholidays.bt</div>
            </div>
          </div>
          <hr class="brand-hr" style="border:none;border-top:1px solid #333;margin:8px 0;opacity:.9" />
        </div>`;
    }

    static generateIdealHeader() {
      return `
        <div style="max-width:770px;margin:8px auto 0;font-family:'Aptos Display','Aptos','Calibri','Segoe UI',sans-serif;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 4px;">
            <div style="flex:0 0 auto;display:flex;align-items:center;">
              <img src="${CONFIG.LOGOS.IDEAL}" alt="IDEAL logo" style="width:220px;height:auto;display:block;object-fit:contain;" />
            </div>
            <div style="flex:1;padding-left:12px;text-align:right;display:flex;flex-direction:column;justify-content:center;">
              <div style="font-size:20px;font-weight:700;color:#111;line-height:1;">Explore Bhutan with us</div>
              <div style="font-size:11px;color:#666;margin-top:4px;line-height:1;">We pledge more than just travel</div>
            </div>
          </div>
          <hr class="brand-hr" style="border:none;border-top:1px solid #333;margin:8px 0;opacity:.9" />
        </div>`;
    }

    static generateIdealFooter() {
      return `
        <div id="print-footer" style="position:fixed;left:0;right:0;bottom:${CONFIG.PRINT.FOOTER_BOTTOM_MARGIN};pointer-events:none;">
          <div style="max-width:770px;margin:0 auto;text-align:center;font-size:11px;color:#222;line-height:1.25;">
            <hr style="border:none;border-top:1px solid #333;margin:6px 0 8px 0;opacity:.9" />
            Lamdrup Village | Kasadrapchhu | Thimphu | The Kingdom of Bhutan.<br>
            Post Box No: 1196 | Phone +975 17124946 | Email: idealtravelcreations@gmail.com<br>
            www.idealtravelcreations.bt
          </div>
        </div>`;
    }

    static getCompanyPrefix(companyName) {
      if (!companyName) return "GEN";
      return this.getBrandInfo(companyName).prefix || "GEN";
    }
  }

  /* =================== REFERENCE GENERATOR =================== */
  class ReferenceGenerator {
    static getNextSerial(prefix) {
      const key = `${
        CONFIG.STORAGE_KEYS.COUNTER_PREFIX
      }${prefix}_${new Date().getFullYear()}`;
      const current = Number(localStorage.getItem(key) || 0) + 1;
      localStorage.setItem(key, String(current));
      return current;
    }

    static generate(companyName) {
      const prefix = BrandManager.getCompanyPrefix(companyName);
      const year = String(new Date().getFullYear()).slice(-2);
      const serial = this.getNextSerial(prefix);
      return `${prefix}/${year}/${Utils.padNumber(serial)}`;
    }

    static preview(companyName) {
      if (!companyName)
        return "Auto generate serial with NHB/Year/No or ITC/Year/No";
      const prefix = BrandManager.getCompanyPrefix(companyName);
      const year = String(new Date().getFullYear()).slice(-2);
      const serial = this.getNextSerial(prefix);
      return `${prefix}/${year}/${Utils.padNumber(serial)}`;
    }
  }

  /* =================== API SERVICE =================== */
  class ApiService {
    static async request(endpoint, options = {}) {
      const url = `${CONFIG.API.BASE_URL}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API Error ${res.status}: ${txt}`);
      }
      return await res.json().catch(() => ({}));
    }

    static getAllLetters() {
      return this.request(CONFIG.API.ENDPOINTS.LETTERS);
    }
    static getLetter(id) {
      return this.request(CONFIG.API.ENDPOINTS.LETTER_BY_ID(id));
    }
    static createLetter(data) {
      return this.request(CONFIG.API.ENDPOINTS.LETTERS, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }
    static updateLetter(id, data) {
      return this.request(CONFIG.API.ENDPOINTS.LETTER_BY_ID(id), {
        method: "PUT",
        body: JSON.stringify(data),
      });
    }
    static deleteLetter(id) {
      return this.request(CONFIG.API.ENDPOINTS.LETTER_BY_ID(id), {
        method: "DELETE",
      });
    }
  }

  /* =================== LETTER MANAGER =================== */
  class LetterManager {
    static async loadLetters() {
      try {
        state.letters = await ApiService.getAllLetters();
      } catch (e) {
        console.error("loadLetters:", e);
        state.letters = [];
      }
      this.applyFilter();
    }

    static applyFilter() {
      const q = (state.currentSearch || "").trim().toLowerCase();
      state.filteredLetters = state.letters
        .map((letter, idx) => ({ letter, index: idx }))
        .filter(({ letter }) => {
          if (!q) return true;
          const fields = [
            letter.concerned,
            letter.date,
            letter.company,
            letter.subject,
            letter.ref,
          ];
          return fields.some((f) =>
            String(f || "")
              .toLowerCase()
              .includes(q)
          );
        });
    }

    static getCurrentPageLetters() {
      const start = (state.currentPage - 1) * state.pageSize;
      return state.filteredLetters.slice(start, start + state.pageSize);
    }

    static getTotalPages() {
      return Math.max(
        1,
        Math.ceil(state.filteredLetters.length / state.pageSize)
      );
    }

    static async saveLetter(letterData) {
      if (state.editingIndex !== null) {
        const existing = state.letters[state.editingIndex];
        const updated = await ApiService.updateLetter(
          existing.ref || existing._id,
          letterData
        );
        state.letters[state.editingIndex] = updated;
      } else {
        const created = await ApiService.createLetter(letterData);
        state.letters.unshift(created);
        state.currentPage = 1;
      }
      this.applyFilter();
    }

    static async deleteLetter(id) {
      await ApiService.deleteLetter(id);
      const idx = state.letters.findIndex((l) => l.ref === id || l._id === id);
      if (idx !== -1) {
        state.letters.splice(idx, 1);
        if (state.editingIndex === idx) {
          state.editingIndex = null;
          state.originalEditRecord = null;
        } else if (state.editingIndex !== null && state.editingIndex > idx) {
          state.editingIndex--;
        }
        this.applyFilter();
      }
    }
  }

  /* =================== RENDERER =================== */
  class Renderer {
    static initStyles() {
      if (document.getElementById("letters-styles")) return;
      const s = document.createElement("style");
      s.id = "letters-styles";
      s.textContent = `
        .letters-smooth { overflow:hidden; transition:max-height .28s ease, opacity .22s ease; max-height:0; opacity:0; transform:translateY(-6px); }
        .letters-smooth.open { max-height:2000px; opacity:1; transform:translateY(0); }
        .action-btn { background:transparent;padding:6px 8px;border:0;border-radius:4px;cursor:pointer;font-weight:600;margin-left:6px;font-size:14px; }
        .print-btn{ color:#29571a } .edit-btn{ color:#111 } .delete-btn{ color:#b91c1c }
      `;
      document.head.appendChild(s);
    }

    static async renderLettersTable() {
      const tbody = DOM.recordsBody();
      if (!tbody) return;
      tbody.innerHTML = "";
      if (!state.filteredLetters.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:14px;text-align:center;color:#666;border:none;">
          ${
            state.currentSearch
              ? "No letters match your search"
              : "No letters yet"
          }
        </td></tr>`;
        this.updatePagination();
        return;
      }
      const page = LetterManager.getCurrentPageLetters();
      for (const { letter, index } of page) {
        const tr = document.createElement("tr");
        tr.style.border = "none";
        tr.dataset.ref = letter.ref || "";
        tr.dataset.idx = index;
        tr.innerHTML = `
          <td style="padding:8px;border:none;">${Utils.escapeHtml(
            letter.date || ""
          )}</td>
          <td style="padding:8px;border:none;">${Utils.escapeHtml(
            letter.company || ""
          )}</td>
          <td style="padding:8px;border:none;">${Utils.escapeHtml(
            letter.ref || ""
          )}</td>
          <td style="padding:8px;border:none;">${Utils.escapeHtml(
            letter.docType || ""
          )}</td>
          <td style="padding:8px;border:none;">${Utils.escapeHtml(
            letter.concerned || ""
          )}</td>
          <td style="padding:8px;border:none;">${Utils.escapeHtml(
            letter.subject || ""
          )}</td>
          <td style="padding:8px;text-align:center;border:none;">
            <button class="action-btn print-btn" data-ref="${Utils.escapeAttribute(
              letter.ref || ""
            )}" title="Print">🖨️</button>
            <button class="action-btn edit-btn" data-ref="${Utils.escapeAttribute(
              letter.ref || ""
            )}" title="Edit">✏️</button>
            <button class="action-btn delete-btn" data-ref="${Utils.escapeAttribute(
              letter.ref || ""
            )}" title="Delete">❌</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
      this.updatePagination();
      this.attachTableEventListeners();
    }

    static updatePagination() {
      const totalPages = LetterManager.getTotalPages();
      if (state.currentPage > totalPages) state.currentPage = totalPages || 1;
      const prev = DOM.prevPageBtn(),
        next = DOM.nextPageBtn();
      if (prev) {
        prev.disabled = state.currentPage <= 1;
        prev.style.opacity = prev.disabled ? "0.5" : "1";
      }
      if (next) {
        next.disabled = state.currentPage >= totalPages;
        next.style.opacity = next.disabled ? "0.5" : "1";
      }
      let pageInfo = DOM.pageInfo();
      if (!pageInfo) {
        const container = document.querySelector(".nextandpreviousbht");
        if (container) {
          pageInfo = document.createElement("span");
          pageInfo.id = "lettersPageInfo";
          pageInfo.style.margin = "0 12px";
          pageInfo.style.fontWeight = "600";
          pageInfo.style.color = "#333";
          container.insertBefore(pageInfo, container.children[1] || null);
        }
      }
      if (pageInfo)
        pageInfo.textContent = `Page ${state.currentPage} / ${totalPages} (${state.filteredLetters.length} records)`;
    }

    static attachTableEventListeners() {
      const tbody = DOM.recordsBody();
      if (!tbody) return;
      tbody.onclick = async (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        const ref = btn.dataset.ref;
        if (!ref) return;
        if (btn.classList.contains("print-btn"))
          await PrintManager.printLetter(ref);
        else if (btn.classList.contains("edit-btn"))
          await FormManager.startEdit(ref);
        else if (btn.classList.contains("delete-btn")) {
          if (confirm("Delete this letter?")) {
            await LetterManager.deleteLetter(ref);
            await this.renderLettersTable();
          }
        }
      };
    }

    static toggleFormVisibility(show) {
      const opt1 = DOM.option1(),
        opt2 = DOM.option2(),
        writeBtn = DOM.writeNewBtn();
      if (!opt1 || !opt2) return;
      this.initStyles();
      if (show) {
        opt1.classList.add("letters-smooth");
        opt1.style.display = "block";
        opt1.style.maxHeight = "0px";
        requestAnimationFrame(() => {
          opt1.style.maxHeight = `${opt1.scrollHeight + 20}px`;
          opt1.classList.add("open");
        });
        opt2.style.display = "none";
        if (writeBtn) writeBtn.textContent = "Editing Letter";
      } else {
        opt1.classList.remove("open");
        opt1.style.maxHeight = "0px";
        setTimeout(() => {
          opt1.style.display = "none";
          opt1.style.maxHeight = "";
          opt2.style.display = "block";
          if (writeBtn) writeBtn.textContent = "Write New Letter";
        }, 320);
      }
    }
  }

  /* =================== PRINT MANAGER =================== */
  class PrintManager {
    // tries to fetch watermark and inline as dataURL to avoid cross-origin printing issues
    static async _fetchImageAsDataURL(url) {
      try {
        const resp = await fetch(url, { mode: "cors", cache: "no-cache" });
        if (!resp.ok) throw new Error("Image fetch failed: " + resp.status);
        const blob = await resp.blob();
        return await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = (e) => rej(e);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        // fetching/inlining failed (likely CORS). Return null to fall back to remote URL.
        console.warn("Could not inline watermark (will use remote URL):", e);
        return null;
      }
    }

    static async printLetter(ref) {
      try {
        const letter = await ApiService.getLetter(ref);
        if (!letter) {
          alert("Letter not found");
          return;
        }
        this.openPrintWindow(letter);
      } catch (e) {
        console.error("printLetter error:", e);
        alert("Failed to load letter for printing");
      }
    }

    static async openPrintWindow(letter) {
      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) {
        alert("Please allow popups to use the print feature");
        return;
      }

      // attempt to inline watermark as data URL (best chance for printing reliably)
      const tryInline = await PrintManager._fetchImageAsDataURL(
        CONFIG.PRINT.WATERMARK_URL
      );
      const watermarkToUse = tryInline || CONFIG.PRINT.WATERMARK_URL;

      const brand = BrandManager.getBrandInfo(letter.company);
      const bodyContent =
        letter.content?.trim() || this.generateDefaultBody(letter);
      const html = this.generatePrintHtml(
        letter,
        brand,
        bodyContent,
        watermarkToUse
      );
      win.document.open();
      win.document.write(html);
      win.document.close();
    }

    static generateDefaultBody(letter) {
      return `Dear ${
        letter.concerned || "Sir / Madam"
      },\n\nPlease refer to the above subject. This is to inform you on behalf of ${
        letter.company || ""
      } regarding ${letter.subject || ""}.\n\nThank you.\n\nSincerely,\n${
        letter.company || ""
      }`;
    }

    static generatePrintHtml(letter, brand, bodyContent, watermark) {
      const hideTo = CONFIG.PRINT.HIDE_TO_ROW;
      const hideSubjectLabel = CONFIG.PRINT.HIDE_SUBJECT_LABEL;

      // Format body: convert paragraphs separated by 2+ newlines into <p>, preserve single newlines as <br/>
      const escaped = Utils.escapeHtml(bodyContent || "");
      const formattedBody = escaped
        .split(/\n{2,}/)
        .map((para) => `<p>${para.replace(/\n/g, "<br/>").trim()}</p>`)
        .join("");

      // Use the supplied watermark (already inlined if fetch succeeded)
      const safeWatermark = Utils.escapeAttribute(watermark);

      return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print — ${Utils.escapeHtml(letter.ref || "")}</title>
  <meta name="referrer" content="no-referrer">
  <style>
    /* page margins: top/bottom 18mm, left/right 25.4mm */
    @page { size: ${CONFIG.PRINT.PAPER_SIZE}; margin: ${CONFIG.PRINT.MARGINS}; }

    /* Fallback background image (some engines read it when print background enabled) */
    html {
      height:100%;
      background-image: url("${safeWatermark}");
      background-repeat: no-repeat;
      background-position: center center;
      background-size: 70%;
      background-attachment: fixed;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html,body { height:100%; margin:0; padding:0; background:white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Aptos Display','Aptos','Calibri','Segoe UI',sans-serif; font-size:14px; color:#111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-wrap { position:relative; min-height:100%; padding-bottom:60px; box-sizing:border-box; }

    /* Primary watermark image as <img> centered & fixed (best chance to print) */
    .watermark-img {
      position:fixed;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      width:70%;
      max-width:1200px;
      height:auto;
      opacity:0.06;
      pointer-events:none;
      z-index:0;
      display:block;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background:transparent;
    }

    .print-toolbar { position:fixed; top:8px; right:12px; z-index:9999; display:flex; gap:8px; }
    .print-toolbar button { padding:8px 12px; border-radius:6px; border:0; cursor:pointer; font-weight:600; font-size:12px; box-shadow:0 2px 8px rgba(2,6,23,0.08); }
    #btn-print{background:#2b6b2b;color:#fff} #btn-reset{background:#f3f4f6;color:#111} #btn-close{background:#ef4444;color:#fff}

    .container { max-width:750px; margin:0 auto; padding:12px 8px; position:relative; z-index:1; box-sizing:border-box; background:transparent; }

    .container hr, #print-footer hr, .brand-hr { border:none; border-top:1px solid #333; margin:8px 0; opacity:.9; }

    .ref-date { margin-top:8px; display:flex; justify-content:space-between; align-items:center; font-size:14px; }
    .content { margin-top:14px; line-height:1.6; text-align:justify; text-justify:inter-word; }
    .content p { margin:0 0 12px 0; line-height:1.6; }
    .content p:first-of-type { text-indent:24px; }
    .editable { border:1px dashed transparent; padding:2px 4px; display:inline-block; min-width:200px; }
    .editable:focus { border:1px dashed #ccc; outline:none; }
    #print-body { min-height:260px; white-space:normal; }
    .to-row { ${hideTo ? "display:none;" : ""} margin-top:12px; }
    .subject-row { text-align:center; display:block; margin-top:12px; font-size:16px; font-weight:700; color:#111; }
    .subject-row .label { ${hideSubjectLabel ? "display:none;" : ""} }
    #print-footer { position:fixed; left:0; right:0; bottom:${
      CONFIG.PRINT.FOOTER_BOTTOM_MARGIN
    }; pointer-events:none; }
    #print-footer .inner { max-width:750px; margin:0 auto; text-align:center; font-size:12px; color:#222; line-height:1.25; }
    #print-footer hr { border:none; border-top:1px solid #333; margin:6px 0 8px 0; opacity:.9 }

    @media print {
      .print-toolbar { display:none !important; }
      #print-footer { position:fixed !important; }
      .editable { border:none !important; }
      .watermark-img { opacity:0.06 !important; display:block !important; }
      html { background-image: url("${safeWatermark}") !important; background-size:70% !important; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <button id="btn-print">Print</button>
    <button id="btn-reset">Reset</button>
    <button id="btn-close">Close</button>
  </div>

  <div class="page-wrap">
    <img src="${safeWatermark}" alt="watermark" class="watermark-img" crossorigin="anonymous" />

    <div class="container">
      ${brand.header}

      <div class="ref-date" style="margin-top:6px;">
        <div style="font-size:14px;">${Utils.escapeHtml(letter.ref || "")}</div>
        <div style="font-size:14px;">${Utils.escapeHtml(
          letter.date || Utils.formatDateForDisplay()
        )}</div>
      </div>

      <div class="content">
        <div class="to-row">
          To: <span id="print-to" class="editable" contenteditable="true">${Utils.escapeHtml(
            letter.concerned || ""
          )}</span>
        </div>

        <div class="subject-row">
          <span class="label">Subject:</span>
          <span id="print-subject" class="editable" contenteditable="true">${Utils.escapeHtml(
            letter.subject || ""
          )}</span>
        </div>

        <div id="print-body" class="editable" contenteditable="true" style="margin-top:18px;">
          ${formattedBody}
        </div>
      </div>
    </div>

    ${brand.footer}
  </div>

  <script>
    (function(){
      const originalBody = ${JSON.stringify(bodyContent)};
      const originalTo = ${JSON.stringify(letter.concerned || "")};
      const originalSubject = ${JSON.stringify(letter.subject || "")};

      document.getElementById('btn-print').addEventListener('click', () => {
        window.print();
      });

      document.getElementById('btn-reset').addEventListener('click', () => {
        const body = document.getElementById('print-body');
        if (body) {
          const escaped = ${JSON.stringify(
            Utils.escapeHtml(bodyContent || "")
          )};
          const formatted = escaped.split(/\\n{2,}/).map(p => '<p>' + p.replace(/\\n/g,'<br/>').trim() + '</p>').join('');
          body.innerHTML = formatted;
        }
        const pt = document.getElementById('print-to'); if (pt) pt.textContent = originalTo;
        const ps = document.getElementById('print-subject'); if (ps) ps.textContent = originalSubject;
      });

      document.getElementById('btn-close').addEventListener('click', () => window.close());

      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          window.print();
        }
      });
    })();
  </script>
</body>
</html>`;
    }
  }

  /* =================== FORM MANAGER =================== */
  class FormManager {
    static init() {
      this.setupFormControls();
      this.setupSearch();
      this.setupPagination();
      this.setupKeyboardShortcuts();
    }

    static setupFormControls() {
      const writeBtn = DOM.writeNewBtn(),
        createBtn = DOM.createBtn(),
        companySelect = DOM.companySelect();
      const cancelBtn = this.ensureCancelButton();

      if (writeBtn)
        writeBtn.addEventListener("click", () => {
          const isOpen = DOM.option1()?.style.display === "block";
          if (isOpen) this.cancelEdit();
          else this.showForm();
        });

      if (companySelect)
        companySelect.addEventListener("change", () => {
          const preview = DOM.autoRef();
          if (preview)
            preview.textContent = ReferenceGenerator.preview(
              companySelect.value
            );
        });

      if (createBtn)
        createBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          await this.submitForm();
        });
      if (cancelBtn)
        cancelBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.cancelEdit();
        });
    }

    static setupSearch() {
      const searchInput = DOM.searchInput(),
        searchBtn = DOM.searchBtn();
      if (searchInput) {
        searchInput.placeholder =
          "Search by concerned person, date, company...";
        searchInput.addEventListener(
          "input",
          Utils.debounce(() => {
            state.currentSearch = searchInput.value;
            state.currentPage = 1;
            LetterManager.applyFilter();
            Renderer.renderLettersTable();
          }, 300)
        );
        searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            state.currentSearch = searchInput.value;
            state.currentPage = 1;
            LetterManager.applyFilter();
            Renderer.renderLettersTable();
          }
        });
      }
      if (searchBtn)
        searchBtn.addEventListener("click", (e) => {
          e.preventDefault();
          if (searchInput) {
            state.currentSearch = searchInput.value;
            state.currentPage = 1;
            LetterManager.applyFilter();
            Renderer.renderLettersTable();
          }
        });
    }

    static setupPagination() {
      const prev = DOM.prevPageBtn(),
        next = DOM.nextPageBtn();
      if (prev)
        prev.addEventListener("click", (e) => {
          e.preventDefault();
          if (state.currentPage > 1) {
            state.currentPage--;
            Renderer.renderLettersTable();
          }
        });
      if (next)
        next.addEventListener("click", (e) => {
          e.preventDefault();
          const t = LetterManager.getTotalPages();
          if (state.currentPage < t) {
            state.currentPage++;
            Renderer.renderLettersTable();
          }
        });
    }

    static setupKeyboardShortcuts() {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const isOpen = DOM.option1()?.style.display === "block";
          if (isOpen) this.cancelEdit();
        }
      });
    }

    static async startEdit(ref) {
      try {
        let idx = state.letters.findIndex((l) => l.ref === ref);
        if (idx === -1) {
          const letter = await ApiService.getLetter(ref);
          if (!letter) {
            alert("Letter not found");
            return;
          }
          state.letters.unshift(letter);
          idx = 0;
          LetterManager.applyFilter();
        }
        const letter = state.letters[idx];
        this.populateForm(letter);
        state.editingIndex = idx;
        state.originalEditRecord = JSON.parse(JSON.stringify(letter));
        const createBtn = DOM.createBtn();
        if (createBtn) {
          createBtn.textContent = "Update";
          createBtn.style.background = "#1f6f2a";
        }
        this.showForm();
      } catch (e) {
        console.error("startEdit:", e);
        alert("Could not load letter for editing");
      }
    }

    static populateForm(letter) {
      if (DOM.createDate())
        DOM.createDate().textContent =
          letter.date || Utils.formatDateForDisplay();
      if (DOM.companySelect()) DOM.companySelect().value = letter.company || "";
      if (DOM.autoRef()) DOM.autoRef().textContent = letter.ref || "";
      if (DOM.docType()) DOM.docType().value = letter.docType || "";
      if (DOM.concerned()) DOM.concerned().value = letter.concerned || "";
      if (DOM.subject()) DOM.subject().value = letter.subject || "";
      if (DOM.mainContent()) DOM.mainContent().value = letter.content || "";
    }

    static async submitForm() {
      const company = DOM.companySelect()?.value || "";
      const docType = DOM.docType()?.value || "";
      const concerned = DOM.concerned()?.value.trim() || "";
      const subject = DOM.subject()?.value.trim() || "";
      const content = DOM.mainContent()?.value || "";
      const date =
        DOM.createDate()?.textContent || Utils.formatDateForDisplay();

      if (!company) {
        alert("Please select a Company");
        return;
      }
      if (!subject) {
        alert("Please enter a Subject");
        return;
      }

      try {
        const letterData = {
          date,
          company,
          docType,
          concerned,
          subject,
          content,
        };
        if (state.editingIndex !== null) {
          letterData.ref = state.letters[state.editingIndex].ref;
        } else {
          letterData.ref = ReferenceGenerator.generate(company);
          letterData.createdAt = new Date().toISOString();
        }
        await LetterManager.saveLetter(letterData);
        this.resetForm();
        await Renderer.renderLettersTable();
      } catch (e) {
        console.error("submitForm:", e);
        alert("Error saving letter: " + e.message);
      }
    }

    static resetForm() {
      if (DOM.companySelect()) DOM.companySelect().value = "";
      if (DOM.autoRef())
        DOM.autoRef().textContent =
          "Auto generate serial with NHB/Year/No or ITC/Year/No";
      if (DOM.docType()) DOM.docType().selectedIndex = 0;
      if (DOM.concerned()) DOM.concerned().value = "";
      if (DOM.subject()) DOM.subject().value = "";
      if (DOM.mainContent()) DOM.mainContent().value = "";
      const createBtn = DOM.createBtn();
      if (createBtn) {
        createBtn.textContent = "✅ Create";
        createBtn.style.background = "#4c792c";
      }
      state.editingIndex = null;
      state.originalEditRecord = null;
      this.hideForm();
    }

    static showForm() {
      if (DOM.createDate())
        DOM.createDate().textContent = Utils.formatDateForDisplay();
      const cancelBtn = DOM.cancelBtn();
      if (cancelBtn) cancelBtn.style.display = "inline-block";
      Renderer.toggleFormVisibility(true);
    }

    static hideForm() {
      const cancelBtn = DOM.cancelBtn();
      if (cancelBtn) cancelBtn.style.display = "none";
      Renderer.toggleFormVisibility(false);
    }

    static cancelEdit() {
      if (state.editingIndex !== null && state.originalEditRecord)
        this.populateForm(state.originalEditRecord);
      this.resetForm();
    }

    static ensureCancelButton() {
      let btn = DOM.cancelBtn();
      const createBtn = DOM.createBtn();
      if (!btn && createBtn && createBtn.parentNode) {
        btn = document.createElement("button");
        btn.id = "cancelBtn";
        btn.type = "button";
        btn.textContent = "Cancel";
        btn.style.cssText =
          "background:transparent;color:#111;border:1px solid #cfcfcf;padding:7px 14px;border-radius:4px;margin-left:8px;cursor:pointer;font-weight:600;display:none;";
        createBtn.parentNode.appendChild(btn);
      }
      return btn;
    }
  }

  /* =================== APP INIT =================== */
  class App {
    static async init() {
      if (!DOM.lettersSection()) {
        console.warn("Letters section not found");
        return;
      }
      try {
        Renderer.initStyles();
        FormManager.init();
        await LetterManager.loadLetters();
        await Renderer.renderLettersTable();
        console.log("Letter Management System initialized");
      } catch (e) {
        console.error("App.init error:", e);
        alert("Failed to initialize the letter management system");
      }
    }
  }

  /* =================== START =================== */
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => App.init());
  else App.init();
})();
