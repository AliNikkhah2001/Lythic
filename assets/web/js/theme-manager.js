/* Theme manager — <100ms live switch, no reload, triad localStorage+QSettings+vault config */
(function(){
  const THEMES = ["default","tokyo-night","dracula","glassmorphism"];
  function applyTheme(name){
    if(!THEMES.includes(name)) name="default";
    document.documentElement.setAttribute("data-theme", name);
    try{ localStorage.setItem("lythic-theme", name); }catch(e){}
    // notify backend via QWebChannel if present
    try{
      if(window.backend && window.backend.setTheme){
        window.backend.setTheme(name);
      }
    }catch(e){}
    // swap css link if needed
    const link=document.getElementById("theme-css");
    if(link){ link.href="css/themes/"+name+".css"; }
    return name;
  }
  function currentTheme(){
    try{
      const v=localStorage.getItem("lythic-theme");
      if(v && THEMES.includes(v)) return v;
    }catch(e){}
    return document.documentElement.getAttribute("data-theme") || "default";
  }
  // init from localStorage
  document.addEventListener("DOMContentLoaded",function(){
    const t=currentTheme();
    applyTheme(t);
    // QWebChannel handshake
    if(window.qt && window.qt.webChannelTransport){
      new QWebChannel(window.qt.webChannelTransport,function(ch){
        if(ch.objects.backend){
          window.backend=ch.objects.backend;
          // sync current
          try{ window.backend.setTheme(t);}catch(e){}
        }
      });
    }
  });
  window.LythicTheme={applyTheme, currentTheme, THEMES};
})();
