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

let app; try { app = initializeApp(firebaseConfig); } catch (e) {}
const auth = getAuth(); const db = getFirestore(); const appId = firebaseConfig.projectId;
const ADMIN_EMAIL = "kiraishikagi@amen.local";

// --- EXTENDED BIBLE ENGINE ---
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
   'doubt': [
       { t: "Иакова 1:5", v: "Если же у кого из вас недостает мудрости, да просит у Бога, дающего всем просто." },
       { t: "Марка 9:24", v: "Верую, Господи! помоги моему неверию." }
   ],
   'anger': [
       { t: "Иакова 1:19", v: "Всякий человек да будет скор на слышание, медлен на слова, медлен на гнев." },
       { t: "Ефесянам 4:26", v: "Гневаясь, не согрешайте: солнце да не зайдет во гневе вашем." }
   ],
   'lonely': [
       { t: "Исаия 49:15", v: "Забудет ли женщина грудное дитя свое? .. Но если бы и она забыла, то Я не забуду тебя." },
       { t: "Псалом 67:7", v: "Бог одиноких вводит в дом." }
   ],
   'sadness': [
       { t: "Псалом 33:19", v: "Близок Господь к сокрушенным сердцем и смиренных духом спасет." },
       { t: "Матфея 5:4", v: "Блаженны плачущие, ибо они утешатся." }
   ],
   'direction': [
       { t: "Притчи 3:5-6", v: "Надейся на Господа всем сердцем твоим... Во всех путях твоих познавай Его, и Он направит стези твои." },
       { t: "Псалом 31:8", v: "Вразумлю тебя, наставлю тебя на путь, по которому тебе идти." }
   ],
   'waiting': [
       { t: "Псалом 26:14", v: "Надейся на Господа, мужайся, и да укрепляется сердце твое." },
       { t: "Исаия 40:31", v: "А надеющиеся на Господа обновятся в силе." }
   ],
   'lazy': [
       { t: "Колоссянам 3:23", v: "И все, что делаете, делайте от души, как для Господа, а не для человеков." },
       { t: "Притчи 6:6", v: "Пойди к муравью, ленивец, посмотри на действия его, и будь мудрым." }
   ],
   'conflict': [
       { t: "Римлянам 12:18", v: "Если возможно с вашей стороны, будьте в мире со всеми людьми." },
       { t: "Притчи 15:1", v: "Кроткий ответ отвращает гнев." }
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
   'sadness': { l: 'Грусть', i: <Frown size={14}/> },
   'lonely': { l: 'Одиночество', i: <User size={14}/> },
   'doubt': { l: 'Сомнения', i: <HelpCircle size={14}/> },
   'anger': { l: 'Гнев', i: <Flame size={14}/> },
   'direction': { l: 'Выбор пути', i: <Compass size={14}/> },
   'waiting': { l: 'Ожидание', i: <Loader size={14}/> },
   'conflict': { l: 'Конфликт', i: <Users size={14}/> },
   'lazy': { l: 'Лень', i: <Briefcase size={14}/> },
   'joy': { l: 'Радость', i: <Sun size={14}/> }
};

