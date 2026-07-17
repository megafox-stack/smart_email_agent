import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Shield,
  Calendar,
  Sparkles,
  Send,
} from "lucide-react";

const slides = [
  {
    title: "Welcome to Smart Email Management",
    subtitle: "An AI-powered Email Automation Platform",
    description:
      "Manage your inbox smarter with AI assistance, automation, security, and productivity tools—all in one place.",
    icon: Mail,
    color: "from-sky-500 to-cyan-500",
  },
  {
    title: "AI that Works For You",
    subtitle: "Save hours every week",
    description:
      "Generate professional replies, summarize long emails, create subject lines, and detect phishing attempts instantly.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Security First",
    subtitle: "Protect your inbox",
    description:
      "Scan suspicious links, identify phishing emails, and receive AI-powered security recommendations.",
    icon: Shield,
    color: "from-red-500 to-orange-500",
  },
  {
    title: "Bulk Email Automation",
    subtitle: "Reach everyone effortlessly",
    description:
      "Send personalized bulk emails, schedule campaigns, and manage recipients from one place.",
    icon: Send,
    color: "from-emerald-500 to-green-500",
  },
  {
    title: "Smart Calendar",
    subtitle: "Never miss an event",
    description:
      "Extract important dates from emails and organize them automatically inside your calendar.",
    icon: Calendar,
    color: "from-indigo-500 to-blue-500",
  },
];

interface OnboardingProps {
  onFinish: () => void;
}

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [page, setPage] = useState(0);

  const slide = slides[page];
  const Icon = slide.icon;

  function handleNext() {
    if (page < slides.length - 1) {
      setPage(page + 1);
      return;
    }

    onFinish();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-10">

      <div className="w-full max-w-7xl rounded-3xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl">

        <div className="grid lg:grid-cols-2">

          {/* Left */}

          <div className="p-16 flex flex-col justify-center">

            <span className="text-sky-400 uppercase tracking-[0.3em] text-sm">
              Smart Email Management
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight">
              {slide.title}
            </h1>

            <h2 className="mt-4 text-xl text-slate-300">
              {slide.subtitle}
            </h2>

            <p className="mt-8 text-lg text-slate-400 leading-8">
              {slide.description}
            </p>

          </div>

          {/* Right */}

          <div
            className={`flex items-center justify-center bg-gradient-to-br ${slide.color}`}
          >

            <div className="rounded-full bg-white/10 p-16 backdrop-blur-lg">

              <Icon size={160} />

            </div>

          </div>
        </div>

        {/* Bottom */}

        <div className="flex items-center justify-between border-t border-white/10 p-8">

          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 disabled:opacity-40"
          >
            <ArrowLeft size={18} />
            Previous
          </button>

          <button
            type="button"
            onClick={onFinish}
            className="rounded-xl border border-white/10 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            Skip
          </button>

          <div className="flex gap-3">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-3 rounded-full transition-all ${
                  page === index ? "w-10 bg-sky-500" : "w-3 bg-slate-600"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3"
          >
            {page < slides.length - 1 ? "Next" : "Launch Dashboard"}
            <ArrowRight size={18} />
          </button>

        </div>

      </div>

    </div>
  );
}