import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Wind, Music, Volume2, Trash2, User, X, Loader,
  LogOut, SkipBack, SkipForward, Play, Pause,
  Heart, Moon, Flame, Crown, Sparkles, Zap, CheckCircle2, Info, ChevronRight, ChevronUp, ChevronDown, Copy, Check, UploadCloud, Users, MessageSquare, RefreshCw,
  ArrowRight, BookOpen, Search, Compass, Anchor, Frown, Sun, CloudRain, Coffee, Briefcase, HelpCircle
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
import confetti from 'canvas-confetti';

// --- 1. ROBUST CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCgOZoeEiiLQAobec0nckBhkXQF5Yxe68k",
  authDomain: "amen-journal.firebaseapp.com",
  projectId: "amen-journal",
  storageBucket: "amen-journal.firebasestorage.app",
  messagingSenderId: "979782042974",
  appId: "1:979782042974:web:b35d08837ee633000ebbcf"
};

// Safe Firebase Init
let app, auth, db;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Critical Firebase Error:", e);
}

const ADMIN_EMAIL = "kiraishikagi@amen.local";

// --- DATA CONSTANTS ---
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
    'guilt': [
        { t: "1 Иоанна 1:9", v: "Если исповедуем грехи наши, то Он... простит нам грехи наши." },
        { t: "Римлянам 8:1", v: "Итак нет ныне никакого осуждения тем, которые во Христе Иисусе." }
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

const INITIAL_DATA = [
    { day: 1, reference: "Филиппийцам 4:6-7", text: "Не заботьтесь ни о чем...", explanation: "Тревога — это сигнал к молитве.", action: "Выпишите тревогу." },
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

// --- 2. NATIVE VISUAL ENGINES (NO THREE.JS) ---

const CosmicEngine = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        const particleCount = 200; // Optimal for 2D performance

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        
        class Star {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.z = Math.random() * 2; // Depth
                this.size = Math.random() * 1.5;
                this.alpha = Math.random();
                this.speed = Math.random() * 0.05;
                this.color = Math.random() > 0.8 ? '#818cf8' : '#ffffff'; // Indigo or White
            }
            update() {
                this.y -= this.speed * (this.z + 0.5); // Move up slowly
                this.alpha += (Math.random() - 0.5) * 0.05; // Twinkle
                if(this.alpha < 0.2) this.alpha = 0.2;
                if(this.alpha > 1) this.alpha = 1;
                
                if (this.y < 0) {
                    this.y = height;
                    this.x = Math.random() * width;
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (this.z + 0.5), 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        const init = () => {
            resize();
            for(let i=0; i<particleCount; i++) particles.push(new Star());
            loop();
        };

        let animationId;
        const loop = () => {
            ctx.fillStyle = '#0f172a'; // Deep slate background
            ctx.fillRect(0, 0, width, height);
            
            // Draw Nebula (Soft Gradients)
            const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)'); // Indigo center
            gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0,0,width,height);

            particles.forEach(p => { p.update(); p.draw(); });
            animationId = requestAnimationFrame(loop);
        };

        window.addEventListener('resize', resize);
        init();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{position: 'fixed', inset: 0, zIndex: -1}} />;
};

const FireAetherEngine = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        class Spark {
            constructor() {
                this.reset();
                this.y = Math.random() * height; // Start random
            }
            reset() {
                this.x = Math.random() * width;
                this.y = height + 10;
                this.size = Math.random() * 3 + 1;
                this.speedY = Math.random() * 1 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.life = Math.random() * 0.5 + 0.5;
                // Fire colors: Orange, Red, Gold
                const palette = ['#f97316', '#ea580c', '#fbbf24']; 
                this.color = palette[Math.floor(Math.random() * palette.length)];
            }
            update() {
                this.y -= this.speedY;
                this.x += this.speedX; // Slight drift
                this.life -= 0.005;
                if(this.life <= 0 || this.y < -10) this.reset();
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life * 0.6; // Semi-transparent
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        const init = () => {
            resize();
            for(let i=0; i<150; i++) particles.push(new Spark());
            loop();
        };

        let animationId;
        const loop = () => {
            ctx.clearRect(0,0,width,height);
            // White Background handled by CSS
            particles.forEach(p => { p.update(); p.draw(); });
            animationId = requestAnimationFrame(loop);
        };

        window.addEventListener('resize', resize);
        init();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{position: 'fixed', inset: 0, zIndex: -1, background: '#ffffff'}} />;
};

