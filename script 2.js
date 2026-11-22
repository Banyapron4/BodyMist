/* ==========================================================
   Body Scent — script.js (shared by all pages)
   - product.html : #filter-bar, #product-list
   - order.html   : #orderForm, #customerName, #contact, #items, #total, #note
   - admin.html   : #ordersTable tbody
   ========================================================== */

var APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby1Ct8vwTDCTXkmHcwCHApVAZuWUa19110DE_Gjo7Xyk41fPcLLlY6KroOYI-2wLCmT/exec";

var ORDERS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR3GZgCKw3_TAAnjRFWW8scB813syxHbAaHFCP0pD6JUX2GtKqqxR0qJLZY4oMqbx9Fr0UWwcBTsh_8/pub?gid=0&single=true&output=csv";

var MOODS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "fresh", label: "Fresh" },
  { key: "sweet", label: "Sweet" },
  { key: "confident", label: "Confident" },
  { key: "romance", label: "Romance" }
];

/* ---------- Helpers ---------- */
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(price) {
  return Number(price).toLocaleString("th-TH") + " บาท";
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ==========================================================
   1) product.html
   ========================================================== */
function initProductPage() {
  var filterBar = document.getElementById("filter-bar");
  var listEl = document.getElementById("product-list");
  if (!filterBar || !listEl) return;

  var products = [];
  var currentMood = "all";

  function buildFilterBar() {
    filterBar.innerHTML = MOODS.map(function (m) {
      return (
        '<button type="button" class="filter-btn" data-mood="' + m.key + '">' +
        escapeHtml(m.label) +
        "</button>"
      );
    }).join("");

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      setMood(btn.getAttribute("data-mood"));
    });
  }

  function setMood(mood) {
    var valid = MOODS.some(function (m) { return m.key === mood; });
    currentMood = valid ? mood : "all";

    var buttons = filterBar.querySelectorAll(".filter-btn");
    for (var i = 0; i < buttons.length; i++) {
      var active = buttons[i].getAttribute("data-mood") === currentMood;
      buttons[i].classList.toggle("active", active);
    }
    renderProducts();
  }

  function buildItemName(p) {
    return p.name + (p.size ? " " + p.size : "");
  }

  function renderProducts() {
    var filtered = products.filter(function (p) {
      return currentMood === "all" || p.mood === currentMood;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<p class="notice">ไม่พบสินค้าในหมวดนี้</p>';
      return;
    }

    listEl.innerHTML = filtered.map(function (p) {
      var itemName = buildItemName(p);
      var orderUrl =
        "order.html?item=" + encodeURIComponent(itemName) +
        "&price=" + encodeURIComponent(p.price);
      var sizeText = p.size ? p.size : (p.type === "rollon" ? "โรลออน" : "");

      return (
        '<article class="product-card">' +
          '<div class="product-card__media">' +
            '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
          "</div>" +
          '<div class="product-card__body">' +
            '<span class="product-card__mood">' +
              '<span class="mood-dot mood-dot--' + escapeHtml(p.mood) + '"></span>' +
              escapeHtml(capitalize(p.mood)) +
            "</span>" +
            '<h3 class="product-card__name">' + escapeHtml(p.name) + "</h3>" +
            '<p class="product-card__meta">' + escapeHtml(sizeText) + "</p>" +
            '<div class="product-card__price">' + escapeHtml(formatPrice(p.price)) + "</div>" +
            '<a class="btn btn--small btn--block" href="' + orderUrl + '">สั่งซื้อ</a>' +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  buildFilterBar();

  fetch("products.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      products = data;
      var params = new URLSearchParams(window.location.search);
      var moodParam = (params.get("mood") || "all").toLowerCase();
      setMood(moodParam);
    })
    .catch(function (error) {
      console.error(error);
      listEl.innerHTML = '<p class="notice">ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง</p>';
    });
}

/* ==========================================================
   2) order.html
   ========================================================== */
function initOrderPage() {
  var form = document.getElementById("orderForm");
  if (!form) return;

  var itemsEl = document.getElementById("items");
  var totalEl = document.getElementById("total");

  // Fill from URL params right away
  var params = new URLSearchParams(window.location.search);
  var item = params.get("item");
  var price = params.get("price");

  if (item && itemsEl) itemsEl.value = item;
  if (price && totalEl) totalEl.value = price;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var payload = {
      customerName: document.getElementById("customerName").value.trim(),
      contact: document.getElementById("contact").value.trim(),
      items: document.getElementById("items").value.trim(),
      total: document.getElementById("total").value.trim(),
      note: document.getElementById("note").value.trim()
    };

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        window.location.href = "thankyou.html";
      })
      .catch(function (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

/* ==========================================================
   3) admin.html
   ========================================================== */

// Minimal CSV parser: handles quoted fields, escaped quotes ("")
// and line breaks inside quoted fields.
function parseCSV(text) {
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);

    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text.charAt(i + 1) === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  // last field / row
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function initAdminPage() {
  var tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  function showMessage(msg) {
    tbody.innerHTML = '<tr><td colspan="6">' + escapeHtml(msg) + "</td></tr>";
  }

  showMessage("กำลังโหลดข้อมูล...");

  fetch(ORDERS_CSV_URL, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(function (text) {
      var rows = parseCSV(text).filter(function (r) {
        return r.some(function (cell) { return cell.trim() !== ""; });
      });

      // First row is the header only if column A is not a date/time
      if (rows.length > 0 && isNaN(Date.parse(rows[0][0]))) {
        rows.shift();
      }

      if (rows.length === 0) {
        showMessage("ยังไม่มีคำสั่งซื้อ");
        return;
      }

      // Rows are appended in order, so reversing puts the newest first
      rows.reverse();

      tbody.innerHTML = rows.map(function (r) {
        var cells = [];
        for (var c = 0; c < 6; c++) {
          cells.push("<td>" + escapeHtml(r[c] != null ? r[c] : "") + "</td>");
        }
        return "<tr>" + cells.join("") + "</tr>";
      }).join("");
    })
    .catch(function (error) {
      console.error(error);
      showMessage("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    });
}

/* ---------- Init (runs only the part that matches the page) ---------- */
document.addEventListener("DOMContentLoaded", function () {
  initProductPage();
  initOrderPage();
  initAdminPage();
});
