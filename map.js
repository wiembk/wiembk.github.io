(function () {
  "use strict";

  var svg = document.getElementById("atlas");
  if (!svg) return;

  var NS = "http://www.w3.org/2000/svg";
  var VIEW = { x: 0, y: 0, w: 1200, h: 1000 };

  /* Fit the 1200x1000 map into the stage without cropping the trail. */
  function fitView() {
    var aspect = svg.clientWidth / Math.max(1, svg.clientHeight);
    if (aspect >= 1.2) {
      var w = 1000 * aspect;
      VIEW = { x: (1200 - w) / 2, y: 0, w: w, h: 1000 };
    } else {
      /* Narrow screens: frame the trail itself, not the whole sheet. */
      var tw = 780, th = tw / aspect;
      VIEW = { x: 690 - tw / 2, y: 540 - th / 2, w: tw, h: th };
    }
  }

  /* Milestones, bottom of the map to the top. Coordinates are map units. */
  var stops = [
    { id: "esssths", x: 540, y: 910, year: "2018 — 2020", org: "ESSTHS Sousse", title: "Preparatory class, Mathematics and Physics", icon: "book", target: "education", side: "left" },
    { id: "enetcom", x: 680, y: 790, year: "2020 — 2023", org: "ENET’Com Sfax", title: "Engineering degree, Network & Cloud Infrastructure", icon: "cap", target: "education", side: "left" },
    { id: "obg", x: 540, y: 640, year: "2023 — 2024", org: "OBG", title: "Software & DevOps Engineer · Magento seller tools", icon: "cube", target: "case-obg", side: "left" },
    { id: "dashboard", x: 760, y: 540, year: "Oct 2024 — May 2025", org: "Wamia", title: "Seller dashboard · React, Cloud Run", icon: "layout", target: "case-dashboard", side: "left" },
    { id: "store", x: 680, y: 400, year: "Sep 2025 — present", org: "Wamia", title: "Store system · RBAC, KYC, JWT", icon: "store", target: "case-store", side: "left" },
    { id: "production", x: 860, y: 300, year: "2026", org: "Wamia", title: "Production · Compute Engine, Varnish, MariaDB", icon: "server", target: "case-production", side: "right" },
    { id: "now", x: 800, y: 170, year: "Sep 2026 — present", org: "Wamia", title: "Full-Stack & DevOps Engineer · Platform foundation", icon: "flag", target: "case-platform", side: "left", current: true }
  ];

  /* Side roads: smaller destinations branching from the trail. */
  var branches = [
    { id: "iac", from: "enetcom", x: 860, y: 860, year: "2023", org: "End of studies", title: "Magento on AWS, CloudFormation + Bash", icon: "cloud", target: "case-iac", side: "right" },
    { id: "sync", from: "dashboard", x: 950, y: 610, year: "May — Aug 2025", org: "Wamia", title: "Seller Pause · Meta Catalog Sync", icon: "sync", target: "case-sync", side: "right" },
    { id: "mobile", from: "store", x: 900, y: 450, year: "2025 — 2026", org: "Wamia", title: "Shopper app · Expo, TestFlight, Play", icon: "phone", target: "case-mobile", side: "right" }
  ];

  var byId = {};
  stops.concat(branches).forEach(function (s) { byId[s.id] = s; });

  /* Catmull-Rom spline through points, returned as an SVG path string. */
  function spline(points, tension) {
    var t = tension || 0.5;
    var d = "M " + points[0].x + " " + points[0].y;
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6 * t * 2;
      var c1y = p1.y + (p2.y - p0.y) / 6 * t * 2;
      var c2x = p2.x - (p3.x - p1.x) / 6 * t * 2;
      var c2y = p2.y - (p3.y - p1.y) / 6 * t * 2;
      d += " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + p2.x + " " + p2.y;
    }
    return d;
  }

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  var trailLayer = svg.querySelector("#trail-layer");
  var markerLayer = svg.querySelector("#marker-layer");

  /* Main trail, with a soft extension past the top edge. */
  var trailPoints = stops.map(function (s) { return { x: s.x, y: s.y }; });
  var last = trailPoints[trailPoints.length - 1];
  var beyond = trailPoints.concat([{ x: last.x - 30, y: 70 }, { x: last.x - 10, y: -40 }, { x: last.x + 20, y: -140 }]);
  var walked = spline(trailPoints);
  var ahead = spline(beyond);

  el("path", { d: ahead, class: "trail-ahead" }, trailLayer);
  el("path", { d: walked, class: "trail-casing" }, trailLayer);
  el("path", { d: walked, class: "trail" }, trailLayer);

  branches.forEach(function (b) {
    var from = byId[b.from];
    var mid = { x: (from.x + b.x) / 2 + 20, y: (from.y + b.y) / 2 - 30 };
    el("path", { d: spline([{ x: from.x, y: from.y }, mid, { x: b.x, y: b.y }]), class: "side-road" }, trailLayer);
  });

  /* Icons drawn as small strokes inside the marker. */
  var icons = {
    book: "M-5 -4 h10 v9 h-10 z M0 -4 v9",
    cap: "M-6 -1 l6 -3 l6 3 l-6 3 z M-3 0.5 v3 q3 2 6 0 v-3",
    cube: "M0 -5 l5 2.5 v5 l-5 2.5 l-5 -2.5 v-5 z M-5 -2.5 l5 2.5 l5 -2.5 M0 0 v5",
    layout: "M-5 -5 h10 v10 h-10 z M-5 -1.5 h10 M-1.5 -1.5 v6.5",
    store: "M-5 -2 h10 v7 h-10 z M-6 -2 l1.5 -3 h9 l1.5 3 M-2 5 v-3 h4 v3",
    server: "M-5 -5 h10 v4 h-10 z M-5 1 h10 v4 h-10 z M-3 -3 h0.1 M-3 3 h0.1",
    flag: "M-4 -6 v12 M-4 -6 h8 l-2 3 l2 3 h-8",
    cloud: "M-4 3 h8 a3 3 0 0 0 0 -6 a4 4 0 0 0 -7.5 1 a2.5 2.5 0 0 0 -0.5 5 z",
    sync: "M-4 -1 a4 4 0 0 1 7 -2 M4 1 a4 4 0 0 1 -7 2 M3 -4 v2 h-2 M-3 4 v-2 h2",
    phone: "M-3 -6 h6 v12 h-6 z M-1 4.5 h2"
  };

  function marker(s, isBranch) {
    var g = el("g", {
      class: "marker" + (isBranch ? " marker-branch" : "") + (s.current ? " marker-current" : ""),
      transform: "translate(" + s.x + " " + s.y + ")",
      tabindex: "0",
      role: "button",
      "data-id": s.id,
      "aria-label": s.org + ", " + s.year + ". " + s.title
    }, markerLayer);

    if (s.current) {
      el("circle", { r: 30, class: "ring ring-a" }, g);
      el("circle", { r: 30, class: "ring ring-b" }, g);
    }
    el("circle", { r: isBranch ? 13 : 19, class: "pin" }, g);
    el("path", { d: icons[s.icon] || icons.cube, class: "glyph", transform: isBranch ? "scale(0.9)" : "scale(1.2)" }, g);

    var labelX = s.side === "left" ? -(isBranch ? 20 : 28) : (isBranch ? 20 : 28);
    var anchor = s.side === "left" ? "end" : "start";
    var label = el("g", { class: "label" }, g);
    el("text", { x: labelX, y: -5, "text-anchor": anchor, class: "label-year" }, label).textContent = s.year;
    el("text", { x: labelX, y: 15, "text-anchor": anchor, class: "label-org" }, label).textContent = s.org;
    if (s.current) {
      el("text", { x: labelX, y: -24, "text-anchor": anchor, class: "label-here" }, label).textContent = "You are here";
    }
    return g;
  }

  stops.forEach(function (s) { marker(s, false); });
  branches.forEach(function (b) { marker(b, true); });

  /* Hover preview card, positioned in screen space. */
  var preview = document.getElementById("map-preview");
  var stage = svg.parentNode;

  function screenPoint(x, y) {
    var pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    var m = svg.getScreenCTM();
    var sp = pt.matrixTransform(m);
    var r = stage.getBoundingClientRect();
    return { x: sp.x - r.left, y: sp.y - r.top };
  }

  function showPreview(s) {
    preview.querySelector(".pv-year").textContent = s.year;
    preview.querySelector(".pv-org").textContent = s.org;
    preview.querySelector(".pv-title").textContent = s.title;
    var p = screenPoint(s.x, s.y);
    var w = stage.clientWidth;
    preview.style.left = Math.min(Math.max(p.x + 22, 12), w - 300) + "px";
    preview.style.top = (p.y - 20) + "px";
    preview.classList.add("is-visible");
  }

  function hidePreview() { preview.classList.remove("is-visible"); }

  /* Zoom: animate the viewBox toward a location and open the detail panel. */
  var panel = document.getElementById("map-panel");
  var panelBody = panel.querySelector(".panel-body");
  fitView();
  var current = VIEW;
  svg.setAttribute("viewBox", VIEW.x + " " + VIEW.y + " " + VIEW.w + " " + VIEW.h);
  var raf = null;

  window.addEventListener("resize", function () {
    fitView();
    if (!panel.classList.contains("is-open")) setView(VIEW);
  });

  function setView(v) {
    current = v;
    svg.setAttribute("viewBox", v.x + " " + v.y + " " + v.w + " " + v.h);
  }

  function animateTo(target, ms) {
    if (raf) cancelAnimationFrame(raf);
    var from = { x: current.x, y: current.y, w: current.w, h: current.h };
    var start = null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setView(target); return; }
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / ms);
      var e = 1 - Math.pow(1 - k, 3);
      setView({
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e
      });
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  function open(s) {
    hidePreview();
    var isNarrow = window.innerWidth < 900;
    var h = 480;
    var w = h * (VIEW.w / VIEW.h);
    var cx = isNarrow ? s.x : s.x + w * 0.22; /* leave room for the panel on the right */
    animateTo({ x: cx - w / 2, y: s.y - h / 2, w: w, h: h }, 700);

    var source = document.getElementById(s.target);
    panelBody.innerHTML = "";
    var kicker = document.createElement("p");
    kicker.className = "panel-kicker";
    kicker.textContent = s.year + " · " + s.org;
    panelBody.appendChild(kicker);
    if (source) {
      var clone = source.cloneNode(true);
      clone.removeAttribute("id");
      clone.classList.add("panel-article");
      panelBody.appendChild(clone);
    }
    var more = document.createElement("a");
    more.className = "panel-more";
    more.href = "#" + s.target;
    more.textContent = "Read it on the page ↓";
    more.addEventListener("click", close);
    panelBody.appendChild(more);

    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("map-open");
    markerLayer.querySelectorAll(".marker").forEach(function (m) {
      m.classList.toggle("is-active", m.getAttribute("data-id") === s.id);
    });
    panel.querySelector(".panel-close").focus();
  }

  function close() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("map-open");
    markerLayer.querySelectorAll(".marker.is-active").forEach(function (m) { m.classList.remove("is-active"); });
    animateTo(VIEW, 650);
  }

  markerLayer.addEventListener("mouseover", function (e) {
    var m = e.target.closest(".marker");
    if (m && !panel.classList.contains("is-open")) showPreview(byId[m.getAttribute("data-id")]);
  });
  markerLayer.addEventListener("mouseout", function (e) {
    if (e.target.closest(".marker")) hidePreview();
  });
  markerLayer.addEventListener("focusin", function (e) {
    var m = e.target.closest(".marker");
    if (m) showPreview(byId[m.getAttribute("data-id")]);
  });
  markerLayer.addEventListener("focusout", hidePreview);
  markerLayer.addEventListener("click", function (e) {
    var m = e.target.closest(".marker");
    if (m) open(byId[m.getAttribute("data-id")]);
  });
  markerLayer.addEventListener("keydown", function (e) {
    var m = e.target.closest(".marker");
    if (m && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(byId[m.getAttribute("data-id")]); }
  });

  panel.querySelector(".panel-close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("is-open")) close(); });
  svg.addEventListener("click", function (e) {
    if (!e.target.closest(".marker") && panel.classList.contains("is-open")) close();
  });

  /* Reveal the trail once, drawing from Education upward. */
  var trail = trailLayer.querySelector(".trail");
  var len = trail.getTotalLength();
  trail.style.strokeDasharray = len;
  trail.style.strokeDashoffset = len;
  requestAnimationFrame(function () {
    trail.classList.add("is-drawn");
    trail.style.strokeDashoffset = 0;
  });
})();
