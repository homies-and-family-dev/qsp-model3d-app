'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { Suspense, useState } from 'react';

const hotspotStyles = `
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.8); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 14px rgba(234, 179, 8, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
  }
  .hotspot-container { position: relative; pointer-events: auto; user-select: none; }
  .hotspot-button {
    width: 24px; height: 24px; background-color: #eab308; border: 2px solid #ffffff;
    border-radius: 50%; cursor: pointer; animation: pulse 1.8s infinite;
    transition: transform 0.2s ease; display: flex; align-items: center;
    justify-content: center; color: #0f172a; font-size: 12px; font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .hotspot-button:hover { transform: scale(1.25); background-color: #ca8a04; }
  .hotspot-card {
    position: absolute; bottom: 34px; left: 50%; transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); color: #ffffff;
    padding: 12px 16px; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    width: 230px; font-family: system-ui, -apple-system, sans-serif;
    border: 1px solid rgba(255, 255, 255, 0.15); z-index: 50;
  }
  .hotspot-card::after {
    content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
    border-width: 6px 6px 0 6px; border-style: solid;
    border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
  }
`;

interface HotspotData {
  number: string;
  position: [number, number, number];
  title: string;
  description: string;
}

interface MaquinariaData {
  id: string;
  nombre: string;
  path: string;
  hotspots: HotspotData[];
}

const MAQUINARIAS = {
  excavadora: {
    id: 'excavadora',
    nombre: 'Excavadora QSP Hyundai HW220-9',
    path: '/modelos/excavadora.glb',
    hotspots: [
      { number: '1', position: [-0.8, -0.35, 0.1], title: 'Punta de la Cuchara', description: 'Dientes de penetración para romper terrenos duros.' },
      { number: '2', position: [-0.8, 0.3, 0], title: 'Brazo e Hidráulicos', description: 'Sistema de pistones hidráulicos de alta presión.' },
      { number: '3', position: [0.3, 0.1, 0.2], title: 'Cabina de Mando', description: 'Estación ergonómica con cristal blindado de seguridad.' },
      { number: '4', position: [0.3, -0.4, 0.2], title: 'Oruga de Tracción', description: 'Distribuye el peso sobre superficies blandas.' }
    ]
  },
  retroexcavadora: {
    id: 'retroexcavadora',
    nombre: 'Retroexcavadora QSP-3CX',
    path: '/modelos/retroexcavadora.glb',
    hotspots: [
      { number: '1', position: [-0.8, -0.3, 0], title: 'Cucharon Frontal', description: 'Pala cargadora de alta capacidad para movimiento de materiales.' },
      { number: '2', position: [0, 0.3, 0], title: 'Cabina Operativa 360°', description: 'Estación con asiento giratorio para doble mando (cargador/excavador).' },
      { number: '3', position: [0.2, -0.3, 0.3], title: 'Estabilizadores Hidráulicos', description: 'Patas extensibles para anclaje firme durante la excavación.' },
      { number: '4', position: [0.8, 0.4, 0], title: 'Brazo Excavador Trasero', description: 'Sistema articulado con balde profundo para zanjas.' }
    ]
  },
  bulldozer: {
    id: 'bulldozer',
    nombre: 'Bulldozer QSP D8T',
    path: '/modelos/bulldozer.glb',
    hotspots: [
      { number: '1', position: [-0.8, -0.3, 0], title: 'Hoja Topadora Frontal', description: 'Cuchilla de empuje reforzada para nivelación de tierra y desmonte masivo.' },
      { number: '2', position: [-0.12, 0.2, 0.2], title: 'Cilindros de Levante', description: 'Pistones hidráulicos pesados para ajustar el ángulo y altura de la hoja.' },
      { number: '3', position: [0.3, 0.4, 0.2], title: 'Cabina ROPS/FOPS', description: 'Estructura con alta protección antivuelco y visibilidad panorámica.' },
      { number: '4', position: [0.1, -0.35, 0.4], title: 'Oruga de Bajo Centro de Gravedad', description: 'Cadenas de tracción reforzadas para alta adherencia en pendientes.' }
    ]
  },
  autohormigonera: {
    id: 'autohormigonera',
    nombre: 'Autohormigonera QSP 3.5 TT',
    path: '/modelos/autohormigonera.glb',
    hotspots: [
      { number: '1', position: [0, 0.3, 0], title: 'Tambor Mezclador', description: 'Capacidad de mezcla de concreto de alta homogeneidad.' },
      { number: '2', position: [-0.8, -0.1, -0.15], title: 'Pala de Autocarga', description: 'Pala frontal articulada para cargar agregados.' },
      { number: '3', position: [-0.2, 0.2, 0.3], title: 'Cabina Frontal', description: 'Diseño panorámico con visión de descarga.' }
    ]
  },
  rodillo: {
    id: 'rodillo',
    nombre: 'Rodillo Compactador QSP',
    path: '/modelos/rodillo.glb',
    hotspots: [
      { number: '1', position: [-0.5, -0.2, 0], title: 'Rodillo Cilíndrico', description: 'Tambor metálico de alta frecuencia de vibración.' },
      { number: '2', position: [0.2, 0.4, 0], title: 'Cabina Operativa', description: 'Protección ROPS/FOPS para alta seguridad.' },
      { number: '3', position: [0.6, -0.2, 0], title: 'Eje Neumático Trasero', description: 'Ruedas de tracción para suelos inestables.' }
    ]
  }
} as const satisfies Record<string, MaquinariaData>;

