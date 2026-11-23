// =============================
//  تقييم كركترات اوتلاو
// =============================

const TOTAL_CHARS = 46; // عدد الصور في مجلد characters

// المستويات (من فوق لتحت)
const tiers = [
  { name: "أسطوري",         from: "#a6f4f7", to: "#4fc3cf", color: "#05202a" },
  { name: "أسطوري ١٧ مره",  from: "#8ce6ee", to: "#3db1c0", color: "#04161d" },
  { name: "ممتاز",          from: "#6fd0da", to: "#2f97a8", color: "#03161d" },
  { name: "جيد",            from: "#45a6c6", to: "#1f6f93", color: "#ffffff" },
  { name: "عادي",           from: "#3079ad", to: "#1a4c7c", color: "#ffffff" },
  { name: "مهرجين",         from: "#27578f", to: "#16325e", color: "#ffffff" },
  { name: "اتمنى يعدم",     from: "#172c50", to: "#070f1f", color: "#ffffff" },
];

// مقلب 1: لو انحطوا تحت الأسطوري ينطون فوق ويرجعون
const legendaryOnly = [5, 12, 13, 15, 20, 30, 32];

// مقلب 2: حق الطقطقة، مكانهم الإعدام بس
const executeOnly = [10, 35, 37];

// مقلب 3: هذا مكانه أسطوري ١٧ مره وبس
const legend17Only = [46];

const MSG_LEGEND = "اختار اللي انت عايزو ياحبيبي";
const MSG_LEGEND17 = "هذا مكانه أسطوري ١٧ مره وبس";
const MSG_EXECUTE = "مسموح بخانة الإعدام فقط";


const board = document.getElementById("board");
const pool = document.getElementById("pool");
const countEl = document.getElementById("count");
const popup = document.getElementById("popup");

let selected = null;
let popupTimer = null;


// ---------- بناء الجدول ----------
tiers.forEach(tier => {
  const row = document.createElement("div");
  row.className = "row";

  const label = document.createElement("div");
  label.className = "label";
  label.contentEditable = true;
  label.textContent = tier.name;
  label.style.background = `linear-gradient(160deg, ${tier.from}, ${tier.to})`;
  label.style.color = tier.color;
  if (tier.name.length > 8) label.style.fontSize = "22px";

  const wrap = document.createElement("div");
  wrap.className = "cells-wrap";
  const cells = document.createElement("div");
  cells.className = "cells";
  wrap.appendChild(cells);

  row.appendChild(label);
  row.appendChild(wrap);
  board.appendChild(row);
});

const allCells = () => [...board.querySelectorAll(".cells")];


// ---------- الكركترات ----------
function makeChar(num) {
  const el = document.createElement("div");
  el.className = "char";
  el.draggable = true;
  el.dataset.num = num;

  const img = document.createElement("img");
  img.src = `characters/${String(num).padStart(2, "0")}.jpg`;
  img.alt = "";
  el.appendChild(img);

  if (executeOnly.includes(num)) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "إعدام فقط";
    el.appendChild(tag);
  }

  if (legend17Only.includes(num)) {
    const tag = document.createElement("span");
    tag.className = "tag tag-17";
    tag.textContent = "أسطوري ١٧ مره";
    el.appendChild(tag);
  }

  el.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", num);
    el.style.opacity = 0.4;
  });
  el.addEventListener("dragend", () => (el.style.opacity = 1));

  // الضغط (للجوال)
  el.addEventListener("click", e => {
    e.stopPropagation();
    if (selected === el) return unselect();
    if (selected) {
      const s = selected;
      unselect();
      if (!s.dataset.busy) moveChar(s, el.parentNode, el);
      return;
    }
    selected = el;
    el.classList.add("selected");
  });

  return el;
}

function unselect() {
  if (selected) selected.classList.remove("selected");
  selected = null;
}

function fillPool() {
  unselect();
  pool.innerHTML = "";
  allCells().forEach(c => (c.innerHTML = ""));
  for (let i = 1; i <= TOTAL_CHARS; i++) pool.appendChild(makeChar(i));
  updateCount();
}

