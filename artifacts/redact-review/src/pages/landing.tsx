import { motion } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck, Lock, Zap, ArrowRight, CheckCircle2, ShieldAlert, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#6B1E2B]/20 overflow-x-hidden text-[#1F1F1F]">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-[#E8DED1]/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#6B1E2B] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#6B1E2B]/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold font-serif text-[#1F1F1F] tracking-wide">Privado</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 font-medium hover:bg-white/50 hover:text-[#1F1F1F]">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#1F1F1F] text-white hover:bg-black rounded-full px-6 font-semibold shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        {/* Background blobs & Grid */}
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[60%] bg-[#6B1E2B]/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtNGgtdjRoNHYtNGgtdjRoLTRWMjJoNHYtNGgtNHYtNEg4djRoLTR2NGg0djRoLTR2NGg0djRoLTR2NGg0djRoLTR2NGg0djRINDIwaDR2LTRoNHY0aDR2LTRoNHY0aDR2LTRoNHY0aDR2LTNoLTR6IiBmaWxsPSIjRThERUQxIiBmaWxsLW9wYWNpdHk9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8DED1] text-[#6B1E2B] text-[13px] font-semibold mb-8 shadow-sm">
              <Zap className="h-4 w-4" />
              Powered by Multi-Engine AI Consensus
            </motion.div>
            
            <motion.h1 variants={item} className="text-6xl md:text-7xl lg:text-[80px] font-serif font-bold tracking-tight leading-[1.05] mb-8 text-[#1F1F1F]">
              Secure your documents <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6B1E2B] to-[#9A2A3D]">with absolute precision.</span>
            </motion.h1>
            
            <motion.p variants={item} className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Privado utilizes a multi-engine AI consensus system to automatically detect, redact, and audit sensitive PII before it ever leaves your network.
            </motion.p>
            
            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button className="h-14 px-8 bg-[#6B1E2B] hover:bg-[#521721] text-white rounded-full text-lg font-semibold shadow-xl hover:scale-105 transition-all duration-300">
                  Start Free Trial <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Abstract Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="mt-24 relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent z-10 h-full w-full bottom-0" />
            <div className="rounded-2xl border border-white/40 bg-white/40 backdrop-blur-3xl shadow-2xl shadow-black/5 overflow-hidden ring-1 ring-[#E8DED1]/50 p-2">
              <div className="rounded-xl overflow-hidden bg-white border border-[#E8DED1] flex flex-col h-[500px]">
                {/* Mock header */}
                <div className="h-14 border-b border-[#E8DED1] flex items-center px-4 gap-4 bg-gray-50/50">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="h-6 flex-1 bg-gray-100 rounded-md max-w-md mx-auto opacity-70" />
                </div>
                {/* Mock body */}
                <div className="flex flex-1 p-4 gap-4">
                  <div className="w-64 space-y-4">
                    <div className="h-24 bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col justify-between">
                      <div className="w-20 h-4 bg-red-200 rounded" />
                      <div className="w-12 h-6 bg-red-300 rounded" />
                    </div>
                    <div className="h-24 bg-orange-50 border border-orange-100 rounded-xl p-3 flex flex-col justify-between">
                      <div className="w-20 h-4 bg-orange-200 rounded" />
                      <div className="w-12 h-6 bg-orange-300 rounded" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white border border-[#E8DED1] rounded-xl p-8 space-y-6">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="flex gap-2">
                      <div className="h-4 bg-gray-100 rounded w-1/4" />
                      <div className="h-5 bg-[#6B1E2B] rounded px-2 w-32 shadow-[0_0_15px_rgba(107,30,43,0.3)]" />
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-5/6" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative border-t border-[#E8DED1] bg-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1F1F1F] mb-6">Enterprise-Grade Protection</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">Everything you need to ensure compliance and prevent data leaks without slowing down your workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Database className="h-6 w-6 text-[#1F1F1F]" />,
                title: "Multi-Engine Consensus",
                desc: "We route your document through Gemini, Llama, and Claude simultaneously. We cross-verify their outputs to eliminate false positives and catch what single models miss."
              },
              {
                icon: <ShieldAlert className="h-6 w-6 text-[#1F1F1F]" />,
                title: "Blind-spot Analysis",
                desc: "Our auditor agent analyzes your document against industry-specific compliance rules (HIPAA, GDPR) to find context-based privacy risks beyond just standard PII."
              },
              {
                icon: <Lock className="h-6 w-6 text-[#1F1F1F]" />,
                title: "Irreversible Redaction",
                desc: "Exported PDFs and documents have sensitive data permanently physically replaced and stripped from the metadata. No more highlight-to-reveal accidents."
              }
            ].map((feat, i) => (
              <div key={i} className="bg-[#FDFBF7] border border-[#E8DED1] rounded-3xl p-8 hover:bg-white hover:-translate-y-2 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white border border-[#E8DED1] rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-[#6B1E2B]/20 transition-transform duration-300">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1F1F1F] mb-4">{feat.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FDFBF7] border-t border-[#E8DED1] py-16 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#6B1E2B] rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold font-serif text-[#1F1F1F] tracking-wide">Privado</span>
          </div>
          <p className="text-gray-500 mb-8">Protecting the world's most sensitive data.</p>
          <div className="text-[13px] text-gray-400">© 2026 Privado Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
