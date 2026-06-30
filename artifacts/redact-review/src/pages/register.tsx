import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login({ id: "usr_mock_123", name: name, email: email });
      setIsLoading(false);
      toast.success("Account created successfully!");
      setLocation("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-[#800000]/20">
      {/* Left side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
        <Link href="/" className="absolute top-10 left-8 sm:left-16 lg:left-24 inline-flex items-center gap-2.5 group cursor-pointer">
          <div className="w-9 h-9 bg-[#800000] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#800000]/20 group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <span className="text-xl font-bold font-serif text-[#1e1b18] tracking-wide">Redact Review</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] mt-12"
        >
          <h1 className="text-3xl font-serif font-bold text-[#1e1b18] mb-3">Create an account</h1>
          <p className="text-gray-500 text-[15px] mb-10 leading-relaxed">
            Start auditing documents securely with multi-engine AI in seconds.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#800000] transition-colors">
                  <User className="h-[18px] w-[18px]" />
                </div>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-11 h-[52px] bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#800000] focus:ring-1 focus:ring-[#800000] rounded-xl transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#800000] transition-colors">
                  <Mail className="h-[18px] w-[18px]" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-[52px] bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#800000] focus:ring-1 focus:ring-[#800000] rounded-xl transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#800000] transition-colors">
                  <Lock className="h-[18px] w-[18px]" />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-[52px] bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#800000] focus:ring-1 focus:ring-[#800000] rounded-xl transition-all"
                  placeholder="Create a strong password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-[#1e1b18] text-white hover:bg-black rounded-xl shadow-lg shadow-black/5 font-semibold text-[15px] transition-all hover:scale-[1.02] mt-4"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[14px] text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-[#1e1b18] font-semibold hover:text-[#800000] transition-colors cursor-pointer">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-[#fff8f5] overflow-hidden items-center justify-center border-l border-[#e2bfb9]">
        {/* Glow effects */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#800000] rounded-full mix-blend-multiply filter blur-[128px] opacity-10" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-amber-600 rounded-full mix-blend-multiply filter blur-[160px] opacity-10" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtNGgtdjRoNHYtNGgtdjRoLTRWMjJoNHYtNGgtNHYtNEg4djRoLTR2NGg0djRoLTR2NGg0djRoLTR2NGg0djRoLTR2NGg0djRINDIwaDR2LTRoNHY0aDR2LTRoNHY0aDR2LTRoNHY0aDR2LTNoLTR6IiBmaWxsPSIjRThERUQxIiBmaWxsLW9wYWNpdHk9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-60" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 max-w-lg text-center"
        >
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-white border border-[#e2bfb9] shadow-xl flex items-center justify-center">
             <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#1e1b18] mb-4">Privacy meets intelligence.</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Join the most secure platform for redacting sensitive documents. Irreversible redaction, zero trust, and maximum compliance.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
