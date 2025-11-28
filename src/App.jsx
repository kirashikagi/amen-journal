import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
Plus, Wind, Music, Volume2, Trash2, User, X, Sparkles, KeyRound, ArrowRight, Loader,
Book, LogOut, ChevronRight, ChevronLeft, Play, Pause, SkipBack, SkipForward,
Shield, Heart, Sun, Moon, Cloud, Anchor, Droplets, Flame, Star, Crown, Eye, Zap, RefreshCcw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
signOut, onAuthStateChanged, updateProfile
} from 'firebase/auth';
import {
getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
onSnapshot, serverTimestamp, query, increment, orderBy
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- 1. КОНФИГУРАЦИЯ ---
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

// --- 2. МУЗЫКА ---
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

// --- 3. СТИХИ ---
const ICONS = [<Shield/>, <Sun/>, <Anchor/>, <Heart/>, <Star/>, <Cloud/>, <Wind/>, <Moon/>, <Flame/>, <Droplets/>, <Crown/>, <Eye/>, <Sparkles/>];
const RAW_VERSES = [
{t: "Всё могу в укрепляющем меня Иисусе Христе.", r: "Филиппийцам 4:13", i: 0},
{t: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", r: "Псалом 22:1", i: 1},
{t: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", r: "Исаия 41:10", i: 2},
{t: "Придите ко Мне все труждающиеся и обремененные.", r: "Матфея 11:28", i: 3},
{t: "Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного.", r: "Иоанна 3:16", i: 4},
{t: "Любовь долготерпит, милосердствует, любовь не завидует.", r: "1 Коринфянам 13:4", i: 3},
{t: "Мир оставляю вам, мир Мой даю вам.", r: "Иоанна 14:27", i: 5},
{t: "Будьте тверды и мужественны, не бойтесь.", r: "Второзаконие 31:6", i: 0},
{t: "Надейся на Господа всем сердцем твоим.", r: "Притчи 3:5", i: 2},
{t: "А надеющиеся на Господа обновятся в силе.", r: "Исаия 40:31", i: 6},
{t: "Все заботы ваши возложите на Него.", r: "1 Петра 5:7", i: 5},
{t: "Остановитесь и познайте, что Я — Бог.", r: "Псалом 45:11", i: 7},
{t: "Ибо не дал нам Бог духа боязни, но силы и любви.", r: "2 Тимофею 1:7", i: 8},
{t: "Возвожу очи мои к горам, откуда придет помощь моя.", r: "Псалом 120:1", i: 1},
{t: "По милости Господа мы не исчезли.", r: "Плач Иеремии 3:22", i: 9},
{t: "Ищите же прежде Царства Божия.", r: "Матфея 6:33", i: 10},
{t: "Вера же есть осуществление ожидаемого.", r: "Евреям 11:1", i: 11},
{t: "Все у вас да будет с любовью.", r: "1 Коринфянам 16:14", i: 3},
{t: "И всё, что делаете, делайте от души.", r: "Колоссянам 3:23", i: 12},
{t: "Господь — свет мой и спасение мое.", r: "Псалом 26:1", i: 1}
];
const GOLDEN_VERSES = [...RAW_VERSES, ...RAW_VERSES].map((v, idx) => ({...v, style: idx % 6}));

// --- 4. ТЕМЫ (HARMONIZED) ---
const THEMES = {
dawn: {
  id: 'dawn', name: 'Рассвет',
  bg: 'url("/backgrounds/dawn.jpg")', fallback: '#fff7ed',
  primary: '#be123c', text: '#881337',
  glass: 'rgba(255, 255, 255, 0.6)', border: 'rgba(255, 255, 255, 0.8)'
},
ocean: {
  id: 'ocean', name: 'Глубина',
  bg: 'url("/backgrounds/ocean.jpg")', fallback: '#f0f9ff',
  primary: '#0284c7', text: '#0c4a6e',
  glass: 'rgba(240, 249, 255, 0.65)', border: 'rgba(255, 255, 255, 0.6)'
},
forest: {
  id: 'forest', name: 'Эдем',
  bg: 'url("/backgrounds/forest.jpg")', fallback: '#022c22',
  primary: '#4ade80', text: '#f0fdf4',
  glass: 'rgba(2, 44, 34, 0.7)', border: 'rgba(255, 255, 255, 0.1)'
},
dusk: {
  id: 'dusk', name: 'Закат',
  bg: 'url("/backgrounds/dusk.jpg")', fallback: '#fff7ed',
  primary: '#ea580c', text: '#7c2d12',
  glass: 'rgba(255, 247, 237, 0.7)', border: 'rgba(255, 255, 255, 0.5)'
},
night: {
  id: 'night', name: 'Звезды',
  bg: 'url("/backgrounds/night.jpg")', fallback: '#1e1b4b',
  primary: '#818cf8', text: '#e0e7ff',
  glass: 'rgba(30, 27, 75, 0.75)', border: 'rgba(255, 255, 255, 0.15)'
},
noir: {
  id: 'noir', name: 'Крест',
  bg: 'url("/backgrounds/noir.jpg")', fallback: '#000000',
  primary: '#ffffff', text: '#e5e5e5',
  glass: 'rgba(0, 0, 0, 0.8)', border: 'rgba(255, 255, 255, 0.2)'
}
};

const formatDate = (timestamp) => {
if (!timestamp) return '';
try { if (timestamp.toDate) return timestamp.toDate().toLocaleDateString(); return new Date(timestamp).toLocaleDateString(); } catch (e) { return ''; }
};

const AmenApp = () => {
const [user, setUser] = useState(null);
const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
const [activeTab, setActiveTab] = useState('home');
const [searchQuery, setSearchQuery] = useState("");
const [prayers, setPrayers] = useState([]);
const [topics, setTopics] = useState([]);
const [loading, setLoading] = useState(true);
const [authLoading, setAuthLoading] = useState(true);

const [modalMode, setModalMode] = useState(null);
const [selectedItem, setSelectedItem] = useState(null);
const [inputText, setInputText] = useState("");
const [verseIndex, setVerseIndex] = useState(0);

const [nickname, setNickname] = useState("");
const [password, setPassword] = useState("");
const [authError, setAuthError] = useState("");

const [isPlaying, setIsPlaying] = useState(false);
const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
const audioRef = useRef(null);

const cur = THEMES[theme] || THEMES.dawn;
const isDark = theme === 'night' || theme === 'noir' || theme === 'forest';

// MUSIC LOGIC
useEffect(() => {
  if (!audioRef.current) { audioRef.current = new Audio(); audioRef.current.loop = true; }
  const audio = audioRef.current;
  const track = TRACKS[currentTrackIndex];
  if (track && track.file && audio.src !== new URL(track.file, window.location.href).href) {
    audio.src = track.file; audio.load();
  }
  if (isPlaying) audio.play().catch(() => {}); else audio.pause();
}, [currentTrackIndex, isPlaying]);

const nextTrack = () => setCurrentTrackIndex(p => (p + 1) % TRACKS.length);
const prevTrack = () => setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length);
const nextVerse = () => setVerseIndex((prev) => (prev + 1) % GOLDEN_VERSES.length);
const prevVerse = () => setVerseIndex((prev) => (prev - 1 + GOLDEN_VERSES.length) % GOLDEN_VERSES.length);

useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);
useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); if (u) setLoading(false); setAuthLoading(false); }); return () => unsub(); }, []);

