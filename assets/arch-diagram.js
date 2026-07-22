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

  var W = 1100, H = 930;

  // ── SVG namespace helper ──────────────────────────────────────────────────
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
  //  Layout (top-down, left-right):
  //  Left column  : Platform internals + sandboxes
  //  Right column : External services / Dev device / VCS

  var CORP  = [10,  10, 1080, 910];  // outer corporate perimeter
  var PLAT  = [30, 100,  680, 560];  // Cosmogony platform
  var SAND  = [30, 680,  680, 110];  // ephemeral sandboxes
  var EXT   = [740, 100, 340, 430];  // external services
  var DEV   = [740, 550, 340, 200];  // developer device
  var VCS   = [740, 770, 340,  90];  // VCS outside corp (git remote)

  // ── Node definitions ──────────────────────────────────────────────────────
  // [id, label, sublabel, x, y, w, h, color]
  var NODES = [
    ['backend',    'API Server',           'session mgmt · routing',         50,  130, 185, 60, C.accent],
    ['runtime',    'Agent Runtime',        'LLM calls · tool dispatch',      50,  220, 185, 60, C.accent],
    ['guardrails', 'Safety Guardrails',    'code-immutable · pre-exec',      50,  310, 185, 60, C.danger],
    ['proxy',      'MCP Proxy',            'auth · rate-limit · audit',      50,  400, 185, 60, C.warn],
    ['registry',   'Tool Registry',        'deny-by-default · allowlists',  265,  400, 185, 60, C.warn],
    ['identity',   'Identity Store',       'per-user creds · KMS-encrypted', 265,  310, 185, 60, C.purple],
    ['session',    'Session Store',        'state · chat history',           265,  220, 185, 60, C.accent],
    ['audit',      'Audit Log',            'append-only · full attribution', 480,  490, 200, 60, C.green],
    // sandboxes
    ['sb1',        'Sandbox',              'ephemeral · egress: DROP',        50,  695, 175, 75, C.muted],
    ['sb2',        'Sandbox',              'ephemeral · egress: DROP',       240,  695, 175, 75, C.muted],
    ['sb3',        'Sandbox ×N',           'ephemeral · egress: DROP',       430,  695, 175, 75, C.muted],
    // external
    ['jira',       'Jira MCP',             'OAuth2 · per-user token',        755,  118, 305, 56, C.purple],
    ['slack',      'Slack MCP',            'OAuth2 · per-user token',        755,  194, 305, 56, C.purple],
    ['github',     'VCS / GitHub',         'feature branches · PR gate',     755,  270, 305, 56, C.green],
    ['pkgs',       'Package Registries',   'npm · pypi · maven · go',        755,  346, 305, 56, C.muted],
    ['future',     'Future Integrations',  'database · monitoring · …',      755,  422, 305, 56, C.border],
    // dev device
    ['ide',        'Cosmogony IDE',        'UI only — no execution',         755,  568, 305, 56, C.accent],
    ['browser',    'Browser / Dashboard',  'review PRs · approve gates',     755,  644, 305, 56, C.accent],
    // vcs box
    ['vcs',        'Git Remote',           'agents push feature branches',   755,  786, 305, 56, C.green],
  ];

  // ── Edge definitions ──────────────────────────────────────────────────────
  // [fromId, toId, label, color]
  var EDGES = [
    ['backend',    'runtime',    'dispatch',         C.accent],
    ['runtime',    'guardrails', 'pre-exec check',   C.danger],
    ['runtime',    'proxy',      'tool calls',       C.warn],
    ['proxy',      'registry',   'allowlist check',  C.warn],
    ['proxy',      'identity',   'resolve creds',    C.purple],
    ['proxy',      'audit',      'log all calls',    C.green],
    ['backend',    'session',    'session state',    C.accent],
    ['proxy',      'sb1',        'exec',             C.muted],
    ['proxy',      'jira',       'OAuth Bearer',     C.purple],
    ['proxy',      'slack',      'OAuth Bearer',     C.purple],
    ['proxy',      'github',     'feature branch',   C.green],
    ['sb1',        'pkgs',       'ACL-allowed',      C.muted],
    ['ide',        'backend',    'HTTPS / chat',     C.accent],
    ['browser',    'backend',    'HTTPS / UI',       C.accent],
  ];

  // ── Tooltips ──────────────────────────────────────────────────────────────
  var TIPS = {
    backend:    'Routes HTTP, manages sessions, enforces authentication.',
    runtime:    'Runs LLM inference and dispatches tool calls through the proxy.',
    guardrails: 'Code-immutable rules evaluated before any shell command. Blocks pushes to main, history rewrites, and credential access.',
    proxy:      'Central control: validates every tool call against the registry, injects per-user credentials, enforces rate limits, writes the audit log.',
    registry:   'Deny-by-default tool allowlist. Agents can only call tools an org admin has explicitly registered. Unknown tools → 403.',
    identity:   'Per-user credential store. OAuth tokens and API keys encrypted at rest (KMS). Auto-refreshed. Agents never see raw credentials.',
    session:    'Session state and chat history. Destroyed when the session ends.',
    audit:      'Append-only audit log. Every tool call, file write, and gate result stored with full attribution.',
    sb1:        'Ephemeral container per session. Non-root, no secrets injected, egress DROP by default. Destroyed at session end.',
    sb2:        'Ephemeral container per session. Non-root, no secrets injected, egress DROP by default. Destroyed at session end.',
    sb3:        'Ephemeral container per session. Non-root, no secrets injected, egress DROP by default. Destroyed at session end.',
    jira:       'Atlassian Jira adapter. Calls made as the user via per-user OAuth2 — not a shared bot.',
    slack:      'Slack adapter. Per-user OAuth2. Only tools in the org allowlist are callable.',
    github:     'Agents push to feature branches only. Platform opens PRs — humans approve merges.',
    pkgs:       'Package registries always permitted in sandbox egress ACL (required for npm install, pip install, etc.).',
    future:     'Future integrations (databases, monitoring) connect through the same proxy with the same controls.',
    ide:        'Cosmogony IDE — UI only. Nothing agent-generated runs on the developer\'s machine.',
    browser:    'Web dashboard for reviewing PRs, approving gates, and managing integrations.',
    vcs:        'Your git remote. Agents can only push to feature branches via platform-managed commits.',
  };

  // ── Get node center ───────────────────────────────────────────────────────
  function center(id) {
    for (var i = 0; i < NODES.length; i++) {
      if (NODES[i][0] === id) {
        return { x: NODES[i][3] + NODES[i][5] / 2, y: NODES[i][4] + NODES[i][6] / 2 };
      }
    }
    return null;
  }

  function nodeRect(id) {
    for (var i = 0; i < NODES.length; i++) {
      if (NODES[i][0] === id) {
        return { x: NODES[i][3], y: NODES[i][4], w: NODES[i][5], h: NODES[i][6] };
      }
    }
    return null;
  }

  // ── Edge routing: exit/enter at node borders ──────────────────────────────
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
    return { x1: x1, y1: y1, x2: x2, y2: y2,
             mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }

  // ── Color → marker id map ─────────────────────────────────────────────────
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

    // Inject CSS animation via a real HTML <style> tag
    var styleTag = document.createElement('style');
    styleTag.textContent = [
      '@keyframes archDash {',
      '  from { stroke-dashoffset: 24; }',
      '  to   { stroke-dashoffset: 0; }',
      '}',
      '.arch-edge { animation: archDash 1.4s linear infinite; }',
    ].join('\n');
    document.head.appendChild(styleTag);

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      width:   '100%',
      height:  'auto',
      role:    'img',
      'aria-label': 'Cosmogony security architecture diagram',
    });
    svg.style.display       = 'block';
    svg.style.background    = C.bg;
    svg.style.borderRadius  = '14px';
    svg.style.border        = '1px solid ' + C.border;

    // ── defs: arrowhead markers ──
    var defs = el('defs');
    var markerDefs = [
      ['mk-acc', C.accent],
      ['mk-wrn', C.warn],
      ['mk-dng', C.danger],
      ['mk-grn', C.green],
      ['mk-pur', C.purple],
      ['mk-mut', C.muted],
      ['mk-brd', C.border],
    ];
    markerDefs.forEach(function (m) {
      var marker = el('marker', {
        id: m[0],
        markerWidth: '8', markerHeight: '8',
        refX: '7', refY: '3',
        orient: 'auto',
        markerUnits: 'userSpaceOnUse',
      });
      var arrow = el('path', { d: 'M0,0 L0,6 L8,3 z', fill: m[1] });
      marker.appendChild(arrow);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // ── Zone backgrounds ──────────────────────────────────────────────────
    var zones = [
      // [rect, label, sublabel, labelColor, strokeColor, strokeDash]
      [CORP,  'Corporate Network Perimeter',
              'Your cloud account / on-premises infrastructure',
              C.accent, C.accent, '8 4'],
      [PLAT,  'Cosmogony Platform',
              'Deployed in your account',
              C.accent, C.accent, ''],
      [SAND,  'Ephemeral Sandboxes',
              'Isolated network · no secrets · egress DROP · destroyed on session end',
              C.muted, C.muted, '4 3'],
      [EXT,   'External Services',
              'Via MCP Proxy · per-user identity · allowlisted tools only',
              C.purple, C.purple, '6 3'],
      [DEV,   'Developer Device',
              'UI only — nothing agent-generated runs here',
              C.accent, C.accent, '4 3'],
      [VCS,   'Git Remote',
              'Feature branches only · platform opens PR · you approve merge',
              C.green, C.green, ''],
    ];

    zones.forEach(function (z) {
      var r = z[0];
      var bg = el('rect', {
        x: r[0], y: r[1], width: r[2], height: r[3],
        rx: '10',
        fill: C.bg,
        stroke: z[4],
        'stroke-width': '1.5',
        'stroke-dasharray': z[5] || '',
        opacity: '0.9',
      });
      svg.appendChild(bg);

      // Zone fill overlay (very subtle)
      var overlay = el('rect', {
        x: r[0] + 1, y: r[1] + 1, width: r[2] - 2, height: r[3] - 2,
        rx: '9',
        fill: z[4],
        opacity: '0.03',
      });
      svg.appendChild(overlay);

      // Zone label
      svg.appendChild(txt(z[2], {
        x: r[0] + 12, y: r[1] + r[3] - 10,
        fill: C.muted,
        'font-size': '9',
        'font-family': "'Source Code Pro', monospace",
        opacity: '0.6',
      }));
      svg.appendChild(txt(z[1], {
        x: r[0] + 12, y: r[1] + 20,
        fill: z[3],
        'font-size': '10.5',
        'font-weight': 'bold',
        'font-family': "'Source Code Pro', monospace",
        opacity: '0.85',
      }));
    });

    // ── Edges ──────────────────────────────────────────────────────────────
    EDGES.forEach(function (edge) {
      var pts = edgePts(edge[0], edge[1]);
      if (!pts) return;

      var markerId = COLOR_MARKER[edge[3]] || 'mk-acc';
      var ep = el('path', {
        d: 'M' + pts.x1 + ',' + pts.y1 +
           ' Q' + pts.mx + ',' + pts.my +
           ' ' + pts.x2 + ',' + pts.y2,
        fill: 'none',
        stroke: edge[3],
        'stroke-width': '1.5',
        'stroke-dasharray': '6 3',
        'marker-end': 'url(#' + markerId + ')',
        opacity: '0.6',
        class: 'arch-edge',
      });
      svg.appendChild(ep);

      // Edge label background + text
      if (edge[2]) {
        var lw = edge[2].length * 5.6 + 8;
        svg.appendChild(el('rect', {
          x: pts.mx - lw / 2, y: pts.my - 9,
          width: lw, height: 13,
          rx: '3',
          fill: C.bg, opacity: '0.88',
        }));
        svg.appendChild(txt(edge[2], {
          x: pts.mx, y: pts.my + 1,
          fill: edge[3],
          'font-size': '8.5',
          'font-family': "'Source Code Pro', monospace",
          'text-anchor': 'middle',
          opacity: '0.95',
        }));
      }
    });

    // ── Nodes ──────────────────────────────────────────────────────────────
    // Build tooltip element (HTML, fixed position)
    var tip = document.createElement('div');
    tip.style.cssText = [
      'display:none',
      'position:fixed',
      'z-index:9999',
      'background:#0e1628',
      'border:1px solid #1f2a44',
      'border-left:3px solid #6ee7ff',
      'border-radius:8px',
      'padding:10px 14px',
      'max-width:280px',
      'pointer-events:none',
      "font-family:'Source Code Pro',monospace",
      'box-shadow:0 8px 32px rgba(0,0,0,0.7)',
    ].join(';');
    document.body.appendChild(tip);

    NODES.forEach(function (n) {
      var id = n[0], label = n[1], sub = n[2];
      var nx = n[3], ny = n[4], nw = n[5], nh = n[6], color = n[7];

      var g = el('g');
      g.style.cursor = 'pointer';

      // Drop shadow
      g.appendChild(el('rect', {
        x: nx + 3, y: ny + 4,
        width: nw, height: nh,
        rx: '7', fill: '#000', opacity: '0.35',
      }));

      // Body
      var body = el('rect', {
        x: nx, y: ny,
        width: nw, height: nh,
        rx: '7',
        fill: C.panel,
        stroke: color,
        'stroke-width': '1.5',
      });
      g.appendChild(body);

      // Left accent bar
      g.appendChild(el('rect', {
        x: nx, y: ny + 8,
        width: '3', height: nh - 16,
        rx: '1.5',
        fill: color, opacity: '0.9',
      }));

      // Label
      g.appendChild(txt(label, {
        x: nx + 14, y: ny + (sub ? nh / 2 - 3 : nh / 2 + 4),
        fill: C.text,
        'font-size': '11',
        'font-weight': '700',
        'font-family': "'Source Code Pro', monospace",
        'dominant-baseline': 'middle',
      }));

      // Sub-label
      if (sub) {
        g.appendChild(txt(sub, {
          x: nx + 14, y: ny + nh / 2 + 11,
          fill: C.muted,
          'font-size': '8.5',
          'font-family': "'Source Code Pro', monospace",
          'dominant-baseline': 'middle',
        }));
      }

      // Hover interactions
      g.addEventListener('mouseenter', function () {
        body.setAttribute('stroke-width', '2.5');
        body.setAttribute('filter', 'brightness(1.35)');
      });
      g.addEventListener('mouseleave', function () {
        body.setAttribute('stroke-width', '1.5');
        body.removeAttribute('filter');
        tip.style.display = 'none';
      });

      var tipText = TIPS[id];
      if (tipText) {
        g.addEventListener('mousemove', function (e) {
          tip.innerHTML = '<div style="font-size:12px;font-weight:700;color:#e5e7eb;margin-bottom:6px;">' +
            label + '</div>' +
            '<div style="font-size:11px;color:#94a3b8;line-height:1.6;">' + tipText + '</div>';
          tip.style.display = 'block';
          var left = e.clientX + 16;
          if (left + 290 > window.innerWidth) left = e.clientX - 294;
          tip.style.left = left + 'px';
          tip.style.top  = (e.clientY - 8) + 'px';
        });
      }

      svg.appendChild(g);
    });

    // ── Legend ──────────────────────────────────────────────────────────────
    var legend = [
      [C.accent,  'Platform core'],
      [C.warn,    'Proxy / registry'],
      [C.danger,  'Safety guardrails'],
      [C.green,   'Audit / VCS'],
      [C.purple,  'Identity / integrations'],
      [C.muted,   'Sandbox / packages'],
    ];
    var lx = 30, ly = H - 16;
    legend.forEach(function (item, i) {
      var ox = lx + i * 175;
      svg.appendChild(el('rect', {
        x: ox, y: ly - 9, width: 10, height: 10,
        rx: '2', fill: item[0],
      }));
      svg.appendChild(txt(item[1], {
        x: ox + 14, y: ly,
        fill: C.muted,
        'font-size': '9.5',
        'font-family': "'Source Code Pro', monospace",
      }));
    });

    container.appendChild(svg);
  }

  // ── Mount ──────────────────────────────────────────────────────────────────
  function mount() {
    var container = document.getElementById('cosmogony-arch-diagram');
    if (!container) {
      console.warn('[arch-diagram] mount target #cosmogony-arch-diagram not found');
      return;
    }
    try {
      build(container);
    } catch (err) {
      console.error('[arch-diagram] render error:', err);
      container.innerHTML = '<p style="color:#94a3b8;padding:24px;font-family:monospace;font-size:13px;">Diagram failed to render. See console for details.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

}());
