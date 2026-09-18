'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, ContactShadows, useProgress } from '@react-three/drei';
import Image from 'next/image';
import * as THREE from 'three';

const hotspotStyles = `
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.8); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 16px rgba(234, 179, 8, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .hotspot-container { position: relative; pointer-events: auto; user-select: none; }
  .hotspot-button {
    width: 24px; height: 24px; background-color: #eab308; border: 2px solid #000000;
    border-radius: 50%; cursor: pointer; animation: pulse 1.8s infinite;
    transition: transform 0.2s ease; display: flex; align-items: center;
    justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6);
  }
  .hotspot-dot {
    width: 8px; height: 8px; background-color: #000000; border-radius: 50%;
  }
  .hotspot-button:hover, .hotspot-button:active { transform: scale(1.3); background-color: #facc15; }
  .hotspot-card {
    position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
    background: #000000; color: #ffffff;
    padding: 16px; border-radius: 2px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
    width: 280px; font-family: var(--font-montserrat), sans-serif;
    border: 1px solid #eab308; z-index: 50;
  }
  .hotspot-card::after {
    content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
    border-width: 8px 8px 0 8px; border-style: solid;
    border-color: #eab308 transparent transparent transparent;
  }
`;

interface HotspotData {
  position: [number, number, number];
  title: string;
  description: string;
}

interface FichaTecnica {
  id: string;
  tabLabel: string;
  nombre: string;
  especificaciones: Record<string, string>;
}

interface MaquinariaData {
  id: string;
  nombre: string;
  menuNombre: string;
  path: string;
  cameraPosition?: [number, number, number];
  shadowY?: number;
  hotspots: HotspotData[];
  fichas: FichaTecnica[];
}