useEffect(() => {
  if (!user) return;
  setLoading(true);
  const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), orderBy('createdAt', 'desc')), s => {
    setPrayers(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })));
    setLoading(false);
  });
  const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics')), s => {
    setTopics(s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null, createdAt: d.data().createdAt?.toDate() || new Date() })));
  });
  return () => { unsubP(); unsubT(); };
}, [user]);

const handleAuth = async () => {
  if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+) обязательны"); return; }
  setAuthLoading(true); setAuthError("");
  const email = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
  try { await signInWithEmailAndPassword(auth, email, password); }
  catch { try { const u = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(u.user, { displayName: nickname }); } catch { setAuthError("Ошибка входа"); } }
  setAuthLoading(false);
};

const logout = () => { signOut(auth); setNickname(""); setPassword(""); setIsPlaying(false); };

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
  const coll = selectedItem.title ? 'prayer_topics' : 'prayers';
  closeModal();
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [cur.primary, '#fbbf24', '#ffffff'] });
  await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id), { status: 'answered', answeredAt: serverTimestamp(), answerNote: inputText });
};

const prayForTopic = async (id) => {
  if (navigator.vibrate) navigator.vibrate(50);
  await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics', id), { count: increment(1), lastPrayedAt: serverTimestamp() });
};

