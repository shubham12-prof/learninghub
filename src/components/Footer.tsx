import { Sparkles } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative z-50 w-full border-t border-cyan-400/10 bg-[#030712]">
      <div className="w-full px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles size={14} className="text-cyan-400" />

            <span className="font-semibold text-white">DevHub</span>
          </div>

          <p className="text-center text-xs text-slate-500 sm:text-sm">
            Learn the concepts. Understand the code. Build with confidence.
          </p>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
