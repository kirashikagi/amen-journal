import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Wind, Music, Volume2, Trash2, User, X, Loader,
  LogOut, SkipBack, SkipForward, Play, Pause,
  Heart, Moon, Flame, Crown, Sparkles, Zap, CheckCircle2, Info, ChevronRight, ChevronUp, ChevronDown, Copy, Check, UploadCloud, Users, MessageSquare, RefreshCw,
  ArrowRight, BookOpen, Search, Compass, Anchor, Frown, Sun, CloudRain, Coffee, Briefcase, HelpCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from 'firebase/auth';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, getDocs,
  onSnapshot, serverTimestamp, query, increment, orderBy, writeBatch, arrayUnion
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- 1. CONFIG & CONSTANTS ---
const firebaseConfig = {
  apiKey: "AIzaSyCgOZoeEiiLQAobec0nckBhkXQF5Yxe68k",
  authDomain: "amen-journal.firebaseapp.com",
  projectId: "amen-journal",
  storageBucket: "amen-journal.firebasestorage.app",
  messagingSenderId: "979782042974",
  appId: "1:979782042974:web:b35d08837ee633000ebbcf"
};

let app;
try { app = initializeApp(firebaseConfig); } catch (e) { console.error("Firebase init error", e); }
const auth = getAuth(); const db = getFirestore(); const appId = firebaseConfig.projectId;
const ADMIN_EMAIL = "kiraishikagi@amen.local";

// --- SAMPLE TRACKS (минимальный набор чтобы всё работало) ---
const TRACKS = [
  { title: 'Тихая ночь', file: '/audio/track1.mp3' },
  { title: 'Утреннее сердце', file: '/audio/track2.mp3' }
];

// --- EXTENDED BIBLE ENGINE (Data for Scripture Finder) ---
const BIBLE_INDEX = {
   'anxiety': [
       { t: "Филиппийцам 4:6-7", v: "Не заботьтесь ни о чем, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом." },
       { t: "1 Петра 5:7", v: "Все заботы ваши возложите на Него, ибо Он печется о вас." },
       { t: "Псалом 93:19", v: "При умножении скорбей моих в сердце моем, утешения Твои услаждают душу мою." }
   ],
   'fear': [
       { t: "Исаия 41:10", v: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой; Я укреплю тебя." },
       { t: "2 Тимофею 1:7", v: "Ибо дал нам Бог духа не боязни, но силы и любви и целомудрия." },
       { t: "Псалом 26:1", v: "Господь — свет мой и спасение мое: кого мне бояться?" }
   ],
   'weary': [
       { t: "Матфея 11:28", v: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас." },
       { t: "Исаия 40:29", v: "Он дает утомленному силу, и изнемогшему дарует крепость." },
       { t: "Псалом 22:3", v: "Он подкрепляет душу мою, направляет меня на стези правды." }
   ],
   'guilt': [
       { t: "1 Иоанна 1:9", v: "Если исповедуем грехи наши, то Он, будучи верен и праведен, простит нам грехи наши." },
       { t: "Римлянам 8:1", v: "Итак нет ныне никакого осуждения тем, которые во Христе Иисусе." },
       { t: "Псалом 102:12", v: "Как далеко восток от запада, так удалил Он от нас беззакония наши." }
   ],
   'joy': [
       { t: "Филиппийцам 4:4", v: "Радуйтесь всегда в Господе; и еще говорю: радуйтесь." },
       { t: "Псалом 15:11", v: "Полнота радости пред лицем Твоим, блаженство в деснице Твоей вовек." }
   ]
};

const EMOTION_LABELS = {
   'anxiety': { l: 'Тревога', i: <Wind size={14}/> },
   'fear': { l: 'Страх', i: <Anchor size={14}/> },
   'weary': { l: 'Усталость', i: <Coffee size={14}/> },
   'guilt': { l: 'Вина', i: <CloudRain size={14}/> },
   'joy': { l: 'Радость', i: <Sun size={14}/> }
};

// ... INITIAL_DATA, MEDALS, THEMES (относительно неизменены, вставлены как в оригинале) ...

const INITIAL_DATA = [
  { day: 1, reference: "Филиппийцам 4:6-7", text: "Не заботьтесь ни о чем, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом.", explanation: "Тревога — это сигнал к молитве. Вместо сценариев катастроф, превратите каждую заботу в просьбу.", action: "Выпишите одну вещь, которая тревожит вас сегодня, и помолитесь о ней прямо сейчас." },
  // ... остальные элементы как в оригинале (сокращено в примере) ...
  { day: 30, reference: "Откровение 21:4", text: "И отрет Бог всякую слезу... и смерти не будет уже.", explanation: "Лучшее еще впереди. Вечность с Богом — это надежда, дающая силы.", action: "Взгляните на свои проблемы с точки зрения вечности." }
];

const MEDALS = {
  3: { id: 'spark', name: 'Искра', desc: '3 дня постоянства', icon: <Sparkles size={32} /> },
  7: { id: 'flame', name: 'Пламя', desc: 'Неделя верности', icon: <Flame size={32} /> },
  30: { id: 'torch', name: 'Факел', desc: 'Месяц огня', icon: <Crown size={32} /> }
};

const THEMES = {
  dawn: { id: 'dawn', name: 'Рассвет', bg: 'url("/backgrounds/dawn.jpg")', fallback: '#fff7ed', primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.5)' },
  ocean: { id: 'ocean', name: 'Глубина', bg: 'url("/backgrounds/ocean.jpg")', fallback: '#f0f9ff', primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.5)' },
  forest: { id: 'forest', name: 'Эдем', bg: 'url("/backgrounds/forest.jpg")', fallback: '#064e3b', primary: '#4ade80', text: '#f0fdf4', card: 'rgba(6, 78, 59, 0.6)' },
  dusk: { id: 'dusk', name: 'Закат', bg: 'url("/backgrounds/dusk.jpg")', fallback: '#fff7ed', primary: '#c2410c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.5)' },
  night: { id: 'night', name: 'Звезды', bg: 'url("/backgrounds/night.jpg")', fallback: '#1e1b4b', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.5)' },
  noir: { id: 'noir', name: 'Крест', bg: 'url("/backgrounds/noir.jpg")', fallback: '#171717', primary: '#fafafa', text: '#e5e5e5', card: 'rgba(20, 20, 20, 0.7)' },
  cosmos: { id: 'cosmos', name: 'Космос', bg: '', fallback: '#000000', primary: '#e2e8f0', text: '#f8fafc', card: 'rgba(0, 0, 0, 0.6)' },
  aether: { id: 'aether', name: 'Эфир', bg: '', fallback: '#ffffff', primary: '#f97316', text: '#431407', card: 'rgba(255, 255, 255, 0.7)' }
};

// --- 2. HELPERS & UTILS ---
const pad = (n) => String(n).padStart(2, '0');
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    if (typeof timestamp === 'number') return new Date(timestamp).toLocaleDateString();
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  } catch (e) { return ''; }
};

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getDaysInMonth = () => {
  const date = new Date();
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => i + 1);
};

