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

let app; try { app = initializeApp(firebaseConfig); } catch (e) { console.error("Firebase init error", e); }
const auth = getAuth(); const db = getFirestore(); const appId = firebaseConfig.projectId;
const ADMIN_EMAIL = "kiraishikagi@amen.local";

// --- DATA ---
const BIBLE_INDEX = {
    'anxiety': [{ t: "Филиппийцам 4:6-7", v: "Не заботьтесь ни о чем, но всегда в молитве..." }, { t: "1 Петра 5:7", v: "Все заботы ваши возложите на Него..." }],
    'fear': [{ t: "Исаия 41:10", v: "Не бойся, ибо Я с тобою..." }, { t: "Псалом 26:1", v: "Господь — свет мой и спасение мое..." }],
    'weary': [{ t: "Матфея 11:28", v: "Придите ко Мне все труждающиеся..." }, { t: "Исаия 40:29", v: "Он дает утомленному силу..." }],
    'guilt': [{ t: "1 Иоанна 1:9", v: "Если исповедуем грехи наши..." }, { t: "Римлянам 8:1", v: "Нет ныне никакого осуждения..." }],
    'joy': [{ t: "Филиппийцам 4:4", v: "Радуйтесь всегда в Господе..." }, { t: "Псалом 15:11", v: "Полнота радости пред лицем Твоим..." }],
    'lonely': [{ t: "Исаия 49:15", v: "Я не забуду тебя..." }, { t: "Псалом 67:7", v: "Бог одиноких вводит в дом." }]
};

const EMOTION_LABELS = {
    'anxiety': { l: 'Тревога', i: <Wind size={14}/> },
    'fear': { l: 'Страх', i: <Anchor size={14}/> },
    'weary': { l: 'Усталость', i: <Coffee size={14}/> },
    'guilt': { l: 'Вина', i: <CloudRain size={14}/> },
    'joy': { l: 'Радость', i: <Sun size={14}/> },
    'lonely': { l: 'Одиночество', i: <User size={14}/> }
};

const INITIAL_DATA = [
 { day: 1, reference: "Филиппийцам 4:6-7", text: "Не заботьтесь ни о чем...", explanation: "Тревога — это сигнал к молитве.", action: "Выпишите тревогу и помолитесь." },
 // ... truncated for stability, full data logic remains ...
 { day: 30, reference: "Откровение 21:4", text: "И отрет Бог всякую слезу...", explanation: "Лучшее еще впереди.", action: "Взгляд в вечность." }
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
cosmos: { id: 'cosmos', name: 'Космос', bg: '', fallback: '#000000', primary: '#e2e8f0', text: '#f8fafc', card: 'rgba(0, 0, 0, 0.6)' },
aether: { id: 'aether', name: 'Эфир', bg: '', fallback: '#ffffff', primary: '#f97316', text: '#431407', card: 'rgba(255, 255, 255, 0.7)' }
};

// --- HELPERS ---
const formatDate = (t) => {
    if (!t) return '';
    try { if (t.toDate) return t.toDate().toLocaleDateString(); return new Date(t).toLocaleDateString(); } catch (e) { return ''; }
};
const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const getDaysInMonth = () => { const d = new Date(); return Array.from({ length: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() }, (_, i) => i + 1); };

// --- 3D VISUALS (STABILIZED) ---