function updateCount() {
  const left = pool.querySelectorAll(".char").length;
  countEl.textContent = left ? left + " باقي" : "خلصت";

  let done = pool.querySelector(".done");
  if (!left && !done) {
    done = document.createElement("div");
    done.className = "done";
    done.textContent = "رتبت الكل، احفظ الصورة";
    pool.appendChild(done);
  }
  if (left && done) done.remove();
}


// ---------- النقل + المقالب ----------
function showPopup(text) {
  popup.textContent = text;
  popup.classList.add("show");
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => popup.classList.remove("show"), 2300);
}

function putBack(el, target, before) {
  if (before && before.parentNode === target) target.insertBefore(el, before);
  else target.appendChild(el);
}

function prank(el, target, before, jumpTo, msg) {
  el.dataset.busy = "1";
  el.classList.add("shake");

  setTimeout(() => {
    jumpTo.appendChild(el);
    updateCount();
    showPopup(msg);

    // بعد شوي يرجع للمكان اللي اختاره
    setTimeout(() => {
      putBack(el, target, before);
      el.classList.remove("shake");
      delete el.dataset.busy;
      updateCount();
    }, 2300);
  }, 550);
}

function moveChar(el, target, before = null) {
  putBack(el, target, before);
  updateCount();

  const num = Number(el.dataset.num);
  const cells = allCells();
  const index = cells.indexOf(target); // -1 يعني رجع للقائمة
  const last = cells.length - 1;

  if (index === -1 || el.dataset.busy) return;

  // أول خانتين (أسطوري + أسطوري ١٧ مره) عادي
  if (legendaryOnly.includes(num) && index > 1) {
    prank(el, target, before, cells[0], MSG_LEGEND);
  } else if (executeOnly.includes(num) && index !== last) {
    prank(el, target, before, cells[last], MSG_EXECUTE);
  } else if (legend17Only.includes(num) && index !== 1) {
    prank(el, target, before, cells[1], MSG_LEGEND17);
  }
}

[...allCells(), pool].forEach(zone => {
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));

  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("over");
    const el = document.querySelector(`.char[data-num="${e.dataTransfer.getData("text/plain")}"]`);
    if (!el || el.dataset.busy) return;

    // لو نزلته فوق كركتر ثاني يتحط قبله
    let before = null;
    const over = e.target.closest(".char");
    if (over && over !== el && over.parentNode === zone) {
      const box = over.getBoundingClientRect();
      before = e.clientX > box.left + box.width / 2 ? over : over.nextSibling;
    }
    moveChar(el, zone, before);
  });

  zone.addEventListener("click", () => {
    if (!selected) return;
    const s = selected;
    unselect();
    if (!s.dataset.busy) moveChar(s, zone);
  });
});

document.getElementById("resetBtn").onclick = fillPool;
document.getElementById("closePreview").onclick = () => (document.getElementById("preview").hidden = true);

fillPool();


// ---------- حفظ كصورة ----------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function splitLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach(w => {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  lines.push(line);
  return lines;
}

