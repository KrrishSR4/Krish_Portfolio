import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import heroImage from "@/assets/Hero-Krish.png";
import { ScrollToTopButton } from "./ui/scroll-to-top";

gsap.registerPlugin(ScrollTrigger);

// Helper to safely request DeviceOrientation permission on iOS (and fall back on non-iOS)
const requestDeviceOrientationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  const Dev = (window as any).DeviceOrientationEvent ?? undefined;
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

export default function KrrishPortfolio() {
  const skillsRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const projectRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  // Typing lines
  const lines = [
    "Engineering student 23-27",
    "Web Developer",
    "Exploring DSA and Open-Source",
    "DevOps and Cloud Computing aspirant",
  ];

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
  }, []);

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
      const hoverShadow = `0 75px 130px ${hoverColor}, 0 -32px 60px ${topShadowColor}`;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Project card hover parallax using refs
  const onProjectMove = (e: React.MouseEvent, idx: number) => {
    const el = projectRefs.current[idx];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, { x: x * 8, y: y * 6, rotationY: x * 6, rotationX: -y * 4, duration: 0.35, ease: "power3.out" });
  };
  const onProjectLeave = (idx: number) => {
    const el = projectRefs.current[idx];
    if (!el) return;
    gsap.to(el, { x: 0, y: 0, rotationY: 0, rotationX: 0, duration: 0.6, ease: "power3.out" });
  };

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

      // Apply tilt to project cards
      projectRefs.current.forEach((el) => {
        if (el) {
          gsap.to(el, {
            rotationY: x * 3,
            rotationX: -y * 3,
            duration: 0.6,
            ease: "power2.out",
          });
        }
      });

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
  ];

  const projects = [
    {
      title: "E-Commerce Platform",
      desc: "Full-stack e-commerce solution with real-time inventory, payment gateway integration, and admin dashboard. Built with React, Node.js, and MongoDB for seamless shopping experience.",
      tags: ["React", "Node.js", "MongoDB", "Stripe"],
      gradient: "from-purple-400 to-pink-400"
    },
    {
      title: "AI ChatBot Assistant",
      desc: "Intelligent chatbot powered by NLP and machine learning. Provides 24/7 customer support with context-aware responses and seamless CRM integration.",
      tags: ["Python", "TensorFlow", "React", "OpenAI"],
      gradient: "from-cyan-400 to-blue-500"
    },
    {
      title: "Task Management SaaS",
      desc: "Collaborative project management tool with real-time updates, kanban boards, and team analytics. Features include drag-and-drop, notifications, and reporting.",
      tags: ["Next.js", "Supabase", "Tailwind"],
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      title: "DevOps Pipeline Automation",
      desc: "CI/CD automation platform streamlining deployment workflows. Integrates with GitHub, Docker, and Kubernetes for automated testing and deployment.",
      tags: ["Jenkins", "Docker", "K8s", "Terraform"],
      gradient: "from-orange-400 to-red-500"
    },
    {
      title: "Real-time Analytics Dashboard",
      desc: "Interactive data visualization platform processing millions of events. Features live charts, custom metrics, and exportable reports for business insights.",
      tags: ["React", "D3.js", "Firebase", "Charts"],
      gradient: "from-indigo-400 to-purple-500"
    },
    {
      title: "Cloud Infrastructure Manager",
      desc: "Multi-cloud management system for AWS, GCP, and Azure. Provides cost optimization, resource monitoring, and automated scaling capabilities.",
      tags: ["AWS", "GCP", "Terraform", "Python"],
      gradient: "from-pink-400 to-rose-500"
    },
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-pink-50 to-emerald-50 text-slate-900 antialiased">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-white/30 backdrop-blur-sm z-50">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-pink-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-pink-50 to-emerald-100 opacity-70 animate-gradient" />
      </div>

      <header className="sticky top-4 z-40 mx-auto max-w-7xl px-6">
        <div className="backdrop-blur-md bg-[#d9d9d9]/95 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="text-lg font-extrabold uppercase tracking-wider">KRISH MISHRA</div>
          <nav className="flex items-center gap-4">
            <button onClick={() => scrollTo("about")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg transition-all ${active === "about" ? "bg-[#6f7480] text-white" : "bg-[#b1b5be] text-slate-900 hover:bg-[#8f949d] hover:text-white"}`}>
              About
            </button>
            <button onClick={() => scrollTo("skills")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg transition-all ${active === "skills" ? "bg-[#6f7480] text-white" : "bg-[#b1b5be] text-slate-900 hover:bg-[#8f949d] hover:text-white"}`}>
              Skills
            </button>
            <button onClick={() => scrollTo("projects")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg transition-all ${active === "projects" ? "bg-[#6f7480] text-white" : "bg-[#b1b5be] text-slate-900 hover:bg-[#8f949d] hover:text-white"}`}>
              Projects
            </button>
            <button onClick={() => scrollTo("connect")} className={`text-sm uppercase tracking-wide px-3 py-2 rounded-lg transition-all ${active === "connect" ? "bg-[#6f7480] text-white" : "bg-[#b1b5be] text-slate-900 hover:bg-[#8f949d] hover:text-white"}`}>
              Contact
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {/* ABOUT */}
        <section id="about" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start py-16">
          {/* LEFT: Main heading and typing effect */}
          <div className="order-2 md:order-1 space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-wider text-left leading-tight">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
                HEY, I'M KRISH MISHRA
              </span>
            </h1>

            <div className="text-xl md:text-2xl font-semibold leading-relaxed min-h-[2.5rem] flex items-center">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-cyan-400 to-pink-500">{typedText}</span>
                <span className="inline-block w-0.5 h-6 bg-gradient-to-b from-pink-500 to-cyan-500 animate-pulse ml-1"></span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">Fast.</span>{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">Vibrant.</span>{" "}
                <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">Interactive.</span>
              </p>

              <p className="text-lg text-slate-700 leading-relaxed">
                I build <span className="font-bold text-emerald-600">modern web experiences</span> with a focus on <span className="font-bold text-cyan-600">performance</span>, <span className="font-bold text-pink-600">delightful UI</span>, and <span className="font-bold text-purple-600">smooth animations</span> that captivate users.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 backdrop-blur-sm border border-emerald-300/50 font-semibold text-emerald-700">
                🚀 Open to internships
              </span>
              <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400/30 to-purple-400/30 backdrop-blur-sm border border-pink-300/50 font-semibold text-pink-700">
                💼 Available for freelance
              </span>
            </div>

            <div className="space-y-4 bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
              <h3 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                🎯 What I Do
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                I specialize in building <span className="font-bold text-cyan-600">responsive single-page applications</span> with a laser focus on <span className="font-bold text-emerald-600">UI performance</span>, <span className="font-bold text-purple-600">accessibility</span>, and <span className="font-bold text-pink-600">smooth animations</span>.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                My toolkit includes cutting-edge technologies: <span className="font-semibold text-blue-600">React</span>, <span className="font-semibold text-slate-800">Next.js</span>, <span className="font-semibold text-cyan-500">Tailwind CSS</span>, <span className="font-semibold text-green-600">Node.js</span>, and cloud platforms like <span className="font-semibold text-orange-500">AWS</span>, <span className="font-semibold text-blue-500">GCP</span>, and <span className="font-semibold text-amber-500">Firebase</span>.
              </p>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-600 leading-relaxed">
                  💡 I love transforming <span className="italic">complex UI challenges</span> into <span className="font-bold text-emerald-600">simple, delightful experiences</span>. Currently seeking <span className="font-bold text-pink-600">internship opportunities</span> and exciting <span className="font-bold text-cyan-600">freelance projects</span> — let's collaborate!
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Hero card with image */}
          <div className="order-1 md:order-2 flex justify-end">
            <div ref={heroRef} className="relative w-full max-w-xl md:max-w-2xl h-80 md:h-[32rem] rounded-3xl bg-white/60 backdrop-blur-md border border-white/30 shadow-2xl transform-gpu overflow-hidden">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-emerald-600">
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
                  className="group/btn px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-200/80 to-emerald-200/80 backdrop-blur-md border border-white/40 font-medium text-slate-800 hover:scale-105 hover:shadow-xl transition-all duration-300 hover:from-cyan-300/90 hover:to-emerald-300/90 cursor-pointer"
                >
                  <span className="group-hover/btn:tracking-wider transition-all duration-300">Let's Talk</span>
                </a>
                <a
                  href="/resume.pdf"
                  download
                  className="group/btn px-6 py-3 rounded-xl bg-gradient-to-r from-pink-200/80 to-purple-200/80 backdrop-blur-md border border-white/40 font-medium text-slate-800 hover:scale-105 hover:shadow-xl transition-all duration-300 hover:from-pink-300/90 hover:to-purple-300/90 cursor-pointer"
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
            <div className="group bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-300/40 hover:scale-105 transition-all transform hover:border-emerald-400">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                15+
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Projects Completed</div>
              <div className="text-xs text-slate-600 mt-1">Web & Mobile Apps</div>
            </div>

            <div className="group bg-gradient-to-br from-purple-400/30 to-pink-400/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-300/40 hover:scale-105 transition-all transform hover:border-purple-400">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                3+
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Years Experience</div>
              <div className="text-xs text-slate-600 mt-1">Learning & Building</div>
            </div>

            <div className="group bg-gradient-to-br from-orange-400/30 to-red-400/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-300/40 hover:scale-105 transition-all transform hover:border-orange-400">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                10+
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Tech Stack</div>
              <div className="text-xs text-slate-600 mt-1">Modern Technologies</div>
            </div>

            <div className="group bg-gradient-to-br from-blue-400/30 to-indigo-400/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-300/40 hover:scale-105 transition-all transform hover:border-blue-400">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2">Client Satisfaction</div>
              <div className="text-xs text-slate-600 mt-1">Quality Focused</div>
            </div>
          </div>
        </section>


        {/* SKILLS - larger */}
        <section id="skills" ref={pinRef} className="py-16">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
              🛠️ Skills & Technologies
            </h2>
            <p className="text-slate-600 text-lg">
              Scroll horizontally to explore my <span className="font-bold text-emerald-600">tech stack</span> 👉
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#f3f4f6] to-[#dfe3eb] backdrop-blur-sm p-10 shadow-2xl border-2 border-white/50">
            <div className="flex gap-8 items-center will-change-transform py-6" ref={skillsRef}>
              {skills.map((s) => {
                const palette = skillShadowPalette[s.slug] ?? { base: "rgba(100, 116, 139, 0.25)", hover: "rgba(71, 85, 105, 0.45)" };
                return (
                  <div
                    key={s.slug}
                    className="skill-card flex-shrink-0 w-64 h-32 p-5 rounded-2xl border-2 border-white/40 bg-white/80 backdrop-blur-md transition duration-150 transform-gpu hover:scale-105 flex items-center gap-5 group"
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
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-600 bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/50">
            💡 <span className="font-bold text-cyan-600">Pro Tip:</span> Use your mouse wheel or swipe to scroll through my skills horizontally while this section stays pinned! Each technology represents real-world project experience.
          </p>
        </section>

        {/* PROJECTS - 6 dummy with interactive hover */}
        <section id="projects" className="py-16">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              🚀 Featured Projects
            </h2>
            <p className="text-slate-600 text-lg">
              Explore my latest work — <span className="font-bold text-purple-600">hover</span> for interactive 3D effects!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((p, idx) => (
              <div
                key={p.title}
                ref={(el) => (projectRefs.current[idx] = el)}
                onMouseMove={(e) => onProjectMove(e, idx)}
                onMouseLeave={() => onProjectLeave(idx)}
                className="group relative p-8 rounded-3xl bg-white/60 backdrop-blur-lg border-2 border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 transform-gpu hover:scale-[1.02] overflow-hidden"
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                <div className="relative z-10 space-y-4">
                  <div className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {p.title}
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed">{p.desc}</div>
                  <div className="flex gap-2 flex-wrap pt-2">
                    {p.tags.map((t) => (
                      <span key={t} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border border-white/50 text-xs font-semibold text-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <a className={`flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r ${p.gradient} text-white font-bold text-center transition-all hover:shadow-xl cursor-pointer transform hover:scale-105`}>
                      View Live ✨
                    </a>
                    <a className="px-5 py-2.5 rounded-xl bg-white/60 backdrop-blur-sm border-2 border-white/70 font-bold text-slate-800 transition-all hover:bg-white cursor-pointer transform hover:scale-105">
                      Code 📂
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LET'S CONNECT */}
        <section id="connect" className="py-16">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              🤝 Let's Connect & Collaborate
            </h2>
            <p className="text-slate-600 text-lg">
              I'm always excited to discuss <span className="font-bold text-cyan-600">new opportunities</span>, <span className="font-bold text-purple-600">creative projects</span>, or just chat about <span className="font-bold text-pink-600">tech</span>!
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border-2 border-white/50 shadow-2xl space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800">Quick Response ⚡</h3>
                <p className="text-slate-600 leading-relaxed">
                  I usually respond within <span className="font-bold text-emerald-600">24 hours</span> on most platforms. For urgent inquiries, <span className="font-bold text-cyan-600">LinkedIn</span> or <span className="font-bold text-blue-500">Email</span> work best!
                </p>
                <div className="bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-2xl p-4 border border-emerald-300/30">
                  <p className="text-sm text-slate-700">
                    💼 <span className="font-bold">Open for:</span> Full-time roles, Internships, Freelance projects, Technical consultations
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800">What I'm Looking For 🎯</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><span className="font-bold text-emerald-600">Frontend/Full-stack</span> development roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">✓</span>
                    <span><span className="font-bold text-cyan-600">DevOps & Cloud</span> engineering opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">✓</span>
                    <span><span className="font-bold text-purple-600">Exciting projects</span> with modern tech stacks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 font-bold">✓</span>
                    <span><span className="font-bold text-pink-600">Collaborative teams</span> that value innovation</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-white/40">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Find Me On 🌐</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {socials.map((s, i) => (
                  <a
                    key={s.name}
                    href={s.href}
                    ref={(el) => (socialRefs.current[i] = el)}
                    onMouseEnter={() => onSocialHover(i)}
                    onMouseLeave={() => onSocialLeave(i)}
                    className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/70 backdrop-blur-md border-2 border-white/50 hover:border-cyan-300 transition-all transform hover:scale-105"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <img src={`https://cdn.simpleicons.org/${s.slug}`} alt={s.name} className="w-6 h-6 object-contain brightness-0 invert" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-cyan-600 transition-colors">{s.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="max-w-7xl mx-auto px-6 pb-8 pt-8 text-center space-y-4 border-t border-white/60 bg-white/55 backdrop-blur-md rounded-t-3xl shadow-[0_-36px_75px_rgba(15,23,42,0.2),0_48px_110px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">💻</span>
          <p className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
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
    </div>
  );
}