import { useState, useEffect, useRef, useCallback } from "react";

type Project = {
  id: number;
  num?: string;
  title: string;
  desc: string;
  tags: string[];
  liveUrl: string;
  githubUrl: string;
  images: string[];
};

const PROJECTS: Project[] = [
  {
    id: 1,
    num: "01",
    title: "WebMetricsX",
    desc: "Website monitoring and SEO analytics tool that tracks uptime, detects downtime, and provides real-time alerts with actionable optimization insights.",
    tags: ["Website Monitoring", "Downtime Alerts", "Real-Time Alerts", "React.js", "Google Page Insights", "Developer Tools", "Technical SEO", "Monitoring System"],
    liveUrl: "https://webmetricsx.web.app/",
    githubUrl: "https://github.com/KrrishSR4/WebMetricsX.git",
    images: [
      "/assets/project-1/webmetrics1.png",
      "/assets/project-1/webmetrics2.png",
      "/assets/project-1/webmetrics3.png",
    ],
  },
  {
    id: 2,
    num: "02",
    title: "NeuralFlow Dashboard",
    desc: "Real-time ML pipeline monitoring with live metrics, anomaly detection alerts, and interactive model performance graphs.",
    tags: ["React", "Python", "TensorFlow", "WebSockets", "D3.js"],
    liveUrl: "#",
    githubUrl: "#",
    images: [
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80",
    ],
  },
  {
    id: 3,
    num: "03",
    title: "CodeAtlas",
    desc: "Visual code dependency explorer that maps your entire monorepo into an interactive 3D graph — navigate, filter, and trace at warp speed.",
    tags: ["TypeScript", "Three.js", "Rust", "GraphQL", "Node.js"],
    liveUrl: "#",
    githubUrl: "#",
    images: [
      "https://images.unsplash.com/photo-1537884944318-390069bb8665?w=600&q=80",
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80",
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&q=80",
    ],
  },
  {
    id: 4,
    num: "04",
    title: "VaultAPI",
    desc: "Zero-trust secrets management platform with end-to-end encryption, role-based access, and audit logs — built for distributed teams.",
    tags: ["Go", "Redis", "PostgreSQL", "Docker", "Kubernetes"],
    liveUrl: "#",
    githubUrl: "#",
    images: [
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
      "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&q=80",
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&q=80",
    ],
  },
  {
    id: 5,
    num: "05",
    title: "PixelCraft Studio",
    desc: "Browser-native generative art playground — combine shaders, noise fields, and L-systems to create infinitely evolving visual pieces.",
    tags: ["WebGL", "GLSL", "React", "Canvas API", "Vite"],
    liveUrl: "#",
    githubUrl: "#",
    images: [
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f665?w=600&q=80",
      "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
    ],
  },
  {
    id: 6,
    num: "06",
    title: "FleetOps",
    desc: "IoT fleet management system tracking 10K+ devices in real time with predictive maintenance scoring and geo-fenced alerting.",
    tags: ["Next.js", "MQTT", "TimescaleDB", "Mapbox", "AWS"],
    liveUrl: "#",
    githubUrl: "#",
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=600&q=80",
    ],
  },
];

const GithubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const ExternalIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