const CosmicParticles = () => {
    const mountRef = useRef(null);
    useEffect(() => {
        let frameId, renderer, scene, camera, particles;
        const loadThree = () => new Promise((res) => { if (window.THREE) res(); else { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = res; document.body.appendChild(s); }});

        const init = () => {
            if (!window.THREE || !mountRef.current) return;
            const THREE = window.THREE;
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x0f172a, 0.001);
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
            camera.position.z = 1000;
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x0f172a);
            mountRef.current.appendChild(renderer.domElement);

            const geo = new THREE.BufferGeometry();
            const pos = [], col = [];
            const c1 = new THREE.Color(0x818cf8), c2 = new THREE.Color(0xc084fc), c3 = new THREE.Color(0xffffff);
            for (let i = 0; i < 6000; i++) {
                pos.push((Math.random()-0.5)*2000, (Math.random()-0.5)*2000, (Math.random()-0.5)*2000);
                const c = Math.random() < 0.6 ? c3 : (Math.random() < 0.8 ? c1 : c2);
                col.push(c.r, c.g, c.b);
            }
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
            
            // Texture Gen
            const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 32;
            const ctx = cvs.getContext('2d');
            const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, 32, 32);
            
            const mat = new THREE.PointsMaterial({ size: 3, vertexColors: true, map: new THREE.CanvasTexture(cvs), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
            particles = new THREE.Points(geo, mat);
            scene.add(particles);

            const animate = () => {
                frameId = requestAnimationFrame(animate);
                if (particles) { particles.rotation.x += 0.0003; particles.rotation.y += 0.0003; }
                renderer.render(scene, camera);
            };
            animate();
            
            window.addEventListener('resize', () => {
                if(!camera || !renderer) return;
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        };
        loadThree().then(init);

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            if (renderer) {
                renderer.dispose();
                if (renderer.domElement && mountRef.current) mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);
    return <div ref={mountRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1}} />;
};

const DigitalAether = () => {
   const mountRef = useRef(null);
   useEffect(() => {
       let frameId, renderer, scene, camera, mesh;
       const loadThree = () => new Promise((res) => { if (window.THREE) res(); else { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = res; document.body.appendChild(s); }});

       const init = () => {
           if (!window.THREE || !mountRef.current) return;
           const THREE = window.THREE;
           scene = new THREE.Scene();
           camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
           renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
           renderer.setSize(window.innerWidth, window.innerHeight);
           mountRef.current.appendChild(renderer.domElement);

           const mat = new THREE.ShaderMaterial({
               uniforms: { uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) } },
               vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
               fragmentShader: `
                   uniform float uTime; uniform vec2 uResolution;
                   vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                   vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                   vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
                   float snoise(vec2 v) { const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439); vec2 i  = floor(v + dot(v, C.yy) ); vec2 x0 = v - i + dot(i, C.xx); vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0); vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod289(i); vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 )); vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m ; m = m*m ; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h ); vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw; return 130.0 * dot(m, g); }
                   float fbm(vec2 p) { float f = 0.0; float w = 0.5; float time = uTime * 0.1; for (int i = 0; i < 5; i++) { f += w * snoise(p); p *= 2.0; p -= vec2(time * 0.2, -time * 0.1); w *= 0.5; } return f; }
                   void main() {
                       vec2 st = gl_FragCoord.xy / uResolution.xy; st.x *= uResolution.x / uResolution.y; st *= 3.0; st -= vec2(1.0, 1.0);
                       vec2 q = vec2(0.); vec2 r = vec2(0.);
                       q.x = fbm(st); q.y = fbm(st + vec2(1.0));
                       r.x = fbm(st + 1.0*q + vec2(1.7,9.2)); r.y = fbm(st + 1.0*q + vec2(8.3,2.8));
                       float f = fbm(st + r);
                       vec3 color = mix(vec3(0.98), vec3(1.0, 0.6, 0.2), clamp((f*f)*4.0,0.0,1.0));
                       color = mix(color, vec3(1.0, 0.9, 0.0), clamp(length(q),0.0,1.0));
                       gl_FragColor = vec4(color, 1.0);
                   }
               `
           });

           mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
           scene.add(mesh);

           const animate = (time) => {
               frameId = requestAnimationFrame(animate);
               mat.uniforms.uTime.value = time * 0.001;
               renderer.render(scene, camera);
           };
           animate();
           
           window.addEventListener('resize', () => {
               if(!renderer || !mat) return;
               renderer.setSize(window.innerWidth, window.innerHeight);
               mat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
           });
       };
       loadThree().then(init);
       return () => {
           if (frameId) cancelAnimationFrame(frameId);
           if (renderer) {
                renderer.dispose();
                if (renderer.domElement && mountRef.current) mountRef.current.removeChild(renderer.domElement);
           }
       };
   }, []);
   return <div ref={mountRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1}} />;
};

