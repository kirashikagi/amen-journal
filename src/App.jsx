import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Wind, BookOpen, Archive, Music, Volume2, VolumeX, Trash2,
  User, X, Sparkles, KeyRound, ArrowRight, Loader, Heart, Book, Star, LogOut, AlertTriangle
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

// --- 2. ТЕМЫ (С ЛОКАЛЬНЫМИ ФОНАМИ) ---
const THEMES = {
  dawn: { 
    id: 'dawn', name: 'Рассвет', 
    bg: 'url("/backgrounds/dawn.jpg")', 
    primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.75)'
  },
  ocean: { 
    id: 'ocean', name: 'Глубина', 
    bg: 'url("/backgrounds/ocean.jpg")', 
    primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.75)'
  },
  forest: { 
    id: 'forest', name: 'Эдем', 
    bg: 'url("/backgrounds/forest.jpg")', 
    primary: '#15803d', text: '#14532d', card: 'rgba(255, 255, 255, 0.8)'
  },
  dusk: {
    id: 'dusk', name: 'Закат',
    bg: 'url("/backgrounds/dusk.jpg")', 
    primary: '#c2410c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.75)'
  },
  night: { 
    id: 'night', name: 'Звезды', 
    bg: 'url("/backgrounds/night.jpg")', 
    primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.6)'
  },
  noir: {
    id: 'noir', name: 'Крест',
    bg: 'url("/backgrounds/noir.jpg")', 
    primary: '#404040', text: '#e5e5e5', card: 'rgba(23, 23, 23, 0.6)'
  }
};