function Carousel({ images, autoDelay = 2600 }: { images: string[]; autoDelay?: number }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<number | null>(null);
  const n = images.length;

  const goTo = useCallback((index: number) => setCurrent(((index % n) + n) % n), [n]);

  const restartTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setCurrent((c) => (c + 1) % n), autoDelay);
  }, [n, autoDelay]);

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [restartTimer]);

  const handleArrow = (dir: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    goTo(current + dir);
    restartTimer();
  };

  return (
    <div className="relative w-full h-48 overflow-hidden bg-[#090d12] group/carousel">
      <div className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.18,1)]" style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((src, i) => (
          <div key={i} className="relative flex-shrink-0 w-full h-full">
            <img
              src={src}
              alt={`Project screenshot ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover bg-white brightness-100 transition-[filter] duration-300 group-hover/carousel:brightness-110 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#161b22]/70 pointer-events-none" />
          </div>
        ))}
      </div>

      <button
        onClick={(e) => handleArrow(-1, e)}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-[#0d1117]/75 border border-[#21262d] text-[#e6edf3] text-sm backdrop-blur-sm cursor-pointer opacity-0 pointer-events-none group-hover/carousel:opacity-100 group-hover/carousel:pointer-events-auto hover:!bg-[#1a5c2a] hover:!border-[#2ea043] transition-all duration-200"
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        onClick={(e) => handleArrow(1, e)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-[#0d1117]/75 border border-[#21262d] text-[#e6edf3] text-sm backdrop-blur-sm cursor-pointer opacity-0 pointer-events-none group-hover/carousel:opacity-100 group-hover/carousel:pointer-events-auto hover:!bg-[#1a5c2a] hover:!border-[#2ea043] transition-all duration-200"
        aria-label="Next image"
      >
        ›
      </button>

      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              goTo(i);
              restartTimer();
            }}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${i === current ? "bg-[#3fb950] w-4" : "bg-white/30 w-1.5 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, delay }: { project: Project; delay: number }) {
  return (
    <article
      className="relative group/card bg-white/92 border border-[#d0d7de] rounded-2xl overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:scale-[1.015] hover:border-[#2ea44f] hover:shadow-[0_0_0_1px_#2ea44f40,0_20px_60px_rgba(15,23,42,0.15),0_0_40px_rgba(46,160,67,0.2)] opacity-0 [animation:fadeUp_0.65s_ease_forwards] flex flex-col h-full"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 rounded-2xl pointer-events-none z-0 bg-gradient-to-br from-[rgba(46,160,67,0.12)] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-350" />
      <Carousel images={project.images} />

      <div className="relative z-10 p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2.5">
          {project.num && (
            <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#1f883d] bg-[rgba(46,160,67,0.1)] border border-[#2ea44f66] px-2 py-0.5 rounded">#{project.num}</span>
          )}
          <span className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[10px] text-[#1f883d]">
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ea043] opacity-40" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#2ea043]" />
            </span>
            live
          </span>
        </div>

        <h3 className="font-['Syne',sans-serif] text-[18px] font-bold text-[#24292f] leading-snug mb-2">{project.title}</h3>
        <p className="font-['JetBrains_Mono',monospace] text-[12px] leading-relaxed text-[#57606a] mb-4 line-clamp-3 flex-1">{project.desc}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="font-['JetBrains_Mono',monospace] text-[11px] px-2.5 py-0.5 rounded-full bg-[#f6f8fa] border border-[#d0d7de] text-[#57606a] cursor-default transition-all duration-200 hover:border-[#2ea043] hover:text-[#1f883d] hover:bg-[rgba(46,160,67,0.08)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2.5 mt-auto">
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 font-['JetBrains_Mono',monospace] text-[12px] font-medium px-3 py-2 rounded-lg bg-[#2ea043] text-white border border-[#2ea043] transition-all duration-250 hover:bg-[#3fb950] hover:shadow-[0_0_20px_rgba(46,160,67,0.32)] hover:-translate-y-px"
          >
            <ExternalIcon size={12} />
            Live Demo
          </a>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 font-['JetBrains_Mono',monospace] text-[12px] font-medium px-3 py-2 rounded-lg bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de] transition-all duration-250 hover:border-[#8c959f] hover:text-[#24292f] hover:bg-[#eef2f6] hover:-translate-y-px"
          >
            <GithubIcon size={12} />
            GitHub
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ProjectCards() {
  return (
    <section
      id="projects"
      className="relative bg-gradient-to-br from-white/90 via-slate-50/80 to-emerald-50/75 text-[#24292f] px-5 sm:px-8 pt-10 pb-20 overflow-x-hidden rounded-3xl border-2 border-[#04912a] font-['Syne',sans-serif] shadow-[inset_0_0_0_1px_rgba(4,145,42,0.06)]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 rounded-3xl bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(46,160,67,0.08),transparent_62%),radial-gradient(ellipse_60%_40%_at_80%_110%,rgba(46,160,67,0.06),transparent_62%)]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <p className="font-['JetBrains_Mono',monospace] text-xs tracking-[0.2em] uppercase text-[#2ea043] mb-3 [animation:fadeUp_0.6s_ease_forwards_0.1s] opacity-0">
            // portfolio.projects
          </p>
          <h2 className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none mb-4 bg-gradient-to-br from-[#24292f] to-[#2ea043] bg-clip-text text-transparent [animation:fadeUp_0.6s_ease_forwards_0.2s] opacity-0">
            Things I&apos;ve Built
          </h2>
          <p className="font-['JetBrains_Mono',monospace] text-sm text-[#57606a] [animation:fadeUp_0.6s_ease_forwards_0.3s] opacity-0">
            $ ls -la ./projects | grep "production-ready"
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} delay={0.15 + i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
