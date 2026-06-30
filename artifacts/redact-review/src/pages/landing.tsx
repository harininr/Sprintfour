import React, { useEffect } from "react";
import { Link } from "wouter";

export default function Landing() {
  useEffect(() => {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('transition-all', 'duration-1000', 'ease-out');
        observer.observe(section);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(229, 229, 224, 0.5);
        }
        .text-gradient-maroon {
            background: linear-gradient(135deg, #800000 0%, #570000 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .redaction-hatch {
            background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(128, 0, 0, 0.1) 5px, rgba(128, 0, 0, 0.1) 10px);
        }
        .hero-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        .scanline {
            position: absolute;
            width: 100%;
            height: 2px;
            background: #800000;
            top: 0;
            animation: scan 4s linear infinite;
            box-shadow: 0 0 15px #800000;
            opacity: 0.5;
        }
        @keyframes scan {
            0% { top: 0%; }
            100% { top: 100%; }
        }
      `}} />
      
<div className="bg-[#fff8f5] text-[#1e1b18] font-sans overflow-x-hidden">
{/* Top Navigation Bar */}
<header className="fixed top-0 w-full z-50 flex justify-between items-center px-12 h-16 bg-[#fff8f5] dark:bg-[#e1d8d4] border-b border-[#e2bfb9] dark:border-[#8e706c] transition-colors duration-200 ease-in-out">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-[#800000] flex items-center justify-center text-white">
      <span className="material-symbols-outlined text-[18px]">verified_user</span>
    </div>
    <span className="text-xl font-serif font-black text-[#1e1b18] tracking-tight">Redact Review</span>
  </div>
  <div className="flex items-center gap-6">
    <Link href="/login">
      <span className="text-[#5a413d] hover:text-[#800000] font-medium transition-colors cursor-pointer text-sm">Log in</span>
    </Link>
    <Link href="/register">
      <button className="bg-[#1e1b18] text-[#ffffff] px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-sm">
        Get Started
      </button>
    </Link>
  </div>
</header>
<main className="pt-10">
{/* Hero Section */}
<section className="relative min-h-[921px] flex items-center overflow-hidden px-8">
<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_30%,#fbf2ed_0%,transparent_70%)]"></div>
<div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
<div className="space-y-8">
<div className="inline-flex items-center gap-2 px-3 py-1 bg-[#efe6e2] rounded-full border border-[#e2bfb9]">
<span className="w-2 h-2 rounded-full bg-[#570000] animate-pulse"></span>
<span className="text-xs font-mono text-[10px] uppercase tracking-widest text-[#5a413d]">Enterprise Active Protection</span>
</div>
<h1 className="font-serif text-[64px] leading-[1.1] text-[#570000]">
                        Precision Redaction Powered by <span className="italic">Consensus.</span>
</h1>
<p className="text-base text-[#5e5f5d] max-w-xl">
                        A triple-engine verification framework designed for the absolute privacy requirements of legal and healthcare sectors. Eliminate PII leakages through system-wide agreement.
                    </p>
<div className="flex flex-wrap gap-4 pt-4">
<button className="bg-[#570000] text-[#ffffff] px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:shadow-xl transition-all hover:-translate-y-1">
                            Start Your First Scan
                            <span className="material-symbols-outlined">arrow_forward</span>
</button>
<button className="border border-[#570000] text-[#570000] px-8 py-4 rounded-xl font-bold hover:bg-[#570000]/5 transition-all">
                            View Methodology
                        </button>
</div>
</div>
{/* Hero Visual: Document Verification Animation */}
<div className="relative flex justify-center items-center">
<div className="relative w-full max-w-lg aspect-[4/5] bg-[#fbf2ed] rounded-2xl shadow-2xl overflow-hidden border border-[#e2bfb9] hero-float">
{/* Abstract Document Rendering */}
<div className="p-8 space-y-6">
<div className="h-4 bg-[#e2bfb9] w-1/3 rounded"></div>
<div className="space-y-3">
<div className="h-3 bg-[#e2bfb9]/40 w-full rounded"></div>
<div className="h-3 bg-[#e2bfb9]/40 w-5/6 rounded"></div>
<div className="h-3 bg-[#e2bfb9]/40 w-11/12 rounded"></div>
</div>
<div className="flex gap-4">
<div className="h-12 w-32 bg-[#570000] rounded-lg flex items-center justify-center text-white text-[10px] font-mono">SSN DETECTED</div>
<div className="h-12 flex-1 redaction-hatch border border-[#570000]/20 rounded-lg"></div>
</div>
<div className="space-y-3 pt-4">
<div className="h-3 bg-[#e2bfb9]/40 w-full rounded"></div>
<div className="h-3 bg-[#e2bfb9]/40 w-4/5 rounded"></div>
</div>
</div>
<div className="scanline"></div>
{/* Floaters (Status Chips) */}
<div className="absolute top-12 -right-8 bg-white p-4 shadow-lg rounded-xl border border-[#e2bfb9] flex items-center gap-3 animate-bounce" style={{ animationDuration: "5s" }}>
<span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
<div className="text-[12px]">
<p className="font-bold">Engine Match</p>
<p className="text-[#5a413d]">99.8% Confidence</p>
</div>
</div>
<div className="absolute bottom-24 -left-12 bg-white p-4 shadow-lg rounded-xl border border-[#e2bfb9] flex items-center gap-3">
<span className="material-symbols-outlined text-[#570000]" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
<div className="text-[12px]">
<p className="font-bold">Conflict Alert</p>
<p className="text-[#5a413d]">Review Required</p>
</div>
</div>
</div>
</div>
</div>
</section>
{/* Problem Section */}
<section className="py-24 px-8 bg-[#ffffff] border-y border-[#e2bfb9]" id="problem">
<div className="max-w-4xl mx-auto text-center space-y-6">
<h2 className="font-serif text-3xl text-[#570000]">The Cost of a Single Miss</h2>
<p className="text-base text-[#5e5f5d] leading-relaxed">
                    Traditional PII detection systems often fail at the edge cases. A single unredacted passport number or a misplaced medical code isn't just a technical error—it's a multi-million dollar liability and a breach of human trust. False negatives in legacy engines occur because they operate in isolation.
                </p>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
<div className="p-6 rounded-xl border border-[#e2bfb9] hover:border-[#570000] transition-colors text-left">
<span className="material-symbols-outlined text-[#570000] mb-4">psychology_alt</span>
<h4 className="font-bold mb-2">Hallucinations</h4>
<p className="text-sm text-[#5a413d]">Single-model systems often invent metadata or misidentify context, leading to over-redaction or critical misses.</p>
</div>
<div className="p-6 rounded-xl border border-[#e2bfb9] hover:border-[#570000] transition-colors text-left">
<span className="material-symbols-outlined text-[#570000] mb-4">warning</span>
<h4 className="font-bold mb-2">Context Blindness</h4>
<p className="text-sm text-[#5a413d]">Failing to understand the legal or clinical nuance results in data being left vulnerable in the final export.</p>
</div>
<div className="p-6 rounded-xl border border-[#e2bfb9] hover:border-[#570000] transition-colors text-left">
<span className="material-symbols-outlined text-[#570000] mb-4">gavel</span>
<h4 className="font-bold mb-2">Liability Debt</h4>
<p className="text-sm text-[#5a413d]">The regulatory burden falls on your team. Legacy tools offer no guarantee of protection against HIPAA or GDPR breaches.</p>
</div>
</div>
</div>
</section>
{/* Solution: Triple-Engine Consensus */}
<section className="py-32 px-8 bg-[#fff8f5]" id="solution">
<div className="max-w-7xl mx-auto">
<div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
<div className="max-w-2xl">
<span className="text-xs font-mono text-[#570000] font-bold tracking-widest uppercase mb-4 block">The Methodology</span>
<h2 className="font-serif text-[48px] leading-tight text-[#1e1b18]">The Consensus Triple-Engine</h2>
<p className="text-base text-[#5e5f5d] mt-4">We don't rely on one viewpoint. Our system runs three diverse detection engines in parallel. Only through consensus is a redaction confirmed.</p>
</div>
<div className="hidden lg:block">

</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
{/* Engine 1 */}
<div className="relative p-8 bg-[#fff8f5] rounded-2xl border border-[#e2bfb9] overflow-hidden group hover:shadow-xl transition-all">
<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
<span className="material-symbols-outlined text-[80px]">fingerprint</span>
</div>
<h3 className="font-mono text-[#570000] text-[14px] font-bold mb-4">ENGINE_01: PATTERN</h3>
<p className="font-serif text-2xl mb-6">Deterministic Extraction</p>
<p className="text-sm text-[#5e5f5d] mb-8">High-speed regex and structural analysis for known formats like IBAN, SSN, and Tax IDs.</p>
<div className="h-1 bg-[#e2bfb9] rounded-full overflow-hidden">
<div className="h-full bg-[#570000] w-[95%]"></div>
</div>
</div>
{/* Engine 2 */}
<div className="relative p-8 bg-[#fff8f5] rounded-2xl border border-[#e2bfb9] overflow-hidden group hover:shadow-xl transition-all">
<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
<span className="material-symbols-outlined text-[80px]">description</span>
</div>
<h3 className="font-mono text-[#570000] text-[14px] font-bold mb-4">ENGINE_02: CONTEXT</h3>
<p className="font-serif text-2xl mb-6">Semantic Mapping</p>
<p className="text-sm text-[#5e5f5d] mb-8">Analyzes the surrounding language to identify sensitive entities hidden in plain prose.</p>
<div className="h-1 bg-[#e2bfb9] rounded-full overflow-hidden">
<div className="h-full bg-[#570000] w-[88%]"></div>
</div>
</div>
{/* Engine 3 */}
<div className="relative p-8 bg-[#efe6e2] rounded-2xl border-2 border-[#570000]/20 overflow-hidden group hover:shadow-xl transition-all">
<div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
<span className="material-symbols-outlined text-[#570000] text-[80px]">hub</span>
</div>
<h3 className="font-mono text-[#570000] text-[14px] font-bold mb-4">ENGINE_03: CONSENSUS</h3>
<p className="font-serif text-2xl mb-6">The Arbiter</p>
<p className="text-sm text-[#5e5f5d] mb-8">Aggregates ENGINE_01 and ENGINE_02, flagging discrepancies for human validation.</p>
<div className="h-1 bg-[#570000] rounded-full overflow-hidden">
<div className="h-full bg-white/30 w-full animate-pulse"></div>
</div>
</div>
</div>
</div>
</section>
{/* Bento Grid Features */}
<section className="py-24 px-8 bg-[#fbf2ed]" id="features">
<div className="max-w-7xl mx-auto">
<div className="grid grid-cols-1 md:grid-cols-12 grid-rows-2 gap-4 h-auto md:h-[800px]">
{/* Feature 1: Workspace */}
<div className="md:col-span-8 md:row-span-1 bg-white rounded-2xl border border-[#e2bfb9] p-10 flex flex-col justify-between hover:shadow-lg transition-shadow">
<div>
<h3 className="font-serif text-3xl text-[#570000] mb-4">Review Workspace</h3>
<p className="text-base text-[#5e5f5d] max-w-lg">Designed for legal reviewers. Side-by-side consensus mapping with "Second Opinion" smart alerts that automatically pause when engines disagree.</p>
</div>
<div className="mt-8 relative h-48 bg-[#fbf2ed] rounded-lg overflow-hidden border border-[#e2bfb9] flex items-center justify-center">
<div className="w-full h-full bg-cover bg-center opacity-80" data-alt="A sophisticated digital interface of a professional document redaction software. The screen shows a legal document with several maroon rectangular blocks covering sensitive information. On the right, a clean panel shows confidence scores and consensus status. The color palette is composed of warm beiges, deep maroons, and clean whites, radiating a sense of security and professional precision." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDq9XglmFmj_GzhXKVvNZnVZvGClvXm7XLgMubsJ_-QSjVOUnKwXi8_Gzb6dFBMxXBxhYc1hIzNO_Qk0ProwmWrEkoLLilC4k1vpZU0YDhGZQOQEyLtKa3xKcbLjf5cnZi__sbjyEZY35x1FA_tnsdpSJun5H3epYhfbi-LmMAlu6D-vgB2R89pAuhSOcwW-LBTnKL7koZIhNzlbenTWuNFx1Gk6PForRyd0W4vXbGccZGJO6P2Si84EIlaSvKkmIFW2FnGalANmd2N')" }}></div>
</div>
</div>
{/* Feature 2: Severity Engine */}
<div className="md:col-span-4 md:row-span-2 bg-[#570000] text-[#ffffff] rounded-2xl p-10 flex flex-col justify-between overflow-hidden relative group">
<div className="z-10">
<h3 className="font-serif text-3xl mb-4">Severity Engine</h3>
<p className="text-[#ffffff]/80">Prioritize the highest-risk documents in your queue. Our system calculates a risk-velocity score based on PII density and data sensitivity.</p>
</div>
<div className="mt-12 z-10">
<div className="space-y-4">
<div className="bg-white/10 p-4 rounded-xl border border-white/20">
<div className="flex justify-between mb-2">
<span className="text-[12px] font-mono">Critical (SSNs)</span>
<span className="text-[12px] font-mono">High</span>
</div>
<div className="h-2 bg-white/20 rounded-full">
<div className="h-full bg-white w-full"></div>
</div>
</div>
<div className="bg-white/10 p-4 rounded-xl border border-white/20">
<div className="flex justify-between mb-2">
<span className="text-[12px] font-mono">Names / Dates</span>
<span className="text-[12px] font-mono">Med</span>
</div>
<div className="h-2 bg-white/20 rounded-full">
<div className="h-full bg-white w-1/3"></div>
</div>
</div>
</div>
</div>
<div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
<span className="material-symbols-outlined text-[240px]">shield</span>
</div>
</div>
{/* Feature 3: Readiness Score */}
<div className="md:col-span-4 md:row-span-1 bg-[#e9e1dc] rounded-2xl border border-[#e2bfb9] p-10 flex flex-col justify-between">
<div>
<h3 className="font-serif text-2xl text-[#570000] mb-2">Privacy Readiness</h3>
<p className="text-sm text-[#5a413d]">A live 0-100% confidence meter that calculates export readiness in real-time.</p>
</div>
<div className="flex items-center gap-4 mt-6">
<div className="w-16 h-16 rounded-full border-4 border-[#570000] flex items-center justify-center font-black text-[#570000]">98%</div>
<span className="text-xs font-mono text-[10px] text-[#570000] font-bold">READY FOR EXPORT</span>
</div>
</div>
{/* Feature 4: Compliance Logic */}
<div className="md:col-span-4 md:row-span-1 bg-white rounded-2xl border border-[#e2bfb9] p-10 flex flex-col justify-between">
<div>
<h3 className="font-serif text-2xl text-[#570000] mb-2">Compliance Logic</h3>
<p className="text-sm text-[#5a413d]">Switch between HIPAA, GDPR, or FERPA profiles with one click to adjust detection sensitivity.</p>
</div>
<div className="flex gap-2 mt-6">
<div className="px-3 py-1 bg-[#fbf2ed] border border-[#e2bfb9] rounded-full text-[10px] font-bold">HIPAA</div>
<div className="px-3 py-1 bg-[#fbf2ed] border border-[#e2bfb9] rounded-full text-[10px] font-bold">GDPR</div>
<div className="px-3 py-1 bg-[#570000] text-white rounded-full text-[10px] font-bold">SOC2</div>
</div>
</div>
</div>
</div>
</section>
{/* Trust & Compliance Section */}
<section className="py-24 px-8 bg-[#fff8f5] border-t border-[#e2bfb9]" id="trust">
<div className="max-w-7xl mx-auto">
<div className="text-center mb-16">
<h2 className="font-serif text-3xl text-[#570000] mb-4">Enterprise Trust by Design</h2>
<p className="text-[#5e5f5d]">Securing the most sensitive data workflows globally.</p>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
<div className="flex flex-col items-center gap-4">
<span className="material-symbols-outlined text-[48px] text-[#570000]">verified_user</span>
<span className="font-bold tracking-widest text-[12px]">HIPAA COMPLIANT</span>
</div>
<div className="flex flex-col items-center gap-4">
<span className="material-symbols-outlined text-[48px] text-[#570000]">security</span>
<span className="font-bold tracking-widest text-[12px]">SOC 2 TYPE II</span>
</div>
<div className="flex flex-col items-center gap-4">
<span className="material-symbols-outlined text-[48px] text-[#570000]">public</span>
<span className="font-bold tracking-widest text-[12px]">GDPR READY</span>
</div>
<div className="flex flex-col items-center gap-4">
<span className="material-symbols-outlined text-[48px] text-[#570000]">lock</span>
<span className="font-bold tracking-widest text-[12px]">AES-256 ENCRYPTION</span>
</div>
</div>
<div className="mt-20 p-12 bg-[#fbf2ed] rounded-3xl border border-[#e2bfb9] flex flex-col md:flex-row items-center gap-12">
<div className="flex-1 space-y-6">
<h3 className="font-serif text-2xl text-[#1e1b18]">Data Sovereignty</h3>
<p className="text-base text-[#5e5f5d]">
                            Redact Review is built for on-premise or VPC deployments. Your documents never leave your security perimeter—the Engines come to you.
                        </p>
<ul className="space-y-3">
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#570000] text-[18px]">check</span>
                                No-logs processing policy
                            </li>
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#570000] text-[18px]">check</span>
                                Air-gapped deployment options
                            </li>
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#570000] text-[18px]">check</span>
                                Granular IAM controls
                            </li>
</ul>
</div>
<div className="w-full md:w-[400px] aspect-video rounded-2xl overflow-hidden shadow-xl border border-[#8e706c]">
<div className="w-full h-full bg-cover bg-center" data-alt="A clean and modern architectural representation of a secure server room. The perspective is from eye-level looking down a row of sleek server racks with subtle maroon LED status lights. The room is brightly lit with a clean, light-mode aesthetic, emphasizing modern technology, security, and enterprise-grade reliability." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAy1sD3A53bV8hN-ZRX_lEf4gXUnCsods_Ha24qLoTXJqeMCccpEi-38WoNk7qw5QKQs-_M6pcqY49Agsb8MxbVQj4J2Vuuc5P5Usel2Q80rnpqluORHTEca7XxsPAFFHQSR_mFIk5gJQcfd2sDn5N2mZ8z85aSPOxiexkhKXJHt2dPPNpASpIQzqBKM0zrxiDBvOsb_iQm3I3aIZ3OOJWNhBTTjfwiuoUqY3wJHkSpAfPyw_9rSzGl6uHV9-tejWIVMnf3zSrzfRKn')" }}></div>
</div>
</div>
</div>
</section>
{/* Final CTA Section */}
<section className="relative py-32 px-8 bg-[#570000] text-[#ffffff] text-center overflow-hidden">

<div className="relative z-10 max-w-3xl mx-auto space-y-10">
<h2 className="font-serif text-[56px] leading-tight">Ready to verify your privacy readiness?</h2>
<p className="text-base text-[#ffffff]/80">
                    Join leading law firms and healthcare providers who trust Redact Review for their high-stakes document workflows.
                </p>
<div className="flex flex-col sm:flex-row gap-4 justify-center">
<button className="bg-white text-[#570000] px-10 py-5 rounded-2xl font-bold text-[18px] hover:shadow-2xl transition-all hover:scale-105">
                        Request Enterprise Access
                    </button>
<button className="border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-[18px] hover:bg-white/10 transition-all">
                        Speak with a Specialist
                    </button>
</div>
<p className="text-xs font-mono text-[12px] opacity-60">NO SYSTEM TRAINING REQUIRED. UP AND RUNNING IN 24 HOURS.</p>
</div>
</section>
</main>
{/* Footer */}
<footer className="bg-[#fff8f5] py-20 px-8 border-t border-[#e2bfb9]">
<div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-12">
<div className="col-span-2">
<span className="text-2xl font-black text-[#570000] tracking-tight mb-6 block">Redact Review</span>
<p className="text-sm text-[#5e5f5d] max-w-xs mb-8">
                    The authoritative standard for multi-engine document redaction and privacy compliance.
                </p>
<div className="flex gap-4">
<div className="w-10 h-10 rounded-lg bg-[#efe6e2] border border-[#e2bfb9] flex items-center justify-center text-[#570000]">
<span className="material-symbols-outlined">alternate_email</span>
</div>
<div className="w-10 h-10 rounded-lg bg-[#efe6e2] border border-[#e2bfb9] flex items-center justify-center text-[#570000]">
<span className="material-symbols-outlined">share</span>
</div>
</div>
</div>
<div>
<h4 className="font-bold mb-6">Platform</h4>
<ul className="space-y-4 text-sm text-[#5e5f5d]">
<li><a className="hover:text-[#570000]" href="/">Consensus Engine</a></li>
<li><a className="hover:text-[#570000]" href="/">Review Workspace</a></li>
<li><a className="hover:text-[#570000]" href="/">API Documentation</a></li>
<li><a className="hover:text-[#570000]" href="/">Integration Hub</a></li>
</ul>
</div>
<div>
<h4 className="font-bold mb-6">Company</h4>
<ul className="space-y-4 text-sm text-[#5e5f5d]">
<li><a className="hover:text-[#570000]" href="/">Security Docs</a></li>
<li><a className="hover:text-[#570000]" href="/">Methodology</a></li>
<li><a className="hover:text-[#570000]" href="/">Privacy Policy</a></li>
<li><a className="hover:text-[#570000]" href="/">Case Studies</a></li>
</ul>
</div>
<div>
<h4 className="font-bold mb-6">Support</h4>
<ul className="space-y-4 text-sm text-[#5e5f5d]">
<li><a className="hover:text-[#570000]" href="/">Enterprise Support</a></li>
<li><a className="hover:text-[#570000]" href="/">System Status</a></li>
<li><a className="hover:text-[#570000]" href="/">Compliance Help</a></li>
<li><a className="hover:text-[#570000]" href="/">Contact Sales</a></li>
</ul>
</div>
</div>
<div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[#e2bfb9] flex flex-col md:flex-row justify-between items-center gap-4">
<p className="text-xs font-mono text-[10px] text-[#5e5f5d]">© 2024 REDACT REVIEW. ALL RIGHTS RESERVED.</p>
<div className="flex gap-8 text-xs font-mono text-[10px] text-[#5e5f5d]">
<a className="hover:text-[#570000]" href="/">TERMS</a>
<a className="hover:text-[#570000]" href="/">PRIVACY</a>
<a className="hover:text-[#570000]" href="/">COOKIES</a>
</div>
</div>
</footer>
</div>

    </>
  );
}
