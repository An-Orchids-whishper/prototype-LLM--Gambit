import { useState, useEffect, useRef } from 'react';
import GameMatrix from './GameMatrix';

const EXAMPLE_SCENARIOS = [
  {
    label: "Prisoner's Dilemma",
    icon: "⛓️",
    text: "Two criminals are arrested. If both stay silent, they get -1 year in jail. If both betray, they get -2 years. If one betrays and the other is silent, the betrayer gets 0 years and the silent one gets -3 years."
  },
  {
    label: "Stag Hunt",
    icon: "🦌",
    text: "Two hunters can either hunt a stag or a hare. If both hunt a stag, they both get 3. If both hunt a hare, they both get 1. If one hunts a stag and the other a hare, the stag hunter gets 0 and the hare hunter gets 1."
  }
];

export default function App() {
  const [scenario, setScenario] = useState('');
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (gameData && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [gameData]);

  const handleGenerate = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/extract-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const result = await response.json();
      if (result.success) {
        setGameData(result.data);
      } else {
        setError(result.error || 'Failed to parse the scenario.');
      }
    } catch {
      setError('Cannot connect to backend. Is your server running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
  };

  const charPct = scenario.length / 500;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body { background: #09090f; }

        body {
          font-family: 'Outfit', sans-serif;
          color: #e8e6f0;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        #root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        @keyframes float-a {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-28px); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(22px); }
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 3px rgba(167,139,250,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(167,139,250,0.08); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes result-in {
          from { opacity: 0; transform: translateY(24px) scale(0.988); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes error-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .r1 { opacity:0; animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        .r2 { opacity:0; animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.22s forwards; }
        .r3 { opacity:0; animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.36s forwards; }
        .r4 { opacity:0; animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.5s forwards; }
        .result-anim { animation: result-in 0.6s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Background ── */
        .bg {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0; overflow: hidden;
        }
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(90px);
        }
        .orb-1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(109,40,217,0.16) 0%, transparent 70%);
          top: -250px; left: -200px;
          animation: float-a 14s ease-in-out infinite;
        }
        .orb-2 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%);
          bottom: -150px; right: -150px;
          animation: float-b 17s ease-in-out 2s infinite;
        }
        .orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%);
          top: 45%; left: 55%;
          transform: translate(-50%, -50%);
          animation: float-a 11s ease-in-out 4s infinite;
        }
        .grid-svg {
          position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.18;
        }

        /* ── Page ── */
        .page {
          position: relative; z-index: 1;
          width: 100%; max-width: 780px;
          padding: 64px 24px 100px;
          display: flex; flex-direction: column; align-items: center;
          transition: opacity 0.4s;
        }

        /* ── Badge ── */
        .badge {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 7px 18px;
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 100px;
          background: rgba(139,92,246,0.07);
          margin-bottom: 28px;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #a78bfa; flex-shrink: 0;
          animation: pulse-ring 2.5s ease-in-out infinite;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.2);
        }
        .badge-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px; font-weight: 500;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: #a78bfa;
        }

        /* ── Hero ── */
        .hero {
          text-align: center; width: 100%;
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 52px;
        }
        .hero-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(54px, 9.5vw, 88px);
          font-weight: 400; line-height: 0.93;
          letter-spacing: -0.025em; color: #f0eeff;
          margin-bottom: 22px;
        }
        .hero-accent {
          font-style: italic;
          background: linear-gradient(130deg, #c4b5fd 0%, #818cf8 45%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 16px; font-weight: 300;
          color: #4b5563; line-height: 1.75;
          max-width: 380px;
        }

        /* ── Card ── */
        .card {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.075);
          border-radius: 24px;
          padding: 32px 36px;
          box-shadow:
            0 0 0 1px rgba(139,92,246,0.05) inset,
            0 40px 80px rgba(0,0,0,0.45);
        }

        .card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap; gap: 14px;
          margin-bottom: 18px;
        }
        .tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #7c3aed;
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.18);
          border-radius: 6px; padding: 3px 9px;
          display: inline-block; margin-bottom: 7px;
        }
        .card-hint { font-size: 13px; color: #374151; font-weight: 300; }

        /* example buttons */
        .ex-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .ex-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          color: #6b7280; font-size: 13px; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .ex-btn:hover {
          background: rgba(139,92,246,0.09);
          border-color: rgba(139,92,246,0.3);
          color: #c4b5fd;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(139,92,246,0.14);
        }

        /* textarea */
        .ta-wrap {
          border-radius: 16px;
          transition: box-shadow 0.3s;
        }
        .ta-wrap.focused {
          box-shadow: 0 0 0 2px rgba(139,92,246,0.35), 0 0 28px rgba(139,92,246,0.1);
        }
        textarea {
          width: 100%; padding: 18px 20px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; resize: none; outline: none;
          font-size: 15px; line-height: 1.8; font-weight: 300;
          color: #e2e0f0;
          font-family: 'Outfit', sans-serif;
          caret-color: #a78bfa;
          transition: border-color 0.2s, background 0.2s;
        }
        textarea:focus {
          border-color: rgba(139,92,246,0.4);
          background: rgba(139,92,246,0.03);
        }
        textarea::placeholder { color: #2d3039; }

        /* toolbar */
        .toolbar {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-top: 14px; flex-wrap: wrap; gap: 10px;
        }
        .toolbar-left { display: flex; align-items: center; gap: 14px; }
        .char {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #1f2937; transition: color 0.25s;
        }
        .char.warn  { color: #d97706; }
        .char.over  { color: #ef4444; }
        .hint {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #1f2937;
          display: flex; align-items: center; gap: 4px;
        }
        .kbd {
          padding: 1px 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 4px; font-size: 10px;
          color: #4b5563;
        }

        /* generate button */
        .gen-btn {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center; gap: 9px;
          padding: 12px 28px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9 55%, #4f46e5);
          color: #fff; font-weight: 600; font-size: 14px;
          border: none; border-radius: 13px; cursor: pointer;
          letter-spacing: 0.02em; font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 22px rgba(109,40,217,0.4), 0 1px 0 rgba(255,255,255,0.08) inset;
          transition: all 0.22s cubic-bezier(0.22,1,0.36,1);
        }
        .gen-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(109,40,217,0.52), 0 1px 0 rgba(255,255,255,0.12) inset;
        }
        .gen-btn:active:not(:disabled) { transform: translateY(0); }
        .gen-btn:disabled {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          color: #2d3039; cursor: not-allowed; box-shadow: none;
        }
        .gen-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%);
          background-size: 300%; opacity: 0;
        }
        .gen-btn:hover:not(:disabled)::after {
          opacity: 1; animation: shimmer 0.65s linear;
        }
        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }

        /* error */
        .err-box {
          display: flex; gap: 12px; align-items: flex-start;
          margin-top: 16px; padding: 14px 18px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 13px;
          animation: error-in 0.3s ease both;
        }
        .err-icon { color: #f87171; flex-shrink: 0; margin-top: 1px; }
        .err-title { font-size: 13px; font-weight: 600; color: #fca5a5; margin-bottom: 2px; }
        .err-msg   { font-size: 13px; color: #4b5563; font-weight: 300; }

        /* steps */
        .steps {
          display: flex; align-items: center; justify-content: center;
          width: 100%; margin-top: 36px;
        }
        .step { text-align: center; padding: 0 22px; }
        .step-n {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #6d28d9;
          letter-spacing: 0.1em; margin-bottom: 6px;
        }
        .step-l { font-size: 13px; font-weight: 600; color: #9ca3af; margin-bottom: 3px; }
        .step-s { font-size: 11px; color: #374151; font-weight: 300; line-height: 1.45; max-width: 88px; margin: 0 auto; }
        .step-line {
          width: 36px; height: 1px; flex-shrink: 0;
          background: linear-gradient(90deg, rgba(109,40,217,0.3), rgba(79,70,229,0.25));
        }

        /* results */
        .result-card {
          width: 100%; margin-top: 24px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px; padding: 32px 36px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.4);
        }
        .r-header {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 22px;
        }
        .r-left  { display: flex; align-items: center; gap: 14px; }
        .r-icon  {
          width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 18px rgba(109,40,217,0.4);
        }
        .r-title {
          font-family: 'Instrument Serif', serif;
          font-size: 21px; color: #f0eeff;
        }
        .r-sub { font-size: 12px; color: #374151; font-weight: 300; margin-top: 2px; }
        .clear-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 13px; border: none; border-radius: 9px;
          background: transparent; cursor: pointer;
          color: #374151; font-size: 13px; font-weight: 500;
          font-family: 'Outfit', sans-serif; transition: all 0.2s;
        }
        .clear-btn:hover { background: rgba(239,68,68,0.09); color: #f87171; }
        .divider {
          height: 1px; width: 100%; margin-bottom: 26px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.18), transparent);
        }
        .matrix-shell {
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 18px; padding: 8px; overflow: hidden;
        }
      `}</style>

      {/* ── Background ── */}
      <div className="bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <svg className="grid-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(139,92,246,0.35)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>

      {/* ── Page ── */}
      <div className="page" style={{ opacity: mounted ? 1 : 0 }}>

        {/* Hero */}
        <div className="hero">
          <div className="r1">
            <div className="badge">
              <span className="badge-dot" />
              <span className="badge-label">AI-Powered Game Theory</span>
            </div>
          </div>
          <div className="r2">
            <h1 className="hero-title">
              Game<span className="hero-accent">Prompt</span>
            </h1>
            <p className="hero-sub">
              Translate everyday scenarios into formal payoff matrices, instantly.
            </p>
          </div>
        </div>

        {/* Input Card */}
        <div className="card r3">
          <div className="card-top">
            <div>
              <span className="tag">Scenario</span>
              <p className="card-hint">Describe a strategic interaction with players and payoffs</p>
            </div>
            <div className="ex-row">
              {EXAMPLE_SCENARIOS.map((ex, i) => (
                <button
                  key={i}
                  className="ex-btn"
                  onClick={() => { setScenario(ex.text); textareaRef.current?.focus(); }}
                >
                  <span>{ex.icon}</span>{ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`ta-wrap ${focused ? 'focused' : ''}`}>
            <textarea
              ref={textareaRef}
              rows={6}
              placeholder="E.g., Two rival companies are deciding whether to lower their prices. If both lower prices, they each earn $2M. If neither does, they each earn $5M. If only one lowers..."
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              maxLength={500}
            />
          </div>

          <div className="toolbar">
            <div className="toolbar-left">
              <span className={`char ${charPct > 0.9 ? 'over' : charPct > 0.7 ? 'warn' : ''}`}>
                {scenario.length}/500
              </span>
              <span className="hint">
                <span className="kbd">⌘</span><span className="kbd">↵</span> to run
              </span>
            </div>
            <button
              className="gen-btn"
              onClick={handleGenerate}
              disabled={loading || !scenario.trim()}
            >
              {loading
                ? <><div className="spinner" /> Analyzing...</>
                : <>Generate Matrix
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
              }
            </button>
          </div>

          {error && (
            <div className="err-box">
              <svg className="err-icon" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <div className="err-title">Something went wrong</div>
                <div className="err-msg">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Steps strip */}
        {!gameData && (
          <div className="steps r4">
            {[
              { n: '01', l: 'Describe',  s: 'Write your strategic scenario' },
              { n: '02', l: 'Analyze',   s: 'AI extracts players & payoffs' },
              { n: '03', l: 'Visualize', s: 'See the formal payoff matrix'  },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div className="step">
                  <div className="step-n">{step.n}</div>
                  <div className="step-l">{step.l}</div>
                  <div className="step-s">{step.s}</div>
                </div>
                {i < 2 && <div className="step-line" />}
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {gameData && (
          <div ref={resultsRef} className="result-card result-anim">
            <div className="r-header">
              <div className="r-left">
                <div className="r-icon">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <div>
                  <div className="r-title">Payoff Matrix</div>
                  <div className="r-sub">Game-theoretic representation</div>
                </div>
              </div>
              <button className="clear-btn" onClick={() => setGameData(null)}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
            <div className="divider" />
            <div className="matrix-shell">
              <GameMatrix gameData={gameData} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}