const MAQUINARIAS: Record<string, MaquinariaData> = {
  excavadora: {
    id: 'excavadora',
    nombre: 'Excavadora QSP HW220-9',
    menuNombre: 'Excavadora QSP HW220-9',
    path: '/modelos/excavadora.glb',
    cameraPosition: [0, 0, 2.5],
    hotspots: [
      { position: [-0.8, -0.35, 0.1], title: 'Punta de la Cuchara', description: 'Dientes de penetración para romper terrenos duros.' },
      { position: [-0.8, 0.3, 0], title: 'Brazo e Hidráulicos', description: 'Sistema de pistones hidráulicos de alta presión.' },
      { position: [0.3, 0.1, 0.2], title: 'Cabina de Mando', description: 'Estación ergonómica con cristal blindado de seguridad.' },
      { position: [0.3, -0.4, 0.2], title: 'Oruga de Tracción', description: 'Distribuye el peso sobre superficies blandas.' }
    ],
    fichas: [
      {
        id: 'hw220',
        tabLabel: 'HW220-9',
        nombre: 'Excavadora QSP HW220-9',
        especificaciones: {
          'Peso': '21.200 KG',
          'Dimensiones': '9.625 × 2.800 mm',
          'Motor': '6BTAA5.9',
          'Marca Motor': 'CUMMINS',
          'Tipo Motor': 'TURBO DIESEL INTERCOOLER / 5.900 CC / 6 CILINDROS',
          'Potencia': '179 HP',
          'Torque Máximo': '708 N.M.',
          'Capacidad Balde': '1.05 M3',
          'Bomba Hidráulica': 'KAWASAKI',
          'Profundidad Excavación': '6.490 mm',
          'Fuerza Excavación Cubo': '146 KN',
          'Velocidad Máxima': '3 KM BAJA / 6 KM ALTA',
          'Ancho Oruga': '600 mm',
          'Transmisión': 'HIDROSTATICA - MOTORES DE TRASLACION',
          'Bomba Principal': 'KAWASAKI',
          'Sistema Giro': 'CONVENCIONAL',
          'Tanque Combustible': '87.1 GL',
          'Tanque Hidráulico': '71.3 GL',
          'Tipo de Mandos': 'JOYSTICK',
          'Freno Estacionamiento': 'HIDRAULICO',
          'Cabina': 'CERRADA AA PROTECCION ROPS + FOPS',
          'Capacidad Aceite Motor': '2.74 GL',
          'Ancho Balde Cargador': '1.200 mm',
          'Alcance Horizontal Brazo': '9.675 mm',
          'Altura Alcance Brazo': '10.950 mm',
        }
      }
    ]
  },
  retroexcavadora: {
    id: 'retroexcavadora',
    nombre: 'Retroexcavadora QSP-3CX',
    menuNombre: 'Retroexcavadora QSP-3CX',
    path: '/modelos/retroexcavadora.glb',
    cameraPosition: [0, 0, 2.5],
    hotspots: [
      { position: [-0.8, -0.3, 0], title: 'Cucharon Frontal', description: 'Pala cargadora de alta capacidad para movimiento de materiales.' },
      { position: [0, 0.3, 0], title: 'Cabina Operativa 360°', description: 'Estación con asiento giratorio para doble mando (cargador/excavador).' },
      { position: [0.2, -0.3, 0.3], title: 'Estabilizadores Hidráulicos', description: 'Patas extensibles para anclaje firme durante la excavación.' },
      { position: [0.8, 0.4, 0], title: 'Brazo Excavador Trasero', description: 'Sistema articulado con balde profundo para zanjas.' }
    ],
    fichas: [
      {
        id: 'qsp3cx',
        tabLabel: 'QSP-3CX',
        nombre: 'Retroexcavadora QSP-3CX',
        especificaciones: {
          'Peso': '8.600 KG',
          'Dimensiones': '6.105 × 2.484 × 3.813 mm',
          'Marca Motor': 'CUMMINS',
          'Tipo Motor': 'TURBO DIESEL INTERCOOLER / 3.900 CC / 4 CILINDROS',
          'Potencia': '100 HP / 2.200 RPM',
          'Capacidad Balde': '1 M3',
          'Profundidad Excavación': '4.085 mm',
          'Fuerza Excavación Cubo': '49.8 Kn',
          'Velocidad Máxima': '38 KM/H',
          'Altura Pasador Cucharón': '3.498 mm',
          'Transmisión': 'CARRARO TLB1-4WD',
          'Tipo de Mandos': 'DIRECCION HIDRAULICA / MANDOS JOYSTICK',
          'Freno Estacionamiento': 'MANUAL',
          'Cabina': 'CERRADA AA PROTECCION ROPS + FOPS',
          'Sistema Refrigeración': 'LIQUIDA',
          'Ancho Balde Cargador': '2.268 mm',
          'Capacidad Balde Excavador': '0.30 M3',
          'Alcance Horizontal Brazo': '5.304 mm',
          'Altura Alcance Brazo': '5.813 mm',
          'Auxiliar Hidráulico': 'ADELANTE Y ATRÁS',
        }
      }
    ]
  },
  bulldozer: {
    id: 'bulldozer',
    nombre: 'Bulldozer QSP D8T',
    menuNombre: 'Bulldozer QSP D8T',
    path: '/modelos/bulldozer.glb',
    cameraPosition: [0, 0, 3.4],
    shadowY: -0.62,
    hotspots: [
      { position: [-0.8, -0.3, 0], title: 'Hoja Topadora Frontal', description: 'Cuchilla de empuje reinforced para nivelación de tierra y desmonte masivo.' },
      { position: [-0.12, 0.2, 0.2], title: 'Cilindros de Levante', description: 'Pistones hidráulicos pesados para ajustar el ángulo y altura de la hoja.' },
      { position: [0.3, 0.4, 0.2], title: 'Cabina ROPS/FOPS', description: 'Estructura con alta protección antivuelco y visibilidad panorámica.' },
      { position: [0.1, -0.35, 0.4], title: 'Oruga de Bajo Centro de Gravedad', description: 'Cadenas de tracción para alta adherencia en pendientes.' }
    ],
    fichas: [
      {
        id: 'd8t',
        tabLabel: 'D8T',
        nombre: 'Bulldozer QSP D8T',
        especificaciones: {
          'Peso': '13.700 KG',
          'Dimensiones': 'LARGO 4.492 mm / ANCHO 2.950 mm',
          'Marca Motor': 'CUMMINS',
          'Tipo Motor': 'TURBO DIESEL INTERCOOLER / 5.900 CC / 6 CILINDROS',
          'Potencia': '104 HP / 1.900 RPM',
          'Velocidad Máxima': '9,8 KM/H',
          'Transmisión': 'MECANICA ASISTIDA HIDRULICAMENTE',
          'Tanque Combustible': '74 GL',
          'Tanque Hidráulico': '20 GL',
          'Tipo de Mandos': 'JOYSTICK',
          'Freno Estacionamiento': 'MECANICO + HIDRAULICO',
          'Cabina': 'CERRADA AA PROTECCION ROPS + FOPS',
          'Ancho Hoja Dozer': '3.185 mm',
          'Alto Hoja Dozer': '1.090 mm',
          'Capacidad Hoja Dozer': '3.7 M3',
          'Función Angulación': 'SI',
          'Ripper Trasero': 'NO',
        }
      }
    ]
  },
  autohormigonera: {
    id: 'autohormigonera',
    nombre: 'Autohormigonera QSP',
    menuNombre: 'Autohormigonera QSP (AH2 / AH3.5)',
    path: '/modelos/autohormigonera.glb',
    cameraPosition: [0, 0, 2.5],
    shadowY: -0.38,
    hotspots: [
      { position: [0, 0.3, 0], title: 'Tambor Mezclador', description: 'Capacidad de mezcla de concreto de alta homogeneidad.' },
      { position: [-0.8, -0.1, -0.15], title: 'Pala de Autocarga', description: 'Pala frontal articulada para cargar agregados.' },
      { position: [-0.2, 0.2, 0.3], title: 'Cabina Frontal', description: 'Diseño panorámico con visión de descarga.' }
    ],
    fichas: [
      {
        id: 'ah2',
        tabLabel: 'AH2',
        nombre: 'Autohormigonera QSP AH2',
        especificaciones: {
          'Peso': '8.300 KG',
          'Dimensiones': '7600 × 2800 mm',
          'Marca Motor': 'YUCHAI 4105 Turbocargado',
          'Potencia': '114 HP',
          'Capacidad Balde': '0.7 m³',
          'Velocidad Máxima': '30 km/h',
          'Radio de Giro': '5300 mm',
          'Capacidad Tambor': '3.500 m³',
          'Tanque Combustible': '120 LT',
          'Ángulo de Descarga': '180°',
          'Tanque de Agua': '920 litros',
          'Velocidad Rotación': '18-21 rpm',
          'Tracción': 'Convertidor de par',
          'Caja de Cambios': 'Modelo ZL-280 con servotransmisión',
          'Marchas': '4 hacia adelante + 4 atrás',
          'Suministro Agua': 'Relé de tiempo',
          'Tipo de Tambor': 'Doble cono / aspas doble espiral',
          'Capacidad Geométrica': '4740 litros',
          'Rotación del Chasis': '270° hidráulica',
          'Elevación Tambor': '2 gatos doble acción',
          'Canal de Descarga': 'Rotación 90° manual',
          'Sistema Descarga': 'Canal hidráulico automático',
          'Alimentación': 'Cucharón simple rápido',
          'Rotación': 'Sincrónica tanque y cabina',
        }
      },
      {
        id: 'ah3_5',
        tabLabel: 'AH3.5',
        nombre: 'Autohormigonera QSP AH3.5',
        especificaciones: {
          'Peso': '4.500 KG',
          'Dimensiones': '6.950 × 2.720 mm',
          'Marca Motor': 'YUCHAI 4102',
          'Tipo Motor': 'TURBO DIESEL / 100.5 HP',
          'Torque Máximo': '340 N·m',
          'Capacidad Balde': '0.5 m³',
          'Velocidad Máxima': '35 km/h',
          'Radio de Giro': '5.300 mm',
          'Capacidad Tambor': '2.0 m³',
          'Capacidad Mezcla': '3.500 L',
          'Transmisión': 'Transmisión Hidráulica',
          'Tanque Combustible': '75 L',
          'Tanque Hidráulico': '75 L',
          'Altura de Descarga': '1.700 mm',
          'Tipo de Mandos': 'Joystick - Hidráulica',
          'Freno Estacionamiento': 'Automático con corte de aire',
          'Cabina': 'Cabina full equipo',
          'Ángulo de Descarga': '180°',
          'Flujo de Agua': '3 L/s',
          'Tanque de Agua': '500 L',
          'Depósito Aceite Caja': '18 L',
        }
      }
    ]
  },
  rodillo: {
    id: 'rodillo',
    nombre: 'Rodillo Compactador QSP',
    menuNombre: 'Rodillo Compactador QSP (VR6 / VR8)',
    path: '/modelos/rodillo.glb',
    cameraPosition: [0, 0, 2.5],
    hotspots: [
      { position: [-0.5, -0.2, 0], title: 'Rodillo Cilíndrico', description: 'Tambor metálico de alta frecuencia de vibración.' },
      { position: [0.2, 0.4, 0], title: 'Cabina Operativa', description: 'Protección ROPS/FOPS para alta seguridad.' },
      { position: [0.6, -0.2, 0], title: 'Eje Neumático Trasero', description: 'Ruedas de tracción para suelos inestables.' }
    ],
    fichas: [
      {
        id: 'vr6',
        tabLabel: 'VR6',
        nombre: 'Rodillo Compactador QSP VR6',
        especificaciones: {
          'Peso': '6.000 KG',
          'Dimensiones': '4.660 × 1.865 mm',
          'Marca Motor': 'Quanchai V28 diésel',
          'Tipo Motor': 'DIESEL / 4 CILINDROS',
          'Potencia': '49.3 HP',
          'Velocidad Máxima': '0-6.8 KM/H',
          'Radio de Giro': '4.850 mm',
          'Transmisión': 'HIDRAULICA',
          'Tanque Combustible': '130 L',
          'Tanque Hidráulico': '130 L',
          'Frecuencia Vibración': '45 HZ',
          'Tipo de Mandos': 'DIRECCION HIDRAULICA',
          'Freno Estacionamiento': 'HIDRAULICO',
          'Cabina': 'CERRADA AA PROTECCION ROPS + FOPS',
          'Capacidad Aceite Motor': '5.5 L',
          'Ancho Trabajo Rodillo': '1.700 mm',
          'Diámetro del Tambor': '1.200 mm',
          'Espesor Cubierta': '20 mm',
          'Capacidad Vibración': '75 KN',
        }
      },
      {
        id: 'vr8',
        tabLabel: 'VR8',
        nombre: 'Rodillo Compactador QSP VR8',
        especificaciones: {
          'Peso': '8.000 KG',
          'Dimensiones': '4.950 × 2.050 mm',
          'Marca Motor': 'Quanchai V35A diésel',
          'Tipo Motor': 'DIESEL / 4 CILINDROS',
          'Potencia': '98.5 HP',
          'Velocidad Máxima': '0-10 KM/H',
          'Radio de Giro': '4.900 mm',
          'Transmisión': 'HIDRAULICO',
          'Tanque Combustible': '150 L',
          'Tanque Hidráulico': '140 L',
          'Frecuencia Vibración': '45 HZ',
          'Tipo de Mandos': 'DIRECCION HIDRAULICA',
          'Freno Estacionamiento': 'HIDRAULICO',
          'Cabina': 'CERRADA AA PROTECCION ROPS + FOPS',
          'Capacidad Aceite Motor': '8.5 L',
          'Ancho Trabajo Rodillo': '1.860 mm',
          'Diámetro del Tambor': '1.200 mm',
          'Espesor Cubierta': '20 mm',
          'Capacidad Vibración': '106 KN',
        }
      }
    ]
  }
};

