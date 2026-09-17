import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The hero centrepiece: the brand's open-notebook illustration rebuilt as a
 * real, grabbable 3D object (three.js / react-three-fiber).
 *
 * Interaction — drag anywhere on it to spin the book, release and it eases back
 * to rest with a little inertia. Moving the pointer nearby tilts it and opens
 * the covers a touch further; on touch it simply floats and slowly turns.
 *
 * Layout convention for everything below: the book lies flat, its spine running
 * along **Z** at x = 0, the two halves extending along ±X. So a half opens and
 * closes by rotating about **Z** — rotating about Y instead just yaws it
 * sideways in the horizontal plane and the book reads as a sheared slab.
 *
 * This whole module is code-split and only ever imported by <HeroScene/>, which
 * renders the flat SVG instead on reduced-motion / data-saver / no-WebGL. Do
 * not import it directly from a page.
 */

/* ---------- theme ---------------------------------------------------- */

/** Reads the live `--c-*` design tokens so the 3D object re-lights itself when
    the user flips the theme — no duplicated colour table to drift out of sync. */
function useTokenColors() {
  const read = () => {
    const s = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => {
      const v = s.getPropertyValue(`--c-${name}`).trim();
      return v ? `rgb(${v.replace(/\s+/g, ",")})` : fallback;
    };
    const dark = document.documentElement.dataset.theme === "dark";
    return {
      /* The physical object keeps physical colours. Paper is paper and a
         pencil is graphite in both themes — driving these off --c-panel /
         --c-ink turned the notebook into a black slab holding a white pencil
         the moment dark mode came on. Only brand/gold and the lighting
         follow the theme. */
      paper: dark ? "#EDEAE2" : "#FCFBF8",
      pageEdge: dark ? "#D6D1C4" : "#E8E4DA",
      cover: dark ? "#3A4478" : "#46528F",
      graphite: dark ? "#2B2A34" : "#1C1B24",
      wood: "#E0B77E",
      rule: token("brand", "#5b6fc7"),
      ruleSoft: dark ? "#B9B4A7" : "#CFCABE",
      brand: token("brand", "#5b6fc7"),
      gold: token("gold", "#e8b84b"),
      ink: token("ink", "#14131a"),
      dark,
    };
  };

  const [colors, setColors] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

/* ---------- page texture --------------------------------------------- */

/** Ruled-paper texture painted once on a 2D canvas: a margin rule, ruled lines
    of varying length, and a faint written heading. One texture beats ~16 line
    meshes per page and stays crisp at any zoom. */
function useRuledTexture(paper: string, rule: string, accent: string, heading: boolean) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 384;
    c.height = 512;
    const ctx = c.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, c.width, c.height);

    const marginX = 62;

    if (heading) {
      // A heavier "title" stroke, as if the teacher wrote one.
      ctx.strokeStyle = accent;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(marginX + 12, 74);
      ctx.lineTo(marginX + 150, 74);
      ctx.stroke();
    }

    ctx.strokeStyle = rule;
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    const top = heading ? 132 : 88;
    const rows = Math.floor((c.height - top - 60) / 38);
    for (let i = 0; i < rows; i++) {
      const y = top + i * 38;
      // Ragged right edge — mimics handwriting that stops mid-line.
      const right = c.width - 46 - ((i * 37) % 5) * 26;
      ctx.beginPath();
      ctx.moveTo(marginX + 12, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // The vertical margin rule teachers write beside.
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(marginX, 40);
    ctx.lineTo(marginX, c.height - 40);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [paper, rule, accent, heading]);
}

/* ---------- geometry -------------------------------------------------- */

/** A rounded, slightly bevelled slab — a sheaf of paper, or a cover board.
    Hand-rolled rather than pulled from drei: this was the only helper needed
    from it, and dropping the dependency keeps the chunk lean. Cached per size,
    since the two halves are mirror-identical. */
