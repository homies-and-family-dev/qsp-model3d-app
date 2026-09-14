'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { Suspense, useState } from 'react';

const hotspotStyles = `
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8);
    }
    70% {
      transform: scale(1.15);
      box-shadow: 0 0 0 14px rgba(239, 68, 68, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }

  .hotspot-container {
    position: relative;
    pointer-events: auto;
    user-select: none;
  }

  .hotspot-button {
    width: 24px;
    height: 24px;
    background-color: #ef4444;
    border: 2px solid #ffffff;
    border-radius: 50%;
    cursor: pointer;
    animation: pulse 1.8s infinite;
    transition: transform 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .hotspot-button:hover {
    transform: scale(1.25);
    background-color: #dc2626;
  }

  .hotspot-card {
    position: absolute;
    bottom: 34px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    color: #ffffff;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    width: 230px;
    font-family: system-ui, -apple-system, sans-serif;
    border: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 50;
  }

  /* Flecha apuntadora de la tarjeta hacia el punto */
  .hotspot-card::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0 6px;
    border-style: solid;
    border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
  }
`;

interface HotspotProps {
  position: [number, number, number];
  title: string;
  description: string;
  number?: string;
}

function Hotspot({ position, title, description, number = '+' }: HotspotProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Html
      position={position}
      center
      /* zIndexRange previene que la interfaz se corte o se solape con otros elementos 3D */
      zIndexRange={[100, 0]}
    >
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
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

function Model() {
  const { scene } = useGLTF('/modelos/Meshy_AI_Yellow_Excavator_on_C_0908153241_texture.glb');

  return (
    <group>
      {/* El modelo 3D principal */}
      <primitive object={scene} scale={1} position={[0, 0, 0]} />

      {/* 
        COORDENADAS EXACTAS (X, Y, Z) DE LA EXCAVADORA:
        - X: Posición horizontal (Negativo = Izquierda/Pala, Positivo = Derecha/Motor)
        - Y: Posición vertical (Negativo = Suelo/Orugas, Positivo = Cabina/Brazo)
        - Z: Profundidad (Adelante / Atrás)
      */}

      {/* 1. Punta de la Pala / Cuchara */}
      <Hotspot
        number="1"
        position={[ -0.8, -0.35, 0.1]}
        title="Punta de la Cuchara"
        description="Dientes de penetración de alta resistencia diseñados para romper terrenos duros."
      />

      {/* 2. Cilindro hidráulico del brazo */}
      <Hotspot
        number="2"
        position={[-0.8, 0.3, 0]}
        title="Brazo e Hidráulicos"
        description="Sistema de pistones hidráulicos de alta presión para la elevación de fuerza."
      />

      {/* 3. Cabina del operador */}
      <Hotspot
        number="3"
        position={[0.3, 0.1, 0.2]}
        title="Cabina de Mando"
        description="Estación de trabajo ergonómica con cristal blindado de seguridad."
      />

      {/* 4. Oruga / Cadena de rodaje */}
      <Hotspot
        number="4"
        position={[0.3, -0.4, 0.2]}
        title="Oruga de Tracción"
        description="Estructura metálica continua que distribuye el peso sobre superficies blandas."
      />
    </group>
  );
}

export default function ModelCanvas() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <style>{hotspotStyles}</style>

      <Canvas camera={{ position: [0, 1.5, 7], fov: 50 }}>
        <color attach="background" args={['#ffffff']} />

        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />

        <Suspense fallback={null}>
          <Model />
        </Suspense>

        <OrbitControls makeDefault enableZoom={true} />
      </Canvas>
    </div>
  );
}