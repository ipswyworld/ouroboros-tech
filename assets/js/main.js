/* Ouroboros Tech interaction layer: splash, reveals, nav */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Trigger the hero handoff entrance (html.ready). Called once, at the moment
     the page is revealed (as the splash clears, or immediately otherwise). */
  let readyDone = false;
  const markReady = () => {
    if (readyDone) return; readyDone = true;
    document.documentElement.classList.add("ready");
  };

  /* ---- Splash: beadwork assembles, then wordmark locks in ---------------- */
  const splash = document.querySelector("[data-splash]");
  if (splash) {
    const mark = splash.querySelector(".splash__mark");
    const beads = mark ? [...mark.querySelectorAll("circle.bead")] : [];
    const seen = sessionStorage.getItem("ob_splash");

    const finish = () => {
      splash.classList.add("done");
      document.documentElement.style.removeProperty("overflow");
      const hide = () => splash.setAttribute("hidden", "");
      splash.addEventListener("transitionend", hide, { once: true });
      setTimeout(hide, 1200); // fallback if transitionend never fires (hidden tab)
      sessionStorage.setItem("ob_splash", "1");
      markReady(); // hero composes in as the splash fades
    };

    if (seen || reduce) {
      splash.setAttribute("hidden", "");
      setTimeout(markReady, 40); // returning visitor: entrance on load
    } else {
      document.documentElement.style.overflow = "hidden";
      // scatter each bead to a random offset; the accent clasp bead lands last
      beads.forEach((b, i) => {
        const ang = Math.random() * Math.PI * 2;
        const dist = 130 + Math.random() * 120;
        b.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
        b.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(0) + "px");
        const order = b.classList.contains("bead--clasp") ? beads.length + 2 : i;
        b.style.setProperty("--bi", String(order));
      });
      // Phase 1+2: beads gather in ring order while the gold glow blooms.
      // A timeout (not rAF) so it still fires if the tab isn't compositing.
      setTimeout(() => {
        if (mark) mark.classList.add("gather");
        splash.classList.add("bloom");
      }, 40);
      // Phase 3: wordmark focuses in once the loop has closed
      setTimeout(() => splash.classList.add("lock"), 2500);
      // Hold, then reveal the page
      setTimeout(finish, 4500);
    }

    const skip = splash.querySelector("[data-splash-skip]");
    if (skip) skip.addEventListener("click", finish);
  } else {
    setTimeout(markReady, 40); // pages with no splash: entrance on load
  }

  /* ---- Hero: pointer parallax on the instrument (fine pointers only) ------ */
  const instrument = document.querySelector(".hero__instrument");
  const heroEl = document.querySelector(".hero");
  if (instrument && heroEl && !reduce && window.matchMedia("(pointer: fine)").matches) {
    heroEl.addEventListener("pointermove", (e) => {
      const r = heroEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      instrument.style.setProperty("--px", (x * 16).toFixed(1) + "px");
      instrument.style.setProperty("--py", (y * 16).toFixed(1) + "px");
    });
    heroEl.addEventListener("pointerleave", () => {
      instrument.style.setProperty("--px", "0px");
      instrument.style.setProperty("--py", "0px");
    });
  }

  /* ---- Scroll reveals ---------------------------------------------------- */
  const revealables = document.querySelectorAll(".reveal");
  if (revealables.length && !reduce && "IntersectionObserver" in window) {
    document.body.classList.add("reveals-armed"); // now the hidden state applies
    // stagger index within any [data-stagger] group
    document.querySelectorAll("[data-stagger]").forEach((group) => {
      [...group.children].forEach((c, i) => c.style.setProperty("--i", String(i)));
    });
    const reveal = (el) => el.classList.add("in");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach((el) => io.observe(el));
    // Failsafe: if the observer never fires (hidden tab, headless render,
    // non-compositing pane), reveal everything so nothing ships blank.
    setTimeout(() => revealables.forEach(reveal), 1800);
  } else {
    revealables.forEach((el) => el.classList.add("in"));
  }

  /* ---- Mobile nav -------------------------------------------------------- */
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---- Contact form: compose a mailto (works on any static host) -------- */
  const form = document.querySelector("[data-contact]");
  if (form) {
    const note = form.querySelector("[data-form-note]");
    const submit = form.querySelector('button[type="submit"]');
    const endpoint = (form.dataset.endpoint || "").trim();
    const val = (n) => (form.elements[n]?.value || "").trim();

    const mailtoFallback = () => {
      const subject = `New enquiry: ${val("topic")} (${val("name")})`;
      const body = `Name: ${val("name")}\nEmail: ${val("email")}\nTopic: ${val("topic")}\n\n${val("message")}\n`;
      window.location.href =
        `mailto:hello@ouroboros.tech?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (note) {
        note.textContent = "Your email app should have opened with everything filled in. If it didn't, write to hello@ouroboros.tech.";
        note.style.color = "var(--gold-ink)";
      }
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      // No endpoint configured: hand off to the visitor's email client.
      if (!endpoint) return mailtoFallback();

      const original = submit ? submit.innerHTML : "";
      if (submit) { submit.disabled = true; submit.textContent = "Sending…"; }
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: val("name"), email: val("email"),
            topic: val("topic"), message: val("message"),
          }),
        });
        if (!res.ok) throw new Error("bad status " + res.status);
        form.reset();
        if (note) {
          note.textContent = "Thanks. Your message reached us, and the right person will reply.";
          note.style.color = "var(--gold-ink)";
        }
        if (submit) submit.textContent = "Sent";
        return;
      } catch {
        // Endpoint unreachable: never lose the message, hand it to email instead.
        if (submit) { submit.disabled = false; submit.innerHTML = original; }
        mailtoFallback();
      }
    });
  }

  /* ---- Nav shadow on scroll --------------------------------------------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("nav--scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
})();