const slabCache = new Map<string, THREE.ExtrudeGeometry>();
function slabGeometry(width: number, depth: number, thickness: number, radius = 0.06) {
  const key = `${width}|${depth}|${thickness}|${radius}`;
  const cached = slabCache.get(key);
  if (cached) return cached;

  const w = width / 2 - radius;
  const d = depth / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-w, -d - radius);
  shape.lineTo(w, -d - radius);
  shape.quadraticCurveTo(w + radius, -d - radius, w + radius, -d);
  shape.lineTo(w + radius, d);
  shape.quadraticCurveTo(w + radius, d + radius, w, d + radius);
  shape.lineTo(-w, d + radius);
  shape.quadraticCurveTo(-w - radius, d + radius, -w - radius, d);
  shape.lineTo(-w - radius, -d);
  shape.quadraticCurveTo(-w - radius, -d - radius, -w, -d - radius);

  const bevel = Math.min(0.012, thickness / 3);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - bevel * 2,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
  // Extrude builds along +Z; the book lies in the XZ plane.
  geo.rotateX(-Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  // ExtrudeGeometry's own UVs are unusable for a face texture — project the
  // top face onto [0,1]² so the ruled paper lands square on it.
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (bb) {
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const sx = bb.max.x - bb.min.x;
    const sz = bb.max.z - bb.min.z;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) - bb.min.x) / sx, 1 - (pos.getZ(i) - bb.min.z) / sz);
    }
    uv.needsUpdate = true;
  }
  slabCache.set(key, geo);
  return geo;
}

/** One flax petal, extruded from an ellipse — the flat five-petal silhouette of
    the brand mark, rather than the ball of squashed spheres this used to be. */
let petalGeo: THREE.ExtrudeGeometry | null = null;
function petalGeometry() {
  if (petalGeo) return petalGeo;
  const shape = new THREE.Shape();
  shape.absellipse(0, 0.1, 0.058, 0.088, 0, Math.PI * 2, false, 0);
  petalGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelSize: 0.014,
    bevelThickness: 0.012,
    bevelSegments: 2,
    curveSegments: 12,
  });
  petalGeo.computeVertexNormals();
  return petalGeo;
}

/** Soft ground shadow as a single textured plane. Replaces drei's
    <ContactShadows/>, which renders the scene to an offscreen target and blurs
    it every frame — far more than a decorative blob under a book is worth. */
function ShadowBlob({ color, opacity }: { color: string; opacity: number }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.5, "rgba(0,0,0,0.4)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  if (!texture) return null;
  return (
    <mesh position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}>
      <planeGeometry args={[7.4, 7.4]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ---------- flower --------------------------------------------------- */

function Flower({
  position,
  scale = 1,
  brand,
  gold,
  phase,
}: {
  position: [number, number, number];
  scale?: number;
  brand: string;
  gold: string;
  phase: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const geo = petalGeometry();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + phase;
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 0.14;
    ref.current.position.x = position[0] + Math.sin(t * 0.43) * 0.07;
    ref.current.rotation.z = t * 0.22;
    // Tumble gently rather than spinning flat-on — keeps the silhouette read.
    ref.current.rotation.x = -0.5 + Math.sin(t * 0.55) * 0.3;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} geometry={geo} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
          <meshStandardMaterial color={brand} roughness={0.5} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.022]}>
        <sphereGeometry args={[0.046, 16, 12]} />
        <meshStandardMaterial color={gold} roughness={0.3} metalness={0.25} />
      </mesh>
    </group>
  );
}

/* ---------- the book ------------------------------------------------- */

interface BookProps {
  colors: ReturnType<typeof useTokenColors>;
  dragging: React.MutableRefObject<boolean>;
  spin: React.MutableRefObject<{ yaw: number; velocity: number }>;
}

/* Page footprint, and how far a half's centre sits from the spine. */
const PAGE_W = 2.35;
const PAGE_D = 2.05;
const PAGE_T = 0.13;
const CENTRE = PAGE_W / 2 + 0.11;
/** Radians per second of the idle turn — one full revolution in ~50s. */
const AUTO_SPIN = 0.125;
/** A real open book lifts its outer edges only a few degrees. */
const OPEN_ANGLE = 0.12;