// --- THREE loader cache (prevents дублей скрипта) ---
const loadThree = () => {
  if (window._threeLoadingPromise) return window._threeLoadingPromise;
  window._threeLoadingPromise = new Promise((resolve, reject) => {
    if (window.THREE) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
  return window._threeLoadingPromise;
};

// --- 1. COSMIC PARTICLES (True 3D Particles for Cosmos - STABILIZED)
const CosmicParticles = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let frameId;
    let renderer, scene, camera, particles;
    let mouseX = 0, mouseY = 0;
    let onDocumentMouseMove, onTouchMove, handleResize, animate;

    const getDiscTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      const texture = new window.THREE.CanvasTexture(canvas);
      return texture;
    };

    const init = () => {
      if (!window.THREE) { console.warn("THREE.js not available for CosmicParticles"); return; }
      const THREE = window.THREE;
      const container = mountRef.current;
      if (!container) return;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0f172a, 0.001);

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.z = 1000;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x0f172a);
      container.appendChild(renderer.domElement);

      const geometry = new THREE.BufferGeometry();
      const count = 8000;
      const positions = [];
      const colors = [];
      const color1 = new THREE.Color(0x818cf8);
      const color2 = new THREE.Color(0xc084fc);
      const color3 = new THREE.Color(0xffffff);

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        positions.push(x, y, z);
        const rand = Math.random();
        const c = rand < 0.6 ? color3 : (rand < 0.8 ? color1 : color2);
        colors.push(c.r, c.g, c.b);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        map: getDiscTexture(),
        alphaTest: 0.5,
        transparent: true,
        opacity: 0.9
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      onDocumentMouseMove = (event) => {
        mouseX = (event.clientX - window.innerWidth / 2) * 0.2;
        mouseY = (event.clientY - window.innerHeight / 2) * 0.2;
      };
      document.addEventListener('mousemove', onDocumentMouseMove);

      onTouchMove = (event) => {
        if (event.touches.length > 0) {
          mouseX = (event.touches[0].clientX - window.innerWidth / 2) * 0.2;
          mouseY = (event.touches[0].clientY - window.innerHeight / 2) * 0.2;
        }
      };
      document.addEventListener('touchmove', onTouchMove);

      handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      animate = () => {
        frameId = requestAnimationFrame(animate);
        if (particles) {
          particles.rotation.x += 0.0003;
          particles.rotation.y += 0.0003;
        }
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      };
      animate();
    };

    loadThree().then(init).catch(console.error);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', handleResize);
      try {
        if (particles?.geometry) particles.geometry.dispose();
        if (particles?.material) {
          if (particles.material.map) particles.material.map.dispose();
          particles.material.dispose();
        }
        if (renderer) {
          renderer.forceContextLoss && renderer.forceContextLoss();
          renderer.domElement && renderer.domElement.remove();
          renderer.dispose && renderer.dispose();
        }
        // clear refs
        scene = null;
        camera = null;
        particles = null;
        renderer = null;
      } catch (e) { console.warn('Three cleanup error', e); }
    };
  }, []);

  return <div ref={mountRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100vw', height: '100vh'}} />;
};

// 2. DIGITAL AETHER (Fire on White)
const DigitalAether = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let frameId;
    let renderer, scene, camera, mesh, material;
    let handleResize, handleMouseMove, handleTouchMove;

    const init = () => {
      if (!window.THREE) { console.warn("THREE.js not available for DigitalAether"); return; }
      const THREE = window.THREE;
      const container = mountRef.current;
      if (!container) return;

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      const fragmentShader = `...`; // оригинальный фрагментный шейдер (вставлен ниже)
      const vertexShader = `
        void main() {
          gl_Position = vec4( position, 1.0 );
        }
      `;

      // вставляем длинный шейдер (как в оригинале)
      const fullFragment = `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }
        float fbm(vec2 p) {
            float f = 0.0;
            float w = 0.5;
            float time = uTime * 0.1;
            for (int i = 0; i < 5; i++) {
                f += w * snoise(p);
                p *= 2.0;
                p -= vec2(time * 0.2, -time * 0.1);
                w *= 0.5;
            }
            return f;
        }
        float pattern(vec2 p, out vec2 q, out vec2 r) {
            q.x = fbm(p + vec2(0.0, 0.0));
            q.y = fbm(p + vec2(5.2, 1.3));
            r.x = fbm(p + 4.0 * q + vec2(uMouse.x, uMouse.y));
            r.y = fbm(p + 4.0 * q + vec2(8.3, 2.8));
            return fbm(p + 4.0 * r);
        }
        void main() {
            vec2 st = gl_FragCoord.xy / uResolution.xy;
            st.x *= uResolution.x / uResolution.y;
            st *= 3.0;
            st -= vec2(1.0, 1.0);
            vec2 q = vec2(0.);
            vec2 r = vec2(0.);
            float f = pattern(st, q, r);
            vec3 c1 = vec3(0.98, 0.98, 0.96);
            vec3 c2 = vec3(1.0, 0.8, 0.6);
            vec3 c3 = vec3(1.0, 0.5, 0.2);
            vec3 c4 = vec3(1.0, 0.8, 0.0);
            vec3 color = vec3(0.0);
            color = mix(c1, c2, f);
            color = mix(color, c3, length(q));
            color = mix(color, c4, r.x * r.y);
            float vignette = 1.0 - smoothstep(0.5, 2.5, length(gl_FragCoord.xy / uResolution.xy - 0.5));
            color *= (0.9 + 0.1 * vignette);
            gl_FragColor = vec4(color, 1.0);
        }
      `;

      const geometry = new THREE.PlaneGeometry(2, 2);
      material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) }
        },
        vertexShader: vertexShader,
        fragmentShader: fullFragment
      });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const animate = (time) => {
        frameId = requestAnimationFrame(animate);
        if (material) material.uniforms.uTime.value = time * 0.001;
        renderer.render(scene, camera);
      };
      requestAnimationFrame(animate);

      handleResize = () => {
        // Orthographic camera doesn't need aspect, but shader resolution should update
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (material) material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      handleMouseMove = (e) => {
        if (material) {
          material.uniforms.uMouse.value.x = e.clientX / window.innerWidth;
          material.uniforms.uMouse.value.y = 1.0 - (e.clientY / window.innerHeight);
        }
      };
      window.addEventListener('mousemove', handleMouseMove);

      handleTouchMove = (e) => {
        if (e.touches.length > 0 && material) {
          material.uniforms.uMouse.value.x = e.touches[0].clientX / window.innerWidth;
          material.uniforms.uMouse.value.y = 1.0 - (e.touches[0].clientY / window.innerHeight);
        }
      };
      window.addEventListener('touchmove', handleTouchMove);
    };

    loadThree().then(init).catch(console.error);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      try {
        if (material) {
          if (material.uniforms?.uResolution?.value) { /* noop */ }
          material.dispose && material.dispose();
        }
        if (mesh?.geometry) mesh.geometry.dispose();
        if (renderer) {
          renderer.forceContextLoss && renderer.forceContextLoss();
          renderer.domElement && renderer.domElement.remove();
          renderer.dispose && renderer.dispose();
        }
        scene = null;
        camera = null;
        mesh = null;
        material = null;
        renderer = null;
      } catch (e) { console.warn('DigitalAether cleanup error', e); }
    };
  }, []);

  return <div ref={mountRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100vw', height: '100vh'}} />;
};

// --- 3. REUSABLE UI COMPONENTS ---
const Card = ({ children, style, theme: themeObj, onClick, animate = false }) => {
  const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(themeObj.id);
  const aetherStyle = themeObj.id === 'aether' ? {
    border: '1px solid rgba(249, 115, 22, 0.2)',
    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.1)',
    background: 'rgba(255,255,255,0.85)'
  } : {};

  if (animate) {
    return (
      <motion.div
        layout
        onClick={onClick}
        style={{
          background: themeObj.card,
          borderRadius: 24,
          padding: 20,
          marginBottom: 12,
          backdropFilter: 'blur(5px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          ...aetherStyle,
          ...style
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: themeObj.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        backdropFilter: 'blur(5px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
        ...aetherStyle,
        ...style
      }}
    >
      {children}
    </div>
  );
};

