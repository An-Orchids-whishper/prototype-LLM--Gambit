import React, { useState, useCallback } from 'react';

// ─────────────────────────────────────────────
//  GAME TREE SVG RENDERER
// ─────────────────────────────────────────────
const NODE_R = 22;
const PLAYER_COLORS = ['#f87171', '#818cf8', '#34d399', '#fbbf24', '#a78bfa', '#38bdf8'];

function GameTreeSVG({ tree, selectedNode, onNodeClick }) {
  const { nodes = [], edges = [], players = [] } = tree;
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const getPath = (targetId) => {
    const parent = {};
    const queue = ['n0'];
    while (queue.length) {
      const cur = queue.shift();
      for (const e of edges) {
        if (e.from === cur && !parent[e.to]) {
          parent[e.to] = cur;
          queue.push(e.to);
        }
      }
    }
    const path = new Set();
    let cur = targetId;
    while (cur) { path.add(cur); cur = parent[cur]; }
    return path;
  };

  const activePath = selectedNode ? getPath(selectedNode) : new Set();

  return (
    <svg viewBox="0 0 980 520" style={{ width: '100%', height: '100%', fontFamily: "'JetBrains Mono', monospace" }}>
      <defs>
        <marker id="gt-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#374151" />
        </marker>
        <marker id="gt-arr-act" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#818cf8" />
        </marker>
        <filter id="gt-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="gt-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(79,70,229,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <rect width="980" height="520" fill="url(#gt-bg)" rx="12" />

      {/* Edges */}
      {edges.map((e, i) => {
        const from = nodeMap[e.from], to = nodeMap[e.to];
        if (!from || !to) return null;
        const dx = to.x - from.x, dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist, ny = dy / dist;
        const x1 = from.x + nx * NODE_R, y1 = from.y + ny * NODE_R;
        const x2 = to.x - nx * (NODE_R + 6), y2 = to.y - ny * (NODE_R + 6);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const isAct = activePath.has(e.from) && activePath.has(e.to);
        const dim = selectedNode && !isAct;
        return (
          <g key={i} opacity={dim ? 0.18 : 1}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isAct ? '#818cf8' : '#374151'}
              strokeWidth={isAct ? 2.5 : 1.5}
              markerEnd={isAct ? 'url(#gt-arr-act)' : 'url(#gt-arr)'}
              filter={isAct ? 'url(#gt-glow)' : 'none'}
            />
            <text x={mx} y={my - 8} textAnchor="middle"
              fill={isAct ? '#c7d2fe' : '#4b5563'} fontSize="10">
              {e.action}
            </text>
            {e.probability != null &&
              <text x={mx} y={my + 13} textAnchor="middle" fill="#fbbf24" fontSize="9">
                p={e.probability}
              </text>
            }
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const isSel = n.id === selectedNode;
        const isPath = activePath.has(n.id);
        const dim = selectedNode && !isPath;
        const pIdx = players.indexOf(n.player);
        const pColor = pIdx >= 0 ? PLAYER_COLORS[pIdx % PLAYER_COLORS.length] : '#6b7280';
        const termColor = '#34d399';
        const chanceColor = '#fbbf24';

        return (
          <g key={n.id} onClick={() => onNodeClick(n.id)}
            style={{ cursor: 'pointer' }} opacity={dim ? 0.2 : 1}>
            {isSel && (
              <circle cx={n.x} cy={n.y} r={NODE_R + 10}
                fill="none" stroke={n.type === 'terminal' ? termColor : n.type === 'chance' ? chanceColor : pColor}
                strokeWidth="1" opacity="0.35" filter="url(#gt-glow)" />
            )}
            {n.type === 'terminal' ? (
              <rect x={n.x - NODE_R} y={n.y - NODE_R}
                width={NODE_R * 2} height={NODE_R * 2} rx="5"
                fill="rgba(52,211,153,0.08)"
                stroke={isSel ? '#6ee7b7' : termColor}
                strokeWidth={isSel ? 2.5 : 1.5}
                filter={isSel ? 'url(#gt-glow)' : 'none'}
              />
            ) : n.type === 'chance' ? (
              <polygon
                points={`${n.x},${n.y - NODE_R} ${n.x + NODE_R},${n.y} ${n.x},${n.y + NODE_R} ${n.x - NODE_R},${n.y}`}
                fill="rgba(251,191,36,0.07)"
                stroke={isSel ? '#fde68a' : chanceColor}
                strokeWidth={isSel ? 2.5 : 1.5}
                filter={isSel ? 'url(#gt-glow)' : 'none'}
              />
            ) : (
              <circle cx={n.x} cy={n.y} r={NODE_R}
                fill={`${pColor}10`}
                stroke={isSel ? '#e0e7ff' : pColor}
                strokeWidth={isSel ? 2.5 : 1.5}
                filter={isSel ? 'url(#gt-glow)' : 'none'}
              />
            )}
            <text x={n.x} y={n.y + 4} textAnchor="middle"
              fill={isSel ? '#fff' : n.type === 'terminal' ? termColor : n.type === 'chance' ? chanceColor : pColor}
              fontSize="10" fontWeight="600">
              {n.id}
            </text>
            <text x={n.x} y={n.y + NODE_R + 14} textAnchor="middle"
              fill="#6b7280" fontSize="9">
              {n.label?.length > 13 ? n.label.slice(0, 12) + '…' : n.label}
            </text>
            {n.type === 'terminal' && n.payoffs && (
              <text x={n.x} y={n.y + NODE_R + 26} textAnchor="middle"
                fill="#34d399" fontSize="9" fontWeight="600">
                ({n.payoffs.join(', ')})
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
//  PAYOFF MATRIX TABLE (original, preserved)
// ─────────────────────────────────────────────
function MatrixTable({ gameData }) {
  const [p1, p2] = gameData.players;
  const p1S = gameData.strategies[p1];
  const p2S = gameData.strategies[p2];

  return (
    <>
      <div className="gm-legend">
        <div className="gm-legend-item">
          <div className="gm-dot" style={{ background: 'rgba(239,68,68,0.55)', border: '1px solid rgba(239,68,68,0.3)' }} />
          <span className="gm-player-name" style={{ color: '#fca5a5' }}>{p1}</span>
          <span>— row player</span>
        </div>
        <span className="gm-sep">·</span>
        <div className="gm-legend-item">
          <div className="gm-dot" style={{ background: 'rgba(99,102,241,0.55)', border: '1px solid rgba(99,102,241,0.3)' }} />
          <span className="gm-player-name" style={{ color: '#a5b4fc' }}>{p2}</span>
          <span>— column player</span>
        </div>
      </div>
      <div className="gm-scroll">
        <div className="gm-shell">
          <table className="gm-table">
            <thead>
              <tr>
                <td style={{ background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
                <th colSpan={p2S.length} className="gm-p2-banner">{p2}</th>
              </tr>
              <tr>
                <th className="gm-corner"><span className="gm-corner-pill">{p1}</span></th>
                {p2S.map((s, i) => <th key={i} className="gm-col-h">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {p1S.map((s1, i) => (
                <tr key={i}>
                  <th className="gm-row-h"><span className="gm-row-pill">{s1}</span></th>
                  {p2S.map((s2, j) => {
                    const payoff = gameData.payoffs[i][j];
                    const isTop = i === 0, isBot = i === p1S.length - 1;
                    const isLeft = j === 0, isRight = j === p2S.length - 1;
                    const cls = [
                      isTop && isLeft ? 'c-tl' : '', isTop && isRight ? 'c-tr' : '',
                      isBot && isLeft ? 'c-bl' : '', isBot && isRight ? 'c-br' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <td key={j} className={`gm-cell ${cls}`}>
                        <div className="gm-pair">
                          <span className="gm-chip gm-chip-p1">{payoff[0]}</span>
                          <span className="gm-comma">,</span>
                          <span className="gm-chip gm-chip-p2">{payoff[1]}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="gm-footer">
        Each cell → (<span style={{ color: '#fca5a5' }}>{p1}</span>, <span style={{ color: '#a5b4fc' }}>{p2}</span>) payoffs
      </p>
    </>
  );
}

// ─────────────────────────────────────────────
//  GAME TREE TAB
// ─────────────────────────────────────────────
function GameTreeTab({ gameData }) {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelectedNode(null);
    try {
      const port = import.meta?.env?.VITE_API_PORT || 5000;
      const base = import.meta?.env?.VITE_API_URL || `http://localhost:${port}`;
      const res = await fetch(`${base}/api/game-tree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameData }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to generate tree');
      setTreeData(json.data);
      setGenerated(true);
    } catch (e) {
      setError('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [gameData]);

  const handleNodeClick = (id) => setSelectedNode(id === selectedNode ? null : id);
  const selNode = treeData?.nodes?.find(n => n.id === selectedNode);

  if (!generated) {
    return (
      <div className="gt-generate-screen">
        <div className="gt-gen-icon">⬡</div>
        <div className="gt-gen-title">Extensive Form Tree</div>
        <div className="gt-gen-sub">
          Visualize this game as a sequential decision tree — nodes, branches, and payoff leaves generated by Gemini.
        </div>
        <button className="gt-gen-btn" onClick={generate} disabled={loading}>
          {loading
            ? <><span className="gt-spinner" /> Generating…</>
            : '⟶  Generate Game Tree'}
        </button>
        {error && <div className="gt-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="gt-layout">
      {/* SVG canvas */}
      <div className="gt-canvas">
        {treeData && (
          <>
            <div className="gt-canvas-bar">
              <div>
                <div className="gt-canvas-title">{treeData.game_name}</div>
                <div className="gt-canvas-sub">{treeData.nodes?.length} nodes · {treeData.edges?.length} edges</div>
              </div>
              <div className="gt-legend-row">
                {[
                  { shape: 'circle', color: '#818cf8', label: 'Decision' },
                  { shape: 'diamond', color: '#fbbf24', label: 'Chance' },
                  { shape: 'square', color: '#34d399', label: 'Terminal' },
                ].map(({ shape, color, label }) => (
                  <div key={label} className="gt-leg-item">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      {shape === 'circle' && <circle cx="6" cy="6" r="4.5" fill="none" stroke={color} strokeWidth="1.5" />}
                      {shape === 'diamond' && <polygon points="6,1 11,6 6,11 1,6" fill="none" stroke={color} strokeWidth="1.5" />}
                      {shape === 'square' && <rect x="1" y="1" width="10" height="10" rx="2" fill="none" stroke={color} strokeWidth="1.5" />}
                    </svg>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <button className="gt-regen-btn"
                onClick={() => { setGenerated(false); setTreeData(null); setSelectedNode(null); }}>
                ↺ Regenerate
              </button>
            </div>

            <div className="gt-svg-wrap">
              <GameTreeSVG tree={treeData} selectedNode={selectedNode} onNodeClick={handleNodeClick} />
            </div>
            <div className="gt-click-hint">Click any node to highlight its path from root</div>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="gt-sidebar">
        <div className="gt-node-detail">
          <div className="gt-sidebar-label">{selNode ? 'NODE DETAIL' : 'SELECT A NODE'}</div>
          {selNode ? (
            <div className="gt-node-info">
              {[
                ['ID', selNode.id],
                ['Label', selNode.label],
                ['Type', selNode.type?.toUpperCase()],
                ['Player', selNode.player || '—'],
                ['Payoffs', selNode.payoffs ? `(${selNode.payoffs.join(', ')})` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="gt-info-row">
                  <span className="gt-info-key">{k}</span>
                  <span className="gt-info-val">{v}</span>
                </div>
              ))}
              {(() => {
                const out = treeData.edges.filter(e => e.from === selNode.id);
                if (!out.length) return null;
                return (
                  <div className="gt-info-row" style={{ alignItems: 'flex-start', marginTop: 4 }}>
                    <span className="gt-info-key">Actions</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                      {out.map(e => (
                        <span key={e.to} className="gt-action-badge">{e.action} → {e.to}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="gt-no-sel">{treeData?.description}</div>
          )}
        </div>

        <div className="gt-table-section">
          <div className="gt-sidebar-label">NODES</div>
          <div className="gt-table-scroll">
            <table className="gt-table">
              <thead>
                <tr>{['ID', 'Type', 'Player', 'Payoffs'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {treeData?.nodes.map(n => {
                  const tc = { decision: '#818cf8', chance: '#fbbf24', terminal: '#34d399' };
                  const isSel = n.id === selectedNode;
                  return (
                    <tr key={n.id} onClick={() => handleNodeClick(n.id)}
                      className={isSel ? 'gt-row-sel' : ''}>
                      <td style={{ color: isSel ? '#c7d2fe' : '#e5e7eb', fontWeight: isSel ? 700 : 400 }}>{n.id}</td>
                      <td style={{ color: tc[n.type] || '#9ca3af' }}>{n.type}</td>
                      <td style={{ color: '#9ca3af' }}>{n.player || '—'}</td>
                      <td style={{ color: '#34d399', fontSize: 9 }}>{n.payoffs ? `(${n.payoffs.join(',')})` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="gt-table-section">
          <div className="gt-sidebar-label">EDGES</div>
          <div className="gt-table-scroll">
            <table className="gt-table">
              <thead>
                <tr>{['From', 'To', 'Action', 'Prob'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {treeData?.edges.map((e, i) => (
                  <tr key={i}>
                    <td style={{ color: '#818cf8' }}>{e.from}</td>
                    <td style={{ color: '#818cf8' }}>{e.to}</td>
                    <td style={{ color: '#d1d5db' }}>{e.action}</td>
                    <td style={{ color: '#fbbf24' }}>{e.probability ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────
export default function GameMatrix({ gameData }) {
  const [activeTab, setActiveTab] = useState('matrix');

  if (!gameData || !gameData.players) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        /* ── TABS ── */
        .gm { width:100%; display:flex; flex-direction:column; align-items:center; padding:12px 8px 18px; font-family:'Outfit',sans-serif; }
        .gm-tabs { display:flex; gap:0; margin-bottom:20px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:4px; }
        .gm-tab { padding:8px 22px; border-radius:9px; font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none; background:transparent; color:#4b5563; transition:all 0.2s; white-space:nowrap; }
        .gm-tab.active { background:rgba(79,70,229,0.25); color:#c7d2fe; border:1px solid rgba(99,102,241,0.3); }
        .gm-tab:hover:not(.active) { color:#9ca3af; background:rgba(255,255,255,0.04); }

        /* ── MATRIX (original) ── */
        .gm-legend { display:flex; align-items:center; gap:6px; margin-bottom:20px; flex-wrap:wrap; justify-content:center; }
        .gm-legend-item { display:flex; align-items:center; gap:7px; font-family:'JetBrains Mono',monospace; font-size:11px; color:#4b5563; }
        .gm-dot { width:9px; height:9px; border-radius:3px; flex-shrink:0; }
        .gm-player-name { font-weight:500; }
        .gm-sep { color:#1f2937; font-size:13px; padding:0 4px; }
        .gm-scroll { width:100%; overflow-x:auto; display:flex; justify-content:center; }
        .gm-shell { border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.07); box-shadow:0 8px 32px rgba(0,0,0,0.35); }
        table.gm-table { border-collapse:separate; border-spacing:0; min-width:300px; }
        .gm-p2-banner { text-align:center; padding:11px 24px; background:linear-gradient(135deg,rgba(79,70,229,0.18),rgba(109,40,217,0.14)); border-bottom:1px solid rgba(139,92,246,0.15); font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#818cf8; }
        .gm-corner { padding:12px 18px; background:rgba(0,0,0,0.15); border-right:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05); vertical-align:bottom; text-align:right; min-width:140px; }
        .gm-corner-pill { display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#f87171; padding:4px 10px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:7px; }
        .gm-col-h { padding:10px 28px; background:rgba(79,70,229,0.09); border-left:1px solid rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.05); text-align:center; font-family:'JetBrains Mono',monospace; font-size:11.5px; font-weight:500; letter-spacing:0.04em; color:#818cf8; white-space:nowrap; }
        .gm-row-h { padding:0 18px; text-align:right; background:rgba(239,68,68,0.04); border-right:1px solid rgba(255,255,255,0.04); }
        .gm-row-pill { display:inline-flex; align-items:center; justify-content:flex-end; font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:500; letter-spacing:0.03em; color:#fca5a5; padding:5px 11px; background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.15); border-radius:9px; white-space:nowrap; }
        .gm-cell { border:1px solid rgba(255,255,255,0.045); padding:18px 26px; text-align:center; background:rgba(255,255,255,0.018); cursor:default; transition:background 0.18s,box-shadow 0.18s; position:relative; min-width:120px; }
        .gm-cell:hover { background:rgba(139,92,246,0.09); box-shadow:inset 0 0 0 1.5px rgba(139,92,246,0.3); z-index:2; }
        .gm-pair { display:flex; align-items:center; justify-content:center; gap:5px; }
        .gm-chip { display:inline-flex; align-items:center; justify-content:center; min-width:38px; padding:4px 11px; border-radius:8px; font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:400; line-height:1; transition:transform 0.15s; }
        .gm-cell:hover .gm-chip { transform:scale(1.08); }
        .gm-chip-p1 { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#fca5a5; }
        .gm-chip-p2 { background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.22); color:#a5b4fc; }
        .gm-comma { color:#1f2937; font-family:'JetBrains Mono',monospace; font-size:13px; }
        .gm-footer { margin-top:14px; font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#1f2937; text-align:center; letter-spacing:0.03em; }

        /* ── GAME TREE ── */
        .gt-generate-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:48px 24px; text-align:center; width:100%; }
        .gt-gen-icon { font-size:52px; opacity:0.25; line-height:1; }
        .gt-gen-title { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:600; color:#6366f1; letter-spacing:0.12em; text-transform:uppercase; }
        .gt-gen-sub { font-size:12px; color:#4b5563; max-width:380px; line-height:1.6; }
        .gt-gen-btn { display:flex; align-items:center; gap:8px; padding:11px 28px; border-radius:10px; background:linear-gradient(135deg,rgba(79,70,229,0.5),rgba(109,40,217,0.4)); border:1px solid rgba(139,92,246,0.4); color:#c7d2fe; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:500; letter-spacing:0.08em; cursor:pointer; transition:all 0.2s; }
        .gt-gen-btn:hover:not(:disabled) { background:linear-gradient(135deg,rgba(99,102,241,0.6),rgba(139,92,246,0.5)); }
        .gt-gen-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .gt-spinner { width:14px; height:14px; border:2px solid rgba(199,210,254,0.3); border-top-color:#c7d2fe; border-radius:50%; animation:gt-spin 0.7s linear infinite; display:inline-block; }
        @keyframes gt-spin { to { transform:rotate(360deg); } }
        .gt-error { color:#fca5a5; font-family:'JetBrains Mono',monospace; font-size:11px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:8px 14px; max-width:400px; }
        .gt-layout { display:flex; width:100%; gap:0; min-height:560px; border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.35); }
        .gt-canvas { flex:1; display:flex; flex-direction:column; background:rgba(255,255,255,0.015); border-right:1px solid rgba(255,255,255,0.06); overflow:hidden; }
        .gt-canvas-bar { display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(0,0,0,0.2); border-bottom:1px solid rgba(255,255,255,0.06); flex-wrap:wrap; }
        .gt-canvas-title { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; color:#818cf8; }
        .gt-canvas-sub { font-family:'JetBrains Mono',monospace; font-size:9px; color:#4b5563; margin-top:2px; }
        .gt-legend-row { display:flex; gap:10px; flex-wrap:wrap; margin-left:auto; }
        .gt-leg-item { display:flex; align-items:center; gap:5px; font-family:'JetBrains Mono',monospace; font-size:9px; color:#6b7280; letter-spacing:0.08em; }
        .gt-regen-btn { font-family:'JetBrains Mono',monospace; font-size:10px; padding:5px 12px; border-radius:7px; border:1px solid rgba(255,255,255,0.08); background:transparent; color:#6b7280; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .gt-regen-btn:hover { color:#c7d2fe; border-color:rgba(99,102,241,0.4); }
        .gt-svg-wrap { flex:1; padding:8px; min-height:400px; }
        .gt-click-hint { font-family:'JetBrains Mono',monospace; font-size:9px; color:#374151; text-align:center; padding:6px; }
        .gt-sidebar { width:280px; flex-shrink:0; display:flex; flex-direction:column; background:rgba(0,0,0,0.15); overflow-y:auto; }
        .gt-sidebar-label { font-family:'JetBrains Mono',monospace; font-size:9px; color:#374151; letter-spacing:0.2em; padding:10px 14px 6px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .gt-node-detail { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.05); min-height:110px; }
        .gt-node-info { display:flex; flex-direction:column; gap:5px; }
        .gt-info-row { display:flex; gap:8px; align-items:center; }
        .gt-info-key { font-family:'JetBrains Mono',monospace; font-size:9px; color:#374151; width:48px; flex-shrink:0; letter-spacing:0.05em; }
        .gt-info-val { font-family:'JetBrains Mono',monospace; font-size:11px; color:#d1d5db; }
        .gt-action-badge { font-family:'JetBrains Mono',monospace; font-size:9px; padding:2px 8px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:20px; color:#818cf8; }
        .gt-no-sel { font-size:11px; color:#374151; line-height:1.6; margin-top:6px; }
        .gt-table-section { border-top:1px solid rgba(255,255,255,0.05); }
        .gt-table-scroll { overflow-x:auto; max-height:200px; overflow-y:auto; }
        .gt-table { width:100%; border-collapse:collapse; font-family:'JetBrains Mono',monospace; }
        .gt-table thead th { padding:6px 10px; font-size:9px; color:#374151; font-weight:600; letter-spacing:0.1em; background:rgba(0,0,0,0.15); border-bottom:1px solid rgba(255,255,255,0.05); text-align:left; }
        .gt-table tbody tr { border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer; transition:background 0.12s; }
        .gt-table tbody tr:hover { background:rgba(255,255,255,0.03); }
        .gt-table tbody td { padding:6px 10px; font-size:10px; color:#6b7280; }
        .gt-row-sel { background:rgba(99,102,241,0.07) !important; }
      `}</style>

      <div className="gm">
        <div className="gm-tabs">
          <button className={`gm-tab ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}>
            ▦ Payoff Matrix
          </button>
          <button className={`gm-tab ${activeTab === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveTab('tree')}>
            ⬡ Game Tree
          </button>
        </div>

        {activeTab === 'matrix' && <MatrixTable gameData={gameData} />}
        {activeTab === 'tree' && <GameTreeTab gameData={gameData} />}
      </div>
    </>
  );
}