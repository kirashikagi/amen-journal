import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Wind, Music, Volume2, Trash2, User, X, Loader,
  LogOut, SkipBack, SkipForward, Play, Pause,
  Heart, Moon, Flame, Crown, Sparkles, Zap, CheckCircle2, Info, ChevronRight, ChevronUp, ChevronDown, Copy, Check, UploadCloud, Users, MessageSquare, RefreshCw,
  ArrowRight, BookOpen, Search, Compass, Anchor, Frown, Sun, CloudRain, Coffee, Briefcase, HelpCircle, Clock
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from 'firebase/auth';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, getDocs,
  onSnapshot, serverTimestamp, query, increment, orderBy, writeBatch, arrayUnion
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCgOZoeEiiLQAobec0nckBhkXQF5Yxe68k",
  authDomain: "amen-journal.firebaseapp.com",
  projectId: "amen-journal",
  storageBucket: "amen-journal.firebasestorage.app",
  messagingSenderId: "979782042974",
  appId: "1:979782042974:web:b35d08837ee633000ebbcf"
};

// Safe Init
let app, auth, db;
try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) { console.error("Firebase init error", e); }

const ADMIN_EMAIL = "kiraishikagi@amen.local";

// --- 2. HELPERS & UTILS (Defined BEFORE use) ---
const vibrate = (pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

const triggerConfetti = (opts) => {
    if (window.confetti) {
        window.confetti({ ...opts, zIndex: 9999 });
    }
};

const pad = (n) => String(n).padStart(2, '0');

const formatDate = (t) => {
    if (!t) return '';
    try { 
        // Handle Firestore Timestamp
        const date = t.toDate ? t.toDate() : new Date(t);
        if (isNaN(date.getTime())) return '';
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return "Сегодня";
        
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); 
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

const safeStorageGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const safeStorageSet = (key, val) => { try { localStorage.setItem(key, val); } catch {} };

const safeSort = (a, b) => {
  const dateA = a.answeredAt?.seconds || a.createdAt?.seconds || 0;
  const dateB = b.answeredAt?.seconds || b.createdAt?.seconds || 0;
  return dateB - dateA;
};

// --- DATA ---
const BIBLE_INDEX = {
    'anxiety': [
        { t: "Филиппийцам 4:6-7", v: "Не заботьтесь ни о чем, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом." },
        { t: "1 Петра 5:7", v: "Все заботы ваши возложите на Него, ибо Он печется о вас." }
    ],
    'fear': [
        { t: "Исаия 41:10", v: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой." },
        { t: "Псалом 26:1", v: "Господь — свет мой и спасение мое: кого мне бояться?" }
    ],
    'weary': [
        { t: "Матфея 11:28", v: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас." },
        { t: "Исаия 40:29", v: "Он дает утомленному силу, и изнемогшему дарует крепость." }
    ],
    'joy': [
        { t: "Филиппийцам 4:4", v: "Радуйтесь всегда в Господе; и еще говорю: радуйтесь." },
        { t: "Псалом 15:11", v: "Полнота радости пред лицем Твоим, блаженство в деснице Твоей вовек." }
    ],
    'lonely': [
        { t: "Исаия 49:15", v: "Забудет ли женщина грудное дитя свое? .. Но если бы и она забыла, то Я не забуду тебя." },
        { t: "Псалом 67:7", v: "Бог одиноких вводит в дом." }
    ]
};

const EMOTION_LABELS = {
    'anxiety': { l: 'Тревога', i: <Wind size={14}/> },
    'fear': { l: 'Страх', i: <Anchor size={14}/> },
    'weary': { l: 'Усталость', i: <Coffee size={14}/> },
    'joy': { l: 'Радость', i: <Sun size={14}/> },
    'lonely': { l: 'Одиночество', i: <User size={14}/> }
};

const INITIAL_DATA = [
 { day: 1, reference: "Филиппийцам 4:6-7", text: "Не заботьтесь ни о чем...", explanation: "Тревога — это сигнал к молитве. Вместо сценариев катастроф, превратите каждую заботу в просьбу.", action: "Выпишите одну вещь, которая тревожит вас сегодня." },
 { day: 2, reference: "Псалом 22:1", text: "Господь — Пастырь мой...", explanation: "Вы в надежных руках.", action: "Скажите вслух: «Господь восполнит это»." },
 { day: 3, reference: "Иеремия 29:11", text: "Ибо только Я знаю намерения...", explanation: "Даже если сейчас хаос, у Бога есть план.", action: "Поблагодарите Бога за будущее." },
 // Added more purely for fallback robustness
 { day: 4, reference: "Иакова 1:5", text: "Если же у кого из вас недостает мудрости...", explanation: "Вам не нужно гадать. Бог хочет дать вам решение.", action: "Попросите мудрости." }
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
    { title: "Peaceful Prayer", file: "/music/peaceful-prayer.mp3" }
];

const THEMES = {
  dawn: { id: 'dawn', name: 'Рассвет', bg: 'url("/backgrounds/dawn.jpg")', fallback: '#fff7ed', primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.5)' },
  ocean: { id: 'ocean', name: 'Глубина', bg: 'url("/backgrounds/ocean.jpg")', fallback: '#f0f9ff', primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.5)' },
  forest: { id: 'forest', name: 'Эдем', bg: 'url("/backgrounds/forest.jpg")', fallback: '#064e3b', primary: '#4ade80', text: '#f0fdf4', card: 'rgba(6, 78, 59, 0.6)' },
  dusk: { id: 'dusk', name: 'Закат', bg: 'url("/backgrounds/dusk.jpg")', fallback: '#fff7ed', primary: '#c2410c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.5)' },
  night: { id: 'night', name: 'Звезды', bg: 'url("/backgrounds/night.jpg")', fallback: '#1e1b4b', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.5)' },
  noir: { id: 'noir', name: 'Крест', bg: 'url("/backgrounds/noir.jpg")', fallback: '#171717', primary: '#fafafa', text: '#e5e5e5', card: 'rgba(20, 20, 20, 0.7)' },
  cosmos: { id: 'cosmos', name: 'Космос', bg: 'linear-gradient(to bottom, #0f172a, #312e81)', fallback: '#0f172a', primary: '#818cf8', text: '#f8fafc', card: 'rgba(15, 23, 42, 0.6)' },
  aether: { id: 'aether', name: 'Эфир', bg: 'linear-gradient(to bottom, #ffffff, #fff7ed)', fallback: '#ffffff', primary: '#f97316', text: '#431407', card: 'rgba(255, 255, 255, 0.8)' }
};

// --- VISUAL ENGINES (CANVAS 2D) ---
const CosmicEngine = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let animationId;
        const resize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
        
        class Star {
            constructor() { this.reset(); this.y = Math.random() * height; }
            reset() { this.x = Math.random() * width; this.y = height + 10; this.size = Math.random() * 1.5; this.alpha = Math.random(); this.speed = Math.random() * 0.2 + 0.1; }
            update() { this.y -= this.speed; if (this.y < -10) this.reset(); this.alpha = 0.5 + Math.sin(Date.now() * 0.001 * this.speed * 100) * 0.5; }
            draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`; ctx.fill(); }
        }
        const init = () => { resize(); for(let i=0; i<150; i++) particles.push(new Star()); loop(); };
        const loop = () => {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, width, height);
            const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.15)'); gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
            ctx.fillStyle = gradient; ctx.fillRect(0,0,width,height);
            particles.forEach(p => { p.update(); p.draw(); }); animationId = requestAnimationFrame(loop);
        };
        window.addEventListener('resize', resize); init();
        return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} style={{position: 'fixed', inset: 0, zIndex: -1}} />;
};

const FireAetherEngine = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height; let particles = []; let animationId;
        const resize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
        class Spark {
            constructor() { this.reset(); this.y = Math.random() * height; }
            reset() { this.x = Math.random() * width; this.y = height + 10; this.size = Math.random() * 3 + 1; this.speedY = Math.random() * 1 + 0.5; this.life = Math.random() * 0.5 + 0.5; this.color = ['#f97316', '#ea580c', '#fbbf24'][Math.floor(Math.random() * 3)]; }
            update() { this.y -= this.speedY; this.x += (Math.random() - 0.5) * 0.5; this.life -= 0.005; if(this.life <= 0 || this.y < -10) this.reset(); }
            draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.globalAlpha = this.life * 0.6; ctx.fill(); ctx.globalAlpha = 1; }
        }
        const init = () => { resize(); for(let i=0; i<100; i++) particles.push(new Spark()); loop(); };
        const loop = () => { ctx.clearRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(); }); animationId = requestAnimationFrame(loop); };
        window.addEventListener('resize', resize); init();
        return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} style={{position: 'fixed', inset: 0, zIndex: -1, background: '#ffffff'}} />;
};

// --- COMPONENTS ---
const Card = ({ children, style, theme, onClick, animate = false }) => {
    const isDark = ['night', 'noir', 'forest', 'cosmos'].includes(theme.id);
    const Component = animate ? motion.div : 'div';
    return (
        <Component
            layout={animate} onClick={() => { if(onClick) { vibrate(); onClick(); } }}
            style={{
                background: theme.card, borderRadius: 24, padding: 20, marginBottom: 12, backdropFilter: 'blur(10px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
                boxShadow: animate ? '0 4px 20px rgba(0,0,0,0.05)' : 'none', ...style
            }}
        >
            {children}
        </Component>
    );
};

const Button = ({ children, onClick, theme, variant = 'primary', style, icon }) => {
    const isDark = ['night', 'noir', 'forest', 'cosmos'].includes(theme.id);
    let variantStyle = { background: theme.primary, color: theme.id === 'noir' ? 'black' : 'white', width: '100%' };
    if (variant === 'ghost') variantStyle = { background: 'none', padding: 4, opacity: 0.7, color: theme.text };
    if (variant === 'soft') variantStyle = { background: 'rgba(0,0,0,0.05)', color: theme.text, width: '100%' };
    if (variant === 'amen') variantStyle = { padding: '8px 16px', borderRadius: 20, fontSize: 13, background: 'rgba(0,0,0,0.05)', color: theme.text };

    return (
        <motion.button whileTap={{scale: 0.96}} onClick={() => { vibrate(); if(onClick) onClick(); }} style={{border:'none', borderRadius:16, fontWeight:'bold', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', transition:'all 0.2s', padding:'12px 16px', fontFamily:'Inter', ...variantStyle, ...style}}>
            {icon} {children}
        </motion.button>
    );
};

// --- MAIN APP ---
const AmenApp = () => {
    // 1. STATE
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(() => safeStorageGet('amen_theme') || 'dawn');
    const [activeTab, setActiveTab] = useState('home');
    
    // Data state
    const [prayers, setPrayers] = useState([]);
    const [topics, setTopics] = useState([]);
    const [publicRequests, setPublicRequests] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    
    // UI state
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [modalMode, setModalMode] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [inputText, setInputText] = useState("");
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [selectedMood, setSelectedMood] = useState(null);

    // Feature state
    const [devotionals, setDevotionals] = useState(INITIAL_DATA);
    const [focusItem, setFocusItem] = useState(null);
    const [userStats, setUserStats] = useState({ streak: 0, lastPrayedDate: null, history: {} });
    const [dailyFocusDone, setDailyFocusDone] = useState(false);
    const [dailyReflectionDone, setDailyReflectionDone] = useState(false);
    const [newMedal, setNewMedal] = useState(null);
    const [copied, setCopied] = useState(false);
    
    // Auth inputs
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");

    // Media
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const audioRef = useRef(null);

    const cur = THEMES[theme] || THEMES.dawn;
    const isDark = ['night', 'noir', 'forest', 'cosmos'].includes(theme);
    const isAdmin = user?.email === ADMIN_EMAIL;
    const todayStr = getTodayString();

    // 2. EFFECTS
    useEffect(() => { safeStorageSet('amen_theme', theme); }, [theme]);
    
    // Auth Listener
    useEffect(() => {
        if (!auth) {
            setLoading(false);
            setAuthLoading(false);
            return;
        }
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u);
            if (u) {
                safeStorageSet('amen_visited', 'true');
                if (selectedMood && db) {
                   addDoc(collection(db, 'artifacts', appId, 'users', u.uid, 'prayers'), {
                        text: `Боже, я чувствую: ${selectedMood.label}.`,
                        status: 'active',
                        createdAt: serverTimestamp()
                   }).catch(console.error);
                   setSelectedMood(null);
                }
            } else {
                if (safeStorageGet('amen_visited')) setOnboardingStep(2);
                else setOnboardingStep(0);
            }
            setLoading(false);
            setAuthLoading(false);
        });
        return () => unsub();
    }, [selectedMood]);

    // Data Loaders (DYNAMIC CONTENT LOGIC)
    useEffect(() => {
        if (!db) return;
        const fetchDevotionals = async () => {
            try {
                // Try to fetch from DB
                const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_word'), orderBy('day'));
                const s = await getDocs(q);
                if (!s.empty) {
                    setDevotionals(s.docs.map(d => d.data()));
                }
            } catch (e) { 
                console.warn("Devotional fetch error (using fallback)", e);
                // Fallback is already set in initial state
            }
        };
        fetchDevotionals();
    }, []);

    useEffect(() => {
        if (!user || !db) return;
        const u = user.uid;

        const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', u, 'prayers'), orderBy('createdAt', 'desc')), s => {
            setPrayers(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()})));
        });
        const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', u, 'prayer_topics')), s => {
            setTopics(s.docs.map(d => ({id: d.id, ...d.data()})));
        });
        const unsubS = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'stats'), d => {
            if(d.exists()) { const dt = d.data(); setUserStats(dt); setDailyFocusDone(dt.lastPrayedDate===todayStr); }
        });
        const unsubR = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'reflections'), d => {
             if(d.exists() && d.data()[todayStr]) setDailyReflectionDone(true);
        });

        let unsubReqs = () => {}, unsubFeedback = () => {};
        if (activeTab === 'community') {
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), orderBy('createdAt', 'desc'));
            unsubReqs = onSnapshot(q, s => setPublicRequests(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()}))));
        }
        if (activeTab === 'admin_feedback' && isAdmin) {
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback'), orderBy('createdAt', 'desc'));
            unsubFeedback = onSnapshot(q, s => setFeedbacks(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()}))));
        }

        return () => { unsubP(); unsubT(); unsubS(); unsubR(); unsubReqs(); unsubFeedback(); };
    }, [user, activeTab, isAdmin, todayStr]);

    // Audio
    useEffect(() => {
        if (!audioRef.current) audioRef.current = new Audio();
        const audio = audioRef.current;
        const track = TRACKS[currentTrackIndex];
        if (track && track.file && audio.src !== new URL(track.file, window.location.href).href) {
            audio.src = track.file; audio.load();
        }
        if (isPlaying) audio.play().catch(()=>{}); else audio.pause();
        audio.onended = () => setCurrentTrackIndex(i => (i+1)%TRACKS.length);
    }, [currentTrackIndex, isPlaying]);

    // Actions
    const handleAuth = async () => {
        if (!auth) return;
        if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+)"); return; }
        setAuthLoading(true); setAuthError("");
        const e = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
        try { await signInWithEmailAndPassword(auth, e, password); } 
        catch { try { const u = await createUserWithEmailAndPassword(auth, e, password); await updateProfile(u.user, {displayName: nickname}); } catch { setAuthError("Ошибка"); } }
        setAuthLoading(false);
    };

    const logout = async () => { if(auth) await signOut(auth); setUser(null); setNickname(""); setPassword(""); setIsPlaying(false); setOnboardingStep(0); };

    const updateStreak = async () => {
       if (!db || !user) return;
       let ns = userStats.streak || 0;
       if(userStats.lastPrayedDate !== todayStr) {
           const y = new Date(); y.setDate(y.getDate()-1);
           const ys = `${y.getFullYear()}-${pad(y.getMonth()+1)}-${pad(y.getDate())}`;
           if(userStats.lastPrayedDate === ys) ns++; else ns=1;
       }
       await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { streak: ns, lastPrayedDate: todayStr, history: {...userStats.history, [todayStr]:true} }, { merge: true });
       if (MEDALS[ns] && userStats.streak !== ns) { setNewMedal(MEDALS[ns]); setModalMode('medal'); }
    };

    const handleCreate = async () => {
        if(!inputText.trim() || !db) return;
        const text = inputText; closeModal();
        const coll = modalMode === 'public_request' ? collection(db, 'artifacts', appId, 'public', 'data', 'requests') : 
                     modalMode === 'feedback' ? collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback') :
                     collection(db, 'artifacts', appId, 'users', user.uid, 'prayers');
        
        const payload = { text, createdAt: serverTimestamp() };
        if(modalMode === 'public_request') { payload.authorId = user.uid; payload.authorName = user.displayName || "Аноним"; payload.amenCount = 0; }
        else if(modalMode === 'feedback') { payload.authorId = user.uid; payload.authorName = user.displayName || "Аноним"; }
        else { payload.status = 'active'; await updateStreak(); }
        
        await addDoc(coll, payload);
        if (modalMode === 'feedback') alert("Отправлено.");
    };

    const handleReflection = async () => {
        if(!inputText.trim() || !db) return;
        await handleCreate();
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), { [todayStr]: true }, { merge: true });
        triggerConfetti({ shapes: ['star'], colors: ['#FFD700', '#FFA500'] });
    };

    const handleFocusPray = async () => {
        // If we have items in list, pick random one to show as "focused" (conceptually)
        // In this version we just celebrate the action
        await updateStreak();
        setDailyFocusDone(true);
        triggerConfetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: [cur.primary, '#fbbf24', '#ffffff'] });
        vibrate([50, 100, 50]);
    };
    
    const saveAnswer = async () => {
        if(!selectedItem || !db) return;
        closeModal();
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'prayers', selectedItem.id), { status: 'answered', answeredAt: serverTimestamp(), answerNote: inputText });
        triggerConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    };

    const deleteItem = async (id) => {
        if(!window.confirm('Удалить?') || !db) return;
        let path = `users/${user.uid}/prayers`;
        if (activeTab === 'community') path = 'public/data/requests';
        if (activeTab === 'admin_feedback') path = 'public/data/app_feedback';
        await deleteDoc(doc(db, 'artifacts', appId, path, id));
    };

    const handleAmen = async (req) => {
        if (!user || req.amens?.includes(user.uid) || !db) return;
        vibrate(30);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), { amenCount: increment(1), amens: arrayUnion(user.uid) });
    };

    // Admin Upload
    const uploadDevotionalsToDB = async () => {
       if (!window.confirm("Перезаписать базу слов?")) return;
       try { 
           const batch = writeBatch(db); 
           // Upload initial data as a base
           INITIAL_DATA.forEach((item) => { 
               batch.set(doc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_word'), `day_${item.day}`), item); 
           }); 
           await batch.commit(); 
           alert("База обновлена!"); 
       } catch (e) { alert("Ошибка: " + e.message); }
    };
    
    const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const handleUpdateName = async () => {
        if (!editNameValue.trim()) return;
        try { await updateProfile(user, { displayName: editNameValue }); setUser({ ...user, displayName: editNameValue }); setIsEditingName(false); } catch (e) { alert("Ошибка обновления имени"); }
    };

    const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };
    const insertScripture = (text, ref) => { setModalMode('entry'); setInputText(prev => `${prev}"${text}" — ${ref}\n\n`); };

    const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

    const todayDevotion = useMemo(() => {
        if (!devotionals || devotionals.length === 0) return INITIAL_DATA[0];
        return devotionals[(new Date().getDate() - 1) % devotionals.length] || INITIAL_DATA[0];
    }, [devotionals]);

    // Renders
    if (!auth) return <div style={{padding:50, textAlign:'center'}}>Ошибка инициализации базы данных.</div>;

    const renderScriptureFinder = () => (
        <div onClick={closeModal} style={{position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
            <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 450, background: isDark ? '#1e293b' : '#ffffff', borderRadius: 28, padding: 24}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                    <span style={{fontSize: 16, fontWeight: 'bold', color: cur.primary}}><BookOpen size={18} style={{marginRight: 8, display: 'inline'}}/>Найти Слово</span>
                    <button onClick={closeModal} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: 8, borderRadius: '50%'}}><X size={20} color={cur.text} /></button>
                </div>
                <h4 style={{fontSize: 14, fontWeight: 'bold', opacity: 0.7, textTransform: 'uppercase', marginBottom: 10}}>Выберите состояние:</h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 300, overflowY: 'auto', marginBottom: 10}}>
                    <button onClick={() => {
                        const allVerses = Object.values(BIBLE_INDEX).flat();
                        const randomVerse = allVerses[Math.floor(Math.random() * allVerses.length)];
                        insertScripture(randomVerse.v, randomVerse.t);
                    }} style={{padding: '8px 12px', borderRadius: 16, background: cur.primary, border: 'none', color: theme === 'noir' ? 'black' : 'white', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                        🎲 Случайное Слово
                    </button>
                    {Object.keys(BIBLE_INDEX).map(tag => (
                        <button key={tag} onClick={() => {
                            const verses = BIBLE_INDEX[tag];
                            const randomVerse = verses[Math.floor(Math.random() * verses.length)];
                            insertScripture(randomVerse.v, randomVerse.t);
                        }} style={{display:'flex', alignItems:'center', gap:4, padding: '8px 12px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', color: cur.text, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                            {EMOTION_LABELS[tag]?.l}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );

    const renderOnboarding = () => (
        <div style={{padding:30, height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center'}}>
            {onboardingStep === 0 ? (
                <>
                    <h1 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:42, color:cur.primary}}>Amen.</h1>
                    <h2 style={{fontSize:28, marginBottom:30}}>Что у тебя на сердце?</h2>
                    <div style={{display:'flex', flexDirection:'column', gap:10}}>
                        {ONBOARDING_OPTIONS.map(o => (
                            <button key={o.id} onClick={()=>{setSelectedMood(o); setOnboardingStep(1)}} style={{padding:20, borderRadius:20, border:'none', background:cur.card, fontSize:16, display:'flex', gap:15, alignItems:'center', color:cur.text}}>{o.icon} {o.label}</button>
                        ))}
                    </div>
                    <button onClick={()=>setOnboardingStep(2)} style={{marginTop:30, background:'none', border:'none', textDecoration:'underline', opacity:0.6}}>Войти</button>
                </>
            ) : onboardingStep === 1 && selectedMood ? (
                <div style={{textAlign:'center'}}>
                    <h2 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:32}}>"{selectedMood.verse}"</h2>
                    <p style={{fontWeight:'bold', opacity:0.6, textTransform:'uppercase'}}>{selectedMood.ref}</p>
                    <Button onClick={()=>setOnboardingStep(2)} theme={cur} style={{marginTop:30}}>Сохранить в дневник <ArrowRight size={16}/></Button>
                </div>
            ) : (
                <div style={{background:cur.card, padding:30, borderRadius:30, backdropFilter:'blur(10px)'}}>
                    <h1 style={{textAlign:'center', fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:48, color:cur.primary, margin:0}}>Amen.</h1>
                    <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Имя" style={{width:'100%', padding:15, borderRadius:15, border:'none', margin:'20px 0 10px'}}/>
                    <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Пароль" style={{width:'100%', padding:15, borderRadius:15, border:'none', marginBottom:20}}/>
                    <Button onClick={handleAuth} theme={cur}>{authLoading ? <Loader className="animate-spin"/> : "Войти / Создать"}</Button>
                    <button onClick={()=>setOnboardingStep(0)} style={{background:'none', border:'none', fontSize:12, opacity:0.5, marginTop:10, width:'100%'}}>Назад</button>
                </div>
            )}
        </div>
    );

    return (
        <>
            {theme === 'cosmos' ? <CosmicEngine /> : theme === 'aether' ? <FireAetherEngine /> : <div style={{position:'fixed', inset:0, backgroundImage:cur.bg, backgroundSize:'cover', zIndex:-1}}/>}
            
            <div style={{minHeight:'100vh', color:cur.text, fontFamily:'-apple-system, sans-serif'}}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');`}</style>
                {loading ? <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><Loader className="animate-spin"/></div> : !user ? renderOnboarding() : (
                    <div style={{maxWidth: 500, margin: '0 auto', paddingBottom: 100}}>
                        {/* HEADER */}
                        <div style={{padding: '50px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div>
                                <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 42, fontStyle: 'italic', margin: 0}}>Amen.</h1>
                                <div style={{display:'flex', alignItems:'center', gap:10, marginTop:5}}>
                                    <span style={{fontSize:12, fontWeight:'bold', opacity:0.8}}>{getGreeting()}, {user.displayName || 'Друг'}</span>
                                    <div style={{background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:10, display:'flex', alignItems:'center', gap:4}}><Flame size={12} fill="#fbbf24" color="#fbbf24"/> <span style={{fontSize:11, fontWeight:'bold'}}>{userStats.streak}</span></div>
                                </div>
                            </div>
                            <div style={{display:'flex', gap:10}}>
                                <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}>{isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.8}}/>}</motion.button>
                                <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}><User size={20} color={cur.text}/></motion.button>
                            </div>
                        </div>

                        {/* NAV */}
                        <div style={{display:'flex', padding:'0 20px', gap:15, overflowX:'auto', marginBottom:20}}>
                            {[{id:'home',l:'Дневник'}, {id:'list',l:'Список'}, {id:'word',l:'Слово'}, {id:'community',l:'Единство'}, {id:'vault',l:'Чудеса'}, ...(isAdmin?[{id:'admin_feedback',l:'Отзывы'}]:[])].map(t => (
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
                                    <div style={{display:'flex', gap:10, marginBottom:20}}>
                                        <Button onClick={()=>setModalMode('scripture_finder')} theme={cur} variant="soft" icon={<Search size={16}/>}>Найти Слово</Button>
                                        <Button onClick={handleFocusPray} theme={cur} variant="soft" icon={<Zap size={16}/>}>Случайная Молитва</Button>
                                    </div>
                                    <div style={{marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span style={{fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5}}>Ваши записи</span>
                                        <button onClick={() => {setModalMode('entry'); setInputText("")}} style={{background:'none', border:'none', color: cur.primary, fontSize: 12, fontWeight: 'bold', cursor:'pointer'}}>+ Добавить</button>
                                    </div>
                                    {prayers.length === 0 ? <div style={{textAlign: 'center', marginTop: 30, opacity: 0.6}}>Пока пусто...</div> :
                                        prayers.map(p => (
                                            <Card key={p.id} theme={cur}>
                                                <div style={{fontSize:11, opacity:0.6, marginBottom:5}}>{formatDate(p.createdAt)}</div>
                                                <div style={{fontSize:16, marginBottom:10}}>{p.text}</div>
                                                {p.status !== 'answered' && <button onClick={()=>{setSelectedItem(p); setModalMode('answer'); setInputText("");}} style={{background:'rgba(255,255,255,0.2)', border:'none', padding:'5px 10px', borderRadius:10, fontSize:12, fontWeight:'bold', cursor:'pointer', color:cur.primary}}>Ответ</button>}
                                                <button onClick={()=>deleteItem(p.id)} style={{background:'none', border:'none', float:'right'}}><Trash2 size={14} color={cur.text}/></button>
                                            </Card>
                                        ))
                                    }
                                </>
                            )}
                            {activeTab === 'word' && (
                                <Card theme={cur}>
                                    <h2 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', marginTop:0}}>Слово на сегодня</h2>
                                    <p style={{fontSize:18, fontStyle:'italic'}}>"{todayDevotion.text}"</p>
                                    <p style={{textAlign:'right', fontWeight:'bold', fontSize:12}}>— {todayDevotion.reference}</p>
                                    <div style={{background:'rgba(0,0,0,0.05)', padding:15, borderRadius:15, marginTop:20}}>
                                        <div style={{fontSize:11, fontWeight:'bold', textTransform:'uppercase', opacity:0.6}}>Мысль</div>
                                        <p style={{fontSize:14, margin:'5px 0'}}>{todayDevotion.explanation}</p>
                                    </div>
                                </Card>
                            )}
                            {activeTab === 'community' && (
                                <>
                                    <div style={{textAlign:'center', marginBottom:20, opacity:0.8, fontSize:13}}><b>Нужна молитва?</b><br/>Напиши, и мы помолимся.</div>
                                    {publicRequests.map(r => (
                                        <Card key={r.id} theme={cur}>
                                            <div style={{fontSize:11, opacity:0.6, marginBottom:5}}>{r.authorName} • {formatDate(r.createdAt)}</div>
                                            <div style={{marginBottom:15}}>{r.text}</div>
                                            <Button onClick={()=>handleAmen(r)} theme={cur} variant="amen" icon={<Users size={14}/>}>Аминь {r.amenCount > 0 && `• ${r.amenCount}`}</Button>
                                        </Card>
                                    ))}
                                </>
                            )}
                            {activeTab === 'admin_feedback' && isAdmin && feedbacks.map(fb => (
                                <Card key={fb.id} theme={cur}>
                                    <div style={{fontSize:11, opacity:0.6, marginBottom:5}}>{fb.authorName} • {formatDate(fb.createdAt)}</div>
                                    <div style={{marginBottom:10}}>{fb.text}</div>
                                    <button onClick={()=>deleteItem(fb.id)} style={{background:'none', border:'none'}}><Trash2 size={14}/></button>
                                </Card>
                            ))}
                            {activeTab === 'list' && (
                                <>
                                    <Button onClick={()=>{setModalMode('topic'); setInputText("")}} theme={cur} style={{marginBottom:15}}>+ Новая тема</Button>
                                    {topics.map(t => (
                                        <Card key={t.id} theme={cur}>
                                            <div style={{display:'flex', justifyContent:'space-between'}}><b>{t.title}</b><button onClick={()=>deleteItem(t.id)} style={{background:'none', border:'none'}}><Trash2 size={14}/></button></div>
                                            <Button onClick={()=>{ setFocusItem(t); handleFocusPray(); }} theme={cur} variant="soft" style={{marginTop:10}} icon={<Wind size={14}/>}>Помолиться ({t.count||0})</Button>
                                        </Card>
                                    ))}
                                </>
                            )}
                            {activeTab === 'vault' && prayers.filter(p=>p.status==='answered').map(p => (
                                <Card key={p.id} theme={cur}>
                                    <div style={{fontSize:11, opacity:0.6}}>{formatDate(p.createdAt)}</div>
                                    <div style={{marginBottom:10, textDecoration:'line-through', opacity:0.7}}>{p.text}</div>
                                    <div style={{padding:10, background:'rgba(255,255,255,0.2)', borderRadius:10, borderLeft:`3px solid ${cur.primary}`}}><div style={{fontSize:11, fontWeight:'bold'}}>ОТВЕТ:</div><div>{p.answerNote}</div></div>
                                </Card>
                            ))}
                        </div>
                        
                        {/* FAB for Community only */}
                        {activeTab === 'community' && (
                            <div style={{position:'fixed', bottom:30, width:'100%', display:'flex', justifyContent:'center', pointerEvents:'none'}}>
                                <motion.button whileTap={{scale:0.9}} onClick={()=>{setModalMode('public_request'); setInputText("");}} style={{pointerEvents:'auto', width:64, height:64, borderRadius:'50%', background:cur.primary, border:'none', color:isDark?'black':'white', boxShadow:`0 10px 30px ${cur.primary}60`, display:'flex', alignItems:'center', justifyContent:'center'}}><Plus size={32}/></motion.button>
                            </div>
                        )}
                        
                        {/* MODALS */}
                        {modalMode && (
                            <div onClick={closeModal} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
                                {modalMode === 'scripture_finder' ? renderScriptureFinder() :
                                 modalMode === 'about' ? (
                                    <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} onClick={e => e.stopPropagation()} style={{background: cur.card, padding: 30, borderRadius: 30, maxWidth: 350, maxHeight: '80vh', overflowY: 'auto', backdropFilter:'blur(10px)'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                                            <h2 style={{margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic', color:cur.primary}}>Amen.</h2>
                                            <button onClick={closeModal} style={{background:'none', border:'none'}}><X size={24} color={cur.text}/></button>
                                        </div>
                                        <p style={{fontSize:14, lineHeight:1.6}}><b>Amen</b> — это пространство для тишины, осознанности и глубокой духовной практики.</p>
                                        <ul style={{fontSize:13, lineHeight:1.6, paddingLeft:20}}>
                                            <li><b>Дневник:</b> Личные записи и фокус на главном.</li>
                                            <li><b>Слово:</b> Ежедневное вдохновение из Писания.</li>
                                            <li><b>Список:</b> Темы для постоянной молитвы.</li>
                                            <li><b>Единство:</b> Поддержка и молитва друг за друга.</li>
                                            <li><b>Чудеса:</b> Архив отвеченных молитв.</li>
                                        </ul>
                                        <div style={{marginTop:20, fontSize:11, opacity:0.5, textAlign:'center'}}>Версия 4.3</div>
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} onClick={e=>e.stopPropagation()} style={{background:cur.card, width:'100%', maxWidth:400, padding:25, borderRadius:25, backdropFilter:'blur(20px)'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                                            <span style={{fontWeight:'bold', color:cur.primary}}>
                                                {modalMode==='entry'?'Новая запись':modalMode==='topic'?'Новая тема':modalMode==='reflection'?'Итоги дня':modalMode==='answer'?'Ответ на молитву':modalMode==='public_request'?'Общая молитва':'Сообщение'}
                                            </span>
                                            <button onClick={closeModal} style={{background:'none', border:'none'}}><X size={20} color={cur.text}/></button>
                                        </div>
                                        <textarea autoFocus value={inputText} onChange={e=>setInputText(e.target.value)} style={{width:'100%', height:150, background:'rgba(0,0,0,0.05)', border:'none', borderRadius:15, padding:15, fontSize:16, fontFamily:'Cormorant Garamond', fontStyle:'italic', color:cur.text}} placeholder="..."/>
                                        <Button onClick={modalMode==='public_request'?createPublicRequest:modalMode==='feedback'?createFeedback:modalMode==='answer'?saveAnswer:createItem} theme={cur} style={{marginTop:15}}>{modalMode==='answer'?'Сохранить Чудо':modalMode==='feedback'?'Отправить':'Аминь'}</Button>
                                    </motion.div>
                                )}
                            </div>
                        )}
                        
                        {/* SETTINGS DRAWER */}
                        {modalMode === 'settings' && (
                            <div onClick={closeModal} style={{position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'flex-end'}}>
                                <motion.div initial={{x:100}} animate={{x:0}} onClick={e=>e.stopPropagation()} style={{width:300, background:isDark?'#111':'white', height:'100%', padding:30, display:'flex', flexDirection:'column'}}>
                                    <h2 style={{marginTop:0}}>{user.displayName || 'Друг'}</h2>
                                    <div style={{flex:1, overflowY:'auto'}}>
                                        <h4>Тема</h4>
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20}}>
                                            {Object.keys(THEMES).map(t => (
                                                <div key={t} onClick={()=>setTheme(t)} style={{padding:10, borderRadius:10, border:theme===t?`2px solid ${cur.primary}`:'1px solid rgba(128,128,128,0.2)', cursor:'pointer', textAlign:'center', fontSize:12}}>{THEMES[t].name}</div>
                                            ))}
                                        </div>
                                        {/* ADMIN UPLOAD BUTTON */}
                                        {isAdmin && <Button onClick={uploadDevotionalsToDB} theme={cur} variant="soft" icon={<UploadCloud size={16}/>}>Загрузить Слово</Button>}
                                    </div>
                                    <div style={{marginTop:'auto', paddingTop: 20, display:'flex', flexDirection:'column', gap:10}}>
                                        <Button onClick={()=>setModalMode('feedback')} theme={cur} variant="soft" icon={<MessageSquare size={16}/>}>Написать разработчику</Button>
                                        <Button onClick={()=>setModalMode('donate')} theme={cur} variant="soft" icon={<Heart size={16}/>}>Поддержать проект</Button>
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
                                        <button onClick={prevTrack} style={{background:'none', border:'none'}}><SkipBack size={32} color={cur.text}/></button>
                                        <button onClick={()=>setIsPlaying(!isPlaying)} style={{width:60, height:60, borderRadius:'50%', background:cur.primary, border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>{isPlaying?<Pause fill="white"/>:<Play fill="white"/>}</button>
                                        <button onClick={nextTrack} style={{background:'none', border:'none'}}><SkipForward size={32} color={cur.text}/></button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                 )}
            </div>
            
            {modalMode === 'medal' && newMedal && (
                <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
                    <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} style={{background: 'white', padding: 40, borderRadius: 40, textAlign: 'center', maxWidth: 350}}>
                        <div style={{marginBottom: 20, transform: 'scale(1.5)'}}>{newMedal.icon}</div>
                        <h2>{newMedal.name}</h2><p>{newMedal.desc}</p>
                        <button onClick={() => setModalMode(null)} style={{marginTop: 30, background: '#f59e0b', color: 'white', border: 'none', padding: '12px 30px', borderRadius: 20}}>Принять</button>
                    </motion.div>
                </div>
            )}
        </>
    );
};

export default AmenApp;


