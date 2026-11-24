import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Under Process | HivraSoft",
  description: "HivraSoft's website is being refreshed. We'll be back soon.",
};

export default function UnderProcessPage() {
  return (
    <main className="process-page">
      <div className="process-glow process-glow-one" aria-hidden="true" />
      <div className="process-glow process-glow-two" aria-hidden="true" />

      <section className="process-card" aria-labelledby="process-title">
        <a className="process-brand" href="/" aria-label="HivraSoft home">
          <span className="process-brand-mark" aria-hidden="true">H</span>
          <span>Hivra<span>Soft</span></span>
        </a>

        <div className="process-art" aria-hidden="true">
          <div className="process-orbit process-orbit-outer" />
          <div className="process-orbit process-orbit-inner" />
          <div className="process-core"><span>H</span></div>
          <span className="process-spark process-spark-one" />
          <span className="process-spark process-spark-two" />
          <span className="process-spark process-spark-three" />
        </div>

        <p className="process-eyebrow"><span /> A little refresh is underway</p>
        <h1 id="process-title">Website under<br /><span>process.</span></h1>
        <p className="process-copy">
          We’re working behind the scenes to bring you a better HivraSoft experience.
          Please check back soon.
        </p>
        <div className="process-progress" role="status" aria-label="Website refresh in progress">
          <div className="process-progress-track"><span /></div>
          <span className="process-progress-label">Making things better</span>
          <span className="process-dots"><i /><i /><i /></span>
        </div>
      </section>
      <footer className="process-footer">© {new Date().getFullYear()} HivraSoft</footer>

      <style>{`
        .process-page{--ink:#191526;--muted:#777488;--violet:#7357e8;--pink:#d964a5;position:relative;isolation:isolate;display:grid;min-height:100svh;overflow:hidden;place-items:center;padding:40px 20px 76px;background:radial-gradient(ellipse at 50% 45%,#fff 0%,#faf9ff 48%,#f3f1fb 100%);color:var(--ink);font-family:Arial,Helvetica,sans-serif}
        .process-card{position:relative;z-index:1;display:flex;width:min(100%,560px);flex-direction:column;align-items:center;text-align:center}
        .process-brand{display:inline-flex;align-items:center;gap:10px;color:#201b32;text-decoration:none;font-size:20px;font-weight:750;letter-spacing:-.7px}
        .process-brand>span:last-child>span{color:var(--violet)}
        .process-brand-mark{display:grid;width:34px;height:34px;place-items:center;border-radius:11px;background:linear-gradient(140deg,#7458ed,#c25bd1);color:white;font-size:20px;box-shadow:0 7px 18px #8065d744}
        .process-art{position:relative;display:grid;width:206px;height:206px;place-items:center;margin:48px 0 30px}
        .process-orbit{position:absolute;border:1px solid #826ce323;border-radius:50%}
        .process-orbit-outer{inset:2px;animation:process-spin 22s linear infinite}
        .process-orbit-outer:before,.process-orbit-inner:after{position:absolute;width:9px;height:9px;border-radius:50%;background:#8c71ef;content:"";box-shadow:0 0 14px #8c71ef88}
        .process-orbit-outer:before{top:27px;left:24px}
        .process-orbit-inner{inset:19px;border-style:dashed;animation:process-spin 32s linear infinite reverse}
        .process-orbit-inner:after{right:15px;bottom:28px;width:7px;height:7px;background:#e178b1}
        .process-core{display:grid;width:105px;height:105px;place-items:center;border:1px solid #ffffff;border-radius:34px;background:linear-gradient(145deg,#fff 8%,#f0ebff 100%);box-shadow:0 22px 55px #775dd42b,inset 0 0 22px #fff;transform:rotate(-8deg);animation:process-float 4s ease-in-out infinite}
        .process-core span{background:linear-gradient(135deg,#7051e2,#d766a6);background-clip:text;color:transparent;font-size:56px;font-weight:800;letter-spacing:-6px;transform:rotate(8deg)}
        .process-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#e592be;animation:process-pulse 2s ease-in-out infinite}
        .process-spark-one{top:37px;right:36px}.process-spark-two{bottom:30px;left:39px;width:4px;height:4px;animation-delay:.6s}.process-spark-three{top:79px;left:10px;width:5px;height:5px;background:#8671df;animation-delay:1.1s}
        .process-eyebrow{display:flex;align-items:center;gap:9px;margin:0 0 14px;color:#716d82;font-size:11px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase}
        .process-eyebrow span{width:7px;height:7px;border-radius:50%;background:#9b83ef;box-shadow:0 0 0 4px #9b83ef1c;animation:process-pulse 1.8s ease-in-out infinite}
        .process-card h1{margin:0;color:#211d31;font-size:clamp(43px,9vw,67px);font-weight:750;letter-spacing:-4.3px;line-height:.99}
        .process-card h1 span{background:linear-gradient(100deg,#7456e8 5%,#bb5fc3 90%);background-clip:text;color:transparent}
        .process-copy{max-width:405px;margin:22px 0 0;color:var(--muted);font-size:15px;line-height:1.75}
        .process-progress{display:flex;width:min(100%,305px);align-items:center;gap:12px;margin-top:32px}
        .process-progress-track{height:5px;flex:1;overflow:hidden;border-radius:9px;background:#e9e6f2}
        .process-progress-track span{display:block;width:43%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#7357e8,#d168ad);animation:process-progress 2.4s ease-in-out infinite alternate}
        .process-progress-label{color:#817d91;font-size:11px;white-space:nowrap}
        .process-dots{display:flex;gap:3px}.process-dots i{width:3px;height:3px;border-radius:50%;background:#a68de7;animation:process-pulse 1s ease-in-out infinite}.process-dots i:nth-child(2){animation-delay:.15s}.process-dots i:nth-child(3){animation-delay:.3s}
        .process-footer{position:absolute;bottom:24px;z-index:1;color:#a29eb0;font-size:11px;letter-spacing:.5px}
        .process-glow{position:absolute;z-index:-1;width:340px;height:340px;border-radius:50%;filter:blur(70px);opacity:.32;pointer-events:none}.process-glow-one{top:-220px;left:-170px;background:#b9aaff}.process-glow-two{right:-220px;bottom:-240px;background:#f2bdd9}
        @keyframes process-spin{to{transform:rotate(360deg)}}@keyframes process-float{0%,100%{translate:0 0}50%{translate:0 -9px}}@keyframes process-pulse{0%,100%{opacity:.48;scale:.82}50%{opacity:1;scale:1.18}}@keyframes process-progress{from{translate:-30% 0}to{translate:135% 0}}
        @media(max-width:480px){.process-art{width:176px;height:176px;margin:40px 0 26px}.process-core{width:91px;height:91px;border-radius:29px}.process-core span{font-size:49px}.process-card h1{letter-spacing:-3px}.process-copy{font-size:14px}.process-eyebrow{font-size:10px;letter-spacing:1.3px}}
        @media(prefers-reduced-motion:reduce){.process-page *,.process-page *:before,.process-page *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}
      `}</style>
    </main>
  );
}
