import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Dir = "up" | "down" | "left" | "right";
type Cell = { x: number; y: number };
type Item = Cell & { value: string; id: number };

interface SceneProps {
  snake: Cell[];
  items: Item[];
  dir: Dir;
  cols: number;
  rows: number;
  bgUrl: string;
}

const toWorld = (c: Cell, cols: number, rows: number): [number, number, number] => [
  c.x - cols / 2 + 0.5,
  0,
  c.y - rows / 2 + 0.5,
];

// Smooth-follow segment
const Segment = ({
  target,
  radius,
  color,
  emissive,
}: {
  target: [number, number, number];
  radius: number;
  color: string;
  emissive?: string;
}) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const k = 1 - Math.exp(-14 * Math.min(delta, 0.05));
    ref.current.position.lerp(new THREE.Vector3(...target), k);
  });
  return (
    <mesh ref={ref} position={target} castShadow>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} emissive={emissive ?? "#000000"} emissiveIntensity={0.15} />
    </mesh>
  );
};

const Head = ({ target, dir }: { target: [number, number, number]; dir: Dir }) => {
  const ref = useRef<THREE.Group>(null);
  const rotY = dir === "right" ? 0 : dir === "down" ? Math.PI / 2 : dir === "left" ? Math.PI : -Math.PI / 2;
  useFrame((_, delta) => {
    if (!ref.current) return;
    const k = 1 - Math.exp(-14 * Math.min(delta, 0.05));
    ref.current.position.lerp(new THREE.Vector3(target[0], target[1], target[2]), k);
  });
  return (
    <group ref={ref} position={target} rotation-y={rotY}>
      {/* head */}
      <mesh castShadow position={[0, 0.1, 0]} scale={[1.25, 0.85, 0.95]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color="#3e9e2f" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* snout */}
      <mesh castShadow position={[0.45, 0.02, 0]} scale={[1, 0.7, 0.8]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#358a28" roughness={0.35} />
      </mesh>
      {/* eyes — yellow viper eyes */}
      <mesh position={[0.28, 0.32, 0.28]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#ffd93b" emissive="#ffcc00" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.28, 0.32, -0.28]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#ffd93b" emissive="#ffcc00" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
      {/* pupils */}
      <mesh position={[0.38, 0.32, 0.28]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.38, 0.32, -0.28]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* forked tongue */}
      <mesh position={[0.85, -0.05, 0]}>
        <boxGeometry args={[0.35, 0.03, 0.06]} />
        <meshStandardMaterial color="#e02020" emissive="#aa0000" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[1.05, -0.05, 0.07]} rotation-y={0.5}>
        <boxGeometry args={[0.15, 0.03, 0.05]} />
        <meshStandardMaterial color="#e02020" emissive="#aa0000" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[1.05, -0.05, -0.07]} rotation-y={-0.5}>
        <boxGeometry args={[0.15, 0.03, 0.05]} />
        <meshStandardMaterial color="#e02020" emissive="#aa0000" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

// Item: floating golden ball with the value drawn on a sprite
const ItemBall = ({ item, cols, rows }: { item: Item; cols: number; rows: number }) => {
  const [x, , z] = toWorld(item, cols, rows);
  const groupRef = useRef<THREE.Group>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = "#3a2500";
    ctx.font = "bold 150px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.value, 128, 138);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [item.value]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 0.75 + Math.sin(t * 2.5) * 0.12;
    groupRef.current.rotation.y = t * 0.8;
  });

  return (
    <group ref={groupRef} position={[x, 0.75, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial color="#ffc531" emissive="#ffaa00" emissiveIntensity={0.45} roughness={0.25} metalness={0.5} />
      </mesh>
      <sprite scale={[1.1, 1.1, 1]}>
        <spriteMaterial map={texture} transparent depthTest={false} />
      </sprite>
      <pointLight color="#ffcc44" intensity={2.5} distance={4} />
    </group>
  );
};

const GardenGround = ({ cols, rows, bgUrl }: { cols: number; rows: number; bgUrl: string }) => {
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(bgUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [bgUrl]);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[cols + 2, rows + 2]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  );
};

export const SnakeScene = ({ snake, items, dir, cols, rows, bgUrl }: SceneProps) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 16, 11], fov: 42 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 1.5)}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#bfe8ff"]} />
      <fog attach="fog" args={["#bfe8ff", 30, 60]} />
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <GardenGround cols={cols} rows={rows} bgUrl={bgUrl} />

      {/* snake body (skip head) */}
      {snake.slice(1).map((s, i) => {
        const [x, , z] = toWorld(s, cols, rows);
        const isTail = i === snake.length - 2;
        return (
          <Segment
            key={i}
            target={[x, 0.42, z]}
            radius={isTail ? 0.3 : 0.45}
            color={i % 2 === 0 ? "#46b336" : "#3a9c2c"}
          />
        );
      })}
      {/* snake head */}
      {snake.length > 0 && <Head target={[...toWorld(snake[0], cols, rows).slice(0, 1), 0.5, toWorld(snake[0], cols, rows)[2]] as [number, number, number]} dir={dir} />}

      {/* items */}
      {items.map((it) => (
        <ItemBall key={it.id} item={it} cols={cols} rows={rows} />
      ))}
    </Canvas>
  );
};
