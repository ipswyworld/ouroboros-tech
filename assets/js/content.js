/* Renders content published by the admin (assets/data/*.json).
   Degrades gracefully: if a file is missing or empty, an honest empty state shows. */
(() => {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
    : "";

  /* Plain-text body -> paragraphs. Content is authored by the site owner in the
     admin, but we still escape it rather than trusting raw HTML. */
  const toParagraphs = (body) => String(body || "")
    .split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");

  async function load(file) {
    try {
      const res = await fetch(`assets/data/${file}.json`, { cache: "no-cache" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }

  const qs = (k) => new URLSearchParams(location.search).get(k);

  const empty = (title, msg) =>
    `<div class="empty-state"><h3>${esc(title)}</h3><p>${esc(msg)}</p></div>`;

  /* ---- Index renderers -------------------------------------------------- */
  async function renderInsights(sel) {
    const host = document.querySelector(sel); if (!host) return;
    const rows = await load("insights");
    if (!rows.length) return void (host.innerHTML =
      empty("No insights published yet", "Writing from the team will appear here as it's published."));
    host.innerHTML = `<ul class="index-list">` + rows.map((r, i) => `
      <li class="index-list__row">
        <span class="index-list__n mono">${String(i + 1).padStart(2, "0")}</span>
        <div class="index-list__main">
          <h3><a href="insight.html?slug=${encodeURIComponent(r.slug)}">${esc(r.title)}</a></h3>
          <p>${esc(r.excerpt || "")}</p>
        </div>
        <span class="index-list__tag mono">${esc(fmtDate(r.publishedAt))}</span>
      </li>`).join("") + `</ul>`;
  }

  async function renderCases(sel) {
    const host = document.querySelector(sel); if (!host) return;
    const rows = await load("cases");
    if (!rows.length) return void (host.innerHTML =
      empty("No case studies published yet",
        "We publish client work only with permission. Ask us for references in the meantime."));
    host.innerHTML = `<ul class="index-list">` + rows.map((r, i) => `
      <li class="index-list__row">
        <span class="index-list__n mono">${String(i + 1).padStart(2, "0")}</span>
        <div class="index-list__main">
          <h3><a href="case-study.html?slug=${encodeURIComponent(r.slug)}">${esc(r.title)}</a></h3>
          <p>${esc(r.summary || "")}</p>
        </div>
        <span class="index-list__tag mono">${esc(r.sector || r.client || "")}</span>
      </li>`).join("") + `</ul>`;
  }

  async function renderRoles(sel) {
    const host = document.querySelector(sel); if (!host) return;
    const rows = await load("roles");
    if (!rows.length) return; // careers page keeps its static tracks as the fallback
    host.innerHTML = `<ul class="roles">` + rows.map((r) => `
      <li>
        <div class="roles__title">
          <h3>${esc(r.title)}</h3>
          <p>${esc(r.summary || "")}</p>
        </div>
        <span class="roles__meta">${esc([r.team, r.location].filter(Boolean).join(" · "))}</span>
      </li>`).join("") + `</ul>`;
    const note = document.querySelector("[data-roles-note]");
    if (note) note.hidden = true;
  }

  /* ---- Detail renderer -------------------------------------------------- */
  async function renderDetail(kind, opts) {
    const slug = qs("slug");
    const rows = await load(kind === "insight" ? "insights" : "cases");
    const row = rows.find((r) => r.slug === slug);
    const titleEl = document.querySelector("[data-detail-title]");
    const metaEl = document.querySelector("[data-detail-meta]");
    const bodyEl = document.querySelector("[data-detail-body]");
    if (!row) {
      if (titleEl) titleEl.textContent = "Not found";
      if (metaEl) metaEl.textContent = "";
      if (bodyEl) bodyEl.innerHTML =
        `<p>That ${kind === "insight" ? "article" : "case study"} isn't available. ` +
        `<a class="link-arw" href="${opts.indexHref}">Back to all ${opts.indexLabel} <span class="arw">&rarr;</span></a></p>`;
      return;
    }
    document.title = `${row.title} · Ouroboros Tech`;
    if (titleEl) titleEl.textContent = row.title;
    if (metaEl) {
      const bits = kind === "insight"
        ? [fmtDate(row.publishedAt), (row.tags || []).join(" · ")]
        : [row.client, row.sector];
      metaEl.textContent = bits.filter(Boolean).join("  ·  ");
    }
    if (bodyEl) {
      const intro = row.excerpt || row.summary;
      bodyEl.innerHTML = (intro ? `<p class="lead">${esc(intro)}</p>` : "") + toParagraphs(row.body);
    }
  }

  window.OB = { renderInsights, renderCases, renderRoles, renderDetail };
})();
