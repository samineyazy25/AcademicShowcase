// METAL HDX Visualization
// Compares Dijkstra's algorithm with a modified BFS that minimizes highway switches.

const HW = ["I-87", "US-9", "NY-7", "NY-146", "US-20", "NY-5", "I-90", "NY-85"];
const HC = {
  "I-87": "#f87171",
  "US-9": "#fbbf24",
  "NY-7": "#4ade80",
  "NY-146": "#60a5fa",
  "US-20": "#c084fc",
  "NY-5": "#fb923c",
  "I-90": "#38bdf8",
  "NY-85": "#f472b6",
};
const DPC = [
  "dist[all] = ∞  ;  dist[start] = 0",
  "pq.add( start, priority=0 )",
  "",
  "while pq is not empty :",
  "    u = pq.removeMin()",
  "    if visited[u] : continue",
  "    visited[u] = true",
  "    if u == end : ✓  path found!",
  "    for each neighbor v :",
  "        nd = dist[u] + weight(u,v)",
  "        if nd < dist[v] :",
  "            dist[v] = nd  ;  prev[v] = u",
  "            pq.update( v, nd )",
];
const BPC = [
  "sw[start][h] = 0  for each highway h",
  "deque.pushFront( start, h, sw=0 )",
  "",
  "while deque is not empty :",
  "    (u, hId, sw) = deque.popFront()",
  "    if stale state : continue",
  "    if u == end : ✓  path found!",
  "    for each neighbor v via highway nh :",
  "        same = ( nh == hId )",
  "        nsw = sw + ( same ? 0 : 1 )",
  "        if nsw < sw[v][nh] :",
  "            if same → deque.pushFront(v,...)",
  "            else    → deque.pushBack(v,...)",
];

let cv,
  ctx,
  W = 0,
  H = 0,
  nodes = [],
  edges = [],
  adj = [];
let sN = 0,
  eN = 47,
  sel = "start",
  algo = "dijk",
  st = null,
  playing = false,
  tmr = null,
  stp = 0;

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function buildGraph(w, h) {
  const r = rng(42),
    R = 6,
    C = 8,
    N = R * C;
  const px = 50,
    py = 46,
    gw = w - px * 2,
    gh = h - py * 2;
  nodes = [];
  for (let row = 0; row < R; row++)
    for (let col = 0; col < C; col++) {
      nodes.push({
        x: px + (col / (C - 1)) * gw + (r() - 0.5) * gw * 0.07,
        y: py + (row / (R - 1)) * gh + (r() - 0.5) * gh * 0.08,
        label: "V" + (row * C + col),
      });
    }
  edges = [];
  adj = Array.from({ length: N }, () => []);
  const ae = (i, j) => {
    if (i < 0 || j < 0 || i >= N || j >= N || adj[i].some((e) => e.to === j))
      return;
    const dx = nodes[i].x - nodes[j].x,
      dy = nodes[i].y - nodes[j].y;
    const d = +(Math.sqrt(dx * dx + dy * dy) / 10).toFixed(1);
    const hw = HW[Math.floor(r() * HW.length)];
    edges.push({ a: i, b: j, hw, d });
    adj[i].push({ to: j, hw, d });
    adj[j].push({ to: i, hw, d });
  };
  for (let row = 0; row < R; row++)
    for (let col = 0; col < C; col++) {
      const i = row * C + col;
      if (col + 1 < C) ae(i, i + 1);
      if (row + 1 < R) ae(i, i + C);
      if (row + 1 < R && col + 1 < C && r() < 0.4) ae(i, i + C + 1);
      if (row + 1 < R && col > 0 && r() < 0.3) ae(i, i + C - 1);
      if (r() < 0.14) ae(i, Math.floor(r() * N));
    }
  document.getElementById("mstat").textContent =
    N + " vertices · " + edges.length + " edges";
  eN = N - 1;
  document.getElementById("snv").textContent = nodes[sN].label;
  document.getElementById("env").textContent = nodes[eN].label;
}

function ek(a, b) {
  return Math.min(a, b) + "_" + Math.max(a, b);
}

