import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
 Plus, Wind, Music, Volume2, Trash2, User, X, Loader,
 Book, LogOut, SkipBack, SkipForward, Play, Pause,
 Shield, Heart, Sun, Moon, Cloud, Anchor, Droplets, Flame, Star, Crown, Eye, Sparkles, Zap, ArrowRight, CheckCircle2, Award, Medal, Calendar, Info, ChevronRight, Clock, Users, MessageSquare, Search, CloudRain, Coffee, HelpCircle, BookOpen
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

// --- 1. КОНФИГУРАЦИЯ (SAFE INIT) ---
const firebaseConfig = {
 apiKey: "AIzaSyCgOZoeEiiLQAobec0nckBhkXQF5Yxe68k",
 authDomain: "amen-journal.firebaseapp.com",
 projectId: "amen-journal",
 storageBucket: "amen-journal.firebasestorage.app",
 messagingSenderId: "979782042974",
 appId: "1:979782042974:web:b35d08837ee633000ebbcf"
};

let app, auth, db;
try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase Init Error:", e);
}

const ADMIN_EMAIL = "kiraishikagi@amen.local";

// --- 2. ДАННЫЕ ---

// BIBLE INDEX FOR "FIND WORD" FUNCTION
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
    'guilt': { l: 'Вина', i: <CloudRain size={14}/> },
    'joy': { l: 'Радость', i: <Sun size={14}/> },
    'lonely': { l: 'Одиночество', i: <User size={14}/> }
};

// ONBOARDING
const ONBOARDING_OPTIONS = [
    { id: 'anxiety', label: 'Тревога', icon: <Wind size={24}/>, verse: "Не заботьтесь ни о чем...", ref: "Филиппийцам 4:6" },
    { id: 'weary', label: 'Усталость', icon: <Moon size={24}/>, verse: "Придите ко Мне все труждающиеся...", ref: "Матфея 11:28" },
    { id: 'lonely', label: 'Одиночество', icon: <User size={24}/>, verse: "Не бойся, ибо Я с тобою...", ref: "Исаия 41:10" },
    { id: 'grateful', label: 'Благодарность', icon: <Heart size={24}/>, verse: "Славьте Господа, ибо Он благ...", ref: "Псалом 106:1" }
];

const DEVOTIONALS = [
  { day: 1, reference: "Филиппийцам 4:6-7", text: "Не заботьтесь ни о чем...", explanation: "Тревога -- это сигнал к молитве.", action: "Выпишите тревогу." },
  // ... (Full data assumed safely handled via logic)
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
 // Static fallbacks for stability
 cosmos: { id: 'cosmos', name: 'Космос', bg: 'linear-gradient(to bottom, #0f172a, #312e81)', fallback: '#0f172a', primary: '#818cf8', text: '#f8fafc', card: 'rgba(15, 23, 42, 0.6)' },
 aether: { id: 'aether', name: 'Эфир', bg: 'linear-gradient(to bottom, #ffffff, #fff7ed)', fallback: '#ffffff', primary: '#f97316', text: '#431407', card: 'rgba(255, 255, 255, 0.8)' }
};