const deleteItem = async () => {
  if (!selectedItem) return;
  if (window.confirm("Удалить навсегда?")) {
     const coll = (selectedItem.title) ? 'prayer_topics' : 'prayers';
     await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id));
     closeModal();
  }
};

const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };
const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

const list = useMemo(() => {
  const q = searchQuery.toLowerCase();
  if (activeTab === 'word') return [];
  if (activeTab === 'vault') {
    const p = prayers.filter(i => i.status === 'answered');
    const t = topics.filter(i => i.status === 'answered');
    return [...p, ...t].filter(i => (i.text || i.title || "").toLowerCase().includes(q));
  }
  const src = activeTab === 'list' ? topics : prayers;
  return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q));
}, [prayers, topics, activeTab, searchQuery]);

const currentVerse = GOLDEN_VERSES[verseIndex];

// --- LOGIN SCREEN ---
if (!user) return (
  <>
   <div style={{position: 'fixed', inset: 0, zIndex: -1, backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background 0.8s ease'}} />
   <div className="animated-bg" style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'serif', padding: 20, color: cur.text, position:'relative', zIndex:10}}>
     <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.8}} style={{background: cur.glass, border: `1px solid ${cur.border}`, padding: 40, borderRadius: 30, backdropFilter: 'blur(12px)', width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
       <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic', color: cur.primary, textAlign:'center', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>Amen.</h1>
       <p style={{fontFamily:'-apple-system, sans-serif', fontSize:14, opacity:0.9, marginBottom:30, textAlign:'center', lineHeight:1.5, marginTop: 16, fontWeight: 500}}>
         Ваше личное пространство тишины.<br/>Молитвы, ответы и покой.
       </p>
       <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
         <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.8)', fontSize:16, color: '#333'}}/>
         <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.8)', fontSize:16, color: '#333'}}/>
         {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, color: '#e11d48'}}>{authError}</p>}
         <button onClick={handleAuth} style={{width: '100%', background: cur.primary, color: 'white', border: 'none', padding: '16px', borderRadius: 30, fontSize: 16, fontWeight: 'bold', display: 'flex', justifyContent: 'center', cursor: 'pointer', marginTop: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
           {authLoading ? <Loader className="animate-spin"/> : "Войти"}
         </button>
       </div>
     </motion.div>
   </div>
  </>
);

return (
  <>
    {/* 1. STABLE BACKGROUND LAYER */}
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background 0.8s ease' }} />
   
    {/* 2. OVERLAY FOR TEXT CONTRAST */}
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

    {/* 3. MAIN APP CONTENT */}
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', color: cur.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar {display:none;}`}</style>
     
      <div style={{ maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
       
        {/* HEADER */}
        <div style={{padding: '50px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 56, fontStyle: 'italic', margin: 0, lineHeight: 0.9, letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.15)'}}>Amen.</h1>
            <p style={{fontSize: 13, opacity: 0.9, letterSpacing: 0.5, marginTop: 12, fontWeight:'600', textTransform: 'uppercase'}}>{getGreeting()}, {user.displayName}</p>
          </div>
          <div style={{display:'flex', gap:12}}>
            <motion.button whileTap={{scale:0.95}} onClick={() => setModalMode('music')} style={{background: cur.glass, border: `1px solid ${cur.border}`, width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
               {isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.8}}/>}
            </motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={() => setModalMode('settings')} style={{background: cur.glass, border: `1px solid ${cur.border}`, width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
              <User size={20} color={cur.text}/>
            </motion.button>
          </div>
        </div>

        {/* TABS (FIXED STYLE) */}
        <div style={{display: 'flex', padding: '0 24px', marginBottom: 20, gap: 8, overflowX: 'auto'}}>
          {[{id:'home', l:'Дневник'}, {id:'list', l:'Список'}, {id:'word', l:'Слово'}, {id:'vault', l:'Чудеса'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, background: 'none', border: 'none', padding: '12px 0', whiteSpace: 'nowrap',
              color: cur.text,
              opacity: activeTab === tab.id ? 1 : 0.6,
              // ЕДИНЫЙ СТИЛЬ ДЛЯ ВСЕХ СОСТОЯНИЙ:
              fontFamily: 'Cormorant Garamond',
              fontWeight: '600',
              fontSize: 20,
              fontStyle: 'italic',
              position: 'relative', cursor: 'pointer', transition: 'opacity 0.3s ease'
            }}>
              {tab.l}
              {activeTab === tab.id && <motion.div layoutId="underline" style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: cur.primary, borderRadius:2, opacity: 0.8}} />}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div style={{flex: 1, padding: '0 20px 120px', overflowY: 'auto'}}>
         
          {/* TAB: WORD (СЛОВО) */}
          {activeTab === 'word' ? (
             <div style={{height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
               <AnimatePresence mode='wait'>
                 <motion.div
                   key={verseIndex}
                   initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 1.05}} transition={{duration:0.4}}
                   onClick={nextVerse}
                   style={{
                     width: '100%', padding: 32, borderRadius: 32, position: 'relative', overflow: 'hidden',
                     background: cur.glass, border: `1px solid ${cur.border}`, backdropFilter: 'blur(20px)',
                     boxShadow: '0 20px 50px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer'
                   }}
                 >
                   <div style={{marginBottom:24, transform: 'scale(1.2)'}}>{React.cloneElement(ICONS[currentVerse.i] || <Book/>, {color: cur.primary, strokeWidth: 1.5, size: 32})}</div>
                   <p style={{color: cur.text, fontSize: 26, fontWeight: '500', margin: '0 0 24px', fontStyle: 'italic', fontFamily:'Cormorant Garamond', lineHeight: 1.3}}>"{currentVerse.t}"</p>
                   <div style={{height: 3, width: 40, background: cur.primary, marginBottom: 16, borderRadius: 2, opacity: 0.5}}/>
                   <p style={{color: cur.text, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7}}>{currentVerse.r}</p>
                 </motion.div>
               </AnimatePresence>
               <button onClick={(e) => { e.stopPropagation(); prevVerse(); }} style={{position: 'absolute', left: -10, top: '50%', background: cur.glass, backdropFilter:'blur(5px)', padding: 12, borderRadius: '50%', border: `1px solid ${cur.border}`, boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 20}}><ChevronLeft size={24} color={cur.text}/></button>
               <button onClick={(e) => { e.stopPropagation(); nextVerse(); }} style={{position: 'absolute', right: -10, top: '50%', background: cur.glass, backdropFilter:'blur(5px)', padding: 12, borderRadius: '50%', border: `1px solid ${cur.border}`, boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 20}}><ChevronRight size={24} color={cur.text}/></button>
             </div>
          ) :

          /* TAB: LISTS (ДНЕВНИК / СПИСОК / ЧУДЕСА) */
           list.length === 0 ? (
             <div style={{textAlign: 'center', marginTop: 100, opacity: 0.7, background: cur.glass, padding: 30, borderRadius: 24, backdropFilter:'blur(10px)', border: `1px solid ${cur.border}`}}>
                <p style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:22, margin: 0}}>Здесь пока тихо...</p>
                <p style={{fontSize: 14, marginTop: 10, opacity: 0.8}}>Нажмите "+", чтобы добавить запись</p>
             </div>
           ) : (
             list.map((item, i) => (
               <motion.div key={item.id} layout initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}} style={{background: cur.glass, borderRadius: 24, padding: 22, marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', backdropFilter: 'blur(12px)', border: `1px solid ${cur.border}`}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                     <div style={{fontSize: 12, opacity: 0.6, fontWeight: '700', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center', letterSpacing: 0.5}}>
                       {activeTab === 'list' ? <><Wind size={12}/> {item.count} МОЛИТВ</> : formatDate(item.createdAt)}
                     </div>
                     <div style={{display:'flex', gap: 6}}>
                        {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.15)', border: `1px solid ${cur.border}`, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: '600', color: cur.text, cursor: 'pointer'}}>Ответ</button>}
                        <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5, cursor: 'pointer'}}><Trash2 size={16} color={cur.text} style={{opacity: 0.4}}/></button>
                     </div>
                   </div>
                   <p style={{margin: '0 0 12px', fontSize: 18, lineHeight: 1.5, fontWeight: 500, fontFamily: '-apple-system, sans-serif'}}>{item.text || item.title}</p>
                   {activeTab === 'list' && <motion.button whileTap={{scale:0.98}} onClick={() => prayForTopic(item.id)} style={{width: '100%', background: 'rgba(255,255,255,0.15)', border: `1px solid ${cur.border}`, padding: 12, borderRadius: 16, marginTop: 6, color: cur.text, fontWeight: '600', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'}}><Wind size={16}/> Помолиться</motion.button>}
                   {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.15)', padding: 16, borderRadius: 16, fontSize: 15, fontStyle: 'italic', fontFamily: 'Cormorant Garamond', borderLeft: `3px solid ${cur.primary}`, marginTop: 12, color: cur.text, opacity: 0.95}}>"{item.answerNote}"</div>}
               </motion.div>
             ))
           )
          }
        </div>

        {/* FAB (FLOATING ACTION BUTTON) */}
        {(activeTab === 'home' || activeTab === 'list') && (
          <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 40}}>
            <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: `4px solid ${cur.glass}`, color: 'white', boxShadow: `0 10px 40px ${cur.primary}60`}}><Plus size={36}/></motion.button>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AnimatePresence>
      {(modalMode === 'entry' || modalMode === 'topic') && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', zIndex: 100, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{position:'absolute', top: 60, right: 24}}>
             <button onClick={closeModal} style={{background: 'rgba(128,128,128,0.1)', padding: 8, borderRadius: '50%', border: 'none'}}><X size={32} color={cur.text}/></button>
          </div>
         
          <textarea autoFocus value={inputText} onChange={e => setInputText(e.target.value)} placeholder={modalMode === 'topic' ? "Например: За семью..." : "О чем болит сердце?..."} style={{flex: 1, background: 'transparent', border: 'none', fontSize: 32, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: cur.text, outline: 'none', resize: 'none', lineHeight: 1.3, textAlign:'center', marginTop: 80, padding: 20}}/>
         
          <div style={{marginTop: 'auto', paddingBottom: 40, width: '100%'}}>
             <button onClick={createItem} style={{width: '100%', background: cur.primary, color: 'white', border: 'none', padding: '18px', borderRadius: 30, fontWeight: 'bold', fontSize: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>Аминь</button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {modalMode === 'answer' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: cur.glass, border: `1px solid ${cur.border}`, width: '100%', maxWidth: 400, borderRadius: 32, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.4)'}}>
            <h3 style={{margin: '0 0 16px', color: cur.text, fontFamily: 'Cormorant Garamond', fontSize: 32, fontStyle: 'italic', textAlign: 'center'}}>Свидетельство</h3>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Как пришел ответ?" style={{width: '100%', height: 140, padding: 16, borderRadius: 20, border: 'none', marginBottom: 20, fontSize: 16, fontFamily: '-apple-system, sans-serif', resize: 'none', background: 'rgba(255,255,255,0.1)', color: cur.text, outline: 'none'}}/>
            <div style={{display: 'flex', gap: 10}}>
              <button onClick={closeModal} style={{flex: 1, padding: 14, borderRadius: 16, border: 'none', background: 'rgba(128,128,128,0.1)', color: cur.text, fontWeight: 'bold'}}>Отмена</button>
              <button onClick={saveAnswer} style={{flex: 1, padding: 14, borderRadius: 16, border: 'none', background: cur.primary, color: 'white', fontWeight: 'bold'}}>Сохранить</button>
            </div>
          </motion.div>
        </div>
      )}

      {modalMode === 'settings' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
          <motion.div initial={{x:100}} animate={{x:0}} style={{background: isDark?'#0f172a':'#fff', width: '85%', maxWidth: 360, height: '100%', padding: 30, display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom: 30, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontSize: 36, color: cur.text}}>Настройки</h2>
           
            {/* ВЕРНУЛ ИНСТРУКЦИЮ */}
            <div style={{marginBottom: 20, padding: 20, background: 'rgba(128,128,128,0.05)', borderRadius: 20}}>
               <h4 style={{fontSize:13, color:cur.text, marginBottom:10, fontWeight:'700', textTransform:'uppercase', opacity:0.7}}>Навигация</h4>
               <ul style={{fontSize:14, color:cur.text, opacity:0.9, lineHeight:1.6, paddingLeft:20, margin:0, fontFamily: 'Cormorant Garamond', fontStyle: 'italic'}}>
                 <li><b>Дневник:</b> Личные мысли и переживания.</li>
                 <li><b>Список:</b> Постоянные молитвенные нужды.</li>
                 <li><b>Слово:</b> Вдохновение из Писания.</li>
                 <li><b>Чудеса:</b> Архив отвеченных молитв.</li>
               </ul>
            </div>

            <div style={{marginBottom: 30, padding: 20, background: 'rgba(128,128,128,0.05)', borderRadius: 20}}>
               <h4 style={{fontSize:13, color:cur.text, marginBottom:10, fontWeight:'700', textTransform:'uppercase', opacity:0.7}}>Ваше пространство</h4>
               <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12}}>
                 {Object.keys(THEMES).map(t => (
                   <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                     <div style={{width: 50, height: 50, borderRadius: 14, backgroundImage: THEMES[t].bg, backgroundSize:'cover', border: theme === t ? `3px solid ${cur.primary}` : '1px solid rgba(128,128,128,0.2)'}}/>
                     <span style={{fontSize:10, fontWeight:'600', color: cur.text, opacity: 0.8}}>{THEMES[t].name}</span>
                   </div>
                 ))}
               </div>
            </div>
            <div style={{marginTop: 'auto'}}><button onClick={logout} style={{width: '100%', padding: 18, background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: 20, color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'}}><LogOut size={18}/> Выйти</button></div>
          </motion.div>
        </div>
      )}

      {modalMode === 'music' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
          <motion.div initial={{y:100}} animate={{y:0}} style={{background: cur.glass, borderTop: `1px solid ${cur.border}`, backdropFilter: 'blur(20px)', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32}} onClick={e=>e.stopPropagation()}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
               <h3 style={{margin:0, fontSize:24, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: cur.text}}>Музыка души</h3>
               <button onClick={closeModal} style={{background:'none', border:'none'}}><X size={24} color={cur.text}/></button>
             </div>
             <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:'40vh', overflowY:'auto'}}>
               {TRACKS.map((track, i) => (
                 <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{background: i===currentTrackIndex ? cur.primary : 'rgba(255,255,255,0.1)', color: i===currentTrackIndex ? 'white' : cur.text, border:'none', padding:16, borderRadius:16, textAlign:'left', fontWeight:'600', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   {track.title}
                   {i===currentTrackIndex && <div style={{width: 8, height: 8, background:'white', borderRadius:'50%'}}/>}
                 </button>
               ))}
             </div>
             <div style={{display:'flex', justifyContent:'center', gap: 32, marginTop: 30, alignItems:'center'}}>
               <button onClick={prevTrack} style={{background:'none', border:'none'}}><SkipBack size={32} color={cur.text}/></button>
               <button onClick={() => setIsPlaying(!isPlaying)} style={{background: cur.primary, border:'none', borderRadius:'50%', width: 72, height: 72, display:'flex', alignItems:'center', justifyContent:'center', color: 'white', boxShadow: `0 10px 30px ${cur.primary}50`}}>{isPlaying ? <Pause size={32} fill="white"/> : <Play size={32} fill="white" style={{marginLeft:4}}/>}</button>
               <button onClick={nextTrack} style={{background:'none', border:'none'}}><SkipForward size={32} color={cur.text}/></button>
             </div>
          </motion.div>
        </div>
      )}
  </div>
  </>
);
};

export default AmenApp;