function Book({ colors, dragging, spin }: BookProps) {
  const group = useRef<THREE.Group>(null);
  const leftHalf = useRef<THREE.Group>(null);
  const rightHalf = useRef<THREE.Group>(null);

  const leftTex = useRuledTexture(colors.paper, colors.rule, colors.gold, true);
  const rightTex = useRuledTexture(colors.paper, colors.ruleSoft, colors.brand, false);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05); // clamp: a backgrounded tab must not lurch
    const ease = 1 - 0.0015 ** d;

    if (!dragging.current) {
      // Flick inertia bleeding off, then the steady idle turn takes over. The
      // yaw is NOT eased back to zero — the book is always slowly rotating, so
      // there is no "resting pose" to return to.
      spin.current.yaw += spin.current.velocity * d;
      spin.current.velocity *= 0.12 ** d;
      spin.current.yaw += AUTO_SPIN * d;
    }

    // Pointer position is deliberately ignored: the book reacts to a real
    // press-and-drag only, never to a cursor merely passing over it.
    g.rotation.y += (spin.current.yaw - g.rotation.y) * ease;
    g.rotation.x += (-0.06 - g.rotation.x) * ease;
    g.position.y = Math.sin(performance.now() / 1700) * 0.05;

    // Hinge about Z — the spine axis. See the file header.
    for (const [half, sign] of [
      [leftHalf.current, -1],
      [rightHalf.current, 1],
    ] as const) {
      if (!half) continue;
      half.rotation.z += (OPEN_ANGLE * sign - half.rotation.z) * ease;
    }
  });

  /** One side of the book: cover board, page stack, gilt edge — plus whatever
      is resting ON that page. `children` must live in here, not beside it: the
      half rotates about the spine, so anything left outside stays at y≈0 while
      the page lifts past it and swallows it. That is what buried the pencil. */
  const half = (side: 1 | -1, tex: THREE.CanvasTexture | null, children?: React.ReactNode) => (
    <>
      {/* cover board — a little larger than the paper, as real covers are */}
      <mesh
        geometry={slabGeometry(PAGE_W + 0.16, PAGE_D + 0.16, 0.075, 0.05)}
        position={[side * CENTRE, -0.115, 0]}
      >
        <meshStandardMaterial color={colors.cover} roughness={0.62} metalness={0.05} />
      </mesh>

      {/* the page stack */}
      <mesh geometry={slabGeometry(PAGE_W, PAGE_D, PAGE_T, 0.035)} position={[side * CENTRE, 0, 0]}>
        <meshStandardMaterial
          map={tex ?? undefined}
          color={tex ? "#ffffff" : colors.paper}
          roughness={0.88}
          metalness={0}
        />
      </mesh>

      {/* gilt along the outer edge of the page block */}
      <mesh position={[side * (CENTRE + PAGE_W / 2 - 0.01), 0, 0]}>
        <boxGeometry args={[0.07, PAGE_T * 0.92, PAGE_D - 0.08]} />
        <meshStandardMaterial color={colors.gold} roughness={0.28} metalness={0.6} />
      </mesh>

      {children}
    </>
  );

  /* Pencil, resting on the right page. Euler order is XYZ, i.e. Z is applied
     first: the barrel is laid flat along X by Rz(π/2), then swung into place
     on the page by Ry. Its y clears the page surface (PAGE_T / 2) by its own
     radius plus a hair. */
  const pencil = (
    <group position={[CENTRE + 0.05, PAGE_T / 2 + 0.085, -0.34]} rotation={[0, 0.6, Math.PI / 2]}>
      <mesh>
        {/* 6 radial segments — a pencil is hexagonal */}
        <cylinderGeometry args={[0.072, 0.072, 1.78, 6]} />
        <meshStandardMaterial color={colors.graphite} roughness={0.42} metalness={0.1} />
      </mesh>
      {/* sharpened wood cone + graphite point */}
      <mesh position={[0, -0.99, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.072, 0.22, 12]} />
        <meshStandardMaterial color={colors.wood} roughness={0.7} />
      </mesh>
      <mesh position={[0, -1.12, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.026, 0.08, 10]} />
        <meshStandardMaterial color="#15141b" roughness={0.5} />
      </mesh>
      {/* ferrule + cap */}
      <mesh position={[0, 0.94, 0]}>
        <cylinderGeometry args={[0.077, 0.077, 0.11, 12]} />
        <meshStandardMaterial color={colors.gold} roughness={0.3} metalness={0.65} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <cylinderGeometry args={[0.074, 0.074, 0.11, 12]} />
        <meshStandardMaterial color={colors.brand} roughness={0.55} />
      </mesh>
    </group>
  );

  /* Ribbon bookmark on the left page, trailing over its outer edge. */
  const ribbon = (
    <group position={[-(CENTRE + 0.15), PAGE_T / 2 + 0.022, 0.62]} rotation={[0, -0.16, 0]}>
      <mesh>
        <boxGeometry args={[1.55, 0.022, 0.13]} />
        <meshStandardMaterial color={colors.gold} roughness={0.42} metalness={0.15} />
      </mesh>
      <mesh position={[-0.86, -0.19, 0]} rotation={[0, 0, -0.95]}>
        <boxGeometry args={[0.5, 0.022, 0.13]} />
        <meshStandardMaterial color={colors.gold} roughness={0.42} metalness={0.15} />
      </mesh>
    </group>
  );

  return (
    <group ref={group}>
      {/* spine — the rounded bar the two halves hinge from */}
      <mesh geometry={slabGeometry(0.3, PAGE_D + 0.16, 0.19, 0.08)} position={[0, -0.08, 0]}>
        <meshStandardMaterial color={colors.cover} roughness={0.55} metalness={0.08} />
      </mesh>

      <group ref={leftHalf}>{half(-1, leftTex, ribbon)}</group>
      <group ref={rightHalf}>{half(1, rightTex, pencil)}</group>

      {/* drifting flax flowers */}
      <Flower
        position={[-1.55, 1.35, 1.1]}
        scale={1.2}
        brand={colors.brand}
        gold={colors.gold}
        phase={0}
      />
      <Flower
        position={[1.6, 1.55, -0.8]}
        scale={0.95}
        brand={colors.brand}
        gold={colors.gold}
        phase={2.1}
      />
      <Flower
        position={[1.45, -0.75, 1.5]}
        scale={0.75}
        brand={colors.brand}
        gold={colors.gold}
        phase={4}
      />
      <Flower
        position={[-1.3, 1.7, -1.05]}
        scale={0.65}
        brand={colors.brand}
        gold={colors.gold}
        phase={5.4}
      />
    </group>
  );
}