type MaquinariaKey = keyof typeof MAQUINARIAS;

function Hotspot({ position, title, description, number = '+' }: HotspotData) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Html position={position} center zIndexRange={[100, 0]}>
      <div className="hotspot-container">
        <button
          className="hotspot-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          type="button"
        >
          {isOpen ? '✕' : number}
        </button>

        {isOpen && (
          <div className="hotspot-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{title}</strong>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
              {description}
            </p>
          </div>
        )}
      </div>
    </Html>
  );
}

function Model({ data }: { data: MaquinariaData }) {
  const { scene } = useGLTF(data.path);

  return (
    <group>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
      {data.hotspots.map((hs, idx) => (
        <Hotspot key={`${data.id}-${idx}`} {...hs} />
      ))}
    </group>
  );
}

export default function ModelCanvas() {
  const [selectedKey, setSelectedKey] = useState<MaquinariaKey>('excavadora');
  const currentData = MAQUINARIAS[selectedKey];

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <style>{hotspotStyles}</style>

      {/* Menú Flotante Centrado en la Parte Inferior */}
<div
  style={{
    position: 'absolute',
    bottom: 60, // Se cambia 'top' por 'bottom'
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    gap: '10px',
    background: 'rgba(15, 23, 42, 0.85)',
    padding: '10px 14px',
    borderRadius: '12px',
    backdropFilter: 'blur(8px)',
    maxWidth: 'calc(100vw - 40px)',
    overflowX: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }}
>
  {(Object.keys(MAQUINARIAS) as MaquinariaKey[]).map((key) => {
    const item = MAQUINARIAS[key];
    const isActive = selectedKey === key;
    return (
      <button
        key={key}
        onClick={() => setSelectedKey(key)}
        style={{
          padding: '8px 14px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: isActive ? '#eab308' : '#334155',
          color: isActive ? '#0f172a' : '#ffffff',
          fontWeight: isActive ? 'bold' : 'normal',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
      >
        {item.nombre}
      </button>
    );
  })}
</div>

      <Canvas camera={{ position: [0, 1.5, 7], fov: 50 }}>
        <color attach="background" args={['#ffffff']} />

        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        <Suspense fallback={null}>
          <Model key={currentData.id} data={currentData} />
        </Suspense>

        <OrbitControls 
          makeDefault 
          enableZoom={true} 
          autoRotate={true} 
          autoRotateSpeed={0.5} 
        />
      </Canvas>
    </div>
  );
}