function draw() {
  if (!ctx || !W || !H) return;
  ctx.fillStyle = "#07090f";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(28,35,56,0.7)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 38) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const tE = st?.treeEdges || new Set(),
    pE = st?.pathEdges || new Set();
  edges.forEach((e) => {
    const k = ek(e.a, e.b),
      a = nodes[e.a],
      b = nodes[e.b];
    let col = "rgba(28,42,68,0.5)",
      lw = 1.2;
    if (pE.has(k)) {
      col = "#22d3ee";
      lw = 3.5;
    } else if (tE.has(k)) {
      col = HC[e.hw] || "#4ade80";
      lw = 2;
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (tE.has(k) && !pE.has(k)) {
      const mx = (a.x + b.x) / 2,
        my = (a.y + b.y) / 2;
      ctx.fillStyle = col;
      ctx.font = "500 8px -apple-system,sans-serif";
      ctx.fillText(e.hw, mx + 3, my - 3);
    }
  });
  const inT = st?.inT || new Set(),
    inQ = st?.inQ || new Set(),
    cur = st?.cur ?? -1;
  nodes.forEach((n, i) => {
    let fill = "#1e3a5f",
      stroke = "#60a5fa",
      rad = 6,
      sw = 1.5;
    if (i === sN) {
      fill = "#14532d";
      stroke = "#fff";
      rad = 10;
      sw = 2;
    } else if (i === eN) {
      fill = "#7f1d1d";
      stroke = "#fff";
      rad = 10;
      sw = 2;
    } else if (i === cur) {
      fill = "#7f1d1d";
      stroke = "#f87171";
      rad = 8;
      sw = 2;
    } else if (inT.has(i)) {
      fill = "#14532d";
      stroke = "#4ade80";
      rad = 7;
      sw = 1.5;
    } else if (inQ.has(i)) {
      fill = "#713f12";
      stroke = "#fbbf24";
      rad = 6.5;
      sw = 1.5;
    }
    ctx.beginPath();
    ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = sw;
    ctx.stroke();
    if (i === sN || i === eN || i === cur || inT.has(i)) {
      ctx.fillStyle = i === sN ? "#86efac" : i === eN ? "#fca5a5" : stroke;
      ctx.font =
        "500 " +
        (i === sN || i === eN ? 10 : 9) +
        "px -apple-system,sans-serif";
      ctx.fillText(n.label, n.x + rad + 4, n.y + 4);
    }
  });
}

function setStatus(t, m) {
  document.getElementById("st").textContent = t;
  const d = document.getElementById("sd");
  d.style.background =
    m === "run"
      ? "#4ade80"
      : m === "done"
        ? "#22d3ee"
        : m === "warn"
          ? "#fbbf24"
          : "#4a5568";
}
function setHint(t) {
  const h = document.getElementById("mhint");
  if (t) {
    h.style.display = "block";
    h.textContent = t;
  } else h.style.display = "none";
}
function setStep(n) {
  document.getElementById("sctr").textContent = "Step " + n;
}

function buildPC() {
  const pc = algo === "dijk" ? DPC : BPC;
  document.getElementById("pcl").innerHTML = pc
    .map((l, i) => `<div class="pl" id="pc${i}">${l || " "}</div>`)
    .join("");
}
function hiPC(idx) {
  document.querySelectorAll(".pl").forEach((el, i) => {
    el.className = "pl" + (i === idx ? " on" : i < idx ? " was" : "");
  });
  if (idx >= 0) {
    const el = document.getElementById("pc" + idx);
    if (el) el.scrollIntoView({ block: "nearest" });
  }
}
function rDS() {
  if (!st) return;
  const q = st.qItems || [],
    t = st.inT || new Set(),
    v = st.vis || new Set(),
    p = st.pathNodes || [],
    bq = st.bfsQ || [];
  if (algo === "dijk") {
    document.getElementById("d1t").textContent = "Priority queue";
    document.getElementById("d1c").textContent = q.length + " items";
    document.getElementById("d1").innerHTML = q.length
      ? q
          .slice(0, 12)
          .map(
            (x) =>
              `<span class="di b">${nodes[x.v]?.label} ${x.d.toFixed(1)}</span>`,
          )
          .join("")
      : '<span class="di e">empty</span>';
  } else {
    document.getElementById("d1t").textContent = "Deque";
    document.getElementById("d1c").textContent = bq.length + " items";
    document.getElementById("d1").innerHTML = bq.length
      ? bq
          .slice(0, 10)
          .map(
            (x) => `<span class="di b">${nodes[x.v]?.label} sw=${x.sw}</span>`,
          )
          .join("")
      : '<span class="di e">empty</span>';
  }
  document.getElementById("d2c").textContent = t.size + " nodes";
  document.getElementById("d2").innerHTML = t.size
    ? [...t]
        .slice(0, 16)
        .map((x) => `<span class="di g">${nodes[x]?.label}</span>`)
        .join("")
    : '<span class="di e">empty</span>';
  document.getElementById("d3c").textContent = v.size + " nodes";
  document.getElementById("d3").innerHTML = v.size
    ? [...v]
        .slice(0, 16)
        .map((x) => `<span class="di p">${nodes[x]?.label}</span>`)
        .join("")
    : '<span class="di e">empty</span>';
  if (p.length) {
    document.getElementById("d4c").textContent = p.length + " hops";
    document.getElementById("d4").innerHTML = p
      .map((x) => `<span class="di c">${nodes[x]?.label}</span>`)
      .join('<span style="color:#4a5568;font-size:9px;padding:0 1px">›</span>');
  } else {
    document.getElementById("d4c").textContent = "—";
    document.getElementById("d4").innerHTML =
      '<span class="di e">not yet found</span>';
  }
}