/* ---------- scene ---------------------------------------------------- */

/** Pulls the camera in on wide, short canvases (the phone banner) and back out
    on the near-square desktop box, so the book fills whichever shape it gets. */
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const wide = size.width / Math.max(size.height, 1) > 1.5;
    cam.position.set(0, wide ? 2.15 : 2.7, wide ? 4.5 : 5.6);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Scene({ colors }: { colors: ReturnType<typeof useTokenColors> }) {
  const dragging = useRef(false);
  const spin = useRef({ yaw: 0, velocity: 0 });
  const lastX = useRef(0);
  const { gl } = useThree();

  /* Drag-to-spin. The release listener is on window, so a flick that ends with
     the cursor off the object still settles cleanly. */
  useEffect(() => {
    const el = gl.domElement;
    const up = () => {
      dragging.current = false;
      el.style.cursor = "grab";
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.style.cursor = "grab";
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = true;
    lastX.current = e.clientX;
    spin.current.velocity = 0;
    gl.domElement.style.cursor = "grabbing";
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    // Drag only — a cursor simply passing over the book must not move it.
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    spin.current.yaw += dx * 0.012;
    spin.current.velocity = dx * 0.6;
  };

  return (
    <>
      <ResponsiveCamera />

      {/* Sky/ground ambient gives the paper a soft falloff a flat ambientLight
          can't, and costs nothing. */}
      <hemisphereLight
        intensity={colors.dark ? 0.7 : 0.95}
        color="#ffffff"
        groundColor={colors.dark ? "#2b2f46" : "#d9d5ea"}
      />
      <ambientLight intensity={colors.dark ? 0.32 : 0.42} />
      {/* key */}
      <directionalLight position={[3.4, 6.5, 3.8]} intensity={colors.dark ? 1.5 : 2.0} />
      {/* cool fill from behind, so the gilt and the covers keep an edge */}
      <directionalLight position={[-4.5, 2.2, -3.5]} intensity={0.85} color={colors.brand} />
      {/* warm rim */}
      <directionalLight position={[0, -1.5, 4]} intensity={0.35} color={colors.gold} />

      {/* Invisible catcher so the drag gesture works in the gaps between meshes. */}
      <mesh position={[0, 0, 0]} onPointerDown={onDown} onPointerMove={onMove} visible={false}>
        <boxGeometry args={[7.5, 4, 4.5]} />
      </mesh>

      <group position={[0, -0.35, 0]}>
        <group scale={0.8} rotation={[0.16, -0.42, 0]}>
          <Book colors={colors} dragging={dragging} spin={spin} />
        </group>
        <ShadowBlob color={colors.ink} opacity={colors.dark ? 0.4 : 0.26} />
      </group>
    </>
  );
}

export default function Notebook3D() {
  const colors = useTokenColors();
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.7, 5.6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      /* Decorative — the headline and CTAs carry the meaning. */
      aria-hidden
      style={{ touchAction: "pan-y" }}
    >
      <Scene colors={colors} />
    </Canvas>
  );
}
