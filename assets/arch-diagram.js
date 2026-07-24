/**
 * Cosmogony Security Architecture Diagram
 * Self-contained SVG renderer. Mounts into #cosmogony-arch-diagram.
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
    danger:  '#ff6e6e',
    warn:    '#fbbf24',
    green:   '#34d399',
    purple:  '#a78bfa',
  };

  var W = 1060, H = 820;

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

  // ── Zone rectangles [x, y, w, h] ─────────────────────────────────────────
  var CORP = [10,  10, 1040, 800];   // corporate network perimeter
  var PLAT = [30,  90,  440, 200];   // Cosmogony platform (opaque)
  var TOOL = [30, 320,  440, 100];   // security controls strip
  var SAND = [30, 450,  440, 180];   // ephemeral sandboxes
  var EXT  = [510, 90,  520, 290];   // external services (right side)
  var DEV  = [510, 420, 520, 210];   // developer devices
  var AUDIT_ZONE = [30, 660, 1000, 100]; // audit log zone (bottom)

  // ── Nodes [id, label, sublabel, x, y, w, h, color] ───────────────────────
  var NODES = [
    // Platform — single black box
    ['platform',   'Cosmogony Platform',   'Agent orchestration · tool dispatch · session management',
                    50, 110, 400, 80, C.accent],

    // Persistent session store — platform-owned, team-accessible
    ['sessions',   'Session Store',        'Persistent · platform-owned · team-accessible',
                    50, 210, 400, 56, C.accent],

    // Security controls
    ['guardrails', 'Safety Guardrails',    'Code-immutable pre-exec rules',
                    50, 336, 190, 64, C.danger],
    ['registry',   'Tool Registry',        'Deny-by-default · org allowlist',
                    260, 336, 190, 64, C.warn],

    // Sandboxes
    ['sb1',        'Sandbox',              'ephemeral · non-root · egress DROP',
                    50, 468, 125, 72, C.muted],
    ['sb2',        'Sandbox',              'ephemeral · non-root · egress DROP',
                    190, 468, 125, 72, C.muted],
    ['sb3',        'Sandbox ×N',           'ephemeral · non-root · egress DROP',
                    330, 468, 125, 72, C.muted],

    // Egress control
    ['egress',     'Network Egress',       'iptables · DROP all · allowlist only',
                    140, 565, 210, 50, C.danger],

    // External services
    ['github',     'VCS / GitHub',         'Bot identity · feature branches only · PR gate',
                    530, 110, 480, 56, C.green],
    ['pkgs',       'Package Registries',   'npm · pypi · maven · go · crates.io',
                    530, 186, 480, 56, C.muted],
    ['integrations','Future Integrations', 'Coming soon · same controls apply',
                    530, 262, 480, 56, C.border],

    // Developer devices
    ['ide',        'Cosmogony IDE',        'UI only — no execution on device',
                    530, 440, 480, 56, C.accent],
    ['browser',    'Browser / Dashboard',  'Chat · approve gates · review PRs',
                    530, 516, 480, 56, C.accent],

    // Audit log
    ['audit',      'Audit Log',            'Append-only · every tool call · every file write · full attribution',
                    50, 678, 960, 56, C.green],
  ];

  // ── Edges [fromId, toId, label, color] ────────────────────────────────────
  var EDGES = [
    ['platform',   'guardrails', 'pre-exec check',    C.danger],
    ['platform',   'registry',   'validate tool call', C.warn],
    ['platform',   'sb1',        'dispatch to sandbox', C.muted],
    ['platform',   'github',     'bot push',           C.green],
    ['platform',   'audit',      'log everything',     C.green],
    ['egress',     'pkgs',       'allowlist only',     C.muted],
    ['ide',        'platform',   'HTTPS · chat',       C.accent],
    ['browser',    'platform',   'HTTPS · UI',         C.accent],
    ['sb1',        'egress',     'outbound traffic',   C.danger],
  ];

  // ── Tooltips ──────────────────────────────────────────────────────────────
  var TIPS = {
    platform:     'The Cosmogony platform runs entirely within your infrastructure. It orchestrates agents, dispatches tools, and manages sessions. No code or data leaves your network.',
    sessions:     'Persistent session store owned by the platform. Stores chat history, task state, and audit references. Accessible by all team members with appropriate permissions.',
    guardrails:   'Code-immutable safety rules evaluated before any shell command runs. Blocks pushes to default branch, git history rewrites, credential access, and workspace destruction.',
    registry:     'Deny-by-default tool registry. Agents can only call tools that an org admin has explicitly registered. Unknown or hallucinated tool names are rejected immediately.',
    sb1:          'Ephemeral container per session. Non-root user, no secrets injected, network egress DROP by default. Destroyed completely at session end — worst case is a dead container, not a compromised host.',
    sb2:          'Ephemeral container per session. Non-root user, no secrets injected, network egress DROP by default. Destroyed completely at session end.',
    sb3:          'Ephemeral container per session. Non-root user, no secrets injected, network egress DROP by default. Destroyed completely at session end.',
    egress:       'Network egress enforced at the container level via iptables. All outbound traffic DROPped by default. Only approved package registries and org-configured endpoints are reachable.',
    github:       'Platform bot identity pushes to feature branches only. The platform opens PRs — humans approve and merge. No agent can push directly to your default branch.',
    pkgs:         'Package registries (npm, PyPI, Maven, Go, crates.io) are always-allowed in the sandbox egress ACL — required for dependency installation during builds.',
    integrations: 'Future integrations (issue trackers, databases, monitoring) will connect through the same proxy with the same deny-by-default controls.',
    ide:          'Cosmogony IDE — a thin client. Nothing the agent generates runs on your device. Your machine is a UI, not an execution environment.',
    browser:      'Web dashboard for chat, reviewing PRs, approving gates, and managing team settings.',
    audit:        'Append-only audit log. Every tool call, file write, command executed, and gate result stored with session ID, user, timestamp, exit code, and network bytes.',
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  function nodeRect(id) {
    for (var i = 0; i < NODES.length; i++) {
      if (NODES[i][0] === id) return { x: NODES[i][3], y: NODES[i][4], w: NODES[i][5], h: NODES[i][6] };
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
    if (Math.abs(dx) >= Math.abs(dy)) {
      x1 = dx > 0 ? fr.x + fr.w : fr.x;  y1 = fc.y;
      x2 = dx > 0 ? tr.x : tr.x + tr.w;  y2 = tc.y;
    } else {
      x1 = fc.x;  y1 = dy > 0 ? fr.y + fr.h : fr.y;
      x2 = tc.x;  y2 = dy > 0 ? tr.y : tr.y + tr.h;
    }
    return { x1: x1, y1: y1, x2: x2, y2: y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }

  var COLOR_MARKER = {};
  COLOR_MARKER[C.accent]  = 'mk-acc';
  COLOR_MARKER[C.warn]    = 'mk-wrn';
  COLOR_MARKER[C.danger]  = 'mk-dng';
  COLOR_MARKER[C.green]   = 'mk-grn';
  COLOR_MARKER[C.purple]  = 'mk-pur';
  COLOR_MARKER[C.muted]   = 'mk-mut';
  COLOR_MARKER[C.border]  = 'mk-brd';

  // ── Build ─────────────────────────────────────────────────────────────────
  function build(container) {
    // CSS animation
    var styleTag = document.createElement('style');
    styleTag.textContent = '@keyframes archDash{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}.arch-edge{animation:archDash 1.4s linear infinite}';
    document.head.appendChild(styleTag);

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      width: '100%',
      height: 'auto',
      role: 'img',
      'aria-label': 'Cosmogony security architecture diagram',
    });
    svg.style.display = 'block';
    svg.style.background = C.bg;
    svg.style.borderRadius = '14px';
    svg.style.border = '1px solid ' + C.border;

    // Defs — arrowhead markers
    var defs = el('defs');
    [['mk-acc',C.accent],['mk-wrn',C.warn],['mk-dng',C.danger],['mk-grn',C.green],
     ['mk-pur',C.purple],['mk-mut',C.muted],['mk-brd',C.border]].forEach(function(m){
      var marker = el('marker', {
        id: m[0], markerWidth: '8', markerHeight: '8',
        refX: '7', refY: '3', orient: 'auto', markerUnits: 'userSpaceOnUse',
      });
      marker.appendChild(el('path', { d: 'M0,0 L0,6 L8,3 z', fill: m[1] }));
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // ── Zone backgrounds ──────────────────────────────────────────────────
    var zones = [
      [CORP,       'Your Infrastructure Perimeter',
                   'Your cloud account or on-premises — nothing leaves this boundary',
                   C.accent, '8 4'],
      [PLAT,       'Cosmogony Platform',
                   'Runs entirely within your perimeter',
                   C.accent, ''],
      [TOOL,       'Security Controls',
                   'Evaluated before every action',
                   C.warn, '4 3'],
      [SAND,       'Ephemeral Sandboxes',
                   'One per session · isolated network · destroyed on end',
                   C.muted, '4 3'],
      [EXT,        'External Services',
                   'Reached only via allowlisted egress · bot identity',
                   C.green, '6 3'],
      [DEV,        'Developer Devices',
                   'UI only — no agent execution here',
                   C.accent, '4 3'],
      [AUDIT_ZONE, 'Audit & Compliance',
                   'Append-only · ISO 27001 · SOX ready',
                   C.green, ''],
    ];

    zones.forEach(function (z) {
      var r = z[0];
      svg.appendChild(el('rect', {
        x: r[0], y: r[1], width: r[2], height: r[3],
        rx: '10', fill: C.bg,
        stroke: z[3], 'stroke-width': '1.5',
        'stroke-dasharray': z[4] || '', opacity: '0.9',
      }));
      // Subtle zone fill
      svg.appendChild(el('rect', {
        x: r[0] + 1, y: r[1] + 1, width: r[2] - 2, height: r[3] - 2,
        rx: '9', fill: z[3], opacity: '0.03',
      }));
      // Zone labels
      svg.appendChild(txt(z[1], {
        x: r[0] + 12, y: r[1] + 18,
        fill: z[3], 'font-size': '10.5', 'font-weight': 'bold',
        'font-family': "'Source Code Pro', monospace", opacity: '0.85',
      }));
      svg.appendChild(txt(z[2], {
        x: r[0] + 12, y: r[1] + r[3] - 8,
        fill: C.muted, 'font-size': '9',
        'font-family': "'Source Code Pro', monospace", opacity: '0.55',
      }));
    });

    // ── Edges ──────────────────────────────────────────────────────────────
    EDGES.forEach(function (edge) {
      var pts = edgePts(edge[0], edge[1]);
      if (!pts) return;
      var markerId = COLOR_MARKER[edge[3]] || 'mk-acc';
      svg.appendChild(el('path', {
        d: 'M' + pts.x1 + ',' + pts.y1 + ' Q' + pts.mx + ',' + pts.my + ' ' + pts.x2 + ',' + pts.y2,
        fill: 'none', stroke: edge[3], 'stroke-width': '1.5',
        'stroke-dasharray': '6 3', 'marker-end': 'url(#' + markerId + ')',
        opacity: '0.6', class: 'arch-edge',
      }));
      if (edge[2]) {
        var lw = edge[2].length * 5.6 + 10;
        svg.appendChild(el('rect', {
          x: pts.mx - lw / 2, y: pts.my - 9, width: lw, height: 13,
          rx: '3', fill: C.bg, opacity: '0.9',
        }));
        svg.appendChild(txt(edge[2], {
          x: pts.mx, y: pts.my + 1, fill: edge[3],
          'font-size': '8.5', 'text-anchor': 'middle',
          'font-family': "'Source Code Pro', monospace", opacity: '0.95',
        }));
      }
    });

    // ── Nodes ──────────────────────────────────────────────────────────────
    var tip = document.createElement('div');
    tip.style.cssText = 'display:none;position:fixed;z-index:9999;background:#0e1628;border:1px solid #1f2a44;border-left:3px solid #6ee7ff;border-radius:8px;padding:10px 14px;max-width:280px;pointer-events:none;font-family:"Source Code Pro",monospace;box-shadow:0 8px 32px rgba(0,0,0,0.7)';
    document.body.appendChild(tip);

    NODES.forEach(function (n) {
      var id = n[0], label = n[1], sub = n[2];
      var nx = n[3], ny = n[4], nw = n[5], nh = n[6], color = n[7];

      var g = el('g');
      g.style.cursor = 'pointer';

      // Shadow
      g.appendChild(el('rect', {
        x: nx + 3, y: ny + 4, width: nw, height: nh,
        rx: '7', fill: '#000', opacity: '0.35',
      }));

      // Body
      var body = el('rect', {
        x: nx, y: ny, width: nw, height: nh,
        rx: '7', fill: C.panel, stroke: color, 'stroke-width': '1.5',
      });
      g.appendChild(body);

      // Left accent bar
      g.appendChild(el('rect', {
        x: nx, y: ny + 8, width: '3', height: nh - 16,
        rx: '1.5', fill: color, opacity: '0.9',
      }));

      // Label
      g.appendChild(txt(label, {
        x: nx + 14, y: ny + (sub ? nh / 2 - 3 : nh / 2 + 4),
        fill: C.text, 'font-size': '11', 'font-weight': '700',
        'font-family': "'Source Code Pro', monospace", 'dominant-baseline': 'middle',
      }));

      // Sub-label
      if (sub) {
        g.appendChild(txt(sub, {
          x: nx + 14, y: ny + nh / 2 + 11,
          fill: C.muted, 'font-size': '8.5',
          'font-family': "'Source Code Pro', monospace", 'dominant-baseline': 'middle',
        }));
      }

      // Hover
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
            label + '</div><div style="font-size:11px;color:#94a3b8;line-height:1.6">' + tipText + '</div>';
          tip.style.display = 'block';
          var left = e.clientX + 16;
          if (left + 290 > window.innerWidth) left = e.clientX - 294;
          tip.style.left = left + 'px';
          tip.style.top = (e.clientY - 8) + 'px';
        });
      }

      svg.appendChild(g);
    });

    // ── Legend ──────────────────────────────────────────────────────────────
    var legend = [
      [C.accent, 'Platform'],
      [C.warn,   'Security controls'],
      [C.danger, 'Guardrails / egress'],
      [C.green,  'Audit / VCS'],
      [C.muted,  'Sandboxes / packages'],
    ];
    var lx = 30, ly = H - 10;
    legend.forEach(function (item, i) {
      var ox = lx + i * 200;
      svg.appendChild(el('rect', { x: ox, y: ly - 9, width: 10, height: 10, rx: '2', fill: item[0] }));
      svg.appendChild(txt(item[1], {
        x: ox + 14, y: ly, fill: C.muted, 'font-size': '9.5',
        'font-family': "'Source Code Pro', monospace",
      }));
    });

    container.appendChild(svg);
  }

  // ── Mount ─────────────────────────────────────────────────────────────────
  function mount() {
    var container = document.getElementById('cosmogony-arch-diagram');
    if (!container) {
      console.warn('[arch-diagram] #cosmogony-arch-diagram not found');
      return;
    }
    try {
      build(container);
    } catch (err) {
      console.error('[arch-diagram] render error:', err);
      container.innerHTML = '<p style="color:#94a3b8;padding:24px;font-family:monospace;font-size:13px">Diagram failed to render. Check console.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

}());
