import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    MXTextEffects?: {
      mountVapour: (el: HTMLElement, opts: Record<string, unknown>) => void
      mountParticle: (el: HTMLElement, opts: Record<string, unknown>) => void
    }
  }
}

const LANDING_CSS = `
:root{
  --bg:#070A08; --bg-1:#0B100C; --bg-2:#0F1612;
  --line:#172019; --line-2:#243227;
  --ink:#E8F0EA; --ink-2:#9BA89F; --ink-3:#5C6A60; --ink-4:#37423B;
  --mx:#1FCB6E; --mx-2:#0FB060; --mx-deep:#0A2A1A; --mx-glow:#22ff88;
  --warn:#FFB547; --crit:#FF6B5B;
  --serif:'Space Grotesk', system-ui, sans-serif;
  --instrument:'Instrument Serif', Georgia, serif;
  --sans:'Inter', system-ui, sans-serif;
  --mono:'JetBrains Mono', ui-monospace, monospace;
  --maxw:1320px;
}
body.mxp-active{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;font-feature-settings:"ss01","cv11";overflow-x:hidden}
body.mxp-active *{box-sizing:border-box}
body.mxp-active{scroll-behavior:smooth}
.mxp-root a{color:inherit;text-decoration:none}
.mxp-root img{max-width:100%;display:block}
.mxp-root ::selection{background:var(--mx);color:#031}
.mxp-root button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}

.mxp-root .wrap{max-width:var(--maxw);margin:0 auto;padding:0 32px;position:relative}
.mxp-root .mono{font-family:var(--mono);letter-spacing:.02em}
.mxp-root .mono-up{font-family:var(--mono);text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:var(--ink-3)}
.mxp-root .mono-up b{font-weight:500;color:var(--mx)}
.mxp-root .display{font-family:var(--serif);letter-spacing:-0.025em;line-height:0.95;font-weight:600}
.mxp-root .it{font-family:var(--instrument);font-style:italic;font-weight:400;letter-spacing:-0.005em}

body.mxp-active::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:1;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity:.6;mix-blend-mode:overlay;
}

.mxp-cursor{position:fixed;top:0;left:0;width:8px;height:8px;border-radius:99px;background:var(--mx);pointer-events:none;z-index:1000;transform:translate(-50%,-50%);transition:width .25s, height .25s, background .25s;mix-blend-mode:difference;display:none}
.mxp-cursor.on{display:block}
.mxp-cursor.lg{width:54px;height:54px;background:var(--mx);mix-blend-mode:normal;opacity:.18}

.mxp-root [data-reveal]{opacity:0;transform:translateY(30px);transition:opacity .9s cubic-bezier(.22,.61,.36,1),transform .9s cubic-bezier(.22,.61,.36,1)}
.mxp-root [data-reveal].in{opacity:1;transform:none}
.mxp-root [data-reveal-delay="1"]{transition-delay:.08s}
.mxp-root [data-reveal-delay="2"]{transition-delay:.16s}
.mxp-root [data-reveal-delay="3"]{transition-delay:.24s}
.mxp-root [data-reveal-delay="4"]{transition-delay:.32s}
.mxp-root [data-reveal-delay="5"]{transition-delay:.40s}

.mxp-root .mask{display:block;overflow:hidden;padding-bottom:.05em}
.mxp-root .mask > span{display:block;transform:translateY(120%);transition:transform 1s cubic-bezier(.2,.7,.2,1)}
.mxp-root .in .mask > span, .mxp-root [data-reveal].in .mask > span{transform:none}
.mxp-root .mask.vapour-line{overflow:visible}
.mxp-root .mask.vapour-line > span{transform:none}
.mxp-root .mask:nth-child(2) > span{transition-delay:.1s}
.mxp-root .mask:nth-child(3) > span{transition-delay:.2s}
.mxp-root .mask:nth-child(4) > span{transition-delay:.3s}

.mxp-root .topbar{position:fixed;top:0;left:0;right:0;z-index:80;background:rgba(7,10,8,.6);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border-bottom:1px solid transparent;transition:border-color .4s, background .4s}
.mxp-root .topbar.scrolled{border-bottom-color:var(--line);background:rgba(7,10,8,.85)}
.mxp-root .topbar-inner{display:flex;align-items:center;justify-content:space-between;height:68px;padding:0 32px;max-width:none}
.mxp-root .brand{display:flex;align-items:center;gap:12px}
.mxp-root .brand-mark{width:32px;height:32px;display:grid;place-items:center;background:radial-gradient(circle at 30% 20%, #0E3A24, #050C08);border:1px solid var(--line-2);border-radius:7px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.04), 0 0 24px rgba(31,203,110,.15)}
.mxp-root .brand-mark img{width:22px;height:22px;object-fit:contain;filter:drop-shadow(0 0 8px rgba(31,203,110,.4))}
.mxp-root .brand-name{font-family:var(--serif);font-weight:600;font-size:15px;letter-spacing:.04em}
.mxp-root .brand-name span{color:var(--mx)}
.mxp-root .brand-tag{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.2em;color:var(--ink-3);padding-left:14px;margin-left:14px;border-left:1px solid var(--line-2)}
.mxp-root .nav{display:flex;gap:30px;font-size:13px;color:var(--ink-2)}
.mxp-root .nav a{position:relative;padding:6px 0}
.mxp-root .nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--mx);transform:scaleX(0);transform-origin:left;transition:transform .35s}
.mxp-root .nav a:hover{color:var(--ink)}
.mxp-root .nav a:hover::after{transform:scaleX(1)}
.mxp-root .top-cta{display:flex;align-items:center;gap:14px}
.mxp-root .pill-status{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.16em;color:var(--mx);padding:7px 12px;border:1px solid rgba(31,203,110,.25);border-radius:999px;background:rgba(31,203,110,.05)}
.mxp-root .dot{width:6px;height:6px;border-radius:999px;background:var(--mx);box-shadow:0 0 0 0 rgba(31,203,110,.6);animation:mxp-pulse 2.2s infinite}
@keyframes mxp-pulse{0%{box-shadow:0 0 0 0 rgba(31,203,110,.55)}70%{box-shadow:0 0 0 10px rgba(31,203,110,0)}100%{box-shadow:0 0 0 0 rgba(31,203,110,0)}}

.mxp-root .btn{position:relative;display:inline-flex;align-items:center;gap:10px;padding:13px 20px;border-radius:8px;font-size:13.5px;font-weight:500;font-family:var(--sans);letter-spacing:.005em;cursor:pointer;border:1px solid transparent;overflow:hidden;isolation:isolate;transition:transform .2s ease, color .25s}
.mxp-root .btn .arrow{display:inline-block;transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.mxp-root .btn:hover .arrow{transform:translateX(4px)}
.mxp-root .btn-primary{background:var(--mx);color:#062012;font-weight:600}
.mxp-root .btn-primary::before{content:"";position:absolute;inset:0;background:var(--mx-glow);transform:translateY(101%);transition:transform .4s cubic-bezier(.2,.7,.2,1);z-index:-1}
.mxp-root .btn-primary:hover::before{transform:translateY(0)}
.mxp-root .btn-primary:hover{transform:translateY(-1px)}
.mxp-root .btn-ghost{border-color:var(--line-2);color:var(--ink);background:rgba(255,255,255,.01)}
.mxp-root .btn-ghost::before{content:"";position:absolute;inset:0;background:var(--mx);transform:translateY(101%);transition:transform .4s cubic-bezier(.2,.7,.2,1);z-index:-1}
.mxp-root .btn-ghost:hover{color:#062012;border-color:var(--mx)}
.mxp-root .btn-ghost:hover::before{transform:translateY(0)}

.mxp-scroll-progress{position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--mx),var(--mx-glow));width:0;z-index:90;transition:width .15s linear;box-shadow:0 0 12px var(--mx)}

.mxp-root .hero{position:relative;min-height:100vh;padding:140px 0 80px;overflow:hidden;display:flex;align-items:center}
.mxp-root .hero-bg{position:absolute;inset:0;pointer-events:none;z-index:0}
.mxp-root .hero-bg .grad{position:absolute;inset:0;background:
  radial-gradient(1200px 700px at 90% 10%, rgba(31,203,110,.13), transparent 55%),
  radial-gradient(900px 600px at 0% 90%, rgba(31,203,110,.07), transparent 55%);}
.mxp-root .hero-bg .grid{position:absolute;inset:0;background-image:
  linear-gradient(to right, rgba(255,255,255,.025) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size:80px 80px;mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,#000 30%, transparent 80%)}
.mxp-root .hero-bg .glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle, rgba(31,203,110,.18), transparent 65%);filter:blur(40px);top:-150px;right:-200px;animation:mxp-floatglow 18s ease-in-out infinite}
@keyframes mxp-floatglow{0%,100%{transform:translate(0,0)}50%{transform:translate(-80px,80px)}}
.mxp-root .hero-bg .scanline{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(31,203,110,.7),transparent);top:0;animation:mxp-scanline 8s linear infinite;opacity:.5}
@keyframes mxp-scanline{0%{transform:translateY(0)}100%{transform:translateY(100vh)}}

.mxp-root .hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:1.15fr 1fr;gap:60px;align-items:end;width:100%}
.mxp-root .hero-meta{display:flex;align-items:center;gap:14px;margin-bottom:28px;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-2)}
.mxp-root .hero-meta .dotline{flex:0 0 32px;height:1px;background:var(--mx)}
.mxp-root .hero-meta b{color:var(--mx);font-weight:500}

.mxp-root h1.hero-title{font-family:var(--serif);font-weight:600;font-size:clamp(56px, 8.6vw, 130px);line-height:.88;letter-spacing:-0.04em;margin:0 0 32px}
.mxp-root h1.hero-title .it{font-family:var(--instrument);font-style:italic;font-weight:400;color:var(--mx);letter-spacing:-0.01em}
.mxp-root h1.hero-title .it::after{content:"";display:inline-block;width:.45em;height:.08em;background:var(--mx);vertical-align:.3em;margin-left:.1em;animation:mxp-caret 1s steps(2) infinite}

.mxp-root .vapour-line{display:block}
.mxp-root .vapour-host{display:block;font-family:var(--instrument);font-style:italic;font-weight:400;color:var(--mx);letter-spacing:-0.01em;line-height:.95;min-height:1.05em;position:relative}
.mxp-root .vapour-host canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
@keyframes mxp-caret{50%{opacity:0}}

.mxp-root .hero-sub{font-size:18.5px;line-height:1.55;color:var(--ink-2);max-width:560px;margin:0 0 38px}
.mxp-root .hero-sub b{color:var(--ink);font-weight:500}
.mxp-root .hero-ctas{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-bottom:54px}
.mxp-root .hero-ctas .btn{padding:15px 24px;font-size:14px}

.mxp-root .hero-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--line);padding-top:26px}
.mxp-root .strip-cell{padding:0 18px}
.mxp-root .strip-cell:first-child{padding-left:0}
.mxp-root .strip-cell + .strip-cell{border-left:1px solid var(--line)}
.mxp-root .strip-num{font-family:var(--serif);font-size:34px;font-weight:600;letter-spacing:-0.03em;color:var(--ink);line-height:1}
.mxp-root .strip-num span{color:var(--mx);font-size:13.5px;vertical-align:super;font-weight:500;margin-left:2px}
.mxp-root .strip-lab{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.18em;color:var(--ink-3);margin-top:10px}

.mxp-root .console{position:relative;background:linear-gradient(180deg,#0B130E,#070A08);border:1px solid var(--line-2);border-radius:16px;padding:0;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.55), 0 0 0 1px rgba(31,203,110,.04) inset;transform-style:preserve-3d}
.mxp-root .console::before{content:"";position:absolute;top:-1px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--mx),transparent);opacity:.5}
.mxp-root .console-bar{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--line);background:#070C09}
.mxp-root .console-bar .dots{display:flex;gap:6px}
.mxp-root .console-bar .dots i{width:10px;height:10px;border-radius:999px;background:#222C25;display:block;transition:background .25s}
.mxp-root .console-bar .dots i:nth-child(1){background:#3A2A2A}
.mxp-root .console-bar .dots i:nth-child(2){background:#3A352A}
.mxp-root .console-bar .dots i:nth-child(3){background:#1F3A2A}
.mxp-root .console-bar .title{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.12em;text-transform:uppercase}
.mxp-root .console-bar .title b{color:var(--ink);font-weight:500}
.mxp-root .console-bar .live{display:inline-flex;gap:7px;align-items:center;font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--mx)}
.mxp-root .console-body{padding:18px 18px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mxp-root .kpi{background:#0A100C;border:1px solid var(--line);border-radius:10px;padding:14px;position:relative;overflow:hidden}
.mxp-root .kpi::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,transparent,var(--mx),transparent);opacity:0;transition:opacity .4s}
.mxp-root .kpi:hover::after{opacity:1}
.mxp-root .kpi-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.mxp-root .kpi-h .l{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:var(--ink-3)}
.mxp-root .kpi-h .t{font-family:var(--mono);font-size:10px;color:var(--mx)}
.mxp-root .kpi-v{font-family:var(--serif);font-weight:600;font-size:32px;letter-spacing:-0.02em;line-height:1}
.mxp-root .kpi-v small{font-size:14px;color:var(--ink-3);font-weight:400;margin-left:4px}
.mxp-root .kpi-bar{height:4px;background:#101813;border-radius:99px;margin-top:14px;overflow:hidden;position:relative}
.mxp-root .kpi-bar > i{display:block;height:100%;background:linear-gradient(90deg,var(--mx-2),var(--mx));border-radius:99px;transform:scaleX(0);transform-origin:left;transition:transform 1.6s cubic-bezier(.2,.7,.2,1)}
.mxp-root .console.in .kpi-bar > i{transform:scaleX(1)}
.mxp-root .kpi-foot{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--ink-3);margin-top:8px;text-transform:uppercase;letter-spacing:.14em}
.mxp-root .kpi.full{grid-column:1/-1}

.mxp-root .funnel{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
.mxp-root .step{background:#0A0F0B;border:1px solid var(--line);border-radius:8px;padding:10px;position:relative;overflow:hidden}
.mxp-root .step::after{content:"→";position:absolute;right:-7px;top:50%;transform:translateY(-50%);font-family:var(--mono);color:var(--mx);font-size:14px;background:#0A100C;padding:0 2px;z-index:2}
.mxp-root .step:last-child::after{display:none}
.mxp-root .step .l{font-family:var(--mono);font-size:9.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.14em}
.mxp-root .step .v{font-family:var(--serif);font-weight:600;font-size:22px;margin-top:4px}
.mxp-root .step .conv{font-family:var(--mono);font-size:10px;color:var(--mx);margin-top:6px}
.mxp-root .step.warn .conv{color:var(--warn)}
.mxp-root .step.warn{box-shadow:inset 0 0 0 1px rgba(255,181,71,.2)}
.mxp-root .step.crit .conv{color:var(--crit)}

.mxp-root .ticker{border-top:1px solid var(--line);background:#070A08;font-family:var(--mono);font-size:11px;display:flex;align-items:center;gap:0;padding:0;color:var(--ink-3);overflow:hidden;white-space:nowrap;height:42px;position:relative}
.mxp-root .ticker-track{display:flex;gap:36px;animation:mxp-ticker 28s linear infinite;padding-left:36px}
.mxp-root .ticker-track span{display:inline-flex;align-items:center;gap:6px}
.mxp-root .ticker-track b{color:var(--mx);font-weight:500}
.mxp-root .ticker-track span::before{content:"●";color:var(--mx);font-size:7px;margin-right:5px;opacity:.6}
@keyframes mxp-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.mxp-root .scroll-hint{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.2em;color:var(--ink-3);z-index:3}
.mxp-root .scroll-hint .line{width:1px;height:34px;background:linear-gradient(to bottom,transparent,var(--mx));position:relative;overflow:hidden}
.mxp-root .scroll-hint .line::after{content:"";position:absolute;top:-100%;left:0;width:100%;height:50%;background:var(--mx);animation:mxp-scrollline 2s ease-in-out infinite}
@keyframes mxp-scrollline{0%{top:-100%}100%{top:120%}}

.mxp-root .marquee{border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;background:#060807;padding:22px 0}
.mxp-root .marquee-track{display:flex;gap:60px;animation:mxp-marquee 40s linear infinite;font-family:var(--serif);font-size:38px;font-weight:600;letter-spacing:-0.03em;white-space:nowrap}
.mxp-root .marquee-track span{display:inline-flex;align-items:center;gap:60px;color:var(--ink)}
.mxp-root .marquee-track .it{color:var(--mx);font-family:var(--instrument);font-style:italic;font-weight:400}
.mxp-root .marquee-track .star{color:var(--mx);font-size:24px;opacity:.6}
@keyframes mxp-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.mxp-root section{position:relative;z-index:2}
.mxp-root .sec-pad{padding:140px 0}
.mxp-root .sec-head{display:block;margin-bottom:80px;border-top:1px solid var(--line);padding-top:48px}
.mxp-root .sec-head .left{max-width:1040px}
.mxp-root .sec-title{font-family:var(--serif);font-weight:600;font-size:clamp(42px,5.6vw,84px);line-height:.95;letter-spacing:-0.035em;margin:0}
.mxp-root .sec-title .it{font-family:var(--instrument);font-style:italic;font-weight:400;color:var(--mx)}
.mxp-root .sec-sub{color:var(--ink-2);font-size:17px;line-height:1.55;margin-top:24px;max-width:680px}

.mxp-root .proof-wrap{padding:36px 0 0}
.mxp-root .proof-bar{display:grid;grid-template-columns:repeat(6,1fr);gap:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.mxp-root .proof-cell{padding:30px 24px;border-right:1px solid var(--line);position:relative;cursor:default;overflow:hidden;transition:background .35s}
.mxp-root .proof-cell::before{content:"";position:absolute;left:0;top:0;width:0;height:1px;background:var(--mx);transition:width .5s cubic-bezier(.2,.7,.2,1)}
.mxp-root .proof-cell:hover::before{width:100%}
.mxp-root .proof-cell:hover{background:rgba(31,203,110,.025)}
.mxp-root .proof-cell:last-child{border-right:none}
.mxp-root .proof-cell .v{font-family:var(--serif);font-size:36px;font-weight:600;letter-spacing:-0.025em;line-height:1}
.mxp-root .proof-cell .v span{color:var(--mx);font-size:18px;vertical-align:super;margin-left:2px;font-weight:500}
.mxp-root .proof-cell .l{font-family:var(--mono);font-size:10px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.16em;margin-top:10px}

.mxp-root .problem{background:linear-gradient(180deg, transparent, #060807 80%)}
.mxp-root .problem-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:80px;align-items:start}
.mxp-root .problem-list{margin:0;padding:0;list-style:none;border-top:1px solid var(--line)}
.mxp-root .problem-list li{display:grid;grid-template-columns:54px 1fr auto;gap:18px;align-items:center;padding:22px 0;border-bottom:1px solid var(--line);position:relative;cursor:default;transition:padding-left .4s}
.mxp-root .problem-list li::before{content:"";position:absolute;left:-20px;top:50%;width:8px;height:1px;background:var(--mx);transform:scaleX(0);transform-origin:right;transition:transform .4s}
.mxp-root .problem-list li:hover{padding-left:8px}
.mxp-root .problem-list li:hover::before{transform:scaleX(1)}
.mxp-root .problem-list .num{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.14em}
.mxp-root .problem-list .body{font-family:var(--serif);font-weight:500;font-size:21px;color:var(--ink);letter-spacing:-0.01em;line-height:1.2}
.mxp-root .problem-list .body s{text-decoration:none;color:var(--ink-3);font-weight:400;display:block;font-family:var(--sans);font-size:13.5px;margin-top:6px;letter-spacing:0;line-height:1.5}
.mxp-root .problem-list .tag{font-family:var(--mono);font-size:10px;color:var(--crit);text-transform:uppercase;letter-spacing:.16em;background:rgba(255,107,91,.06);border:1px solid rgba(255,107,91,.25);padding:6px 10px;border-radius:99px;white-space:nowrap}
.mxp-root .problem-list .tag.warn{color:var(--warn);background:rgba(255,181,71,.06);border-color:rgba(255,181,71,.25)}
.mxp-root .problem-list .tag.blind{color:var(--ink-3);background:rgba(255,255,255,.02);border-color:var(--line-2)}

.mxp-root .verdict{position:sticky;top:120px;border:1px solid var(--line-2);background:linear-gradient(180deg,#0B120E,#070A08);border-radius:16px;padding:38px;overflow:hidden}
.mxp-root .verdict::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--mx),transparent)}
.mxp-root .verdict::after{content:"";position:absolute;inset:auto -50% -50% auto;width:300px;height:300px;background:radial-gradient(circle, rgba(31,203,110,.12), transparent 60%);filter:blur(20px)}
.mxp-root .verdict-head{font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3);margin-bottom:22px;display:flex;justify-content:space-between}
.mxp-root .verdict-head b{color:var(--mx);font-weight:500}
.mxp-root .verdict h3{font-family:var(--serif);font-size:30px;margin:0 0 16px;letter-spacing:-0.02em;font-weight:600;line-height:1.05}
.mxp-root .verdict h3 .it{font-family:var(--instrument);font-style:italic;color:var(--mx);font-weight:400}
.mxp-root .verdict p{color:var(--ink-2);line-height:1.6;margin:0 0 16px;font-size:15px}
.mxp-root .verdict p.lead{color:var(--ink);font-size:15px}
.mxp-root .verdict .stamp{display:flex;align-items:center;gap:12px;font-family:var(--mono);text-transform:uppercase;font-size:11px;letter-spacing:.18em;color:var(--mx);padding-top:22px;margin-top:22px;border-top:1px solid var(--line);justify-content:space-between}
.mxp-root .verdict .seal{width:54px;height:54px;border:1px dashed var(--mx);border-radius:99px;display:grid;place-items:center;color:var(--mx);font-family:var(--mono);font-size:9px;line-height:1;text-align:center;animation:mxp-rotate 30s linear infinite}
@keyframes mxp-rotate{to{transform:rotate(360deg)}}

.mxp-root .modules-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden}
.mxp-root .mod{background:var(--bg-1);padding:32px;position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:300px;overflow:hidden;transition:background .4s}
.mxp-root .mod::before{content:"";position:absolute;inset:0;background:radial-gradient(400px 200px at var(--mx-x,80%) var(--mx-y,0%), rgba(31,203,110,.07), transparent 60%);opacity:0;transition:opacity .5s;pointer-events:none}
.mxp-root .mod:hover::before{opacity:1}
.mxp-root .mod[data-span="6"]{grid-column:span 6}
.mxp-root .mod[data-span="4"]{grid-column:span 4}
.mxp-root .mod[data-span="8"]{grid-column:span 8}
.mxp-root .mod[data-span="12"]{grid-column:span 12}
.mxp-root .mod-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;position:relative;z-index:1}
.mxp-root .mod-id{font-family:var(--mono);font-size:10.5px;color:var(--ink-3);letter-spacing:.18em;text-transform:uppercase}
.mxp-root .mod-id b{color:var(--mx);font-weight:500;margin-right:4px}
.mxp-root .mod-icon{width:42px;height:42px;border:1px solid var(--line-2);background:radial-gradient(circle at 30% 30%, #0E2A1A, #060A07);border-radius:9px;display:grid;place-items:center;color:var(--mx);transition:transform .35s, border-color .35s, background .35s}
.mxp-root .mod:hover .mod-icon{transform:rotate(-3deg) scale(1.06);border-color:var(--mx)}
.mxp-root .mod-icon svg{width:19px;height:19px;stroke-width:1.6}
.mxp-root .mod h4{font-family:var(--serif);font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.05;margin:0 0 14px;position:relative;z-index:1}
.mxp-root .mod h4 .it{font-family:var(--instrument);font-style:italic;color:var(--mx);font-weight:400}
.mxp-root .mod p{color:var(--ink-2);font-size:14px;line-height:1.6;margin:0;position:relative;z-index:1}
.mxp-root .mod p .hl{font-family:var(--mono);color:var(--mx);font-size:13px;letter-spacing:.02em}
.mxp-root .mod-foot{margin-top:24px;display:flex;align-items:center;gap:18px;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.16em;color:var(--ink-3);position:relative;z-index:1;flex-wrap:wrap}
.mxp-root .mod-foot span{display:inline-flex;align-items:center;gap:6px}
.mxp-root .mod-foot span::before{content:"";width:5px;height:5px;background:var(--mx);border-radius:99px}

.mxp-root .mod-terminal{padding:0;overflow:hidden;background:linear-gradient(180deg,#0A100C,#070A08)}
.mxp-root .mod-terminal .inner-pad{padding:32px}
.mxp-root .terminal-mock{margin-top:0;border-top:1px solid var(--line);background:#06090A;font-family:var(--mono);font-size:12px;color:var(--ink-2);padding:18px 24px;line-height:1.85;position:relative}
.mxp-root .terminal-mock::before{content:"";position:absolute;top:0;left:0;right:0;height:30px;background:linear-gradient(to bottom, #06090A, transparent);pointer-events:none;z-index:1}
.mxp-root .terminal-mock .row{display:grid;grid-template-columns:80px 1fr auto;gap:10px;align-items:center}
.mxp-root .terminal-mock .ts{color:var(--ink-4)}
.mxp-root .terminal-mock .lbl{color:var(--ink)}
.mxp-root .terminal-mock .val{color:var(--mx);font-weight:500}
.mxp-root .terminal-mock .val.warn{color:var(--warn)}
.mxp-root .terminal-mock .row::before{content:"›";color:var(--mx);margin-right:6px;opacity:.7}
.mxp-root .terminal-mock .input-line{margin-top:14px;color:var(--mx);border-top:1px dashed var(--line);padding-top:14px;display:flex;gap:8px;align-items:center}
.mxp-root .blink{display:inline-block;width:7px;height:14px;background:var(--mx);animation:mxp-blink 1.05s steps(2,start) infinite;vertical-align:middle}
@keyframes mxp-blink{to{opacity:0}}

.mxp-root .rank{margin-top:18px;border-top:1px solid var(--line);padding-top:14px}
.mxp-root .rank-row{display:grid;grid-template-columns:30px 1fr auto auto;gap:14px;padding:11px 0;align-items:center;font-size:13.5px;border-bottom:1px dashed var(--line);transition:padding-left .3s}
.mxp-root .rank-row:hover{padding-left:6px}
.mxp-root .rank-row .pos{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.05em}
.mxp-root .rank-row.top .pos{color:var(--mx);font-weight:600}
.mxp-root .rank-row.top .name::before{content:"★";color:var(--mx);margin-right:6px;font-size:11px}
.mxp-root .rank-row .name{color:var(--ink);display:flex;align-items:center}
.mxp-root .rank-row .meta{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.04em}
.mxp-root .rank-row .v{font-family:var(--serif);font-weight:600;color:var(--ink);font-size:15px}
.mxp-root .rank-row.you{background:rgba(31,203,110,.04);margin:0 -14px;padding-left:14px;padding-right:14px;border-radius:6px;border-bottom-style:solid;border-bottom-color:rgba(31,203,110,.25)}
.mxp-root .rank-row.you .name::after{content:"você";font-family:var(--mono);font-size:9px;background:var(--mx);color:#031;padding:2.5px 6px;border-radius:99px;margin-left:8px;letter-spacing:.12em;font-weight:600;text-transform:uppercase}
.mxp-root .rank-row.you .v{color:var(--mx)}

.mxp-root .dev-mock{margin-top:18px;background:#070A08;border:1px solid var(--line);border-radius:10px;padding:16px;position:relative;overflow:hidden}
.mxp-root .dev-mock::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--mx)}
.mxp-root .dev-mock .head{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:10.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.16em}
.mxp-root .dev-mock .head b{color:var(--mx);font-weight:500}
.mxp-root .dev-mock .body{margin-top:12px;font-size:13.5px;color:var(--ink);line-height:1.5}
.mxp-root .dev-mock .body b{color:var(--mx)}
.mxp-root .dev-mock .tags{display:flex;gap:6px;margin-top:14px;flex-wrap:wrap}
.mxp-root .chip{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.14em;padding:5px 10px;border-radius:99px;border:1px solid var(--line-2);color:var(--ink-2);transition:transform .25s, color .25s, border-color .25s}
.mxp-root .chip:hover{transform:translateY(-1px)}
.mxp-root .chip.good{color:var(--mx);border-color:rgba(31,203,110,.3);background:rgba(31,203,110,.05)}
.mxp-root .chip.warn{color:var(--warn);border-color:rgba(255,181,71,.3)}

.mxp-root .pdi-steps{margin-top:20px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;border-top:1px solid var(--line);padding-top:18px}
.mxp-root .pdi-step{text-align:center;padding:12px 6px;background:#070A08;border-radius:7px;position:relative;border:1px solid transparent;transition:border-color .3s, transform .3s}
.mxp-root .pdi-step .l{font-family:var(--mono);font-size:9.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.14em}
.mxp-root .pdi-step .ic{margin-top:6px;color:var(--ink-3);font-size:14px}
.mxp-root .pdi-step.done .l, .mxp-root .pdi-step.done .ic{color:var(--mx)}
.mxp-root .pdi-step.active{border-color:var(--mx);background:rgba(31,203,110,.06)}
.mxp-root .pdi-step.active .l, .mxp-root .pdi-step.active .ic{color:var(--mx)}
.mxp-root .pdi-step.active::after{content:"";position:absolute;inset:-1px;border:1px solid var(--mx);border-radius:7px;animation:mxp-halo 2s ease-in-out infinite}
@keyframes mxp-halo{0%,100%{box-shadow:0 0 0 0 rgba(31,203,110,.4)}50%{box-shadow:0 0 0 6px rgba(31,203,110,0)}}

.mxp-root .tlist{margin-top:20px;border-top:1px solid var(--line);padding-top:16px;display:flex;flex-direction:column;gap:4px}
.mxp-root .tlist-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;padding:10px 0;font-size:13.5px}
.mxp-root .tlist-row .name{color:var(--ink)}
.mxp-root .tlist-row .name.dim{color:var(--ink-2)}
.mxp-root .tlist-row .st{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase}
.mxp-root .tlist-row .st.done{color:var(--mx)}
.mxp-root .tlist-row .st.prog{color:var(--warn)}
.mxp-root .tlist-row .st.todo{color:var(--ink-3)}
.mxp-root .tprog{height:3px;background:#10171A;border-radius:99px;overflow:hidden;grid-column:1/-1;margin-top:-2px}
.mxp-root .tprog i{display:block;height:100%;background:var(--warn);border-radius:99px}

.mxp-root .micro-mq{padding:60px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;background:linear-gradient(180deg,#070A08,#080B09);position:relative}
.mxp-root .micro-mq-row{display:flex;gap:48px;animation:mxp-marquee 50s linear infinite;font-family:var(--serif);font-size:96px;line-height:.9;font-weight:600;letter-spacing:-0.04em;white-space:nowrap}
.mxp-root .micro-mq-row .it{font-family:var(--instrument);font-style:italic;color:var(--mx);font-weight:400}
.mxp-root .micro-mq-row span{display:inline-flex;align-items:center;gap:48px}
.mxp-root .micro-mq-row .star{color:var(--mx);font-size:48px;opacity:.5}

.mxp-root .personas{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:50px}
.mxp-root .pcard{background:linear-gradient(180deg,#0A100C, #070A08);border:1px solid var(--line);border-radius:16px;padding:36px;position:relative;overflow:hidden;transition:transform .5s cubic-bezier(.2,.7,.2,1), border-color .35s}
.mxp-root .pcard:hover{transform:translateY(-6px);border-color:var(--mx)}
.mxp-root .pcard::before{content:"";position:absolute;top:0;left:0;width:0;height:1px;background:var(--mx);transition:width .6s}
.mxp-root .pcard:hover::before{width:100%}
.mxp-root .pcard::after{content:"";position:absolute;inset:auto -50% -50% auto;width:300px;height:300px;background:radial-gradient(circle, rgba(31,203,110,.1), transparent 60%);filter:blur(30px);opacity:0;transition:opacity .5s}
.mxp-root .pcard:hover::after{opacity:1}
.mxp-root .pcard-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}
.mxp-root .pcard .role{font-family:var(--mono);font-size:11px;color:var(--mx);letter-spacing:.2em;text-transform:uppercase}
.mxp-root .pcard .role::before{content:"// "}
.mxp-root .pcard .pcard-num{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.14em}
.mxp-root .pcard h4{font-family:var(--serif);font-size:36px;font-weight:600;letter-spacing:-0.025em;margin:0 0 18px;line-height:.95}
.mxp-root .pcard h4 .it{font-family:var(--instrument);font-style:italic;color:var(--mx);font-weight:400}
.mxp-root .pcard p{color:var(--ink-2);font-size:14.5px;line-height:1.6;margin:0 0 28px}
.mxp-root .pcard .uses{margin:0;padding:0;list-style:none;border-top:1px solid var(--line);padding-top:18px}
.mxp-root .pcard .uses li{display:flex;align-items:center;gap:12px;padding:8px 0;font-size:13.5px;color:var(--ink-2);transition:color .25s, transform .3s;cursor:default}
.mxp-root .pcard .uses li:hover{color:var(--ink);transform:translateX(2px)}
.mxp-root .pcard .uses li::before{content:"+";font-family:var(--mono);font-size:13px;color:var(--mx);font-weight:500}

.mxp-root .journey{background:linear-gradient(180deg,#070A08, #0A120D 50%, #070A08)}
.mxp-root .flow{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-top:50px}
.mxp-root .step-card{background:var(--bg-1);padding:32px;display:flex;flex-direction:column;justify-content:space-between;min-height:280px;position:relative;overflow:hidden;transition:background .4s}
.mxp-root .step-card:hover{background:#0C140F}
.mxp-root .step-card .num{font-family:var(--serif);font-size:88px;font-weight:600;color:var(--mx);letter-spacing:-0.06em;line-height:.8;opacity:.18;transition:opacity .4s, transform .4s}
.mxp-root .step-card:hover .num{opacity:.32;transform:translateX(-4px)}
.mxp-root .step-card .who{font-family:var(--mono);font-size:11px;color:var(--mx);text-transform:uppercase;letter-spacing:.18em;margin-top:18px}
.mxp-root .step-card .who::before{content:"// "}
.mxp-root .step-card h5{font-family:var(--serif);font-size:22px;font-weight:600;margin:10px 0 12px;line-height:1.05;letter-spacing:-0.015em}
.mxp-root .step-card p{font-size:13.5px;color:var(--ink-2);margin:0;line-height:1.55}
.mxp-root .step-card .arrow{position:absolute;top:32px;right:32px;color:var(--ink-3);font-family:var(--mono);font-size:14px;transition:color .3s, transform .3s}
.mxp-root .step-card:hover .arrow{color:var(--mx);transform:translateX(4px)}

.mxp-root .modlist{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-top:30px}
.mxp-root .mli{background:var(--bg-1);padding:28px 26px;display:flex;gap:18px;align-items:flex-start;min-height:160px;transition:background .35s;position:relative}
.mxp-root .mli:hover{background:#0C140F}
.mxp-root .mli::before{content:"";position:absolute;left:0;top:0;width:1px;height:0;background:var(--mx);transition:height .4s}
.mxp-root .mli:hover::before{height:100%}
.mxp-root .mli .ic{width:34px;height:34px;border:1px solid var(--line-2);border-radius:7px;display:grid;place-items:center;color:var(--mx);flex-shrink:0;margin-top:2px;background:#070A08;transition:border-color .35s, transform .35s}
.mxp-root .mli:hover .ic{border-color:var(--mx);transform:rotate(-4deg)}
.mxp-root .mli .ic svg{width:15px;height:15px;stroke-width:1.6}
.mxp-root .mli h6{font-family:var(--serif);font-size:17px;font-weight:600;margin:0 0 6px;letter-spacing:-0.01em}
.mxp-root .mli p{font-size:13px;color:var(--ink-2);margin:0;line-height:1.55}

.mxp-root .quote-section{padding:120px 0;border-top:1px solid var(--line);background:linear-gradient(180deg,#070A08, #0A140D);position:relative;overflow:hidden}
.mxp-root .quote-section::before{content:"";position:absolute;left:50%;top:0;width:1px;height:100%;background:linear-gradient(to bottom, transparent, var(--mx) 50%, transparent);opacity:.08}
.mxp-root .quote-wrap{max-width:920px;margin:0 auto;text-align:center;padding:0 32px;position:relative}
.mxp-root .quote-mark{font-family:var(--instrument);font-style:italic;font-size:160px;color:var(--mx);line-height:.5;height:60px;opacity:.45}
.mxp-root .quote-body{font-family:var(--serif);font-size:clamp(28px,3.4vw,46px);line-height:1.2;letter-spacing:-0.02em;font-weight:500;margin:36px 0 40px}
.mxp-root .quote-body .it{font-family:var(--instrument);font-style:italic;color:var(--mx);font-weight:400}
.mxp-root .quote-attr{display:inline-flex;align-items:center;gap:14px;font-family:var(--mono);font-size:11.5px;letter-spacing:.16em;color:var(--ink-2);text-transform:uppercase}
.mxp-root .quote-attr .av{width:34px;height:34px;border-radius:99px;background:linear-gradient(135deg,#0E3A24,#1FCB6E);border:1px solid var(--line-2);display:grid;place-items:center;color:#031;font-weight:600;font-size:13px;letter-spacing:0}
.mxp-root .quote-attr b{color:var(--ink);font-weight:500}

.mxp-root .particle-band{position:relative;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#050807;overflow:hidden}
.mxp-root .particle-band::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 50%, rgba(31,203,110,.08), transparent 70%);pointer-events:none}
.mxp-root .particle-band-grid{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:32px;padding:60px 56px;max-width:1480px;margin:0 auto;position:relative}
.mxp-root .particle-band-meta{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:var(--ink-3);writing-mode:vertical-rl;transform:rotate(180deg);align-self:stretch;display:flex;align-items:center;justify-content:center;border-left:1px solid var(--line);padding:0 0 0 14px}
.mxp-root .particle-band-meta b{color:var(--mx);font-weight:500}
.mxp-root .particle-stage{position:relative;height:280px;width:100%}
.mxp-root .particle-caption{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);text-align:right;max-width:200px}
.mxp-root .particle-caption b{color:var(--ink);font-weight:500;display:block;margin-bottom:6px}

.mxp-root .faq{display:grid;grid-template-columns:1fr 1.4fr;gap:60px;align-items:start;margin-top:50px}
.mxp-root .faq-list{border-top:1px solid var(--line)}
.mxp-root .faq-item{border-bottom:1px solid var(--line)}
.mxp-root .faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 0;cursor:pointer;font-family:var(--serif);font-size:19px;font-weight:500;letter-spacing:-0.01em;color:var(--ink);transition:color .25s;gap:20px;width:100%;text-align:left}
.mxp-root .faq-q:hover{color:var(--mx)}
.mxp-root .faq-q .ix{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.14em;flex-shrink:0;width:30px}
.mxp-root .faq-q .plus{position:relative;width:18px;height:18px;flex-shrink:0;transition:transform .35s}
.mxp-root .faq-q .plus::before, .mxp-root .faq-q .plus::after{content:"";position:absolute;top:50%;left:0;right:0;height:1px;background:currentColor;transform:translateY(-50%)}
.mxp-root .faq-q .plus::after{transform:translateY(-50%) rotate(90deg);transition:transform .35s}
.mxp-root .faq-item.open .faq-q .plus::after{transform:translateY(-50%) rotate(0)}
.mxp-root .faq-item.open .faq-q{color:var(--mx)}
.mxp-root .faq-a{max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(.2,.7,.2,1)}
.mxp-root .faq-a-inner{padding:0 30px 22px 30px;color:var(--ink-2);font-size:14.5px;line-height:1.7;max-width:600px}
.mxp-root .faq-item.open .faq-a{max-height:300px}

.mxp-root .cta-mega{position:relative;border:1px solid var(--line-2);border-radius:20px;padding:90px 64px;background:radial-gradient(800px 400px at 80% 0%, rgba(31,203,110,0.16), transparent 60%), linear-gradient(180deg,#0A140D,#070A08);overflow:hidden}
.mxp-root .cta-mega::before{content:"";position:absolute;inset:0;background-image:linear-gradient(to right, rgba(255,255,255,.03) 1px, transparent 1px),linear-gradient(to bottom, rgba(255,255,255,.03) 1px, transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse 70% 60% at 70% 40%,#000,transparent 70%);opacity:.7}
.mxp-root .cta-mega::after{content:"";position:absolute;width:500px;height:500px;border-radius:99px;background:radial-gradient(circle, rgba(31,203,110,.18), transparent 65%);right:-200px;top:-200px;filter:blur(40px)}
.mxp-root .cta-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:60px;align-items:center;position:relative;z-index:2}
.mxp-root .cta-grid h2{font-family:var(--serif);font-size:clamp(46px,5.8vw,82px);font-weight:600;letter-spacing:-0.035em;line-height:.95;margin:0 0 24px}
.mxp-root .cta-grid h2 .it{font-family:var(--instrument);font-style:italic;color:var(--mx);font-weight:400}
.mxp-root .cta-grid p{color:var(--ink-2);font-size:16.5px;line-height:1.55;margin:0 0 32px;max-width:560px}
.mxp-root .cta-list{margin:0;padding:0;list-style:none;border-top:1px solid var(--line)}
.mxp-root .cta-list li{padding:16px 0;border-bottom:1px solid var(--line);font-size:14.5px;display:flex;justify-content:space-between;align-items:center;color:var(--ink-2);cursor:pointer;transition:color .25s, padding-left .35s;font-family:var(--serif);font-weight:500;letter-spacing:-0.005em}
.mxp-root .cta-list li:hover{color:var(--mx);padding-left:8px}
.mxp-root .cta-list li .arr{color:var(--mx);font-family:var(--mono);transition:transform .35s}
.mxp-root .cta-list li:hover .arr{transform:translateX(4px)}

.mxp-root footer.mxp-footer{background:#050706;border-top:1px solid var(--line);padding:80px 0 36px;margin-top:80px;position:relative;overflow:hidden}
.mxp-root footer.mxp-footer::before{content:"";position:absolute;top:0;left:50%;width:1px;height:100%;background:linear-gradient(to bottom, var(--mx), transparent);opacity:.05;transform:translateX(-50%)}
.mxp-root .foot-mega{font-family:var(--serif);font-size:clamp(80px,16vw,260px);font-weight:600;letter-spacing:-0.05em;line-height:.85;color:var(--ink-4);margin:0 0 60px;text-align:center}
.mxp-root .foot-mega .it{font-family:var(--instrument);font-style:italic;color:var(--mx);font-weight:400;opacity:.65}
.mxp-root .foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:50px;margin-bottom:60px}
.mxp-root .foot-grid h6{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:var(--ink-3);margin:0 0 18px}
.mxp-root .foot-grid a{display:block;font-size:13.5px;color:var(--ink-2);padding:5px 0;transition:color .25s, padding-left .3s}
.mxp-root .foot-grid a:hover{color:var(--mx);padding-left:4px}
.mxp-root .foot-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:30px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:var(--ink-3);gap:30px;flex-wrap:wrap}
.mxp-root .foot-bottom .right{display:flex;gap:24px;align-items:center}
.mxp-root .foot-bottom .right a:hover{color:var(--mx)}

.mxp-root .consultoria-sec{isolation:isolate}
.mxp-root .team-figure{margin:0 0 70px;border:1px solid var(--line-2);border-radius:18px;overflow:hidden;background:linear-gradient(180deg,#0A140D,#070A08);box-shadow:0 40px 100px rgba(0,0,0,.5), inset 0 1px 0 rgba(31,203,110,.06);position:relative}
.mxp-root .team-figure::before{content:"";position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--mx),transparent);opacity:.5;z-index:2}
.mxp-root .team-figure img{display:block;width:100%;height:auto;object-fit:contain;background:#06090A}
.mxp-root .team-figure-caption{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 28px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3);flex-wrap:wrap}
.mxp-root .team-figure-caption b{color:var(--ink);font-weight:500;letter-spacing:.04em}
.mxp-root .team-figure-caption .who{display:flex;align-items:center;gap:10px;color:var(--mx);font-weight:500}
.mxp-root .team-figure-caption .who::before{content:"";width:6px;height:6px;background:var(--mx);border-radius:99px;box-shadow:0 0 12px rgba(31,203,110,.6)}

@media (max-width: 1024px){
  .mxp-root .modules-grid,.mxp-root .flow,.mxp-root .modlist{grid-template-columns:repeat(2,1fr) !important}
  .mxp-root .mod[data-span]{grid-column:span 2 !important}
  .mxp-root .team-figure{margin:0 0 50px;border-radius:14px}
  .mxp-root .team-figure-caption{padding:16px 20px;font-size:10px;gap:14px}
}
@media (max-width: 900px){
  .mxp-root .particle-band-grid{grid-template-columns:1fr;padding:40px 22px;gap:18px}
  .mxp-root .particle-band-meta{writing-mode:horizontal-tb;transform:none;border-left:none;border-top:1px solid var(--line);padding:14px 0 0;justify-self:start}
  .mxp-root .particle-stage{height:200px}
  .mxp-root .particle-caption{text-align:left;max-width:none}
}
@media (max-width: 768px){
  .mxp-root .wrap{padding:0 22px}
  .mxp-root .topbar-inner{padding:0 22px}
  .mxp-root .hero-grid,.mxp-root .problem-grid,.mxp-root .cta-grid,.mxp-root .faq{grid-template-columns:1fr;gap:50px}
  .mxp-root .modules-grid,.mxp-root .flow,.mxp-root .modlist,.mxp-root .personas{grid-template-columns:1fr !important}
  .mxp-root .mod[data-span]{grid-column:span 1 !important}
  .mxp-root .nav,.mxp-root .brand-tag{display:none}
  .mxp-root .proof-bar{grid-template-columns:1fr 1fr 1fr}
  .mxp-root .proof-cell{border-bottom:1px solid var(--line)}
  .mxp-root .proof-cell:nth-child(3n){border-right:none}
  .mxp-root .foot-grid{grid-template-columns:1fr 1fr;gap:30px}
  .mxp-root .cta-mega{padding:50px 28px}
  .mxp-root .sec-pad{padding:90px 0}
  .mxp-root .hero{padding:120px 0 80px;min-height:auto}
  .mxp-root .hero-strip{grid-template-columns:1fr 1fr;gap:0}
  .mxp-root .strip-cell{padding:14px 0;border-left:none !important}
  .mxp-root .strip-cell:nth-child(2n){padding-left:18px;border-left:1px solid var(--line) !important}
  .mxp-root .strip-cell:nth-child(n+3){border-top:1px solid var(--line)}
  .mxp-root .scroll-hint{display:none}
  .mxp-root .sec-head{padding-top:36px;margin-bottom:50px}
  .mxp-root .top-cta .btn{padding:9px 14px;font-size:12.5px}
  .mxp-root .pill-status{display:none}
  .mxp-root .verdict{position:static}
  .mxp-root .quote-mark{font-size:90px}
  .mxp-root .foot-bottom{flex-direction:column;align-items:flex-start;gap:14px}
}

@media (prefers-reduced-motion: reduce){
  .mxp-root *{animation-duration:.001ms !important;transition-duration:.01ms !important}
  .mxp-root [data-reveal]{opacity:1;transform:none}
}
`

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap'