// --- ONBOARDING DATA ---
const ONBOARDING_OPTIONS = [
   { id: 'anxiety', label: 'Тревога', icon: <Wind size={24}/>, verse: "Не заботьтесь ни о чем, но всегда в молитве открывайте свои желания пред Богом.", ref: "Филиппийцам 4:6" },
   { id: 'weary', label: 'Усталость', icon: <Moon size={24}/>, verse: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас.", ref: "Матфея 11:28" },
   { id: 'lonely', label: 'Одиночество', icon: <User size={24}/>, verse: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", ref: "Исаия 41:10" },
   { id: 'grateful', label: 'Благодарность', icon: <Heart size={24}/>, verse: "Славьте Господа, ибо Он благ, ибо вовек милость Его.", ref: "Псалом 106:1" }
];

const INITIAL_DATA = [
{ day: 1, reference: "Филиппийцам 4:6-7", text: "Не заботьтесь ни о чем, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом.", explanation: "Тревога — это сигнал к молитве. Вместо сценариев катастроф, превратите каждую заботу в просьбу.", action: "Выпишите одну вещь, которая тревожит вас сегодня, и помолитесь о ней прямо сейчас." },
{ day: 2, reference: "Псалом 22:1", text: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", explanation: "Если Он — Пастырь, то ответственность за обеспечение лежит на Нем. Вы в надежных руках.", action: "Скажите вслух: «Господь восполнит это», и отпустите контроль над ситуацией." },
// ... data ...
{ day: 30, reference: "Откровение 21:4", text: "И отрет Бог всякую слезу... и смерти не будет уже.", explanation: "Лучшее еще впереди. Вечность с Богом — это надежда, дающая силы.", action: "Взгляните на свои проблемы с точки зрения вечности." }
];

const MEDALS = {
  3: { id: 'spark', name: 'Искра', desc: '3 дня постоянства', icon: <Sparkles size={32} /> },
  7: { id: 'flame', name: 'Пламя', desc: 'Неделя верности', icon: <Flame size={32} /> },
  30: { id: 'torch', name: 'Факел', desc: 'Месяц огня', icon: <Crown size={32} /> }
};

const TRACKS = [
{ title: "Beautiful Worship", file: "/music/beautiful-worship.mp3" },
{ title: "Celestial Prayer", file: "/music/celestial-prayer.mp3" },
{ title: "Meditation Bliss", file: "/music/meditation-bliss.mp3" },
{ title: "Meditation Prayer", file: "/music/meditation-prayer.mp3" },
{ title: "Peaceful Prayer", file: "/music/peaceful-prayer.mp3" },
{ title: "Piano Ambient", file: "/music/piano-ambient.mp3" },
{ title: "Piano Prayer", file: "/music/piano-prayer.mp3" },
{ title: "Prayer Good Vibes", file: "/music/prayer_good_vibes.mp3" },
{ title: "Redeemed Hope", file: "/music/redeemed-hope.mp3" },
{ title: "Soothing Worship", file: "/music/soothing-worship.mp3" }
];

const THEMES = {
dawn: { id: 'dawn', name: 'Рассвет', bg: 'url("/backgrounds/dawn.jpg")', fallback: '#fff7ed', primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.5)' },
ocean: { id: 'ocean', name: 'Глубина', bg: 'url("/backgrounds/ocean.jpg")', fallback: '#f0f9ff', primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.5)' },
forest: { id: 'forest', name: 'Эдем', bg: 'url("/backgrounds/forest.jpg")', fallback: '#064e3b', primary: '#4ade80', text: '#f0fdf4', card: 'rgba(6, 78, 59, 0.6)' },
dusk: { id: 'dusk', name: 'Закат', bg: 'url("/backgrounds/dusk.jpg")', fallback: '#fff7ed', primary: '#c2410c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.5)' },
night: { id: 'night', name: 'Звезды', bg: 'url("/backgrounds/night.jpg")', fallback: '#1e1b4b', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.5)' },
noir: { id: 'noir', name: 'Крест', bg: 'url("/backgrounds/noir.jpg")', fallback: '#171717', primary: '#fafafa', text: '#e5e5e5', card: 'rgba(20, 20, 20, 0.7)' },
// COSMOS (Deep Space Particles)
cosmos: { id: 'cosmos', name: 'Космос', bg: '', fallback: '#000000', primary: '#e2e8f0', text: '#f8fafc', card: 'rgba(0, 0, 0, 0.6)' },
// AETHER (Fire on White)
aether: { id: 'aether', name: 'Эфир', bg: '', fallback: '#ffffff', primary: '#f97316', text: '#431407', card: 'rgba(255, 255, 255, 0.7)' }
};

// --- 2. HELPERS & UTILS ---
const formatDate = (timestamp) => {
   if (!timestamp) return '';
   try { if (timestamp.toDate) return timestamp.toDate().toLocaleDateString(); return new Date(timestamp).toLocaleDateString(); } catch (e) { return ''; }
};

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const getDaysInMonth = () => {
   const date = new Date();
   const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
   return Array.from({ length: days }, (_, i) => i + 1);
};

// --- VISUAL ENGINES ---

// 1. COSMIC PARTICLES (True 3D Particles for Cosmos)
const CosmicParticles = () => {
   const mountRef = useRef(null);

   useEffect(() => {
       const loadThree = () => {
           return new Promise((resolve, reject) => {
               if (window.THREE) { resolve(); return; }
               const script = document.createElement('script');
               script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
               script.onload = () => resolve();
               script.onerror = reject;
               document.body.appendChild(script);
           });
       };

       let frameId;
       let renderer, scene, camera, particles;

       const init = () => {
           const THREE = window.THREE;
           const container = mountRef.current;
           if (!container) return;

           // Scene setup
           scene = new THREE.Scene();
           // Deep space fog
           scene.fog = new THREE.FogExp2(0x0f172a, 0.001); // Slate-900 like

           camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
           camera.position.z = 1000;

           renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
           renderer.setSize(window.innerWidth, window.innerHeight);
           renderer.setClearColor(0x0f172a); // Background color
           container.appendChild(renderer.domElement);

           // Create Particles
           const geometry = new THREE.BufferGeometry();
           const count = 3000;
           const positions = [];
           const colors = [];

           const color1 = new THREE.Color(0x818cf8); // Indigo
           const color2 = new THREE.Color(0xc084fc); // Purple
           const color3 = new THREE.Color(0xffffff); // White

           for (let i = 0; i < count; i++) {
               const x = (Math.random() - 0.5) * 2000;
               const y = (Math.random() - 0.5) * 2000;
               const z = (Math.random() - 0.5) * 2000;
               positions.push(x, y, z);

               // Randomly pick a color
               const rand = Math.random();
               const c = rand < 0.6 ? color3 : (rand < 0.8 ? color1 : color2);
               colors.push(c.r, c.g, c.b);
           }

           geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
           geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

           // Circular particle texture (generated programmatically)
           const sprite = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');

           const material = new THREE.PointsMaterial({
               size: 4,
               vertexColors: true,
               map: sprite,
               alphaTest: 0.5,
               transparent: true,
               opacity: 0.8
           });

           particles = new THREE.Points(geometry, material);
           scene.add(particles);

           // Mouse Interaction
           let mouseX = 0;
           let mouseY = 0;

           const onDocumentMouseMove = (event) => {
               mouseX = (event.clientX - window.innerWidth / 2) * 0.5;
               mouseY = (event.clientY - window.innerHeight / 2) * 0.5;
           };
           document.addEventListener('mousemove', onDocumentMouseMove);
           
           const onTouchMove = (event) => {
               if (event.touches.length > 0) {
                    mouseX = (event.touches[0].clientX - window.innerWidth / 2) * 0.5;
                    mouseY = (event.touches[0].clientY - window.innerHeight / 2) * 0.5;
               }
           }
           document.addEventListener('touchmove', onTouchMove);


           const animate = () => {
               frameId = requestAnimationFrame(animate);

               // Slow rotation
               particles.rotation.x += 0.0005;
               particles.rotation.y += 0.0005;

               // Parallax
               camera.position.x += (mouseX - camera.position.x) * 0.05;
               camera.position.y += (-mouseY - camera.position.y) * 0.05;
               camera.lookAt(scene.position);

               renderer.render(scene, camera);
           };
           animate();

           // Resize
           const handleResize = () => {
               camera.aspect = window.innerWidth / window.innerHeight;
               camera.updateProjectionMatrix();
               renderer.setSize(window.innerWidth, window.innerHeight);
           };
           window.addEventListener('resize', handleResize);
       };

       loadThree().then(init).catch(console.error);

       return () => {
           if (frameId) cancelAnimationFrame(frameId);
       };
   }, []);

   return <div ref={mountRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100vw', height: '100vh'}} />;
};

// 2. DIGITAL AETHER (Fire on White - Kept as requested)
const DigitalAether = () => {
  const mountRef = useRef(null);

  useEffect(() => {
      const loadThree = () => {
          return new Promise((resolve, reject) => {
              if (window.THREE) { resolve(); return; }
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
              script.onload = () => resolve();
              script.onerror = reject;
              document.body.appendChild(script);
          });
      };

      let frameId;
      let renderer, scene, camera, mesh, material;

      const init = () => {
          const THREE = window.THREE;
          const container = mountRef.current;
          if (!container) return;

          scene = new THREE.Scene();
          camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          container.appendChild(renderer.domElement);

          const fragmentShader = `
              uniform float uTime;
              uniform vec2 uResolution;
              uniform vec2 uMouse;

              // Simplex noise helper
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

          const vertexShader = `
              void main() {
                  gl_Position = vec4( position, 1.0 );
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
              fragmentShader: fragmentShader
          });

          mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);

          const animate = (time) => {
              frameId = requestAnimationFrame(animate);
              if (material) {
                  material.uniforms.uTime.value = time * 0.001;
              }
              renderer.render(scene, camera);
          };
          requestAnimationFrame(animate);

          const handleResize = () => {
              renderer.setSize(window.innerWidth, window.innerHeight);
              if (material) material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
          };
          window.addEventListener('resize', handleResize);
         
          const handleMouseMove = (e) => {
              if(material) {
                  material.uniforms.uMouse.value.x = e.clientX / window.innerWidth;
                  material.uniforms.uMouse.value.y = 1.0 - (e.clientY / window.innerHeight);
              }
          };
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('touchmove', (e) => {
               if(e.touches.length > 0 && material) {
                  material.uniforms.uMouse.value.x = e.touches[0].clientX / window.innerWidth;
                  material.uniforms.uMouse.value.y = 1.0 - (e.touches[0].clientY / window.innerHeight);
               }
          });
      };

      loadThree().then(init).catch(console.error);

      return () => {
          if (frameId) cancelAnimationFrame(frameId);
      };
  }, []);

  return <div ref={mountRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100vw', height: '100vh'}} />;
};

// --- 3. REUSABLE UI COMPONENTS ---

const Card = ({ children, style, theme, onClick, animate = false }) => {
   // For 'aether' (fire), we are now LIGHT mode. For 'cosmos' we are DARK.
   const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(theme.id);
   const Component = animate ? motion.div : 'div';
   
   // Custom style for Aether cards to pop on white
   const aetherStyle = theme.id === 'aether' ? {
       border: '1px solid rgba(249, 115, 22, 0.2)', // Orange hint
       boxShadow: '0 4px 20px rgba(249, 115, 22, 0.1)', // Warm shadow
       background: 'rgba(255,255,255,0.85)'
   } : {};

   return (
       <Component
           layout={animate}
           onClick={onClick}
           style={{
               background: theme.card,
               borderRadius: 24,
               padding: 20,
               marginBottom: 12,
               backdropFilter: 'blur(5px)',
               border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
               boxShadow: animate ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
               ...aetherStyle,
               ...style
           }}
       >
           {children}
       </Component>
   );
};

const Button = ({ children, onClick, theme, variant = 'primary', style, icon }) => {
   const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(theme.id);
   const baseStyle = {
       border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14,
       display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
       cursor: 'pointer', transition: 'all 0.2s', padding: '12px 16px'
   };
   
   let variantStyle = {};
   if (variant === 'primary') {
       variantStyle = {
           background: theme.primary,
           color: theme.id === 'noir' ? 'black' : 'white',
           width: '100%',
       };
   } else if (variant === 'ghost') {
       variantStyle = {
           background: 'none', padding: 4, opacity: 0.7, color: theme.text
       };
   } else if (variant === 'soft') {
       variantStyle = {
           background: theme.id === 'aether' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255,255,255,0.4)',
           color: theme.id === 'noir' ? 'black' : theme.primary,
           width: '100%'
       };
   } else if (variant === 'amen') {
       variantStyle = {
           padding: '8px 16px', borderRadius: 20, fontSize: 13,
           background: 'rgba(0,0,0,0.05)', color: theme.text
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
   const [onboardingStep, setOnboardingStep] = useState(() => {
       return localStorage.getItem('amen_visited') ? 2 : 0;
   });
   const [selectedMood, setSelectedMood] = useState(null);

   // --- JOURNEY CARD STATE (NEW) ---
   const [journeyExpanded, setJourneyExpanded] = useState(true);

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

   // NEW: Scripture Search State
   const [scriptureMode, setScriptureMode] = useState(false);

   const cur = THEMES[theme] || THEMES.dawn;
   // Important: 'aether' is now considered a light theme for text color logic
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
               if (!querySnapshot.empty) { const data = querySnapshot.docs.map(doc => doc.data()); if (data.length > 0) setDevotionals(data); }
           } catch (e) { console.error(e); }
       };
       fetchDevotionals();
   }, []);

   useEffect(() => {
       if (!user) return;
       let unsubReqs = () => {}, unsubFeedback = () => {};
       if (activeTab === 'community') {
           const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), orderBy('createdAt', 'desc'));
           unsubReqs = onSnapshot(q, (snapshot) => setPublicRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))));
       }
       if (activeTab === 'admin_feedback' && isAdmin) {
           const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback'), orderBy('createdAt', 'desc'));
           unsubFeedback = onSnapshot(q, (snapshot) => setFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))));
       }
       return () => { unsubReqs(); unsubFeedback(); };
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
       if (track && track.file) {
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

   useEffect(() => {
       if (!user) return;
       setLoading(true);
       const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), orderBy('createdAt', 'desc')), s => {
           setPrayers(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))); setLoading(false);
       });
       const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics')), s => {
           setTopics(s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null, createdAt: d.data().createdAt?.toDate() || new Date() })));
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
       return () => { unsubP(); unsubT(); unsubStats(); unsubRefl(); };
   }, [user]);

   useEffect(() => {
      if (!dailyFocusDone && !focusItem && (prayers.length > 0 || topics.length > 0)) selectRandomFocus();
   }, [prayers, topics, dailyFocusDone, focusItem]);


   // --- SMART COLLAPSE EFFECT ---
   // If all tasks are done (3/3), auto-collapse the journey card
   useEffect(() => {
       const progress = (dailyWordRead ? 1 : 0) + (dailyFocusDone ? 1 : 0) + (dailyReflectionDone ? 1 : 0);
       if (progress === 3) {
           setJourneyExpanded(false);
       }
   }, [dailyWordRead, dailyFocusDone, dailyReflectionDone]);


   // --- HANDLERS ---
   const handleAuth = async () => {
     if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+) обязательны"); return; }
     setAuthLoading(true); setAuthError("");
     const email = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
     try { await signInWithEmailAndPassword(auth, email, password); }
     catch { try { const u = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(u.user, { displayName: nickname }); } catch { setAuthError("Ошибка входа"); } }
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

   const handleFocusPray = async () => {
      if (!focusItem || dailyFocusDone) return;
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: [cur.primary, '#fbbf24', '#ffffff'] });
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      const coll = focusItem.title ? 'prayer_topics' : 'prayers';
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, focusItem.id), { count: increment(1), lastPrayedAt: serverTimestamp() });
      const todayStr = getTodayString();
      let newStreak = userStats.streak;
      if (userStats.lastPrayedDate !== todayStr) {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          if (userStats.lastPrayedDate === `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`) newStreak += 1; else newStreak = 1;
      }
      const newHistory = { ...userStats.history, [todayStr]: true };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { streak: newStreak, lastPrayedDate: todayStr, history: newHistory }, { merge: true });
      if (MEDALS[newStreak]) { setNewMedal(MEDALS[newStreak]); setModalMode('medal'); }
   };

   const handleReadWord = async () => {
       if(dailyWordRead) return;
       const todayStr = getTodayString();
       await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { wordReadDate: todayStr }, { merge: true });
   };

   const handleReflection = async () => {
      if (!inputText.trim()) return;
      const text = inputText; closeModal();
      confetti({ shapes: ['star'], colors: ['#FFD700', '#FFA500'] });
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), { text: "Вечерняя благодарность", status: 'answered', answerNote: text, createdAt: serverTimestamp(), answeredAt: serverTimestamp() });
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), { [getTodayString()]: true }, { merge: true });
      setDailyReflectionDone(true);
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
   };

   const saveAnswer = async () => {
     if (!selectedItem) return;
     const coll = selectedItem.title ? 'prayer_topics' : 'prayers'; closeModal();
     confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [cur.primary, '#fbbf24', '#ffffff'] });
     await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id), { status: 'answered', answeredAt: serverTimestamp(), answerNote: inputText });
   };

   const prayForTopic = async (id) => {
     if (navigator.vibrate) navigator.vibrate(50);
     await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics', id), { count: increment(1), lastPrayedAt: serverTimestamp() });
   };

   const deleteItem = async () => {
     if (!selectedItem) return;
     if (window.confirm("Удалить?")) {
        const coll = (selectedItem.title) ? 'prayer_topics' : 'prayers';
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id));
        closeModal();
     }
   };

   const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); setNewMedal(null); setScriptureMode(false); };
   const nextTrack = () => setCurrentTrackIndex(p => (p + 1) % TRACKS.length);
   const prevTrack = () => setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length);
   const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
   const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

   // --- LOGIC: SCRIPTURE SELECT ---
   const insertScripture = (text, ref) => {
       setInputText(prev => `${prev}"${text}" — ${ref}\n\nГосподи, ...`);
       setScriptureMode(false);
   };

   // --- DERIVED STATE ---
   const getDailyDevotional = () => {
       const today = new Date().getDate();
       if (!devotionals || devotionals.length === 0) return INITIAL_DATA[(today - 1) % INITIAL_DATA.length];
       return devotionals[(today - 1) % devotionals.length];
   };
   const todaysDevotional = getDailyDevotional();
   const isEvening = new Date().getHours() >= 18;

   const list = useMemo(() => {
     const q = searchQuery.toLowerCase();
     const safeSort = (a, b) => (b.answeredAt?.seconds || b.createdAt?.seconds || 0) - (a.answeredAt?.seconds || a.createdAt?.seconds || 0);
     if (activeTab === 'word') return [];
     if (activeTab === 'community') return publicRequests;
     if (activeTab === 'admin_feedback') return feedbacks;
     if (activeTab === 'vault') {
       const p = prayers.filter(i => i.status === 'answered');
       const t = topics.filter(i => i.status === 'answered');
       return [...p, ...t].filter(i => (i.text || i.title || "").toLowerCase().includes(q)).sort(safeSort);
     }
     const src = activeTab === 'list' ? topics : prayers;
     return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q));
   }, [prayers, topics, activeTab, searchQuery, publicRequests, feedbacks]);

   // --- VIEW RENDERERS ---

   const renderOnboarding = () => {
       if (onboardingStep === 0) {
           return (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{padding: 30, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center'}}>
                   <h1 style={{fontSize: 42, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: cur.primary, marginBottom: 10, lineHeight: 1}}>Amen.</h1>
                   <h2 style={{fontSize: 28, marginBottom: 30, fontWeight: 500}}>Что у тебя на сердце сегодня?</h2>
                   <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                       {ONBOARDING_OPTIONS.map(opt => (
                           <motion.button key={opt.id} whileTap={{scale:0.98}} onClick={() => { setSelectedMood(opt); setOnboardingStep(1); }} style={{display: 'flex', alignItems: 'center', gap: 15, padding: 20, background: cur.card, border: 'none', borderRadius: 20, textAlign: 'left', cursor: 'pointer', fontSize: 18, fontWeight: 500, color: cur.text, boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
                               <div style={{color: cur.primary}}>{opt.icon}</div>
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
                       <div style={{display: 'inline-flex', padding: 20, borderRadius: '50%', background: `${cur.primary}20`, color: cur.primary, marginBottom: 20}}>
                           {React.cloneElement(selectedMood.icon, {size: 48})}
                       </div>
                       <h2 style={{fontSize: 32, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.3, marginBottom: 10}}>"{selectedMood.verse}"</h2>
                       <p style={{fontSize: 14, fontWeight: 'bold', opacity: 0.6, textTransform: 'uppercase'}}>{selectedMood.ref}</p>
                   </div>
                   <p style={{marginBottom: 40, fontSize: 16, opacity: 0.8, lineHeight: 1.5}}>Бог слышит тебя. Ты не один в этом чувстве.</p>
                   <Button onClick={() => setOnboardingStep(2)} theme={cur} style={{padding: 20, fontSize: 16}}>Сохранить это в дневник <ArrowRight size={20}/></Button>
               </motion.div>
           );
       } else {
           return (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 20}}>
                   <div style={{background: cur.card, padding: 30, borderRadius: 30, backdropFilter: 'blur(10px)', width: '100%', maxWidth: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}}>
                       <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic', color: cur.primary, textAlign:'center', lineHeight: 1}}>Amen.</h1>
                       <p style={{fontFamily:'sans-serif', fontSize:14, opacity:0.8, marginBottom:30, textAlign:'center', lineHeight:1.5, marginTop: 10}}>
                           {selectedMood ? "Создай аккаунт, чтобы сохранить этот момент тишины." : "Ваше личное пространство тишины."}
                       </p>
                       <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                           <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.5)', fontSize:16}}/>
                           <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.5)', fontSize:16}}/>
                           {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, color: '#e11d48'}}>{authError}</p>}
                           <Button onClick={handleAuth} theme={cur}>{authLoading ? <Loader className="animate-spin"/> : (selectedMood ? "Сохранить и Войти" : "Войти / Создать")}</Button>
                           {selectedMood ? <button onClick={() => setOnboardingStep(0)} style={{background:'none', border:'none', fontSize:12, opacity:0.5, marginTop:10, cursor:'pointer'}}>Назад к выбору</button> : null}
                       </div>
                   </div>
               </motion.div>
           );
       }
   };

   const renderWord = () => {
       // Trigger read when user views this
       if (!dailyWordRead) { handleReadWord(); }
       
       return (
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
               <Card theme={cur}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                       <h2 style={{fontSize: 24, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', margin: 0}}>Слово на сегодня</h2>
                       <span style={{fontSize: 12, fontWeight: 'bold', padding: '4px 10px', background: cur.primary, color: theme === 'noir' ? 'black' : 'white', borderRadius: 20}}>
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
                   <div style={{background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)', padding: 16, borderRadius: 16, borderLeft: `4px solid ${cur.primary}`}}>
                       <h3 style={{fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: cur.primary, marginBottom: 8}}>Действие</h3>
                       <p style={{fontSize: 15, lineHeight: 1.5, opacity: 0.9}}>{todaysDevotional.action}</p>
                   </div>
               </Card>
           </motion.div>
       );
   };

   const renderCommunity = () => (
       <div>
           <div style={{textAlign:'center', marginBottom:20, opacity:0.8, fontSize:13}}>Здесь мы несем бремена друг друга.<br/>Нажмите «Аминь», если помолились.</div>
           {publicRequests.length === 0 ? <div style={{textAlign: 'center', marginTop: 50, opacity: 0.5}}>Пока тишина...</div> :
               publicRequests.map(req => {
                   const isAmened = req.amens?.includes(user.uid);
                   return (
                       <Card key={req.id} theme={cur} animate>
                           <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                               <span style={{fontSize:11, fontWeight:'bold', opacity:0.7}}>{req.authorName} • {formatDate(req.createdAt)}</span>
                               {(user.uid === req.authorId || isAdmin) && <Button variant="ghost" onClick={() => deletePublicRequest(req.id)} theme={cur} icon={<Trash2 size={14} />} />}
                           </div>
                           <p style={{fontSize:16, lineHeight:1.5, marginBottom:15}}>{req.text}</p>
                           <Button onClick={() => handleAmen(req)} theme={cur} variant="amen" style={{background: isAmened ? cur.primary : 'rgba(0,0,0,0.05)', color: isAmened ? (theme==='noir'?'black':'white') : cur.text}}>
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
               <div key={fb.id} style={{background: cur.card, padding: 15, borderRadius: 15, marginBottom: 10}}>
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
       const progress = (dailyWordRead ? 1 : 0) + (dailyFocusDone ? 1 : 0) + (dailyReflectionDone ? 1 : 0);
       const progressPercent = (progress / 3) * 100;

       return (
           <div style={{marginBottom: 30}}>
               {/* DAILY JOURNEY CARD (SMART COLLAPSE) */}
               <AnimatePresence mode="wait">
                   {journeyExpanded ? (
                       <motion.div
                           key="full-card"
                           initial={{opacity: 0, height: 0}}
                           animate={{opacity: 1, height: 'auto'}}
                           exit={{opacity: 0, height: 0}}
                           style={{
                               background: cur.card, borderRadius: 28, padding: 24, marginBottom: 30,
                               border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
                               backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
                               overflow: 'hidden'
                           }}
                       >
                           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                               <h3 style={{margin: 0, fontFamily: 'Cormorant Garamond', fontSize: 22, fontStyle: 'italic'}}>Твой путь сегодня</h3>
                               <button onClick={() => setJourneyExpanded(false)} style={{background: 'none', border: 'none', padding: 4, cursor: 'pointer', opacity: 0.5}}><ChevronUp size={16} color={cur.text}/></button>
                           </div>
                           
                           <div style={{height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, marginBottom: 20, overflow: 'hidden'}}>
                               <motion.div initial={{width: 0}} animate={{width: `${progressPercent}%`}} style={{height: '100%', background: cur.primary, borderRadius: 3}} transition={{duration: 1}} />
                           </div>

                           <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                               <div onClick={() => setActiveTab('word')} style={{display: 'flex', alignItems: 'center', gap: 15, padding: 12, borderRadius: 16, cursor: 'pointer', background: dailyWordRead ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)') : 'transparent', transition: 'all 0.2s'}}>
                                   <div style={{width: 32, height: 32, borderRadius: '50%', background: dailyWordRead ? cur.primary : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dailyWordRead ? (theme==='noir'?'black':'white') : cur.text}}>
                                       {dailyWordRead ? <Check size={18}/> : <BookOpen size={18} style={{opacity:0.6}}/>}
                                   </div>
                                   <div style={{flex: 1}}>
                                       <div style={{fontSize: 15, fontWeight: 'bold', opacity: dailyWordRead ? 0.6 : 1, textDecoration: dailyWordRead ? 'line-through' : 'none'}}>Слово для тебя</div>
                                       {!dailyWordRead && <div style={{fontSize: 12, opacity: 0.6}}>Начни день с истины</div>}
                                   </div>
                                   <ChevronRight size={16} style={{opacity: 0.3}}/>
                               </div>

                               <div onClick={!dailyFocusDone ? handleFocusPray : null} style={{display: 'flex', alignItems: 'center', gap: 15, padding: 12, borderRadius: 16, cursor: !dailyFocusDone ? 'pointer' : 'default', background: dailyFocusDone ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)') : 'transparent'}}>
                                   <div style={{width: 32, height: 32, borderRadius: '50%', background: dailyFocusDone ? cur.primary : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dailyFocusDone ? (theme==='noir'?'black':'white') : cur.text}}>
                                       {dailyFocusDone ? <Check size={18}/> : <Zap size={18} style={{opacity:0.6}}/>}
                                   </div>
                                   <div style={{flex: 1}}>
                                       <div style={{fontSize: 15, fontWeight: 'bold', opacity: dailyFocusDone ? 0.6 : 1, textDecoration: dailyFocusDone ? 'line-through' : 'none'}}>Фокус Молитвы</div>
                                       {!dailyFocusDone && <div style={{fontSize: 12, opacity: 0.6}}>{focusItem ? (focusItem.text || focusItem.title).substring(0, 30) + '...' : 'Найти покой'}</div>}
                                   </div>
                                   {!dailyFocusDone && <ChevronRight size={16} style={{opacity: 0.3}}/>}
                               </div>

                               <div onClick={() => {if(!dailyReflectionDone) {setModalMode('reflection'); setInputText("");}}} style={{display: 'flex', alignItems: 'center', gap: 15, padding: 12, borderRadius: 16, cursor: !dailyReflectionDone ? 'pointer' : 'default', background: dailyReflectionDone ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)') : 'transparent'}}>
                                   <div style={{width: 32, height: 32, borderRadius: '50%', background: dailyReflectionDone ? cur.primary : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dailyReflectionDone ? (theme==='noir'?'black':'white') : cur.text}}>
                                       {dailyReflectionDone ? <Check size={18}/> : <Moon size={18} style={{opacity:0.6}}/>}
                                   </div>
                                   <div style={{flex: 1}}>
                                       <div style={{fontSize: 15, fontWeight: 'bold', opacity: dailyReflectionDone ? 0.6 : 1, textDecoration: dailyReflectionDone ? 'line-through' : 'none'}}>Итоги Дня</div>
                                       {!dailyReflectionDone && <div style={{fontSize: 12, opacity: 0.6}}>Благодарность перед сном</div>}
                                   </div>
                                   {!dailyReflectionDone && <ChevronRight size={16} style={{opacity: 0.3}}/>}
                               </div>
                           </div>
                       </motion.div>
                   ) : (
                       <motion.div
                           key="minimized-badge"
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           style={{
                               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                               background: cur.card, backdropFilter: 'blur(10px)',
                               padding: '8px 16px', borderRadius: 20,
                               width: 'fit-content', margin: '0 auto 30px auto',
                               cursor: 'pointer', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
                               boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                           }}
                           onClick={() => setJourneyExpanded(true)}
                       >
                            <CheckCircle2 size={14} color={cur.primary} />
                            <span style={{fontSize: 12, fontWeight: 'bold', color: cur.text, opacity: 0.8}}>
                               {progress === 3 ? "Путь завершен" : `${progress}/3 Пройдено`}
                            </span>
                            <ChevronDown size={14} style={{opacity: 0.5}} />
                       </motion.div>
                   )}
               </AnimatePresence>

               {/* MAIN LIST HEADER */}
               <div style={{marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px'}}>
                   <span style={{fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5}}>Ваши записи</span>
                   <button onClick={() => {setModalMode('entry'); setInputText("")}} style={{background:'none', border:'none', color: cur.primary, fontSize: 12, fontWeight: 'bold', cursor:'pointer'}}>+ Добавить</button>
               </div>

               {list.length === 0 ? <div style={{textAlign: 'center', marginTop: 30, opacity: 0.6}}><p style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:16}}>Пока пусто...</p></div> :
                   list.map((item) => (
                       <Card key={item.id} theme={cur}>
                           <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                               <span style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold'}}>{formatDate(item.createdAt)}</span>
                               <div style={{display:'flex', gap: 5}}>
                                   {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', color: theme === 'noir' ? 'black' : cur.primary, cursor: 'pointer'}}>Ответ</button>}
                                   <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 0}}><Trash2 size={14} color={cur.text} style={{opacity: 0.5}}/></button>
                               </div>
                           </div>
                           <p style={{margin: 0, fontSize: 16}}>{item.text || item.title}</p>
                           {activeTab === 'list' && (
                               <div style={{fontSize: 11, opacity: 0.6, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}>
                                   <Wind size={12}/> {item.count} • {formatDate(item.createdAt)}
                               </div>
                           )}
                           {activeTab === 'list' && <Button variant="soft" onClick={() => prayForTopic(item.id)} theme={cur} icon={<Wind size={16}/>} style={{marginTop: 8}}>Помолиться</Button>}
                           {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.9}}>"{item.answerNote}"</div>}
                       </Card>
                   ))
               }
           </div>
       );
   };

   // --- MAIN RENDER ---
   return (
       <>
           {theme === 'cosmos' ? <Starfield /> : theme === 'aether' ? <DigitalAether /> : (
               <div style={{position: 'fixed', inset:0, backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -1, transition: 'background 0.8s ease'}} />
           )}

           <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', color: cur.text }}>
               <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar {display:none;}`}</style>
               
               {loading ? (
                   /* GLOBAL LOADING STATE */
                   <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                       <Loader className="animate-spin" size={32} color={cur.text} style={{opacity: 0.5}} />
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
                                       <Flame size={14} fill={dailyFocusDone ? '#fbbf24' : 'none'} color={dailyFocusDone ? '#fbbf24' : cur.text} style={{opacity: dailyFocusDone ? 1 : 0.5}} />
                                       <span style={{fontSize: 11, fontWeight: 'bold', color: cur.text}}>{userStats.streak}</span>
                                   </div>
                               </div>
                           </div>
                           <div style={{display:'flex', gap:10}}>
                               <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}>
                                   {isPlaying ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}><Volume2 size={20} color={cur.text}/></motion.div> : <Music size={20} color={cur.text} style={{opacity:0.8}}/>}
                               </motion.button>
                               <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}><User size={20} color={cur.text}/></motion.button>
                           </div>
                       </div>

                       {/* NAV TABS */}
                       <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto'}}>
                           {[{id:'home', l:'Дневник'}, {id:'word', l:'Слово'}, {id:'list', l:'Список'}, {id:'community', l:'Единство'}, {id:'vault', l:'Чудеса'}, ...(isAdmin ? [{id: 'admin_feedback', l: 'Отзывы'}] : [])].map(tab => (
                               <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                   flex: 1, background: 'none', border: 'none', padding: '12px 10px', whiteSpace: 'nowrap',
                                   color: cur.text, opacity: activeTab === tab.id ? 1 : 0.6,
                                   fontWeight: activeTab === tab.id ? '800' : '500', fontSize: 14, position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                               }}>
                                   {tab.l}
                                   {activeTab === tab.id && <motion.div layoutId="underline" style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: cur.primary, borderRadius:2}} />}
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
                                   <Card key={item.id} theme={cur} animate>
                                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                                           <div style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                                               {activeTab === 'list' ? <><Wind size={12}/> {item.count} • {formatDate(item.createdAt)}</> : formatDate(item.createdAt)}
                                           </div>
                                           <div style={{display:'flex', gap: 5}}>
                                               {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: theme === 'noir' ? 'black' : cur.primary, cursor: 'pointer'}}>Ответ</button>}
                                               <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5, cursor: 'pointer'}}><Trash2 size={16} color={cur.text} style={{opacity: 0.5}}/></button>
                                           </div>
                                       </div>
                                       <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, fontWeight: 500}}>{item.text || item.title}</p>
                                       {activeTab === 'list' && <Button variant="soft" onClick={() => prayForTopic(item.id)} theme={cur} icon={<Wind size={16}/>}>Помолиться</Button>}
                                       {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.9}}>"{item.answerNote}"</div>}
                                   </Card>
                               ))
                           )}
                       </div>

                       {/* FAB */}
                       {(activeTab === 'home' || activeTab === 'list' || activeTab === 'community') && (
                           <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10}}>
                               <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : activeTab === 'community' ? 'public_request' : activeTab === 'admin_feedback' ? 'feedback' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}80`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Plus size={36}/></motion.button>
                           </div>
                       )}

                       {/* MINI PLAYER */}
                       <AnimatePresence>
                           {isPlaying && modalMode !== 'music' && (
                               <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 50, opacity: 0}} style={{position: 'fixed', bottom: 110, right: 20, zIndex: 9, background: cur.card, backdropFilter: 'blur(10px)', padding: '10px 15px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`, boxShadow: '0 5px 20px rgba(0,0,0,0.1)'}}>
                                   <div onClick={() => setModalMode('music')} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
                                       <div style={{width: 8, height: 8, borderRadius: '50%', background: cur.primary, animation: 'pulse 2s infinite'}} />
                                       <span style={{fontSize: 12, fontWeight: 'bold', maxWidth: 100, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{TRACKS[currentTrackIndex].title}</span>
                                   </div>
                                   <button onClick={() => setIsPlaying(false)} style={{background: 'none', border: 'none', padding: 4, cursor: 'pointer'}}><Pause size={16} fill={cur.text} color={cur.text}/></button>
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
                       <span style={{fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: cur.primary}}>
                           {modalMode === 'reflection' ? "Итоги дня" : modalMode === 'topic' ? "Новая тема" : modalMode === 'public_request' ? "Общая молитва" : modalMode === 'feedback' ? "Ваш отзыв" : "Молитва"}
                       </span>
                       <button onClick={closeModal} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: 8, borderRadius: '50%'}}><X size={20} color={cur.text} /></button>
                   </div>
                   {/* SCRIPTURE FINDER UI (EXPANDED) */}
                   {modalMode === 'entry' && (
                       <div style={{marginBottom: 10, display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 5}}>
                           {!scriptureMode ? (
                               <button onClick={() => setScriptureMode(true)} style={{display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.05)', border: 'none', fontSize: 12, fontWeight: 'bold', color: cur.primary, cursor: 'pointer', whiteSpace: 'nowrap'}}>
                                   <Search size={14}/> Найти Слово
                               </button>
                           ) : (
                               <div style={{display: 'flex', gap: 5}}>
                                   <button onClick={() => {
                                       // Random verse logic
                                       const keys = Object.keys(BIBLE_INDEX);
                                       const randomKey = keys[Math.floor(Math.random() * keys.length)];
                                       const verses = BIBLE_INDEX[randomKey];
                                       const randomVerse = verses[Math.floor(Math.random() * verses.length)];
                                       insertScripture(randomVerse.v, randomVerse.t);
                                   }} style={{padding: '6px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', border: 'none', color: cur.text, fontSize: 11, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                                       🎲 Случайное
                                   </button>
                                   {Object.keys(BIBLE_INDEX).map(tag => (
                                       <button key={tag} onClick={() => {
                                           const verses = BIBLE_INDEX[tag];
                                           const randomVerse = verses[Math.floor(Math.random() * verses.length)];
                                           insertScripture(randomVerse.v, randomVerse.t);
                                       }} style={{display:'flex', alignItems:'center', gap:4, padding: '6px 12px', borderRadius: 12, background: cur.primary, border: 'none', color: theme === 'noir' ? 'black' : 'white', fontSize: 11, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                                           {EMOTION_LABELS[tag]?.i} {EMOTION_LABELS[tag]?.l}
                                       </button>
                                   ))}
                                   <button onClick={() => setScriptureMode(false)} style={{padding: '6px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer'}}><X size={14}/></button>
                               </div>
                           )}
                       </div>
                   )}
                   <textarea autoFocus value={inputText} onChange={e => setInputText(e.target.value)} placeholder="..." style={{width: '100%', minHeight: 180, maxHeight: '40vh', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', border: 'none', borderRadius: 16, padding: 16, fontSize: 18, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.5, color: cur.text, outline: 'none', resize: 'none'}}/>
                   <Button onClick={modalMode === 'reflection' ? handleReflection : modalMode === 'public_request' ? createPublicRequest : modalMode === 'feedback' ? createFeedback : createItem} theme={cur} icon={<ChevronRight size={18} />}>
                       {modalMode === 'public_request' || modalMode === 'feedback' ? 'Отправить' : 'Аминь'}
                   </Button>
               </motion.div>
           </div>
           )}

           {modalMode === 'donate' && (
           <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}} onClick={closeModal}>
               <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 360, borderRadius: 30, padding: 24, textAlign: 'center'}} onClick={e => e.stopPropagation()}>
                   <button onClick={closeModal} style={{position:'absolute', top:16, right:16, background:'none', border:'none'}}><X size={24} color={cur.text}/></button>
                   <h3 style={{margin: '10px 0 10px', fontFamily: 'Cormorant Garamond', fontSize: 26, fontStyle: 'italic', color: cur.text}}>Поддержать проект</h3>
                   <p style={{fontSize: 14, lineHeight: 1.5, opacity: 0.8, marginBottom: 20, color: cur.text}}>На оплату серверов и дальнейшее развитие проекта. Спасибо, что помогаете сохранять это место тишины.</p>
                   <div style={{marginBottom: 25}}><div style={{background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10}}><span style={{fontSize: 15, fontFamily: 'monospace', fontWeight: 'bold', color: cur.text}}>42301810500073862125</span><button onClick={() => handleCopy("42301810500073862125")} style={{background: 'none', border: 'none', color: cur.primary}}>{copied ? <Check size={20}/> : <Copy size={20}/>}</button></div></div>
               </motion.div>
           </div>
           )}

           {modalMode === 'settings' && (
           <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
               <motion.div initial={{x:100}} animate={{x:0}} style={{background: isDark ? '#171717' : 'white', color: isDark ? 'white' : '#1A1A1A', width: '90%', maxWidth: 360, height: '100%', padding: '40px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                   <div style={{display:'flex', alignItems:'center', gap:15, marginBottom: 30}}>
                       <div style={{width: 60, height: 60, borderRadius: '50%', background: cur.primary, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:24, fontWeight:'bold'}}>{user.displayName ? user.displayName[0] : 'A'}</div>
                       <div>
                           {isEditingName ? (
                               <div style={{display:'flex', alignItems:'center', gap:8}}>
                                   <input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: '8px', borderRadius: 8, fontSize: 16, width: 140, color: cur.text}} autoFocus />
                                   <button onClick={handleUpdateName} style={{background: cur.primary, color:'white', border:'none', borderRadius: 8, padding: 8}}><Check size={16}/></button>
                               </div>
                           ) : (
                               <h2 style={{margin:0, fontSize:22, display:'flex', alignItems:'center', gap: 8}}>{user.displayName}<button onClick={() => { setEditNameValue(user.displayName); setIsEditingName(true); }} style={{background:'none', border:'none', opacity:0.5, cursor:'pointer'}}><User size={16} color={cur.text}/></button></h2>
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
                           {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map((d, i) => (
                               <div key={i} style={{fontSize: 10, textAlign: 'center', opacity: 0.4, marginBottom: 5}}>{d}</div>
                           ))}
                           {getDaysInMonth().map(day => {
                               const d = new Date();
                               const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${day}`;
                               const isActive = userStats.history && userStats.history[dateKey];
                               const isFuture = day > d.getDate();
                               
                               return (
                                   <div key={day} style={{
                                       aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold',
                                       background: isActive ? cur.primary : isFuture ? 'transparent' : isDark?'rgba(255,255,255,0.05)':'#f1f5f9',
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
                               const isUnlocked = userStats.streak >= parseInt(Object.keys(MEDALS).find(k => MEDALS[k] === medal));
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
                               <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                                   <div style={{width: 40, height: 40, borderRadius: 12, background: THEMES[t].bg, backgroundColor: THEMES[t].fallback, backgroundSize:'cover', border: theme === t ? `2px solid ${cur.text}` : '2px solid transparent'}}/>
                                   <span style={{fontSize: 10, opacity: 0.7, fontWeight: theme === t ? 'bold' : 'normal'}}>{THEMES[t].name}</span>
                               </div>
                           ))}
                       </div>
                       {user.email === ADMIN_EMAIL && <Button onClick={uploadDevotionalsToDB} theme={cur} style={{marginBottom: 10}} icon={<UploadCloud size={18} />}>ADMIN: Загрузить Слово</Button>}
                       <Button onClick={() => setModalMode('donate')} theme={cur} style={{marginBottom: 10}} icon={<Heart size={18} fill={cur.primary} color={cur.primary} />}>Поддержать проект</Button>
                       <Button onClick={() => setModalMode('feedback')} theme={cur} style={{marginBottom: 10}} icon={<MessageSquare size={18}/>}>Написать разработчику</Button>
                       <Button onClick={() => setModalMode('about')} theme={cur} style={{marginBottom: 10}} icon={<Info size={18}/>}>О приложении</Button>
                       <Button onClick={logout} theme={cur} style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)'}} icon={<LogOut size={18}/>}>Выйти</Button>
                   </div>
               </motion.div>
           </div>
           )}

           {modalMode === 'about' && (
               <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.95)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}} onClick={closeModal}>
                   <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 350, borderRadius: 30, padding: 30}} onClick={e => e.stopPropagation()}>
                       <button onClick={closeModal} style={{position:'absolute', top:20, right:20, background:'none', border:'none'}}><X size={24} color={isDark?'white':'#333'}/></button>
                       <h2 style={{fontFamily: 'Cormorant Garamond', fontSize: 32, fontStyle: 'italic', color: cur.primary, marginBottom: 10}}>Amen.</h2>
                       <p style={{fontSize: 14, lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#4b5563', marginBottom: 20}}>Это приложение — ваш инструмент для осознанной духовной жизни. Здесь нет алгоритмов и лайков. Только вы и ваши мысли.</p>
                       <div style={{marginBottom: 20}}>
                           <h4 style={{fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: cur.primary, marginBottom: 8}}>Как это работает</h4>
                           <ul style={{fontSize: 13, lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#4b5563', paddingLeft: 20, margin: 0}}>
                               <li style={{marginBottom: 5}}><b>Дневник:</b> Личные молитвы и фокус дня.</li>
                               <li style={{marginBottom: 5}}><b>Слово:</b> Ежедневное вдохновение.</li>
                               <li style={{marginBottom: 5}}><b>Список:</b> Ваши молитвенные нужды и трекер.</li>
                               <li style={{marginBottom: 5}}><b>Единство:</b> Анонимная поддержка других.</li>
                               <li style={{marginBottom: 5}}><b>Чудеса:</b> Архив ответов.</li>
                               <li><b>Огонь:</b> Символ вашей дисциплины.</li>
                           </ul>
                       </div>
                       <div style={{textAlign:'center', fontSize: 11, opacity: 0.4, color: isDark ? 'white' : 'black'}}>Версия 2.9</div>
                   </motion.div>
               </div>
           )}

           {modalMode === 'music' && (
           <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
               <div style={{background: theme === 'noir' ? '#171717' : (isDark ? '#1e293b' : 'white'), borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30}} onClick={e=>e.stopPropagation()}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                       <h3 style={{margin:0, fontSize:20, color:cur.text}}>Музыка души</h3>
                       <button onClick={closeModal}><X size={24} color={cur.text}/></button>
                   </div>
                   <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:'40vh', overflowY:'auto'}}>
                       {TRACKS.map((track, i) => (
                       <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{background: i===currentTrackIndex ? cur.primary : 'rgba(0,0,0,0.05)', color: i===currentTrackIndex ? (theme === 'noir' ? 'black' : 'white') : cur.text, border:'none', padding:15, borderRadius:12, textAlign:'left', fontWeight:'bold'}}>{track.title}</button>
                       ))}
                   </div>
                   <div style={{display:'flex', justifyContent:'center', gap: 30, marginTop: 30, alignItems:'center'}}>
                       <button onClick={prevTrack} style={{background:'none', border:'none'}}><SkipBack size={32} color={cur.text}/></button>
                       <button onClick={() => setIsPlaying(!isPlaying)} style={{background: cur.primary, border:'none', borderRadius:'50%', width: 64, height: 64, display:'flex', alignItems:'center', justifyContent:'center', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'}}>{isPlaying ? <Pause size={32} fill="white"/> : <Play size={32} fill="white" style={{marginLeft:4}}/>}</button>
                       <button onClick={nextTrack} style={{background:'none', border:'none'}}><SkipForward size={32} color={cur.text}/></button>
                   </div>
               </div>
           </div>
           )}
       </>
   );
};

export default AmenApp;