// --- ДАННЫЕ ---
const GOLDEN_VERSES = [
  { text: "Всё могу в укрепляющем меня Иисусе Христе.", ref: "Филиппийцам 4:13", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80" },
  { text: "Ибо только Я знаю намерения, какие имею о вас...", ref: "Иеремия 29:11", img: "https://images.unsplash.com/photo-1504194921103-f8b80cadd5e4?auto=format&fit=crop&w=600&q=80" },
  { text: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", ref: "Псалом 22:1", img: "https://images.unsplash.com/photo-1484557985045-6b5c033cdde4?auto=format&fit=crop&w=600&q=80" },
  { text: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", ref: "Исаия 41:10", img: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=600&q=80" },
  { text: "Придите ко Мне все труждающиеся и обремененные.", ref: "Матфея 11:28", img: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=600&q=80" },
  { text: "Любовь долготерпит, милосердствует...", ref: "1 Коринфянам 13:4", img: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=600&q=80" }
];

const PROMPTS = ["Кого простить?", "За что благодарны?", "Ваша тревога?", "Первая мысль утром?", "Ваша мечта?", "О ком позаботиться?"];
const MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=relaxing-mountains-rivers-19348.mp3";

// Хелпер для безопасной даты
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  } catch (e) { return ''; }
};

// Безопасная сортировка
const safeSort = (a, b) => {
  const dateA = a.answeredAt?.seconds || a.createdAt?.seconds || 0;
  const dateB = b.answeredAt?.seconds || b.createdAt?.seconds || 0;
  return dateB - dateA;
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
  const [randomPrompt, setRandomPrompt] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef(new Audio(MUSIC_URL));
  const cur = THEMES[theme];
  const isDark = theme === 'night' || theme === 'noir';

  useEffect(() => {
    audioRef.current.loop = true;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setLoading(false);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const qP = query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), orderBy('createdAt', 'desc'));
    const unsubP = onSnapshot(qP, (s) => {
      setPrayers(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })));
      setLoading(false);
    });
    const qT = query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics'));
    const unsubT = onSnapshot(qT, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null, createdAt: d.data().createdAt?.toDate() || new Date() }));
      data.sort((a,b) => (a.lastPrayedAt || 0) - (b.lastPrayedAt || 0));
      setTopics(data);
    });
    return () => { unsubP(); unsubT(); };
  }, [user]);

  const handleAuth = async () => {
    if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+) обязательны"); return; }
    setAuthLoading(true); setAuthError("");
    const safeNick = nickname.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user' + Math.floor(Math.random()*1000);
    const email = `${safeNick}@amen.local`;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: nickname });
      } catch (e) { setAuthError("Это имя уже занято или неверный пароль."); }
    }
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
    if (window.confirm("Удалить эту запись навсегда?")) {
       const coll = (selectedItem.title) ? 'prayer_topics' : 'prayers';
       await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id));
       closeModal();
    }
  };

  const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };
  const generatePrompt = () => { setRandomPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]); if (modalMode !== 'entry') { setModalMode('entry'); setInputText(""); } };
  const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

  const list = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'word') return [];
    if (activeTab === 'vault') {
      const p = prayers.filter(i => i.status === 'answered');
      const t = topics.filter(i => i.status === 'answered');
      return [...p, ...t].filter(i => (i.text || i.title || "").toLowerCase().includes(q)).sort(safeSort);
    }
    const src = activeTab === 'list' ? topics : prayers;
    return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q));
  }, [prayers, topics, activeTab, searchQuery]);

  if (!user) return (
    <div className="animated-bg" style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: cur.bg, fontFamily:'serif', padding: 20, color: cur.text, backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:1}}>
        <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic'}}>Amen.</h1>
      </motion.div>
      <div style={{width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 15, marginTop: 40}}>
        <div style={{background: isDark?'rgba(0,0,0,0.3)':'rgba(255,255,255,0.8)', borderRadius: 20, padding: '14px 20px', display: 'flex', alignItems: 'center'}}>
          <User size={18} style={{marginRight: 10, opacity: 0.5}}/>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{border: 'none', background: 'transparent', fontSize: 16, width: '100%', outline: 'none', color: 'inherit', fontFamily: 'sans-serif'}}/>
        </div>
        <div style={{background: isDark?'rgba(0,0,0,0.3)':'rgba(255,255,255,0.8)', borderRadius: 20, padding: '14px 20px', display: 'flex', alignItems: 'center'}}>
          <KeyRound size={18} style={{marginRight: 10, opacity: 0.5}}/>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{border: 'none', background: 'transparent', fontSize: 16, width: '100%', outline: 'none', color: 'inherit', fontFamily: 'sans-serif'}}/>
        </div>
        {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, opacity: 0.8, background: 'rgba(255,0,0,0.1)', padding: 5, borderRadius: 8}}>{authError}</p>}
        <motion.button whileTap={{scale:0.95}} onClick={handleAuth} disabled={authLoading} style={{width: '100%', background: cur.primary, color: isDark?'black':'white', border: 'none', padding: '16px', borderRadius: 30, fontSize: 16, fontWeight: 'bold', opacity: authLoading?0.7:1, display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, cursor: 'pointer'}}>
          {authLoading ? <Loader className="animate-spin"/> : <>Войти <ArrowRight/></>}
        </motion.button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', fontFamily: '-apple-system, sans-serif', color: cur.text, transition: 'background 0.8s ease' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}`}</style>
      <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)'}}>
        <div style={{padding: '50px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 48, fontStyle: 'italic', margin: 0, lineHeight: 1}}>Amen.</h1>
            <p style={{fontSize: 12, opacity: 0.8, letterSpacing: 1, marginTop: 5, fontWeight:'bold'}}>{getGreeting()}, {user.displayName}</p>
          </div>
          <div style={{display:'flex', gap:10}}>
            <motion.button whileTap={{scale:0.9}} onClick={() => setIsPlaying(!isPlaying)} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               {isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.5}}/>}
            </motion.button>
            <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <User size={20} color={cur.text}/>
            </motion.button>
          </div>
        </div>
        <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto', scrollbarWidth: 'none'}}>
          {[{id:'home', l:'Дневник'}, {id:'list', l:'Список'}, {id:'word', l:'Слово'}, {id:'vault', l:'Чудеса'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, background: 'none', border: 'none', padding: '12px 10px', whiteSpace: 'nowrap',
              color: activeTab === tab.id ? cur.text : cur.text, opacity: activeTab === tab.id ? 1 : 0.6,
              fontWeight: activeTab === tab.id ? '800' : '500', fontSize: 14, position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
            }}>
              {tab.l}
              {activeTab === tab.id && <motion.div layoutId="underline" style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: cur.primary, borderRadius:2}} />}
            </button>
          ))}
        </div>
        <div style={{flex: 1, padding: '10px 20px 100px', overflowY: 'auto'}}>
          {activeTab === 'word' ? (
             <div style={{display: 'grid', gap: 20}}>
               {GOLDEN_VERSES.map((v, i) => (
                 <motion.div key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} style={{position: 'relative', borderRadius: 24, overflow: 'hidden', height: 200, boxShadow: '0 10px 30px rgba(0,0,0,0.15)'}}>
                   <img src={v.img} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                   <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}>
                     <p style={{color: 'white', fontSize: 16, fontWeight: 'bold', margin: '0 0 5px', fontStyle: 'italic'}}>"{v.text}"</p>
                     <p style={{color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'right'}}>{v.ref}</p>
                   </div>
                 </motion.div>
               ))}
             </div>
          ) : loading ? <div style={{textAlign:'center', marginTop:50, opacity:0.5}}><Loader className="animate-spin" style={{margin:'0 auto'}}/></div> :
           list.length === 0 ? (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign: 'center', marginTop: 80, opacity: 0.8}}>
                <div style={{fontStyle: 'italic', marginBottom: 20, background: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 20}}>
                  {activeTab === 'home' ? "Здесь живут ваши мысли..." : activeTab === 'list' ? "Добавьте постоянные нужды." : "Место для ваших свидетельств."}
                </div>
                {activeTab === 'home' && <button onClick={generatePrompt} style={{background: 'white', border: 'none', padding: '12px 24px', borderRadius: 30, color: cur.primary, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>✨ О чем помолиться?</button>}
             </motion.div>
           ) : (
             <AnimatePresence mode='popLayout'>
               {list.map((item, i) => (
                 <motion.div key={item.id} layout initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} transition={{duration:0.3, delay: i*0.05}} style={{background: cur.card, borderRadius: 24, padding: 20, marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                     <div style={{fontSize: 11, opacity: 0.6, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                       {activeTab === 'list' ? <><Wind size={12}/> {item.count}</> : formatDate(item.createdAt)}
                     </div>
                     <div style={{display:'flex', gap: 5}}>
                        {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'white', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: cur.primary, cursor: 'pointer'}}>Ответ?</button>}
                        <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5, cursor: 'pointer'}}><Trash2 size={16} color={cur.text} style={{opacity: 0.4}}/></button>
                     </div>
                   </div>
                   <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500}}>{item.text || item.title}</p>
                   {activeTab === 'list' && <motion.button whileTap={{scale:0.97}} onClick={() => prayForTopic(item.id)} style={{width: '100%', background: 'rgba(255,255,255,0.5)', border: 'none', padding: 12, borderRadius: 14, marginTop: 8, color: cur.primary, fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'}}><Wind size={16}/> Помолиться сейчас</motion.button>}
                   {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.5)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.8}}>"{item.answerNote}"</div>}
                 </motion.div>
               ))}
             </AnimatePresence>
           )
          }
        </div>
        {(activeTab === 'home' || activeTab === 'list') && (
          <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10}}>
            <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}80`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}><Plus size={36} strokeWidth={2.5}/></motion.button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {(modalMode === 'entry' || modalMode === 'topic') && (
        <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,0.98)', zIndex: 100, padding: 24, display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center'}}>
            <button onClick={closeModal} style={{background: 'none', border: 'none'}}><X size={32} color={cur.text}/></button>
            <button onClick={createItem} style={{background: cur.primary, color: isDark?'black':'white', border: 'none', padding: '10px 24px', borderRadius: 30, fontWeight: 'bold', fontSize: 16}}>{modalMode === 'topic' ? 'Сохранить' : 'Аминь'}</button>
          </div>
          {modalMode === 'entry' && !inputText && (<div style={{marginBottom: 20}}><button onClick={generatePrompt} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: '10px 20px', borderRadius: 20, color: cur.text, fontSize: 13, fontWeight: '600', display: 'flex', gap: 6, alignItems: 'center'}}><Sparkles size={14}/> Идея</button></div>)}
          <textarea autoFocus value={inputText || randomPrompt} onChange={e => {setInputText(e.target.value); setRandomPrompt("")}} placeholder={modalMode === 'topic' ? "Например: Семья..." : "О чем болит сердце?..."} style={{flex: 1, background: 'transparent', border: 'none', fontSize: 26, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: cur.text, outline: 'none', resize: 'none', lineHeight: 1.4}}/>
        </div>
      )}

      {modalMode === 'answer' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.3)'}}>
            <h3 style={{margin: '0 0 10px', color: cur.text, fontFamily: 'serif', fontSize: 28, fontStyle: 'italic'}}>Свидетельство</h3>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Опишите чудо..." style={{width: '100%', height: 120, padding: 16, borderRadius: 16, border: 'none', marginBottom: 20, fontSize: 16, fontFamily: 'sans-serif', resize: 'none', background: isDark ? '#0f172a' : '#f1f5f9', color: cur.text, outline: 'none'}}/>
            <div style={{display: 'flex', gap: 10}}>
              <button onClick={closeModal} style={{flex: 1, padding: 14, borderRadius: 14, border: 'none', background: 'rgba(0,0,0,0.05)', color: cur.text, fontWeight: 'bold'}}>Отмена</button>
              <button onClick={saveAnswer} style={{flex: 1, padding: 14, borderRadius: 14, border: 'none', background: cur.primary, color: 'white', fontWeight: 'bold'}}>Сохранить</button>
            </div>
          </motion.div>
        </div>
      )}

      {modalMode === 'settings' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
          <motion.div initial={{x:100}} animate={{x:0}} style={{background: isDark?'#1e293b':'white', width: '80%', maxWidth: 320, height: '100%', padding: 30, display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom: 30, fontFamily: 'serif', fontSize: 32, color: cur.text}}>Настройки</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 40}}>
              {Object.keys(THEMES).map(t => (
                <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                  <div style={{width: 50, height: 50, borderRadius: 16, background: THEMES[t].bg, backgroundSize:'cover', border: theme === t ? `3px solid ${cur.text}` : '1px solid rgba(0,0,0,0.1)'}}/>
                  <span style={{fontSize:10, color:cur.text}}>{THEMES[t].name}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop: 'auto'}}><button onClick={logout} style={{width: '100%', padding: 16, background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 16, color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'}}><LogOut size={18}/> Выйти</button></div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AmenApp;