const Button = ({ children, onClick, theme: themeObj, variant = 'primary', style, icon }) => {
  const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(themeObj.id);
  const baseStyle = {
    border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    cursor: 'pointer', transition: 'all 0.2s', padding: '12px 16px'
  };

  let variantStyle = {};
  if (variant === 'primary') {
    variantStyle = {
      background: themeObj.primary,
      color: themeObj.id === 'noir' ? 'black' : 'white',
      width: '100%',
    };
  } else if (variant === 'ghost') {
    variantStyle = {
      background: 'none', padding: 4, opacity: 0.7, color: themeObj.text
    };
  } else if (variant === 'soft') {
    variantStyle = {
      background: themeObj.id === 'aether' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255,255,255,0.4)',
      color: themeObj.id === 'noir' ? 'black' : themeObj.primary,
      width: '100%'
    };
  } else if (variant === 'amen') {
    variantStyle = {
      padding: '8px 16px', borderRadius: 20, fontSize: 13,
      background: 'rgba(0,0,0,0.05)', color: themeObj.text
    }
  }

  return (
    <motion.button whileTap={{scale: 0.96}} onClick={onClick} style={{...baseStyle, ...variantStyle, ...style}}>
      {icon} {children}
    </motion.button>
  );
};

// --- 4. MAIN APP COMPONENT ---
const AmenApp = () => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState("");
  const [prayers, setPrayers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [publicRequests, setPublicRequests] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputText, setInputText] = useState("");

  // --- ONBOARDING STATE ---
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);

  // --- LOGIC STATE ---
  const [devotionals, setDevotionals] = useState(INITIAL_DATA);
  const [focusItem, setFocusItem] = useState(null);
  const [userStats, setUserStats] = useState({ streak: 0, lastPrayedDate: null, history: {}, wordReadDate: null });
  const [dailyFocusDone, setDailyFocusDone] = useState(false);
  const [dailyReflectionDone, setDailyReflectionDone] = useState(false);
  const [dailyWordRead, setDailyWordRead] = useState(false);
  const [newMedal, setNewMedal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef(null);

  // Scripture Search is now a modal
  const [scriptureMode, setScriptureMode] = useState(false);

  const themeObj = THEMES[theme] || THEMES.dawn;
  const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(theme);
  const isAdmin = user?.email === ADMIN_EMAIL;

  // --- SYSTEM & EFFECTS ---
  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png'; link.rel = 'shortcut icon'; link.href = '/icon-192.png';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  useEffect(() => {
    const fetchDevotionals = async () => {
      try {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_word'), orderBy('day'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs.map(doc => doc.data());
          if (data.length > 0) setDevotionals(data);
        }
      } catch (e) { console.error(e); }
    };
    fetchDevotionals();
  }, []);

  useEffect(() => {
    if (!user) return;
    let unsubReqs = () => {}, unsubFeedback = () => {};
    if (activeTab === 'community') {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), orderBy('createdAt', 'desc'));
      unsubReqs = onSnapshot(q, (snapshot) => {
        setPublicRequests(snapshot.docs.map(d => {
          const data = d.data();
          const createdAtMs = data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : (data.createdAt instanceof Date ? data.createdAt.getTime() : (new Date().getTime()));
          return ({ id: d.id, ...data, createdAtMs, createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date(createdAtMs)) });
        }));
      });
    }
    if (activeTab === 'admin_feedback' && isAdmin) {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback'), orderBy('createdAt', 'desc'));
      unsubFeedback = onSnapshot(q, (snapshot) => {
        setFeedbacks(snapshot.docs.map(d => {
          const data = d.data();
          const createdAtMs = data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : (data.createdAt instanceof Date ? data.createdAt.getTime() : (new Date().getTime()));
          return ({ id: d.id, ...data, createdAtMs, createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date(createdAtMs)) });
        }));
      });
    }
    return () => { try { unsubReqs(); unsubFeedback(); } catch (e) {} };
  }, [user, activeTab, isAdmin]);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    const handleEnded = () => setCurrentTrackIndex(prev => (prev + 1) % TRACKS.length);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const track = TRACKS[currentTrackIndex];
    if (track && track.file && audio) {
      const newSrc = new URL(track.file, window.location.href).href;
      if (audio.src !== newSrc) { audio.src = track.file; audio.load(); if (isPlaying) audio.play().catch(e => console.log(e)); }
      else { if (isPlaying && audio.paused) audio.play().catch(e => console.log(e)); if (!isPlaying && !audio.paused) audio.pause(); }
    }
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        localStorage.setItem('amen_visited', 'true');
        if (selectedMood) {
          const saveInitialPrayer = async () => {
            await addDoc(collection(db, 'artifacts', appId, 'users', u.uid, 'prayers'), {
              text: `Боже, я чувствую: ${selectedMood.label}. Спасибо за слово: "${selectedMood.verse}"`,
              status: 'active',
              createdAt: serverTimestamp(),
              comments: []
            });
          };
          saveInitialPrayer();
          setSelectedMood(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [selectedMood]);

  // --- normalize function for firestore timestamps
  const toMs = (t) => {
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (t.toMillis) return t.toMillis();
    if (t.toDate) return t.toDate().getTime();
    if (t instanceof Date) return t.getTime();
    try { return new Date(t).getTime(); } catch (e) { return 0; }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), orderBy('createdAt', 'desc')), s => {
      setPrayers(s.docs.map(d => {
        const data = d.data();
        const createdAtMs = toMs(data.createdAt) || Date.now();
        const answeredAtMs = toMs(data.answeredAt) || null;
        return { id: d.id, ...data, createdAtMs, answeredAtMs, createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date(createdAtMs)) };
      }));
      setLoading(false);
    });
    const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics')), s => {
      setTopics(s.docs.map(d => {
        const data = d.data();
        const createdAtMs = toMs(data.createdAt) || Date.now();
        const lastPrayedAtMs = toMs(data.lastPrayedAt) || null;
        return { id: d.id, ...data, createdAtMs, lastPrayedAtMs, lastPrayedAt: data.lastPrayedAt?.toDate ? data.lastPrayedAt.toDate() : (data.lastPrayedAt instanceof Date ? data.lastPrayedAt : (lastPrayedAtMs ? new Date(lastPrayedAtMs) : null)), createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(createdAtMs) };
      }));
    });
    const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), (d) => {
      if (d.exists()) {
        const data = d.data();
        setUserStats({ ...data, history: data.history || {} });
        setDailyFocusDone(data.lastPrayedDate === getTodayString());
        setDailyWordRead(data.wordReadDate === getTodayString());
      } else {
        setDailyFocusDone(false);
        setDailyWordRead(false);
      }
    });
    const unsubRefl = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), (d) => {
      if (d.exists() && d.data()[getTodayString()]) setDailyReflectionDone(true); else setDailyReflectionDone(false);
    });
    return () => { try { unsubP(); unsubT(); unsubStats(); unsubRefl(); } catch (e) {} };
  }, [user]);

  useEffect(() => {
    if (!dailyFocusDone && !focusItem && (prayers.length > 0 || topics.length > 0)) selectRandomFocus();
  }, [prayers, topics, dailyFocusDone, focusItem]);

  // move reading day word to effect (убрал сайд-эффект из рендера)
  useEffect(() => {
    if (user && !dailyWordRead) {
      handleReadWord().catch(e => console.log(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dailyWordRead]);

  // --- SMART COLLAPSE EFFECT (Logic kept for future feature expansion) ---
  const dailyProgress = (dailyWordRead ? 1 : 0) + (dailyFocusDone ? 1 : 0) + (dailyReflectionDone ? 1 : 0);
  useEffect(() => {
    if (dailyProgress === 3) {
      // optionally collapse journey etc.
    }
  }, [dailyProgress]);

  // --- HANDLERS ---
  const handleAuth = async () => {
    if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+) обязательны"); return; }
    setAuthLoading(true); setAuthError("");
    const email = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (err) {
      try { const u = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(u.user, { displayName: nickname }); } catch (e) { setAuthError("Ошибка входа"); }
    }
    setAuthLoading(false);
  };

  const logout = () => { signOut(auth); setNickname(""); setPassword(""); setIsPlaying(false); setOnboardingStep(0); };

  const uploadDevotionalsToDB = async () => {
    if (!window.confirm("Загрузить базу слов?")) return;
    try { const batch = writeBatch(db); INITIAL_DATA.forEach((item) => { batch.set(doc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_word'), `day_${item.day}`), item); }); await batch.commit(); alert("Успешно!"); } catch (e) { alert("Ошибка: " + e.message); }
  };

  const selectRandomFocus = () => {
    const allActive = [...prayers, ...topics].filter(i => i.status === 'active');
    if (allActive.length > 0) {
      const candidates = allActive.filter(i => !focusItem || i.id !== focusItem.id);
      setFocusItem(candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : allActive[Math.floor(Math.random() * allActive.length)]);
    } else setFocusItem(null);
  };

  const updateStreak = async () => {
    const todayStr = getTodayString();
    let newStreak = userStats.streak || 0;
    if (userStats.lastPrayedDate !== todayStr) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
      if (userStats.lastPrayedDate === yStr) newStreak += 1; else newStreak = 1;
    }
    const newHistory = { ...userStats.history, [todayStr]: true };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { streak: newStreak, lastPrayedDate: todayStr, history: newHistory }, { merge: true });
    if (MEDALS[newStreak] && userStats.streak !== newStreak) { setNewMedal(MEDALS[newStreak]); setModalMode('medal'); }
  };

  const handleFocusPray = async () => {
    if (!focusItem) return;
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: [themeObj.primary, '#fbbf24', '#ffffff'] });
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    const coll = focusItem.title ? 'prayer_topics' : 'prayers';
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, focusItem.id), { count: increment(1), lastPrayedAt: serverTimestamp() });
    await updateStreak();
  };

  const handleReadWord = async () => {
    if (dailyWordRead || !user) return;
    const todayStr = getTodayString();
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { wordReadDate: todayStr }, { merge: true });
    setDailyWordRead(true);
  };

  const handleReflection = async () => {
    if (!inputText.trim()) return;
    const text = inputText; closeModal();
    confetti({ shapes: ['star'], colors: ['#FFD700', '#FFA500'] });
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), { text: "Вечерняя благодарность", status: 'answered', answerNote: text, createdAt: serverTimestamp(), answeredAt: serverTimestamp() });
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), { [getTodayString()]: true }, { merge: true });
    await updateStreak();
  };

  const handleUpdateName = async () => {
    if (!editNameValue.trim()) return;
    try { await updateProfile(user, { displayName: editNameValue }); setUser({ ...user, displayName: editNameValue }); setIsEditingName(false); } catch (e) { alert("Ошибка обновления имени"); }
  };

  const createPublicRequest = async () => {
    if (!inputText.trim()) return;
    const text = inputText; closeModal();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), { text, authorId: user.uid, authorName: user.displayName || "Аноним", amenCount: 0, amens: [], createdAt: serverTimestamp() });
  };

  const createFeedback = async () => {
    if (!inputText.trim()) return;
    const text = inputText; closeModal();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback'), { text, authorId: user.uid, authorName: user.displayName || "Аноним", createdAt: serverTimestamp() });
    alert("Спасибо! Ваше сообщение отправлено.");
  };

  const handleAmen = async (req) => {
    if (!user || req.amens?.includes(user.uid)) return;
    if (navigator.vibrate) navigator.vibrate(30);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), { amenCount: increment(1), amens: arrayUnion(user.uid) });
  };

  const deletePublicRequest = async (id) => { if (window.confirm("Удалить просьбу?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id)); };
  const deleteFeedback = async (id) => { if (window.confirm("Удалить отзыв?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_feedback', id)); };

  const createItem = async () => {
    if (!inputText.trim()) return;
    const text = inputText; closeModal();
    const coll = modalMode === 'topic' ? 'prayer_topics' : 'prayers';
    const data = modalMode === 'topic' ? { title: text, status: 'active', count: 0, lastPrayedAt: null, createdAt: serverTimestamp() } : { text, status: 'active', createdAt: serverTimestamp(), comments: [] };
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, coll), data);
    setActiveTab(modalMode === 'topic' ? 'list' : 'home');
    await updateStreak();
  };

  const saveAnswer = async () => {
    if (!selectedItem) return;
    const coll = selectedItem.title ? 'prayer_topics' : 'prayers'; closeModal();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [themeObj.primary, '#fbbf24', '#ffffff'] });
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id), { status: 'answered', answeredAt: serverTimestamp(), answerNote: inputText });
  };

  const prayForTopic = async (id) => {
    if (navigator.vibrate) navigator.vibrate(50);
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics', id), { count: increment(1), lastPrayedAt: serverTimestamp() });
    await updateStreak();
  };

  const deleteItem = async () => {
    if (!selectedItem) return;
    if (window.confirm("Удалить?")) {
      const coll = (selectedItem.title) ? 'prayer_topics' : 'prayers';
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id));
      closeModal();
    }
  };

  const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); setNewMedal(null); };
  const nextTrack = () => setCurrentTrackIndex(p => (p + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length);
  const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

  // --- LOGIC: SCRIPTURE SELECT ---
  const insertScripture = (text, ref) => {
    setModalMode('entry'); // Return to main entry modal
    setInputText(prev => `${prev}"${text}" — ${ref}\n\nГосподи, ...`);
  };

  // --- DERIVED STATE ---
  const getDailyDevotional = () => {
    const today = new Date().getDate();
    if (!devotionals || devotionals.length === 0) return INITIAL_DATA[(today - 1) % INITIAL_DATA.length];
    return devotionals[(today - 1) % devotionals.length];
  };
  const todaysDevotional = getDailyDevotional();
  const isEvening = new Date().getHours() >= 18;

  const timeOf = t => toMs(t);

  const list = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const safeSort = (a, b) => (b.answeredAtMs || b.createdAtMs || 0) - (a.answeredAtMs || a.createdAtMs || 0);
    if (activeTab === 'word') return [];
    if (activeTab === 'community') return publicRequests;
    if (activeTab === 'admin_feedback') return feedbacks;
    if (activeTab === 'vault') {
      const p = prayers.filter(i => i.status === 'answered');
      const t = topics.filter(i => i.status === 'answered');
      return [...p, ...t].filter(i => (i.text || i.title || "").toLowerCase().includes(q)).sort(safeSort);
    }
    const src = activeTab === 'list' ? topics : prayers;
    return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q)).sort((a,b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  }, [prayers, topics, activeTab, searchQuery, publicRequests, feedbacks]);

  // --- VIEW RENDERERS ---
  const renderScriptureFinder = () => (
    <div onClick={closeModal} style={{position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
      <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 450, background: isDark ? '#1e293b' : '#ffffff', borderRadius: 28, padding: 24}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
          <span style={{fontSize: 16, fontWeight: 'bold', color: themeObj.primary}}><BookOpen size={18} style={{marginRight: 8, display: 'inline'}}/>Найти Слово</span>
          <button onClick={closeModal} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: 8, borderRadius: '50%'}}><X size={20} color={themeObj.text} /></button>
        </div>

        <h4 style={{fontSize: 14, fontWeight: 'bold', opacity: 0.7, textTransform: 'uppercase', marginBottom: 10}}>Что ты сейчас чувствуешь?</h4>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 300, overflowY: 'auto', marginBottom: 10}}>
          <button onClick={() => {
            const allVerses = Object.values(BIBLE_INDEX).flat();
            const randomVerse = allVerses[Math.floor(Math.random() * allVerses.length)];
            insertScripture(randomVerse.v, randomVerse.t);
          }} style={{padding: '8px 12px', borderRadius: 16, background: themeObj.primary, border: 'none', color: theme === 'noir' ? 'black' : 'white', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>
            🎲 Случайное Слово
          </button>

          {Object.keys(BIBLE_INDEX).map(tag => (
            <button key={tag} onClick={() => {
              const verses = BIBLE_INDEX[tag];
              const randomVerse = verses[Math.floor(Math.random() * verses.length)];
              insertScripture(randomVerse.v, randomVerse.t);
            }} style={{display:'flex', alignItems:'center', gap:4, padding: '8px 12px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', color: themeObj.text, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>
              {EMOTION_LABELS[tag]?.l}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderOnboarding = () => {
    // ONBOARDING_OPTIONS не был явно определён ранее; сделаем простой набор
    const ONBOARDING_OPTIONS = [
      { id: 'anxiety', label: 'Тревога', icon: <Wind size={24} />, verse: 'Филиппийцам 4:6-7', ref: 'Филиппийцам 4:6-7' },
      { id: 'joy', label: 'Радость', icon: <Sun size={24} />, verse: 'Филиппийцам 4:4', ref: 'Филиппийцам 4:4' }
    ];

    if (onboardingStep === 0) {
      return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{padding: 30, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center'}}>
          <h1 style={{fontSize: 42, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: themeObj.primary, marginBottom: 10, lineHeight: 1}}>Amen.</h1>
          <h2 style={{fontSize: 28, marginBottom: 30, fontWeight: 500}}>Что у тебя на сердце сегодня?</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
            {ONBOARDING_OPTIONS.map(opt => (
              <motion.button key={opt.id} whileTap={{scale:0.98}} onClick={() => { setSelectedMood(opt); setOnboardingStep(1); }} style={{display: 'flex', alignItems: 'center', gap: 15, padding: 20, background: themeObj.card, border: 'none', borderRadius: 20, textAlign: 'left', cursor: 'pointer', fontSize: 18, fontWeight: 500, color: themeObj.text, boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
                <div style={{color: themeObj.primary}}>{opt.icon}</div>
                {opt.label}
              </motion.button>
            ))}
          </div>
          <div style={{marginTop: 30, textAlign: 'center', opacity: 0.6, fontSize: 13}}>
            <span onClick={() => setOnboardingStep(2)} style={{textDecoration: 'underline', cursor: 'pointer'}}>У меня уже есть аккаунт</span>
          </div>
        </motion.div>
      );
    } else if (onboardingStep === 1 && selectedMood) {
      return (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} style={{padding: 30, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', textAlign: 'center'}}>
          <div style={{marginBottom: 30}}>
            <div style={{display: 'inline-flex', padding: 20, borderRadius: '50%', background: `${themeObj.primary}20`, color: themeObj.primary, marginBottom: 20}}>
              {React.cloneElement(selectedMood.icon, {size: 48})}
            </div>
            <h2 style={{fontSize: 32, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.3, marginBottom: 10}}>"{selectedMood.verse}"</h2>
            <p style={{fontSize: 14, fontWeight: 'bold', opacity: 0.6, textTransform: 'uppercase'}}>{selectedMood.ref}</p>
          </div>
          <p style={{marginBottom: 40, fontSize: 16, opacity: 0.8, lineHeight: 1.5}}>Бог слышит тебя. Ты не один в этом чувстве.</p>
          <Button onClick={() => setOnboardingStep(2)} theme={themeObj} style={{padding: 20, fontSize: 16}}>Сохранить это в дневник <ArrowRight size={20}/></Button>
        </motion.div>
      );
    } else {
      return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 20}}>
          <div style={{background: themeObj.card, padding: 30, borderRadius: 30, backdropFilter: 'blur(10px)', width: '100%', maxWidth: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}}>
            <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic', color: themeObj.primary, textAlign:'center', lineHeight: 1}}>Amen.</h1>
            <p style={{fontFamily:'sans-serif', fontSize:14, opacity:0.8, marginBottom:30, textAlign:'center', lineHeight:1.5, marginTop: 10}}>
              {selectedMood ? "Создай аккаунт, чтобы сохранить этот момент тишины." : "Ваше личное пространство тишины."}
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.5)', fontSize:16}}/>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.5)', fontSize:16}}/>
              {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, color: '#e11d48'}}>{authError}</p>}
              <Button onClick={handleAuth} theme={themeObj}>{authLoading ? <Loader className="animate-spin"/> : (selectedMood ? "Сохранить и Войти" : "Войти / Создать")}</Button>
              {selectedMood ? <button onClick={() => setOnboardingStep(0)} style={{background:'none', border:'none', fontSize:12, opacity:0.5, marginTop:10, cursor:'pointer'}}>Назад к выбору</button> : null}
            </div>
          </div>
        </motion.div>
      );
    }
  };

  const renderWord = () => {
    return (
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
        <Card theme={themeObj}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
            <h2 style={{fontSize: 24, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', margin: 0}}>Слово на сегодня</h2>
            <span style={{fontSize: 12, fontWeight: 'bold', padding: '4px 10px', background: themeObj.primary, color: theme === 'noir' ? 'black' : 'white', borderRadius: 20}}>
              {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div style={{marginBottom: 24}}>
            <p style={{fontSize: 20, lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'Cormorant Garamond', marginBottom: 10}}>«{todaysDevotional.text}»</p>
            <p style={{textAlign: 'right', fontSize: 13, fontWeight: 'bold', opacity: 0.8}}>— {todaysDevotional.reference}</p>
          </div>
          <div style={{background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16, marginBottom: 16}}>
            <h3 style={{fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8}}>Мысль</h3>
            <p style={{fontSize: 15, lineHeight: 1.5, opacity: 0.9}}>{todaysDevotional.explanation}</p>
          </div>
          <div style={{background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)', padding: 16, borderRadius: 16, borderLeft: `4px solid ${themeObj.primary}`}}>
            <h3 style={{fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: themeObj.primary, marginBottom: 8}}>Действие</h3>
            <p style={{fontSize: 15, lineHeight: 1.5, opacity: 0.9}}>{todaysDevotional.action}</p>
          </div>
        </Card>
      </motion.div>
    );
  };

  const renderCommunity = () => (
    <div>
      <div style={{textAlign:'center', marginBottom:20, opacity:0.8, fontSize:13, lineHeight: 1.6}}>
        <b>Тебе нужна молитва?</b><br/>
        Напиши её, и мы помолимся за тебя.
      </div>
      {publicRequests.length === 0 ? <div style={{textAlign: 'center', marginTop: 50, opacity: 0.5}}>Пока тишина...</div> :
        publicRequests.map(req => {
          const isAmened = req.amens?.includes(user.uid);
          return (
            <Card key={req.id} theme={themeObj} animate>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                <span style={{fontSize:11, fontWeight:'bold', opacity:0.7}}>{req.authorName} • {formatDate(req.createdAt)}</span>
                {(user.uid === req.authorId || isAdmin) && <Button variant="ghost" onClick={() => deletePublicRequest(req.id)} theme={themeObj} icon={<Trash2 size={14} />} />}
              </div>
              <p style={{fontSize:16, lineHeight:1.5, marginBottom:15}}>{req.text}</p>
              <Button onClick={() => handleAmen(req)} theme={themeObj} variant="amen" style={{background: isAmened ? themeObj.primary : 'rgba(0,0,0,0.05)', color: isAmened ? (theme==='noir'?'black':'white') : themeObj.text}}>
                <Users size={16} style={{marginRight:6}}/> Аминь {req.amenCount > 0 && <span>• {req.amenCount}</span>}
              </Button>
            </Card>
          )
        })
      }
    </div>
  );

  const renderAdminFeedback = () => (
    <div>
      <h3 style={{textAlign:'center', marginBottom:20}}>Отзывы</h3>
      {feedbacks.map(fb => (
        <div key={fb.id} style={{background: themeObj.card, padding: 15, borderRadius: 15, marginBottom: 10}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:11, opacity:0.7, marginBottom:5}}>
            <span>{fb.authorName} • {formatDate(fb.createdAt)}</span>
            <button onClick={() => deleteFeedback(fb.id)}><Trash2 size={14} /></button>
          </div>
          <p style={{fontSize:14}}>{fb.text}</p>
        </div>
      ))}
    </div>
  );

  const renderHome = () => {
    return (
      <div style={{marginBottom: 30}}>
        {/* MAIN LIST HEADER */}
        <div style={{marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px'}}>
          <span style={{fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5}}>Ваши записи</span>
          <button onClick={() => {setModalMode('entry'); setInputText("")}} style={{background:'none', border:'none', color: themeObj.primary, fontSize: 12, fontWeight: 'bold', cursor:'pointer'}}>+ Добавить</button>
        </div>

        {list.length === 0 ? <div style={{textAlign: 'center', marginTop: 30, opacity: 0.6}}><p style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:16}}>Пока пусто...</p></div> :
          list.map((item) => (
            <Card key={item.id} theme={themeObj}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                <span style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold'}}>{formatDate(item.createdAt)}</span>
                <div style={{display:'flex', gap: 5}}>
                  {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', color: theme === 'noir' ? 'black' : themeObj.primary, cursor: 'pointer'}}>Ответ</button>}
                  <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 0}}><Trash2 size={14} color={themeObj.text} style={{opacity: 0.5}}/></button>
                </div>
              </div>
              <p style={{margin: 0, fontSize: 16}}>{item.text || item.title}</p>
              {activeTab === 'list' && (
                <div style={{fontSize: 11, opacity: 0.6, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}>
                  <Wind size={12}/> {item.count} • {formatDate(item.createdAt)}
                </div>
              )}
              {activeTab === 'list' && <Button variant="soft" onClick={() => prayForTopic(item.id)} theme={themeObj} icon={<Wind size={16}/>} style={{marginTop: 8}}>Помолиться</Button>}
              {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${themeObj.primary}`, marginTop: 10, color: themeObj.text, opacity: 0.9}}>"{item.answerNote}"</div>}
            </Card>
          ))
        }
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <>
      {theme === 'cosmos' ? <CosmicParticles /> : theme === 'aether' ? <DigitalAether /> : (
        <div style={{position: 'fixed', inset:0, backgroundImage: themeObj.bg, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -1, transition: 'background 0.8s ease'}} />
      )}

      <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', color: themeObj.text }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar {display:none;}`}</style>

        {loading ? (
          /* GLOBAL LOADING STATE */
          <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
            <Loader className="animate-spin" size={32} color={themeObj.text} style={{opacity: 0.5}} />
            <h1 style={{fontSize:24, fontFamily:'Cormorant Garamond', fontStyle:'italic', marginTop: 20, opacity: 0.5}}>Amen.</h1>
          </div>
        ) : !user ? (
          renderOnboarding()
        ) : (
          <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.1)'}}>
            {/* HEADER */}
            <div style={{padding: '60px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 52, fontStyle: 'italic', margin: 0, lineHeight: 1, letterSpacing: '3px', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>Amen.</h1>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 8}}>
                  <p style={{fontSize: 12, opacity: 0.9, letterSpacing: 1, fontWeight:'bold', margin: 0}}>{getGreeting()}, {user.displayName}</p>
                  <div style={{display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, backdropFilter: 'blur(3px)'}}>
                    <Flame size={14} fill={dailyFocusDone ? '#fbbf24' : 'none'} color={dailyFocusDone ? '#fbbf24' : themeObj.text} style={{opacity: dailyFocusDone ? 1 : 0.5}} />
                    <span style={{fontSize: 11, fontWeight: 'bold', color: themeObj.text}}>{userStats.streak}</span>
                  </div>
                </div>
              </div>
              <div style={{display:'flex', gap:10}}>
                <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}>
                  {isPlaying ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}><Volume2 size={20} color={themeObj.text}/></motion.div> : <Music size={20} color={themeObj.text} style={{opacity:0.8}}/>}
                </motion.button>
                <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}><User size={20} color={themeObj.text}/></motion.button>
              </div>
            </div>

            {/* NAV TABS */}
            <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto'}}>
              {[{id:'home', l:'Дневник'}, {id:'word', l:'Слово'}, {id:'list', l:'Список'}, {id:'community', l:'Единство'}, {id:'vault', l:'Чудеса'}, ...(isAdmin ? [{id: 'admin_feedback', l: 'Отзывы'}] : [])].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, background: 'none', border: 'none', padding: '12px 10px', whiteSpace: 'nowrap',
                  color: themeObj.text, opacity: activeTab === tab.id ? 1 : 0.6,
                  fontWeight: activeTab === tab.id ? '800' : '500', fontSize: 14, position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                }}>
                  {tab.l}
                  {activeTab === tab.id && <motion.div layoutId="underline" style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: themeObj.primary, borderRadius:2}} />}
                </button>
              ))}
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{flex: 1, padding: `10px 20px ${isPlaying && modalMode !== 'music' ? '120px' : '100px'}`, overflowY: 'auto'}}>
              {activeTab === 'home' && renderHome()}
              {activeTab === 'word' && renderWord()}
              {activeTab === 'community' && renderCommunity()}
              {activeTab === 'admin_feedback' && isAdmin && renderAdminFeedback()}
              {(activeTab === 'list' || activeTab === 'vault') && (
                list.length === 0 ? <div style={{textAlign: 'center', marginTop: 80, opacity: 0.8, background: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 20, backdropFilter:'blur(5px)'}}><p style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:18}}>Тишина...</p></div> :
                list.map((item) => (
                  <Card key={item.id} theme={themeObj} animate>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                      <div style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                        {activeTab === 'list' ? <><Wind size={12}/> {item.count} • {formatDate(item.createdAt)}</> : formatDate(item.createdAt)}
                      </div>
                      <div style={{display:'flex', gap: 5}}>
                        {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', color: theme === 'noir' ? 'black' : themeObj.primary, cursor: 'pointer'}}>Ответ</button>}
                        <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 0}}><Trash2 size={14} color={themeObj.text} style={{opacity: 0.5}}/></button>
                      </div>
                    </div>
                    <p style={{margin: 0, fontSize: 16}}>{item.text || item.title}</p>
                    {activeTab === 'list' && <Button variant="soft" onClick={() => prayForTopic(item.id)} theme={themeObj} icon={<Wind size={16}/>}>Помолиться</Button>}
                    {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${themeObj.primary}`, marginTop: 10, color: themeObj.text, opacity: 0.9}}>"{item.answerNote}"</div>}
                  </Card>
                ))
              )}
            </div>

            {/* FAB */}
            {(activeTab === 'home' || activeTab === 'list' || activeTab === 'community') && (
              <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10}}>
                <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : activeTab === 'community' ? 'public_request' : activeTab === 'admin_feedback' ? 'feedback' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: themeObj.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${themeObj.primary}80`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Plus size={36}/></motion.button>
              </div>
            )}

            {/* MINI PLAYER */}
            <AnimatePresence>
              {isPlaying && modalMode !== 'music' && (
                <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 50, opacity: 0}} style={{position: 'fixed', bottom: 110, right: 20, zIndex: 9, background: themeObj.card, backdropFilter: 'blur(10px)', padding: '10px 15px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`, boxShadow: '0 5px 20px rgba(0,0,0,0.1)'}}>
                  <div onClick={() => setModalMode('music')} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
                    <div style={{width: 8, height: 8, borderRadius: '50%', background: themeObj.primary, animation: 'pulse 2s infinite'}} />
                    <span style={{fontSize: 12, fontWeight: 'bold', maxWidth: 100, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{TRACKS[currentTrackIndex].title}</span>
                  </div>
                  <button onClick={() => setIsPlaying(false)} style={{background: 'none', border: 'none', padding: 4, cursor: 'pointer'}}><Pause size={16} fill={themeObj.text} color={themeObj.text}/></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- MODALS (CLEANED UP) --- */}
      {modalMode === 'medal' && newMedal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
          <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} style={{background: 'white', padding: 40, borderRadius: 40, textAlign: 'center', maxWidth: 350}}>
            <div style={{marginBottom: 20, transform: 'scale(1.5)'}}>{newMedal.icon}</div>
            <h2>{newMedal.name}</h2><p>{newMedal.desc}</p>
            <button onClick={() => setModalMode(null)} style={{marginTop: 30, background: '#f59e0b', color: 'white', border: 'none', padding: '12px 30px', borderRadius: 20}}>Принять</button>
          </motion.div>
        </div>
      )}

      {(modalMode === 'entry' || modalMode === 'topic' || modalMode === 'reflection' || modalMode === 'public_request' || modalMode === 'feedback') && (
      <div onClick={closeModal} style={{position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
        <motion.div initial={{scale: 0.95, opacity: 0, y: 10}} animate={{scale: 1, opacity: 1, y: 0}} onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 450, background: isDark ? '#1e293b' : '#ffffff', borderRadius: 28, padding: 24}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: themeObj.primary}}>
              {modalMode === 'reflection' ? "Итоги дня" : modalMode === 'topic' ? "Новая тема" : modalMode === 'public_request' ? "Общая молитва" : modalMode === 'feedback' ? "Ваш отзыв" : "Молитва"}
            </span>
            <button onClick={closeModal} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: 8, borderRadius: '50%'}}><X size={20} color={themeObj.text} /></button>
          </div>
          {/* SCRIPTURE FINDER BUTTON */}
          {modalMode === 'entry' && (
            <div style={{marginBottom: 10, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 5}}>
              <button onClick={() => setModalMode('scripture_finder')} style={{display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.05)', border: 'none', fontSize: 12, fontWeight: 'bold', color: themeObj.primary, cursor: 'pointer', whiteSpace: 'nowrap'}}>
                <Search size={14}/> Найти Слово
              </button>
            </div>
          )}
          <textarea autoFocus value={inputText} onChange={e => setInputText(e.target.value)} placeholder="..." style={{width: '100%', minHeight: 180, maxHeight: '40vh', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', border: 'none', borderRadius: 16, padding: 16, fontSize: 18, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.5, color: themeObj.text, outline: 'none', resize: 'none'}}/>
          <Button onClick={modalMode === 'reflection' ? handleReflection : modalMode === 'public_request' ? createPublicRequest : modalMode === 'feedback' ? createFeedback : createItem} theme={themeObj} icon={<ChevronRight size={18} />}>
            {modalMode === 'public_request' || modalMode === 'feedback' ? 'Отправить' : 'Аминь'}
          </Button>
        </motion.div>
      </div>
      )}

      {modalMode === 'scripture_finder' && renderScriptureFinder()}


      {modalMode === 'donate' && (
      <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}} onClick={closeModal}>
        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 360, borderRadius: 30, padding: 24, textAlign: 'center'}} onClick={e => e.stopPropagation()}>
          <button onClick={closeModal} style={{position:'absolute', top:16, right:16, background:'none', border:'none'}}><X size={24} color={themeObj.text}/></button>
          <h3 style={{margin: '10px 0 10px', fontFamily: 'Cormorant Garamond', fontSize: 26, fontStyle: 'italic', color: themeObj.text}}>Поддержать проект</h3>
          <p style={{fontSize: 14, lineHeight: 1.5, opacity: 0.8, marginBottom: 20, color: themeObj.text}}>На оплату серверов и дальнейшее развитие проекта. Спасибо, что помогаете сохранять это место тишины.</p>
          <div style={{marginBottom: 25}}><div style={{background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10}}><span style={{fontSize: 15, fontFamily: 'monospace', fontWeight: 'bold', color: themeObj.text}}>42301810500073862125</span><button onClick={() => handleCopy("42301810500073862125")} style={{background: 'none', border: 'none', color: themeObj.primary}}>{copied ? <Check size={20}/> : <Copy size={20}/>}</button></div></div>
        </motion.div>
      </div>
      )}

      {modalMode === 'settings' && (
      <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
        <motion.div initial={{x:100}} animate={{x:0}} style={{background: isDark ? '#171717' : 'white', color: isDark ? 'white' : '#1A1A1A', width: '90%', maxWidth: 360, height: '100%', padding: '40px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
          <div style={{display:'flex', alignItems:'center', gap:15, marginBottom: 30}}>
            <div style={{width: 60, height: 60, borderRadius: '50%', background: themeObj.primary, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:24, fontWeight:'bold'}}>{user.displayName ? user.displayName[0] : 'A'}</div>
            <div>
              {isEditingName ? (
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: '8px', borderRadius: 8, fontSize: 16, width: 140, color: themeObj.text}} autoFocus />
                  <button onClick={handleUpdateName} style={{background: themeObj.primary, color:'white', border:'none', borderRadius: 8, padding: 8}}><Check size={16}/></button>
                </div>
              ) : (
                <h2 style={{margin:0, fontSize:22, display:'flex', alignItems:'center', gap: 8}}>{user.displayName}<button onClick={() => { setEditNameValue(user.displayName); setIsEditingName(true); }} style={{background:'none', border:'none', opacity:0.5, cursor:'pointer'}}><User size={16} color={themeObj.text}/></button></h2>
              )}
              <div style={{display:'flex', alignItems:'center', gap:5, opacity:0.7, fontSize:14, marginTop:4}}><Flame size={14} fill="#f59e0b" color="#f59e0b"/> <span>{userStats.streak} дней в духе</span></div>
            </div>
          </div>

          {/* STATS GRID RESTORED */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30}}>
            <div style={{background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', padding: 15, borderRadius: 20}}>
              <span style={{fontSize:24, fontWeight:'bold'}}>{prayers.length + topics.length}</span>
              <p style={{margin:0, fontSize:12, opacity:0.5}}>Всего молитв</p>
            </div>
            <div style={{background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', padding: 15, borderRadius: 20}}>
              <span style={{fontSize:24, fontWeight:'bold'}}>{prayers.filter(i => i.status === 'answered').length + topics.filter(i => i.status === 'answered').length}</span>
              <p style={{margin:0, fontSize:12, opacity:0.5}}>Отвечено</p>
            </div>
          </div>

          {/* CALENDAR RESTORED */}
          <div style={{marginBottom: 30}}>
            <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>История верности</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8}}>
              {getDaysInMonth().map(day => {
                const d = new Date();
                const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${day}`;
                const isActive = userStats.history && userStats.history[dateKey];
                const isFuture = day > d.getDate();

                return (
                  <div key={day} style={{
                    aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold',
                    background: isActive ? themeObj.primary : isFuture ? 'transparent' : isDark?'rgba(255,255,255,0.05)':'#f1f5f9',
                    color: isActive ? (theme === 'noir' ? 'black' : 'white') : isFuture ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : (isDark ? 'white' : 'black'),
                    opacity: isActive ? 1 : isFuture ? 1 : 0.5
                  }}>
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          {/* MEDALS RESTORED */}
          <div style={{marginBottom: 30}}>
            <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>Зал Славы</h3>
            <div style={{display: 'flex', gap: 15, overflowX: 'auto', paddingBottom: 10}}>
              {Object.values(MEDALS).map(medal => {
                const keyForMedal = Object.keys(MEDALS).find(k => MEDALS[k] === medal);
                const isUnlocked = userStats.streak >= parseInt(keyForMedal || '0', 10);
                return (
                  <div key={medal.id} style={{
                    minWidth: 100, background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', padding: 15, borderRadius: 20,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    opacity: isUnlocked ? 1 : 0.4, filter: isUnlocked ? 'none' : 'grayscale(100%)'
                  }}>
                    <div style={{marginBottom: 10}}>{React.cloneElement(medal.icon, { color: isUnlocked ? undefined : (isDark ? 'white' : 'black') })}</div>
                    <span style={{fontSize: 12, fontWeight: 'bold'}}>{medal.name}</span>
                    <span style={{fontSize: 10, opacity: 0.6}}>{medal.desc}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{marginTop: 'auto'}}>
            <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>Тема</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 30}}>
              {Object.keys(THEMES).filter(t => isAdmin || !['cosmos', 'aether'].includes(t)).map(t => (
                <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection: 'column', alignItems:'center', gap:5}}>
                  <div style={{width: 40, height: 40, borderRadius: 12, background: THEMES[t].bg, backgroundColor: THEMES[t].fallback, backgroundSize:'cover', border: theme === t ? `2px solid ${themeObj.text}` : '2px solid transparent'}}/>
                  <span style={{fontSize: 10, opacity: 0.7, fontWeight: theme === t ? 'bold' : 'normal'}}>{THEMES[t].name}</span>
                </div>
              ))}
            </div>
            {user.email === ADMIN_EMAIL && <Button onClick={uploadDevotionalsToDB} theme={themeObj} style={{marginBottom: 10}} icon={<UploadCloud size={18} />}>ADMIN: Загрузить Слово</Button>}
            <Button onClick={() => setModalMode('donate')} theme={themeObj} style={{marginBottom: 10}} icon={<Heart size={18} fill={themeObj.primary} color={themeObj.primary} />}>Поддержать проект</Button>
            <Button onClick={() => setModalMode('feedback')} theme={themeObj} style={{marginBottom: 10}} icon={<MessageSquare size={18}/>}>Написать разработчику</Button>
            <Button onClick={() => setModalMode('about')} theme={themeObj} style={{marginBottom: 10}} icon={<Info size={18}/>}>О приложении</Button>
            <Button onClick={logout} theme={themeObj} style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)'}} icon={<LogOut size={18}/>}>Выйти</Button>
          </div>
        </motion.div>
      </div>
      )}

      {modalMode === 'about' && (
        <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.95)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}} onClick={closeModal}>
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 350, borderRadius: 30, padding: 30}} onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} style={{position:'absolute', top:20, right:20, background:'none', border:'none'}}><X size={24} color={isDark?'white':'#333'}/></button>
            <h2 style={{fontFamily: 'Cormorant Garamond', fontSize: 32, fontStyle: 'italic', color: themeObj.primary, marginBottom: 10}}>Amen.</h2>
            <p style={{fontSize: 14, lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#4b5563', marginBottom: 20}}>Это приложение — ваш инструмент для осознанной духовной жизни. Здесь нет алгоритмов и лайков. Только вы и ваши мысли.</p>
            <div style={{marginBottom: 20}}>
              <h4 style={{fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: themeObj.primary, marginBottom: 8}}>Как это работает</h4>
              <ul style={{fontSize: 13, lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#4b5563', paddingLeft: 20, margin: 0}}>
                <li style={{marginBottom: 5}}><b>Дневник:</b> Личные молитвы и фокус дня.</li>
                <li style={{marginBottom: 5}}><b>Слово:</b> Ежедневное вдохновение.</li>
                <li style={{marginBottom: 5}}><b>Список:</b> Ваши молитвенные нужды и трекер.</li>
                <li style={{marginBottom: 5}}><b>Единство:</b> Анонимная поддержка других.</li>
                <li style={{marginBottom: 5}}><b>Чудеса:</b> Архив ответов.</li>
                <li><b>Огонь:</b> Символ вашей дисциплины.</li>
              </ul>
            </div>
            <div style={{textAlign:'center', fontSize: 11, opacity: 0.4, color: isDark ? 'white' : 'black'}}>Версия 3.2.1</div>
          </motion.div>
        </div>
      )}

      {modalMode === 'music' && (
      <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
        <div style={{background: theme === 'noir' ? '#171717' : (isDark ? '#1e293b' : 'white'), borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
            <h3 style={{margin:0, fontSize:20, color:themeObj.text}}>Музыка души</h3>
            <button onClick={closeModal}><X size={24} color={themeObj.text}/></button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:'40vh', overflowY:'auto'}}>
            {TRACKS.map((track, i) => (
            <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{background: i===currentTrackIndex ? themeObj.primary : 'rgba(0,0,0,0.05)', color: i===currentTrackIndex ? (theme === 'noir' ? 'black' : 'white') : themeObj.text, border:'none', padding:15, borderRadius:12, textAlign:'left', fontWeight:'bold'}}>{track.title}</button>
            ))}
          </div>
          <div style={{display:'flex', justifyContent:'center', gap: 30, marginTop: 30, alignItems:'center'}}>
            <button onClick={prevTrack} style={{background:'none', border:'none'}}><SkipBack size={32} color={themeObj.text}/></button>
            <button onClick={() => setIsPlaying(!isPlaying)} style={{background: themeObj.primary, border:'none', borderRadius:'50%', width: 64, height: 64, display:'flex', alignItems:'center', justifyContent:'center', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'}}>{isPlaying ? <Pause size={32} fill="white"/> : <Play size={32} fill="white" style={{marginLeft:4}}/>}</button>
            <button onClick={nextTrack} style={{background:'none', border:'none'}}><SkipForward size={32} color={themeObj.text}/></button>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default AmenApp;