function initD() {
  const N = nodes.length,
    dist = new Array(N).fill(Infinity),
    prev = new Array(N).fill(-1);
  dist[sN] = 0;
  return {
    dist,
    prev,
    vis: new Set(),
    inT: new Set(),
    inQ: new Set([sN]),
    treeEdges: new Set(),
    pathEdges: new Set(),
    pathNodes: [],
    pq: [{ v: sN, d: 0 }],
    qItems: [{ v: sN, d: 0 }],
    bfsQ: [],
    cur: -1,
    done: false,
    found: false,
  };
}
function stepD() {
  const s = st;
  if (!s || s.done) return;
  s.pq.sort((a, b) => a.d - b.d);
  if (!s.pq.length) {
    s.done = true;
    hiPC(-1);
    setStatus("No path exists", "warn");
    return;
  }
  const { v: u, d } = s.pq.shift();
  s.cur = u;
  if (s.vis.has(u)) {
    hiPC(5);
    setStatus("Skipping " + nodes[u].label + " — already visited", "run");
    return;
  }
  s.vis.add(u);
  s.inQ.delete(u);
  s.inT.add(u);
  hiPC(6);
  if (u === eN) {
    s.done = true;
    s.found = true;
    hiPC(7);
    const path = [];
    let c = eN;
    while (c !== -1) {
      path.unshift(c);
      c = s.prev[c];
    }
    s.pathNodes = path;
    const pe = new Set();
    for (let i = 0; i < path.length - 1; i++) pe.add(ek(path[i], path[i + 1]));
    s.pathEdges = pe;
    setStatus(
      "Path found — " + d.toFixed(2) + " mi · " + path.length + " hops",
      "done",
    );
    showResult(
      "Shortest distance: " + d.toFixed(2) + " mi · " + path.length + " hops",
    );
    finish();
    return;
  }
  setStatus(
    "Relaxing edges from " + nodes[u].label + " (dist=" + d.toFixed(2) + ")",
    "run",
  );
  hiPC(8);
  adj[u].forEach(({ to: v, d: w }) => {
    if (s.vis.has(v)) return;
    const nd = s.dist[u] + w;
    if (nd < s.dist[v]) {
      s.dist[v] = nd;
      s.prev[v] = u;
      s.pq.push({ v, d: nd });
      s.inQ.add(v);
      s.treeEdges.add(ek(u, v));
    }
  });
  s.qItems = [...s.pq];
}
function initB() {
  const N = nodes.length,
    H = HW.length;
  const sw = Array.from({ length: N }, () => new Array(H).fill(Infinity));
  const prev = Array.from({ length: N }, () => new Array(H).fill(-1));
  const prevH = Array.from({ length: N }, () => new Array(H).fill(-1));
  const deque = [];
  adj[sN].forEach((e) => {
    const hi = HW.indexOf(e.hw);
    if (hi >= 0 && sw[sN][hi] === Infinity) {
      sw[sN][hi] = 0;
      deque.push({ v: sN, hw: e.hw, hi, sw: 0 });
    }
  });
  return {
    sw,
    prev,
    prevH,
    deque,
    bfsQ: [...deque],
    inT: new Set([sN]),
    vis: new Set(),
    treeEdges: new Set(),
    pathEdges: new Set(),
    pathNodes: [],
    inQ: new Set([sN]),
    qItems: [],
    cur: -1,
    done: false,
    found: false,
  };
}
function stepB() {
  const s = st;
  if (!s || s.done) return;
  if (!s.deque.length) {
    s.done = true;
    hiPC(-1);
    setStatus("No path exists", "warn");
    return;
  }
  const { v: u, hw: hId, hi, sw: curSw } = s.deque.shift();
  s.cur = u;
  hiPC(4);
  if (curSw > s.sw[u][hi]) {
    setStatus("Skipping stale state at " + nodes[u].label, "run");
    return;
  }
  s.vis.add(u);
  if (u === eN) {
    s.done = true;
    s.found = true;
    hiPC(6);
    let bsw = Infinity,
      bh = -1;
    HW.forEach((_, h) => {
      if (s.sw[eN][h] < bsw) {
        bsw = s.sw[eN][h];
        bh = h;
      }
    });
    setStatus("Path found — " + bsw + " highway switches", "done");
    showResult(
      "Fewest highway switches: " + bsw + " switch" + (bsw === 1 ? "" : "es"),
    );
    const path = [eN];
    let c = eN,
      ch = bh;
    while (s.prev[c][ch] !== -1) {
      const pc2 = s.prev[c][ch],
        ph = s.prevH[c][ch];
      path.unshift(pc2);
      c = pc2;
      ch = ph;
    }
    s.pathNodes = path;
    const pe = new Set();
    for (let i = 0; i < path.length - 1; i++) pe.add(ek(path[i], path[i + 1]));
    s.pathEdges = pe;
    finish();
    return;
  }
  setStatus(
    "Processing " + nodes[u].label + " via " + hId + " (sw=" + curSw + ")",
    "run",
  );
  hiPC(7);
  adj[u].forEach((e) => {
    const nh = HW.indexOf(e.hw);
    if (nh < 0) return;
    const same = e.hw === hId,
      nsw = curSw + (same ? 0 : 1);
    if (nsw < s.sw[e.to][nh]) {
      s.sw[e.to][nh] = nsw;
      s.prev[e.to][nh] = u;
      s.prevH[e.to][nh] = hi;
      s.treeEdges.add(ek(u, e.to));
      s.inT.add(e.to);
      s.inQ.add(e.to);
      if (same) s.deque.unshift({ v: e.to, hw: e.hw, hi: nh, sw: nsw });
      else s.deque.push({ v: e.to, hw: e.hw, hi: nh, sw: nsw });
    }
  });
  s.bfsQ = [...s.deque.slice(0, 12)];
  s.inQ = new Set(s.deque.map((d) => d.v));
}