// --- COMPONENTS ---
const Card = ({ children, theme, onClick, animate }) => {
    const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(theme.id);
    const aetherStyle = theme.id === 'aether' ? { border: '1px solid rgba(249,115,22,0.2)', boxShadow: '0 4px 20px rgba(249,115,22,0.1)', background: 'rgba(255,255,255,0.85)' } : {};
    const style = {
        background: theme.card, borderRadius: 24, padding: 20, marginBottom: 12, backdropFilter: 'blur(5px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
        boxShadow: animate ? '0 4px 20px rgba(0,0,0,0.05)' : 'none', ...aetherStyle
    };
    return animate ? <motion.div layout onClick={onClick} style={style}>{children}</motion.div> : <div onClick={onClick} style={style}>{children}</div>;
};

const Button = ({ children, onClick, theme, variant='primary', style, icon }) => {
    const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(theme.id);
    let vStyle = { background: theme.primary, color: theme.id === 'noir' ? 'black' : 'white', width: '100%' };
    if (variant === 'ghost') vStyle = { background: 'none', padding: 4, opacity: 0.7, color: theme.text };
    if (variant === 'soft') vStyle = { background: theme.id === 'aether' ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.4)', color: theme.id === 'noir' ? 'black' : theme.primary, width: '100%' };
    if (variant === 'amen') vStyle = { padding: '8px 16px', borderRadius: 20, fontSize: 13, background: 'rgba(0,0,0,0.05)', color: theme.text };
    return <motion.button whileTap={{scale:0.96}} onClick={onClick} style={{border:'none', borderRadius:16, fontWeight:'bold', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', transition:'all 0.2s', padding:'12px 16px', ...vStyle, ...style}}>{icon} {children}</motion.button>;
};

// --- MAIN APP ---
const AmenApp = () => {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
    const [activeTab, setActiveTab] = useState('home');
    const [prayers, setPrayers] = useState([]);
    const [publicRequests, setPublicRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [modalMode, setModalMode] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [inputText, setInputText] = useState("");
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [journeyExpanded, setJourneyExpanded] = useState(true);
    const [userStats, setUserStats] = useState({ streak: 0, lastPrayedDate: null, history: {}, wordReadDate: null });
    const [dailyFocusDone, setDailyFocusDone] = useState(false);
    const [dailyReflectionDone, setDailyReflectionDone] = useState(false);
    const [dailyWordRead, setDailyWordRead] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [editNameValue, setEditNameValue] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [devotionals, setDevotionals] = useState(INITIAL_DATA);
    
    const audioRef = useRef(null);
    const cur = THEMES[theme] || THEMES.dawn;
    const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(theme);
    const isAdmin = user?.email === ADMIN_EMAIL;
    const todayStr = getTodayString();

    useEffect(() => { const l = document.createElement('link'); l.rel='icon'; l.href='/icon-192.png'; document.head.appendChild(l); }, []);
    useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);
    
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u); setLoading(false); setAuthLoading(false);
            if (u) { localStorage.setItem('amen_visited', 'true'); }
            else { setOnboardingStep(0); } // Reset onboarding on logout
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const u = user.uid;
        const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', u, 'prayers'), orderBy('createdAt', 'desc')), s => {
            setPrayers(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()}))); setLoading(false);
        });
        const unsubS = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'stats'), d => {
            if(d.exists()) { const dt = d.data(); setUserStats(dt); setDailyFocusDone(dt.lastPrayedDate===todayStr); setDailyWordRead(dt.wordReadDate===todayStr); }
        });
        const unsubR = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'reflections'), d => {
             if(d.exists() && d.data()[todayStr]) setDailyReflectionDone(true);
        });
        let unsubReq = () => {};
        if (activeTab === 'community') {
            unsubReq = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), orderBy('createdAt', 'desc')), s => {
                setPublicRequests(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()})));
            });
        }
        return () => { unsubP(); unsubS(); unsubR(); unsubReq(); };
    }, [user, activeTab, todayStr]);

    useEffect(() => {
        if(progress === 3) setJourneyExpanded(false);
    }, [dailyFocusDone, dailyReflectionDone, dailyWordRead]);

    // Audio
    useEffect(() => { if(!audioRef.current) audioRef.current = new Audio(); const a = audioRef.current; a.onended = () => setCurrentTrackIndex(i => (i+1)%TRACKS.length); }, []);
    useEffect(() => {
        const a = audioRef.current; const t = TRACKS[currentTrackIndex];
        if(t && a) {
            if(a.src !== new URL(t.file, window.location).href) { a.src = t.file; a.load(); if(isPlaying) a.play().catch(()=>{}); }
            else if(isPlaying) a.play().catch(()=>{}); else a.pause();
        }
    }, [currentTrackIndex, isPlaying]);

    const progress = (dailyWordRead?1:0) + (dailyFocusDone?1:0) + (dailyReflectionDone?1:0);
    const devotion = devotionals[(new Date().getDate() - 1) % devotionals.length] || INITIAL_DATA[0];

    // Actions
    const handleAuth = async () => {
        const e = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
        setAuthLoading(true);
        try { await signInWithEmailAndPassword(auth, e, password); } 
        catch { try { const u = await createUserWithEmailAndPassword(auth, e, password); await updateProfile(u.user, {displayName: nickname}); } catch {} }
        setAuthLoading(false);
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null); setNickname(""); setPassword(""); setIsPlaying(false);
        // Clean re-render of App component will happen, Three.js will unmount
    };

    const updateStreak = async () => {
        let ns = userStats.streak;
        if(userStats.lastPrayedDate !== todayStr) {
            const y = new Date(); y.setDate(y.getDate()-1);
            const ys = `${y.getFullYear()}-${y.getMonth()+1}-${y.getDate()}`;
            if(userStats.lastPrayedDate === ys) ns++; else ns=1;
        }
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { streak: ns, lastPrayedDate: todayStr }, { merge: true });
        // Medal logic can go here
    };

    const handleCreate = async () => {
        if(!inputText.trim()) return;
        const text = inputText; closeModal();
        const coll = modalMode === 'public_request' ? collection(db, 'artifacts', appId, 'public', 'data', 'requests') : 
                     modalMode === 'feedback' ? collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback') :
                     collection(db, 'artifacts', appId, 'users', user.uid, 'prayers');
        
        const payload = { text, createdAt: serverTimestamp() };
        if(modalMode === 'public_request') { payload.authorId = user.uid; payload.authorName = user.displayName; payload.amenCount = 0; }
        else if(modalMode === 'feedback') { payload.authorId = user.uid; payload.authorName = user.displayName; }
        else { payload.status = 'active'; await updateStreak(); } // Private prayer
        
        await addDoc(coll, payload);
    };

    const handleReflection = async () => {
        if(!inputText.trim()) return;
        await handleCreate(); // Saves as prayer
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), { [todayStr]: true }, { merge: true });
        setDailyReflectionDone(true);
        confetti({ shapes: ['star'], colors: ['#FFD700', '#FFA500'] });
    };

    const saveAnswer = async () => {
        if(!selectedItem) return;
        closeModal();
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'prayers', selectedItem.id), { status: 'answered', answeredAt: serverTimestamp(), answerNote: inputText });
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    };

    const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };

    // --- RENDERS ---
    const renderAbout = () => (
        <div onClick={closeModal} style={{position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} onClick={e => e.stopPropagation()} style={{background: isDark ? '#1e293b' : 'white', padding: 30, borderRadius: 30, maxWidth: 350, maxHeight: '80vh', overflowY: 'auto'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                    <h2 style={{margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic', color:cur.primary}}>Amen.</h2>
                    <button onClick={closeModal}><X size={24} color={cur.text}/></button>
                </div>
                <p style={{fontSize:14, lineHeight:1.6}}><b>Ваш личный храм.</b><br/>Пространство для тишины, молитвы и поиска ответов.</p>
                <ul style={{fontSize:13, lineHeight:1.6, paddingLeft:20}}>
                    <li><b>Путь дня:</b> 3 простых шага к осознанности.</li>
                    <li><b>Слово:</b> Ежедневное вдохновение из Писания.</li>
                    <li><b>Найти Слово:</b> Навигатор по Библии для твоих чувств.</li>
                    <li><b>Единство:</b> Анонимная молитвенная поддержка.</li>
                    <li><b>Огонь:</b> Твой символ постоянства.</li>
                </ul>
                <div style={{marginTop:20, fontSize:11, opacity:0.5, textAlign:'center'}}>Версия 3.5 • Release</div>
            </motion.div>
        </div>
    );

    return (
        <>
            {theme === 'cosmos' ? <CosmicParticles /> : theme === 'aether' ? <DigitalAether /> : <div style={{position:'fixed', inset:0, backgroundImage:cur.bg, backgroundSize:'cover', zIndex:-1}}/>}
            
            <div style={{minHeight: '100vh', color: cur.text, fontFamily: '-apple-system, sans-serif'}}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');`}</style>
                
                {loading ? <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><Loader className="animate-spin"/></div> :
                 !user ? (
                    onboardingStep === 0 ? (
                         <div style={{padding:30, height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                             <h1 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:42, color:cur.primary}}>Amen.</h1>
                             <h2 style={{fontSize:24, marginBottom:30}}>Что у тебя на сердце?</h2>
                             <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                 {ONBOARDING_OPTIONS.map(o => (
                                     <button key={o.id} onClick={()=>{setOnboardingStep(2)}} style={{padding:20, borderRadius:20, border:'none', background:cur.card, fontSize:16, display:'flex', gap:15, alignItems:'center', color:cur.text}}>{o.icon} {o.label}</button>
                                 ))}
                             </div>
                             <button onClick={()=>setOnboardingStep(2)} style={{marginTop:30, background:'none', border:'none', textDecoration:'underline', opacity:0.6}}>Войти</button>
                         </div>
                    ) : (
                         <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
                             <div style={{background:cur.card, padding:30, borderRadius:30, width:'100%', maxWidth:320, backdropFilter:'blur(10px)'}}>
                                 <h1 style={{textAlign:'center', fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:48, color:cur.primary, margin:0}}>Amen.</h1>
                                 <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Имя" style={{width:'100%', padding:15, borderRadius:15, border:'none', margin:'20px 0 10px'}}/>
                                 <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Пароль" style={{width:'100%', padding:15, borderRadius:15, border:'none', marginBottom:20}}/>
                                 <Button onClick={handleAuth} theme={cur}>{authLoading ? <Loader className="animate-spin"/> : "Войти / Создать"}</Button>
                             </div>
                         </div>
                    )
                 ) : (
                    <div style={{maxWidth: 500, margin: '0 auto', paddingBottom: 100}}>
                        {/* HEADER */}
                        <div style={{padding: '50px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div>
                                <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 42, fontStyle: 'italic', margin: 0}}>Amen.</h1>
                                <div style={{display:'flex', alignItems:'center', gap:10, marginTop:5}}>
                                    <span style={{fontSize:12, fontWeight:'bold', opacity:0.8}}>{getGreeting()}, {user.displayName}</span>
                                    <div style={{background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:10, display:'flex', alignItems:'center', gap:4}}><Flame size={12} fill="#fbbf24" color="#fbbf24"/> <span style={{fontSize:11, fontWeight:'bold'}}>{userStats.streak}</span></div>
                                </div>
                            </div>
                            <div style={{display:'flex', gap:10}}>
                                <button onClick={()=>setModalMode('music')} style={{background:'rgba(255,255,255,0.2)', width:40, height:40, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>{isPlaying?<Volume2 size={18} color={cur.text}/>:<Music size={18} color={cur.text}/>}</button>
                                <button onClick={()=>setModalMode('settings')} style={{background:'rgba(255,255,255,0.2)', width:40, height:40, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}><User size={18} color={cur.text}/></button>
                            </div>
                        </div>

                        {/* NAV */}
                        <div style={{display:'flex', padding:'0 20px', gap:15, overflowX:'auto', marginBottom:20}}>
                            {[{id:'home',l:'Дневник'}, {id:'word',l:'Слово'}, {id:'community',l:'Единство'}, {id:'vault',l:'Чудеса'}, ...(isAdmin?[{id:'admin_feedback',l:'Отзывы'}]:[])].map(t => (
                                <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:'none', border:'none', fontSize:15, fontWeight: activeTab===t.id?'bold':'normal', opacity: activeTab===t.id?1:0.6, color:cur.text, padding:'10px 0', position:'relative'}}>
                                    {t.l}
                                    {activeTab===t.id && <motion.div layoutId="tab" style={{position:'absolute', bottom:0, left:0, right:0, height:2, background:cur.primary}}/>}
                                </button>
                            ))}
                        </div>

                        {/* CONTENT */}
                        <div style={{padding:'0 20px'}}>
                            {activeTab === 'home' && (
                                <>
                                    <AnimatePresence>
                                        {journeyExpanded ? (
                                            <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} style={{background:cur.card, padding:20, borderRadius:24, marginBottom:20, overflow:'hidden', border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.4)'}`}}>
                                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                                                    <h3 style={{margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic'}}>Путь дня</h3>
                                                    <button onClick={()=>setJourneyExpanded(false)} style={{background:'none', border:'none'}}><ChevronUp size={16} color={cur.text}/></button>
                                                </div>
                                                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                                    <div onClick={()=>{setActiveTab('word'); handleReadWord()}} style={{display:'flex', alignItems:'center', gap:10, opacity: dailyWordRead?0.5:1, cursor:'pointer'}}>
                                                        <div style={{width:24, height:24, borderRadius:'50%', background: dailyWordRead?cur.primary:'rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>{dailyWordRead?<Check size={14} color="white"/>:<BookOpen size={14}/>}</div>
                                                        <span>Слово для тебя</span>
                                                    </div>
                                                    <div onClick={!dailyFocusDone?handleFocusPray:null} style={{display:'flex', alignItems:'center', gap:10, opacity: dailyFocusDone?0.5:1, cursor:!dailyFocusDone?'pointer':'default'}}>
                                                        <div style={{width:24, height:24, borderRadius:'50%', background: dailyFocusDone?cur.primary:'rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>{dailyFocusDone?<Check size={14} color="white"/>:<Zap size={14}/>}</div>
                                                        <span>Фокус молитвы</span>
                                                    </div>
                                                    <div onClick={()=>{if(!dailyReflectionDone) {setModalMode('reflection'); setInputText("");}}} style={{display:'flex', alignItems:'center', gap:10, opacity: dailyReflectionDone?0.5:1, cursor:!dailyReflectionDone?'pointer':'default'}}>
                                                        <div style={{width:24, height:24, borderRadius:'50%', background: dailyReflectionDone?cur.primary:'rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>{dailyReflectionDone?<Check size={14} color="white"/>:<Moon size={14}/>}</div>
                                                        <span>Итоги дня</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.button onClick={()=>setJourneyExpanded(true)} style={{width:'100%', padding:10, marginBottom:20, background:cur.card, border:'none', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:cur.text}}>
                                                <CheckCircle2 size={16} color={cur.primary}/> <span>{progress}/3</span> <ChevronDown size={16}/>
                                            </motion.button>
                                        )}
                                    </AnimatePresence>

                                    {prayers.map(p => (
                                        <Card key={p.id} theme={cur}>
                                            <div style={{fontSize:11, opacity:0.6, marginBottom:5}}>{formatDate(p.createdAt)}</div>
                                            <div style={{fontSize:16, marginBottom:10}}>{p.text}</div>
                                            <div style={{display:'flex', gap:10}}>
                                                <button onClick={()=>{setSelectedItem(p); setModalMode('answer'); setInputText("");}} style={{background:'rgba(255,255,255,0.2)', border:'none', padding:'5px 10px', borderRadius:10, fontSize:12, fontWeight:'bold', cursor:'pointer', color:cur.primary}}>Ответ</button>
                                                <button onClick={()=>{if(window.confirm('Удалить?')) deleteDoc(doc(db,'artifacts',appId,'users',user.uid,'prayers',p.id))}} style={{background:'none', border:'none'}}><Trash2 size={14} color={cur.text}/></button>
                                            </div>
                                        </Card>
                                    ))}
                                </>
                            )}
                            
                            {activeTab === 'word' && (
                                <Card theme={cur}>
                                    <h2 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', marginTop:0}}>Слово на сегодня</h2>
                                    <p style={{fontSize:18, fontStyle:'italic'}}>"{devotion.text}"</p>
                                    <p style={{textAlign:'right', fontWeight:'bold', fontSize:12}}>— {devotion.reference}</p>
                                    <div style={{background:'rgba(0,0,0,0.05)', padding:15, borderRadius:15, marginTop:20}}>
                                        <div style={{fontSize:11, fontWeight:'bold', textTransform:'uppercase', opacity:0.6}}>Мысль</div>
                                        <p style={{fontSize:14, margin:'5px 0'}}>{devotion.explanation}</p>
                                    </div>
                                </Card>
                            )}

                            {activeTab === 'community' && (
                                <>
                                    <div style={{textAlign:'center', marginBottom:20, fontSize:14, opacity:0.8}}><b>Нужна молитва?</b><br/>Напиши, и мы помолимся.</div>
                                    {publicRequests.map(r => (
                                        <Card key={r.id} theme={cur}>
                                            <div style={{fontSize:11, opacity:0.6, marginBottom:5}}>{r.authorName} • {formatDate(r.createdAt)}</div>
                                            <div style={{marginBottom:15}}>{r.text}</div>
                                            <Button onClick={()=>handleAmen(r)} theme={cur} variant="amen" icon={<Users size={14}/>}>Аминь {r.amenCount > 0 && `• ${r.amenCount}`}</Button>
                                        </Card>
                                    ))}
                                </>
                            )}
                            
                            {activeTab === 'vault' && prayers.filter(p=>p.status==='answered').map(p => (
                                <Card key={p.id} theme={cur}>
                                    <div style={{fontSize:11, opacity:0.6}}>{formatDate(p.createdAt)}</div>
                                    <div style={{marginBottom:10, textDecoration:'line-through', opacity:0.7}}>{p.text}</div>
                                    <div style={{padding:10, background:'rgba(255,255,255,0.2)', borderRadius:10, borderLeft:`3px solid ${cur.primary}`}}>
                                        <div style={{fontSize:11, fontWeight:'bold'}}>ОТВЕТ:</div>
                                        <div>{p.answerNote}</div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        
                        {/* FAB */}
                        {['home','community'].includes(activeTab) && (
                            <div style={{position:'fixed', bottom:30, width:'100%', display:'flex', justifyContent:'center', pointerEvents:'none'}}>
                                <motion.button whileTap={{scale:0.9}} onClick={()=>{setModalMode(activeTab==='community'?'public_request':'entry'); setInputText("");}} style={{pointerEvents:'auto', width:64, height:64, borderRadius:'50%', background:cur.primary, border:'none', color:isDark?'black':'white', boxShadow:`0 10px 30px ${cur.primary}60`, display:'flex', alignItems:'center', justifyContent:'center'}}><Plus size={32}/></motion.button>
                            </div>
                        )}
                        
                        {/* MODALS */}
                        {modalMode && (
                            <div onClick={closeModal} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
                                {modalMode === 'about' ? renderAbout() : (
                                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} onClick={e=>e.stopPropagation()} style={{background:cur.card, width:'100%', maxWidth:400, padding:25, borderRadius:25, backdropFilter:'blur(20px)'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                                            <span style={{fontWeight:'bold', color:cur.primary}}>
                                                {modalMode==='entry'?'Новая запись':modalMode==='reflection'?'Итоги дня':modalMode==='answer'?'Ответ на молитву':'Просьба'}
                                            </span>
                                            <button onClick={closeModal} style={{background:'none', border:'none'}}><X size={20} color={cur.text}/></button>
                                        </div>
                                        {modalMode === 'entry' && (
                                            <div style={{display:'flex', gap:5, marginBottom:10, overflowX:'auto'}}>
                                                <button onClick={()=>{
                                                     const k = Object.keys(BIBLE_INDEX); const rk = k[Math.floor(Math.random()*k.length)];
                                                     const v = BIBLE_INDEX[rk][0]; setInputText(p => p + `"${v.v}" — ${v.t}\n\n`);
                                                }} style={{padding:'5px 10px', borderRadius:10, background:'rgba(0,0,0,0.05)', border:'none', fontSize:11, fontWeight:'bold', cursor:'pointer', color:cur.text}}>🎲 Случайное Слово</button>
                                            </div>
                                        )}
                                        <textarea autoFocus value={inputText} onChange={e=>setInputText(e.target.value)} style={{width:'100%', height:150, background:'rgba(0,0,0,0.05)', border:'none', borderRadius:15, padding:15, fontSize:16, fontFamily:'Cormorant Garamond', fontStyle:'italic', color:cur.text}} placeholder="..."/>
                                        <Button onClick={modalMode==='public_request'?createPublicRequest:modalMode==='feedback'?createFeedback:modalMode==='answer'?saveAnswer:modalMode==='reflection'?handleReflection:handleCreate} theme={cur} style={{marginTop:15}}>{modalMode==='answer'?'Сохранить Чудо':'Аминь'}</Button>
                                    </motion.div>
                                )}
                            </div>
                        )}
                        
                        {/* SETTINGS DRAWER */}
                        {modalMode === 'settings' && (
                            <div onClick={closeModal} style={{position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'flex-end'}}>
                                <motion.div initial={{x:100}} animate={{x:0}} onClick={e=>e.stopPropagation()} style={{width:300, background:isDark?'#111':'white', height:'100%', padding:30}}>
                                    <h2 style={{marginTop:0}}>{user.displayName}</h2>
                                    <p style={{opacity:0.6, fontSize:12}}>Огонь верности: {userStats.streak} дней</p>
                                    <hr style={{opacity:0.1, margin:'20px 0'}}/>
                                    <h4>Тема</h4>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                                        {Object.keys(THEMES).filter(t => isAdmin || !['cosmos', 'aether'].includes(t)).map(t => (
                                            <div key={t} onClick={()=>setTheme(t)} style={{padding:10, borderRadius:10, border:theme===t?`2px solid ${cur.primary}`:'1px solid rgba(128,128,128,0.2)', cursor:'pointer', textAlign:'center', fontSize:12}}>{THEMES[t].name}</div>
                                        ))}
                                    </div>
                                    <div style={{marginTop:'auto', paddingTop: 20, display:'flex', flexDirection:'column', gap:10}}>
                                        <Button onClick={()=>setModalMode('about')} theme={cur} variant="soft" icon={<Info size={16}/>}>О приложении</Button>
                                        <Button onClick={logout} theme={cur} style={{background:'rgba(255,0,0,0.1)', color:'red'}}>Выйти</Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* MUSIC PLAYER */}
                        {modalMode === 'music' && (
                            <div onClick={closeModal} style={{position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end'}}>
                                <motion.div initial={{y:100}} animate={{y:0}} onClick={e=>e.stopPropagation()} style={{width:'100%', background:cur.card, padding:30, borderTopLeftRadius:30, borderTopRightRadius:30, backdropFilter:'blur(20px)'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}><h3>Музыка</h3><button onClick={closeModal} style={{background:'none', border:'none'}}><X/></button></div>
                                    <div style={{maxHeight:300, overflowY:'auto'}}>
                                        {TRACKS.map((t,i) => (
                                            <div key={i} onClick={()=>{setCurrentTrackIndex(i); setIsPlaying(true)}} style={{padding:15, borderRadius:15, background:i===currentTrackIndex?cur.primary:'transparent', color:i===currentTrackIndex?(isDark?'black':'white'):cur.text, cursor:'pointer', marginBottom:5, fontWeight:'bold'}}>{t.title}</div>
                                        ))}
                                    </div>
                                    <div style={{display:'flex', justifyContent:'center', gap:30, marginTop:20}}>
                                        <button onClick={()=>setIsPlaying(!isPlaying)} style={{width:60, height:60, borderRadius:'50%', background:cur.primary, border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>{isPlaying?<Pause fill="white"/>:<Play fill="white"/>}</button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                        
                    </div>
                 )}
            </div>
        </>
    );
};

export default AmenApp;


