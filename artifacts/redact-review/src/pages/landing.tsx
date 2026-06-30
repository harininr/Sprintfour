import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [counters, setCounters] = useState({ docs: 0, accuracy: 0, clients: 0, speed: 0 });
  const [typedText, setTypedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);

  // Full typewriter text
  const fullText = "Precision Redaction Powered by Consensus.";

  // --- Typewriter Effect ---
  useEffect(() => {
    let index = 0;
    let timeout: NodeJS.Timeout;
    const type = () => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
        timeout = setTimeout(type, 45);
      } else {
        setIsTypingComplete(true);
      }
    };
    // Start after a small delay
    const startTimeout = setTimeout(type, 600);
    return () => {
      clearTimeout(timeout);
      clearTimeout(startTimeout);
    };
  }, []);

  // --- Scroll Progress & Back to Top ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
      setShowBackToTop(scrollTop > 500);

      // Stats animation trigger
      if (statsRef.current) {
        const rect = statsRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.75 && !hasAnimatedStats) {
          setHasAnimatedStats(true);
          animateCounters();
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasAnimatedStats]);

  // --- Counter Animation ---
  const animateCounters = useCallback(() => {
    const targets = { docs: 1247, accuracy: 99.8, clients: 892, speed: 47 };
    const duration = 2000;
    const startTime = performance.now();

    const updateCounters = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounters({
        docs: Math.floor(targets.docs * ease),
        accuracy: Math.min(targets.accuracy * ease, targets.accuracy),
        clients: Math.floor(targets.clients * ease),
        speed: Math.floor(targets.speed * ease),
      });

      if (progress < 1) {
        requestAnimationFrame(updateCounters);
      } else {
        setCounters({
          docs: targets.docs,
          accuracy: targets.accuracy,
          clients: targets.clients,
          speed: targets.speed,
        });
      }
    };
    requestAnimationFrame(updateCounters);
  }, []);

  // --- Dark Mode Toggle ---
  useEffect(() => {
    const saved = localStorage.getItem("redactDarkMode");
    if (saved === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("redactDarkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  // --- Modal ---
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // --- FAQ Toggle ---
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // --- Mobile menu toggle ---
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // --- Smooth scroll for anchor links ---
  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute("href");
        if (targetId && targetId !== "#") {
          const target = document.querySelector(targetId);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
        setIsMobileMenuOpen(false);
      });
    });
  }, []);

  // --- Observer for section animations ---
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      el.classList.add("transition-all", "duration-700", "ease-out", "opacity-0", "translate-y-10");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // --- Ripple effect on buttons ---
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add("ripple");
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <>
      {/* --- Meta & CDN Links --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:opsz@14..32&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
            .font-serif { font-family: 'Playfair Display', serif; }
            .font-sans { font-family: 'Inter', sans-serif; }
          `,
        }}
      />

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* --- Base --- */
            * { box-sizing: border-box; }
            html { scroll-behavior: smooth; }
            body { 
              font-family: 'Inter', sans-serif;
              transition: background-color 0.3s, color 0.3s;
            }
            .dark body { background: #1a1412; color: #f0e8e4; }

            /* --- Glass Panel --- */
            .glass-panel {
              background: rgba(255, 255, 255, 0.7);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(229, 229, 224, 0.5);
            }
            .dark .glass-panel {
              background: rgba(30, 27, 24, 0.8);
              border-color: rgba(120, 100, 96, 0.3);
            }

            /* --- Text Gradient --- */
            .text-gradient-maroon {
              background: linear-gradient(135deg, #800000 0%, #570000 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .dark .text-gradient-maroon {
              background: linear-gradient(135deg, #b8860b 0%, #d4a574 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }

            /* --- Redaction Hatch --- */
            .redaction-hatch {
              background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(128,0,0,0.1) 5px, rgba(128,0,0,0.1) 10px);
            }
            .dark .redaction-hatch {
              background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(200,150,100,0.15) 5px, rgba(200,150,100,0.15) 10px);
            }

            /* --- Hero Float --- */
            .hero-float {
              animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }

            /* --- Scanline --- */
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
            .dark .scanline {
              background: #b8860b;
              box-shadow: 0 0 15px #b8860b;
            }
            @keyframes scan {
              0% { top: 0%; }
              100% { top: 100%; }
            }

            /* --- Ripple --- */
            .ripple {
              position: absolute;
              border-radius: 50%;
              background: rgba(255,255,255,0.3);
              transform: scale(0);
              animation: rippleAnim 0.6s linear forwards;
              pointer-events: none;
            }
            @keyframes rippleAnim {
              to { transform: scale(4); opacity: 0; }
            }
            .dark .ripple { background: rgba(255,215,180,0.2); }

            /* --- Scroll Progress --- */
            .scroll-progress {
              position: fixed;
              top: 0;
              left: 0;
              height: 3px;
              background: linear-gradient(90deg, #800000, #b8860b);
              z-index: 9999;
              transition: width 0.1s;
              box-shadow: 0 0 20px rgba(128,0,0,0.3);
            }
            .dark .scroll-progress {
              background: linear-gradient(90deg, #b8860b, #d4a574);
            }

            /* --- Back to Top --- */
            .back-to-top {
              position: fixed;
              bottom: 30px;
              right: 30px;
              z-index: 999;
              opacity: 0;
              transform: translateY(20px);
              transition: opacity 0.3s, transform 0.3s, background 0.3s;
              pointer-events: none;
            }
            .back-to-top.visible {
              opacity: 1;
              transform: translateY(0);
              pointer-events: all;
            }
            .back-to-top button {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: #800000;
              color: #fff;
              border: none;
              cursor: pointer;
              box-shadow: 0 4px 20px rgba(128,0,0,0.4);
              transition: transform 0.2s, box-shadow 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .back-to-top button:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 30px rgba(128,0,0,0.5);
            }
            .dark .back-to-top button {
              background: #b8860b;
              box-shadow: 0 4px 20px rgba(184,134,11,0.4);
            }

            /* --- Mobile Menu --- */
            .mobile-menu {
              position: fixed;
              top: 0;
              right: -100%;
              width: 300px;
              height: 100vh;
              background: #fff8f5;
              z-index: 1000;
              transition: right 0.4s cubic-bezier(0.22, 1, 0.36, 1);
              padding: 80px 30px 30px;
              box-shadow: -10px 0 40px rgba(0,0,0,0.1);
              overflow-y: auto;
            }
            .dark .mobile-menu {
              background: #1a1412;
              box-shadow: -10px 0 40px rgba(0,0,0,0.4);
            }
            .mobile-menu.open {
              right: 0;
            }
            .mobile-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.4);
              z-index: 999;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.4s;
            }
            .mobile-overlay.open {
              opacity: 1;
              pointer-events: all;
            }

            /* --- Modal --- */
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.6);
              backdrop-filter: blur(8px);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.3s;
              padding: 20px;
            }
            .modal-overlay.open {
              opacity: 1;
              pointer-events: all;
            }
            .modal-content {
              background: #fff8f5;
              border-radius: 24px;
              max-width: 500px;
              width: 100%;
              padding: 40px;
              transform: scale(0.95);
              transition: transform 0.3s;
              position: relative;
              max-height: 90vh;
              overflow-y: auto;
            }
            .dark .modal-content {
              background: #1a1412;
              border: 1px solid rgba(120,100,96,0.3);
            }
            .modal-overlay.open .modal-content {
              transform: scale(1);
            }
            .modal-close {
              position: absolute;
              top: 16px;
              right: 16px;
              background: none;
              border: none;
              font-size: 24px;
              color: #5a413d;
              cursor: pointer;
              padding: 8px;
              border-radius: 50%;
              transition: background 0.2s;
            }
            .dark .modal-close { color: #d4c5be; }
            .modal-close:hover { background: rgba(128,0,0,0.08); }

            /* --- FAQ --- */
            .faq-item {
              border-bottom: 1px solid #e2bfb9;
              padding: 20px 0;
              cursor: pointer;
              transition: border-color 0.3s;
            }
            .dark .faq-item { border-color: rgba(120,100,96,0.3); }
            .faq-item:last-child { border-bottom: none; }
            .faq-question {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-weight: 600;
              font-size: 1.05rem;
              color: #1e1b18;
            }
            .dark .faq-question { color: #f0e8e4; }
            .faq-question span {
              transition: transform 0.3s;
              font-size: 1.5rem;
            }
            .faq-item.open .faq-question span { transform: rotate(180deg); }
            .faq-answer {
              max-height: 0;
              overflow: hidden;
              transition: max-height 0.4s ease, padding 0.3s ease;
              color: #5e5f5d;
              font-size: 0.95rem;
              line-height: 1.7;
            }
            .dark .faq-answer { color: #c4b8b2; }
            .faq-item.open .faq-answer {
              max-height: 300px;
              padding-top: 16px;
            }

            /* --- Testimonial Card --- */
            .testimonial-card {
              background: #ffffff;
              border-radius: 16px;
              padding: 28px;
              border: 1px solid #e2bfb9;
              transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
            }
            .dark .testimonial-card {
              background: #241e1b;
              border-color: rgba(120,100,96,0.3);
            }
            .testimonial-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 12px 40px rgba(128,0,0,0.08);
              border-color: #800000;
            }
            .dark .testimonial-card:hover {
              box-shadow: 0 12px 40px rgba(0,0,0,0.3);
              border-color: #b8860b;
            }

            /* --- Pricing Card --- */
            .pricing-card {
              background: #ffffff;
              border-radius: 20px;
              padding: 32px;
              border: 1px solid #e2bfb9;
              transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
              position: relative;
            }
            .dark .pricing-card {
              background: #241e1b;
              border-color: rgba(120,100,96,0.3);
            }
            .pricing-card.featured {
              border-color: #800000;
              border-width: 2px;
              background: #fff8f5;
            }
            .dark .pricing-card.featured {
              border-color: #b8860b;
              background: #1a1412;
            }
            .pricing-card:hover {
              transform: translateY(-6px);
              box-shadow: 0 20px 60px rgba(128,0,0,0.1);
            }
            .dark .pricing-card:hover {
              box-shadow: 0 20px 60px rgba(0,0,0,0.4);
            }
            .pricing-badge {
              position: absolute;
              top: -12px;
              right: 20px;
              background: #800000;
              color: #fff;
              padding: 4px 16px;
              border-radius: 20px;
              font-size: 0.7rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .dark .pricing-badge { background: #b8860b; }

            /* --- Step Connector --- */
            .step-connector {
              width: 2px;
              height: 40px;
              background: linear-gradient(to bottom, #800000, transparent);
              margin: 0 auto;
            }
            .dark .step-connector {
              background: linear-gradient(to bottom, #b8860b, transparent);
            }

            /* --- Responsive tweaks --- */
            @media (max-width: 768px) {
              .hero-title { font-size: 2.5rem !important; }
              .hero-section { min-height: auto !important; padding: 120px 0 60px !important; }
              .bento-grid { grid-template-columns: 1fr !important; grid-auto-rows: auto !important; height: auto !important; }
              .bento-grid > div { min-height: 200px; }
              .back-to-top { bottom: 20px; right: 20px; }
              .back-to-top button { width: 40px; height: 40px; font-size: 18px; }
              .pricing-grid { grid-template-columns: 1fr !important; }
              .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 20px; }
              .trust-grid { grid-template-columns: 1fr 1fr !important; gap: 24px; }
              .footer-grid { grid-template-columns: 1fr !important; gap: 32px; }
              .modal-content { padding: 28px; margin: 16px; }
            }
            @media (max-width: 480px) {
              .stats-grid { grid-template-columns: 1fr !important; }
              .trust-grid { grid-template-columns: 1fr 1fr !important; gap: 16px; }
              .trust-grid span { font-size: 10px !important; }
            }

            /* --- Dark mode overrides --- */
            .dark .bg-\\[\\#fff8f5\\] { background: #1a1412; }
            .dark .bg-\\[\\#ffffff\\] { background: #1e1815; }
            .dark .bg-\\[\\#fbf2ed\\] { background: #1e1815; }
            .dark .bg-\\[\\#efe6e2\\] { background: #2a221e; }
            .dark .bg-\\[\\#e9e1dc\\] { background: #2a221e; }
            .dark .border-\\[\\#e2bfb9\\] { border-color: rgba(120,100,96,0.3); }
            .dark .text-\\[\\#1e1b18\\] { color: #f0e8e4; }
            .dark .text-\\[\\#5e5f5d\\] { color: #c4b8b2; }
            .dark .text-\\[\\#5a413d\\] { color: #d4c5be; }
            .dark .text-\\[\\#570000\\] { color: #d4a574; }
            .dark .bg-\\[\\#570000\\] { background: #b8860b; }
            .dark .border-\\[\\#570000\\] { border-color: #b8860b; }
            .dark .text-\\[\\#570000\\]\\/20 { color: rgba(184,134,11,0.2); }
            .dark .bg-\\[\\#570000\\]\\/5 { background: rgba(184,134,11,0.1); }
            .dark .border-\\[\\#570000\\]\\/20 { border-color: rgba(184,134,11,0.2); }
            .dark .bg-\\[\\#800000\\] { background: #b8860b; }
            .dark .bg-white\\/10 { background: rgba(255,255,255,0.05); }
            .dark .bg-white\\/20 { background: rgba(255,255,255,0.08); }
            .dark .bg-white\\/30 { background: rgba(255,255,255,0.1); }
            .dark .text-\\[\\#ffffff\\]\\/80 { color: rgba(255,255,255,0.7); }
            .dark .bg-\\[\\#fbf2ed\\]\\/50 { background: rgba(30,24,21,0.5); }
            .dark .hover\\:bg-\\[\\#570000\\]\\/5:hover { background: rgba(184,134,11,0.1); }
            .dark .hover\\:border-\\[\\#570000\\]:hover { border-color: #b8860b; }
            .dark .hover\\:text-\\[\\#570000\\]:hover { color: #d4a574; }
            .dark .bg-\\[\\#e2bfb9\\]\\/40 { background: rgba(120,100,96,0.2); }
            .dark .bg-\\[\\#e2bfb9\\] { background: rgba(120,100,96,0.3); }
            .dark .border-\\[\\#8e706c\\] { border-color: rgba(120,100,96,0.3); }
            .dark .bg-\\[\\#fbf2ed\\] { background: #1e1815; }
            .dark .bg-\\[\\#fff8f5\\] { background: #1a1412; }
            .dark .bg-\\[\\#efe6e2\\] { background: #2a221e; }
            .dark .text-\\[\\#ffffff\\] { color: #f0e8e4; }
            .dark .text-\\[\\#ffffff\\]\\/80 { color: rgba(240,232,228,0.7); }
            .dark .bg-\\[\\#570000\\]\\/20 { background: rgba(184,134,11,0.15); }
            .dark .border-\\[\\#570000\\]\\/20 { border-color: rgba(184,134,11,0.2); }
            .dark .shadow-xl { box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
            .dark .shadow-2xl { box-shadow: 0 30px 80px rgba(0,0,0,0.5); }
            .dark .shadow-lg { box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
            .dark .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
            .dark .bg-\\[\\#570000\\]\\/10 { background: rgba(184,134,11,0.1); }
            .dark .hover\\:bg-\\[\\#570000\\]\\/10:hover { background: rgba(184,134,11,0.15); }
            .dark .border-white\\/20 { border-color: rgba(255,255,255,0.08); }
            .dark .border-white\\/30 { border-color: rgba(255,255,255,0.1); }
            .dark .text-\\[\\#ffffff\\]\\/80 { color: rgba(240,232,228,0.7); }
            .dark .text-green-600 { color: #7cb87c !important; }

            /* --- Smooth section reveal --- */
            .section-reveal {
              transition: opacity 0.8s ease, transform 0.8s ease;
            }

            /* --- Custom scrollbar --- */
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: #f0e8e4; }
            ::-webkit-scrollbar-thumb { background: #800000; border-radius: 3px; }
            .dark ::-webkit-scrollbar-track { background: #1a1412; }
            .dark ::-webkit-scrollbar-thumb { background: #b8860b; }

            /* --- Hero BG gradient --- */
            .hero-bg-gradient {
              background: radial-gradient(circle at 70% 30%, #fbf2ed 0%, transparent 70%);
            }
            .dark .hero-bg-gradient {
              background: radial-gradient(circle at 70% 30%, rgba(184,134,11,0.08) 0%, transparent 70%);
            }

            /* --- Floating shapes --- */
            .floating-shape {
              position: absolute;
              border-radius: 50%;
              opacity: 0.04;
              pointer-events: none;
              z-index: 0;
            }
            .dark .floating-shape { opacity: 0.06; }

            /* --- Stats number --- */
            .stat-number {
              font-variant-numeric: tabular-nums;
            }

            /* --- Button hover glow --- */
            .btn-glow {
              transition: box-shadow 0.3s, transform 0.2s;
            }
            .btn-glow:hover {
              box-shadow: 0 0 30px rgba(128,0,0,0.2);
            }
            .dark .btn-glow:hover {
              box-shadow: 0 0 30px rgba(184,134,11,0.2);
            }

            /* --- Typewriter cursor --- */
            .typewriter-cursor {
              display: inline-block;
              width: 2px;
              height: 1.1em;
              background: #800000;
              margin-left: 4px;
              vertical-align: text-bottom;
              animation: blink 1s step-end infinite;
            }
            .dark .typewriter-cursor { background: #b8860b; }
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }

            /* --- Mobile nav link --- */
            .mobile-nav-link {
              display: block;
              padding: 12px 0;
              font-size: 1.1rem;
              font-weight: 500;
              color: #1e1b18;
              border-bottom: 1px solid #e2bfb9;
              transition: color 0.2s, border-color 0.2s;
            }
            .dark .mobile-nav-link {
              color: #f0e8e4;
              border-bottom-color: rgba(120,100,96,0.2);
            }
            .mobile-nav-link:hover { color: #800000; }
            .dark .mobile-nav-link:hover { color: #d4a574; }

            /* --- Hero document card --- */
            .hero-doc-card {
              background: #fbf2ed;
              border-radius: 16px;
              border: 1px solid #e2bfb9;
              transition: transform 0.3s, box-shadow 0.3s;
            }
            .dark .hero-doc-card {
              background: #1e1815;
              border-color: rgba(120,100,96,0.3);
            }
            .hero-doc-card:hover {
              transform: scale(1.01);
              box-shadow: 0 20px 60px rgba(128,0,0,0.08);
            }
            .dark .hero-doc-card:hover {
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
          `,
        }}
      />

      {/* --- Scroll Progress --- */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* --- Back to Top --- */}
      <div className={`back-to-top ${showBackToTop ? "visible" : ""}`}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      </div>

      {/* --- Mobile Overlay --- */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={toggleMobileMenu}
      />

      {/* --- Mobile Menu --- */}
      <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <button
          onClick={toggleMobileMenu}
          className="absolute top-4 right-4 text-[#5a413d] dark:text-[#d4c5be] p-2"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <div className="mb-8">
          <span className="text-2xl font-serif font-black text-[#570000] dark:text-[#d4a574]">
            Redact Review
          </span>
        </div>
        <nav className="space-y-1">
          <a href="#problem" className="mobile-nav-link">The Problem</a>
          <a href="#solution" className="mobile-nav-link">The Solution</a>
          <a href="#features" className="mobile-nav-link">Features</a>
          <a href="#trust" className="mobile-nav-link">Trust & Compliance</a>
          <a href="#pricing" className="mobile-nav-link">Pricing</a>
          <a href="#testimonials" className="mobile-nav-link">Testimonials</a>
          <a href="#faq" className="mobile-nav-link">FAQ</a>
        </nav>
        <div className="mt-8 pt-8 border-t border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)] space-y-4">
          <Link href="/login">
            <span className="block text-center text-[#5a413d] dark:text-[#d4c5be] font-medium">Log in</span>
          </Link>
          <Link href="/register">
            <button className="w-full bg-[#1e1b18] dark:bg-[#b8860b] text-[#ffffff] px-6 py-3 rounded-full font-semibold text-sm">
              Get Started
            </button>
          </Link>
        </div>
      </div>

      {/* --- Modal --- */}
      <div className={`modal-overlay ${isModalOpen ? "open" : ""}`} onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal} aria-label="Close modal">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#800000] dark:bg-[#b8860b] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl">verified_user</span>
            </div>
            <h3 className="font-serif text-2xl text-[#1e1b18] dark:text-[#f0e8e4]">
              Request Enterprise Access
            </h3>
            <p className="text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">
              Get a personalized demo and start your privacy readiness assessment.
            </p>
          </div>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] bg-white dark:bg-[#241e1b] text-[#1e1b18] dark:text-[#f0e8e4] focus:outline-none focus:ring-2 focus:ring-[#800000] dark:focus:ring-[#b8860b] transition"
            />
            <input
              type="email"
              placeholder="Work Email"
              className="w-full px-4 py-3 rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] bg-white dark:bg-[#241e1b] text-[#1e1b18] dark:text-[#f0e8e4] focus:outline-none focus:ring-2 focus:ring-[#800000] dark:focus:ring-[#b8860b] transition"
            />
            <select className="w-full px-4 py-3 rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] bg-white dark:bg-[#241e1b] text-[#1e1b18] dark:text-[#f0e8e4] focus:outline-none focus:ring-2 focus:ring-[#800000] dark:focus:ring-[#b8860b] transition">
              <option value="">Organization Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-1000">201-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
            <button
              type="submit"
              className="w-full bg-[#570000] dark:bg-[#b8860b] text-white py-3 rounded-xl font-bold hover:opacity-90 transition active:scale-95 relative overflow-hidden"
              onClick={createRipple}
            >
              Submit Request
            </button>
          </form>
          <p className="text-xs text-center text-[#5e5f5d] dark:text-[#c4b8b2] mt-4">
            By submitting, you agree to our privacy policy. We'll never share your data.
          </p>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="bg-[#fff8f5] dark:bg-[#1a1412] text-[#1e1b18] dark:text-[#f0e8e4] font-sans overflow-x-hidden transition-colors duration-300">

        {/* --- Top Navigation Bar --- */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 sm:px-8 lg:px-12 h-16 bg-[#fff8f5] dark:bg-[#1a1412] border-b border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)] transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#800000] dark:bg-[#b8860b] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <span className="text-xl font-serif font-black text-[#1e1b18] dark:text-[#f0e8e4] tracking-tight">
              Redact Review
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login">
              <span className="text-[#5a413d] dark:text-[#d4c5be] hover:text-[#800000] dark:hover:text-[#d4a574] font-medium transition-colors cursor-pointer text-sm">
                Log in
              </span>
            </Link>
            <Link href="/register">
              <button className="bg-[#1e1b18] dark:bg-[#b8860b] text-[#ffffff] px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-sm relative overflow-hidden">
                Get Started
              </button>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-full border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center justify-center text-[#5a413d] dark:text-[#d4c5be] hover:bg-[#efe6e2] dark:hover:bg-[#2a221e] transition"
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-full border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center justify-center text-[#5a413d] dark:text-[#d4c5be]"
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              onClick={toggleMobileMenu}
              className="w-9 h-9 rounded-full border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center justify-center text-[#5a413d] dark:text-[#d4c5be]"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          </div>
        </header>

        <main className="pt-16">
          {/* --- Hero Section --- */}
          <section
            ref={heroRef}
            className="relative min-h-[880px] md:min-h-[921px] flex items-center overflow-hidden px-4 sm:px-8 hero-section pt-20 pb-12"
          >
            <div className="absolute inset-0 -z-10 hero-bg-gradient" />
            {/* Floating shapes */}
            <div className="floating-shape w-[300px] h-[300px] bg-[#800000] -top-20 -left-20" />
            <div className="floating-shape w-[200px] h-[200px] bg-[#570000] bottom-40 right-10" />
            <div className="floating-shape w-[400px] h-[400px] bg-[#800000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
              <div className="space-y-6 md:space-y-8 animate-on-scroll">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#efe6e2] dark:bg-[#2a221e] rounded-full border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-[#570000] dark:bg-[#b8860b] animate-pulse" />
                  <span className="text-xs font-mono text-[10px] uppercase tracking-widest text-[#5a413d] dark:text-[#d4c5be]">
                    Enterprise Active Protection
                  </span>
                </div>

                <h1 className="font-serif text-[40px] sm:text-[50px] lg:text-[64px] leading-[1.1] text-[#570000] dark:text-[#d4a574] hero-title">
                  {typedText}
                  {!isTypingComplete && <span className="typewriter-cursor" />}
                </h1>

                <p className="text-base text-[#5e5f5d] dark:text-[#c4b8b2] max-w-xl leading-relaxed">
                  A triple-engine verification framework designed for the absolute privacy requirements of legal and healthcare sectors. Eliminate PII leakages through system-wide agreement.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={openModal}
                    className="bg-[#570000] dark:bg-[#b8860b] text-[#ffffff] px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:shadow-xl transition-all hover:-translate-y-1 btn-glow relative overflow-hidden"
                  >
                    Start Your First Scan
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                  <button className="border border-[#570000] dark:border-[#b8860b] text-[#570000] dark:text-[#d4a574] px-8 py-4 rounded-xl font-bold hover:bg-[#570000]/5 dark:hover:bg-[#b8860b]/10 transition-all">
                    View Methodology
                  </button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 pt-4 text-xs text-[#5e5f5d] dark:text-[#c4b8b2]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[16px]">check_circle</span>
                    99.8% accuracy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[16px]">check_circle</span>
                    SOC2 compliant
                  </span>
                  <span className="flex items-center gap-1.5 hidden sm:flex">
                    <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[16px]">check_circle</span>
                    24h deployment
                  </span>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="relative flex justify-center items-center animate-on-scroll">
                <div className="relative w-full max-w-lg aspect-[4/5] hero-doc-card shadow-2xl hero-float">
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="h-4 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.3)] w-1/3 rounded" />
                    <div className="space-y-3">
                      <div className="h-3 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.2)] w-full rounded" />
                      <div className="h-3 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.2)] w-5/6 rounded" />
                      <div className="h-3 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.2)] w-11/12 rounded" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="h-12 w-full sm:w-32 bg-[#570000] dark:bg-[#b8860b] rounded-lg flex items-center justify-center text-white text-[10px] font-mono">
                        SSN DETECTED
                      </div>
                      <div className="h-12 flex-1 redaction-hatch border border-[#570000]/20 dark:border-[#b8860b]/20 rounded-lg" />
                    </div>
                    <div className="space-y-3 pt-4">
                      <div className="h-3 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.2)] w-full rounded" />
                      <div className="h-3 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.2)] w-4/5 rounded" />
                    </div>
                  </div>
                  <div className="scanline" />

                  {/* Floating status chips */}
                  <div
                    className="absolute top-12 -right-4 sm:-right-8 bg-white dark:bg-[#241e1b] p-4 shadow-lg rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center gap-3 animate-bounce"
                    style={{ animationDuration: "5s" }}
                  >
                    <span
                      className="material-symbols-outlined text-green-600"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div className="text-[12px]">
                      <p className="font-bold">Engine Match</p>
                      <p className="text-[#5a413d] dark:text-[#d4c5be]">99.8% Confidence</p>
                    </div>
                  </div>

                  <div className="absolute bottom-24 -left-6 sm:-left-12 bg-white dark:bg-[#241e1b] p-4 shadow-lg rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-[#570000] dark:text-[#b8860b]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      priority_high
                    </span>
                    <div className="text-[12px]">
                      <p className="font-bold">Conflict Alert</p>
                      <p className="text-[#5a413d] dark:text-[#d4c5be]">Review Required</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- Stats Counter Section --- */}
          <section
            ref={statsRef}
            className="py-16 px-4 sm:px-8 bg-[#ffffff] dark:bg-[#1e1815] border-y border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)]"
          >
            <div className="max-w-7xl mx-auto stats-grid grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div className="text-center animate-on-scroll">
                <div className="text-4xl md:text-5xl font-bold text-[#570000] dark:text-[#d4a574] font-serif stat-number">
                  {counters.docs.toLocaleString()}+
                </div>
                <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">Documents Redacted</p>
              </div>
              <div className="text-center animate-on-scroll">
                <div className="text-4xl md:text-5xl font-bold text-[#570000] dark:text-[#d4a574] font-serif stat-number">
                  {counters.accuracy.toFixed(1)}%
                </div>
                <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">Detection Accuracy</p>
              </div>
              <div className="text-center animate-on-scroll">
                <div className="text-4xl md:text-5xl font-bold text-[#570000] dark:text-[#d4a574] font-serif stat-number">
                  {counters.clients.toLocaleString()}+
                </div>
                <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">Enterprise Clients</p>
              </div>
              <div className="text-center animate-on-scroll">
                <div className="text-4xl md:text-5xl font-bold text-[#570000] dark:text-[#d4a574] font-serif stat-number">
                  &lt;{counters.speed}m
                </div>
                <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">Avg. Processing Time</p>
              </div>
            </div>
          </section>

          {/* --- Problem Section --- */}
          <section className="py-24 px-4 sm:px-8 bg-[#ffffff] dark:bg-[#1e1815] border-b border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)]" id="problem">
            <div className="max-w-4xl mx-auto text-center space-y-6 animate-on-scroll">
              <span className="text-xs font-mono text-[#570000] dark:text-[#d4a574] font-bold tracking-widest uppercase">
                The Challenge
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-[#570000] dark:text-[#d4a574]">
                The Cost of a Single Miss
              </h2>
              <p className="text-base text-[#5e5f5d] dark:text-[#c4b8b2] leading-relaxed max-w-3xl mx-auto">
                Traditional PII detection systems often fail at the edge cases. A single unredacted passport number or a misplaced medical code isn't just a technical error—it's a multi-million dollar liability and a breach of human trust. False negatives in legacy engines occur because they operate in isolation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-12">
                <div className="p-6 rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] hover:border-[#570000] dark:hover:border-[#b8860b] transition-all hover:-translate-y-1 hover:shadow-lg bg-white dark:bg-[#1e1815] text-left">
                  <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] mb-4 text-3xl">
                    psychology_alt
                  </span>
                  <h4 className="font-bold mb-2 text-[#1e1b18] dark:text-[#f0e8e4]">Hallucinations</h4>
                  <p className="text-sm text-[#5a413d] dark:text-[#d4c5be]">
                    Single-model systems often invent metadata or misidentify context, leading to over-redaction or critical misses.
                  </p>
                </div>
                <div className="p-6 rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] hover:border-[#570000] dark:hover:border-[#b8860b] transition-all hover:-translate-y-1 hover:shadow-lg bg-white dark:bg-[#1e1815] text-left">
                  <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] mb-4 text-3xl">
                    warning
                  </span>
                  <h4 className="font-bold mb-2 text-[#1e1b18] dark:text-[#f0e8e4]">Context Blindness</h4>
                  <p className="text-sm text-[#5a413d] dark:text-[#d4c5be]">
                    Failing to understand the legal or clinical nuance results in data being left vulnerable in the final export.
                  </p>
                </div>
                <div className="p-6 rounded-xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] hover:border-[#570000] dark:hover:border-[#b8860b] transition-all hover:-translate-y-1 hover:shadow-lg bg-white dark:bg-[#1e1815] text-left">
                  <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] mb-4 text-3xl">
                    gavel
                  </span>
                  <h4 className="font-bold mb-2 text-[#1e1b18] dark:text-[#f0e8e4]">Liability Debt</h4>
                  <p className="text-sm text-[#5a413d] dark:text-[#d4c5be]">
                    The regulatory burden falls on your team. Legacy tools offer no guarantee of protection against HIPAA or GDPR breaches.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- Solution: Triple-Engine Consensus --- */}
          <section className="py-24 md:py-32 px-4 sm:px-8 bg-[#fff8f5] dark:bg-[#1a1412]" id="solution">
            <div className="max-w-7xl mx-auto animate-on-scroll">
              <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 md:mb-20">
                <div className="max-w-2xl">
                  <span className="text-xs font-mono text-[#570000] dark:text-[#d4a574] font-bold tracking-widest uppercase mb-4 block">
                    The Methodology
                  </span>
                  <h2 className="font-serif text-[36px] md:text-[48px] leading-tight text-[#1e1b18] dark:text-[#f0e8e4]">
                    The Consensus Triple-Engine
                  </h2>
                  <p className="text-base text-[#5e5f5d] dark:text-[#c4b8b2] mt-4">
                    We don't rely on one viewpoint. Our system runs three diverse detection engines in parallel. Only through consensus is a redaction confirmed.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Engine 1 */}
                <div className="relative p-8 bg-[#fff8f5] dark:bg-[#1e1815] rounded-2xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-[80px]">fingerprint</span>
                  </div>
                  <h3 className="font-mono text-[#570000] dark:text-[#b8860b] text-[14px] font-bold mb-4">
                    ENGINE_01: PATTERN
                  </h3>
                  <p className="font-serif text-2xl mb-6 text-[#1e1b18] dark:text-[#f0e8e4]">
                    Deterministic Extraction
                  </p>
                  <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mb-8">
                    High-speed regex and structural analysis for known formats like IBAN, SSN, and Tax IDs.
                  </p>
                  <div className="h-1 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.3)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#570000] dark:bg-[#b8860b] w-[95%]" />
                  </div>
                </div>
                {/* Engine 2 */}
                <div className="relative p-8 bg-[#fff8f5] dark:bg-[#1e1815] rounded-2xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-[80px]">description</span>
                  </div>
                  <h3 className="font-mono text-[#570000] dark:text-[#b8860b] text-[14px] font-bold mb-4">
                    ENGINE_02: CONTEXT
                  </h3>
                  <p className="font-serif text-2xl mb-6 text-[#1e1b18] dark:text-[#f0e8e4]">
                    Semantic Mapping
                  </p>
                  <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mb-8">
                    Analyzes the surrounding language to identify sensitive entities hidden in plain prose.
                  </p>
                  <div className="h-1 bg-[#e2bfb9] dark:bg-[rgba(120,100,96,0.3)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#570000] dark:bg-[#b8860b] w-[88%]" />
                  </div>
                </div>
                {/* Engine 3 */}
                <div className="relative p-8 bg-[#efe6e2] dark:bg-[#2a221e] rounded-2xl border-2 border-[#570000]/20 dark:border-[#b8860b]/30 overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                    <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[80px]">
                      hub
                    </span>
                  </div>
                  <h3 className="font-mono text-[#570000] dark:text-[#b8860b] text-[14px] font-bold mb-4">
                    ENGINE_03: CONSENSUS
                  </h3>
                  <p className="font-serif text-2xl mb-6 text-[#1e1b18] dark:text-[#f0e8e4]">
                    The Arbiter
                  </p>
                  <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mb-8">
                    Aggregates ENGINE_01 and ENGINE_02, flagging discrepancies for human validation.
                  </p>
                  <div className="h-1 bg-[#570000] dark:bg-[#b8860b] rounded-full overflow-hidden">
                    <div className="h-full bg-white/30 dark:bg-black/20 w-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- How It Works --- */}
          <section className="py-20 px-4 sm:px-8 bg-[#ffffff] dark:bg-[#1e1815] border-y border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)]">
            <div className="max-w-7xl mx-auto animate-on-scroll">
              <div className="text-center mb-16">
                <span className="text-xs font-mono text-[#570000] dark:text-[#d4a574] font-bold tracking-widest uppercase">
                  Simple Workflow
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1e1b18] dark:text-[#f0e8e4] mt-2">
                  How It Works
                </h2>
                <p className="text-[#5e5f5d] dark:text-[#c4b8b2] mt-3 max-w-2xl mx-auto">
                  From upload to export in three consensus-driven steps.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#570000] dark:bg-[#b8860b] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="font-bold text-lg text-[#1e1b18] dark:text-[#f0e8e4]">Upload Documents</h3>
                  <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">
                    Securely upload your PDFs, Word docs, or images. All processing happens within your VPC.
                  </p>
                  <div className="step-connector md:hidden" />
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#570000] dark:bg-[#b8860b] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="font-bold text-lg text-[#1e1b18] dark:text-[#f0e8e4]">Triple-Engine Scan</h3>
                  <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">
                    Our three engines work in parallel, cross-validating every potential PII detection.
                  </p>
                  <div className="step-connector md:hidden" />
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#570000] dark:bg-[#b8860b] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="font-bold text-lg text-[#1e1b18] dark:text-[#f0e8e4]">Review & Export</h3>
                  <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] mt-2">
                    Review flagged items, resolve conflicts, and export your privacy-ready documents.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- Bento Grid Features --- */}
          <section className="py-24 px-4 sm:px-8 bg-[#fbf2ed] dark:bg-[#1a1412]" id="features">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 animate-on-scroll">
                <span className="text-xs font-mono text-[#570000] dark:text-[#d4a574] font-bold tracking-widest uppercase">
                  Features
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1e1b18] dark:text-[#f0e8e4] mt-2">
                  Built for Enterprise Privacy
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-auto md:grid-rows-2 gap-4 md:gap-6 bento-grid">
                {/* Feature 1 */}
                <div className="md:col-span-8 md:row-span-1 bg-white dark:bg-[#1e1815] rounded-2xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] p-8 md:p-10 flex flex-col justify-between hover:shadow-lg transition-shadow animate-on-scroll">
                  <div>
                    <h3 className="font-serif text-2xl md:text-3xl text-[#570000] dark:text-[#d4a574] mb-4">
                      Review Workspace
                    </h3>
                    <p className="text-base text-[#5e5f5d] dark:text-[#c4b8b2] max-w-lg">
                      Designed for legal reviewers. Side-by-side consensus mapping with "Second Opinion" smart alerts that automatically pause when engines disagree.
                    </p>
                  </div>
                  <div className="mt-8 relative h-48 bg-[#fbf2ed] dark:bg-[#1a1412] rounded-lg overflow-hidden border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center justify-center">
                    <div
                      className="w-full h-full bg-cover bg-center opacity-80"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDq9XglmFmj_GzhXKVvNZnVZvGClvXm7XLgMubsJ_-QSjVOUnKwXi8_Gzb6dFBMxXBxhYc1hIzNO_Qk0ProwmWrEkoLLilC4k1vpZU0YDhGZQOQEyLtKa3xKcbLjf5cnZi__sbjyEZY35x1FA_tnsdpSJun5H3epYhfbi-LmMAlu6D-vgB2R89pAuhSOcwW-LBTnKL7koZIhNzlbenTWuNFx1Gk6PForRyd0W4vXbGccZGJO6P2Si84EIlaSvKkmIFW2FnGalANmd2N')",
                      }}
                      role="img"
                      aria-label="A sophisticated digital interface of a professional document redaction software. The screen shows a legal document with several maroon rectangular blocks covering sensitive information. On the right, a clean panel shows confidence scores and consensus status. The color palette is composed of warm beiges, deep maroons, and clean whites, radiating a sense of security and professional precision."
                    />
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="md:col-span-4 md:row-span-2 bg-[#570000] dark:bg-[#b8860b] text-[#ffffff] rounded-2xl p-8 md:p-10 flex flex-col justify-between overflow-hidden relative group animate-on-scroll">
                  <div className="z-10">
                    <h3 className="font-serif text-2xl md:text-3xl mb-4">Severity Engine</h3>
                    <p className="text-[#ffffff]/80 dark:text-[rgba(255,255,255,0.8)]">
                      Prioritize the highest-risk documents in your queue. Our system calculates a risk-velocity score based on PII density and data sensitivity.
                    </p>
                  </div>
                  <div className="mt-8 z-10">
                    <div className="space-y-4">
                      <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                        <div className="flex justify-between mb-2">
                          <span className="text-[12px] font-mono">Critical (SSNs)</span>
                          <span className="text-[12px] font-mono">High</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full">
                          <div className="h-full bg-white w-full" />
                        </div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                        <div className="flex justify-between mb-2">
                          <span className="text-[12px] font-mono">Names / Dates</span>
                          <span className="text-[12px] font-mono">Med</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full">
                          <div className="h-full bg-white w-1/3" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <span className="material-symbols-outlined text-[240px]">shield</span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="md:col-span-4 md:row-span-1 bg-[#e9e1dc] dark:bg-[#2a221e] rounded-2xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] p-8 md:p-10 flex flex-col justify-between animate-on-scroll">
                  <div>
                    <h3 className="font-serif text-2xl text-[#570000] dark:text-[#d4a574] mb-2">
                      Privacy Readiness
                    </h3>
                    <p className="text-sm text-[#5a413d] dark:text-[#d4c5be]">
                      A live 0-100% confidence meter that calculates export readiness in real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[#570000] dark:border-[#b8860b] flex items-center justify-center font-black text-[#570000] dark:text-[#d4a574]">
                      98%
                    </div>
                    <span className="text-xs font-mono text-[10px] text-[#570000] dark:text-[#b8860b] font-bold">
                      READY FOR EXPORT
                    </span>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="md:col-span-4 md:row-span-1 bg-white dark:bg-[#1e1815] rounded-2xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] p-8 md:p-10 flex flex-col justify-between animate-on-scroll">
                  <div>
                    <h3 className="font-serif text-2xl text-[#570000] dark:text-[#d4a574] mb-2">
                      Compliance Logic
                    </h3>
                    <p className="text-sm text-[#5a413d] dark:text-[#d4c5be]">
                      Switch between HIPAA, GDPR, or FERPA profiles with one click to adjust detection sensitivity.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6">
                    <div className="px-3 py-1 bg-[#fbf2ed] dark:bg-[#1a1412] border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] rounded-full text-[10px] font-bold">
                      HIPAA
                    </div>
                    <div className="px-3 py-1 bg-[#fbf2ed] dark:bg-[#1a1412] border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] rounded-full text-[10px] font-bold">
                      GDPR
                    </div>
                    <div className="px-3 py-1 bg-[#570000] dark:bg-[#b8860b] text-white rounded-full text-[10px] font-bold">
                      SOC2
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- Trust & Compliance --- */}
          <section className="py-24 px-4 sm:px-8 bg-[#fff8f5] dark:bg-[#1a1412] border-t border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)]" id="trust">
            <div className="max-w-7xl mx-auto animate-on-scroll">
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl text-[#570000] dark:text-[#d4a574] mb-4">
                  Enterprise Trust by Design
                </h2>
                <p className="text-[#5e5f5d] dark:text-[#c4b8b2]">
                  Securing the most sensitive data workflows globally.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 opacity-70 hover:opacity-100 transition-all trust-grid">
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-[48px] text-[#570000] dark:text-[#b8860b]">
                    verified_user
                  </span>
                  <span className="font-bold tracking-widest text-[11px] md:text-[12px] text-center">
                    HIPAA COMPLIANT
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-[48px] text-[#570000] dark:text-[#b8860b]">
                    security
                  </span>
                  <span className="font-bold tracking-widest text-[11px] md:text-[12px] text-center">
                    SOC 2 TYPE II
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-[48px] text-[#570000] dark:text-[#b8860b]">
                    public
                  </span>
                  <span className="font-bold tracking-widest text-[11px] md:text-[12px] text-center">
                    GDPR READY
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-[48px] text-[#570000] dark:text-[#b8860b]">
                    lock
                  </span>
                  <span className="font-bold tracking-widest text-[11px] md:text-[12px] text-center">
                    AES-256 ENCRYPTION
                  </span>
                </div>
              </div>

              <div className="mt-20 p-6 md:p-12 bg-[#fbf2ed] dark:bg-[#1e1815] rounded-3xl border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="flex-1 space-y-6">
                  <h3 className="font-serif text-2xl text-[#1e1b18] dark:text-[#f0e8e4]">
                    Data Sovereignty
                  </h3>
                  <p className="text-base text-[#5e5f5d] dark:text-[#c4b8b2]">
                    Redact Review is built for on-premise or VPC deployments. Your documents never leave your security perimeter—the Engines come to you.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">
                        check
                      </span>
                      No-logs processing policy
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">
                        check
                      </span>
                      Air-gapped deployment options
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">
                        check
                      </span>
                      Granular IAM controls
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-[400px] aspect-video rounded-2xl overflow-hidden shadow-xl border border-[#8e706c] dark:border-[rgba(120,100,96,0.3)]">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAy1sD3A53bV8hN-ZRX_lEf4gXUnCsods_Ha24qLoTXJqeMCccpEi-38WoNk7qw5QKQs-_M6pcqY49Agsb8MxbVQj4J2Vuuc5P5Usel2Q80rnpqluORHTEca7XxsPAFFHQSR_mFIk5gJQcfd2sDn5N2mZ8z85aSPOxiexkhKXJHt2dPPNpASpIQzqBKM0zrxiDBvOsb_iQm3I3aIZ3OOJWNhBTTjfwiuoUqY3wJHkSpAfPyw_9rSzGl6uHV9-tejWIVMnf3zSrzfRKn')",
                    }}
                    role="img"
                    aria-label="A clean and modern architectural representation of a secure server room. The perspective is from eye-level looking down a row of sleek server racks with subtle maroon LED status lights. The room is brightly lit with a clean, light-mode aesthetic, emphasizing modern technology, security, and enterprise-grade reliability."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* --- Pricing Section --- */}
          <section className="py-24 px-4 sm:px-8 bg-[#ffffff] dark:bg-[#1e1815]" id="pricing">
            <div className="max-w-7xl mx-auto animate-on-scroll">
              <div className="text-center mb-16">
                <span className="text-xs font-mono text-[#570000] dark:text-[#d4a574] font-bold tracking-widest uppercase">
                  Pricing
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1e1b18] dark:text-[#f0e8e4] mt-2">
                  Choose Your Plan
                </h2>
                <p className="text-[#5e5f5d] dark:text-[#c4b8b2] mt-3 max-w-2xl mx-auto">
                  Flexible options for teams of all sizes. All plans include the triple-engine consensus.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pricing-grid">
                {/* Starter */}
                <div className="pricing-card animate-on-scroll">
                  <h3 className="font-serif text-xl text-[#1e1b18] dark:text-[#f0e8e4]">Starter</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-[#570000] dark:text-[#d4a574]">$0</span>
                    <span className="text-[#5e5f5d] dark:text-[#c4b8b2]">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      100 documents / month
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      Triple-engine detection
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      Community support
                    </li>
                    <li className="flex items-center gap-2 opacity-50">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      Advanced compliance
                    </li>
                  </ul>
                  <button className="w-full mt-8 border border-[#570000] dark:border-[#b8860b] text-[#570000] dark:text-[#d4a574] py-3 rounded-xl font-bold hover:bg-[#570000]/5 dark:hover:bg-[#b8860b]/10 transition">
                    Get Started
                  </button>
                </div>

                {/* Professional (Featured) */}
                <div className="pricing-card featured animate-on-scroll">
                  <div className="pricing-badge">Most Popular</div>
                  <h3 className="font-serif text-xl text-[#1e1b18] dark:text-[#f0e8e4]">Professional</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-[#570000] dark:text-[#d4a574]">$49</span>
                    <span className="text-[#5e5f5d] dark:text-[#c4b8b2]">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      5,000 documents / month
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      Triple-engine consensus
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      HIPAA & GDPR profiles
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      Email support
                    </li>
                  </ul>
                  <button
                    onClick={openModal}
                    className="w-full mt-8 bg-[#570000] dark:bg-[#b8860b] text-white py-3 rounded-xl font-bold hover:opacity-90 transition active:scale-95 relative overflow-hidden"
                  >
                    Start Free Trial
                  </button>
                </div>

                {/* Enterprise */}
                <div className="pricing-card animate-on-scroll">
                  <h3 className="font-serif text-xl text-[#1e1b18] dark:text-[#f0e8e4]">Enterprise</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-[#570000] dark:text-[#d4a574]">Custom</span>
                    <span className="text-[#5e5f5d] dark:text-[#c4b8b2]">/year</span>
                  </div>
                  <ul className="space-y-3 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      Unlimited documents
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      All compliance profiles
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      On-premise deployment
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b] text-[18px]">check</span>
                      24/7 priority support
                    </li>
                  </ul>
                  <button
                    onClick={openModal}
                    className="w-full mt-8 border border-[#570000] dark:border-[#b8860b] text-[#570000] dark:text-[#d4a574] py-3 rounded-xl font-bold hover:bg-[#570000]/5 dark:hover:bg-[#b8860b]/10 transition"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* --- Testimonials --- */}
          <section className="py-24 px-4 sm:px-8 bg-[#fbf2ed] dark:bg-[#1a1412]" id="testimonials">
            <div className="max-w-7xl mx-auto animate-on-scroll">
              <div className="text-center mb-16">
                <span className="text-xs font-mono text-[#570000] dark:text-[#d4a574] font-bold tracking-widest uppercase">
                  Testimonials
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1e1b18] dark:text-[#f0e8e4] mt-2">
                  Trusted by Industry Leaders
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="testimonial-card animate-on-scroll">
                  <div className="flex items-center gap-1 text-[#570000] dark:text-[#b8860b] mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-[#1e1b18] dark:text-[#f0e8e4] leading-relaxed">
                    "Redact Review has transformed our document workflow. The consensus engine gives us confidence we've never had before with PII detection."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#800000] dark:bg-[#b8860b] text-white flex items-center justify-center font-bold text-sm">
                      JD
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1e1b18] dark:text-[#f0e8e4]">Jane Doe</p>
                      <p className="text-xs text-[#5e5f5d] dark:text-[#c4b8b2]">General Counsel, Fortune 500</p>
                    </div>
                  </div>
                </div>

                <div className="testimonial-card animate-on-scroll">
                  <div className="flex items-center gap-1 text-[#570000] dark:text-[#b8860b] mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-[#1e1b18] dark:text-[#f0e8e4] leading-relaxed">
                    "We've reduced our compliance review time by 80% while actually increasing accuracy. The triple-engine approach is a game-changer for healthcare."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#800000] dark:bg-[#b8860b] text-white flex items-center justify-center font-bold text-sm">
                      MS
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1e1b18] dark:text-[#f0e8e4]">Dr. Mark Sullivan</p>
                      <p className="text-xs text-[#5e5f5d] dark:text-[#c4b8b2]">Chief Privacy Officer, HealthNet</p>
                    </div>
                  </div>
                </div>

                <div className="testimonial-card animate-on-scroll">
                  <div className="flex items-center gap-1 text-[#570000] dark:text-[#b8860b] mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-[#1e1b18] dark:text-[#f0e8e4] leading-relaxed">
                    "The ability to deploy within our VPC was critical. Redact Review gave us enterprise-grade redaction without compromising data sovereignty."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#800000] dark:bg-[#b8860b] text-white flex items-center justify-center font-bold text-sm">
                      AL
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1e1b18] dark:text-[#f0e8e4]">Anna Liu</p>
                      <p className="text-xs text-[#5e5f5d] dark:text-[#c4b8b2]">VP Engineering, FinSecure</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- FAQ --- */}
          <section className="py-24 px-4 sm:px-8 bg-[#ffffff] dark:bg-[#1e1815]" id="faq">
            <div className="max-w-4xl mx-auto animate-on-scroll">
              <div className="text-center mb-16">
                <span className="text-xs font-mono text-[#570000] dark:text-[#d4a574] font-bold tracking-widest uppercase">
                  FAQ
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1e1b18] dark:text-[#f0e8e4] mt-2">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-1">
                {[
                  {
                    q: "How does the triple-engine consensus work?",
                    a: "Our system runs three independent detection engines in parallel: a pattern-based regex engine, a semantic context engine, and a consensus arbiter that compares outputs. Only when all three agree is a redaction automatically applied. Discrepancies are flagged for human review, ensuring near-zero false positives.",
                  },
                  {
                    q: "Is my data secure with Redact Review?",
                    a: "Absolutely. We support on-premise and VPC deployments, meaning your documents never leave your security perimeter. All data is encrypted with AES-256 both in transit and at rest. We maintain SOC 2 Type II, HIPAA, and GDPR compliance certifications.",
                  },
                  {
                    q: "What document formats are supported?",
                    a: "We support PDF, Microsoft Word (.docx), Excel (.xlsx), PowerPoint (.pptx), plain text, and common image formats (PNG, JPEG, TIFF) through our OCR pipeline. Enterprise plans include custom format support.",
                  },
                  {
                    q: "Can I integrate with my existing workflow?",
                    a: "Yes. We offer a comprehensive REST API, native integrations with SharePoint, Google Drive, and Dropbox, and a Zapier connector. Our enterprise team can build custom integrations for your specific stack.",
                  },
                  {
                    q: "What compliance frameworks does Redact Review support?",
                    a: "We support HIPAA, GDPR, FERPA, CCPA, SOC 2, and PCI-DSS compliance profiles. Each profile adjusts detection sensitivity and redaction rules to match the specific regulatory requirements of your industry.",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`faq-item ${activeFaq === index ? "open" : ""}`}
                    onClick={() => toggleFaq(index)}
                  >
                    <div className="faq-question">
                      <span>{item.q}</span>
                      <span className="material-symbols-outlined text-[#570000] dark:text-[#b8860b]">
                        {activeFaq === index ? "expand_less" : "expand_more"}
                      </span>
                    </div>
                    <div className="faq-answer">{item.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* --- Final CTA --- */}
          <section className="relative py-24 md:py-32 px-4 sm:px-8 bg-[#570000] dark:bg-[#b8860b] text-[#ffffff] text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat" />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8 md:space-y-10 animate-on-scroll">
              <h2 className="font-serif text-[36px] md:text-[56px] leading-tight">
                Ready to verify your privacy readiness?
              </h2>
              <p className="text-base text-[#ffffff]/80 dark:text-[rgba(255,255,255,0.8)] max-w-2xl mx-auto">
                Join leading law firms and healthcare providers who trust Redact Review for their high-stakes document workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={openModal}
                  className="bg-white text-[#570000] dark:text-[#b8860b] px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-[16px] md:text-[18px] hover:shadow-2xl transition-all hover:scale-105 relative overflow-hidden"
                >
                  Request Enterprise Access
                </button>
                <button className="border-2 border-white/30 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-[16px] md:text-[18px] hover:bg-white/10 transition-all">
                  Speak with a Specialist
                </button>
              </div>
              <p className="text-xs font-mono text-[12px] opacity-60">
                NO SYSTEM TRAINING REQUIRED. UP AND RUNNING IN 24 HOURS.
              </p>
            </div>
          </section>
        </main>

        {/* --- Footer --- */}
        <footer className="bg-[#fff8f5] dark:bg-[#1a1412] py-16 md:py-20 px-4 sm:px-8 border-t border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)]">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 footer-grid">
            <div className="col-span-2">
              <span className="text-2xl font-black text-[#570000] dark:text-[#d4a574] tracking-tight mb-6 block">
                Redact Review
              </span>
              <p className="text-sm text-[#5e5f5d] dark:text-[#c4b8b2] max-w-xs mb-8">
                The authoritative standard for multi-engine document redaction and privacy compliance.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#efe6e2] dark:bg-[#2a221e] border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center justify-center text-[#570000] dark:text-[#b8860b]">
                  <span className="material-symbols-outlined">alternate_email</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#efe6e2] dark:bg-[#2a221e] border border-[#e2bfb9] dark:border-[rgba(120,100,96,0.3)] flex items-center justify-center text-[#570000] dark:text-[#b8860b]">
                  <span className="material-symbols-outlined">share</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-[#1e1b18] dark:text-[#f0e8e4]">Platform</h4>
              <ul className="space-y-4 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                <li><a href="#solution" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Consensus Engine</a></li>
                <li><a href="#features" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Review Workspace</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">API Documentation</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Integration Hub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-[#1e1b18] dark:text-[#f0e8e4]">Company</h4>
              <ul className="space-y-4 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Security Docs</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Methodology</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Case Studies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-[#1e1b18] dark:text-[#f0e8e4]">Support</h4>
              <ul className="space-y-4 text-sm text-[#5e5f5d] dark:text-[#c4b8b2]">
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Enterprise Support</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">System Status</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Compliance Help</a></li>
                <li><a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">Contact Sales</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 md:mt-20 pt-8 border-t border-[#e2bfb9] dark:border-[rgba(120,100,96,0.2)] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-mono text-[10px] text-[#5e5f5d] dark:text-[#c4b8b2]">
              © 2024 REDACT REVIEW. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6 md:gap-8 text-xs font-mono text-[10px] text-[#5e5f5d] dark:text-[#c4b8b2]">
              <a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">TERMS</a>
              <a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">PRIVACY</a>
              <a href="#" className="hover:text-[#570000] dark:hover:text-[#d4a574] transition">COOKIES</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}