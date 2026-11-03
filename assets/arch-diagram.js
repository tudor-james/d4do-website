/**
 * Cosmogony C4-Level Architecture Diagram
 * Self-contained SVG renderer. Mounts into #cosmogony-arch-diagram.
 * Shows high-level C4 components: CLI, Web UI, VS Code Plugin, Core, Secure Sandboxes, and Bring-Your-Own LLMs.
 */
(function () {
  'use strict';

  var C = {
    bg:      '#050b18',
    panel:   '#0e1628',
    border:  '#1f2a44',
    accent:  '#6ee7ff',
    text:    '#e5e7eb',
    muted:   '#94a3b8',
    green:   '#34d399',
    purple:  '#a78bfa',
  };

  var W = 1000, H = 560;

  function el(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] !== null && attrs[k] !== undefined) {
          e.setAttribute(k, attrs[k]);
        }
      });
    }
    return e;
  }

  function txt(content, attrs) {
    var e = el('text', attrs);
    e.textContent = content;
    return e;
  }

  // ── C4 Zones [x, y, w, h, title, subtitle, strokeColor, dash] ────────────
  var ZONES = [
    [30,  24, 940, 130, 'Developer & Team Interfaces  [Thin Clients — Zero Local Code Execution]',
     'All client surfaces connect over HTTPS; no AI-generated code ever runs on user devices', C.accent, '4 3'],
    [30, 184, 580, 340, 'Your Controlled Environment  [Cosmogony System Boundary]',
     'Deployed within your cloud or on-premises perimeter', C.green, '8 4'],
    [640, 184, 330, 340, 'Connected Providers & Repositories',
     'Configured and governed by your organisation', C.purple, '4 3'],
  ];

  // ── C4 Containers [id, title, c4Type, desc, x, y, w, h, color] ───────────
  var NODES = [
    // Top row: CLI, UI, Plugin
    ['cli',      'Cosmogony CLI',       '[Container: Terminal Client]',
                 '3-column Terminal UI & scriptable CLI',
                 55,  58, 270, 76, C.accent],
    ['ui',       'Cosmogony Web UI',    '[Container: Web Application]',
                 'Shared sessions, checkpoints & governance',
                 365, 58, 270, 76, C.accent],
    ['plugin',   'VS Code Plugin',      '[Container: IDE Extension]',
                 'In-editor collaboration & gate reviews',
                 675, 58, 270, 76, C.accent],

    // Inside Your Controlled Environment: Core + Secure Sandboxes
    ['core',     'Cosmogony Core',      '[Container: Orchestration Service]',
                 'Manages shared sessions, workflows, and human review gates',
                 80,  228, 480, 96, C.green],

    ['sandboxes','Secure Sandboxes',    '[Container: Isolated Execution Environments]',
                 'Ephemeral, single-use containers — one isolated sandbox per session',
                 80,  384, 480, 96, C.green],

    // Right column: Bring-Your-Own LLMs & GitHub
    ['byo_llm',  'Bring-Your-Own LLMs', '[External System: AI Providers]',
                 'OpenAI · Anthropic · Gemini · Vertex AI · Bedrock · Local',
                 665, 228, 280, 96, C.purple],

    ['vcs',      'Source Control (Git)', '[External System: Repositories]',
                 'Dedicated session feature branches & Pull Requests',
                 665, 384, 280, 96, C.purple],
  ];

  // ── Relationships [fromId, toId, label, color] ───────────────────────────
  var EDGES = [
    ['cli',       'core',      'HTTPS',                 C.accent],
    ['ui',        'core',      'HTTPS',                 C.accent],
    ['plugin',    'core',      'HTTPS',                 C.accent],
    ['core',      'sandboxes', 'Isolated session work', C.green],
    ['core',      'byo_llm',   'Model inference',       C.purple],
    ['sandboxes', 'vcs',       'Feature branch & PR',   C.purple],
  ];

  var TIPS = {
    cli:       'Standalone 3-column Terminal UI and CLI for Windows, macOS, and Linux. Connects to Cosmogony Core over HTTPS with zero code execution on your workstation.',
    ui:        'Browser workspace for collaborating in shared sessions, reviewing deliverables at checkpoints, customizing workflows, and viewing cost metrics.',
    plugin:    'VS Code extension that brings shared AI sessions and checkpoint approvals directly alongside your editor.',
    core:      'Central orchestration service running inside your environment. Coordinates workflows, manages shared session context, and enforces human approval checkpoints.',
    sandboxes: 'Every session runs inside its own fresh, isolated container. Code is built and verified here—never on developer laptops—and the sandbox is destroyed when the session ends.',
    byo_llm:   'Connect the AI providers your organisation approves—cloud providers (OpenAI, Anthropic, Google Gemini, Vertex AI, AWS Bedrock) or private self-hosted models.',
    vcs:       'All changes are committed to an isolated session feature branch. Your team reviews and merges the Pull Request through your normal Git workflow.',
  };

  function nodeRect(id) {
    for (var i = 0; i < NODES.length; i++) {
      if (NODES[i][0] === id) return { x: NODES[i][4], y: NODES[i][5], w: NODES[i][6], h: NODES[i][7] };
    }
    return null;
  }

  function edgePts(fromId, toId) {
    var fr = nodeRect(fromId), tr = nodeRect(toId);
    if (!fr || !tr) return null;
    var fc = { x: fr.x + fr.w / 2, y: fr.y + fr.h / 2 };
    var tc = { x: tr.x + tr.w / 2, y: tr.y + tr.h / 2 };
    var dx = tc.x - fc.x, dy = tc.y - fc.y;
    var x1, y1, x2, y2;
    if (Math.abs(dx) > Math.abs(dy) * 1.4) {
      x1 = dx > 0 ? fr.x + fr.w : fr.x;  y1 = fc.y;
      x2 = dx > 0 ? tr.x : tr.x + tr.w;  y2 = tc.y;
    } else {
      x1 = fc.x;  y1 = dy > 0 ? fr.y + fr.h : fr.y;
      x2 = tc.x;  y2 = dy > 0 ? tr.y : tr.y + tr.h;
    }
    return { x1: x1, y1: y1, x2: x2, y2: y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }

  var COLOR_MARKER = {};
  COLOR_MARKER[C.accent] = 'mk-acc';
  COLOR_MARKER[C.green]  = 'mk-grn';
  COLOR_MARKER[C.purple] = 'mk-pur';

  function build(container) {
    var styleTag = document.createElement('style');
    styleTag.textContent = '@keyframes archDash{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}.arch-edge{animation:archDash 1.6s linear infinite}';
    document.head.appendChild(styleTag);

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      width: '100%',
      height: 'auto',
      role: 'img',
      'aria-label': 'Cosmogony C4 architecture diagram showing CLI, Web UI, VS Code Plugin, Core, Secure Sandboxes, and Bring-Your-Own LLMs',
    });
    svg.style.display = 'block';
    svg.style.background = C.bg;
    svg.style.borderRadius = '14px';
    svg.style.border = '1px solid ' + C.border;

    var defs = el('defs');
    [['mk-acc', C.accent], ['mk-grn', C.green], ['mk-pur', C.purple]].forEach(function (m) {
      var marker = el('marker', {
        id: m[0], markerWidth: '8', markerHeight: '8',
        refX: '7', refY: '3', orient: 'auto', markerUnits: 'userSpaceOnUse',
      });
      marker.appendChild(el('path', { d: 'M0,0 L0,6 L8,3 z', fill: m[1] }));
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // Render C4 Zones
    ZONES.forEach(function (z) {
      svg.appendChild(el('rect', {
        x: z[0], y: z[1], width: z[2], height: z[3],
        rx: '12', fill: C.bg,
        stroke: z[6], 'stroke-width': '1.5',
        'stroke-dasharray': z[7] || '', opacity: '0.9',
      }));
      svg.appendChild(el('rect', {
        x: z[0] + 1, y: z[1] + 1, width: z[2] - 2, height: z[3] - 2,
        rx: '11', fill: z[6], opacity: '0.03',
      }));
      svg.appendChild(txt(z[4], {
        x: z[0] + 16, y: z[1] + 22,
        fill: z[6], 'font-size': '11', 'font-weight': '700',
        'font-family': "'Source Code Pro', monospace",
      }));
      svg.appendChild(txt(z[5], {
        x: z[0] + 16, y: z[1] + z[3] - 10,
        fill: C.muted, 'font-size': '9.5',
        'font-family': "'Source Code Pro', monospace", opacity: '0.7',
      }));
    });

    // Render Edges
    EDGES.forEach(function (edge) {
      var pts = edgePts(edge[0], edge[1]);
      if (!pts) return;
      var markerId = COLOR_MARKER[edge[3]] || 'mk-acc';
      svg.appendChild(el('path', {
        d: 'M' + pts.x1 + ',' + pts.y1 + ' L' + pts.x2 + ',' + pts.y2,
        fill: 'none', stroke: edge[3], 'stroke-width': '1.75',
        'stroke-dasharray': '6 4', 'marker-end': 'url(#' + markerId + ')',
        opacity: '0.75', class: 'arch-edge',
      }));
      if (edge[2]) {
        var lw = edge[2].length * 5.8 + 14;
        svg.appendChild(el('rect', {
          x: pts.mx - lw / 2, y: pts.my - 10, width: lw, height: 16,
          rx: '4', fill: C.bg, stroke: C.border, 'stroke-width': '1', opacity: '0.95',
        }));
        svg.appendChild(txt(edge[2], {
          x: pts.mx, y: pts.my + 2, fill: edge[3],
          'font-size': '9', 'font-weight': '600', 'text-anchor': 'middle',
          'font-family': "'Source Code Pro', monospace",
        }));
      }
    });

    // Tooltip element
    var tip = document.createElement('div');
    tip.style.cssText = 'display:none;position:fixed;z-index:9999;background:#0e1628;border:1px solid #1f2a44;border-left:3px solid #6ee7ff;border-radius:8px;padding:10px 14px;max-width:290px;pointer-events:none;font-family:"Source Code Pro",monospace;box-shadow:0 8px 32px rgba(0,0,0,0.7)';
    document.body.appendChild(tip);

    // Render C4 Containers
    NODES.forEach(function (n) {
      var id = n[0], title = n[1], c4Type = n[2], desc = n[3];
      var nx = n[4], ny = n[5], nw = n[6], nh = n[7], color = n[8];

      var g = el('g');
      g.style.cursor = 'pointer';

      g.appendChild(el('rect', {
        x: nx + 3, y: ny + 4, width: nw, height: nh,
        rx: '9', fill: '#000', opacity: '0.35',
      }));

      var body = el('rect', {
        x: nx, y: ny, width: nw, height: nh,
        rx: '9', fill: C.panel, stroke: color, 'stroke-width': '1.5',
      });
      g.appendChild(body);

      g.appendChild(el('rect', {
        x: nx, y: ny + 10, width: '3.5', height: nh - 20,
        rx: '1.5', fill: color, opacity: '0.95',
      }));

      g.appendChild(txt(title, {
        x: nx + nw / 2, y: ny + 24,
        fill: C.text, 'font-size': '12.5', 'font-weight': '700',
        'font-family': "'Source Code Pro', monospace", 'text-anchor': 'middle',
      }));

      g.appendChild(txt(c4Type, {
        x: nx + nw / 2, y: ny + 42,
        fill: color, 'font-size': '9', 'font-weight': '500',
        'font-family': "'Source Code Pro', monospace", 'text-anchor': 'middle', opacity: '0.9',
      }));

      g.appendChild(txt(desc, {
        x: nx + nw / 2, y: ny + 62,
        fill: C.muted, 'font-size': '9.5',
        'font-family': "'Source Code Pro', monospace", 'text-anchor': 'middle',
      }));

      g.addEventListener('mouseenter', function () {
        body.setAttribute('stroke-width', '2.5');
      });
      g.addEventListener('mouseleave', function () {
        body.setAttribute('stroke-width', '1.5');
        tip.style.display = 'none';
      });

      var tipText = TIPS[id];
      if (tipText) {
        g.addEventListener('mousemove', function (e) {
          tip.innerHTML = '<div style="font-size:12px;font-weight:700;color:#e5e7eb;margin-bottom:6px">' +
            title + '</div><div style="font-size:11px;color:#94a3b8;line-height:1.6">' + tipText + '</div>';
          tip.style.display = 'block';
          var left = e.clientX + 16;
          if (left + 300 > window.innerWidth) left = e.clientX - 304;
          tip.style.left = left + 'px';
          tip.style.top = (e.clientY - 8) + 'px';
        });
      }

      svg.appendChild(g);
    });

    container.appendChild(svg);
  }

  function mount() {
    var container = document.getElementById('cosmogony-arch-diagram');
    if (!container) return;
    try {
      build(container);
    } catch (err) {
      console.error('[arch-diagram] render error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
}());