// --- UTILS ---
const pad = (n) => String(n).padStart(2, '0');
const formatDate = (timestamp) => {
 if (!timestamp) return '';
 try { 
     const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
     const today = new Date();
     if (date.toDateString() === today.toDateString()) return "Сегодня";
     return date.toLocaleDateString(); 
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

// --- COMPONENTS ---
const Card = ({ children, style, theme, onClick, animate = false }) => {
    const isDark = ['night', 'noir', 'forest', 'cosmos'].includes(theme.id);
    const Component = animate ? motion.div : 'div';
    return (
        <Component
            layout={animate}
            onClick={onClick}
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
        <motion.button whileTap={{scale: 0.96}} onClick={onClick} style={{border:'none', borderRadius:16, fontWeight:'bold', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', transition:'all 0.2s', padding:'12px 16px', ...variantStyle, ...style}}>
            {icon} {children}
        </motion.button>
    );
};

// --- MAIN APP ---
const AmenApp = () => {
 // State Hooks
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

 const [onboardingStep, setOnboardingStep] = useState(0); // 0 or 2
 const [selectedMood, setSelectedMood] = useState(null);

 const [devotionals, setDevotionals] = useState(DEVOTIONALS);
 const [focusItem, setFocusItem] = useState(null);
 const [userStats, setUserStats] = useState({ streak: 0, lastPrayedDate: null, history: {} });
 const [dailyFocusDone, setDailyFocusDone] = useState(false);
 const [dailyReflectionDone, setDailyReflectionDone] = useState(false);
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

 // Scripture Search Modal State
 const [scriptureMode, setScriptureMode] = useState(false);

 const cur = THEMES[theme] || THEMES.dawn;
 const isDark = ['night', 'noir', 'forest', 'cosmos'].includes(theme);
 const isAdmin = user?.email === ADMIN_EMAIL;
 const todayStr = getTodayString();

 // Initialization
 useEffect(() => { const l = document.createElement('link'); l.rel='icon'; l.href='/icon-192.png'; document.head.appendChild(l); }, []);
 useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);
 
 useEffect(() => { 
    if(!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => { 
        setUser(u); 
        if (u) {
            localStorage.setItem('amen_visited', 'true');
            if (selectedMood) {
                addDoc(collection(db, 'artifacts', appId, 'users', u.uid, 'prayers'), {
                    text: `Боже, я чувствую: ${selectedMood.label}. Спасибо за слово: "${selectedMood.verse}"`,
                    status: 'active',
                    createdAt: serverTimestamp(),
                    comments: []
                });
                setSelectedMood(null);
            }
        } else {
            setOnboardingStep(localStorage.getItem('amen_visited') ? 2 : 0);
        }
        setLoading(false); 
        setAuthLoading(false); 
    }); 
    return () => unsub(); 
 }, [selectedMood]);

 // Data
 useEffect(() => {
   if (!user || !db) return;
   const u = user.uid;
   
   const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', u, 'prayers'), orderBy('createdAt', 'desc')), s => {
     setPrayers(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })));
   });
   const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', u, 'prayer_topics')), s => {
     setTopics(s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null })));
   });
   const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'stats'), d => {
       if(d.exists()) { const dt = d.data(); setUserStats(dt); setDailyFocusDone(dt.lastPrayedDate===todayStr); }
   });
   const unsubRefl = onSnapshot(doc(db, 'artifacts', appId, 'users', u, 'profile', 'reflections'), d => {
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

   return () => { unsubP(); unsubT(); unsubStats(); unsubRefl(); unsubReqs(); unsubFeedback(); };
 }, [user, activeTab, isAdmin, todayStr]);

 // Focus
 useEffect(() => {
    if (!dailyFocusDone && !focusItem && (prayers.length > 0 || topics.length > 0)) {
        const all = [...prayers.filter(p => p.status === 'active'), ...topics];
        if (all.length > 0) setFocusItem(all[Math.floor(Math.random() * all.length)]);
    }
 }, [prayers, topics, dailyFocusDone, focusItem]);

 // Audio
 useEffect(() => {
   if (!audioRef.current) { audioRef.current = new Audio(); audioRef.current.loop = true; }
   const audio = audioRef.current;
   const track = TRACKS[currentTrackIndex];
   if (track && track.file && audio.src !== new URL(track.file, window.location.href).href) {
     audio.src = track.file; audio.load();
   }
   if (isPlaying) audio.play().catch(()=>{}); else audio.pause();
 }, [currentTrackIndex, isPlaying]);

 const nextTrack = () => setCurrentTrackIndex(p => (p + 1) % TRACKS.length);
 const prevTrack = () => setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length);

 const getDailyDevotional = () => {
    const today = new Date().getDate(); 
    const index = (today - 1) % devotionals.length;
    return devotionals[index] || INITIAL_DATA[0];
 };
 const todaysDevotional = getDailyDevotional();
 const isEvening = new Date().getHours() >= 18;

 // --- ACTIONS ---
 const handleAuth = async () => {
   if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+)"); return; }
   setAuthLoading(true); setAuthError("");
   const email = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
   try { await signInWithEmailAndPassword(auth, email, password); }
   catch { try { const u = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(u.user, { displayName: nickname }); } catch { setAuthError("Ошибка"); } }
   setAuthLoading(false);
 };

 const logout = () => { signOut(auth); setUser(null); setNickname(""); setPassword(""); setIsPlaying(false); };

 const updateStreak = async () => {
    let ns = userStats.streak;
    if (userStats.lastPrayedDate !== todayStr) {
        const y = new Date(); y.setDate(y.getDate()-1);
        const ys = `${y.getFullYear()}-${pad(y.getMonth()+1)}-${pad(y.getDate())}`;
        if (userStats.lastPrayedDate === ys) ns++; else ns=1;
    }
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { streak: ns, lastPrayedDate: todayStr, history: {...userStats.history, [todayStr]:true} }, { merge: true });
    if (MEDALS[ns] && userStats.streak !== ns) { setNewMedal(MEDALS[ns]); setModalMode('medal'); }
 };

 const handleCreate = async () => {
   if (!inputText.trim()) return;
   const text = inputText; closeModal();
   const coll = modalMode === 'public_request' ? collection(db, 'artifacts', appId, 'public', 'data', 'requests') : 
                modalMode === 'feedback' ? collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback') :
                collection(db, 'artifacts', appId, 'users', user.uid, 'prayers');
   
   const payload = { text, createdAt: serverTimestamp() };
   if (modalMode === 'public_request') { payload.authorId = user.uid; payload.authorName = user.displayName; payload.amenCount = 0; }
   else if (modalMode === 'feedback') { payload.authorId = user.uid; payload.authorName = user.displayName; }
   else { payload.status = 'active'; await updateStreak(); }
   
   await addDoc(coll, payload);
   if (modalMode === 'feedback') alert("Отправлено.");
 };

 const handleReflection = async () => {
    if (!inputText.trim()) return;
    await handleCreate();
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), { [todayStr]: true }, { merge: true });
    setDailyReflectionDone(true);
    confetti({ shapes: ['star'], colors: ['#FFD700', '#FFA500'] });
 };

 const handleFocusPray = async () => {
    if (!focusItem && prayers.length === 0) return;
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: [cur.primary, '#fbbf24', '#ffffff'] });
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    if (focusItem) {
        const coll = focusItem.title ? 'prayer_topics' : 'prayers';
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, focusItem.id), { count: increment(1), lastPrayedAt: serverTimestamp() });
    }
    await updateStreak();
    setDailyFocusDone(true);
 };

 const saveAnswer = async () => {
   if (!selectedItem) return;
   closeModal();
   await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'prayers', selectedItem.id), { status: 'answered', answeredAt: serverTimestamp(), answerNote: inputText });
   confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
 };

 const deleteItem = async (id) => {
   if (!window.confirm("Удалить?")) return;
   let path = `users/${user.uid}/prayers`;
   if (activeTab === 'community') path = 'public/data/requests';
   if (activeTab === 'admin_feedback') path = 'public/data/app_feedback';
   await deleteDoc(doc(db, 'artifacts', appId, path, id));
 };

 const handleAmen = async (req) => {
    if (!user || req.amens?.includes(user.uid)) return;
    if (navigator.vibrate) navigator.vibrate(30);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), { amenCount: increment(1), amens: arrayUnion(user.uid) });
 };

 const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };
 const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
 const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

 const insertScripture = (text, ref) => {
    setModalMode('entry');
    setInputText(prev => `${prev}"${text}" — ${ref}\n\n`);
 };

 // List Calculation
 const list = useMemo(() => {
   const q = searchQuery.toLowerCase();
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

 // --- RENDERS ---
 
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
                 {authError && <p style={{color:'red', fontSize:12, textAlign:'center', marginTop:10}}>{authError}</p>}
                 <Button onClick={handleAuth} theme={cur}>{authLoading ? <Loader className="animate-spin"/> : "Войти / Создать"}</Button>
                 <button onClick={()=>setOnboardingStep(0)} style={{background:'none', border:'none', fontSize:12, opacity:0.5, marginTop:10, width:'100%'}}>Назад</button>
             </div>
         )}
     </div>
 );

 if (!auth) return <div style={{padding:50, textAlign:'center'}}>Ошибка инициализации базы данных.</div>;

 return (
   <>
     <div style={{position: 'fixed', inset: 0, backgroundImage: cur.bg, backgroundSize: 'cover', zIndex: -1}} />

     <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', color: cur.text }}>
       <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');`}</style>
       
       {loading ? (
         <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
             <Loader className="animate-spin" size={32} color={cur.text} style={{opacity:0.5}} />
             <h1 style={{marginTop:20, fontFamily:'Cormorant Garamond', fontStyle:'italic', opacity:0.5}}>Amen.</h1>
         </div>
       ) : !user ? renderOnboarding() : (
         <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.1)'}}>
           
           {/* HEADER */}
           <div style={{padding: '60px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div>
               <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 52, fontStyle: 'italic', margin: 0, lineHeight: 1, letterSpacing: '3px', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>Amen.</h1>
               <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 8}}>
                   <p style={{fontSize: 12, opacity: 0.9, letterSpacing: 1, fontWeight:'bold', margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>{getGreeting()}, {user.displayName}</p>
                   <div style={{display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, backdropFilter: 'blur(3px)'}}>
                        <Flame size={14} fill={dailyFocusDone ? '#fbbf24' : 'none'} color={dailyFocusDone ? '#fbbf24' : cur.text} style={{opacity: dailyFocusDone ? 1 : 0.5}} />
                        <span style={{fontSize: 11, fontWeight: 'bold', color: cur.text}}>{userStats.streak}</span>
                   </div>
               </div>
             </div>
             <div style={{display:'flex', gap:10}}>
               <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}>{isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.8}}/>}</motion.button>
               <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}><User size={20} color={cur.text}/></motion.button>
             </div>
           </div>

           {/* TABS */}
           <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto'}}>
             {[{id:'home', l:'Дневник'}, {id:'list', l:'Список'}, {id:'word', l:'Слово'}, {id:'community', l:'Единство'}, {id:'vault', l:'Чудеса'}, ...(isAdmin?[{id:'admin_feedback',l:'Отзывы'}]:[])].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                 flex: 1, background: 'none', border: 'none', padding: '12px 10px', whiteSpace: 'nowrap',
                 color: activeTab === tab.id ? cur.text : cur.text, opacity: activeTab === tab.id ? 1 : 0.6,
                 fontWeight: activeTab === tab.id ? '800' : '500', fontSize: 14, position: 'relative', cursor: 'pointer', transition: 'all 0.3s',
                 textShadow: '0 0 10px rgba(0,0,0,0.1)'
               }}>
                 {tab.l}
                 {activeTab === tab.id && <motion.div layoutId="underline" style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: cur.primary, borderRadius:2}} />}
               </button>
             ))}
           </div>

           {/* CONTENT */}
           <div style={{flex: 1, padding: '10px 20px 100px', overflowY: 'auto'}}>
             
             {/* HOME TAB */}
             {activeTab === 'home' && (
                 <div style={{marginBottom: 30}}>
                    {/* BUTTONS ROW */}
                    <div style={{display:'flex', gap:10, marginBottom:20}}>
                        <Button onClick={()=>setModalMode('scripture_finder')} theme={cur} variant="soft" icon={<Search size={16}/>}>Найти Слово</Button>
                        <Button onClick={handleFocusPray} theme={cur} variant="soft" icon={<Zap size={16}/>}>Случайная Молитва</Button>
                    </div>

                    {!dailyFocusDone && focusItem && (
                        <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} style={{background: `linear-gradient(135deg, ${cur.primary}15, ${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.6)'})`, borderRadius: 30, padding: 24, border: `1px solid ${cur.primary}40`, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)', marginBottom: 20}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}><span style={{fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: cur.primary, display:'flex', alignItems:'center', gap: 6}}><Zap size={14} fill={cur.primary} /> Молитва сейчас</span></div>
                            <p style={{fontSize: 22, fontWeight: '500', fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.3, marginBottom: 25}}>"{focusItem.text || focusItem.title}"</p>
                            <motion.button whileTap={{scale: 0.95}} onClick={handleFocusPray} style={{width: '100%', padding: 16, borderRadius: 20, background: cur.primary, color: theme === 'noir' ? 'black' : 'white', border: 'none', fontSize: 16, fontWeight: 'bold', boxShadow: `0 10px 20px ${cur.primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>Помолиться <Heart size={18} fill={theme === 'noir' ? 'black' : 'white'} /></motion.button>
                        </motion.div>
                    )}

                    {dailyFocusDone && (
                        <>
                            {isEvening && !dailyReflectionDone ? (
                                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} style={{background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)', borderRadius: 30, padding: 24, marginBottom: 20, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}`, backdropFilter: 'blur(12px)', boxShadow: `0 10px 30px ${cur.primary}20`}}>
                                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10, opacity:0.8}}><Moon size={16} fill={isDark ? 'white' : cur.primary} color={isDark ? 'white' : cur.primary} /> <span style={{fontSize:11, fontWeight:'bold', textTransform:'uppercase', color: isDark ? 'white' : cur.text}}>Итоги дня</span></div>
                                    <p style={{fontFamily:'Cormorant Garamond', fontSize:22, fontStyle:'italic', margin:'0 0 20px', color: isDark ? 'white' : cur.text}}>В чем ты увидел Бога сегодня?</p>
                                    <button onClick={() => {setModalMode('reflection'); setInputText("");}} style={{background: cur.primary, color: theme === 'noir' ? 'black' : 'white', border:'none', width:'100%', padding:16, borderRadius:16, fontWeight:'bold', fontSize:15}}>Написать благодарность</button>
                                </motion.div>
                            ) : (
                                <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{background: `linear-gradient(135deg, ${cur.primary}20, ${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.6)'})`, borderRadius: 24, padding: 20, marginBottom: 20, border: `1px solid ${cur.primary}40`, display: 'flex', alignItems: 'center', gap: 15, backdropFilter: 'blur(5px)'}}>
                                    <div style={{background: isDark ? `${cur.primary}30` : 'white', padding: 10, borderRadius: '50%', boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'}}><CheckCircle2 size={24} color={cur.primary} /></div>
                                    <div><h4 style={{margin:0, fontSize:16, color: cur.text}}>Огонь горит</h4><p style={{margin:0, fontSize:12, opacity:0.7, color: cur.text}}>Вы поддержали пламя молитвы.</p></div>
                                </motion.div>
                            )}
                        </>
                    )}

                    <div style={{marginBottom: 10, fontSize: 12, opacity: 0.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center'}}>Ваши записи</div>

                    {list.length === 0 ? <div style={{textAlign: 'center', marginTop: 30, opacity: 0.6}}><p style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:16}}>Больше ничего нет...</p></div> :
                        list.map((item) => (
                          <div key={item.id} style={{background: cur.card, borderRadius: 24, padding: 20, marginBottom: 12, backdropFilter: 'blur(3px)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`}}>
                              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                                <span style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold'}}>{formatDate(item.createdAt)}</span>
                                <div style={{display:'flex', gap: 5}}>
                                   {item.status !== 'answered' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', color: theme === 'noir' ? 'black' : cur.primary}}>Ответ</button>}
                                   <button onClick={() => deleteItem(item.id)} style={{background: 'none', border: 'none', padding: 0}}><Trash2 size={14} color={cur.text} style={{opacity: 0.5}}/></button>
                                </div>
                              </div>
                              <p style={{margin: 0, fontSize: 16}}>{item.text || item.title}</p>
                          </div>
                        ))
                    }
                 </div>
             )}
             
             {activeTab === 'word' && (
               <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
                 <div style={{background: cur.card, borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backdropFilter: 'blur(5px)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`}}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                      <h2 style={{fontSize: 24, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', margin: 0}}>Слово на сегодня</h2>
                      <span style={{fontSize: 12, fontWeight: 'bold', padding: '4px 10px', background: cur.primary, color: theme === 'noir' ? 'black' : 'white', borderRadius: 20}}>
                        {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                      </span>
                   </div>
                   <div style={{marginBottom: 24}}>
                     <p style={{fontSize: 20, lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'Cormorant Garamond', marginBottom: 10}}>«{todaysDevotional.text}»</p>
                     <p style={{textAlign: 'right', fontSize: 13, fontWeight: 'bold', opacity: 0.8}}>-- {todaysDevotional.reference}</p>
                   </div>
                   <div style={{background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16, marginBottom: 16}}>
                     <h3 style={{fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8}}>Мысль</h3>
                     <p style={{fontSize: 15, lineHeight: 1.5, opacity: 0.9}}>{todaysDevotional.explanation}</p>
                   </div>
                   <div style={{background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)', padding: 16, borderRadius: 16, borderLeft: `4px solid ${cur.primary}`}}>
                     <h3 style={{fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: cur.primary, marginBottom: 8}}>Действие</h3>
                     <p style={{fontSize: 15, lineHeight: 1.5, opacity: 0.9}}>{todaysDevotional.action}</p>
                   </div>
                 </div>
               </motion.div>
             )}

             {activeTab === 'community' && (
                <>
                    <div style={{textAlign:'center', marginBottom:20, opacity:0.8, fontSize:13}}><b>Нужна молитва?</b><br/>Напиши, и мы помолимся.</div>
                    {publicRequests.map(r => (
                        <Card key={r.id} theme={cur} animate>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                                <span style={{fontSize:11, fontWeight:'bold', opacity:0.7}}>{r.authorName} • {formatDate(r.createdAt)}</span>
                                {(user.uid === r.authorId || isAdmin) && <Button variant="ghost" onClick={() => deleteItem(r.id)} theme={cur} icon={<Trash2 size={14} />} />}
                            </div>
                            <p style={{fontSize:16, lineHeight:1.5, marginBottom:15}}>{r.text}</p>
                            <Button onClick={() => handleAmen(r)} theme={cur} variant="amen" icon={<Users size={14}/>}>Аминь {r.amenCount > 0 && `• ${r.amenCount}`}</Button>
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

           {(activeTab === 'home' || activeTab === 'list' || activeTab === 'community') && (
             <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10}}>
               <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : activeTab === 'community' ? 'public_request' : activeTab === 'admin_feedback' ? 'feedback' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}80`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Plus size={36}/></motion.button>
             </div>
           )}
         </div>
       )}
     </div>

     {/* --- MODALS --- */}
     {modalMode === 'scripture_finder' && renderScriptureFinder()}
     
     {modalMode === 'medal' && newMedal && (
         <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
             <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} style={{background: 'white', padding: 40, borderRadius: 40, textAlign: 'center', maxWidth: 350}}>
                 <div style={{marginBottom: 20, transform: 'scale(1.5)'}}>{newMedal.icon}</div>
                 <h2 style={{margin: '0 0 10px', fontSize: 28, color: '#b45309'}}>Новая Награда!</h2>
                 <p style={{fontSize: 20, fontWeight: 'bold', margin: '0 0 5px'}}>{newMedal.name}</p>
                 <p style={{fontSize: 14, color: '#78716c', margin: 0}}>{newMedal.desc}</p>
                 <button onClick={() => setModalMode(null)} style={{marginTop: 30, background: '#f59e0b', color: 'white', border: 'none', padding: '12px 30px', borderRadius: 20, fontWeight: 'bold', fontSize: 16}}>Принять</button>
             </motion.div>
         </div>
     )}

     {(modalMode === 'entry' || modalMode === 'topic' || modalMode === 'reflection' || modalMode === 'public_request' || modalMode === 'feedback' || modalMode === 'answer') && (
       <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,0.98)', zIndex: 100, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100dvh'}}>
         <div style={{position:'absolute', top: 50, right: 20}}>
            <button onClick={closeModal} style={{background: 'none', border: 'none'}}><X size={32} color={cur.text}/></button>
         </div>
         <div style={{width: '100%', maxWidth: 400, margin: '0 auto'}}>
             {modalMode === 'entry' && (
                <div style={{display:'flex', justifyContent:'center', marginBottom:20}}>
                    <button onClick={() => setModalMode('scripture_finder')} style={{display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.05)', border: 'none', fontSize: 12, fontWeight: 'bold', color: cur.primary, cursor: 'pointer', whiteSpace: 'nowrap'}}>
                        <Search size={14}/> Найти Слово
                    </button>
                </div>
             )}
             <textarea autoFocus value={inputText} onChange={e => setInputText(e.target.value)} placeholder={
                 modalMode === 'reflection' ? "Спасибо Богу за..." :
                 modalMode === 'topic' ? "Например: Семья..." : "..."
             } style={{
                 width: '100%', height: '200px',
                 background: 'transparent', border: 'none', fontSize: 26, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', 
                 color: cur.text, outline: 'none', resize: 'none', lineHeight: 1.4, textAlign:'center'
             }}/>
             
             <div style={{marginTop: 20, width: '100%'}}>
                <button onClick={modalMode === 'reflection' ? handleReflection : modalMode === 'public_request' ? createPublicRequest : modalMode === 'feedback' ? createFeedback : modalMode === 'answer' ? saveAnswer : createItem} style={{
                    width: '100%', background: cur.primary, 
                    color: theme === 'noir' ? 'black' : 'white', 
                    border: 'none', padding: '18px', borderRadius: 30, fontWeight: 'bold', fontSize: 16
                }}>{modalMode === 'answer' ? 'Сохранить' : modalMode === 'public_request' || modalMode === 'feedback' ? 'Отправить' : 'Аминь'}</button>
             </div>
         </div>
       </div>
     )}

     {modalMode === 'about' && (
       <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.95)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}} onClick={closeModal}>
         <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{
             background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 350, borderRadius: 30, padding: 30, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', position:'relative'
         }} onClick={e => e.stopPropagation()}>
             <button onClick={closeModal} style={{position:'absolute', top:20, right:20, background:'none', border:'none'}}><X size={24} color={isDark?'white':'#333'}/></button>
             <h2 style={{fontFamily: 'Cormorant Garamond', fontSize: 32, fontStyle: 'italic', color: cur.primary, marginBottom: 10}}>Amen.</h2>
             <p style={{fontSize: 14, lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#4b5563', marginBottom: 20}}>
               Это пространство создано не для списков, а для отношений. Здесь нет суеты.
             </p>
             <ul style={{fontSize:13, lineHeight:1.6, paddingLeft:20, color: isDark ? '#cbd5e1' : '#4b5563'}}>
                 <li><b>Дневник:</b> Личные записи и фокус.</li>
                 <li><b>Слово:</b> Вдохновение на каждый день.</li>
                 <li><b>Единство:</b> Молитва друг за друга.</li>
             </ul>
             <div style={{textAlign:'center', fontSize: 11, opacity: 0.4, color: isDark ? 'white' : 'black', marginTop: 20}}>Версия 4.0</div>
         </motion.div>
       </div>
     )}

     {modalMode === 'settings' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
         <motion.div 
            initial={{x:100}} 
            animate={{x:0}} 
            style={{
                background: isDark ? '#171717' : 'white', 
                color: isDark ? 'white' : '#1A1A1A', 
                width: '90%', maxWidth: 360, height: '100%', 
                padding: '40px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto'
            }} 
            onClick={e => e.stopPropagation()}
         >
           <div style={{display:'flex', alignItems:'center', gap:15, marginBottom: 30}}>
               <div style={{width: 60, height: 60, borderRadius: '50%', background: cur.primary, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:24, fontWeight:'bold'}}>
                   {user.displayName ? user.displayName[0] : 'A'}
               </div>
               <div>
                   <h2 style={{margin:0, fontSize:22}}>{user.displayName}</h2>
                   <div style={{display:'flex', alignItems:'center', gap:5, opacity:0.7, fontSize:14, marginTop:4}}>
                       <Flame size={14} fill="#f59e0b" color="#f59e0b"/> <span>{userStats.streak} дней в духе</span>
                   </div>
               </div>
           </div>

           {/* CALENDAR */}
           <div style={{marginBottom: 30}}>
               <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>История верности</h3>
               <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8}}>
                   {getDaysInMonth().map(day => {
                       const d = new Date();
                       const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`;
                       const isActive = userStats.history && userStats.history[dateKey];
                       return (
                           <div key={day} style={{
                               aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold',
                               background: isActive ? cur.primary : 'rgba(0,0,0,0.05)',
                               color: isActive ? (theme === 'noir' ? 'black' : 'white') : (isDark ? 'white' : 'black'),
                               opacity: isActive ? 1 : 0.3
                           }}>
                               {day}
                           </div>
                       )
                   })}
               </div>
           </div>

           <div style={{marginTop: 'auto'}}>
               <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>Тема</h3>
               <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 30}}>
                 {Object.keys(THEMES).map(t => (
                   <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                     <div style={{width: 40, height: 40, borderRadius: 12, background: THEMES[t].bg, backgroundSize:'cover', border: theme === t ? `2px solid ${cur.text}` : 'none'}}/>
                   </div>
                 ))}
               </div>
               
               <button onClick={() => setModalMode('feedback')} style={{width: '100%', padding: 16, background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', border: 'none', borderRadius: 16, color: cur.text, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, cursor: 'pointer'}}>
                   <div style={{display:'flex', alignItems:'center', gap:10}}><MessageSquare size={18}/> Написать разработчику</div>
               </button>
               
               <button onClick={() => setModalMode('donate')} style={{width: '100%', padding: 16, background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', border: 'none', borderRadius: 16, color: cur.text, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, cursor: 'pointer'}}>
                   <div style={{display:'flex', alignItems:'center', gap:10}}><Heart size={18}/> Поддержать проект</div>
               </button>

               <button onClick={() => setModalMode('about')} style={{width: '100%', padding: 16, background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', border: 'none', borderRadius: 16, color: cur.text, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, cursor: 'pointer'}}>
                   <div style={{display:'flex', alignItems:'center', gap:10}}><Info size={18}/> О приложении</div>
               </button>

               <button onClick={logout} style={{width: '100%', padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: 16, color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'}}><LogOut size={18}/> Выйти</button>
           </div>
         </motion.div>
       </div>
     )}

     {modalMode === 'music' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
         <div style={{background: isDark?'#1e293b':'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <h3 style={{margin:0, fontSize:20, color:cur.text}}>Музыка души</h3>
              <button onClick={closeModal}><X size={24} color={cur.text}/></button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:'40vh', overflowY:'auto'}}>
              {TRACKS.map((track, i) => (
                <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{background: i===currentTrackIndex ? cur.primary : 'rgba(0,0,0,0.05)', color: i===currentTrackIndex ? 'white' : cur.text, border:'none', padding:15, borderRadius:12, textAlign:'left', fontWeight:'bold'}}>{track.title}</button>
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'center', gap:30, marginTop:20}}>
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