export default function MXPerformanceLanding() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const progRef = useRef<HTMLDivElement>(null)
  const topbarRef = useRef<HTMLElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)
  const heroVapourRef = useRef<HTMLSpanElement>(null)
  const particleStageRef = useRef<HTMLDivElement>(null)

  // Body class + meta
  useEffect(() => {
    document.body.classList.add('mxp-active')
    const prevTitle = document.title
    document.title = 'MX Performance · Sistema operacional para lojas automotivas'

    // fonts link
    let fontsLink = document.querySelector<HTMLLinkElement>('link[data-mxp-fonts]')
    if (!fontsLink) {
      const pre1 = document.createElement('link')
      pre1.rel = 'preconnect'
      pre1.href = 'https://fonts.googleapis.com'
      pre1.setAttribute('data-mxp-fonts', '1')
      document.head.appendChild(pre1)

      const pre2 = document.createElement('link')
      pre2.rel = 'preconnect'
      pre2.href = 'https://fonts.gstatic.com'
      pre2.crossOrigin = ''
      pre2.setAttribute('data-mxp-fonts', '1')
      document.head.appendChild(pre2)

      fontsLink = document.createElement('link')
      fontsLink.rel = 'stylesheet'
      fontsLink.href = FONTS_HREF
      fontsLink.setAttribute('data-mxp-fonts', '1')
      document.head.appendChild(fontsLink)
    }

    return () => {
      document.body.classList.remove('mxp-active')
      document.title = prevTitle
      document.querySelectorAll('[data-mxp-fonts]').forEach((n) => n.remove())
    }
  }, [])

  // Scroll progress + topbar shadow
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (topbarRef.current) topbarRef.current.classList.toggle('scrolled', y > 24)
      if (progRef.current) {
        const h = document.documentElement.scrollHeight - window.innerHeight
        progRef.current.style.width = Math.min(100, (y / Math.max(h, 1)) * 100) + '%'
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal observer + counter
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    document.querySelectorAll('.mxp-root [data-reveal]').forEach((el) => io.observe(el))

    requestAnimationFrame(() => {
      document.querySelectorAll('.mxp-root .hero [data-reveal], .mxp-root .hero h1').forEach((el) =>
        el.classList.add('in')
      )
    })

    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const target = parseInt(el.dataset.counter ?? '0', 10)
          const small = el.querySelector('small')
          const dur = 1600
          const start = performance.now()
          const fmt = (n: number) => (target >= 1000 ? n.toLocaleString('pt-BR') : String(n))
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur)
            const eased = 1 - Math.pow(1 - p, 3)
            const v = Math.floor(target * eased)
            el.textContent = fmt(v)
            if (small) el.appendChild(small)
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          counterIO.unobserve(el)
        })
      },
      { threshold: 0.4 }
    )
    document.querySelectorAll('.mxp-root [data-counter]').forEach((el) => counterIO.observe(el))

    return () => {
      io.disconnect()
      counterIO.disconnect()
    }
  }, [])

  // Custom cursor + module radial glow + hero parallax
  useEffect(() => {
    const cursor = cursorRef.current
    const isFine = window.matchMedia('(pointer: fine)').matches
    let raf = 0
    if (cursor && isFine) {
      cursor.classList.add('on')
      let mx = 0
      let my = 0
      let cx = 0
      let cy = 0
      const onMove = (e: MouseEvent) => {
        mx = e.clientX
        my = e.clientY
      }
      document.addEventListener('mousemove', onMove)
      const loop = () => {
        cx += (mx - cx) * 0.22
        cy += (my - cy) * 0.22
        cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`
        raf = requestAnimationFrame(loop)
      }
      loop()

      const onEnter = () => cursor.classList.add('lg')
      const onLeave = () => cursor.classList.remove('lg')
      const targets = document.querySelectorAll(
        '.mxp-root a, .mxp-root button, .mxp-root .pcard, .mxp-root .mod, .mxp-root .step-card, .mxp-root .mli, .mxp-root .proof-cell, .mxp-root .faq-q, .mxp-root .cta-list li, .mxp-root .problem-list li'
      )
      targets.forEach((t) => {
        t.addEventListener('mouseenter', onEnter)
        t.addEventListener('mouseleave', onLeave)
      })

      return () => {
        document.removeEventListener('mousemove', onMove)
        targets.forEach((t) => {
          t.removeEventListener('mouseenter', onEnter)
          t.removeEventListener('mouseleave', onLeave)
        })
        cancelAnimationFrame(raf)
      }
    }
  }, [])

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.mxp-root .mod')
    const handlers: Array<[HTMLElement, (e: MouseEvent) => void]> = []
    cards.forEach((card) => {
      const handler = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width) * 100
        const y = ((e.clientY - r.top) / r.height) * 100
        card.style.setProperty('--mx-x', x + '%')
        card.style.setProperty('--mx-y', y + '%')
      }
      card.addEventListener('mousemove', handler)
      handlers.push([card, handler])
    })
    return () => {
      handlers.forEach(([c, h]) => c.removeEventListener('mousemove', h))
    }
  }, [])

  useEffect(() => {
    const con = consoleRef.current
    const isFine = window.matchMedia('(pointer: fine)').matches
    if (!con || !isFine) return
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 6
      const dy = (e.clientY / window.innerHeight - 0.5) * 6
      con.style.transform = `perspective(1000px) rotateY(${-dx * 0.4}deg) rotateX(${dy * 0.4}deg) translateY(${dy * 0.6}px)`
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  // Load text-effects.js then mount vapour + particle
  useEffect(() => {
    let cancelled = false
    const mount = () => {
      if (cancelled) return
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      const heroEl = heroVapourRef.current
      if (heroEl && window.MXTextEffects) {
        const computed = getComputedStyle(heroEl.parentElement!.parentElement!)
        const px = parseFloat(computed.fontSize) || 110
        heroEl.style.height = px * 1.05 + 'px'
        heroEl.style.width = '100%'
        if (!reduce) {
          window.MXTextEffects.mountVapour(heroEl, {
            texts: ['improviso.', 'achismo.', 'planilha.', 'ruído.', 'atraso.'],
            color: 'rgb(31,203,110)',
            fontFamily: '"Instrument Serif", serif',
            fontWeight: 400,
            fontSize: Math.round(px * 0.96),
            spread: 3.5,
            density: 7,
            align: 'left',
            direction: 'left-to-right',
            vaporizeDuration: 1.6,
            fadeInDuration: 0.8,
            waitDuration: 1.8,
          })
        } else {
          heroEl.textContent = 'improviso.'
        }
      }
      const particleEl = particleStageRef.current
      if (particleEl && window.MXTextEffects && !reduce) {
        window.MXTextEffects.mountParticle(particleEl, {
          words: ['LANÇAMENTO', 'MÉTODO', 'ROTINA', 'RESULTADO', 'DISCIPLINA', 'CONTROLE'],
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
          fontSize: 130,
          accent: [31, 203, 110],
          drift: [220, 235, 226],
          pixelStep: 5,
          intervalSec: 3.5,
        })
      } else if (particleEl) {
        particleEl.innerHTML =
          '<div style="font-family:Space Grotesk,sans-serif;font-weight:700;font-size:64px;color:#1FCB6E;text-align:center;line-height:1;letter-spacing:-.04em">MÉTODO</div>'
      }
    }
    if (window.MXTextEffects) {
      mount()
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-mxp-effects]')
      if (existing) {
        existing.addEventListener('load', mount)
      } else {
        const s = document.createElement('script')
        s.src = '/landing/text-effects.js'
        s.async = true
        s.setAttribute('data-mxp-effects', '1')
        s.onload = mount
        document.head.appendChild(s)
      }
    }
    return () => {
      cancelled = true
    }
  }, [])

  // FAQ accordion handler
  const onFaqClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const item = e.currentTarget.closest('.faq-item')
    item?.classList.toggle('open')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <div ref={cursorRef} className="mxp-cursor" />
      <div ref={progRef} className="mxp-scroll-progress" />

      <div className="mxp-root">
        <header ref={topbarRef} className="topbar" role="banner">
          <div className="topbar-inner">
            <a href="#" className="brand" aria-label="MX Performance · Início">
              <div className="brand-mark">
                <img src="/landing/logo-mx.png" alt="Logotipo MX" />
              </div>
              <div className="brand-name">
                MX <span>PERFORMANCE</span>
              </div>
            </a>
            <nav className="nav" aria-label="Principal">
              <a href="#problema">Problema</a>
              <a href="#sistema">O Sistema</a>
              <a href="#modulos">Módulos</a>
              <a href="#publicos">Públicos</a>
              <a href="#consultoria">Consultoria</a>
              <a href="#faq">FAQ</a>
            </nav>
            <div className="top-cta">
              <a className="btn btn-primary" href="/login">
                Entrar <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </header>

        <section className="hero" aria-labelledby="hero-h">
          <div className="hero-bg" aria-hidden="true">
            <div className="grad" />
            <div className="grid" />
            <div className="glow" />
            <div className="scanline" />
          </div>
          <div className="wrap">
            <div className="hero-grid">
              <div data-reveal>                <h1 id="hero-h" className="hero-title">
                  <span className="mask">
                    <span>Tire a loja do</span>
                  </span>
                  <span className="mask vapour-line">
                    <span
                      ref={heroVapourRef}
                      id="hero-vapour"
                      className="vapour-host"
                      aria-label="ciclo de palavras-chave da operação"
                    >
                      improviso.
                    </span>
                  </span>
                </h1>
                <p className="hero-sub" data-reveal data-reveal-delay="3">
                  MX Performance é o <b>sistema operacional</b> que conecta lançamento diário, metas, ranking,
                  funil, devolutivas, PDI, treinamentos, agenda e consultoria — em um único ambiente. Menos
                  achismo. Menos planilha. <b>Mais rotina, dados e cobrança inteligente.</b>
                </p>
                <div className="hero-ctas" data-reveal data-reveal-delay="4">
                  <a className="btn btn-primary" href="#cta">
                    Quero implantar a rotina MX <span className="arrow">→</span>
                  </a>
                  <a className="btn btn-ghost" href="#sistema">
                    Ver o sistema em ação <span className="arrow">↓</span>
                  </a>
                </div>
                <div className="hero-strip" data-reveal data-reveal-delay="5">
                  <div className="strip-cell">
                    <div className="strip-num">
                      D-1<span>/D-0</span>
                    </div>
                    <div className="strip-lab">Lógica de lançamento</div>
                  </div>
                  <div className="strip-cell">
                    <div className="strip-num">
                      09:30<span>·45</span>
                    </div>
                    <div className="strip-lab">Janela operacional</div>
                  </div>
                  <div className="strip-cell">
                    <div className="strip-num">
                      3<span>perfis</span>
                    </div>
                    <div className="strip-lab">Dono · Gerente · Vendedor</div>
                  </div>
                  <div className="strip-cell">
                    <div className="strip-num">
                      1<span>plataforma</span>
                    </div>
                    <div className="strip-lab">Comercial + consultoria</div>
                  </div>
                </div>
              </div>

              <div className="console" ref={consoleRef} aria-hidden="true" data-reveal data-reveal-delay="2">
                <div className="console-bar">
                  <div className="dots">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="title">
                    Painel da Loja · <b>Unidade 014 — Centro</b>
                  </div>
                  <div className="live">
                    <span className="dot" />
                    ao vivo
                  </div>
                </div>
                <div className="console-body">
                  <div className="kpi">
                    <div className="kpi-h">
                      <span className="l">Vendas / Mês</span>
                      <span className="t">+12.4%</span>
                    </div>
                    <div className="kpi-v" data-counter="187">
                      0<small>/220</small>
                    </div>
                    <div className="kpi-bar">
                      <i style={{ width: '85%' }} />
                    </div>
                    <div className="kpi-foot">
                      <span>Atingimento 85%</span>
                      <span>Gap 33</span>
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-h">
                      <span className="l">Projeção</span>
                      <span className="t">on-pace</span>
                    </div>
                    <div className="kpi-v" data-counter="214">
                      0<small>uni</small>
                    </div>
                    <div className="kpi-bar">
                      <i style={{ width: '97%', background: 'linear-gradient(90deg,var(--warn),var(--mx))' }} />
                    </div>
                    <div className="kpi-foot">
                      <span>Dias úteis</span>
                      <span>4 restantes</span>
                    </div>
                  </div>
                  <div className="kpi full">
                    <div className="kpi-h">
                      <span className="l">Funil — método MX</span>
                      <span className="t">diagnóstico ›</span>
                    </div>
                    <div className="funnel">
                      <div className="step">
                        <div className="l">Leads</div>
                        <div className="v" data-counter="1284">
                          0
                        </div>
                        <div className="conv">→ 38%</div>
                      </div>
                      <div className="step warn">
                        <div className="l">Agendam.</div>
                        <div className="v" data-counter="488">
                          0
                        </div>
                        <div className="conv">→ 61%</div>
                      </div>
                      <div className="step">
                        <div className="l">Visitas</div>
                        <div className="v" data-counter="298">
                          0
                        </div>
                        <div className="conv">→ 63%</div>
                      </div>
                      <div className="step">
                        <div className="l">Vendas</div>
                        <div className="v" data-counter="187">
                          0
                        </div>
                        <div className="conv">⌀ 14.6%</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ticker">
                  <div className="ticker-track">
                    <span><b>09:14</b> Vendedor 03 lançou D-1</span>
                    <span><b>09:18</b> Carteira +12 agendamentos</span>
                    <span><b>09:22</b> Gargalo: agend → visita</span>
                    <span><b>09:26</b> Devolutiva enviada · R. Almeida</span>
                    <span><b>09:31</b> Janela de lançamento encerrada</span>
                    <span><b>09:14</b> Vendedor 03 lançou D-1</span>
                    <span><b>09:18</b> Carteira +12 agendamentos</span>
                    <span><b>09:22</b> Gargalo: agend → visita</span>
                    <span><b>09:26</b> Devolutiva enviada · R. Almeida</span>
                    <span><b>09:31</b> Janela de lançamento encerrada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="scroll-hint" aria-hidden="true">
            <span>Scroll</span>
            <span className="line" />
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>
              <span>Lançamento diário</span>
              <span className="star">✦</span>
              <span>Funil MX</span>
              <span className="star">✦</span>
              <span className="it">Ranking ao vivo</span>
              <span className="star">✦</span>
              <span>Devolutivas</span>
              <span className="star">✦</span>
              <span>PDI 360</span>
              <span className="star">✦</span>
              <span className="it">MX Academy</span>
              <span className="star">✦</span>
              <span>Visitas PMR</span>
              <span className="star">✦</span>
              <span>DRE</span>
              <span className="star">✦</span>
              <span className="it">ROI</span>
              <span className="star">✦</span>
            </span>
            <span>
              <span>Lançamento diário</span>
              <span className="star">✦</span>
              <span>Funil MX</span>
              <span className="star">✦</span>
              <span className="it">Ranking ao vivo</span>
              <span className="star">✦</span>
              <span>Devolutivas</span>
              <span className="star">✦</span>
              <span>PDI 360</span>
              <span className="star">✦</span>
              <span className="it">MX Academy</span>
              <span className="star">✦</span>
              <span>Visitas PMR</span>
              <span className="star">✦</span>
              <span>DRE</span>
              <span className="star">✦</span>
              <span className="it">ROI</span>
              <span className="star">✦</span>
            </span>
          </div>
        </div>

        <section className="proof-wrap" aria-label="Pilares do método">
          <div className="wrap">
            <div className="proof-bar" data-reveal>
              <div className="proof-cell"><div className="v">D-1<span>/D-0</span></div><div className="l">Disciplina diária</div></div>
              <div className="proof-cell"><div className="v">Funil<span>MX</span></div><div className="l">Lead → Agend. → Visita → Venda</div></div>
              <div className="proof-cell"><div className="v">Ranking<span>live</span></div><div className="l">Loja · rede · arena</div></div>
              <div className="proof-cell"><div className="v">PDI<span>360°</span></div><div className="l">Plano de carreira ativo</div></div>
              <div className="proof-cell"><div className="v">DRE<span>+ROI</span></div><div className="l">Resultado financeiro</div></div>
              <div className="proof-cell"><div className="v">Agenda<span>MX</span></div><div className="l">Visitas PMR · Google sync</div></div>
            </div>
          </div>
        </section>

        <section id="problema" className="sec-pad problem" aria-labelledby="prob-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="prob-h" className="sec-title">
                  Loja não vende menos<br />
                  por falta de cliente.<br />
                  Vende menos por <span className="it">falta de método.</span>
                </h2>
                <p className="sec-sub">Os leads chegam. As pessoas entram. Os números até parecem bons. Mas no fim do mês, ninguém sabe explicar com precisão <i>onde</i> a venda foi perdida.</p>
              </div>            </div>

            <div className="problem-grid">
              <ul className="problem-list" data-reveal>
                <li>
                  <span className="num">01</span>
                  <div className="body">Os leads chegam, mas nem sempre viram agendamento.
                    <s>Sem rastreio, o lead esfria antes da próxima ação.</s>
                  </div>
                  <span className="tag">leak</span>
                </li>
                <li>
                  <span className="num">02</span>
                  <div className="body">Os agendamentos acontecem, mas nem sempre viram visita.
                    <s>O acompanhamento é manual e cai no esquecimento.</s>
                  </div>
                  <span className="tag warn">gap</span>
                </li>
                <li>
                  <span className="num">03</span>
                  <div className="body">As visitas acontecem, mas nem sempre viram venda.
                    <s>Nenhum diagnóstico aponta o motivo real da perda.</s>
                  </div>
                  <span className="tag">leak</span>
                </li>
                <li>
                  <span className="num">04</span>
                  <div className="body">O gerente cobra, mas não sabe onde está o gargalo.
                    <s>Cobrança vira pressão genérica e desgasta a equipe.</s>
                  </div>
                  <span className="tag warn">noise</span>
                </li>
                <li>
                  <span className="num">05</span>
                  <div className="body">O dono vê o resultado, mas não enxerga a causa.
                    <s>Decisão sem dado é torcida, não gestão.</s>
                  </div>
                  <span className="tag blind">blind</span>
                </li>
                <li>
                  <span className="num">06</span>
                  <div className="body">O vendedor recebe pressão, mas não recebe direção.
                    <s>Sem feedback estruturado, ninguém evolui de fato.</s>
                  </div>
                  <span className="tag warn">drift</span>
                </li>
              </ul>

              <aside className="verdict" data-reveal data-reveal-delay="2">
                <div className="verdict-head">
                  <span>// VEREDITO DO SISTEMA</span>
                  <b>MX-OS</b>
                </div>
                <h3>O problema não é vontade de vender.<br />É <span className="it">falta de medição.</span></h3>
                <p>O MX Performance conecta rotina, funil, metas, ranking, gestão de pessoas, devolutiva, PDI, treinamento e relatórios em um único ambiente. Tudo o que o vendedor faz alimenta o painel do gerente, que alimenta a visão do dono, que alimenta o método da consultoria.</p>
                <p className="lead">Dados reais. Método. Acompanhamento diário.</p>
                <div className="stamp">
                  <span><span className="dot" /> assinado · método mx · v.6</span>
                  <div className="seal">METHOD<br />MX·OS</div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="micro-mq" aria-hidden="true">
          <div className="micro-mq-row">
            <span>Rotina <span className="it">vira</span> rastro <span className="star">✦</span> Rastro <span className="it">vira</span> dado <span className="star">✦</span> Dado <span className="it">vira</span> decisão <span className="star">✦</span></span>
            <span>Rotina <span className="it">vira</span> rastro <span className="star">✦</span> Rastro <span className="it">vira</span> dado <span className="star">✦</span> Dado <span className="it">vira</span> decisão <span className="star">✦</span></span>
          </div>
        </div>

        <section id="sistema" className="sec-pad" aria-labelledby="sis-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="sis-h" className="sec-title">
                  Não é mais um<br />
                  dashboard. É um<br />
                  <span className="it">sistema operacional</span><br />
                  para a sua loja.
                </h2>
                <p className="sec-sub">Cada papel da loja tem sua função no sistema — e cada ação alimenta a próxima decisão. O vendedor lança. O gerente corrige. O dono enxerga. A consultoria registra método. E os dados viram devolutiva, PDI, treinamento e plano de ação.</p>
              </div>            </div>

            <div className="modules-grid" data-reveal>
              <article className="mod mod-terminal" data-span="8">
                <div className="inner-pad">
                  <div className="mod-hd">
                    <div className="mod-id"><b>01</b>· Terminal MX</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/></svg>
                    </div>
                  </div>
                  <h4>Lançamento diário,<br />com <span className="it">janela operacional.</span></h4>
                  <p>Vendedor registra produção <span className="hl">D-1</span> e agenda <span className="hl">D-0</span>. Leads, agendamentos de carteira, agendamentos digitais, visitas, vendas por canal, observações e justificativa de zero — tudo controlado.</p>
                  <div className="mod-foot">
                    <span>até 09:30 · lançamento</span>
                    <span>até 09:45 · edição</span>
                  </div>
                </div>
                <div className="terminal-mock">
                  <div className="row"><span className="ts">09:14:32</span><span className="lbl">D-1 · leads recebidos</span><span className="val">42</span></div>
                  <div className="row"><span className="ts">09:14:32</span><span className="lbl">D-1 · agendamentos · carteira</span><span className="val">11</span></div>
                  <div className="row"><span className="ts">09:14:33</span><span className="lbl">D-1 · agendamentos · digital</span><span className="val">07</span></div>
                  <div className="row"><span className="ts">09:14:33</span><span className="lbl">D-1 · visitas realizadas</span><span className="val warn">04</span></div>
                  <div className="row"><span className="ts">09:14:34</span><span className="lbl">D-1 · vendas / canal</span><span className="val">02 · loja+digital</span></div>
                  <div className="row"><span className="ts">09:14:34</span><span className="lbl">D-1 · justificativa zero</span><span className="val">—</span></div>
                  <div className="input-line">D-0 ›&nbsp;agenda do dia <span className="blink" /></div>
                </div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>02</b>· Painel da Loja</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                    </div>
                  </div>
                  <h4>Tudo que o gerente precisa, em <span className="it">uma tela só.</span></h4>
                  <p>Vendas, leads, agendamentos, visitas, atingimento, ranking interno, status de lançamento e diagnóstico do funil — atualizado em tempo real conforme novos dados entram.</p>
                </div>
                <div className="mod-foot">
                  <span>realtime</span><span>diagnóstico</span>
                </div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>03</b>· Classificação &amp; Arena</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 21V9"/><path d="M12 21V3"/><path d="M18 21v-7"/></svg>
                    </div>
                  </div>
                  <h4>Ranking ao vivo, <span className="it">individual e de rede.</span></h4>
                </div>
                <div className="rank">
                  <div className="rank-row top"><span className="pos">01</span><span className="name">R. Almeida</span><span className="meta">28 vendas</span><span className="v">142%</span></div>
                  <div className="rank-row"><span className="pos">02</span><span className="name">M. Souza</span><span className="meta">25 vendas</span><span className="v">128%</span></div>
                  <div className="rank-row you"><span className="pos">03</span><span className="name">você</span><span className="meta">22 vendas</span><span className="v">112%</span></div>
                  <div className="rank-row"><span className="pos">04</span><span className="name">L. Pereira</span><span className="meta">19 vendas</span><span className="v">98%</span></div>
                  <div className="rank-row" style={{ borderBottom: 'none' }}><span className="pos">05</span><span className="name">F. Costa</span><span className="meta">16 vendas</span><span className="v">82%</span></div>
                </div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>04</b>· Devolutivas</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                  </div>
                  <h4>Feedback genérico não <span className="it">muda resultado.</span></h4>
                  <p>Pontos fortes, atenção, ação recomendada e métricas da semana. Vendedor registra ciência. Exporta para WhatsApp.</p>
                </div>
                <div className="dev-mock">
                  <div className="head"><span>SEMANA 17 · 2026</span><b>R. ALMEIDA</b></div>
                  <div className="body">Conversão Visita→Venda em <b>22%</b>. Manter abordagem de teste-drive ativo e estruturar follow-up D+2.</div>
                  <div className="tags">
                    <span className="chip good">+ teste-drive</span>
                    <span className="chip warn">~ follow-up</span>
                    <span className="chip">→ ação · roteiro</span>
                  </div>
                </div>
              </article>

              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>05</b>· PDI MX 360</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>
                    </div>
                  </div>
                  <h4>Plano de carreira que <span className="it">sai da gaveta.</span></h4>
                  <p>Sessão guiada por etapas: especialista, metas de 6/12/24 meses, mapeamento de competências, radar, lacunas e plano de ação. O sistema busca modelos por cargo, sugere ações e gera o pacote da sessão.</p>
                </div>
                <div className="pdi-steps">
                  <div className="pdi-step done"><div className="l">Especialista</div><div className="ic">●</div></div>
                  <div className="pdi-step done"><div className="l">Metas</div><div className="ic">●</div></div>
                  <div className="pdi-step done"><div className="l">Comp.</div><div className="ic">●</div></div>
                  <div className="pdi-step active"><div className="l">Radar</div><div className="ic">▷</div></div>
                  <div className="pdi-step"><div className="l">Plano</div><div className="ic">○</div></div>
                </div>
              </article>

              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>06</b>· MX Academy</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 10L12 4 2 10l10 6 10-6z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                    </div>
                  </div>
                  <h4>Treinamento conectado ao <span className="it">gargalo real.</span></h4>
                  <p>Quando o sistema detecta queda de conversão, indica o conteúdo certo para o vendedor certo. Conteúdos por pilar e público-alvo. Vendedor marca conclusão; gerente acompanha progresso.</p>
                </div>
                <div className="tlist">
                  <div className="tlist-row"><span className="name">Abordagem na entrada da loja</span><span className="st done">CONCLUÍDO</span></div>
                  <div className="tlist-row"><span className="name">Quebra de objeção · preço</span><span className="st prog">EM CURSO 60%</span></div>
                  <div className="tprog"><i style={{ width: '60%' }} /></div>
                  <div className="tlist-row"><span className="name dim">Agendamento → visita</span><span className="st todo">RECOMENDADO</span></div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="quote-section" aria-label="Manifesto">
          <div className="quote-wrap" data-reveal>
            <div className="quote-mark">&ldquo;</div>
            <p className="quote-body">
              <span className="it">Tirar a loja do improviso</span> e colocar dono, gerente e vendedor trabalhando com dados reais, método e acompanhamento diário.
            </p>
            <div className="quote-attr">
              <div className="av">MX</div>
              <span><b>MX Consultoria</b> · método operacional desde 2018</span>
            </div>
          </div>
        </section>

        <section className="particle-band" aria-label="Manifesto MX em movimento">
          <div className="particle-band-grid">
            <div className="particle-band-meta"><b>● </b>&nbsp;Manifesto · em movimento</div>
            <div className="particle-stage" id="particle-stage" ref={particleStageRef} aria-hidden="true" />
            <div className="particle-caption"><b>Em movimento</b>O método não é estático. A operação respira todo dia.</div>
          </div>
        </section>

        <section id="publicos" className="sec-pad" style={{ background: 'linear-gradient(180deg,transparent,#080B09)' }} aria-labelledby="pub-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="pub-h" className="sec-title">
                  Três visões da<br />
                  mesma operação.<br />
                  <span className="it">Cada um com sua tela.</span>
                </h2>
                <p className="sec-sub">Mesmos dados. Recortes diferentes. Cada perfil acessa o que faz sentido para sua função — e cada ação reverbera para os outros papéis em tempo real.</p>
              </div>            </div>

            <div className="personas">
              <article className="pcard" data-reveal>
                <div className="pcard-hd">
                  <div className="role">dono</div>
                  <div className="pcard-num">01/03</div>
                </div>
                <h4>Visão executiva.<br /><span className="it">Sem informação espalhada.</span></h4>
                <p>Acompanhe metas, projeções, ranking, relatórios e evolução das suas lojas — sem depender de planilha, mensagem solta ou gerente para entender o resultado.</p>
                <ul className="uses">
                  <li>Painel geral da rede (multi-loja)</li>
                  <li>Comparativo de unidades</li>
                  <li>Relatório matinal · semanal · mensal</li>
                  <li>ROI da consultoria · DRE</li>
                </ul>
              </article>

              <article className="pcard" data-reveal data-reveal-delay="1">
                <div className="pcard-hd">
                  <div className="role">gerente</div>
                  <div className="pcard-num">02/03</div>
                </div>
                <h4>Centro de comando<br />da <span className="it">rotina comercial.</span></h4>
                <p>Conduza a rotina, cobre lançamentos, entenda gargalos, oriente vendedores e transforme dados em ação. Ajustes de lançamento passam por aprovação — sem perder rastreabilidade.</p>
                <ul className="uses">
                  <li>Rotina diária · semanal · mensal</li>
                  <li>Aprovação de correções</li>
                  <li>Devolutivas estruturadas</li>
                  <li>Diagnóstico do funil em tempo real</li>
                </ul>
              </article>

              <article className="pcard" data-reveal data-reveal-delay="2">
                <div className="pcard-hd">
                  <div className="role">vendedor</div>
                  <div className="pcard-num">03/03</div>
                </div>
                <h4>Sua posição,<br />seus dados, <span className="it">sua evolução.</span></h4>
                <p>Acompanhe sua posição no ranking, registre produção, veja feedbacks, evolua com PDI e receba treinamentos conectados à <i>sua</i> performance — não a teorias genéricas.</p>
                <ul className="uses">
                  <li>Home com prescrição tática</li>
                  <li>Devolutivas com ciência</li>
                  <li>PDI &amp; plano de carreira</li>
                  <li>MX Academy direcionado</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="sec-pad journey" aria-labelledby="jor-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="jor-h" className="sec-title">
                  Da rotina do vendedor<br />
                  ao plano de ação<br />
                  do <span className="it">conselho de loja.</span>
                </h2>
                <p className="sec-sub">Um único ciclo, oito atos. O dado entra na ponta e sobe até virar decisão estratégica — sem reescrita, sem perda de contexto.</p>
              </div>            </div>

            <div className="flow" data-reveal>
              <div className="step-card">
                <div className="num">01</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">vendedor</div>
                  <h5>Lança D-1 e D-0 no Terminal.</h5>
                  <p>Produção do dia anterior + agenda do dia atual, dentro da janela operacional.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">02</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">gerente</div>
                  <h5>Valida agenda e monitora funil.</h5>
                  <p>Acompanha pendências, aprova correções, vê o painel da unidade ao vivo.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">03</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">sistema</div>
                  <h5>Calcula ranking, meta, projeção.</h5>
                  <p>Diagnóstico automático identifica gargalos do funil — lead, agend., visita, venda.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">04</div>
                <span className="arrow">↳</span>
                <div>
                  <div className="who">gerente</div>
                  <h5>Gera devolutiva, PDI e treino.</h5>
                  <p>Ação direcionada à pessoa certa, no gargalo certo, com a métrica de referência.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">05</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">vendedor</div>
                  <h5>Recebe direcionamento e evolui.</h5>
                  <p>Ciência da devolutiva, treinamento liberado, plano de carreira ativo.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">06</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">dono</div>
                  <h5>Acompanha relatórios.</h5>
                  <p>Matinal, semanal, mensal · projeção · ROI da consultoria.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">07</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">consultoria</div>
                  <h5>Registra visitas e plano de ação.</h5>
                  <p>PMR, DRE, planejamento estratégico, financeiro e evolução da loja.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">08</div>
                <span className="arrow">∞</span>
                <div>
                  <div className="who">rede</div>
                  <h5>Histórico, rastreio e gestão real.</h5>
                  <p>Cada decisão fica documentada. Cada ciclo melhora o próximo.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modulos" className="sec-pad" aria-labelledby="mod-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="mod-h" className="sec-title">
                  Tudo que a operação<br />
                  precisa, em <span className="it">um lugar.</span>
                </h2>
                <p className="sec-sub">Não é um menu de features — é a anatomia de uma rotina funcionando todo dia, em cada unidade da rede.</p>
              </div>            </div>

            <div className="modlist" data-reveal>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg></div>
                <div><h6>Painel geral da rede</h6><p>Multi-loja: filtre por período, ordene por vendas, gap, projeção, eficiência, disciplina e status operacional.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-7h6v7"/></svg></div>
                <div><h6>Gestão de lojas</h6><p>Unidades ativas e arquivadas, dashboard por loja, equipe, indicadores de disciplina e força de vendas.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M14 21c0-2.5 1.6-4.7 4-5.6"/></svg></div>
                <div><h6>Gestão de equipe</h6><p>Papéis (admin, MX, dono, gerente, vendedor), vigência, status ativo e presença no lançamento diário.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 3"/></svg></div>
                <div><h6>Metas &amp; benchmarks</h6><p>Meta mensal por loja e parâmetros de conversão. Matriz com Lead→Agend., Agend.→Visita, Visita→Venda.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11l8-8 10 10-8 8z"/><path d="M11 3l10 10"/></svg></div>
                <div><h6>Rotina do gerente</h6><p>Centro de comando: vendedores pendentes, agenda validada, reuniões, devolutivas, PDIs, correções.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v6H4z"/><path d="M4 14h16v6H4z"/><path d="M8 7h2M8 17h2"/></svg></div>
                <div><h6>Relatório matinal</h6><p>Vendas, metas, projeção, gap, leads, visitas e pendências. Exporta XLSX, HTML e texto WhatsApp.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg></div>
                <div><h6>Semanal &amp; mensal</h6><p>Ranking, médias da equipe, gargalos. Disparo automático aos destinatários configurados.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div>
                <div><h6>Notificações &amp; broadcast</h6><p>Alertas, leitura, individuais ou broadcast por loja e papel. Comunicação operacional dentro do sistema.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/></svg></div>
                <div><h6>Configuração operacional</h6><p>Destinatários oficiais, modo de projeção (calendário ou dias úteis), políticas operacionais por unidade.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/></svg></div>
                <div><h6>Auditoria &amp; diagnóstico</h6><p>Lançamentos, correções, logs, reprocessamento, análise forense do funil. Confiança, não achismo.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg></div>
                <div><h6>Reprocessamento &amp; importação</h6><p>Importações brutas, logs de reprocessamento, status, erros e avisos. Histórico preservado.</p></div>
              </div>
              <div className="mli">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><path d="M3 8h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 14h6"/></svg></div>
                <div><h6>Produtos digitais</h6><p>Catálogo de ofertas, materiais e produtos digitais relacionados à operação comercial e à consultoria.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="consultoria" className="sec-pad consultoria-sec" style={{ background: 'linear-gradient(180deg, #080B09, #0A140D 80%, #070A08)', position: 'relative', overflow: 'hidden' }} aria-labelledby="con-h">
          <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
            <div className="sec-head">
              <div className="left" data-reveal>
                <h2 id="con-h" className="sec-title">
                  Método consultivo<br />
                  com governança<br />
                  e <span className="it">rastreabilidade.</span>
                </h2>
                <p className="sec-sub">Uma camada interna conecta clientes, agenda, visitas PMR, DRE, plano de ação e ROI. Cada visita gera registro, cada decisão gera evidência — sem perda de história entre encontros.</p>
              </div>
            </div>

            <figure className="team-figure" data-reveal>
              <img src="/landing/team-mx.png" alt="Equipe MX Consultoria — sócios" />
              <figcaption className="team-figure-caption">
                <span className="who">MX Consultoria · sócios</span>
                <span><b>Método operacional</b> · desde 2018</span>
              </figcaption>
            </figure>

            <div className="modules-grid" data-reveal>
              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C1</b>· CRM de Consultoria</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 4h18v16H3z"/><path d="M3 9h18M9 4v16"/></svg></div>
                  </div>
                  <h4>Cliente, contrato, módulos, contatos, <span className="it">ritual.</span></h4>
                  <p>Razão social, CNPJ, produto contratado, módulos ativos, unidades, contatos, responsáveis, visitas, financeiro, plano de ação, agenda. Status, saúde do ritual, última visita, indicadores da carteira.</p>
                </div>
                <div className="mod-foot"><span>governança</span><span>carteira</span><span>ritual</span></div>
              </article>

              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C2</b>· Agenda MX</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></div>
                  </div>
                  <h4>Visitas, aulas, eventos. <span className="it">Sincronizada.</span></h4>
                  <p>Filtre por data, status e consultor. Agende visitas, defina modalidade, responsável, local, duração e objetivo. Integração com Google Calendar — agenda pessoal e agenda central MX.</p>
                </div>
                <div className="mod-foot"><span>google sync</span><span>multi-consultor</span></div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C3</b>· Visitas PMR</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
                  </div>
                  <h4>Metodologia consultiva, <span className="it">executada.</span></h4>
                  <p>Numeração, checklist, objetivos, evidências, assinatura, conclusão e relatório. Gera plano de ação, diagnóstico, PDI, análise de DRE.</p>
                </div>
                <div className="mod-foot"><span>checklist</span><span>evidência</span></div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C4</b>· DRE &amp; Financeiro</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/></svg></div>
                  </div>
                  <h4>Performance comercial vira <span className="it">resultado.</span></h4>
                  <p>Receita, deduções, despesas, folha, pró-labore, marketing, investimentos, financiamento. Lucro, ROI, ticket médio, margem por carro, CAC.</p>
                </div>
                <div className="mod-foot"><span>DRE mensal</span><span>indicadores</span></div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C5</b>· ROI &amp; Choque</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h7l-2 8 10-12h-7z"/></svg></div>
                  </div>
                  <h4>Antes e depois. <span className="it">Em PDF.</span></h4>
                  <p>Compara cenário inicial e atual: vendas, leads, conversão, margem, estoque. Exporta relatório de impacto da consultoria.</p>
                </div>
                <div className="mod-foot"><span>relatório</span><span>impacto</span></div>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="sec-pad" aria-labelledby="faq-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="faq-h" className="sec-title">Antes de implantar.<br /><span className="it">As perguntas reais.</span></h2>
              </div>            </div>

            <div className="faq" data-reveal>
              <div>
                <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, maxWidth: 340 }}>Tudo que dono, gerente e vendedor perguntam antes de adotar uma rotina nova. Sem rodeio.</p>
                <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className="chip">implantação</span>
                  <span className="chip">equipe</span>
                  <span className="chip">dados</span>
                  <span className="chip">consultoria</span>
                </div>
              </div>
              <div className="faq-list">
                <div className="faq-item">
                  <button className="faq-q" type="button" onClick={onFaqClick}>
                    <span className="ix">01</span>
                    <span>Quanto tempo leva para a equipe entrar na rotina?</span>
                    <span className="plus" />
                  </button>
                  <div className="faq-a"><div className="faq-a-inner">A primeira semana já estabiliza o lançamento diário. Em 30 dias, ranking, devolutivas e diagnóstico do funil estão funcionando como ritual. A consultoria acompanha esse onboarding presencialmente ou online.</div></div>
                </div>
                <div className="faq-item">
                  <button className="faq-q" type="button" onClick={onFaqClick}>
                    <span className="ix">02</span>
                    <span>Funciona para uma loja ou só para rede?</span>
                    <span className="plus" />
                  </button>
                  <div className="faq-a"><div className="faq-a-inner">Funciona em ambos. Você pode operar uma única unidade com Painel da Loja, ou consolidar várias no Painel Geral da Rede, com filtros, comparativos e ordenação por gap, projeção e disciplina.</div></div>
                </div>
                <div className="faq-item">
                  <button className="faq-q" type="button" onClick={onFaqClick}>
                    <span className="ix">03</span>
                    <span>Os vendedores precisam saber tecnologia?</span>
                    <span className="plus" />
                  </button>
                  <div className="faq-a"><div className="faq-a-inner">Não. O Terminal MX é desenhado para o lançamento ser feito em segundos, com janela operacional clara (até 09:30 lançar, até 09:45 editar). Quem usa WhatsApp, usa o Terminal.</div></div>
                </div>
                <div className="faq-item">
                  <button className="faq-q" type="button" onClick={onFaqClick}>
                    <span className="ix">04</span>
                    <span>E os dados que já temos hoje?</span>
                    <span className="plus" />
                  </button>
                  <div className="faq-a"><div className="faq-a-inner">O sistema possui módulo de reprocessamento e importação. Você sobe a base bruta, acompanha logs, corrige sem perder histórico e mantém auditoria completa.</div></div>
                </div>
                <div className="faq-item">
                  <button className="faq-q" type="button" onClick={onFaqClick}>
                    <span className="ix">05</span>
                    <span>A consultoria é obrigatória?</span>
                    <span className="plus" />
                  </button>
                  <div className="faq-a"><div className="faq-a-inner">Não. Você pode usar só a plataforma. Mas a camada de consultoria — visitas PMR, DRE, plano de ação e ROI — é o que conecta método à rotina, e por isso tira o resultado do platô.</div></div>
                </div>
                <div className="faq-item">
                  <button className="faq-q" type="button" onClick={onFaqClick}>
                    <span className="ix">06</span>
                    <span>Como a privacidade dos dados é tratada?</span>
                    <span className="plus" />
                  </button>
                  <div className="faq-a"><div className="faq-a-inner">Cada papel acessa apenas o que faz sentido para sua função. Há auditoria, logs, controle de vigência e governança de clientes na camada interna da MX. Política completa em /privacidade.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="sec-pad" style={{ paddingTop: 60 }} aria-labelledby="cta-h">
          <div className="wrap">
            <div className="cta-mega" data-reveal>
              <div className="cta-grid">
                <div>                  <h2 id="cta-h">Pare de gerir a loja<br />no <span className="it">improviso.</span></h2>
                  <p>MX Performance é o sistema operacional para lojas automotivas que conecta lançamento diário, metas, classificação, funil, devolutivas, PDI, treinamentos, relatórios, agenda e consultoria — em uma única plataforma.</p>
                  <div className="hero-ctas">
                    <a className="btn btn-primary" href="/login">Ver o MX Performance em ação <span className="arrow">→</span></a>
                    <a className="btn btn-ghost" href="https://www.instagram.com/mxconsultoriabr" target="_blank" rel="noreferrer">Falar com a MX <span className="arrow">↗</span></a>
                  </div>
                </div>
                <ul className="cta-list">
                  <li>Quero organizar minha operação comercial<span className="arr">→</span></li>
                  <li>Quero acompanhar minha loja com dados reais<span className="arr">→</span></li>
                  <li>Quero melhorar a performance dos vendedores<span className="arr">→</span></li>
                  <li>Quero implantar a rotina MX na minha loja<span className="arr">→</span></li>
                  <li>Quero ver o MX Performance em ação<span className="arr">→</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <footer className="mxp-footer" role="contentinfo">
          <div className="wrap">
            <h2 className="foot-mega" aria-hidden="true">MX <span className="it">Performance</span></h2>
            <div className="foot-grid">
              <div>
                <a href="#" className="brand" style={{ marginBottom: 18 }}>
                  <div className="brand-mark"><img src="/landing/logo-mx.png" alt="MX" /></div>
                  <div className="brand-name">MX <span>PERFORMANCE</span></div>
                </a>
                <p style={{ color: 'var(--ink-2)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 340, margin: '14px 0 0' }}>Plataforma de gestão comercial, operacional e consultiva para lojas automotivas. Tirando a operação do improviso desde 2026.</p>
                <div style={{ marginTop: 24 }}>
                  <span className="pill-status"><span className="dot" />Status do sistema · operacional</span>
                </div>
              </div>
              <div>
                <h6>Plataforma</h6>
                <a href="#sistema">Terminal MX</a>
                <a href="#sistema">Painel da Loja</a>
                <a href="#sistema">Classificação</a>
                <a href="#sistema">Devolutivas</a>
                <a href="#sistema">PDI 360</a>
                <a href="#sistema">MX Academy</a>
              </div>
              <div>
                <h6>Consultoria</h6>
                <a href="#consultoria">CRM</a>
                <a href="#consultoria">Agenda MX</a>
                <a href="#consultoria">Visitas PMR</a>
                <a href="#consultoria">DRE Financeiro</a>
                <a href="#consultoria">ROI &amp; Choque</a>
              </div>
              <div>
                <h6>MX</h6>
                <a href="#">Sobre a MX Consultoria</a>
                <a href="/privacy">Privacidade</a>
                <a href="/terms">Termos de uso</a>
                <a href="https://www.instagram.com/mxconsultoriabr">Contato</a>
                <a href="https://www.instagram.com/mxconsultoriabr">Instagram ↗</a>
              </div>
            </div>
            <div className="foot-bottom">
              <div>© MX Consultoria LTDA · 2026 — Todos os direitos reservados</div>
              <div className="right">
                <span>v.2026.04 · build 04.30</span>
                <a href="/privacy">Privacidade</a>
                <a href="/terms">Termos</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
