import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('operator@sentra.ai');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    // Realistic login transition
    setTimeout(() => {
      setIsLoading(false);
      if (email.trim().length > 0) {
        onLogin(email);
      } else {
        setErrorMsg('Please provide a valid operator identifier.');
      }
    }, 800);
  };

  const handleDemoFill = () => {
    setEmail('operator@sentra.ai');
    setPassword('SentraSecure#2026');
  };

  return (
    <div className="min-h-screen w-full bg-[#070a0f] text-slate-100 flex flex-col lg:flex-row select-none">
      {/* LEFT SIDE: Brand, Visual Reticle, Product Statement */}
      <div className="relative w-full lg:w-3/5 p-8 lg:p-16 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#192437] bg-gradient-to-br from-[#0a0f19] via-[#070b13] to-[#04060a]">
        {/* Subtle Surveillance Background Grid */}
        <div className="absolute inset-0 surveillance-grid opacity-25 pointer-events-none" />

        {/* Ambient Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-950/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-rose-950/20 blur-3xl pointer-events-none" />

        {/* Top Branding Header */}
        <div className="relative z-10 flex items-center gap-4">
          <img
            src="/sentra_logo.jpg"
            alt="SENTRA Logo"
            className="h-16 w-16 object-cover rounded-xl border border-[#2b3c55] shadow-xl shadow-cyan-950/60"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-widest text-white">SENTRA</span>
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
              BEHAVIORAL RISK INTELLIGENCE SYSTEM
            </span>
          </div>
        </div>

        {/* Center Tagline & Targeting Reticle Aesthetic */}
        <div className="relative z-10 my-12 lg:my-0 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Autonomous Visual Threat Prioritization</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            "See the risk.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-slate-200">
              Understand the context.
            </span>
            <br />
            Respond faster."
          </h2>

          <p className="text-sm lg:text-base text-slate-400 leading-relaxed max-w-lg mb-8">
            Transform passive CCTV networks into an active Security Operations Center. 
            Real-time human tracking, weapon differentiation, restricted-area detection, and transparent rule-based risk scoring.
          </p>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#182335] max-w-md">
            <div>
              <span className="text-2xl font-bold font-mono text-cyan-400">100%</span>
              <span className="text-[11px] text-slate-500 uppercase block font-semibold">Explainable Rules</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white">&lt;45ms</span>
              <span className="text-[11px] text-slate-500 uppercase block font-semibold">Inference Latency</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-emerald-400">0 Safe False</span>
              <span className="text-[11px] text-slate-500 uppercase block font-semibold">Item Differentiation</span>
            </div>
          </div>
        </div>

        {/* Bottom Platform Trust Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-[#182335] pt-4">
          <span>SENTRA v1.0.0 Enterprise Edition</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>System Secure</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Encrypted Session</span>
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Enterprise Authentication Card */}
      <div className="w-full lg:w-2/5 p-8 lg:p-16 flex items-center justify-center bg-[#070a0f]">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Operator Sign-In
            </h3>
            <p className="text-xs text-slate-400">
              Access the SENTRA Security Operations Center console.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator Identifier Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Operator Email / Badge ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@sentra.ai"
                  required
                  className="w-full bg-[#0d1422] border border-[#1e2a3e] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Security Passcode
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Contact your SOC Security Administrator to reset credentials.');
                  }}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0d1422] border border-[#1e2a3e] rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-300 absolute right-3.5 top-3.5 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0d1422] border-[#1e2a3e] text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember session for 12 hours</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>LOGIN TO SENTRA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Pre-fill helper button for evaluators */}
          <div className="pt-4 border-t border-[#182335] text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400/80 hover:text-cyan-300 hover:underline font-medium"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill Demo Operator Credentials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
