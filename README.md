# Ouroboros Tech

Marketing site for Ouroboros Tech — a Nairobi technology company that builds across
the whole stack: blockchains, AI, data, and the specialist teams behind them.

Static, self-contained site: hand-written HTML, one shared design-system stylesheet,
and a small vanilla-JS interaction layer (splash choreography, scroll reveals, hero
handoff, mobile nav, contact form). No build step, no framework, no CDN dependencies.

## Structure

```
index.html      products.html  work.html  research.html
about.html      careers.html   contact.html
assets/css/styles.css   — the design system
assets/js/main.js        — interaction layer
assets/img/              — ouroboros marks (SVG) + icon
```

## Run locally

Any static server works, e.g.:

```bash
python -m http.server 8940
```

Then open http://localhost:8940.

## Brand

Deep Indigo `#0A2472` + Savannah Gold `#D4AF37`. Display: Bricolage Grotesque ·
Body: Hanken Grotesk · Mono: Spline Sans Mono. The 24-bead ouroboros mark is the
generative motif throughout.