type MaquinariaKey = keyof typeof MAQUINARIAS;
const MAQUINARIA_KEYS = Object.keys(MAQUINARIAS) as MaquinariaKey[];

// Componente de Carga de Modelos
function LoadingOverlay({ isLoading, modelName }: { isLoading: boolean; modelName: string }) {
  const { active, progress: realProgress } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);

  // Reiniciar progreso cada vez que inicia una carga
  useEffect(() => {
    if (isLoading) {
      setDisplayProgress(0);
    }
  }, [isLoading, modelName]);

  // Actualización fluida del porcentaje visual
  useEffect(() => {
    if (!isLoading && !active) {
      setDisplayProgress(100);
      return;
    }

    if (active) {
      // Descarga real por red
      setDisplayProgress(Math.max(1, Math.round(realProgress)));
    } else {
      // Avance fluido mientras se monta o lee de caché
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= 98) return prev;
          const increment = Math.floor(Math.random() * 12) + 8;
          return Math.min(98, prev + increment);
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isLoading, active, realProgress]);

  const show = isLoading || active;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
        pointerEvents: show ? 'auto' : 'none',
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        transition: 'opacity 0.25s ease, visibility 0.25s ease',
        fontFamily: 'var(--font-montserrat), sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          padding: '28px 44px',
          borderRadius: '2px',
          border: 'none',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.95)',
          minWidth: '260px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            border: '3px solid rgba(234, 179, 8, 0.2)',
            borderTop: '3px solid #eab308',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: '700',
            color: '#eab308',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          Cargando Modelo 3D
        </p>
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: '11px',
            fontWeight: '600',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            maxWidth: '260px',
          }}
        >
          {modelName}
        </p>
        <p
          style={{
            margin: '10px 0 0 0',
            fontSize: '16px',
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: '0.06em',
          }}
        >
          {displayProgress}%
        </p>
      </div>
    </div>
  );
}

