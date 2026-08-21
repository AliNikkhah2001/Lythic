/* Lythic liquidGL — WebGL liquid refraction hero (liquidgl.naughtyduk.com 833★)
   Use sparingly: only hero/graph backdrop when theme.effects.liquid_gl = true.
   Fallback: pure CSS glass (glass.css) when WebGL unavailable. */
(function(){
  function initLiquidHero(canvasId){
    const canvas = document.getElementById(canvasId);
    if(!canvas) return null;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if(!gl){
      // fallback to CSS glass
      canvas.style.display = "none";
      return null;
    }
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = [
      "precision mediump float;",
      "uniform vec2 res;uniform float time;",
      "uniform vec3 tint;",
      "float wave(vec2 uv,float t){",
      " return sin(uv.x*10.+t)*cos(uv.y*8.-t*.7)*.5+sin((uv.x+uv.y)*6.+t*1.3)*.5;}",
      "void main(){",
      " vec2 uv=gl_FragCoord.xy/res;",
      " float w=wave(uv,time*.001);",
      " vec2 refr=uv+w*.02;",
      " vec3 col=tint*(.5+.5*w)+vec3(refr.x*.1,refr.y*.1,.15);",
      " gl_FragColor=vec4(col,.35);}"
    ].join("\n");
    function compile(type, src){
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "res");
    const uTime = gl.getUniformLocation(prog, "time");
    const uTint = gl.getUniformLocation(prog, "tint");
    // read accent from CSS vars
    const cs = getComputedStyle(document.documentElement);
    const hex = (cs.getPropertyValue("--accent")||"#38bdf8").trim();
    let r=0.22,g2=0.74,b=0.97;
    if(/^#([0-9a-f]{6})$/i.test(hex)){
      r=parseInt(hex.slice(1,3),16)/255;
      g2=parseInt(hex.slice(3,5),16)/255;
      b=parseInt(hex.slice(5,7),16)/255;
    }
    gl.uniform3f(uTint, r, g2, b);
    let running = true;
    function resize(){
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resize);
    resize();
    // respect reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function frame(t){
      if(!running) return;
      if(!mq.matches){ gl.uniform1f(uTime, t); }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return {
      stop(){ running = false; }
    };
  }
  window.LythicLiquid = { initLiquidHero };
})();
