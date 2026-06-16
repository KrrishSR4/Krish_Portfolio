import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import heroImage from "@/assets/Hero-Krish.png";
import { ScrollToTopButton } from "./ui/scroll-to-top";
import DotGrid from "./DotGrid";
const ProjectCards = lazy(() => import("./ProjectCards"));


gsap.registerPlugin(ScrollTrigger);

// Android device detection and performance optimizations
const isAndroidDevice = () => {
  return /Android/i.test(navigator.userAgent);
};

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Android-specific performance settings
const getAndroidPerformanceSettings = () => {
  if (!isAndroidDevice()) return {};

  return {
    willChange: 'transform',
    transform: 'translateZ(0)', // Hardware acceleration
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
  };
};

// Enhanced device orientation detection for Android
const requestDeviceOrientationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  // Android devices typically don't need permission prompts
  if (isAndroidDevice()) {
    return true;
  }

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
        start: "top 132px",
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
      const hoverShadow = `0 10px 25px ${hoverColor}`;

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
    gsap.to(el, { scale: 1.03, y: -3, boxShadow: "4px 4px 0px #0f172a", duration: 0.2, ease: "power2.out" });
  };
  const onSocialLeave = (idx: number) => {
    const el = socialRefs.current[idx];
    if (!el) return;
    gsap.to(el, { scale: 1, y: 0, boxShadow: "2px 2px 0px #0f172a", duration: 0.2, ease: "power2.out" });
  };

  // Device orientation for all interactive elements
  useEffect(() => {
    const onOrientationChange = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;

      // Android-specific optimizations
      const sensitivity = isAndroidDevice() ? 0.5 : 1;
      const smoothing = isAndroidDevice() ? 0.1 : 0.15;

      const x = (e.gamma / 90) * sensitivity;
      const y = ((e.beta - 90) / 90) * sensitivity;

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
    window.dispatchEvent(
      new CustomEvent("lenis-scroll-to", {
        detail: {
          target: el,
          options: { offset: -132 },
        },
      })
    );
  };

  const navButtonClass = (id: string) =>
    `text-[11px] md:text-xs uppercase tracking-[0.18em] px-3 md:px-4 py-2 rounded-none border border-slate-900 transition-all shadow-[2px_2px_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a] ${
      active === id
        ? "bg-[#2ea043] text-white"
        : "bg-white text-slate-900 hover:bg-emerald-50 hover:text-[#1f883d]"
    }`;

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-950 antialiased overflow-hidden font-['Syne',sans-serif]">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-white/30 backdrop-blur-sm z-50">
        <div
          className="h-full bg-[#2ea043] transition-all duration-150"
          style={{ width: `${scrollProgress}% ` }}
        />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 opacity-50 [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.4)_25%,rgba(0,0,0,0.7)_50%,black_75%,black_100%)]">
          <DotGrid
            dotSize={isAndroidDevice() ? 4 : 6}
            gap={isAndroidDevice() ? 14 : 18}
            baseColor="#475569"
            activeColor="#4f46e5"
            proximity={isAndroidDevice() ? 80 : 120}
            shockRadius={isAndroidDevice() ? 150 : 250}
            shockStrength={isAndroidDevice() ? 3 : 5}
            resistance={isAndroidDevice() ? 500 : 750}
            returnDuration={isAndroidDevice() ? 1.0 : 1.5}
            style={getAndroidPerformanceSettings()}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.08),transparent_35%),radial-gradient(circle_at_86%_8%,rgba(14,165,233,0.06),transparent_30%),linear-gradient(135deg,rgba(248,250,252,0.95),rgba(255,255,255,0.85))]" />
      </div>

      <header className="fixed top-4 left-0 right-0 z-40 mx-auto max-w-7xl px-6">
        <div className="bg-white/90 border border-slate-900 rounded-none p-3 md:p-4 flex items-center justify-between shadow-[3px_3px_0_#0f172a]">
          <div className="text-lg md:text-xl font-black uppercase tracking-[0.22em] text-slate-950">KRISH MISHRA</div>
          <nav className="flex items-center gap-2 md:gap-4">
            <button onClick={() => scrollTo("about")} className={navButtonClass("about")}>
              About
            </button>
            <button onClick={() => scrollTo("skills")} className={navButtonClass("skills")}>
              Skills
            </button>
            <button onClick={() => scrollTo("projects")} className={navButtonClass("projects")}>
              Projects
            </button>
            <button onClick={() => scrollTo("connect")} className={navButtonClass("connect")}>
              Contact
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* ABOUT */}
        <section id="about" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start py-16">
          {/* LEFT: Main heading and typing effect */}
          <div className="order-2 md:order-1 space-y-8 bg-white/88 rounded-none p-6 md:p-8 border border-slate-900 shadow-[4px_4px_0_#0f172a]">
            <h1 className="text-left uppercase leading-[0.9] max-w-full">
              <span className="block font-['JetBrains_Mono',monospace] text-xl md:text-2xl font-bold tracking-[0.26em] text-slate-700 mb-3">
                HEY I'M
              </span>
              <span className="block max-w-full whitespace-nowrap font-black text-[clamp(2.25rem,3.85vw,4.15rem)] tracking-[-0.075em] text-slate-950 [font-stretch:condensed]">
                KRISH MISHRA
              </span>
            </h1>

            <div className="text-sm md:text-base font-semibold leading-none min-h-[2.25rem] flex items-center max-w-full">
              <div className="flex items-center gap-2 max-w-full min-w-0">
                <span className="inline-block w-2.5 h-2.5 bg-white border border-slate-900 animate-pulse flex-shrink-0"></span>
                <span className="inline-block max-w-full whitespace-nowrap overflow-hidden text-ellipsis font-['JetBrains_Mono',monospace] text-slate-950 bg-white px-2 py-1 border border-slate-900">
                  {typedText}
                </span>
                <span className="inline-block w-0.5 h-5 bg-slate-950 animate-pulse ml-0.5 flex-shrink-0"></span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                <span className="bg-emerald-50 px-1 border border-slate-900 text-emerald-700">Fast.</span>{" "}
                <span className="bg-emerald-100 px-1 border border-slate-900 text-emerald-800">Vibrant.</span>{" "}
                <span className="bg-emerald-200/50 px-1 border border-slate-900 text-emerald-900">Interactive.</span>
              </p>

              <p className="text-lg text-slate-800 leading-relaxed">
                I build <span className="font-bold text-[#1f883d]">modern web experiences</span> with a focus on <span className="font-bold text-emerald-600">performance</span>, <span className="font-bold text-emerald-700">delightful UI</span>, and <span className="font-bold text-emerald-800">smooth animations</span> that captivate users.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-900 text-emerald-800 text-xs font-semibold uppercase tracking-wider shadow-[2px_2px_0_#0f172a]">
                Open to internships
              </span>
              <span className="px-3 py-1 bg-emerald-100 border border-emerald-900 text-emerald-900 text-xs font-semibold uppercase tracking-wider shadow-[2px_2px_0_#0f172a]">
                Open to full-time roles
              </span>
            </div>

            <div className="space-y-4 bg-emerald-50/20 rounded-none p-6 border border-slate-900 shadow-[3px_3px_0_#0f172a]">
              <h3 className="text-lg font-black uppercase tracking-[0.16em] text-emerald-900">
                What I Do
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                I specialize in building <span className="font-bold text-emerald-700">responsive single-page applications</span> with a laser focus on <span className="font-bold text-emerald-850">UI performance</span>, <span className="font-bold text-slate-700">accessibility</span>, and <span className="font-bold text-emerald-800">smooth animations</span>.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                My toolkit includes cutting-edge technologies: <span className="font-semibold text-blue-600">React</span>, <span className="font-semibold text-slate-800">Next.js</span>, <span className="font-semibold text-cyan-500">Tailwind CSS</span>, <span className="font-semibold text-green-600">Node.js</span>, and cloud platforms like <span className="font-semibold text-orange-500">AWS</span>, <span className="font-semibold text-blue-500">GCP</span>, and <span className="font-semibold text-amber-500">Firebase</span>.
              </p>
              <div className="pt-3 border-t border-slate-300">
                <p className="text-sm text-slate-600 leading-relaxed">
                  I love transforming <span className="italic">complex UI challenges</span> into <span className="font-bold text-emerald-700">simple, delightful experiences</span>. Currently seeking <span className="font-bold text-emerald-800">internship opportunities</span> and <span className="font-bold text-slate-800">full-time job opportunities</span> — let's connect!
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Hero card with image */}
          <div className="order-1 md:order-2 flex justify-end">
            <div ref={heroRef} className={`relative w-full max-w-xl md:max-w-2xl h-80 md:h-[32rem] rounded-none bg-white border border-slate-900 shadow-[4px_4px_0_#0f172a] transform-gpu overflow-hidden ${isAndroidDevice() ? 'will-change-transform' : ''}`} style={getAndroidPerformanceSettings()}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="text-xl md:text-2xl font-black uppercase tracking-[0.16em] bg-[#2ea043] border border-slate-900 px-4 py-2 text-white shadow-[3px_3px_0_#0f172a]">
                  UI / UX & Web Dev
                </div>
              </div>

              <img
                src={heroImage}
                alt="Hero"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover opacity-95"
                style={{ contentVisibility: 'auto' }}
              />

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                <a
                  href="#connect"
                  className="group/btn px-6 py-3 rounded-none bg-[#2ea043] border border-slate-900 font-black uppercase tracking-[0.12em] text-white shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0f172a] hover:bg-[#238636] transition-all duration-300 cursor-pointer"
                >
                  <span className="group-hover/btn:tracking-wider transition-all duration-300">Let's Talk</span>
                </a>
                <a
                  href="/resume.pdf"
                  download
                  className="group/btn px-6 py-3 rounded-none bg-white border border-slate-900 font-black uppercase tracking-[0.12em] text-slate-900 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0f172a] hover:bg-emerald-50 hover:text-[#1f883d] transition-all duration-300 cursor-pointer"
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
            <div className="group bg-white rounded-none p-6 border border-slate-900 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5 transition-all transform">
              <div className="text-5xl font-black text-[#2ea043]">
                15+
              </div>
              <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-950 mt-2">Projects Completed</div>
              <div className="text-xs text-slate-600 mt-1 font-['JetBrains_Mono',monospace]">Web & Mobile Apps</div>
            </div>

            <div className="group bg-white rounded-none p-6 border border-slate-900 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5 transition-all transform">
              <div className="text-5xl font-black text-[#2ea043]">
                3+
              </div>
              <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-950 mt-2">Years Experience</div>
              <div className="text-xs text-slate-600 mt-1 font-['JetBrains_Mono',monospace]">Learning & Building</div>
            </div>

            <div className="group bg-white rounded-none p-6 border border-slate-900 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5 transition-all transform">
              <div className="text-5xl font-black text-[#2ea043]">
                10+
              </div>
              <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-950 mt-2">Tech Stack</div>
              <div className="text-xs text-slate-600 mt-1 font-['JetBrains_Mono',monospace]">Modern Technologies</div>
            </div>

            <div className="group bg-white rounded-none p-6 border border-slate-900 shadow-[3px_3px_0_#0f172a] hover:-translate-y-0.5 transition-all transform">
              <div className="text-5xl font-black text-[#2ea043]">
                100%
              </div>
              <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-950 mt-2">Project Quality</div>
              <div className="text-xs text-slate-600 mt-1 font-['JetBrains_Mono',monospace]">Quality Focused</div>
            </div>
          </div>
        </section>


        {/* SKILLS - larger */}
        <section id="skills" ref={pinRef} className="scroll-mt-40 pt-32 pb-16">
          <div className="mb-8">
            <h2 className="text-4xl md:text-6xl font-black uppercase leading-none mb-3 text-slate-950">
              Skills & Technologies
            </h2>
            <p className="text-slate-700 text-lg font-['JetBrains_Mono',monospace]">
              Scroll horizontally to explore my <span className="font-bold text-[#1f883d]">tech stack</span>
            </p>
          </div>

          <div className="overflow-hidden rounded-none bg-emerald-50/30 p-8 md:p-10 shadow-[4px_4px_0_#0f172a] border border-slate-900">
            <div className="flex gap-8 items-center will-change-transform py-6" ref={skillsRef}>
              {skills.map((s) => {
                const palette = skillShadowPalette[s.slug] ?? { base: "rgba(16, 185, 129, 0.15)", hover: "rgba(16, 185, 129, 0.35)" };
                return (
                  <div
                    key={s.slug}
                    className="skill-card flex-shrink-0 w-64 h-32 p-5 rounded-none border border-slate-900 bg-white transition duration-150 transform-gpu hover:scale-105 flex items-center gap-5 group shadow-[3px_3px_0_#0f172a]"
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
                      decoding="async"
                      style={{ contentVisibility: 'auto' }}
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
          <p className="mt-6 text-sm text-slate-700 bg-emerald-50 p-4 rounded-none border border-emerald-900 shadow-[2px_2px_0_#0f172a]">
            <span className="font-bold text-emerald-950">Pro Tip:</span> Use your mouse wheel or swipe to scroll through my skills horizontally while this section stays pinned! Each technology represents real-world project experience.
          </p>

        </section>

        <div className="py-16">
          <Suspense fallback={
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          }>
            <ProjectCards />
          </Suspense>
        </div>        {/* LET'S CONNECT */}
        <section id="connect" className="py-16">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900">
              Let's Connect & Collaborate
            </h2>
            <p className="text-slate-600 text-lg">
              I'm always excited to discuss <span className="font-bold text-slate-900">new opportunities</span>, <span className="font-bold text-[#1f883d]">creative projects</span>, or just chat about <span className="font-bold text-emerald-700">tech</span>!
            </p>
          </div>

          <div className="bg-slate-50 p-8 md:p-12 border border-slate-900 shadow-[4px_4px_0_#0f172a] space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-850">Quick Response</h3>
                <p className="text-slate-750 leading-relaxed">
                  I usually respond within <span className="font-bold text-[#1f883d]">24 hours</span> on most platforms. For urgent inquiries, <span className="font-bold text-emerald-600">LinkedIn</span> or <span className="font-bold text-emerald-700">Email</span> work best!
                </p>
                <div className="bg-emerald-50 p-4 border border-emerald-900 shadow-[2px_2px_0_#0f172a] rounded-none">
                  <p className="text-sm text-emerald-950">
                    <span className="font-bold">Open for:</span> Full-time roles, Internships, Graduate roles
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-855">What I'm Looking For</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#1f883d] font-bold">✓</span>
                    <span><span className="font-bold text-emerald-700">Frontend/Full-stack</span> development roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><span className="font-bold text-emerald-700">DevOps & Cloud</span> engineering opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><span className="font-bold text-emerald-800">Exciting projects</span> with modern tech stacks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1f883d] font-bold">✓</span>
                    <span><span className="font-bold text-emerald-700">Collaborative teams</span> that value innovation</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-900">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Find Me On</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {socials.map((s, i) => {
                  const brandColors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
                    github: { bg: "bg-emerald-50", border: "border-emerald-900", text: "text-emerald-900 hover:text-emerald-950", iconBg: "bg-emerald-600" },
                    whatsapp: { bg: "bg-emerald-50", border: "border-emerald-900", text: "text-emerald-900 hover:text-emerald-950", iconBg: "bg-[#2ea043]" },
                    gmail: { bg: "bg-emerald-50", border: "border-emerald-900", text: "text-emerald-900 hover:text-emerald-950", iconBg: "bg-emerald-600" },
                  };
                  const brand = brandColors[s.slug] ?? { bg: "bg-white", border: "border-slate-900", text: "text-slate-800", iconBg: "bg-slate-900" };
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      ref={(el) => (socialRefs.current[i] = el)}
                      onMouseEnter={() => onSocialHover(i)}
                      onMouseLeave={() => onSocialLeave(i)}
                      className={`group flex items-center gap-4 px-5 py-4 ${brand.bg} border ${brand.border} shadow-[2px_2px_0_#0f172a] hover:bg-opacity-80 transition-all transform hover:scale-105`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className={`w-10 h-10 ${brand.iconBg} flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                        <img src={`https://cdn.simpleicons.org/${s.slug}`} alt={s.name} className="w-6 h-6 object-contain brightness-0 invert" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      </div>
                      <span className={`text-sm font-bold ${brand.text} transition-colors`}>{s.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section >
      </main >
      <footer className="relative z-10 max-w-7xl mx-auto px-6 pb-8 pt-8 text-center space-y-4 border border-slate-900 bg-white shadow-[4px_4px_0_#0f172a] rounded-none">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">💻</span>
          <p className="text-lg font-bold text-slate-900">
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
