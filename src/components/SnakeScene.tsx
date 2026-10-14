import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import * as THREE from "three";

type Dir = "up" | "down" | "left" | "right";
type Cell = { x: number; y: number };
type Item = Cell & { value: string; id: number };
interface SceneProps { snake: Cell[]; items: Item[]; dir: Dir; cols: number; rows: number; bgUrl: string; paused: boolean }

// Scene colors come from the same semantic palette as the DOM.
function usePalette() {
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const color = (token: string) => {
      const parts = css.getPropertyValue(token).trim().split(/\s+/).map(parseFloat);
      return new THREE.Color().setHSL(parts[0] / 360, parts[1] / 100, parts[2] / 100).getStyle();
    };
    return { skin: color("--snake-body"), head: color("--snake-head"), gold: color("--warning"), ink: color("--foreground"), sky: color("--board"), tongue: color("--food"), light: color("--card"), edge: color("--border") };
  }, []);
}
type Palette = ReturnType<typeof usePalette>;
const world = (c: Cell, cols: number, rows: number) => new THREE.Vector3(c.x - cols / 2 + .5, .43, c.y - rows / 2 + .5);

function scaleTexture(p: Palette) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = p.skin; ctx.fillRect(0, 0, 256, 256);
    for (let y = -16; y < 280; y += 24) for (let x = -24; x < 280; x += 32) {
      const offset = (Math.floor(y / 24) % 2) * 16;
      ctx.fillStyle = p.head; ctx.globalAlpha = .6;
      ctx.beginPath(); ctx.ellipse(x + offset, y, 15, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = p.light; ctx.globalAlpha = .22; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x + offset - 1, y - 2, 12, 8, 0, Math.PI, Math.PI * 2); ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

function Snake({ snake, dir, cols, rows, paused, p }: Omit<SceneProps, "items" | "bgUrl"> & { p: Palette }) {
  const head = useRef<THREE.Group>(null);
  const links = useRef<(THREE.Mesh | null)[]>([]);
  const texture = useMemo(() => scaleTexture(p), [p]);
  useEffect(() => () => texture.dispose(), [texture]);
  const targets = useMemo(() => snake.map(c => world(c, cols, rows)), [snake, cols, rows]);
  const points = useRef(targets.map(v => v.clone()));
  const temp = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const yaw = dir === "right" ? 0 : dir === "down" ? -Math.PI / 2 : dir === "left" ? Math.PI : Math.PI / 2;
  useFrame((_, delta) => {
    const k = paused ? 1 : 1 - Math.exp(-22 * Math.min(delta, .05));
    targets.forEach((v, i) => {
      if (!points.current[i]) points.current[i] = v.clone();
      if (points.current[i].distanceTo(v) > 3) points.current[i].copy(v);
      else points.current[i].lerp(v, k);
    });
    if (head.current && points.current[0]) {
      head.current.position.copy(points.current[0]);
      const diff = Math.atan2(Math.sin(yaw - head.current.rotation.y), Math.cos(yaw - head.current.rotation.y));
      head.current.rotation.y += diff * k;
    }
    links.current.forEach((mesh, i) => {
      const a = points.current[i], b = points.current[i + 1];
      if (!mesh || !a || !b) return;
      // Never draw a body across the garden when wrapping through an edge.
      mesh.visible = targets[i].distanceTo(targets[i + 1]) < 2;
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      temp.copy(a).sub(b);
      const length = temp.length();
      const radius = .40 * (1 - .70 * Math.pow((i + 1) / snake.length, 4));
      mesh.scale.set(radius, length + radius * 1.4, radius);
      if (length > .001) mesh.quaternion.setFromUnitVectors(up, temp.normalize());
    });
  });
  return <>
    {snake.slice(1).map((_, i) => <mesh key={i} ref={mesh => { links.current[i] = mesh; }} castShadow>
      <capsuleGeometry args={[1, 0.01, 6, 12]} />
      <meshStandardMaterial map={texture} roughness={.48} />
    </mesh>)}
    <group ref={head} position={targets[0]} rotation-y={yaw}>
      <mesh castShadow scale={[.72, .34, .5]} position={[.12, .04, 0]}>
        <sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial map={texture} color={p.skin} roughness={.38} />
      </mesh>
      <mesh castShadow position={[.57, -.04, 0]} scale={[.30, .18, .32]}>
        <sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={p.head} roughness={.5} />
      </mesh>
      {[-1, 1].map(side => <group key={side} position={[.36, .22, side * .34]}>
        <mesh><sphereGeometry args={[.13, 16, 12]} /><meshStandardMaterial color={p.gold} roughness={.22} /></mesh>
        <mesh position={[.045, .075, side * .065]} scale={[.035, .08, .045]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={p.ink} /></mesh>
      </group>)}
      <mesh position={[.90, -.04, 0]}><boxGeometry args={[.32, .025, .04]} /><meshStandardMaterial color={p.tongue} /></mesh>
      {[-1, 1].map(side => <mesh key={side} position={[1.10, -.04, side * .05]} rotation-y={side * -.55}><boxGeometry args={[.17, .025, .025]} /><meshStandardMaterial color={p.tongue} /></mesh>)}
    </group>
  </>;
}

function ItemBall({ item, cols, rows, paused, p }: { item: Item; cols: number; rows: number; paused: boolean; p: Palette }) {
  const group = useRef<THREE.Group>(null);
  const time = useRef(0);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) { ctx.fillStyle = p.ink; ctx.font = "bold 140px Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(item.value, 128, 138); }
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [item.value, p]);
  useEffect(() => () => texture.dispose(), [texture]);
  const position = world(item, cols, rows);
  useFrame((_, delta) => { if (paused || !group.current) return; time.current += Math.min(delta, .05); group.current.position.y = .75 + Math.sin(time.current * 2.5) * .08; });
  return <group ref={group} position={[position.x, .75, position.z]}>
    <mesh castShadow><sphereGeometry args={[.49, 20, 16]} /><meshStandardMaterial color={p.gold} roughness={.3} metalness={.25} /></mesh>
    <sprite scale={[.85, .85, 1]} position={[0, .08, .03]}><spriteMaterial map={texture} transparent depthTest={false} /></sprite>
  </group>;
}

function Ground({ cols, rows, bgUrl, p }: { cols: number; rows: number; bgUrl: string; p: Palette }) {
  const texture = useTexture(bgUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  return <group>
    <mesh position={[0, -.27, 0]} receiveShadow><boxGeometry args={[cols + .4, .5, rows + .4]} /><meshStandardMaterial color={p.head} roughness={1} /></mesh>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[cols, rows, 1, 1]} /><meshStandardMaterial map={texture} roughness={.92} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * (cols / 2 + .07), .05, 0]} receiveShadow><boxGeometry args={[.14, .14, rows + .2]} /><meshStandardMaterial color={p.edge} roughness={.7} /></mesh>)}
    {[-1, 1].map(side => <mesh key={side} position={[0, .05, side * (rows / 2 + .07)]} receiveShadow><boxGeometry args={[cols + .2, .14, .14]} /><meshStandardMaterial color={p.edge} roughness={.7} /></mesh>)}
  </group>;
}

export const SnakeScene = ({ snake, items, dir, cols, rows, bgUrl, paused }: SceneProps) => {
  const p = usePalette();
  return <Canvas shadows dpr={[1, 1.5]} orthographic camera={{ position: [0, 22, 15], zoom: 24, near: .1, far: 80 }} onCreated={({ camera }) => { camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); }}>
    <color attach="background" args={[p.sky]} />
    <hemisphereLight args={[p.light, p.head, 1.2]} />
    <directionalLight position={[-5, 14, 6]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={.04} />
    <Environment resolution={64}>
      <Lightformer intensity={1.5} color={p.light} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      <Lightformer intensity={.5} color={p.sky} position={[-10, 4, 0]} rotation-y={Math.PI / 2} scale={[10, 10, 1]} />
    </Environment>
    <Suspense fallback={null}><Ground cols={cols} rows={rows} bgUrl={bgUrl} p={p} /></Suspense>
    <Snake snake={snake} dir={dir} cols={cols} rows={rows} paused={paused} p={p} />
    {items.map(item => <ItemBall key={item.id} item={item} cols={cols} rows={rows} paused={paused} p={p} />)}
  </Canvas>;
};
