import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
 Plus, Wind, BookOpen, Archive, Music, Volume2, Trash2,
 User, X, Sparkles, KeyRound, ArrowRight, Loader, Book, Star, LogOut,
 SkipBack, SkipForward, Play, Pause, Share2, Flower, Leaf, Gift
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
 getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
 signOut, onAuthStateChanged, updateProfile
} from 'firebase/auth';
import {
 getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
 onSnapshot, serverTimestamp, query, increment, orderBy, getDocs
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- 1. КЛЮЧИ ---
const firebaseConfig = {
 apiKey: "AIzaSyCgOZoeEiiLQAobec0nckBhkXQF5Yxe68k",
 authDomain: "amen-journal.firebaseapp.com",
 projectId: "amen-journal",
 storageBucket: "amen-journal.firebasestorage.app",
 messagingSenderId: "979782042974",
 appId: "1:979782042974:web:b35d08837ee633000ebbcf"
};

let app;
try { app = initializeApp(firebaseConfig); } catch (e) {}
const auth = getAuth();
const db = getFirestore();
const appId = firebaseConfig.projectId;

// --- 2. ДАННЫЕ И РЕСУРСЫ ---
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
 dawn: { id: 'dawn', name: 'Рассвет', bg: 'url("/backgrounds/dawn.jpg")', fallback: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)', primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.6)' },
 ocean: { id: 'ocean', name: 'Глубина', bg: 'url("/backgrounds/ocean.jpg")', fallback: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.6)' },
 forest: { id: 'forest', name: 'Эдем', bg: 'url("/backgrounds/forest.jpg")', fallback: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', primary: '#15803d', text: '#14532d', card: 'rgba(255, 255, 255, 0.6)' },
 dusk: { id: 'dusk', name: 'Закат', bg: 'url("/backgrounds/dusk.jpg")', fallback: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', primary: '#c2410c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.6)' },
 night: { id: 'night', name: 'Звезды', bg: 'url("/backgrounds/night.jpg")', fallback: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.6)' },
 noir: { id: 'noir', name: 'Крест', bg: 'url("/backgrounds/noir.jpg")', fallback: 'linear-gradient(135deg, #171717 0%, #262626 100%)', primary: '#404040', text: '#171717', card: 'rgba(255, 255, 255, 0.6)' }
};

const CARD_STYLES = [
 { bg: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', decoration: 'radial-gradient(circle at 90% 10%, rgba(255, 200, 100, 0.2), transparent 40%)' },
 { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', decoration: 'radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.1), transparent 50%)' },
 { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', decoration: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1), transparent 60%)' },
 { bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', decoration: 'radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.15), transparent 40%)' },
 { bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', decoration: 'radial-gradient(circle at 80% 80%, rgba(244, 63, 94, 0.1), transparent 40%)' },
];

const GOLDEN_VERSES = [
 { text: "Всё могу в укрепляющем меня Иисусе Христе.", ref: "Филиппийцам 4:13" },
 { text: "Ибо только Я знаю намерения, какие имею о вас, говорит Господь.", ref: "Иеремия 29:11" },
 { text: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", ref: "Псалом 22:1" },
 { text: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", ref: "Исаия 41:10" },
 { text: "Придите ко Мне все труждающиеся и обремененные.", ref: "Матфея 11:28" },
 { text: "Любовь долготерпит, милосердствует...", ref: "1 Коринфянам 13:4" },
 { text: "Мир оставляю вам, мир Мой даю вам.", ref: "Иоанна 14:27" },
 { text: "Будьте тверды и мужественны, не бойтесь.", ref: "Второзаконие 31:6" }
];

const PROMPTS = ["Кого простить?", "За что благодарны?", "Ваша тревога?", "Первая мысль утром?", "Ваша мечта?", "О ком позаботиться?"];

// Хелперы
const formatDate = (ts) => { try { if (ts.toDate) return ts.toDate().toLocaleDateString(); return new Date(ts).toLocaleDateString(); } catch { return ''; } };
const safeSort = (a, b) => (b.answeredAt?.seconds || b.createdAt?.seconds || 0) - (a.answeredAt?.seconds || a.createdAt?.seconds || 0);

// --- ПРИЛОЖЕНИЕ ---
const AmenApp = () => {
 const [user, setUser] = useState(null);
 const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
 const [activeTab, setActiveTab] = useState('home');
 const [searchQuery, setSearchQuery] = useState("");
 const [prayers, setPrayers] = useState([]);
 const [topics, setTopics] = useState([]);
 const [gratitudes, setGratitudes] = useState([]); // Новая коллекция
 const [loading, setLoading] = useState(true);
 const [authLoading, setAuthLoading] = useState(true);
 
 // UI States
 const [modalMode, setModalMode] = useState(null); // entry, topic, answer, settings, music, share, breathe, gratitude
 const [selectedItem, setSelectedItem] = useState(null);
 const [inputText, setInputText] = useState("");
 const [randomPrompt, setRandomPrompt] = useState("");
 const [randomGratitude, setRandomGratitude] = useState(null);

 const [nickname, setNickname] = useState("");
 const [password, setPassword] = useState("");
 const [authError, setAuthError] = useState("");

 // Music
 const [isPlaying, setIsPlaying] = useState(false);
 const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
 const audioRef = useRef(null);

 const cur = THEMES[theme];
 const isDark = theme === 'night' || theme === 'noir';

 // Player Logic
 useEffect(() => {
   if (!audioRef.current) { audioRef.current = new Audio(); audioRef.current.loop = true; }
   const audio = audioRef.current;
   const track = TRACKS[currentTrackIndex];
   if (track && audio.src !== new URL(track.file, window.location.href).href) {
     audio.src = track.file;
     audio.load();
   }
   if (isPlaying) audio.play().catch(() => {}); else audio.pause();
 }, [currentTrackIndex, isPlaying]);

 const nextTrack = () => setCurrentTrackIndex(p => (p + 1) % TRACKS.length);
 const prevTrack = () => setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length);

 useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);

 useEffect(() => {
   const unsub = onAuthStateChanged(auth, (u) => { setUser(u); if(u) setLoading(false); setAuthLoading(false); });
   return () => unsub();
 }, []);

 // Data Sync
 useEffect(() => {
   if (!user) return;
   setLoading(true);
   const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), orderBy('createdAt', 'desc')), s => setPrayers(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))));
   const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics')), s => setTopics(s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null, createdAt: d.data().createdAt?.toDate() || new Date() }))));
   const unsubG = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'gratitude')), s => setGratitudes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
   
   setLoading(false);
   return () => { unsubP(); unsubT(); unsubG(); };
 }, [user]);

 // --- ACTIONS ---
 const handleAuth = async () => {
   if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+)"); return; }
   setAuthLoading(true); setAuthError("");
   const email = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
   try { await signInWithEmailAndPassword(auth, email, password); }
   catch {
     try {
       const cred = await createUserWithEmailAndPassword(auth, email, password);
       await updateProfile(cred.user, { displayName: nickname });
     } catch (e) { setAuthError("Ошибка входа"); }
   }
   setAuthLoading(false);
 };

 const createItem = async () => {
   if (!inputText.trim()) return;
   const text = inputText; closeModal();
   if (modalMode === 'gratitude') {
     await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'gratitude'), { text, createdAt: serverTimestamp() });
     confetti({ particleCount: 50, spread: 40, origin: { y: 0.7 }, colors: ['#FFD700', '#FFA500'] });
   } else {
     const coll = modalMode === 'topic' ? 'prayer_topics' : 'prayers';
     const data = modalMode === 'topic' ? { title: text, status: 'active', count: 0, lastPrayedAt: null, createdAt: serverTimestamp() } : { text, status: 'active', createdAt: serverTimestamp(), comments: [] };
     await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, coll), data);
     setActiveTab(modalMode === 'topic' ? 'list' : 'home');
   }
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
   if (window.confirm("Удалить?")) {
      const coll = selectedItem.text && !selectedItem.status ? 'gratitude' : (selectedItem.title ? 'prayer_topics' : 'prayers');
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id));
      closeModal();
   }
 };

 const shakeGratitudeJar = () => {
   if (gratitudes.length === 0) return;
   const random = gratitudes[Math.floor(Math.random() * gratitudes.length)];
   setRandomGratitude(random);
   confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 }, colors: ['#FFD700'] });
 };

 const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); setRandomGratitude(null); };
 const generatePrompt = () => { setRandomPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]); if (modalMode !== 'entry') { setModalMode('entry'); setInputText(""); } };
 
 // Calculate Garden Progress
 const totalPrayers = prayers.length + topics.length;
 const gardenLevel = Math.floor(totalPrayers / 5) + 1;

 const list = useMemo(() => {
   const q = searchQuery.toLowerCase();
   if (activeTab === 'word' || activeTab === 'garden') return [];
   if (activeTab === 'vault') {
     const all = [...prayers, ...topics].filter(i => i.status === 'answered');
     return all.filter(i => (i.text || i.title || "").toLowerCase().includes(q)).sort(safeSort);
   }
   const src = activeTab === 'list' ? topics : prayers;
   return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q));
 }, [prayers, topics, activeTab, searchQuery]);

 if (!user) return (
   // LOGIN SCREEN
   <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: cur.fallback, fontFamily:'serif', padding: 20, color: cur.text}}>
     <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic'}}>Amen.</h1>
     <div style={{width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 15, marginTop: 40}}>
       <div style={{background: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '14px', display: 'flex', alignItems: 'center'}}><User size={18} style={{marginRight:10, opacity:0.5}}/><input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Имя" style={{border:'none', background:'transparent', fontSize:16, width:'100%', outline:'none', fontFamily:'sans-serif'}}/></div>
       <div style={{background: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '14px', display: 'flex', alignItems: 'center'}}><KeyRound size={18} style={{marginRight:10, opacity:0.5}}/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Пароль" style={{border:'none', background:'transparent', fontSize:16, width:'100%', outline:'none', fontFamily:'sans-serif'}}/></div>
       {authError && <p style={{fontSize:12, textAlign:'center', color:'red'}}>{authError}</p>}
       <button onClick={handleAuth} disabled={authLoading} style={{width:'100%', background: cur.primary, color:'white', border:'none', padding:'16px', borderRadius:30, fontSize:16, fontWeight:'bold'}}>{authLoading ? "..." : "Войти"}</button>
     </div>
   </div>
 );

 return (
   <div style={{ minHeight: '100vh', backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', fontFamily: '-apple-system, sans-serif', color: cur.text, transition: 'background 0.8s ease' }}>
     <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar {display:none;}`}</style>
     
     <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)'}}>
       
       {/* HEADER */}
       <div style={{padding: '50px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
         <div>
           <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 48, fontStyle: 'italic', margin: 0, lineHeight: 1}}>Amen.</h1>
           <p style={{fontSize: 12, opacity: 0.8, letterSpacing: 1, marginTop: 5, fontWeight:'bold'}}>{new Date().getHours()<12?"Доброе утро":"Добрый вечер"}, {user.displayName}</p>
         </div>
         <div style={{display:'flex', gap:10}}>
           <button onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.5}}/>}
           </button>
           <button onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
             <User size={20} color={cur.text}/>
           </button>
         </div>
       </div>

       {/* TABS */}
       <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto'}}>
         {[{id:'home', l:'Дневник'}, {id:'list', l:'Список'}, {id:'garden', l:'Сад'}, {id:'word', l:'Слово'}, {id:'vault', l:'Чудеса'}].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
             flex: 1, background: 'none', border: 'none', padding: '12px 10px', whiteSpace: 'nowrap',
             color: activeTab === tab.id ? cur.text : cur.text, opacity: activeTab === tab.id ? 1 : 0.6,
             fontWeight: activeTab === tab.id ? '800' : '500', fontSize: 14, borderBottom: activeTab === tab.id ? `3px solid ${cur.primary}` : 'none'
           }}>
             {tab.l}
           </button>
         ))}
       </div>

       {/* CONTENT */}
       <div style={{flex: 1, padding: '10px 20px 100px', overflowY: 'auto'}}>
         
         {/* GARDEN */}
         {activeTab === 'garden' && (
           <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{background: cur.card, borderRadius: 24, padding: 20, width: '100%', marginBottom: 20, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
                <h3 style={{fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontSize: 28, margin: '0 0 10px', color: cur.text}}>Ваш Духовный Сад</h3>
                <p style={{fontSize: 14, opacity: 0.7, marginBottom: 20}}>Каждая молитва растит цветок. Уровень: {gardenLevel}</p>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', minHeight: 100}}>
                  {[...Array(gardenLevel)].map((_, i) => (
                    <motion.div key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay: i*0.1}}>
                      {i % 5 === 0 ? <Flower size={24} color={cur.primary}/> : <Leaf size={20} color={cur.text} style={{opacity:0.6}}/>}
                    </motion.div>
                  ))}
                </div>
              </div>
             
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, width: '100%'}}>
                <button onClick={() => setModalMode('breathe')} style={{background: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer'}}>
                  <Wind size={32} color={cur.primary}/>
                  <span style={{fontWeight: 'bold', color: cur.text}}>Дыхание</span>
                </button>
                <button onClick={() => setModalMode('gratitude')} style={{background: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer'}}>
                  <Gift size={32} color={cur.primary}/>
                  <span style={{fontWeight: 'bold', color: cur.text}}>Кувшин</span>
                </button>
              </div>
           </div>
         )}

         {/* WORD */}
         {activeTab === 'word' && (
            <div style={{display: 'flex', gap: 16, overflowX: 'auto', padding: '0 4px 20px', scrollSnapType: 'x mandatory', height: '65vh'}}>
              {GOLDEN_VERSES.map((v, i) => {
                const style = CARD_STYLES[i % CARD_STYLES.length];
                return (
                  <div key={i} style={{
                    scrollSnapAlign: 'center', flexShrink: 0, width: '85vw', height: '100%',
                    background: style.bg, borderRadius: 32, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                    position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                  }}>
                    <div style={{position:'absolute', inset:0, background: style.decoration, filter: 'blur(60px)', opacity: 0.8}} />
                    <div style={{position:'relative', zIndex: 10}}>
                      <Book size={32} color={cur.primary} style={{marginBottom: 30, opacity: 0.5}}/>
                      <p style={{color: '#334155', fontSize: 24, fontWeight: '500', margin: '0 0 30px', fontStyle: 'italic', fontFamily:'Cormorant Garamond'}}>"{v.text}"</p>
                      <p style={{color: '#64748b', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase'}}>{v.ref}</p>
                    </div>
                  </div>
                )
              })}
            </div>
         )}
         
         {/* LISTS */}
         {(activeTab === 'home' || activeTab === 'list' || activeTab === 'vault') && (
           list.length === 0 ? <div style={{textAlign:'center', marginTop:80, opacity:0.6}}>Пусто...</div> : (
            <AnimatePresence mode='popLayout'>
              {list.map((item, i) => (
                <motion.div
                  key={item.id} layout initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} transition={{duration:0.3, delay: i*0.05}}
                  style={{background: cur.card, borderRadius: 24, padding: 20, marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)'}}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                    <div style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                      {activeTab === 'list' ? <><Wind size={12}/> {item.count}</> : formatDate(item.createdAt)}
                    </div>
                    <div style={{display:'flex', gap: 5}}>
                       <button onClick={() => {setSelectedItem(item); setModalMode('share');}} style={{background: 'none', border: 'none', padding: 5}}><Share2 size={16} color={cur.text} style={{opacity: 0.5}}/></button>
                       {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: cur.primary}}>Ответ?</button>}
                       <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5}}><Trash2 size={16} color={cur.text} style={{opacity: 0.5}}/></button>
                    </div>
                  </div>
                  <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500}}>{item.text || item.title}</p>
                  {activeTab === 'list' && <motion.button whileTap={{scale:0.97}} onClick={() => prayForTopic(item.id)} style={{width: '100%', background: 'rgba(255,255,255,0.4)', border: 'none', padding: 12, borderRadius: 14, marginTop: 8, color: cur.primary, fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'}}><Wind size={16}/> Помолиться</motion.button>}
                  {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.9}}>"{item.answerNote}"</div>}
                </motion.div>
              ))}
            </AnimatePresence>
          ))}
       </div>

       {/* FAB */}
       {(activeTab === 'home' || activeTab === 'list') && (
         <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10}}>
           <button onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : 'entry'); setInputText(""); }} style={{width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}80`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}><Plus size={36} strokeWidth={2.5}/></button>
         </div>
       )}
     </div>

     {/* MODALS */}
     {(modalMode === 'entry' || modalMode === 'topic' || modalMode === 'gratitude') && (
       <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,0.98)', zIndex: 100, padding: 24, display: 'flex', flexDirection: 'column'}}>
         <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
           <button onClick={closeModal} style={{background: 'none', border: 'none'}}><X size={32} color={cur.text}/></button>
           <button onClick={createItem} style={{background: cur.primary, color: 'white', border: 'none', padding: '10px 24px', borderRadius: 30, fontWeight: 'bold'}}>Сохранить</button>
         </div>
         {modalMode === 'gratitude' ? <h2 style={{fontFamily:'serif', fontStyle:'italic', color:cur.text}}>Благодарность</h2> :
          modalMode === 'entry' && !inputText && <button onClick={generatePrompt} style={{marginBottom:20, background:'rgba(0,0,0,0.05)', border:'none', padding:'10px 20px', borderRadius:20, color:cur.text, fontWeight:'bold'}}>✨ Идея</button>}
         <textarea autoFocus value={inputText || randomPrompt} onChange={e => {setInputText(e.target.value); setRandomPrompt("")}} placeholder={modalMode === 'gratitude' ? "За что спасибо?..." : "Мысли..."} style={{flex: 1, background: 'transparent', border: 'none', fontSize: 26, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: cur.text, outline: 'none', resize: 'none'}}/>
       </div>
     )}

     {modalMode === 'answer' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
         <div style={{background: 'white', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24}}>
           <h3 style={{margin: '0 0 10px', color: cur.text, fontFamily: 'serif', fontSize: 28, fontStyle: 'italic'}}>Свидетельство</h3>
           <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Опишите чудо..." style={{width: '100%', height: 120, padding: 16, borderRadius: 16, border: 'none', marginBottom: 20, fontSize: 16, fontFamily: 'sans-serif', resize: 'none', background: '#f1f5f9', color: cur.text, outline: 'none'}}/>
           <div style={{display: 'flex', gap: 10}}>
             <button onClick={closeModal} style={{flex: 1, padding: 14, borderRadius: 14, border: 'none', background: '#f1f5f9', color: cur.text, fontWeight: 'bold'}}>Отмена</button>
             <button onClick={saveAnswer} style={{flex: 1, padding: 14, borderRadius: 14, border: 'none', background: cur.primary, color: 'white', fontWeight: 'bold'}}>Сохранить</button>
           </div>
         </div>
       </div>
     )}

     {modalMode === 'breathe' && (
       <div style={{position: 'fixed', inset: 0, background: 'white', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
         <motion.div animate={{scale:[1, 1.5, 1], opacity:[0.3, 0.1, 0.3]}} transition={{duration:8, repeat: Infinity, ease: "easeInOut"}} style={{width: 200, height: 200, borderRadius: '50%', background: cur.primary, marginBottom: 60}}/>
         <h2 style={{fontFamily: 'serif', fontSize: 48, color: cur.text, margin: 0}}>Вдох...</h2>
         <button onClick={closeModal} style={{marginTop: 60, padding: '12px 30px', borderRadius: 30, border: '1px solid #e2e8f0', background: 'transparent', color: '#94a3b8'}}>Завершить</button>
       </div>
     )}

     {modalMode === 'share' && selectedItem && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={closeModal}>
         <div style={{background: 'white', width: '85%', padding: 40, borderRadius: 0, textAlign: 'center', backgroundImage: cur.bg, backgroundSize:'cover'}} onClick={e => e.stopPropagation()}>
           <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 40, fontStyle: 'italic', color: cur.text, marginBottom: 20}}>Amen.</h1>
           <p style={{fontSize: 20, lineHeight: 1.6, color: cur.text, fontWeight: '500'}}>{selectedItem.text || selectedItem.title}</p>
           <p style={{marginTop: 30, fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 2}}>{formatDate(selectedItem.createdAt)}</p>
         </div>
       </div>
     )}

     {/* MUSIC & SETTINGS MODALS (As before...) */}
     {modalMode === 'settings' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
         <div style={{background: 'white', width: '80%', maxWidth: 320, height: '100%', padding: 30, display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            {/* Content... */}
            <button onClick={logout} style={{marginTop:'auto', padding:16, border:'none', background:'#fee2e2', color:'red', borderRadius:16, fontWeight:'bold'}}>Выйти</button>
         </div>
       </div>
     )}
     {modalMode === 'music' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
          <div style={{background: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30}} onClick={e=>e.stopPropagation()}>
            {/* Player Content... */}
            <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:'40vh', overflowY:'auto'}}>
              {TRACKS.map((track, i) => (
                <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{background: i===currentTrackIndex ? cur.primary : '#f3f4f6', color: i===currentTrackIndex ? 'white' : '#333', border:'none', padding:15, borderRadius:12, textAlign:'left', fontWeight:'bold'}}>{track.title}</button>
              ))}
            </div>
          </div>
       </div>
     )}
   </div>
 );
};

export default AmenApp;
