'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, ContactShadows } from '@react-three/drei';
import Image from 'next/image';
import * as THREE from 'three';

const hotspotStyles = `
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.8); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 16px rgba(234, 179, 8, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
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
    padding: 16px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
    width: 280px; font-family: system-ui, -apple-system, sans-serif;
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

interface MaquinariaData {
  id: string;
  nombre: string;
  path: string;
  cameraPosition?: [number, number, number];
  especificaciones: Record<string, string>;
  hotspots: HotspotData[];
}

const MAQUINARIAS: Record<string, MaquinariaData> = {
  excavadora: {
    id: 'excavadora',
    nombre: 'Excavadora QSP HW220-9',
    path: '/modelos/excavadora.glb',
    cameraPosition: [0, 0, 2.5],
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
    },
    hotspots: [
      { position: [-0.8, -0.35, 0.1], title: 'Punta de la Cuchara', description: 'Dientes de penetración para romper terrenos duros.' },
      { position: [-0.8, 0.3, 0], title: 'Brazo e Hidráulicos', description: 'Sistema de pistones hidráulicos de alta presión.' },
      { position: [0.3, 0.1, 0.2], title: 'Cabina de Mando', description: 'Estación ergonómica con cristal blindado de seguridad.' },
      { position: [0.3, -0.4, 0.2], title: 'Oruga de Tracción', description: 'Distribuye el peso sobre superficies blandas.' }
    ]
  },
  retroexcavadora: {
    id: 'retroexcavadora',
    nombre: 'Retroexcavadora QSP-3CX',
    path: '/modelos/retroexcavadora.glb',
    cameraPosition: [0, 0, 2.5],
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
    },
    hotspots: [
      { position: [-0.8, -0.3, 0], title: 'Cucharon Frontal', description: 'Pala cargadora de alta capacidad para movimiento de materiales.' },
      { position: [0, 0.3, 0], title: 'Cabina Operativa 360°', description: 'Estación con asiento giratorio para doble mando (cargador/excavador).' },
      { position: [0.2, -0.3, 0.3], title: 'Estabilizadores Hidráulicos', description: 'Patas extensibles para anclaje firme durante la excavación.' },
      { position: [0.8, 0.4, 0], title: 'Brazo Excavador Trasero', description: 'Sistema articulado con balde profundo para zanjas.' }
    ]
  },
  bulldozer: {
    id: 'bulldozer',
    nombre: 'Bulldozer QSP D8T',
    path: '/modelos/bulldozer.glb',
    cameraPosition: [0, 0, 3.4],
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
    },
    hotspots: [
      { position: [-0.8, -0.3, 0], title: 'Hoja Topadora Frontal', description: 'Cuchilla de empuje reinforced para nivelación de tierra y desmonte masivo.' },
      { position: [-0.12, 0.2, 0.2], title: 'Cilindros de Levante', description: 'Pistones hidráulicos pesados para ajustar el ángulo y altura de la hoja.' },
      { position: [0.3, 0.4, 0.2], title: 'Cabina ROPS/FOPS', description: 'Estructura con alta protección antivuelco y visibilidad panorámica.' },
      { position: [0.1, -0.35, 0.4], title: 'Oruga de Bajo Centro de Gravedad', description: 'Cadenas de tracción para alta adherencia en pendientes.' }
    ]
  },
  autohormigonera_ah2: {
    id: 'autohormigonera_ah2',
    nombre: 'Autohormigonera QSP AH2',
    path: '/modelos/autohormigonera.glb',
    cameraPosition: [0, 0, 2.5],
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
    },
    hotspots: [
      { position: [0, 0.3, 0], title: 'Tambor Mezclador', description: 'Capacidad de mezcla de concreto de alta homogeneidad.' },
      { position: [-0.8, -0.1, -0.15], title: 'Pala de Autocarga', description: 'Pala frontal articulada para cargar agregados.' },
      { position: [-0.2, 0.2, 0.3], title: 'Cabina Frontal', description: 'Diseño panorámico con visión de descarga.' }
    ]
  },
  autohormigonera_ah3_5: {
    id: 'autohormigonera_ah3_5',
    nombre: 'Autohormigonera QSP AH3.5',
    path: '/modelos/autohormigonera.glb',
    cameraPosition: [0, 0, 2.5],
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
    },
    hotspots: [
      { position: [0, 0.3, 0], title: 'Tambor Mezclador', description: 'Capacidad de mezcla de concreto de alta homogeneidad.' },
      { position: [-0.8, -0.1, -0.15], title: 'Pala de Autocarga', description: 'Pala frontal articulada para cargar agregados.' },
      { position: [-0.2, 0.2, 0.3], title: 'Cabina Frontal', description: 'Diseño panorámico con visión de descarga.' }
    ]
  },
  rodillo_vr6: {
    id: 'rodillo_vr6',
    nombre: 'Rodillo Compactador QSP VR6',
    path: '/modelos/rodillo.glb',
    cameraPosition: [0, 0, 2.5],
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
    },
    hotspots: [
      { position: [-0.5, -0.2, 0], title: 'Rodillo Cilíndrico', description: 'Tambor metálico de alta frecuencia de vibración.' },
      { position: [0.2, 0.4, 0], title: 'Cabina Operativa', description: 'Protección ROPS/FOPS para alta seguridad.' },
      { position: [0.6, -0.2, 0], title: 'Eje Neumático Trasero', description: 'Ruedas de tracción para suelos inestables.' }
    ]
  },
  rodillo_vr8: {
    id: 'rodillo_vr8',
    nombre: 'Rodillo Compactador QSP VR8',
    path: '/modelos/rodillo.glb',
    cameraPosition: [0, 0, 2.5],
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
    },
    hotspots: [
      { position: [-0.5, -0.2, 0], title: 'Rodillo Cilíndrico', description: 'Tambor metálico de alta frecuencia de vibración.' },
      { position: [0.2, 0.4, 0], title: 'Cabina Operativa', description: 'Protección ROPS/FOPS para alta seguridad.' },
      { position: [0.6, -0.2, 0], title: 'Eje Neumático Trasero', description: 'Ruedas de tracción para suelos inestables.' }
    ]
  }
};

type MaquinariaKey = keyof typeof MAQUINARIAS;
const MAQUINARIA_KEYS = Object.keys(MAQUINARIAS) as MaquinariaKey[];

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
          {/* Botón de Hotspot con punto intermitente */}
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

          {/* Card de Información */}
          {isOpen && (
            <div className="hotspot-card" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '15px', color: '#eab308' }}>{title}</strong>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4' }}>
                {description}
              </p>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function Model({ data, showHotspots }: { data: MaquinariaData; showHotspots: boolean }) {
  const { scene } = useGLTF(data.path);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [specSheetOpen, setSpecSheetOpen] = useState(false);

  const currentData = MAQUINARIAS[selectedKey];
  const currentIndex = MAQUINARIA_KEYS.indexOf(selectedKey);

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + MAQUINARIA_KEYS.length) % MAQUINARIA_KEYS.length;
    setSelectedKey(MAQUINARIA_KEYS[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % MAQUINARIA_KEYS.length;
    setSelectedKey(MAQUINARIA_KEYS[nextIdx]);
  };

  const cameraPos = currentData.cameraPosition || [0, 0, 2.5];

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
        backgroundRepeat: 'no-repeat'
      }}
    >
      <style>{hotspotStyles}</style>

      {/* Logo QSP */}
      <div style={{ position: 'absolute', top: '24px', left: '28px', zIndex: 20 }}>
        <Image
          src="/logos/logo-qsp.png"
          alt="QSP Heavy Equipment"
          width={160}
          height={55}
          style={{ objectFit: 'contain' }}
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
          padding: '12px 28px',
          borderRadius: '12px',
          border: '1px solid #eab308',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: '0 6px 24px rgba(0,0,0,0.9)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          maxWidth: '50vw',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {currentData.nombre}
      </div>

      {/* Menú Hamburguesa */}
      <div style={{ position: 'absolute', top: '24px', right: '28px', zIndex: 20 }}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            backgroundColor: '#000000',
            color: '#eab308',
            border: '1px solid #eab308',
            borderRadius: '10px',
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
              borderRadius: '10px',
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
                    setSelectedKey(key);
                    setMenuOpen(false);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? '#eab308' : 'transparent',
                    color: isActive ? '#000000' : '#ffffff',
                    fontWeight: isActive ? 'bold' : '500',
                    cursor: 'pointer',
                    fontSize: '15px',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.nombre}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón Ficha Técnica */}
      <button
        onClick={() => setSpecSheetOpen((prev) => !prev)}
        style={{
          position: 'absolute',
          bottom: '36px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          backgroundColor: '#000000',
          color: '#eab308',
          border: '1px solid #eab308',
          borderRadius: '10px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.9)',
          transition: 'all 0.2s'
        }}
      >
        <span style={{ fontSize: '18px' }}>📋</span> {specSheetOpen ? 'Cerrar Ficha' : 'Ficha Técnica'}
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
              backgroundColor: 'rgba(0, 0, 0, 0.94)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid #eab308',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.95)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#eab308', fontWeight: 'bold', letterSpacing: '1px' }}>Especificaciones Técnicas</span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', color: '#ffffff', fontWeight: 'bold' }}>{currentData.nombre}</h2>
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
              >
                ✕
              </button>
            </div>

            {/* Grid dinámico de 2 columnas */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
                gap: '8px 20px',
              }}
            >
              {Object.entries(currentData.especificaciones).map(([clave, valor], idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 12px',
                    backgroundColor: idx % 4 < 2 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #eab308'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#d4d4d8', fontWeight: '500' }}>{clave}</span>
                  <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold', textAlign: 'right', marginLeft: '12px' }}>{valor}</span>
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
          position: 'absolute', top: '50%', left: '28px', transform: 'translateY(-50%)',
          zIndex: 10, backgroundColor: '#000000', color: '#eab308', border: '1px solid #eab308',
          borderRadius: '50%', width: '56px', height: '56px', fontSize: '24px', fontWeight: 'bold',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.85)'
        }}
        aria-label="Máquina anterior"
      >
        ❮
      </button>

      {/* Flecha Derecha */}
      <button
        onClick={handleNext}
        style={{
          position: 'absolute', top: '50%', right: '28px', transform: 'translateY(-50%)',
          zIndex: 10, backgroundColor: '#000000', color: '#eab308', border: '1px solid #eab308',
          borderRadius: '50%', width: '56px', height: '56px', fontSize: '24px', fontWeight: 'bold',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.85)'
        }}
        aria-label="Siguiente máquina"
      >
        ❯
      </button>

      {/* Canvas 3D */}
      <Canvas key={selectedKey} camera={{ position: cameraPos, fov: 35 }} gl={{ alpha: true }} shadows>
        <ambientLight intensity={0.5} />
        <hemisphereLight args={['#ffffff', '#222222', 0.4]} />

        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <directionalLight position={[0, -5, 5]} intensity={0.2} />

        <React.Suspense fallback={null}>
          <Model data={currentData} showHotspots={!specSheetOpen} />

          <ContactShadows
            opacity={1.8}
            scale={12}
            blur={1.8}
            far={1.5}
            resolution={1024}
            color="#000000"
            position={[0, -0.48, 0]}
          />
        </React.Suspense>

        <OrbitControls 
          makeDefault 
          target={[0, 0, 0]}
          enableZoom={true} 
          minDistance={1.5}
          maxDistance={5}
          autoRotate={true} 
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 2.3}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}