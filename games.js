/* ------------------------------------------------------------
   FUN GAME ACTIVITIES
   Twenty small games. Every one is self-contained, hand-written,
   and only animates while it is actually on screen.
   ------------------------------------------------------------ */
(function () {
  "use strict";
  function tok(n, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    return v || fb;
  }
  function fit(cv) {
    var r = cv.getBoundingClientRect();
    var d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * d));
    cv.height = Math.max(1, Math.round(r.height * d));
    var x = cv.getContext("2d");
    x.setTransform(d, 0, 0, d, 0, 0);
    return x;
  }
  function loop(el, step) {
    var on = false, raf = 0, inView = false;
    function tick(t) { if (!on) return; step(t); raf = requestAnimationFrame(tick); }
    function start() { if (on) return; on = true; raf = requestAnimationFrame(tick); }
    function stop() { on = false; cancelAnimationFrame(raf); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        inView = e[0].isIntersecting;
        if (inView && !document.hidden) start(); else stop();
      }, { rootMargin: "120px" }).observe(el);
    } else { inView = true; start(); }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (inView) start();
    });
  }
  function el(id) { return document.getElementById(id); }
  function keyguard(cv) {
    cv.addEventListener("keydown", function (e) {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].indexOf(e.key) > -1) e.preventDefault();
    });
  }
  function pointerPos(cv, e) {
    var r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* ============================================ 01 reaction */
  (function () {
    var cv = el("gReact"); if (!cv) return;
    var go = el("gReactGo"), out = el("gReactV");
    var state = "idle", at = 0, best = null, timer = 0;
    function paint(txt, col) {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      x.fillStyle = col; x.fillRect(0, 0, w, h);
      x.fillStyle = "#0f1218"; x.font = "800 22px 'Big Shoulders Display', Impact, sans-serif";
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(txt, w / 2, h / 2); x.textAlign = "start";
    }
    function arm() {
      state = "wait"; paint("WAIT…", tok("--rule", "#2a3039"));
      clearTimeout(timer);
      timer = setTimeout(function () {
        state = "now"; at = performance.now(); paint("CLICK", "#3f9d5a");
      }, 900 + Math.random() * 2200);
    }
    cv.addEventListener("pointerdown", function () {
      if (state === "wait") { clearTimeout(timer); state = "idle"; paint("TOO SOON", tok("--m", "#e7679f")); out.textContent = "too soon"; return; }
      if (state !== "now") return;
      var ms = Math.round(performance.now() - at);
      if (best === null || ms < best) best = ms;
      state = "idle"; paint(ms + " ms", tok("--c", "#3dbbdd"));
      out.textContent = ms + " ms · best " + best + " ms";
    });
    go.addEventListener("click", arm);
    paint("PRESS START", tok("--paper-2", "#161a22"));
  })();

  /* ============================================ 02 aim trainer */
  (function () {
    var cv = el("gAim"); if (!cv) return;
    var go = el("gAimGo"), out = el("gAimV");
    var x = fit(cv), t = null, hits = 0, ends = 0, running = false;
    function spawn() {
      var w = cv.clientWidth, h = cv.clientHeight, r = 13;
      t = { x: r + Math.random() * (w - r * 2), y: r + Math.random() * (h - r * 2), r: r };
    }
    function step() {
      var w = cv.clientWidth, h = cv.clientHeight;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      if (running && performance.now() > ends) { running = false; out.textContent = "time · " + hits + " hits"; }
      if (running && t) {
        x.fillStyle = tok("--m", "#e7679f");
        x.beginPath(); x.arc(t.x, t.y, t.r, 0, 7); x.fill();
        x.fillStyle = tok("--paper-2", "#161a22");
        x.beginPath(); x.arc(t.x, t.y, t.r * 0.45, 0, 7); x.fill();
        var left = Math.max(0, (ends - performance.now()) / 1000);
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 10px 'IBM Plex Mono', monospace";
        x.fillText(left.toFixed(1) + "s · " + hits, 8, 15);
      } else if (!running) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 11px 'IBM Plex Mono', monospace";
        x.fillText("PRESS START", 10, 20);
      }
    }
    cv.addEventListener("pointerdown", function (e) {
      if (!running || !t) return;
      var p = pointerPos(cv, e);
      if (Math.hypot(p.x - t.x, p.y - t.y) <= t.r + 4) { hits++; out.textContent = hits + " hits"; spawn(); }
    });
    go.addEventListener("click", function () { hits = 0; running = true; ends = performance.now() + 20000; spawn(); });
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* ============================================ 03 whack-a-mole */
  (function () {
    var cv = el("gMole"); if (!cv) return;
    var go = el("gMoleGo"), out = el("gMoleV");
    var x = fit(cv), COLS = 4, ROWS = 3, live = -1, score = 0, misses = 0, running = false, next = 0;
    function step(now) {
      var w = cv.clientWidth, h = cv.clientHeight;
      var cw = w / COLS, ch = h / ROWS;
      if (running && now > next) {
        if (live >= 0) { misses++; if (misses >= 5) { running = false; out.textContent = "over · " + score; } }
        live = (Math.random() * COLS * ROWS) | 0;
        next = now + Math.max(420, 950 - score * 22);
      }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      for (var i = 0; i < COLS * ROWS; i++) {
        var cx = (i % COLS) * cw, cy = ((i / COLS) | 0) * ch;
        x.fillStyle = (running && i === live) ? tok("--y", "#e8c25b") : tok("--rule", "#2a3039");
        x.fillRect(cx + 4, cy + 4, cw - 8, ch - 8);
      }
      x.fillStyle = tok("--ink-faint", "#616978");
      x.font = "500 10px 'IBM Plex Mono', monospace";
      x.fillText(running ? score + " hit · " + misses + "/5 missed" : "PRESS START", 8, h - 8);
    }
    cv.addEventListener("pointerdown", function (e) {
      if (!running) return;
      var p = pointerPos(cv, e), w = cv.clientWidth, h = cv.clientHeight;
      var i = ((p.y / (h / ROWS)) | 0) * COLS + ((p.x / (w / COLS)) | 0);
      if (i === live) { score++; live = -1; out.textContent = score + " hits"; }
    });
    go.addEventListener("click", function () { score = 0; misses = 0; live = -1; running = true; next = 0; });
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* ============================================ 04 memory */
  (function () {
    var cv = el("gMemo"); if (!cv) return;
    var go = el("gMemoGo"), out = el("gMemoV");
    var x = fit(cv), seq = [], step_ = 0, showing = -1, phase = "idle", tmr = 0;
    var COLS = 2, ROWS = 2;
    function cols() { return [tok("--c", "#3dbbdd"), tok("--m", "#e7679f"), tok("--y", "#e8c25b"), "#3f9d5a"]; }
    function paint() {
      var w = cv.clientWidth, h = cv.clientHeight, cw = w / COLS, ch = h / ROWS;
      var C = cols();
      var xx = fit(cv);
      xx.fillStyle = tok("--paper-2", "#161a22"); xx.fillRect(0, 0, w, h);
      for (var i = 0; i < 4; i++) {
        var cx = (i % COLS) * cw, cy = ((i / COLS) | 0) * ch;
        xx.globalAlpha = (showing === i) ? 1 : 0.32;
        xx.fillStyle = C[i];
        xx.fillRect(cx + 3, cy + 3, cw - 6, ch - 6);
      }
      xx.globalAlpha = 1;
    }
    function play(i) {
      showing = -1; paint();
      tmr = setTimeout(function () {
        showing = seq[i]; paint();
        tmr = setTimeout(function () {
          showing = -1; paint();
          if (i + 1 < seq.length) play(i + 1); else { phase = "input"; step_ = 0; }
        }, 380);
      }, 160);
    }
    function round() {
      seq.push((Math.random() * 4) | 0);
      phase = "show";
      out.textContent = "round " + seq.length;
      play(0);
    }
    cv.addEventListener("pointerdown", function (e) {
      if (phase !== "input") return;
      var p = pointerPos(cv, e), w = cv.clientWidth, h = cv.clientHeight;
      var i = ((p.y / (h / ROWS)) | 0) * COLS + ((p.x / (w / COLS)) | 0);
      showing = i; paint(); setTimeout(function () { showing = -1; paint(); }, 160);
      if (i === seq[step_]) {
        step_++;
        if (step_ >= seq.length) { phase = "idle"; setTimeout(round, 600); }
      } else { phase = "idle"; out.textContent = "wrong · reached round " + seq.length; seq = []; }
    });
    go.addEventListener("click", function () { clearTimeout(tmr); seq = []; round(); });
    paint();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 05 snake */
  (function () {
    var cv = el("gSnake"); if (!cv) return;
    var go = el("gSnakeGo"), out = el("gSnakeV");
    keyguard(cv);
    var x = fit(cv), S = 10, cols = 0, rows = 0, snake = [], dir = [1, 0], nd = [1, 0], food = null, alive = false, acc = 0, score = 0;
    function build() {
      cols = Math.max(10, Math.floor(cv.clientWidth / S));
      rows = Math.max(8, Math.floor(cv.clientHeight / S));
    }
    function reset() {
      build();
      snake = [[(cols / 2) | 0, (rows / 2) | 0]]; dir = [1, 0]; nd = [1, 0];
      score = 0; alive = true; drop();
      out.textContent = "0";
      cv.focus();
    }
    function drop() { food = [(Math.random() * cols) | 0, (Math.random() * rows) | 0]; }
    function step() {
      acc++;
      var w = cv.clientWidth, h = cv.clientHeight;
      if (alive && acc % 7 === 0) {
        dir = nd;
        var hd = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
        if (hd[0] < 0 || hd[1] < 0 || hd[0] >= cols || hd[1] >= rows) alive = false;
        for (var i = 0; i < snake.length && alive; i++) if (snake[i][0] === hd[0] && snake[i][1] === hd[1]) alive = false;
        if (alive) {
          snake.unshift(hd);
          if (food && hd[0] === food[0] && hd[1] === food[1]) { score++; out.textContent = String(score); drop(); }
          else snake.pop();
        } else out.textContent = "dead · " + score;
      }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      if (food) { x.fillStyle = tok("--m", "#e7679f"); x.fillRect(food[0] * S, food[1] * S, S - 1, S - 1); }
      x.fillStyle = tok("--ink-soft", "#8e96a5");
      for (i = 0; i < snake.length; i++) x.fillRect(snake[i][0] * S, snake[i][1] * S, S - 1, S - 1);
      if (!alive) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 11px 'IBM Plex Mono', monospace";
        x.fillText("PRESS START · CLICK THE PANEL FIRST", 8, 18);
      }
    }
    cv.addEventListener("keydown", function (e) {
      var k = e.key;
      if ((k === "ArrowUp" || k === "w") && dir[1] === 0) nd = [0, -1];
      else if ((k === "ArrowDown" || k === "s") && dir[1] === 0) nd = [0, 1];
      else if ((k === "ArrowLeft" || k === "a") && dir[0] === 0) nd = [-1, 0];
      else if ((k === "ArrowRight" || k === "d") && dir[0] === 0) nd = [1, 0];
    });
    go.addEventListener("click", reset);
    build(); loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); build(); }, 250); });
  })();

  /* ============================================ 06 breakout */
  (function () {
    var cv = el("gBrick"); if (!cv) return;
    var go = el("gBrickGo"), out = el("gBrickV");
    var x = fit(cv), ball = null, px = 0, bricks = [], alive = false, score = 0;
    var BW = 7, BH = 4;
    function reset() {
      var w = cv.clientWidth, h = cv.clientHeight;
      bricks = [];
      for (var r = 0; r < BH; r++) for (var c = 0; c < BW; c++) bricks.push(1);
      ball = { x: w / 2, y: h * 0.62, vx: 2.1, vy: -2.1 };
      px = w / 2; alive = true; score = 0; out.textContent = "0";
    }
    function step() {
      var w = cv.clientWidth, h = cv.clientHeight;
      var bw = w / BW, bh = h * 0.30 / BH, pw = Math.max(46, w * 0.16);
      if (alive && ball) {
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 4 || ball.x > w - 4) ball.vx *= -1;
        if (ball.y < 4) ball.vy *= -1;
        if (ball.y > h - 12 && ball.x > px - pw / 2 && ball.x < px + pw / 2 && ball.vy > 0) {
          ball.vy *= -1; ball.vx += (ball.x - px) / pw * 1.6;
        }
        if (ball.y > h + 10) { alive = false; out.textContent = "lost · " + score; }
        var c = (ball.x / bw) | 0, r = (ball.y / bh) | 0;
        if (r >= 0 && r < BH && c >= 0 && c < BW && bricks[r * BW + c]) {
          bricks[r * BW + c] = 0; ball.vy *= -1; score++;
          out.textContent = String(score);
          if (score >= BW * BH) { alive = false; out.textContent = "cleared!"; }
        }
      }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      var C = [tok("--c", "#3dbbdd"), tok("--m", "#e7679f"), tok("--y", "#e8c25b")];
      for (var i = 0; i < bricks.length; i++) {
        if (!bricks[i]) continue;
        var bx = (i % BW) * bw, by = ((i / BW) | 0) * bh;
        x.fillStyle = C[((i / BW) | 0) % 3];
        x.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
      }
      x.fillStyle = tok("--ink", "#e8eaef");
      x.fillRect(px - pw / 2, h - 8, pw, 4);
      if (ball) { x.beginPath(); x.arc(ball.x, ball.y, 4, 0, 7); x.fill(); }
      if (!alive) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 11px 'IBM Plex Mono', monospace";
        x.fillText("PRESS START", 8, h - 16);
      }
    }
    cv.addEventListener("pointermove", function (e) { px = pointerPos(cv, e).x; });
    go.addEventListener("click", reset);
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* ============================================ 07 pong */
  (function () {
    var cv = el("gPong"); if (!cv) return;
    var go = el("gPongGo"), out = el("gPongV");
    var x = fit(cv), ball = null, py = 0, ay = 0, you = 0, cpu = 0, alive = false;
    function reset(serve) {
      var w = cv.clientWidth, h = cv.clientHeight;
      ball = { x: w / 2, y: h / 2, vx: serve ? 2.6 : -2.6, vy: (Math.random() - 0.5) * 3 };
      py = h / 2; ay = h / 2; alive = true;
    }
    function step() {
      var w = cv.clientWidth, h = cv.clientHeight, ph = Math.max(34, h * 0.24);
      if (alive && ball) {
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.y < 4 || ball.y > h - 4) ball.vy *= -1;
        ay += ((ball.y - ay) * 0.075);            /* deliberately imperfect */
        if (ball.x < 14 && Math.abs(ball.y - py) < ph / 2) { ball.vx = Math.abs(ball.vx) * 1.03; ball.vy += (ball.y - py) / ph * 2; }
        if (ball.x > w - 14 && Math.abs(ball.y - ay) < ph / 2) { ball.vx = -Math.abs(ball.vx) * 1.03; }
        if (ball.x < 0) { cpu++; reset(true); }
        if (ball.x > w) { you++; reset(false); }
        out.textContent = you + " — " + cpu;
      }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.strokeStyle = tok("--rule", "#2a3039"); x.setLineDash([4, 6]);
      x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke(); x.setLineDash([]);
      x.fillStyle = tok("--c", "#3dbbdd"); x.fillRect(8, py - ph / 2, 4, ph);
      x.fillStyle = tok("--m", "#e7679f"); x.fillRect(w - 12, ay - ph / 2, 4, ph);
      if (ball) { x.fillStyle = tok("--ink", "#e8eaef"); x.fillRect(ball.x - 3, ball.y - 3, 6, 6); }
      if (!alive) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 11px 'IBM Plex Mono', monospace";
        x.fillText("PRESS START", 8, 18);
      }
    }
    cv.addEventListener("pointermove", function (e) { py = pointerPos(cv, e).y; });
    go.addEventListener("click", function () { you = 0; cpu = 0; reset(true); });
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* ============================================ 08 flap */
  (function () {
    var cv = el("gFlap"); if (!cv) return;
    var go = el("gFlapGo"), out = el("gFlapV");
    keyguard(cv);
    var x = fit(cv), y = 0, v = 0, pipes = [], alive = false, score = 0, tick = 0;
    function reset() {
      var h = cv.clientHeight;
      y = h / 2; v = 0; pipes = []; alive = true; score = 0; tick = 0;
      out.textContent = "0"; cv.focus();
    }
    function flap() { if (alive) v = -4.2; }
    function step() {
      var w = cv.clientWidth, h = cv.clientHeight;
      if (alive) {
        tick++;
        v += 0.26; y += v;
        if (tick % 92 === 0) pipes.push({ x: w + 20, gap: 46 + Math.random() * 24, y: 30 + Math.random() * (h - 110), hit: false });
        for (var i = pipes.length - 1; i >= 0; i--) {
          var p = pipes[i]; p.x -= 1.9;
          if (p.x < -30) pipes.splice(i, 1);
          else if (!p.hit && p.x < 24 && p.x > 4) {
            if (y < p.y || y > p.y + p.gap) { alive = false; out.textContent = "dead · " + score; }
            else if (p.x < 8) { p.hit = true; score++; out.textContent = String(score); }
          }
        }
        if (y < 0 || y > h) { alive = false; out.textContent = "dead · " + score; }
      }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.fillStyle = tok("--c", "#3dbbdd");
      for (i = 0; i < pipes.length; i++) {
        var q = pipes[i];
        x.fillRect(q.x, 0, 18, q.y);
        x.fillRect(q.x, q.y + q.gap, 18, h - q.y - q.gap);
      }
      x.fillStyle = tok("--y", "#e8c25b");
      x.beginPath(); x.arc(16, y, 5, 0, 7); x.fill();
      if (!alive) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 11px 'IBM Plex Mono', monospace";
        x.fillText("PRESS START, THEN CLICK TO FLAP", 8, h - 10);
      }
    }
    cv.addEventListener("pointerdown", flap);
    cv.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "ArrowUp") flap(); });
    go.addEventListener("click", reset);
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* ============================================ 09 dodge */
  (function () {
    var cv = el("gDodge"); if (!cv) return;
    var go = el("gDodgeGo"), out = el("gDodgeV");
    var x = fit(cv), px = 0, blocks = [], alive = false, t0 = 0, tick = 0;
    function reset() { px = cv.clientWidth / 2; blocks = []; alive = true; t0 = performance.now(); tick = 0; }
    function step(now) {
      var w = cv.clientWidth, h = cv.clientHeight;
      if (alive) {
        tick++;
        var el_ = (now - t0) / 1000;
        if (tick % Math.max(14, 34 - ((el_ / 3) | 0) * 3) === 0) {
          blocks.push({ x: Math.random() * (w - 16), y: -16, s: 10 + Math.random() * 12, v: 1.6 + el_ * 0.06 });
        }
        for (var i = blocks.length - 1; i >= 0; i--) {
          var b = blocks[i]; b.y += b.v;
          if (b.y > h + 20) blocks.splice(i, 1);
          else if (b.y + b.s > h - 16 && b.y < h - 6 && Math.abs((b.x + b.s / 2) - px) < b.s / 2 + 7) {
            alive = false; out.textContent = "hit · " + el_.toFixed(1) + "s";
          }
        }
        out.textContent = el_.toFixed(1) + "s";
      }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.fillStyle = tok("--m", "#e7679f");
      for (i = 0; i < blocks.length; i++) x.fillRect(blocks[i].x, blocks[i].y, blocks[i].s, blocks[i].s);
      x.fillStyle = tok("--ink", "#e8eaef");
      x.fillRect(px - 7, cv.clientHeight - 14, 14, 8);
      if (!alive) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 11px 'IBM Plex Mono', monospace";
        x.fillText("PRESS START", 8, 18);
      }
    }
    cv.addEventListener("pointermove", function (e) { px = pointerPos(cv, e).x; });
    go.addEventListener("click", reset);
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* ============================================ 10 catch the ink */
  (function () {
    var cv = el("gCatch"); if (!cv) return;
    var go = el("gCatchGo"), out = el("gCatchV");
    var x = fit(cv), px = 0, drops = [], alive = false, score = 0, missed = 0, tick = 0;
    function reset() { px = cv.clientWidth / 2; drops = []; alive = true; score = 0; missed = 0; tick = 0; out.textContent = "0"; }
    function step() {
      var w = cv.clientWidth, h = cv.clientHeight;
      var C = [tok("--c", "#3dbbdd"), tok("--m", "#e7679f"), tok("--y", "#e8c25b")];
      if (alive) {
        tick++;
        if (tick % 30 === 0) drops.push({ x: 12 + Math.random() * (w - 24), y: -10, v: 1.5 + Math.random() * 1.4, c: (Math.random() * 3) | 0 });
        for (var i = drops.length - 1; i >= 0; i--) {
          var d = drops[i]; d.y += d.v;
          if (d.y > h - 14 && Math.abs(d.x - px) < 22) { drops.splice(i, 1); score++; out.textContent = String(score); }
          else if (d.y > h + 10) {
            drops.splice(i, 1); missed++;
            if (missed >= 3) { alive = false; out.textContent = "over · " + score; }
          }
        }
      }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      for (i = 0; i < drops.length; i++) {
        x.fillStyle = C[drops[i].c];
        x.beginPath(); x.arc(drops[i].x, drops[i].y, 5, 0, 7); x.fill();
      }
      x.fillStyle = tok("--ink", "#e8eaef");
      x.fillRect(px - 22, h - 10, 44, 5);
      x.fillStyle = tok("--ink-faint", "#616978");
      x.font = "500 10px 'IBM Plex Mono', monospace";
      x.fillText(alive ? "missed " + missed + "/3" : "PRESS START", 8, 15);
    }
    cv.addEventListener("pointermove", function (e) { px = pointerPos(cv, e).x; });
    go.addEventListener("click", reset);
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* ============================================ 11 typing speed */
  (function () {
    var cv = el("gType"); if (!cv) return;
    var go = el("gTypeGo"), inp = el("gTypeIn"), out = el("gTypeV");
    var LINES = [
      "a small program written well outlives a large one written fast",
      "the grid is a promise you make to the reader and then keep",
      "ink is cheap but attention is not so spend it carefully",
      "every language is an argument about what matters most",
      "make it work then make it right then leave it alone"
    ];
    var target = "", t0 = 0, live = false;
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.font = "500 12px 'IBM Plex Mono', monospace";
      var typed = inp.value, cx = 10, cy = 22;
      for (var i = 0; i < target.length; i++) {
        var ch = target[i], cw = x.measureText(ch).width;
        if (cx + cw > w - 10) { cx = 10; cy += 18; }
        if (i < typed.length) x.fillStyle = typed[i] === ch ? "#3f9d5a" : tok("--m", "#e7679f");
        else x.fillStyle = tok("--ink-faint", "#616978");
        x.fillText(ch, cx, cy);
        cx += cw;
      }
      if (!live && !target) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.fillText("PRESS START", 10, 22);
      }
    }
    function start() {
      target = LINES[(Math.random() * LINES.length) | 0];
      inp.value = ""; live = true; t0 = 0; out.textContent = "type it";
      paint(); inp.focus();
    }
    inp.addEventListener("input", function () {
      if (!live) return;
      if (!t0) t0 = performance.now();
      paint();
      if (inp.value === target) {
        live = false;
        var s = (performance.now() - t0) / 1000;
        var wpm = Math.round((target.length / 5) / (s / 60));
        out.textContent = wpm + " wpm · " + s.toFixed(1) + "s";
      }
    });
    go.addEventListener("click", start);
    paint();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 12 scramble */
  (function () {
    var cv = el("gScram"); if (!cv) return;
    var go = el("gScramGo"), inp = el("gScramIn"), out = el("gScramV");
    var WORDS = ["kerning", "leading", "halftone", "registration", "gutter",
                 "serif", "baseline", "overprint", "trapping", "colophon",
                 "ligature", "imposition", "bleed", "moire", "plate"];
    var word = "", shown = "", solved = 0;
    function shuffle(s) {
      var a = s.split(""), i, j, t;
      for (i = a.length - 1; i > 0; i--) { j = (Math.random() * (i + 1)) | 0; t = a[i]; a[i] = a[j]; a[j] = t; }
      var r = a.join("");
      return r === s ? shuffle(s) : r;
    }
    function paint(txt, col) {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.fillStyle = col || tok("--ink", "#e8eaef");
      x.font = "800 26px 'Big Shoulders Display', Impact, sans-serif";
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(txt, w / 2, h / 2);
      x.textAlign = "start"; x.textBaseline = "alphabetic";
    }
    function next() {
      word = WORDS[(Math.random() * WORDS.length) | 0];
      shown = shuffle(word).toUpperCase();
      inp.value = ""; paint(shown);
      out.textContent = solved + " solved";
      inp.focus();
    }
    inp.addEventListener("input", function () {
      if (!word) return;
      if (inp.value.trim().toLowerCase() === word) {
        solved++; paint(word.toUpperCase(), "#3f9d5a");
        out.textContent = solved + " solved";
        word = "";
        setTimeout(next, 800);
      }
    });
    go.addEventListener("click", next);
    paint("NEW WORD", tok("--ink-faint", "#616978"));
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { if (word) paint(shown); }, 250); });
  })();

  /* ============================================ 13 noughts and crosses */
  (function () {
    var cv = el("gTic"); if (!cv) return;
    var go = el("gTicGo"), out = el("gTicV");
    var b = [], over = true;
    var WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function winner(s) {
      for (var i = 0; i < WIN.length; i++) {
        var a = WIN[i];
        if (s[a[0]] && s[a[0]] === s[a[1]] && s[a[1]] === s[a[2]]) return s[a[0]];
      }
      return s.indexOf("") < 0 ? "d" : null;
    }
    function best(s, me) {
      var w = winner(s);
      if (w === "o") return { v: 1 };
      if (w === "x") return { v: -1 };
      if (w === "d") return { v: 0 };
      var bv = me ? -2 : 2, bi = -1;
      for (var i = 0; i < 9; i++) {
        if (s[i]) continue;
        s[i] = me ? "o" : "x";
        var v = best(s, !me).v;
        s[i] = "";
        if (me ? v > bv : v < bv) { bv = v; bi = i; }
      }
      return { v: bv, i: bi };
    }
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 8, ox = (w - s) / 2, oy = (h - s) / 2, c = s / 3;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.strokeStyle = tok("--rule", "#2a3039"); x.lineWidth = 1.5;
      for (var i = 1; i < 3; i++) {
        x.beginPath(); x.moveTo(ox + i * c, oy); x.lineTo(ox + i * c, oy + s); x.stroke();
        x.beginPath(); x.moveTo(ox, oy + i * c); x.lineTo(ox + s, oy + i * c); x.stroke();
      }
      x.lineWidth = 2.5;
      for (i = 0; i < 9; i++) {
        var cx = ox + (i % 3) * c + c / 2, cy = oy + ((i / 3) | 0) * c + c / 2, r = c * 0.26;
        if (b[i] === "x") {
          x.strokeStyle = tok("--c", "#3dbbdd");
          x.beginPath(); x.moveTo(cx - r, cy - r); x.lineTo(cx + r, cy + r);
          x.moveTo(cx + r, cy - r); x.lineTo(cx - r, cy + r); x.stroke();
        } else if (b[i] === "o") {
          x.strokeStyle = tok("--m", "#e7679f");
          x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
        }
      }
    }
    function check() {
      var w = winner(b);
      if (!w) return false;
      over = true;
      out.textContent = w === "d" ? "draw — well played" : (w === "x" ? "you won?!" : "machine wins");
      return true;
    }
    cv.addEventListener("pointerdown", function (e) {
      if (over) return;
      var p = pointerPos(cv, e), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 8, ox = (w - s) / 2, oy = (h - s) / 2, c = s / 3;
      var col = ((p.x - ox) / c) | 0, row = ((p.y - oy) / c) | 0;
      if (col < 0 || col > 2 || row < 0 || row > 2) return;
      var i = row * 3 + col;
      if (b[i]) return;
      b[i] = "x"; paint();
      if (check()) return;
      var m = best(b.slice(), true).i;
      if (m >= 0) b[m] = "o";
      paint(); check();
    });
    go.addEventListener("click", function () {
      b = ["","","","","","","","",""]; over = false;
      out.textContent = "your move";
      paint();
    });
    b = ["","","","","","","","",""]; paint();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 14 minesweeper */
  (function () {
    var cv = el("gMine"); if (!cv) return;
    var go = el("gMineGo"), out = el("gMineV");
    var W = 9, H = 7, MINES = 9, m = [], open = [], flag = [], over = true;
    function idx(c, r) { return r * W + c; }
    function around(i, fn) {
      var c = i % W, r = (i / W) | 0;
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= W || nr >= H) continue;
        fn(idx(nc, nr));
      }
    }
    function count(i) { var n = 0; around(i, function (j) { if (m[j]) n++; }); return n; }
    function reset() {
      m = []; open = []; flag = []; over = false;
      for (var i = 0; i < W * H; i++) { m[i] = 0; open[i] = 0; flag[i] = 0; }
      var placed = 0;
      while (placed < MINES) { var k = (Math.random() * W * H) | 0; if (!m[k]) { m[k] = 1; placed++; } }
      out.textContent = MINES + " mines"; paint();
    }
    function flood(i) {
      if (open[i] || flag[i]) return;
      open[i] = 1;
      if (count(i) === 0) around(i, flood);
    }
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      var cw = w / W, ch = h / H;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.font = "600 10px 'IBM Plex Mono', monospace";
      x.textAlign = "center"; x.textBaseline = "middle";
      var C = ["", tok("--c", "#3dbbdd"), "#3f9d5a", tok("--m", "#e7679f"), tok("--y", "#e8c25b"), tok("--m", "#e7679f"), tok("--c", "#3dbbdd"), tok("--ink", "#e8eaef"), tok("--ink", "#e8eaef")];
      for (var i = 0; i < W * H; i++) {
        var cx = (i % W) * cw, cy = ((i / W) | 0) * ch;
        if (open[i]) {
          x.fillStyle = tok("--paper", "#0f1218"); x.fillRect(cx, cy, cw - 1, ch - 1);
          if (m[i]) { x.fillStyle = tok("--m", "#e7679f"); x.beginPath(); x.arc(cx + cw / 2, cy + ch / 2, Math.min(cw, ch) * 0.22, 0, 7); x.fill(); }
          else { var n = count(i); if (n) { x.fillStyle = C[n]; x.fillText(String(n), cx + cw / 2, cy + ch / 2 + 1); } }
        } else {
          x.fillStyle = tok("--rule", "#2a3039"); x.fillRect(cx, cy, cw - 1, ch - 1);
          if (flag[i]) { x.fillStyle = tok("--y", "#e8c25b"); x.fillRect(cx + cw * 0.35, cy + ch * 0.3, cw * 0.3, ch * 0.4); }
        }
      }
      x.textAlign = "start"; x.textBaseline = "alphabetic";
    }
    function hit(e) {
      var p = pointerPos(cv, e);
      var c = ((p.x / (cv.clientWidth / W)) | 0), r = ((p.y / (cv.clientHeight / H)) | 0);
      if (c < 0 || r < 0 || c >= W || r >= H) return -1;
      return idx(c, r);
    }
    cv.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      if (over) return;
      var i = hit(e); if (i < 0 || open[i]) return;
      flag[i] = flag[i] ? 0 : 1; paint();
    });
    cv.addEventListener("pointerdown", function (e) {
      if (over || e.button === 2) return;
      var i = hit(e); if (i < 0 || flag[i]) return;
      if (m[i]) {
        for (var k = 0; k < m.length; k++) if (m[k]) open[k] = 1;
        over = true; out.textContent = "boom";
      } else {
        flood(i);
        var left = 0;
        for (k = 0; k < m.length; k++) if (!m[k] && !open[k]) left++;
        if (!left) { over = true; out.textContent = "cleared!"; }
        else out.textContent = left + " squares left";
      }
      paint();
    });
    go.addEventListener("click", reset);
    reset(); over = true; out.textContent = "press start";
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 15 fifteen puzzle */
  (function () {
    var cv = el("gSlide"); if (!cv) return;
    var go = el("gSlideGo"), out = el("gSlideV");
    var N = 4, t = [], moves = 0;
    function solved() { for (var i = 0; i < 15; i++) if (t[i] !== i + 1) return false; return true; }
    function reset() {
      t = []; for (var i = 1; i < 16; i++) t.push(i); t.push(0);
      var blank = 15;
      for (i = 0; i < 400; i++) {
        var opts = [];
        var c = blank % N, r = (blank / N) | 0;
        if (c > 0) opts.push(blank - 1); if (c < N - 1) opts.push(blank + 1);
        if (r > 0) opts.push(blank - N); if (r < N - 1) opts.push(blank + N);
        var k = opts[(Math.random() * opts.length) | 0];
        t[blank] = t[k]; t[k] = 0; blank = k;
      }
      moves = 0; out.textContent = "0 moves"; paint();
    }
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 6, ox = (w - s) / 2, oy = (h - s) / 2, c = s / N;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.font = "700 13px 'IBM Plex Mono', monospace";
      x.textAlign = "center"; x.textBaseline = "middle";
      for (var i = 0; i < 16; i++) {
        if (!t[i]) continue;
        var cx = ox + (i % N) * c, cy = oy + ((i / N) | 0) * c;
        x.fillStyle = tok("--rule", "#2a3039");
        x.fillRect(cx + 2, cy + 2, c - 4, c - 4);
        x.fillStyle = t[i] === i + 1 ? tok("--c", "#3dbbdd") : tok("--ink-soft", "#8e96a5");
        x.fillText(String(t[i]), cx + c / 2, cy + c / 2 + 1);
      }
      x.textAlign = "start"; x.textBaseline = "alphabetic";
    }
    cv.addEventListener("pointerdown", function (e) {
      if (!t.length) return;
      var p = pointerPos(cv, e), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 6, ox = (w - s) / 2, oy = (h - s) / 2, c = s / N;
      var col = ((p.x - ox) / c) | 0, row = ((p.y - oy) / c) | 0;
      if (col < 0 || row < 0 || col >= N || row >= N) return;
      var i = row * N + col, blank = t.indexOf(0);
      var bc = blank % N, br = (blank / N) | 0;
      if (Math.abs(bc - col) + Math.abs(br - row) !== 1) return;
      t[blank] = t[i]; t[i] = 0; moves++;
      out.textContent = solved() ? "solved in " + moves : moves + " moves";
      paint();
    });
    go.addEventListener("click", reset);
    reset();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 16 lights out */
  (function () {
    var cv = el("gLights"); if (!cv) return;
    var go = el("gLightsGo"), out = el("gLightsV");
    var N = 5, g = [], moves = 0;
    function toggle(c, r) { if (c < 0 || r < 0 || c >= N || r >= N) return; g[r * N + c] ^= 1; }
    function reset() {
      g = []; for (var i = 0; i < N * N; i++) g[i] = 0;
      for (i = 0; i < 8; i++) {
        var k = (Math.random() * N * N) | 0, c = k % N, r = (k / N) | 0;
        toggle(c, r); toggle(c - 1, r); toggle(c + 1, r); toggle(c, r - 1); toggle(c, r + 1);
      }
      moves = 0; out.textContent = "0 moves"; paint();
    }
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 6, ox = (w - s) / 2, oy = (h - s) / 2, c = s / N;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      for (var i = 0; i < N * N; i++) {
        var cx = ox + (i % N) * c, cy = oy + ((i / N) | 0) * c;
        x.fillStyle = g[i] ? tok("--y", "#e8c25b") : tok("--rule", "#2a3039");
        x.fillRect(cx + 2, cy + 2, c - 4, c - 4);
      }
    }
    cv.addEventListener("pointerdown", function (e) {
      var p = pointerPos(cv, e), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 6, ox = (w - s) / 2, oy = (h - s) / 2, c = s / N;
      var col = ((p.x - ox) / c) | 0, row = ((p.y - oy) / c) | 0;
      if (col < 0 || row < 0 || col >= N || row >= N) return;
      toggle(col, row); toggle(col - 1, row); toggle(col + 1, row); toggle(col, row - 1); toggle(col, row + 1);
      moves++;
      var lit = 0; for (var i = 0; i < g.length; i++) lit += g[i];
      out.textContent = lit ? moves + " moves · " + lit + " lit" : "out in " + moves + " moves";
      paint();
    });
    go.addEventListener("click", reset);
    reset();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 17 maze escape */
  (function () {
    var cv = el("gMaze"); if (!cv) return;
    var go = el("gMazeGo"), out = el("gMazeV");
    keyguard(cv);
    var W = 13, H = 9, cell = [], px = 0, py = 0, moves = 0, done = true;
    /* each cell holds walls: 1 top, 2 right, 4 bottom, 8 left */
    function carve() {
      cell = []; for (var i = 0; i < W * H; i++) cell[i] = 15;
      var seen = [], stack = [0];
      seen[0] = 1;
      while (stack.length) {
        var cur = stack[stack.length - 1], c = cur % W, r = (cur / W) | 0, n = [];
        if (r > 0 && !seen[cur - W]) n.push([cur - W, 1, 4]);
        if (c < W - 1 && !seen[cur + 1]) n.push([cur + 1, 2, 8]);
        if (r < H - 1 && !seen[cur + W]) n.push([cur + W, 4, 1]);
        if (c > 0 && !seen[cur - 1]) n.push([cur - 1, 8, 2]);
        if (!n.length) { stack.pop(); continue; }
        var pick = n[(Math.random() * n.length) | 0];
        cell[cur] &= ~pick[1];
        cell[pick[0]] &= ~pick[2];
        seen[pick[0]] = 1; stack.push(pick[0]);
      }
    }
    function reset() { carve(); px = 0; py = 0; moves = 0; done = false; out.textContent = "escape bottom-right"; paint(); cv.focus(); }
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w / W, h / H), ox = (w - s * W) / 2, oy = (h - s * H) / 2;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.fillStyle = tok("--y", "#e8c25b");
      x.fillRect(ox + (W - 1) * s + s * 0.25, oy + (H - 1) * s + s * 0.25, s * 0.5, s * 0.5);
      x.strokeStyle = tok("--ink-soft", "#8e96a5"); x.lineWidth = 1;
      for (var i = 0; i < W * H; i++) {
        var c = i % W, r = (i / W) | 0, X = ox + c * s, Y = oy + r * s, v = cell[i];
        x.beginPath();
        if (v & 1) { x.moveTo(X, Y); x.lineTo(X + s, Y); }
        if (v & 2) { x.moveTo(X + s, Y); x.lineTo(X + s, Y + s); }
        if (v & 4) { x.moveTo(X, Y + s); x.lineTo(X + s, Y + s); }
        if (v & 8) { x.moveTo(X, Y); x.lineTo(X, Y + s); }
        x.stroke();
      }
      x.fillStyle = tok("--m", "#e7679f");
      x.beginPath(); x.arc(ox + px * s + s / 2, oy + py * s + s / 2, s * 0.24, 0, 7); x.fill();
    }
    function move(dc, dr, wall) {
      if (done) return;
      var i = py * W + px;
      if (cell[i] & wall) return;
      px += dc; py += dr; moves++;
      if (px === W - 1 && py === H - 1) { done = true; out.textContent = "out in " + moves + " moves"; }
      else out.textContent = moves + " moves";
      paint();
    }
    cv.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowUp" || k === "w") move(0, -1, 1);
      else if (k === "ArrowRight" || k === "d") move(1, 0, 2);
      else if (k === "ArrowDown" || k === "s") move(0, 1, 4);
      else if (k === "ArrowLeft" || k === "a") move(-1, 0, 8);
    });
    cv.addEventListener("pointerdown", function (e) {
      cv.focus();
      var p = pointerPos(cv, e), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w / W, h / H), ox = (w - s * W) / 2, oy = (h - s * H) / 2;
      var dx = p.x - (ox + px * s + s / 2), dy = p.y - (oy + py * s + s / 2);
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0, dx > 0 ? 2 : 8);
      else move(0, dy > 0 ? 1 : -1, dy > 0 ? 4 : 1);
    });
    go.addEventListener("click", reset);
    carve(); paint();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 18 higher or lower */
  (function () {
    var cv = el("gHilo"); if (!cv) return;
    var go = el("gHiloGo"), up = el("gHiloUp"), dn = el("gHiloDown"), out = el("gHiloV");
    var cur = 0, streak = 0, live = false, prev = null;
    function draw() { return 1 + ((Math.random() * 13) | 0); }
    function label(n) { return ["", "A","2","3","4","5","6","7","8","9","10","J","Q","K"][n]; }
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      x.textAlign = "center"; x.textBaseline = "middle";
      function card(cx, n, dim) {
        x.fillStyle = dim ? tok("--rule", "#2a3039") : tok("--ink", "#e8eaef");
        x.fillRect(cx - 26, h / 2 - 34, 52, 68);
        x.fillStyle = dim ? tok("--ink-faint", "#616978") : tok("--paper", "#0f1218");
        x.font = "800 24px 'Big Shoulders Display', Impact, sans-serif";
        x.fillText(n ? label(n) : "?", cx, h / 2 + 1);
      }
      card(w / 2 - 34, prev, true);
      card(w / 2 + 34, live ? 0 : cur, false);
      x.textAlign = "start"; x.textBaseline = "alphabetic";
    }
    function guess(higher) {
      if (!live) return;
      var next = draw();
      var ok = next === cur ? true : (higher ? next > cur : next < cur);
      prev = cur; cur = next;
      if (ok) { streak++; out.textContent = "streak " + streak; }
      else { live = false; out.textContent = "wrong · streak was " + streak; }
      paint();
    }
    up.addEventListener("click", function () { guess(true); });
    dn.addEventListener("click", function () { guess(false); });
    go.addEventListener("click", function () { cur = draw(); prev = null; streak = 0; live = true; out.textContent = "higher or lower?"; paint(); });
    cur = 0; paint();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 19 odd one out */
  (function () {
    var cv = el("gShade"); if (!cv) return;
    var go = el("gShadeGo"), out = el("gShadeV");
    var n = 2, odd = 0, level = 0, live = false, hue = 0, delta = 0;
    function reset() { n = 2; level = 0; live = true; round(); }
    function round() {
      n = Math.min(7, 2 + ((level / 2) | 0));
      odd = (Math.random() * n * n) | 0;
      hue = (Math.random() * 360) | 0;
      delta = Math.max(4, 34 - level * 2.4);
      out.textContent = "level " + (level + 1);
      paint();
    }
    function paint() {
      var x = fit(cv), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 6, ox = (w - s) / 2, oy = (h - s) / 2, c = s / n;
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      if (!live) {
        x.fillStyle = tok("--ink-faint", "#616978");
        x.font = "500 11px 'IBM Plex Mono', monospace";
        x.fillText("PRESS START", 10, 20);
        return;
      }
      for (var i = 0; i < n * n; i++) {
        var cx = ox + (i % n) * c, cy = oy + ((i / n) | 0) * c;
        x.fillStyle = "hsl(" + hue + ",58%," + (46 + (i === odd ? delta : 0)) + "%)";
        x.fillRect(cx + 2, cy + 2, c - 4, c - 4);
      }
    }
    cv.addEventListener("pointerdown", function (e) {
      if (!live) return;
      var p = pointerPos(cv, e), w = cv.clientWidth, h = cv.clientHeight;
      var s = Math.min(w, h) - 6, ox = (w - s) / 2, oy = (h - s) / 2, c = s / n;
      var col = ((p.x - ox) / c) | 0, row = ((p.y - oy) / c) | 0;
      if (col < 0 || row < 0 || col >= n || row >= n) return;
      if (row * n + col === odd) { level++; round(); }
      else { live = false; out.textContent = "wrong · reached level " + (level + 1); paint(); }
    });
    go.addEventListener("click", reset);
    paint();
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(paint, 250); });
  })();

  /* ============================================ 20 precision stop */
  (function () {
    var cv = el("gStop"); if (!cv) return;
    var go = el("gStopGo"), out = el("gStopV");
    var x = fit(cv), pos = 0, spd = 0.016, live = false, best = null, frozen = 0;
    function step() {
      var w = cv.clientWidth, h = cv.clientHeight;
      if (live) { pos += spd; if (pos > 1 || pos < 0) { spd *= -1; pos = Math.max(0, Math.min(1, pos)); } }
      x.fillStyle = tok("--paper-2", "#161a22"); x.fillRect(0, 0, w, h);
      var y0 = h * 0.34, bh = h * 0.32;
      x.fillStyle = tok("--rule", "#2a3039"); x.fillRect(10, y0, w - 20, bh);
      x.fillStyle = "#3f9d5a"; x.fillRect(w / 2 - 4, y0, 8, bh);
      x.fillStyle = tok("--ink", "#e8eaef");
      x.fillRect(10 + pos * (w - 20) - 1.5, y0 - 5, 3, bh + 10);
      x.fillStyle = tok("--ink-faint", "#616978");
      x.font = "500 10px 'IBM Plex Mono', monospace";
      x.fillText(live ? "CLICK ON THE GREEN" : (frozen ? "" : "PRESS START"), 10, h - 8);
    }
    function stop() {
      if (!live) return;
      live = false; frozen = 1;
      var off = Math.abs(pos - 0.5) * 200;
      if (best === null || off < best) best = off;
      out.textContent = off.toFixed(1) + "% off · best " + best.toFixed(1) + "%";
      spd = Math.abs(spd) * 1.12 * (Math.random() < 0.5 ? -1 : 1);
    }
    cv.addEventListener("pointerdown", stop);
    go.addEventListener("click", function () { pos = 0; spd = 0.016; live = true; frozen = 0; out.textContent = "go"; });
    loop(cv, step);
    window.addEventListener("resize", function () { clearTimeout(cv._t); cv._t = setTimeout(function () { x = fit(cv); }, 250); });
  })();

  /* the canvases bake theme tokens in at paint time, so a theme switch has to
     redraw them — every game already repaints on resize, so borrow that. */
  if (window.MutationObserver) {
    var repaint = 0;
    new MutationObserver(function () {
      clearTimeout(repaint);
      repaint = setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 40);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  }

})();