function showResult(sub) {
  document.getElementById("rp-sub").textContent = sub;
  document.getElementById("rp").style.display = "block";
}
function finish() {
  stopPlay();
  document.getElementById("bs").disabled = true;
  document.getElementById("bp").disabled = true;
}
function onStart() {
  if (sN === eN) {
    setStatus("Start and End must be different nodes", "warn");
    return;
  }
  stp = 0;
  setStep(0);
  st = algo === "dijk" ? initD() : initB();
  buildPC();
  hiPC(0);
  document.getElementById("bs").disabled = false;
  document.getElementById("bp").disabled = false;
  document.getElementById("rp").style.display = "none";
  setHint(null);
  setStatus("Initialized — press Step or Play", "run");
  draw();
  rDS();
}
function onStep() {
  if (!st || st.done) return;
  stp++;
  setStep(stp);
  algo === "dijk" ? stepD() : stepB();
  draw();
  rDS();
}
function onPlay() {
  if (playing) {
    stopPlay();
  } else {
    playing = true;
    document.getElementById("pico").innerHTML =
      '<rect x="1.5" y="1" width="2.5" height="8" rx="1"/><rect x="6" y="1" width="2.5" height="8" rx="1"/>';
    document.getElementById("plbl").textContent = "Pause";
    tick();
  }
}
function stopPlay() {
  playing = false;
  clearTimeout(tmr);
  document.getElementById("pico").innerHTML = '<polygon points="2,1 9,5 2,9"/>';
  document.getElementById("plbl").textContent = "Play";
}
function tick() {
  if (!playing || !st || st.done) {
    stopPlay();
    return;
  }
  onStep();
  tmr = setTimeout(tick, +document.getElementById("spd").value);
}
function onReset() {
  stopPlay();
  st = null;
  stp = 0;
  setStep(0);
  document.getElementById("bs").disabled = true;
  document.getElementById("bp").disabled = true;
  document.getElementById("rp").style.display = "none";
  document.getElementById("pcl").innerHTML = "";
  ["d1", "d2", "d3"].forEach((id) => {
    document.getElementById(id).innerHTML = '<span class="di e">empty</span>';
  });
  document.getElementById("d4").innerHTML =
    '<span class="di e">not yet found</span>';
  document.getElementById("d1c").textContent = "0 items";
  document.getElementById("d2c").textContent = "0 nodes";
  document.getElementById("d3c").textContent = "0 nodes";
  document.getElementById("d4c").textContent = "—";
  sel = "start";
  document.getElementById("sbd").classList.add("pick");
  document.getElementById("ebd").classList.remove("pick");
  setHint("Click any node to set start point");
  setStatus("Click a node on the map to set your start point");
  draw();
}
function setAlgo(a) {
  algo = a;
  document.getElementById("pd").classList.toggle("on", a === "dijk");
  document.getElementById("pb").classList.toggle("on", a === "bfs");
  onReset();
}
function setSel(m) {
  sel = m;
  document.getElementById("sbd").classList.toggle("pick", m === "start");
  document.getElementById("ebd").classList.toggle("pick", m === "end");
  setHint(
    m === "start"
      ? "Click any node to set start point"
      : "Click any node to set end point",
  );
  setStatus(
    m === "start"
      ? "Click a node on the map to set start point"
      : "Click a node on the map to set end point",
  );
}
function nearN(mx, my) {
  let best = -1,
    bd = Infinity;
  nodes.forEach((n, i) => {
    const d = (n.x - mx) ** 2 + (n.y - my) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return bd < 3600 ? best : -1;
}
function init() {
  cv = document.getElementById("cv");
  const ma = document.getElementById("ma");
  W = ma.clientWidth;
  H = ma.clientHeight;
  if (!W || !H) {
    setTimeout(init, 120);
    return;
  }
  cv.width = W;
  cv.height = H;
  cv.style.width = W + "px";
  cv.style.height = H + "px";
  ctx = cv.getContext("2d");
  buildGraph(W, H);
  draw();
  document.getElementById("sbd").classList.add("pick");
  setHint("Click any node to set start point");
  cv.addEventListener("click", (e) => {
    const r = cv.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width),
      my = (e.clientY - r.top) * (H / r.height);
    const n = nearN(mx, my);
    if (n < 0) {
      setStatus("Click closer to a node circle", "warn");
      return;
    }
    if (sel === "start") {
      sN = n;
      document.getElementById("snv").textContent = nodes[n].label;
      document.getElementById("sbd").classList.remove("pick");
      sel = "end";
      document.getElementById("ebd").classList.add("pick");
      setHint("Now click any node to set end point");
      setStatus("Start = " + nodes[n].label + " — now click your end node");
    } else if (sel === "end") {
      if (n === sN) {
        setStatus("End must differ from start — pick another node", "warn");
        return;
      }
      eN = n;
      document.getElementById("env").textContent = nodes[n].label;
      document.getElementById("ebd").classList.remove("pick");
      sel = "none";
      setHint(null);
      setStatus(
        "Ready — press Start to run " + (algo === "dijk" ? "Dijkstra" : "BFS"),
      );
    }
    draw();
  });
  window.addEventListener("resize", () => {
    const ma = document.getElementById("ma");
    W = ma.clientWidth;
    H = ma.clientHeight;
    if (!W || !H) return;
    cv.width = W;
    cv.height = H;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    buildGraph(W, H);
    st = null;
    draw();
  });
}
setTimeout(init, 150);