function Hotspot({ position, title, description }: HotspotData) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;

    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);

    const cameraToHotspot = worldPos.clone().sub(camera.position).normalize();
    const hotspotNormal = new THREE.Vector3(...position).normalize();

    const isFacingCamera = cameraToHotspot.dot(hotspotNormal) < 0;

    if (isVisible !== isFacingCamera) {
      setIsVisible(isFacingCamera);
      if (!isFacingCamera && isOpen) {
        setIsOpen(false);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Html
        center
        zIndexRange={[100, 0]}
        style={{
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          transform: isVisible ? 'scale(1)' : 'scale(0.5)',
        }}
      >
        <div className="hotspot-container">
          <button
            className="hotspot-button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            type="button"
            aria-label={title}
          >
            {isOpen ? (
              <span style={{ color: '#000000', fontSize: '12px', fontWeight: 'bold' }}>✕</span>
            ) : (
              <span className="hotspot-dot" />
            )}
          </button>

          {isOpen && (
            <div className="hotspot-card" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>
                  {title}
                </strong>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#e2e8f0', lineHeight: '1.5', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>
                {description}
              </p>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function Model({ 
  data, 
  showHotspots, 
  onLoaded 
}: { 
  data: MaquinariaData; 
  showHotspots: boolean; 
  onLoaded?: () => void;
}) {
  const { scene } = useGLTF(data.path);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    onLoaded?.();
  }, [scene, onLoaded]);

  return (
    <group>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
      {showHotspots &&
        data.hotspots.map((hs, idx) => (
          <Hotspot key={`${data.id}-${idx}`} {...hs} />
        ))}
    </group>
  );
}

export default function ModelCanvas() {
  const [selectedKey, setSelectedKey] = useState<MaquinariaKey>('excavadora');
  const [selectedFichas, setSelectedFichas] = useState<Record<string, number>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [specSheetOpen, setSpecSheetOpen] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const currentData = MAQUINARIAS[selectedKey];
  const currentIndex = MAQUINARIA_KEYS.indexOf(selectedKey);

  const activeFichaIndex = selectedFichas[selectedKey] || 0;
  const activeFicha = currentData.fichas[activeFichaIndex] || currentData.fichas[0];

  const loadStartTimeRef = useRef<number>(Date.now());

  const startLoading = () => {
    loadStartTimeRef.current = Date.now();
    setModelLoading(true);
  };

  const handleModelLoaded = React.useCallback(() => {
    const elapsed = Date.now() - loadStartTimeRef.current;
    const minDisplayDuration = 600; // Garantiza al menos 600ms para percibir la animación
    const remainingTime = Math.max(0, minDisplayDuration - elapsed);
    setTimeout(() => {
      setModelLoading(false);
    }, remainingTime);
  }, []);

  const handleSelectFicha = (idx: number) => {
    setSelectedFichas((prev) => ({ ...prev, [selectedKey]: idx }));
  };

  const handleSelectModel = (key: MaquinariaKey) => {
    if (key !== selectedKey) {
      startLoading();
      setSelectedKey(key);
    }
  };

  const handlePrev = () => {
    startLoading();
    const nextIdx = (currentIndex - 1 + MAQUINARIA_KEYS.length) % MAQUINARIA_KEYS.length;
    setSelectedKey(MAQUINARIA_KEYS[nextIdx]);
  };

  const handleNext = () => {
    startLoading();
    const nextIdx = (currentIndex + 1) % MAQUINARIA_KEYS.length;
    setSelectedKey(MAQUINARIA_KEYS[nextIdx]);
  };

  const cameraPos = currentData.cameraPosition || [0, 0, 2.5];
  const baseDistance = cameraPos[2];
  const minZoomDistance = Number((baseDistance * 0.75).toFixed(2));
  const maxZoomDistance = Number((baseDistance * 1.25).toFixed(2));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundImage: 'url("/fondo/fondo-qsp.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: 'var(--font-montserrat), sans-serif',
      }}
    >
      <style>{hotspotStyles}</style>

      {/* Overlay de Carga de Modelos 3D */}
      <LoadingOverlay isLoading={modelLoading} modelName={currentData.nombre} />

      {/* Logo QSP (cuadros de imágenes sin borde color) */}
      <div style={{ position: 'absolute', top: '24px', left: '28px', zIndex: 20, border: 'none' }}>
        <Image
          src="/logos/logo-qsp.png"
          alt="QSP Heavy Equipment"
          width={160}
          height={55}
          style={{ objectFit: 'contain', border: 'none' }}
          priority
        />
      </div>

      {/* Título de la Maquinaria */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          backgroundColor: '#000000',
          color: '#ffffff',
          padding: '16px 40px',
          borderRadius: '2px',
          border: 'none',
          fontSize: '19px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.95)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          maxWidth: '65vw',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {activeFicha.nombre}
      </div>

      {/* Menú Hamburguesa */}
      <div style={{ position: 'absolute', top: '24px', right: '28px', zIndex: 20 }}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            backgroundColor: '#000000',
            color: '#eab308',
            border: '1px solid #eab308',
            borderRadius: '2px',
            width: '52px',
            height: '52px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px',
            padding: 0,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.8)',
            transition: 'all 0.2s'
          }}
          aria-label="Abrir menú de maquinarias"
        >
          {menuOpen ? (
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#eab308', lineHeight: 1 }}>✕</span>
          ) : (
            <>
              <span style={{ width: '26px', height: '3px', backgroundColor: '#eab308', display: 'block', borderRadius: '2px' }}></span>
              <span style={{ width: '26px', height: '3px', backgroundColor: '#eab308', display: 'block', borderRadius: '2px' }}></span>
              <span style={{ width: '26px', height: '3px', backgroundColor: '#eab308', display: 'block', borderRadius: '2px' }}></span>
            </>
          )}
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '62px',
              right: 0,
              backgroundColor: '#000000',
              border: '1px solid #eab308',
              borderRadius: '2px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '280px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.95)',
              zIndex: 40
            }}
          >
            {MAQUINARIA_KEYS.map((key) => {
              const item = MAQUINARIAS[key];
              const isActive = selectedKey === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    handleSelectModel(key);
                    setMenuOpen(false);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: '2px',
                    border: 'none',
                    backgroundColor: isActive ? '#eab308' : 'transparent',
                    color: isActive ? '#000000' : '#ffffff',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.menuNombre}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón Ficha Técnica - Color amarillo, borde redondo menor diámetro y sin iconos */}
      <button
        onClick={() => setSpecSheetOpen((prev) => !prev)}
        style={{
          position: 'absolute',
          bottom: '36px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          backgroundColor: '#eab308',
          color: '#000000',
          border: 'none',
          borderRadius: '2px',
          padding: '14px 28px',
          fontSize: '14px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(0,0,0,0.9)',
          transition: 'all 0.2s'
        }}
      >
        <span>{specSheetOpen ? 'CERRAR FICHA' : 'FICHA TÉCNICA'}</span>
      </button>

      {/* Modal Ficha Técnica */}
      {specSheetOpen && (
        <div
          onClick={() => setSpecSheetOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0,0,0,0.45)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '88vh',
              overflowY: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.94)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: 'none',
              borderRadius: '2px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.95)',
            }}
          >
            {/* Header del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#eab308', fontWeight: '700', letterSpacing: '0.14em' }}>Especificaciones Técnicas</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#ffffff', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{activeFicha.nombre}</h2>
              </div>
              <button
                onClick={() => setSpecSheetOpen(false)}
                style={{
                  background: 'none',
                  border: '1px solid #eab308',
                  borderRadius: '50%',
                  color: '#eab308',
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                aria-label="Cerrar especificaciones"
              >
                ✕
              </button>
            </div>

            {/* Pestañas de Variante / Selector de Ficha Técnica */}
            {currentData.fichas.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                  padding: '6px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '2px',
                  border: 'none',
                  width: 'fit-content',
                }}
              >
                <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px' }}>
                  Variante:
                </span>
                {currentData.fichas.map((ficha, idx) => {
                  const isSelected = idx === activeFichaIndex;
                  return (
                    <button
                      key={ficha.id}
                      onClick={() => handleSelectFicha(idx)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '2px',
                        border: isSelected ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: isSelected ? '#eab308' : 'rgba(0, 0, 0, 0.6)',
                        color: isSelected ? '#000000' : '#e2e8f0',
                        fontWeight: isSelected ? '800' : '600',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {ficha.tabLabel}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Cuadrícula de Especificaciones Técnicas */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
                gap: '8px 20px',
              }}
            >
              {Object.entries(activeFicha.especificaciones).map(([clave, valor], idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: idx % 4 < 2 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '2px',
                    border: 'none'
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#d4d4d8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{clave}</span>
                  <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '700', textAlign: 'right', marginLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{valor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Flecha Izquierda */}
      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          top: '50%',
          left: '28px',
          transform: 'translateY(-50%)',
          zIndex: 10,
          backgroundColor: '#000000',
          color: '#eab308',
          border: '1px solid #eab308',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.85)',
          transition: 'all 0.2s'
        }}
        aria-label="Máquina anterior"
      >
        ❮
      </button>

      {/* Flecha Derecha */}
      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          top: '50%',
          right: '28px',
          transform: 'translateY(-50%)',
          zIndex: 10,
          backgroundColor: '#000000',
          color: '#eab308',
          border: '1px solid #eab308',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.85)',
          transition: 'all 0.2s'
        }}
        aria-label="Siguiente máquina"
      >
        ❯
      </button>

      {/* Canvas 3D */}
      <Canvas key={selectedKey} camera={{ position: cameraPos, fov: 35 }} gl={{ alpha: true }} shadows>
        <ambientLight intensity={0.85} />
        <hemisphereLight args={['#ffffff', '#d4a373', 0.8]} />

        <directionalLight
          position={[5, 8, 5]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        <directionalLight position={[-5, 5, -5]} intensity={0.6} />
        <directionalLight position={[0, 2, 6]} intensity={0.6} />
        <directionalLight position={[0, -3, 2]} intensity={0.5} />

        <React.Suspense fallback={null}>
          <Model data={currentData} showHotspots={!specSheetOpen} onLoaded={handleModelLoaded} />

          <ContactShadows
            opacity={1.8}
            scale={12}
            blur={1.8}
            far={1.5}
            resolution={1024}
            color="#000000"
            position={[0, currentData.shadowY ?? -0.48, 0]}
          />
        </React.Suspense>

        <OrbitControls 
          makeDefault 
          target={[0, 0, 0]}
          enableZoom={true} 
          minDistance={minZoomDistance}
          maxDistance={maxZoomDistance}
          autoRotate={true} 
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}