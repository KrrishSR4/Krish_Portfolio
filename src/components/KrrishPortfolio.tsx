import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import heroImage from "@/assets/Hero-Krish.png";
import { ScrollToTopButton } from "./ui/scroll-to-top";
import DotGrid from "./DotGrid";
import ProjectCards from "./ProjectCards";


gsap.registerPlugin(ScrollTrigger);

// Helper to safely request DeviceOrientation permission on iOS (and fall back on non-iOS)
const requestDeviceOrientationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Dev = (window as unknown as Record<string, unknown>).DeviceOrientationEvent as { requestPermission?: () => Promise<string> } | undefined;
  if (Dev && typeof Dev.requestPermission === "function") {
    try {
      const permission = await Dev.requestPermission();
      return permission === "granted";
    } catch (err) {
      console.error("DeviceOrientation permission request failed:", err);
      return false;
    }
  }
  // No permission API => assume allowed on non-iOS browsers
  return true;
};

const TYPING_LINES = [
  "Engineering student 23-27",
  "Web Developer",
  "Exploring DSA and Open-Source",
  "DevOps and Cloud Computing aspirant",
];

export default function KrrishPortfolio() {
  const skillsRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const socialRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [typedText, setTypedText] = useState("");
  const [active, setActive] = useState("about");
  const [scrollProgress, setScrollProgress] = useState(0);

  const SIMPLE_ICONS_PRIMARY = "https://cdn.simpleicons.org";
  const SIMPLE_ICONS_FALLBACK = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons";

  const handleIconError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const fallback = img.dataset.fallback;
    if (fallback && img.src !== fallback) {
      img.src = fallback;
      img.style.display = "block";
      return;
    }
    img.style.display = "none";
  };

  // Typing lines (defined outside component for stable reference)
  const lines = TYPING_LINES;

  // Typing effect (stable)
  useEffect(() => {
    let mounted = true;
    let lineIdx = 0;
    let charIdx = 0;
    let forward = true;
    let timer: number | null = null;
    const typeStep = () => {
      if (!mounted) return;
      const current = lines[lineIdx];
      if (forward) {
        if (charIdx < current.length) {
          charIdx++;
          setTypedText(current.slice(0, charIdx));
          timer = window.setTimeout(typeStep, 40) as unknown as number;
        } else {
          timer = window.setTimeout(() => {
            forward = false;
            timer = window.setTimeout(typeStep, 60) as unknown as number;
          }, 900) as unknown as number;
        }
      } else {
        if (charIdx > 0) {
          charIdx--;
          setTypedText(current.slice(0, charIdx));
          timer = window.setTimeout(typeStep, 20) as unknown as number;
        } else {
          lineIdx = (lineIdx + 1) % lines.length;
          forward = true;
          timer = window.setTimeout(typeStep, 200) as unknown as number;
        }
      }
    };
    typeStep();
    return () => {
      mounted = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [lines]);

  // Smooth scroll spy to highlight navbar
  useEffect(() => {
    const sectionIds = ["about", "skills", "projects", "connect"];
    const onScroll = () => {
      let closestId = sectionIds[0];
      let minDistance = Number.POSITIVE_INFINITY;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const distance = Math.abs(el.getBoundingClientRect().top);
        if (distance < minDistance) {
          minDistance = distance;
          closestId = id;
        }
      }
      setActive(closestId);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll progress indicator
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GSAP: horizontal skills scroll (fixed last-item cut-off)
  useEffect(() => {
    const el = skillsRef.current;
    const pinEl = pinRef.current;
    if (!el || !pinEl) return;

    const panels = el.querySelectorAll<HTMLElement>(".skill-card");
    const viewport = el.parentElement as HTMLElement | null;
    const hoverHandlers: { el: HTMLElement; enter: () => void; leave: () => void }[] = [];

    const parseRgba = (value: string) => {
      const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
      if (!match) return null;
      const [, r, g, b, a] = match;
      return {
        r: Number(r),
        g: Number(g),
        b: Number(b),
        a: a !== undefined ? Number(a) : 1,
      };
    };

    const computeScrollDistance = () => {
      const totalWidth = el.scrollWidth;
      const container = viewport ?? pinEl;
      const containerStyles = window.getComputedStyle(container);
      const paddingX = parseFloat(containerStyles.paddingLeft || "0") + parseFloat(containerStyles.paddingRight || "0");
      const visibleWidth = Math.max(0, container.clientWidth - paddingX);
      return Math.max(0, totalWidth - visibleWidth);
    };

    gsap.to(el, {
      x: () => `-${computeScrollDistance()}px`,
      ease: "none",
      scrollTrigger: {
        trigger: pinEl,
        start: "top top",
        end: () => `+=${computeScrollDistance()}`,
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
      },
    });

    panels.forEach((p: Element, i: number) => {
      const el = p as HTMLElement;
      const baseColor = el.dataset.shadowBase ?? "rgba(100, 116, 139, 0.28)";
      const hoverColor = el.dataset.shadowHover ?? "rgba(71, 85, 105, 0.46)";
      const parsedHover = parseRgba(hoverColor);
      const topShadowColor = parsedHover
        ? `rgba(${parsedHover.r}, ${parsedHover.g}, ${parsedHover.b}, ${Math.min(0.45, parsedHover.a * 0.6)})`
        : hoverColor;
      const baseShadow = "0 0 0 rgba(0,0,0,0)";
      const hoverShadow = `0 75px 130px ${hoverColor}, 0 - 32px 60px ${topShadowColor} `;

      gsap.fromTo(el, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, delay: i * 0.03, ease: "power3.out" });
      gsap.set(el, { boxShadow: baseShadow });

      const onEnter = () => gsap.to(el, { scale: 1.05, boxShadow: hoverShadow, duration: 0.18, ease: "power2.out", overwrite: "auto" });
      const onLeave = () => gsap.to(el, { scale: 1, boxShadow: baseShadow, duration: 0.25, ease: "power2.out", overwrite: "auto" });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      hoverHandlers.push({ el, enter: onEnter, leave: onLeave });
    });

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      hoverHandlers.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Hero tilt effect with mouse and device orientation
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const isMobile = window.innerWidth < 768;

    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(hero, { rotationY: x * 15, rotationX: -y * 15, transformPerspective: 250, transformOrigin: "center", duration: 0.4, ease: "power3.out" });
    };
    const onLeave = () => gsap.to(hero, { rotationY: 0, rotationX: 0, duration: 0.6, ease: "power3.out" });

    // Device orientation support for mobile tilt (reduced intensity)
    const onOrientationChange = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      // Reduced tilt for mobile: 5deg instead of 15deg
      const x = e.gamma / 90; // normalize to -1 to 1
      const y = (e.beta - 90) / 90; // normalize and adjust for natural holding position
      gsap.to(hero, {
        rotationY: x * 5,
        rotationX: -y * 5,
        transformPerspective: 250,
        transformOrigin: "center",
        duration: 0.6,
        ease: "power2.out",
      });
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);

    let mounted = true;
    (async () => {
      const allowed = await requestDeviceOrientationPermission();
      if (!mounted) return;
      if (allowed) window.addEventListener("deviceorientation", onOrientationChange);
    })();

    return () => {
      mounted = false;
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("deviceorientation", onOrientationChange);
    };
  }, []);

  // Social hover effect
  const onSocialHover = (idx: number) => {
    const el = socialRefs.current[idx];
    if (!el) return;
    gsap.to(el, { scale: 1.06, y: -6, boxShadow: "0 18px 40px rgba(14,165,233,0.12)", duration: 0.28, ease: "power2.out" });
  };
  const onSocialLeave = (idx: number) => {
    const el = socialRefs.current[idx];
    if (!el) return;
    gsap.to(el, { scale: 1, y: 0, boxShadow: "none", duration: 0.35, ease: "power2.out" });
  };

  // Device orientation for all interactive elements
  useEffect(() => {
    const onOrientationChange = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      const x = e.gamma / 90;
      const y = (e.beta - 90) / 90;

      // Apply tilt to social links
      socialRefs.current.forEach((el) => {
        if (el) {
          gsap.to(el, {
            rotationY: x * 2,
            rotationX: -y * 2,
            duration: 0.6,
            ease: "power2.out",
          });
        }
      });
    };

    let mounted = true;
    (async () => {
      const allowed = await requestDeviceOrientationPermission();
      if (!mounted) return;
      if (allowed) window.addEventListener("deviceorientation", onOrientationChange);
    })();

    return () => {
      mounted = false;
      window.removeEventListener("deviceorientation", onOrientationChange);
    };
  }, []);

  const skillShadowPalette: Record<string, { base: string; hover: string }> = {
    html5: { base: "rgba(249, 115, 22, 0.28)", hover: "rgba(249, 115, 22, 0.58)" },
    css3: { base: "rgba(37, 99, 235, 0.26)", hover: "rgba(37, 99, 235, 0.54)" },
    javascript: { base: "rgba(250, 204, 21, 0.32)", hover: "rgba(250, 204, 21, 0.6)" },
    tailwindcss: { base: "rgba(6, 182, 212, 0.28)", hover: "rgba(6, 182, 212, 0.55)" },
    react: { base: "rgba(14, 165, 233, 0.28)", hover: "rgba(14, 165, 233, 0.55)" },
    angular: { base: "rgba(220, 38, 38, 0.32)", hover: "rgba(220, 38, 38, 0.6)" },
    firebase: { base: "rgba(245, 158, 11, 0.32)", hover: "rgba(245, 158, 11, 0.6)" },
    nodedotjs: { base: "rgba(22, 163, 74, 0.32)", hover: "rgba(22, 163, 74, 0.6)" },
    express: { base: "rgba(30, 41, 59, 0.28)", hover: "rgba(15, 23, 42, 0.55)" },
    nextdotjs: { base: "rgba(15, 23, 42, 0.3)", hover: "rgba(15, 23, 42, 0.6)" },
    mongodb: { base: "rgba(21, 128, 61, 0.32)", hover: "rgba(21, 128, 61, 0.6)" },
    supabase: { base: "rgba(5, 150, 105, 0.32)", hover: "rgba(5, 150, 105, 0.6)" },
    docker: { base: "rgba(14, 165, 233, 0.28)", hover: "rgba(14, 165, 233, 0.58)" },
    kubernetes: { base: "rgba(37, 99, 235, 0.3)", hover: "rgba(37, 99, 235, 0.58)" },
    jenkins: { base: "rgba(220, 38, 38, 0.32)", hover: "rgba(220, 38, 38, 0.6)" },
    terraform: { base: "rgba(124, 58, 237, 0.32)", hover: "rgba(124, 58, 237, 0.62)" },
    ansible: { base: "rgba(220, 38, 38, 0.32)", hover: "rgba(220, 38, 38, 0.6)" },
    amazonaws: { base: "rgba(249, 115, 22, 0.3)", hover: "rgba(249, 115, 22, 0.6)" },
    googlecloud: { base: "rgba(59, 130, 246, 0.3)", hover: "rgba(59, 130, 246, 0.58)" },
    linux: { base: "rgba(252, 198, 36, 0.3)", hover: "rgba(252, 198, 36, 0.6)" },
    gnubash: { base: "rgba(78, 170, 37, 0.3)", hover: "rgba(78, 170, 37, 0.6)" },
  };

  const skills = [
    { name: "HTML5", slug: "html5", color: "text-orange-600" },
    { name: "CSS3", slug: "css3", color: "text-blue-600" },
    { name: "JavaScript", slug: "javascript", color: "text-yellow-500" },
    { name: "Tailwind", slug: "tailwindcss", color: "text-cyan-500" },
    { name: "React", slug: "react", color: "text-cyan-400" },
    { name: "Angular", slug: "angular", color: "text-red-600" },
    { name: "Firebase", slug: "firebase", color: "text-amber-500" },
    { name: "Node.js", slug: "nodedotjs", color: "text-green-600" },
    { name: "Express", slug: "express", color: "text-slate-700" },
    { name: "Next.js", slug: "nextdotjs", color: "text-slate-900" },
    { name: "MongoDB", slug: "mongodb", color: "text-green-700" },
    { name: "Supabase", slug: "supabase", color: "text-emerald-600" },
    { name: "Docker", slug: "docker", color: "text-blue-500" },
    { name: "Kubernetes", slug: "kubernetes", color: "text-blue-600" },
    { name: "Jenkins", slug: "jenkins", color: "text-red-700" },
    { name: "Terraform", slug: "terraform", color: "text-purple-600" },
    { name: "Ansible", slug: "ansible", color: "text-red-600" },
    { name: "AWS", slug: "amazonaws", color: "text-orange-500" },
    { name: "GCP", slug: "googlecloud", color: "text-blue-500" },
    { name: "Linux", slug: "linux", color: "text-yellow-600" },
    { name: "Shell Script", slug: "gnubash", color: "text-green-600" },
  ];

  const socials = [
    { name: "GitHub", slug: "github", href: "https://github.com/" },
    { name: "WhatsApp", slug: "whatsapp", href: "https://wa.me/9304767761" },
    { name: "Email", slug: "gmail", href: "mailto:krishmishra9801@gmail.com" },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 text-slate-900 antialiased overflow-hidden font-['Syne',sans-serif]">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-white/30 backdrop-blur-sm z-50">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 via-green-500 to-lime-500 transition-all duration-150"
          style={{ width: `${scrollProgress}% ` }}
        />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-emerald-100 opacity-80 animate-gradient" />
        <div className="absolute inset-0 opacity-38 [mask-image:linear-gradient(to_right,transparent_0%,transparent_52%,black_78%,black_100%)]">
          <DotGrid
            dotSize={6}
            gap={18}
            baseColor="#1f2937"
            activeColor="#16a34a"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-slate-50/80 to-emerald-100/55" />
      </div>

      <header className="sticky top-4 z-40 mx-auto max-w-7xl px-6">
        <div className="backdrop-blur-md bg-white/90 border border-[#d0d7de] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="text-lg font-extrabold uppercase tracking-wider text-[#24292f]">KRISH MISHRA</div>
          <nav className="flex items-center gap-4">
            <button onClick={() => scrollTo("about")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg border transition-all ${active === "about" ? "bg-[#2da44e] border-[#2da44e] text-white" : "bg-[#f6f8fa] border-[#d0d7de] text-[#24292f] hover:bg-[#eef2f6] hover:border-[#8c959f]"}`}>
              About
            </button>
            <button onClick={() => scrollTo("skills")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg border transition-all ${active === "skills" ? "bg-[#2da44e] border-[#2da44e] text-white" : "bg-[#f6f8fa] border-[#d0d7de] text-[#24292f] hover:bg-[#eef2f6] hover:border-[#8c959f]"}`}>
              Skills
            </button>
            <button onClick={() => scrollTo("projects")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg border transition-all ${active === "projects" ? "bg-[#2da44e] border-[#2da44e] text-white" : "bg-[#f6f8fa] border-[#d0d7de] text-[#24292f] hover:bg-[#eef2f6] hover:border-[#8c959f]"}`}>
              Projects
            </button>
            <button onClick={() => scrollTo("connect")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg border transition-all ${active === "connect" ? "bg-[#2da44e] border-[#2da44e] text-white" : "bg-[#f6f8fa] border-[#d0d7de] text-[#24292f] hover:bg-[#eef2f6] hover:border-[#8c959f]"}`}>
              Contact
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        {/* ABOUT */}
        <section id="about" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start py-16">
          {/* LEFT: Main heading and typing effect */}
          <div className="order-2 md:order-1 space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-wider text-left leading-tight">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-green-600 to-lime-600">
                HEY, I'M KRISH MISHRA
              </span>
            </h1>

            <div className="text-xl md:text-2xl font-semibold leading-relaxed min-h-[2.5rem] flex items-center">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-green-600 to-lime-600">{typedText}</span>
                <span className="inline-block w-0.5 h-6 bg-gradient-to-b from-emerald-700 to-green-500 animate-pulse ml-1"></span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                <span className="bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">Fast.</span>{" "}
                <span className="bg-gradient-to-r from-green-700 to-lime-600 bg-clip-text text-transparent">Vibrant.</span>{" "}
                <span className="bg-gradient-to-r from-slate-700 to-emerald-700 bg-clip-text text-transparent">Interactive.</span>
              </p>

              <p className="text-lg text-slate-800 leading-relaxed">
                I build <span className="font-bold text-emerald-700">modern web experiences</span> with a focus on <span className="font-bold text-green-700">performance</span>, <span className="font-bold text-slate-700">delightful UI</span>, and <span className="font-bold text-lime-700">smooth animations</span> that captivate users.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-300/40 to-green-300/40 backdrop-blur-sm border border-emerald-500/40 font-semibold text-emerald-900">
                🚀 Open to internships
              </span>
              <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-300/45 to-emerald-200/45 backdrop-blur-sm border border-slate-400/50 font-semibold text-slate-800">
                💼 Open to full-time roles
              </span>
            </div>

            <div className="space-y-4 bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
              <h3 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                🎯 What I Do
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                I specialize in building <span className="font-bold text-green-700">responsive single-page applications</span> with a laser focus on <span className="font-bold text-emerald-700">UI performance</span>, <span className="font-bold text-slate-700">accessibility</span>, and <span className="font-bold text-lime-700">smooth animations</span>.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                My toolkit includes cutting-edge technologies: <span className="font-semibold text-blue-600">React</span>, <span className="font-semibold text-slate-800">Next.js</span>, <span className="font-semibold text-cyan-500">Tailwind CSS</span>, <span className="font-semibold text-green-600">Node.js</span>, and cloud platforms like <span className="font-semibold text-orange-500">AWS</span>, <span className="font-semibold text-blue-500">GCP</span>, and <span className="font-semibold text-amber-500">Firebase</span>.
              </p>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-600 leading-relaxed">
                  💡 I love transforming <span className="italic">complex UI challenges</span> into <span className="font-bold text-emerald-700">simple, delightful experiences</span>. Currently seeking <span className="font-bold text-green-700">internship opportunities</span> and <span className="font-bold text-slate-800">full-time job opportunities</span> — let's connect!
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Hero card with image */}
          <div className="order-1 md:order-2 flex justify-end">
            <div ref={heroRef} className="relative w-full max-w-xl md:max-w-2xl h-80 md:h-[32rem] rounded-3xl bg-white/60 backdrop-blur-md border border-white/30 shadow-2xl transform-gpu overflow-hidden">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-green-600">
                  UI / UX & Web Dev
                </div>
              </div>

              <img
                src={heroImage}
                alt="Hero"
                className="absolute inset-0 w-full h-full object-cover opacity-95"
              />

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                <a
                  href="#connect"
                  className="group/btn px-6 py-3 rounded-xl bg-gradient-to-r from-[#f6f8fa] to-[#eef2f6] backdrop-blur-md border border-[#d0d7de] font-medium text-[#24292f] hover:scale-105 hover:shadow-xl transition-all duration-300 hover:from-[#eef2f6] hover:to-[#e6edf3] hover:border-[#8c959f] cursor-pointer"
                >
                  <span className="group-hover/btn:tracking-wider transition-all duration-300">Let's Talk</span>
                </a>
                <a
                  href="/resume.pdf"
                  download
                  className="group/btn px-6 py-3 rounded-xl bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] backdrop-blur-md border border-[#2da44e]/45 font-medium text-[#1f883d] hover:scale-105 hover:shadow-xl transition-all duration-300 hover:from-[#dcfce7] hover:to-[#bbf7d0] hover:border-[#1f883d]/60 cursor-pointer"
                >
                  <span className="group-hover/btn:tracking-wider transition-all duration-300">Resume</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STATS & ACHIEVEMENTS */}
        <section className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="group bg-gradient-to-br from-emerald-300/35 to-green-300/35 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-400/50 hover:scale-105 transition-all transform hover:border-emerald-500">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
                15+
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Projects Completed</div>
              <div className="text-xs text-slate-600 mt-1">Web & Mobile Apps</div>
            </div>

            <div className="group bg-gradient-to-br from-slate-300/35 to-emerald-200/35 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-400/45 hover:scale-105 transition-all transform hover:border-emerald-500">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-slate-700 to-emerald-700 bg-clip-text text-transparent">
                3+
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Years Experience</div>
              <div className="text-xs text-slate-600 mt-1">Learning & Building</div>
            </div>

            <div className="group bg-gradient-to-br from-green-200/35 to-lime-200/35 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-300/45 hover:scale-105 transition-all transform hover:border-green-500">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-green-700 to-lime-700 bg-clip-text text-transparent">
                10+
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Tech Stack</div>
              <div className="text-xs text-slate-600 mt-1">Modern Technologies</div>
            </div>

            <div className="group bg-gradient-to-br from-slate-300/35 to-green-200/35 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-400/45 hover:scale-105 transition-all transform hover:border-green-500">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-slate-700 to-green-700 bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Project Quality</div>
              <div className="text-xs text-slate-600 mt-1">Quality Focused</div>
            </div>
          </div>
        </section>


        {/* SKILLS - larger */}
        <section id="skills" ref={pinRef} className="py-16">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-700 via-green-700 to-lime-700 bg-clip-text text-transparent">
              🛠️ Skills & Technologies
            </h2>
            <p className="text-slate-600 text-lg">
              Scroll horizontally to explore my <span className="font-bold text-emerald-700">tech stack</span> 👉
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-100/85 via-green-100/75 to-lime-100/80 backdrop-blur-sm p-10 shadow-2xl border-2 border-[#04912a]/45">
            <div className="flex gap-8 items-center will-change-transform py-6" ref={skillsRef}>
              {skills.map((s) => {
                const palette = skillShadowPalette[s.slug] ?? { base: "rgba(100, 116, 139, 0.25)", hover: "rgba(71, 85, 105, 0.45)" };
                return (
                  <div
                    key={s.slug}
                    className="skill-card flex-shrink-0 w-64 h-32 p-5 rounded-2xl border-2 border-[#04912a]/35 bg-white/90 backdrop-blur-md transition duration-150 transform-gpu hover:scale-105 flex items-center gap-5 group"
                    data-shadow-base={palette.base}
                    data-shadow-hover={palette.hover}
                    style={{ boxShadow: "none" }}
                  >
                    <img
                      src={`${SIMPLE_ICONS_PRIMARY}/${s.slug}`}
                      data-fallback={`${SIMPLE_ICONS_FALLBACK}/${s.slug}.svg`}
                      alt={s.name}
                      className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                      onError={handleIconError}
                      loading="lazy"
                    />
                    <div>
                      <div className={`text-xl font-bold ${s.color} transition-colors`}>{s.name}</div>
                      <div className="text-xs text-slate-500 font-medium">Proficient</div>
                    </div>
                  </div >
                );
              })}
            </div >
          </div >
          <p className="mt-6 text-sm text-slate-700 bg-gradient-to-r from-white/85 to-emerald-50/80 backdrop-blur-sm p-4 rounded-xl border border-[#04912a]/35">
            💡 <span className="font-bold text-green-700">Pro Tip:</span> Use your mouse wheel or swipe to scroll through my skills horizontally while this section stays pinned! Each technology represents real-world project experience.
          </p>

        </section>

        <div className="py-16">
          <ProjectCards />
        </div>

        {/* LET'S CONNECT */}
        < section id="connect" className="py-16" >
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-700 via-green-700 to-slate-700 bg-clip-text text-transparent">
              🤝 Let's Connect & Collaborate
            </h2>
            <p className="text-slate-600 text-lg">
              I'm always excited to discuss <span className="font-bold text-green-700">new opportunities</span>, <span className="font-bold text-emerald-700">creative projects</span>, or just chat about <span className="font-bold text-slate-800">tech</span>!
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/90 to-emerald-50/70 backdrop-blur-lg rounded-3xl p-8 md:p-12 border-2 border-[#d0d7de] shadow-2xl space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800">Quick Response ⚡</h3>
                <p className="text-slate-600 leading-relaxed">
                  I usually respond within <span className="font-bold text-emerald-700">24 hours</span> on most platforms. For urgent inquiries, <span className="font-bold text-green-700">LinkedIn</span> or <span className="font-bold text-slate-800">Email</span> work best!
                </p>
                <div className="bg-gradient-to-r from-emerald-100/70 to-green-100/70 rounded-2xl p-4 border border-[#2da44e]/40">
                  <p className="text-sm text-slate-700">
                    💼 <span className="font-bold">Open for:</span> Full-time roles, Internships, Graduate roles
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800">What I'm Looking For 🎯</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><span className="font-bold text-emerald-700">Frontend/Full-stack</span> development roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><span className="font-bold text-green-700">DevOps & Cloud</span> engineering opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 font-bold">✓</span>
                    <span><span className="font-bold text-slate-700">Exciting projects</span> with modern tech stacks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><span className="font-bold text-emerald-700">Collaborative teams</span> that value innovation</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-[#d0d7de]/80">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Find Me On 🌐</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {socials.map((s, i) => (
                  <a
                    key={s.name}
                    href={s.href}
                    ref={(el) => (socialRefs.current[i] = el)}
                    onMouseEnter={() => onSocialHover(i)}
                    onMouseLeave={() => onSocialLeave(i)}
                    className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#f6f8fa]/90 backdrop-blur-md border-2 border-[#d0d7de] hover:border-[#2da44e] transition-all transform hover:scale-105"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <img src={`https://cdn.simpleicons.org/${s.slug}`} alt={s.name} className="w-6 h-6 object-contain brightness-0 invert" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{s.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section >
      </main >
      <footer className="relative z-10 max-w-7xl mx-auto px-6 pb-8 pt-8 text-center space-y-4 border-t-2 border-[#d0d7de] bg-white/90 backdrop-blur-md rounded-t-3xl shadow-[0_-36px_75px_rgba(15,23,42,0.2),0_48px_110px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">💻</span>
          <p className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
            Krish Mishra
          </p>
        </div>
        <p className="text-sm text-slate-600">
          Built with <span className="text-red-500">❤️</span> using React, Tailwind CSS, and GSAP
        </p>
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} NO rights reserved — Let's build something amazing together!
        </p>
      </footer>
      <ScrollToTopButton />
    </div >
  );
}