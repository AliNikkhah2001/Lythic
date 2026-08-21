/* Lythic Theme Manager — hyper glass — <100ms no-reload — triad localStorage+QSettings+vault/.lythic/config.json
   Sources: css.glass, Hype4, tailwind, shadcn supports-[backdrop-filter]
   API: LythicTheme.applyTheme(name) <1ms, currentTheme(), THEMES, onChange(cb)
*/
(function(){
  const THEMES = ["default","tokyo-night","dracula","glassmorphism"];
  const STORAGE_KEY = "lythic-theme";
  const CSS_BASE = "css/themes/";
  const FALLBACK = "default";
  let current = FALLBACK;
  let listeners = [];

  function isValid(name){ return THEMES.includes(name); }

  function swapCssLink(name){
    let link = document.getElementById("theme-css");
    if(!link){
      link = document.createElement("link");
      link.id = "theme-css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    // preload to avoid FOUC, then swap
    const href = CSS_BASE + name + ".css";
    if(link.getAttribute("href") !== href){
      link.href = href;
    }
  }

  function applyTheme(name){
    const t0 = performance.now();
    if(!isValid(name)) name = FALLBACK;
    current = name;
    // 1. DOM attribute — triggers [data-theme] CSS vars (<1ms)
    document.documentElement.setAttribute("data-theme", name);
    document.documentElement.style.setProperty("--theme-name", name);
    // 2. CSS link swap (async, no block)
    swapCssLink(name);
    // 3. localStorage (triad 1)
    try{ localStorage.setItem(STORAGE_KEY, name); }catch(e){}
    // 4. QWebChannel → QSettings+vault (triad 2+3) via backend
    try{
      if(window.backend && typeof window.backend.setTheme === "function"){
        window.backend.setTheme(name);
      } else if(window.qt && window.qt.webChannelTransport){
        // will sync on connect
        window._pendingTheme = name;
      }
    }catch(e){}
    // 5. Dispatch event for app to react (<100ms)
    try{
      document.dispatchEvent(new CustomEvent("lythic:themechange", {detail:{theme:name}}));
      listeners.forEach(function(cb){ try{ cb(name); }catch(e){} });
    }catch(e){}
    // 6. Update meta theme-color for OS
    try{
      let meta = document.querySelector('meta[name="theme-color"]');
      if(!meta){ meta=document.createElement("meta"); meta.name="theme-color"; document.head.appendChild(meta); }
      const cs = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0f172a";
      meta.content = cs;
    }catch(e){}
    const dt = performance.now() - t0;
    if(dt > 100) console.warn("[LythicTheme] applyTheme >100ms", dt.toFixed(1)+"ms");
    return name;
  }

  function currentTheme(){
    // priority: DOM > localStorage > backend > fallback
    const dom = document.documentElement.getAttribute("data-theme");
    if(dom && isValid(dom)) return dom;
    try{
      const ls = localStorage.getItem(STORAGE_KEY);
      if(ls && isValid(ls)) return ls;
    }catch(e){}
    return current;
  }

  function onChange(cb){ if(typeof cb==="function") listeners.push(cb); }

  // init: read localStorage before DOMContentLoaded to avoid FOUC
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved && isValid(saved)){
      document.documentElement.setAttribute("data-theme", saved);
      current = saved;
    }
  }catch(e){}

  document.addEventListener("DOMContentLoaded", function(){
    const t = currentTheme();
    applyTheme(t);
    // QWebChannel handshake — vault overlay wins if backend has newer
    if(window.qt && window.qt.webChannelTransport && typeof QWebChannel !== "undefined"){
      try{
        new QWebChannel(window.qt.webChannelTransport, function(ch){
          if(ch.objects.backend){
            window.backend = ch.objects.backend;
            // if backend has theme, vault wins
            try{
              if(window.backend.currentTheme){
                const bTheme = window.backend.currentTheme;
                // Property read
                const vt = typeof bTheme === "function" ? bTheme() : bTheme;
                if(vt && isValid(vt) && vt !== current){
                  applyTheme(vt);
                }
              }
            }catch(e){}
            if(window._pendingTheme) {
              try{ window.backend.setTheme(window._pendingTheme); }catch(e){}
              window._pendingTheme = null;
            }
            // listen backend themeChanged
            try{
              if(window.backend.themeChanged && window.backend.themeChanged.connect){
                window.backend.themeChanged.connect(function(name){ applyTheme(name); });
              }
            }catch(e){}
          }
        });
      }catch(e){}
    }
    // prefers-reduced-transparency: disable blur via class
    try{
      const mq = window.matchMedia("(prefers-reduced-transparency: reduce)");
      if(mq.matches) document.documentElement.classList.add("reduce-transparency");
      mq.addEventListener("change", function(e){
        document.documentElement.classList.toggle("reduce-transparency", e.matches);
      });
    }catch(e){}
  });

  // expose
  window.LythicTheme = {
    applyTheme: applyTheme,
    currentTheme: currentTheme,
    onChange: onChange,
    THEMES: THEMES,
    STORAGE_KEY: STORAGE_KEY
  };
})();