// --- UI HELPERS ---
const pad = (n) => String(n).padStart(2, '0');
const formatDate = (t) => {
    if (!t) return '';
    try { if (t.toDate) return t.toDate().toLocaleDateString(); return new Date(t).toLocaleDateString(); } catch (e) { return ''; }
};
const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const getDaysInMonth = () => { const d = new Date(); return Array.from({ length: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() }, (_, i) => i + 1); };


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

// --- MAIN ---
const AmenApp = () => {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
    const [activeTab, setActiveTab] = useState('home');
    const [prayers, setPrayers] = useState([]);
    const [publicRequests, setPublicRequests] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [inputText, setInputText] = useState("");
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [selectedMood, setSelectedMood] = useState(null);
    const [journeyExpanded, setJourneyExpanded] = useState(true);
    const [userStats, setUserStats] = useState({ streak: 0, lastPrayedDate: null, history: {}, wordReadDate: null });
    const [dailyFocusDone, setDailyFocusDone] = useState(false);
    const [dailyReflectionDone, setDailyReflectionDone] = useState(false);
    const [dailyWordRead, setDailyWordRead] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");
    const [devotionals, setDevotionals] = useState(INITIAL_DATA);
    
    const audioRef = useRef(null);
    const themeObj = THEMES[theme] || THEMES.dawn;
    const isDark = ['night', 'noir', 'forest', 'cosmos', 'matrix'].includes(theme);
    const isAdmin = user?.email === ADMIN_EMAIL;
    const todayStr = getTodayString();

    useEffect(() => { const l = document.createElement('link'); l.rel='icon'; l.href='/icon-192.png'; document.head.appendChild(l); }, []);
    useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);
    
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u); setLoading(false); setAuthLoading(false);
            if (u) { localStorage.setItem('amen_visited', 'true'); }
            else { setOnboardingStep(localStorage.getItem('amen_visited') ? 2 : 0); }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!user) return;
        const u = user.uid;
        const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', u, 'prayers'), orderBy('createdAt', 'desc')), s => {
            setPrayers(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()})));
        });
        const unsubS = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'stats'), d => {
            if(d.exists()) { const dt = d.data(); setUserStats(dt); setDailyFocusDone(dt.lastPrayedDate===todayStr); setDailyWordRead(dt.wordReadDate===todayStr); }
        });
        const unsubR = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'reflections'), d => {
             if(d.exists() && d.data()[todayStr]) setDailyReflectionDone(true);
        });
        return () => { unsubP(); unsubS(); unsubR(); };
    }, [user, todayStr]);

    useEffect(() => {
        if (!user) return;
        let unsub = () => {};
        if (activeTab === 'community') {
            unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), orderBy('createdAt', 'desc')), s => {
                setPublicRequests(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()})));
            });
        }
        if (activeTab === 'admin_feedback' && isAdmin) {
            unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback'), orderBy('createdAt', 'desc')), s => {
                setFeedbacks(s.docs.map(d => ({id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date()})));
            });
        }
        return () => unsub();
    }, [user, activeTab, isAdmin]);

    // Audio Sync
    useEffect(() => { if(!audioRef.current) audioRef.current = new Audio(); const a = audioRef.current; a.onended = () => setCurrentTrackIndex(i => (i+1)%TRACKS.length); }, []);
    useEffect(() => {
        const a = audioRef.current; const t = TRACKS[currentTrackIndex];
        if(t && a) {
            if(a.src !== new URL(t.file, window.location).href) { a.src = t.file; a.load(); if(isPlaying) a.play().catch(()=>{}); }
            else if(isPlaying) a.play().catch(()=>{}); else a.pause();
        }
    }, [currentTrackIndex, isPlaying]);

    const progress = (dailyWordRead?1:0) + (dailyFocusDone?1:0) + (dailyReflectionDone?1:0);
    useEffect(() => { if(progress === 3) setJourneyExpanded(false); }, [progress]);

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
    };

    const updateStreak = async () => {
        let ns = userStats.streak || 0;
        if(userStats.lastPrayedDate !== todayStr) {
            const y = new Date(); y.setDate(y.getDate()-1);
            const ys = `${y.getFullYear()}-${pad(y.getMonth()+1)}-${pad(y.getDate())}`;
            if(userStats.lastPrayedDate === ys) ns++; else ns=1;
        }
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { streak: ns, lastPrayedDate: todayStr }, { merge: true });
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
        else { payload.status = 'active'; await updateStreak(); }
        
        await addDoc(coll, payload);
    };

    const handleReflection = async () => {
        if(!inputText.trim()) return;
        await handleCreate();
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

    const deleteItem = async (id, collName='prayers') => {
        if(!window.confirm('Удалить?')) return;
        await deleteDoc(doc(db, 'artifacts', appId, (activeTab === 'community' ? 'public/data/requests' : (activeTab === 'admin_feedback' ? 'public/data/app_feedback' : `users/${user.uid}/${collName}`)), id));
    };

    const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };
    const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

    return (
        <>
            {theme === 'cosmos' ? <CosmicEngine /> : theme === 'aether' ? <FireAetherEngine /> : <div style={{position:'fixed', inset:0, backgroundImage:themeObj.bg, backgroundSize:'cover', zIndex:-1}}/>}
            
            <div style={{minHeight: '100vh', color: themeObj.text, fontFamily: '-apple-system, sans-serif'}}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');`}</style>
                
                {loading ? <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><Loader className="animate-spin"/></div> :
                 !user ? (
                    onboardingStep === 0 ? (
                         <div style={{padding:30, height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                             <h1 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:42, color:themeObj.primary}}>Amen.</h1>
                             <h2 style={{fontSize:28, marginBottom:30}}>Что у тебя на сердце?</h2>
                             <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                 {ONBOARDING_OPTIONS.map(o => (
                                     <button key={o.id} onClick={()=>{setSelectedMood(o); setOnboardingStep(1)}} style={{padding:20, borderRadius:20, border:'none', background:themeObj.card, fontSize:16, display:'flex', gap:15, alignItems:'center', color:themeObj.text}}>{o.icon} {o.label}</button>
                                 ))}
                             </div>
                             <button onClick={()=>setOnboardingStep(2)} style={{marginTop:30, background:'none', border:'none', textDecoration:'underline', opacity:0.6}}>Войти</button>
                         </div>
                    ) : onboardingStep === 1 ? (
                        <div style={{padding:30, height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'center'}}>
                            <h2 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:32}}>"{selectedMood.verse}"</h2>
                            <p style={{fontWeight:'bold', opacity:0.6, textTransform:'uppercase'}}>{selectedMood.ref}</p>
                            <Button onClick={()=>setOnboardingStep(2)} theme={themeObj} style={{marginTop:30}}>Сохранить в дневник <ArrowRight size={16}/></Button>
                        </div>
                    ) : (
                         <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
                             <div style={{background:themeObj.card, padding:30, borderRadius:30, width:'100%', maxWidth:320, backdropFilter:'blur(10px)'}}>
                                 <h1 style={{textAlign:'center', fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:48, color:themeObj.primary, margin:0}}>Amen.</h1>
                                 <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Имя" style={{width:'100%', padding:15, borderRadius:15, border:'none', margin:'20px 0 10px'}}/>
                                 <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Пароль" style={{width:'100%', padding:15, borderRadius:15, border:'none', marginBottom:20}}/>
                                 <Button onClick={handleAuth} theme={themeObj}>{authLoading ? <Loader className="animate-spin"/> : "Войти / Создать"}</Button>
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
                                <button onClick={()=>setModalMode('music')} style={{background:'rgba(255,255,255,0.2)', width:40, height:40, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>{isPlaying?<Volume2 size={18} color={themeObj.text}/>:<Music size={18} color={themeObj.text}/>}</button>
                                <button onClick={()=>setModalMode('settings')} style={{background:'rgba(255,255,255,0.2)', width:40, height:40, borderRadius:'50%', border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}><User size={18} color={themeObj.text}/></button>
                            </div>
                        </div>

                        {/* NAV */}
                        <div style={{display:'flex', padding:'0 20px', gap:15, overflowX:'auto', marginBottom:20}}>
                            {[{id:'home',l:'Дневник'}, {id:'word',l:'Слово'}, {id:'community',l:'Единство'}, {id:'vault',l:'Чудеса'}, ...(isAdmin?[{id:'admin_feedback',l:'Отзывы'}]:[])].map(t => (
                                <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:'none', border:'none', fontSize:15, fontWeight: activeTab===t.id?'bold':'normal', opacity: activeTab===t.id?1:0.6, color:themeObj.text, padding:'10px 0', position:'relative'}}>
                                    {t.l}
                                    {activeTab===t.id && <motion.div layoutId="tab" style={{position:'absolute', bottom:0, left:0, right:0, height:2, background:themeObj.primary}}/>}
                                </button>
                            ))}
                        </div>

                        {/* CONTENT */}
                        <div style={{padding:'0 20px'}}>
                            {activeTab === 'home' && (
                                <>
                                    <AnimatePresence mode="popLayout">
                                        {journeyExpanded ? (
                                            <motion.div layout initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} style={{background:themeObj.card, padding:20, borderRadius:24, marginBottom:20, overflow:'hidden', border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.4)'}`}}>
                                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                                                    <h3 style={{margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic'}}>Путь дня</h3>
                                                    <button onClick={()=>setJourneyExpanded(false)} style={{background:'none', border:'none'}}><ChevronUp size={16} color={themeObj.text}/></button>
                                                </div>
                                                <div style={{height:4, background:'rgba(0,0,0,0.1)', borderRadius:2, marginBottom:15}}><motion.div animate={{width: `${(progress/3)*100}%`}} style={{height:'100%', background:themeObj.primary, borderRadius:2}}/></div>
                                                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                                    <div onClick={()=>{setActiveTab('word'); if(!dailyWordRead) {setDoc(doc(db,'artifacts',appId,'users',user.uid,'profile','stats'),{wordReadDate:todayStr},{merge:true}); setDailyWordRead(true);}}} style={{display:'flex', alignItems:'center', gap:10, opacity: dailyWordRead?0.5:1, cursor:'pointer'}}>
                                                        <div style={{width:24, height:24, borderRadius:'50%', background: dailyWordRead?themeObj.primary:'rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>{dailyWordRead?<Check size={14} color="white"/>:<BookOpen size={14}/>}</div>
                                                        <span>Слово для тебя</span>
                                                    </div>
                                                    <div onClick={!dailyFocusDone?handleCreate:null} style={{display:'flex', alignItems:'center', gap:10, opacity: dailyFocusDone?0.5:1, cursor:!dailyFocusDone?'pointer':'default'}}>
                                                        <div style={{width:24, height:24, borderRadius:'50%', background: dailyFocusDone?themeObj.primary:'rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>{dailyFocusDone?<Check size={14} color="white"/>:<Zap size={14}/>}</div>
                                                        <span>Фокус молитвы</span>
                                                    </div>
                                                    <div onClick={()=>{if(!dailyReflectionDone) {setModalMode('reflection'); setInputText("");}}} style={{display:'flex', alignItems:'center', gap:10, opacity: dailyReflectionDone?0.5:1, cursor:!dailyReflectionDone?'pointer':'default'}}>
                                                        <div style={{width:24, height:24, borderRadius:'50%', background: dailyReflectionDone?themeObj.primary:'rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>{dailyReflectionDone?<Check size={14} color="white"/>:<Moon size={14}/>}</div>
                                                        <span>Итоги дня</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.button layout onClick={()=>setJourneyExpanded(true)} style={{width:'100%', padding:10, marginBottom:20, background:themeObj.card, border:'none', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:themeObj.text}}>
                                                <CheckCircle2 size={16} color={themeObj.primary}/> <span>{progress}/3</span> <ChevronDown size={16}/>
                                            </motion.button>
                                        )}
                                    </AnimatePresence>

                                    {prayers.map(p => (
                                        <Card key={p.id} theme={themeObj}>
                                            <div style={{fontSize:11, opacity:0.6, marginBottom:5}}>{formatDate(p.createdAt)}</div>
                                            <div style={{fontSize:16, marginBottom:10}}>{p.text}</div>
                                            <div style={{display:'flex', gap:10}}>
                                                <button onClick={()=>{setSelectedItem(p); setModalMode('answer'); setInputText("");}} style={{background:'rgba(255,255,255,0.2)', border:'none', padding:'5px 10px', borderRadius:10, fontSize:12, fontWeight:'bold', cursor:'pointer', color:themeObj.primary}}>Ответ</button>
                                                <button onClick={()=>deleteItem(p.id)} style={{background:'none', border:'none'}}><Trash2 size={14} color={themeObj.text}/></button>
                                            </div>
                                        </Card>
                                    ))}
                                </>
                            )}
                            
                            {activeTab === 'word' && (
                                <Card theme={themeObj}>
                                    <h2 style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', marginTop:0}}>Слово на сегодня</h2>
                                    <p style={{fontSize:18, fontStyle:'italic'}}>"{devotionals[0].text}"</p>
                                    <p style={{textAlign:'right', fontWeight:'bold', fontSize:12}}>— {devotionals[0].reference}</p>
                                    <div style={{background:'rgba(0,0,0,0.05)', padding:15, borderRadius:15, marginTop:20}}>
                                        <div style={{fontSize:11, fontWeight:'bold', textTransform:'uppercase', opacity:0.6}}>Мысль</div>
                                        <p style={{fontSize:14, margin:'5px 0'}}>{devotionals[0].explanation}</p>
                                    </div>
                                </Card>
                            )}

                            {activeTab === 'community' && (
                                <>
                                    <div style={{textAlign:'center', marginBottom:20, fontSize:14, opacity:0.8}}><b>Нужна молитва?</b><br/>Напиши, и мы помолимся.</div>
                                    {publicRequests.map(r => (
                                        <Card key={r.id} theme={themeObj}>
                                            <div style={{fontSize:11, opacity:0.6, marginBottom:5}}>{r.authorName} • {formatDate(r.createdAt)}</div>
                                            <div style={{marginBottom:15}}>{r.text}</div>
                                            <Button onClick={()=>handleAmen(r)} theme={themeObj} variant="amen" icon={<Users size={14}/>}>Аминь {r.amenCount > 0 && `• ${r.amenCount}`}</Button>
                                            {(isAdmin || user.uid === r.authorId) && <button onClick={()=>deleteItem(r.id)} style={{marginTop:10, background:'none', border:'none', opacity:0.5}}><Trash2 size={12}/></button>}
                                        </Card>
                                    ))}
                                </>
                            )}
                            
                            {activeTab === 'vault' && prayers.filter(p=>p.status==='answered').map(p => (
                                <Card key={p.id} theme={themeObj}>
                                    <div style={{fontSize:11, opacity:0.6}}>{formatDate(p.createdAt)}</div>
                                    <div style={{marginBottom:10, textDecoration:'line-through', opacity:0.7}}>{p.text}</div>
                                    <div style={{padding:10, background:'rgba(255,255,255,0.2)', borderRadius:10, borderLeft:`3px solid ${themeObj.primary}`}}>
                                        <div style={{fontSize:11, fontWeight:'bold'}}>ОТВЕТ:</div>
                                        <div>{p.answerNote}</div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        
                        {/* FAB */}
                        {['home','community'].includes(activeTab) && (
                            <div style={{position:'fixed', bottom:30, width:'100%', display:'flex', justifyContent:'center', pointerEvents:'none'}}>
                                <motion.button whileTap={{scale:0.9}} onClick={()=>{setModalMode(activeTab==='community'?'public_request':'entry'); setInputText("");}} style={{pointerEvents:'auto', width:64, height:64, borderRadius:'50%', background:themeObj.primary, border:'none', color:isDark?'black':'white', boxShadow:`0 10px 30px ${themeObj.primary}60`, display:'flex', alignItems:'center', justifyContent:'center'}}><Plus size={32}/></motion.button>
                            </div>
                        )}
                        
                        {/* MODALS */}
                        {modalMode && (
                            <div onClick={closeModal} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
                                {modalMode === 'about' ? renderAbout() : (
                                    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} onClick={e=>e.stopPropagation()} style={{background:themeObj.card, width:'100%', maxWidth:400, padding:25, borderRadius:25, backdropFilter:'blur(20px)'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                                            <span style={{fontWeight:'bold', color:themeObj.primary}}>
                                                {modalMode==='entry'?'Новая запись':modalMode==='reflection'?'Итоги дня':modalMode==='answer'?'Ответ на молитву':'Просьба'}
                                            </span>
                                            <button onClick={closeModal} style={{background:'none', border:'none'}}><X size={20} color={themeObj.text}/></button>
                                        </div>
                                        {modalMode === 'entry' && (
                                            <div style={{display:'flex', gap:5, marginBottom:10, overflowX:'auto'}}>
                                                <button onClick={()=>{ setModalMode('scripture'); }} style={{padding:'5px 10px', borderRadius:10, background:'rgba(0,0,0,0.05)', border:'none', fontSize:11, fontWeight:'bold', cursor:'pointer', color:themeObj.text}}><Search size={12}/> Найти Слово</button>
                                            </div>
                                        )}
                                        {modalMode === 'scripture' ? (
                                             <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                                                {Object.keys(BIBLE_INDEX).map(k => (
                                                    <button key={k} onClick={()=>{
                                                        const v = BIBLE_INDEX[k][Math.floor(Math.random()*BIBLE_INDEX[k].length)];
                                                        setInputText(prev => prev + `"${v.v}" — ${v.t}\n\n`);
                                                        setModalMode('entry');
                                                    }} style={{padding:'8px', borderRadius:12, background:themeObj.primary, border:'none', color:isDark?'black':'white', fontSize:12, fontWeight:'bold'}}>{EMOTION_LABELS[k].l}</button>
                                                ))}
                                             </div>
                                        ) : (
                                            <>
                                                <textarea autoFocus value={inputText} onChange={e=>setInputText(e.target.value)} style={{width:'100%', height:150, background:'rgba(0,0,0,0.05)', border:'none', borderRadius:15, padding:15, fontSize:16, fontFamily:'Cormorant Garamond', fontStyle:'italic', color:themeObj.text}} placeholder="..."/>
                                                <Button onClick={modalMode==='public_request'?createPublicRequest:modalMode==='feedback'?createFeedback:modalMode==='answer'?saveAnswer:modalMode==='reflection'?handleReflection:handleCreate} theme={themeObj} style={{marginTop:15}}>{modalMode==='answer'?'Сохранить Чудо':'Аминь'}</Button>
                                            </>
                                        )}
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
                                            <div key={t} onClick={()=>setTheme(t)} style={{padding:10, borderRadius:10, border:theme===t?`2px solid ${themeObj.primary}`:'1px solid rgba(128,128,128,0.2)', cursor:'pointer', textAlign:'center', fontSize:12}}>{THEMES[t].name}</div>
                                        ))}
                                    </div>
                                    <div style={{marginTop:'auto', paddingTop: 20, display:'flex', flexDirection:'column', gap:10}}>
                                        <Button onClick={()=>setModalMode('about')} theme={themeObj} variant="soft" icon={<Info size={16}/>}>О приложении</Button>
                                        <Button onClick={logout} theme={themeObj} style={{background:'rgba(255,0,0,0.1)', color:'red'}}>Выйти</Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* MUSIC PLAYER */}
                        {modalMode === 'music' && (
                            <div onClick={closeModal} style={{position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end'}}>
                                <motion.div initial={{y:100}} animate={{y:0}} onClick={e=>e.stopPropagation()} style={{width:'100%', background:themeObj.card, padding:30, borderTopLeftRadius:30, borderTopRightRadius:30, backdropFilter:'blur(20px)'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}><h3>Музыка</h3><button onClick={closeModal} style={{background:'none', border:'none'}}><X/></button></div>
                                    <div style={{maxHeight:300, overflowY:'auto'}}>
                                        {TRACKS.map((t,i) => (
                                            <div key={i} onClick={()=>{setCurrentTrackIndex(i); setIsPlaying(true)}} style={{padding:15, borderRadius:15, background:i===currentTrackIndex?themeObj.primary:'transparent', color:i===currentTrackIndex?(isDark?'black':'white'):themeObj.text, cursor:'pointer', marginBottom:5, fontWeight:'bold'}}>{t.title}</div>
                                        ))}
                                    </div>
                                    <div style={{display:'flex', justifyContent:'center', gap:30, marginTop:20}}>
                                        <button onClick={()=>setIsPlaying(!isPlaying)} style={{width:60, height:60, borderRadius:'50%', background:themeObj.primary, border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>{isPlaying?<Pause fill="white"/>:<Play fill="white"/>}</button>
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


