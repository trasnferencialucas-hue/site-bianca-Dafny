(function(){
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── analytics ─────────────────────────────────────────── */
  window.dataLayer = window.dataLayer || [];
  function track(name, params){
    try{
      window.dataLayer.push(Object.assign({event:name}, params||{}));
      if (typeof window.gtag === "function") window.gtag("event", name, params||{});
    }catch(e){}
  }
  document.addEventListener("click", function(e){
    var a = e.target.closest("[data-track]");
    if (a) track("contact_click", {method: a.dataset.track});
    var c = e.target.closest('a[href*="contacto"], a[href*="/contact"], a[href*="portfolio"]');
    if (c) track("cta_click", {target: c.getAttribute("href"), label: (c.textContent||"").trim().slice(0,40)});
  });

  /* ── revelação ao deslizar ─────────────────────────────── */
  var io = null;
  if ("IntersectionObserver" in window && !reduce){
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, {rootMargin:"0px 0px -8% 0px", threshold:0.04});
  }
  Array.prototype.forEach.call(document.querySelectorAll(".r, .fig"), function(el){
    if (!io || el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add("in");
    else io.observe(el);
  });

  /* ── cabeçalho ─────────────────────────────────────────── */
  var hdr = document.querySelector(".hdr"), mcta = document.querySelector(".mcta"), waBtn = document.getElementById("wa"), lastY = 0;
  function onScroll(){
    var y = window.scrollY || 0;
    hdr.classList.toggle("solid", y > 80);
    hdr.classList.toggle("up", y > 240 && y > lastY && !document.body.classList.contains("menu"));
    if (mcta) mcta.classList.toggle("show", y > 520);
    if (waBtn) waBtn.classList.toggle("show", y > 380);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* ── menu (telemóvel) ──────────────────────────────────── */
  var burger = document.getElementById("burger"), menu = document.getElementById("menu");
  if (burger) burger.addEventListener("click", function(){
    var open = !document.body.classList.contains("menu");
    document.body.classList.toggle("menu", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) hdr.classList.remove("up");
  });

  /* ── filtros do portfólio ──────────────────────────────── */
  var filters = document.getElementById("filters");
  if (filters){
    var items = Array.prototype.slice.call(document.querySelectorAll("#masonry .item"));
    var empty = document.getElementById("pf-empty");
    filters.addEventListener("click", function(e){
      var b = e.target.closest("button[data-f]");
      if (!b) return;
      filters.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x === b); });
      var f = b.dataset.f, n = 0;
      items.forEach(function(it){
        var ok = f === "all" || (" " + it.dataset.cat + " ").indexOf(" " + f + " ") > -1;
        it.classList.toggle("hide", !ok);
        if (ok) n++;
      });
      if (empty) empty.hidden = n > 0;
      track("portfolio_filter", {category:f});
    });
  }

  /* ── galeria em ecrã cheio ─────────────────────────────── */
  var lb = document.getElementById("lb"), lbImg = document.getElementById("lb-img"),
      lbCap = document.getElementById("lb-cap"), lbCount = document.getElementById("lb-count"),
      list = [], idx = 0;

  function render(){
    var img = list[idx];
    if (!img) return;
    lbImg.src = img.dataset.full || img.src;
    lbImg.alt = img.alt || "";
    lbCap.textContent = img.dataset.cap || img.alt || "";
    lbCount.textContent = (idx + 1) + " / " + list.length;
  }
  function move(d){ idx = (idx + d + list.length) % list.length; render(); }
  function closeLB(){
    document.body.classList.remove("lb-open");
    document.body.style.overflow = "";
    setTimeout(function(){ if (!document.body.classList.contains("lb-open")) lb.hidden = true; }, 420);
  }
  document.addEventListener("click", function(e){
    var img = e.target.closest("img[data-full]");
    if (img){
      e.preventDefault();
      list = Array.prototype.filter.call(document.querySelectorAll("img[data-full]"), function(i){
        var it = i.closest(".item");
        return !it || !it.classList.contains("hide");
      });
      idx = Math.max(0, list.indexOf(img));
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      render();
      requestAnimationFrame(function(){ document.body.classList.add("lb-open"); });
      document.getElementById("lb-close").focus();
      track("lightbox_open", {image: img.getAttribute("src")});
      return;
    }
    if (e.target.closest("#lb-close")) closeLB();
    if (e.target.closest("#lb-prev")) move(-1);
    if (e.target.closest("#lb-next")) move(1);
    if (e.target === lb) closeLB();
  });
  document.addEventListener("keydown", function(e){
    if (!lb || lb.hidden) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
  });
  if (lb){
    var tx = 0;
    lb.addEventListener("touchstart", function(e){ tx = e.changedTouches[0].clientX; }, {passive:true});
    lb.addEventListener("touchend", function(e){
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 55) move(dx < 0 ? 1 : -1);
    }, {passive:true});
  }

  /* ── cursor (rato) ─────────────────────────────────────── */
  var cur = document.getElementById("cur");
  if (cur && window.matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce){
    var cx=0, cy=0, rx=0, ry=0, raf=null, active=false;
    document.addEventListener("mousemove", function(e){
      cx = e.clientX; cy = e.clientY;
      var over = !!e.target.closest("img[data-full]") && (!lb || lb.hidden);
      if (over !== active){ active = over; cur.classList.toggle("on", over); }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    function loop(){
      rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18;
      cur.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%) scale(" + (active ? 1 : 0) + ")";
      raf = (Math.abs(cx-rx) > 0.4 || Math.abs(cy-ry) > 0.4 || active) ? requestAnimationFrame(loop) : null;
    }
  }

  /* ── formulário ────────────────────────────────────────── */
  var form = document.getElementById("form"), sent = document.getElementById("sent");
  if (form){
    var L = document.documentElement.lang.indexOf("en") === 0;
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var f = new FormData(form), get = function(k){ return (f.get(k)||"").toString().trim(); };
      if (!get("nome") || !get("email")){
        var bad = !get("nome") ? document.getElementById("f-nome") : document.getElementById("f-email");
        bad.focus(); bad.style.borderColor = "#B4544A"; return;
      }
      var lines = [
        (L ? "Name: " : "Nome: ") + get("nome"),
        "Email: " + get("email"),
        (L ? "Phone: " : "Telefone: ") + (get("telefone") || "—"),
        (L ? "Session type: " : "Tipo de sessão: ") + get("tipo"),
        (L ? "Date: " : "Data: ") + (get("data") || "—"),
        (L ? "Location: " : "Localização: ") + (get("local") || "—"),
        (L ? "People: " : "Número de pessoas: ") + (get("pessoas") || "—"),
        "", get("mensagem") || ""
      ];
      var subject = (L ? "Photography enquiry — " : "Pedido de fotografia — ") + get("tipo") + " · " + get("nome");
      window.location.href = "mailto:biancadafnyrocha17@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      track("generate_lead", {session_type:get("tipo"), location:get("local")});
      form.hidden = true; sent.hidden = false;
      sent.scrollIntoView({block:"center", behavior: reduce ? "auto" : "smooth"});
    });
    var again = document.getElementById("again");
    if (again) again.addEventListener("click", function(){
      form.reset(); form.hidden = false; sent.hidden = true;
      document.getElementById("f-nome").focus();
    });
  }

  /* ── tira da sessão: o scroll vertical move a tira na horizontal ── */
  var pin = document.getElementById("pin");
  if (pin && !reduce && window.matchMedia("(min-width:960px) and (hover:hover)").matches){
    var trk = pin.querySelector(".track"), tick = false, over = 0;
    var measure = function(){
      over = Math.max(0, trk.scrollWidth - window.innerWidth);
      pin.style.setProperty("--pin-h", Math.round(window.innerHeight + over * 1.25) + "px");
      update();
    };
    var update = function(){
      tick = false;
      var r = pin.getBoundingClientRect(), total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      pin.style.setProperty("--p", p.toFixed(4));
    };
    pin.classList.add("pin-on");
    trk.removeAttribute("tabindex");
    window.addEventListener("scroll", function(){ if (!tick){ tick = true; requestAnimationFrame(update); } }, {passive:true});
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    measure();
  }

  track("page_view", {page_path: location.pathname, page_title: document.title});
})();