document.getElementById("saveBtn").onclick = async () => {
  try { await document.fonts.ready; } catch (e) {}

  const FONT = "Lalezar, Tahoma, sans-serif";
  const W = 1200, margin = 60, labelW = 200, cols = 7;
  const boardW = W - margin * 2;
  const cell = (boardW - labelW) / cols;

  const rows = [...board.querySelectorAll(".row")].map((row, i) => ({
    name: row.querySelector(".label").innerText.trim(),
    tier: tiers[i],
    chars: [...row.querySelectorAll(".char")],
  }));

  const heights = rows.map(r => Math.max(1, Math.ceil(r.chars.length / cols)) * cell);
  const top = 310;
  const boardH = heights.reduce((a, b) => a + b, 0);
  const H = top + boardH + margin + 20;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // الخلفية
  ctx.fillStyle = "#09131c";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -60, 10, W / 2, -60, 620);
  glow.addColorStop(0, "rgba(79,184,196,.32)");
  glow.addColorStop(1, "rgba(79,184,196,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // الشعار
  const logo = document.getElementById("logo");
  const L = 130, ly = 36;
  ctx.save();
  ctx.shadowColor = "rgba(79,184,196,.7)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#4fb8c4";
  ctx.beginPath();
  ctx.arc(W / 2, ly + L / 2, L / 2 + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, ly + L / 2, L / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(logo, W / 2 - L / 2, ly, L, L);
  ctx.restore();

  // العنوان
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#eef4f6";
  ctx.font = "66px " + FONT;
  ctx.fillText(document.getElementById("title").innerText.trim(), W / 2, ly + L + 62);

  // الجدول
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#101f2b";
  roundRect(ctx, margin, top, boardW, boardH, 26);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, margin, top, boardW, boardH, 26);
  ctx.clip();

  let y = top;
  rows.forEach((r, i) => {
    const h = heights[i];
    const lx = margin + boardW - labelW;

    const grad = ctx.createLinearGradient(lx, y, lx + labelW, y + h);
    grad.addColorStop(0, r.tier.from);
    grad.addColorStop(1, r.tier.to);
    ctx.fillStyle = grad;
    ctx.fillRect(lx, y, labelW, h);

    ctx.fillStyle = "#0c1822";
    ctx.fillRect(margin, y, boardW - labelW, h);

    ctx.strokeStyle = "rgba(120,200,215,.14)";
    ctx.lineWidth = 1.5;
    for (let rr = 0; rr < Math.round(h / cell); rr++) {
      for (let c = 0; c < cols; c++) ctx.strokeRect(lx - (c + 1) * cell, y + rr * cell, cell, cell);
    }

    ctx.fillStyle = r.tier.color;
    ctx.font = (r.name.length > 8 ? 34 : r.name.length > 6 ? 40 : 48) + "px " + FONT;
    const lines = splitLines(ctx, r.name, labelW - 24);
    lines.forEach((t, k) => ctx.fillText(t, lx + labelW / 2, y + h / 2 + (k - (lines.length - 1) / 2) * 44));

    r.chars.forEach((el, k) => {
      const c = k % cols, rr = Math.floor(k / cols), pad = 6, s = cell - pad * 2;
      const x = lx - (c + 1) * cell + pad, yy = y + rr * cell + pad;
      ctx.save();
      roundRect(ctx, x, yy, s, s, 12);
      ctx.clip();
      ctx.drawImage(el.querySelector("img"), x, yy, s, s);
      ctx.restore();

      if (executeOnly.includes(Number(el.dataset.num))) {
        ctx.font = "14px " + FONT;
        const tw = ctx.measureText("إعدام فقط").width + 18;
        ctx.fillStyle = "#b3161f";
        roundRect(ctx, x + (s - tw) / 2, yy + s - 28, tw, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText("إعدام فقط", x + s / 2, yy + s - 17);
      }

      if (legend17Only.includes(Number(el.dataset.num))) {
        ctx.font = "14px " + FONT;
        const tw = ctx.measureText("أسطوري ١٧ مره").width + 18;
        ctx.fillStyle = "#1d8f9c";
        roundRect(ctx, x + (s - tw) / 2, yy + s - 28, tw, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText("أسطوري ١٧ مره", x + s / 2, yy + s - 17);
      }
    });

    if (i < rows.length - 1) {
      ctx.strokeStyle = "rgba(79,184,196,.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, y + h);
      ctx.lineTo(margin + boardW, y + h);
      ctx.stroke();
    }
    y += h;
  });
  ctx.restore();

  ctx.strokeStyle = "rgba(79,184,196,.45)";
  ctx.lineWidth = 2;
  roundRect(ctx, margin, top, boardW, boardH, 26);
  ctx.stroke();

  // التحميل
  canvas.toBlob(blob => {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "outlaw-tier-list.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      document.getElementById("previewImg").src = canvas.toDataURL("image/png");
      document.getElementById("preview").hidden = false;
    }
  }, "image/png");
};
