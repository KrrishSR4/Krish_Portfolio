import { useRef, useEffect, useState, useCallback } from 'react';

const SIMPLE_ICONS_PRIMARY = "https://cdn.simpleicons.org";

const extractRgb = (rgba: string): string => {
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return "100, 116, 139";
    return `${match[1]}, ${match[2]}, ${match[3]}`;
};

interface SkillItem {
    name: string;
    slug: string;
    color: string;
}

interface ShadowPalette {
    base: string;
    hover: string;
}

interface Point3D {
    x: number;
    y: number;
    z: number;
    skill: SkillItem;
}

interface SkillSphereProps {
    skills: SkillItem[];
    shadowPalette: Record<string, ShadowPalette>;
}

export default function SkillSphere({ skills, shadowPalette }: SkillSphereProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pointsRef = useRef<Point3D[]>([]);
    const animationRef = useRef<number>(0);
    const isDraggingRef = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const velocityRef = useRef({ x: 0.004, y: 0.002 });
    const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<{ name: string; rgb: string; x: number; y: number } | null>(null);

    // Fibonacci sphere distribution
    const initPoints = useCallback(() => {
        const pts: Point3D[] = [];
        const count = skills.length;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2;
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = goldenAngle * i;
            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;
            pts.push({ x, y, z, skill: skills[i] });
        }
        pointsRef.current = pts;
    }, [skills]);

    const rotatePoints = useCallback((angleX: number, angleY: number) => {
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        pointsRef.current = pointsRef.current.map((p) => {
            const y1 = p.y * cosX - p.z * sinX;
            const z1 = p.y * sinX + p.z * cosX;
            const x1 = p.x * cosY + z1 * sinY;
            const z2 = -p.x * sinY + z1 * cosY;
            return { x: x1, y: y1, z: z2, skill: p.skill };
        });
    }, []);

    const renderSphere = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const items = container.querySelectorAll<HTMLDivElement>('.sphere-node');
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(centerX, centerY) * 0.72;

        pointsRef.current.forEach((point, i) => {
            const el = items[i];
            if (!el) return;
            const depthScale = (point.z + 1.5) / 2.5;
            const opacity = Math.max(0.15, (point.z + 1) / 2);
            const x = centerX + point.x * radius;
            const y = centerY + point.y * radius;
            const s = 0.5 + depthScale * 0.55;

            el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${s})`;
            el.style.opacity = `${opacity}`;
            el.style.zIndex = `${Math.round(depthScale * 100)}`;
        });
    }, []);

    // Animation loop
    useEffect(() => {
        initPoints();
        const animate = () => {
            if (!isDraggingRef.current) {
                rotatePoints(velocityRef.current.y * 0.4, velocityRef.current.x * 0.4);
            }
            renderSphere();
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [initPoints, rotatePoints, renderSphere]);

    // ALL pointer interaction via window listeners — no event blocking issues
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const isInsideContainer = (x: number, y: number) => {
            const rect = container.getBoundingClientRect();
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        };

        // Find which skill node the mouse is hovering over
        const findHoveredSkill = (clientX: number, clientY: number): SkillItem | null => {
            const nodes = container.querySelectorAll<HTMLDivElement>('.sphere-node');
            // Check from highest z-index to lowest (front to back)
            let bestMatch: { skill: SkillItem; z: number } | null = null;

            nodes.forEach((node, i) => {
                const rect = node.getBoundingClientRect();
                if (
                    clientX >= rect.left && clientX <= rect.right &&
                    clientY >= rect.top && clientY <= rect.bottom
                ) {
                    const point = pointsRef.current[i];
                    if (point && (!bestMatch || point.z > bestMatch.z)) {
                        bestMatch = { skill: point.skill, z: point.z };
                    }
                }
            });
            return bestMatch?.skill ?? null;
        };

        const onPointerDown = (e: PointerEvent) => {
            if (!isInsideContainer(e.clientX, e.clientY)) return;
            isDraggingRef.current = true;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            setHoveredSlug(null);
            setTooltipInfo(null);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (isDraggingRef.current) {
                const dx = e.clientX - lastMouse.current.x;
                const dy = e.clientY - lastMouse.current.y;
                lastMouse.current = { x: e.clientX, y: e.clientY };
                rotatePoints(dy * 0.008, dx * 0.008);
                velocityRef.current = {
                    x: dx * 0.002 + velocityRef.current.x * 0.7,
                    y: dy * 0.002 + velocityRef.current.y * 0.7,
                };
                return;
            }

            // Hover detection when not dragging
            if (!isInsideContainer(e.clientX, e.clientY)) {
                setHoveredSlug(null);
                setTooltipInfo(null);
                return;
            }

            const skill = findHoveredSkill(e.clientX, e.clientY);
            if (skill) {
                const rect = container.getBoundingClientRect();
                const palette = shadowPalette[skill.slug];
                const rgb = palette ? extractRgb(palette.hover) : "100, 116, 139";
                setHoveredSlug(skill.slug);
                setTooltipInfo({ name: skill.name, rgb, x: e.clientX - rect.left, y: e.clientY - rect.top });
            } else {
                setHoveredSlug(null);
                setTooltipInfo(null);
            }
        };

        const onPointerUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        return () => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [rotatePoints, shadowPalette]);

    return (
        <div className="w-full relative mt-12">
            <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-pink-600 bg-clip-text text-transparent uppercase tracking-tight">
                    Skill Sphere
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                    Drag to rotate • Interactive 3D Cloud
                </p>
            </div>

            <div
                ref={containerRef}
                className="relative w-full h-[380px] md:h-[520px] cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-3xl"
                style={{ touchAction: 'none' }}
            >
                {/* All sphere items — pointer-events none so they never block drag */}
                {skills.map((skill) => {
                    const palette = shadowPalette[skill.slug];
                    const rgb = palette ? extractRgb(palette.hover) : "100, 116, 139";
                    const isHovered = hoveredSlug === skill.slug;

                    return (
                        <div
                            key={skill.slug}
                            className="sphere-node absolute top-0 left-0 will-change-transform pointer-events-none"
                        >
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 backdrop-blur-md transition-all duration-200"
                                style={{
                                    background: isHovered
                                        ? `rgba(${rgb}, 0.15)`
                                        : 'rgba(255,255,255,0.7)',
                                    borderColor: isHovered
                                        ? `rgba(${rgb}, 0.5)`
                                        : 'rgba(255,255,255,0.4)',
                                    boxShadow: isHovered
                                        ? `0 12px 40px rgba(${rgb}, 0.4), 0 0 0 1px rgba(${rgb}, 0.2)`
                                        : '0 2px 8px rgba(0,0,0,0.04)',
                                    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                                }}
                            >
                                <img
                                    src={`${SIMPLE_ICONS_PRIMARY}/${skill.slug}`}
                                    alt={skill.name}
                                    className="w-8 h-8 md:w-10 md:h-10 object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    loading="lazy"
                                    draggable={false}
                                />
                                <span
                                    className="text-xs md:text-sm font-extrabold whitespace-nowrap transition-colors duration-200"
                                    style={{ color: isHovered ? `rgb(${rgb})` : '#334155' }}
                                >
                                    {skill.name}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Hover tooltip popup */}
                {tooltipInfo && (
                    <div
                        className="absolute pointer-events-none z-[200]"
                        style={{
                            left: tooltipInfo.x,
                            top: tooltipInfo.y - 52,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div
                            className="px-4 py-2 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider shadow-2xl whitespace-nowrap relative"
                            style={{
                                background: `linear-gradient(135deg, rgb(${tooltipInfo.rgb}), rgba(${tooltipInfo.rgb}, 0.8))`,
                                boxShadow: `0 8px 24px rgba(${tooltipInfo.rgb}, 0.4)`,
                            }}
                        >
                            {tooltipInfo.name}
                            <div
                                className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                                style={{ background: `rgb(${tooltipInfo.rgb})` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center mt-5">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {skills.length} Technologies
                    </span>
                </div>
            </div>
        </div>
    );
}
