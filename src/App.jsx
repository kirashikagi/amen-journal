import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Wind, BookOpen, Archive, Music, Volume2, VolumeX, Trash2,
  User, X, Sparkles, KeyRound, ArrowRight, Loader, Heart, Book
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

// --- 1. ВАШИ КЛЮЧИ (amen-journal) ---
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

// --- 2. ДАННЫЕ ---

// Ссылка на музыку (пока внешняя, потом замените на свою)
const MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=relaxing-mountains-rivers-19348.mp3";

const GOLDEN_VERSES = [
  { ref: "Филиппийцам 4:13", text: "Всё могу в укрепляющем меня Иисусе Христе." },
  { ref: "Иеремия 29:11", text: "Ибо только Я знаю намерения, какие имею о вас, говорит Господь, намерения во благо, а не на зло, чтобы дать вам будущность и надежду." },
  { ref: "Псалом 22:1", text: "Господь — Пастырь мой; я ни в чем не буду нуждаться." },
  { ref: "Исаия 41:10", text: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой; Я укреплю тебя, и помогу тебе, и поддержу тебя десницею правды Моей." },
  { ref: "Матфея 11:28", text: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас." },
  { ref: "Римлянам 8:28", text: "Притом знаем, что любящим Бога, призванным по Его изволению, все содействует ко благу." },
  { ref: "Притчи 3:5", text: "Надейся на Господа всем сердцем твоим, и не полагайся на разум твой." },
  { ref: "Иоанна 3:16", text: "Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную." }
];

const THEMES = {
  dawn: { id: 'dawn', name: 'Рассвет', bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fff7ed 100%)', primary: '#e11d48', fab: '#e11d48', text: '#881337', card: 'rgba(255, 255, 255, 0.7)' },
  ocean: { id: 'ocean', name: 'Север', bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)', primary: '#0284c7', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.7)' },
  forest: { id: 'forest', name: 'Эдем', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)', primary: '#15803d', text: '#14532d', card: 'rgba(255, 255, 255, 0.7)' },
  dusk: { id: 'dusk', name: 'Закат', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)', primary: '#ea580c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.7)' },
  night: { id: 'night', name: 'Полночь', bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.6)' },
  noir: { id: 'noir', name: 'Нуар', bg: 'linear-gradient(135deg, #171717 0%, #262626 100%)', primary: '#fafafa', text: '#a3a3a3', card: 'rgba(64, 64, 64, 0.5)' }
};

const PROMPTS = ["Кого простить?", "За что благодарны?", "Ваша тревога?", "Первая мысль утром?", "Ваша мечта?", "О ком позаботиться?"];

const AmenApp = () => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
  const [activeTab, setActiveTab] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const [prayers, setPrayers] = useState([]); 
  const [topics, setTopics] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Auth
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Music
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio(MUSIC_URL));

  // UI
  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputText, setInputText] = useState("");
  const [randomPrompt, setRandomPrompt] = useState("");

  const cur = THEMES[theme];
  const isDark = theme === 'night' || theme === 'noir';

  // Music Effect
  useEffect(() => {
    audioRef.current.loop = true;
    if (isPlaying) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Приветствие
  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
  };

  useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setLoading(false);
    });
    return () => unsub();
  }, []);

  // Sync Data
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
      const data = s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null }));
      data.sort((a,b) => (a.lastPrayedAt || 0) - (b.lastPrayedAt || 0));
      setTopics(data);
    });
    return () => { unsubP(); unsubT(); };
  }, [user]);

  // --- AUTH ---
  const handleAuth = async () => {
    if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+) обязательны"); return; }
    setAuthLoading(true); setAuthError("");
    const email = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCred.user, { displayName: nickname });
        } catch (e) { setAuthError("Имя занято или пароль слабый"); }
      } else { setAuthError("Ошибка входа"); }
    }
    setAuthLoading(false);
  };

  const logout = () => { signOut(auth); setNickname(""); setPassword(""); setIsPlaying(false); };

  // --- LOGIC ---
  const createItem = async () => {
    if (!inputText.trim()) return;
    const text = inputText; closeModal();
    const coll = modalMode === 'topic' ? 'prayer_topics' : 'prayers';
    const data = modalMode === 'topic' 
      ? { title: text, status: 'active', count: 0, lastPrayedAt: null, createdAt: serverTimestamp() }
      : { text, status: 'active', createdAt: serverTimestamp(), comments: [] };
    
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, coll), data);
    setActiveTab(modalMode === 'topic' ? 'list' : 'home');
  };

  const saveAnswer = async () => {
    if (!selectedItem) return;
    const coll = activeTab === 'list' ? 'prayer_topics' : 'prayers';
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
    // Спрашиваем подтверждение через нативный браузерный алерт для надежности
    if (window.confirm("Вы точно хотите удалить эту запись?")) {
       const coll = selectedItem.title ? 'prayer_topics' : 'prayers';
       await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id));
       closeModal();
    }
  };

  const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };
  const generatePrompt = () => { setRandomPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]); if (modalMode !== 'entry') { setModalMode('entry'); setInputText(""); } };

  const list = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'bible') return []; // Для Библии свой рендер
    if (activeTab === 'vault') {
      const all = [...prayers, ...topics].filter(i => i.status === 'answered');
      return all.filter(i => (i.text || i.title || "").toLowerCase().includes(q)).sort((a,b) => (b.answeredAt?.seconds || 0) - (a.answeredAt?.seconds || 0));
    }
    const src = activeTab === 'list' ? topics : prayers;
    return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q));
  }, [prayers, topics, activeTab, searchQuery]);

  // --- RENDER ---
  if (!user) return (
    <div className="animated-bg" style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: cur.bg, fontFamily:'serif', padding: 20, color: cur.text}}>
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:1}}>
        <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic'}}>Amen.</h1>
      </motion.div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} style={{width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 15, marginTop: 40}}>
        <div style={{background: isDark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.8)', borderRadius: 20, padding: '14px 20px', display: 'flex', alignItems: 'center'}}>
          <User size={18} style={{marginRight: 10, opacity: 0.5}}/>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{border: 'none', background: 'transparent', fontSize: 16, width: '100%', outline: 'none', color: 'inherit', fontFamily: 'sans-serif'}}/>
        </div>
        <div style={{background: isDark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.8)', borderRadius: 20, padding: '14px 20px', display: 'flex', alignItems: 'center'}}>
          <KeyRound size={18} style={{marginRight: 10, opacity: 0.5}}/>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Секретный пароль" style={{border: 'none', background: 'transparent', fontSize: 16, width: '100%', outline: 'none', color: 'inherit', fontFamily: 'sans-serif'}}/>
        </div>
        {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, opacity: 0.8}}>{authError}</p>}
        <motion.button whileTap={{scale:0.95}} onClick={handleAuth} disabled={authLoading} style={{width: '100%', background: cur.primary, color: isDark?'black':'white', border: 'none', padding: '16px', borderRadius: 30, fontSize: 16, fontWeight: 'bold', opacity: authLoading?0.7:1, display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, cursor: 'pointer'}}>
          {authLoading ? <Loader className="animate-spin"/> : <>Открыть <ArrowRight/></>}
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div className="animated-bg" style={{ minHeight: '100vh', background: cur.bg, fontFamily: '-apple-system, sans-serif', color: cur.text, transition: 'color 0.5s' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}`}</style>
      
      <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
        
        {/* HEADER */}
        <div style={{padding: '50px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}}>
            <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 48, fontStyle: 'italic', margin: 0, lineHeight: 1}}>Amen.</h1>
            <p style={{fontSize: 12, opacity: 0.6, letterSpacing: 1, marginTop: 5}}>{getGreeting()}, {user.displayName}</p>
          </motion.div>
          <div style={{display:'flex', gap: 10}}>
             <motion.button whileTap={{scale:0.9}} onClick={() => setIsPlaying(!isPlaying)} style={{background: isDark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.5)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.5}}/>}
             </motion.button>
             <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: isDark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.5)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <User size={20} color={cur.text}/>
             </motion.button>
          </div>
        </div>

        {/* TABS */}
        <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto', scrollbarWidth: 'none'}}>
          {[{id:'home', l:'Дневник'}, {id:'list', l:'Список'}, {id:'bible', l:'Библия'}, {id:'vault', l:'Чудеса'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, background: 'none', border: 'none', padding: '12px 0', whiteSpace: 'nowrap',
              color: activeTab === tab.id ? cur.primary : cur.text, opacity: activeTab === tab.id ? 1 : 0.5,
              fontWeight: activeTab === tab.id ? '700' : '500', fontSize: 14, position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
            }}>
              {tab.l}
              {activeTab === tab.id && <motion.div layoutId="underline" style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: cur.primary, borderRadius:2}} />}
            </button>
          ))}
        </div>

        {/* CONTENT LIST */}
        <div style={{flex: 1, padding: '10px 20px 100px', overflowY: 'auto'}}>
          {/* Вкладка Библии */}
          {activeTab === 'bible' ? (
             <div style={{display: 'grid', gap: 15}}>
               {GOLDEN_VERSES.map((v, i) => (
                 <motion.div key={i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} 
                   style={{background: cur.card, borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(255,255,255,0.1)'}}>
                   <p style={{margin: '0 0 10px', fontSize: 16, fontStyle: 'italic', lineHeight: 1.6}}>"{v.text}"</p>
                   <p style={{margin: 0, fontSize: 12, fontWeight: 'bold', color: cur.primary, textAlign: 'right'}}>{v.ref}</p>
                 </motion.div>
               ))}
             </div>
          ) : loading ? <div style={{textAlign:'center', marginTop:50, opacity:0.5}}><Loader className="animate-spin" style={{margin:'0 auto'}}/></div> :
           list.length === 0 ? (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign: 'center', marginTop: 80, opacity: 0.6}}>
                <div style={{fontStyle: 'italic', marginBottom: 20}}>
                  {activeTab === 'home' ? "Здесь живут ваши мысли..." : activeTab === 'list' ? "Добавьте постоянные нужды." : "Место для свидетельств."}
                </div>
                {activeTab === 'home' && <button onClick={generatePrompt} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: '10px 20px', borderRadius: 20, color: cur.primary, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'}}>✨ О чем помолиться?</button>}
             </motion.div>
           ) : (
             <AnimatePresence mode='popLayout'>
               {list.map((item, i) => (
                 <motion.div 
                   key={item.id} layout initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} transition={{duration:0.3, delay: i*0.05}}
                   style={{
                     background: cur.card, borderRadius: 24, padding: 20, marginBottom: 12, 
                     boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(255,255,255,0.1)',
                     backdropFilter: 'blur(10px)'
                   }}
                 >
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                     <div style={{fontSize: 11, opacity: 0.5, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                       {activeTab === 'list' ? <><Wind size={12}/> {item.count}</> : item.createdAt?.toLocaleDateString()}
                     </div>
                     <div style={{display:'flex', gap: 5}}>
                        {activeTab !== 'vault' && (
                          <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: isDark?'rgba(255,255,255,0.1)':'#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: cur.primary, cursor: 'pointer'}}>Ответ?</button>
                        )}
                        <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5, cursor: 'pointer'}}><Trash2 size={14} color={cur.text} style={{opacity: 0.4}}/></button>
                     </div>
                   </div>
                   <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500}}>{item.text || item.title}</p>
                   
                   {activeTab === 'list' && (
                     <motion.button whileTap={{scale:0.97}} onClick={() => prayForTopic(item.id)} style={{width: '100%', background: isDark ? 'rgba(255,255,255,0.1)' : '#f8fafc', border: 'none', padding: 12, borderRadius: 14, marginTop: 8, color: cur.primary, fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'}}>
                       <Wind size={16}/> Помолиться сейчас
                     </motion.button>
                   )}
                   
                   {activeTab === 'vault' && item.answerNote && (
                     <div style={{background: isDark ? 'rgba(0,0,0,0.2)' : '#fff', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: isDark ? '#cbd5e1' : '#475569'}}>"{item.answerNote}"</div>
                   )}
                 </motion.div>
               ))}
             </AnimatePresence>
           )
          }
        </div>

        {/* FAB (КНОПКА ДОБАВЛЕНИЯ) - Только для Дневника и Списка */}
        {(activeTab === 'home' || activeTab === 'list') && (
          <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10}}>
            <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
              <Plus size={36} strokeWidth={2.5}/>
            </motion.button>
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
          {modalMode === 'entry' && !inputText && (<div style={{marginBottom: 20}}><button onClick={generatePrompt} style={{background: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: 20, color: cur.primary, fontSize: 13, fontWeight: '600', display: 'flex', gap: 6, alignItems: 'center'}}><Sparkles size={14}/> Идея</button></div>)}
          <textarea autoFocus value={inputText || randomPrompt} onChange={e => {setInputText(e.target.value); setRandomPrompt("")}} placeholder={modalMode === 'topic' ? "Например: Семья..." : "О чем болит сердце?..."} style={{flex: 1, background: 'transparent', border: 'none', fontSize: 26, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: cur.text, outline: 'none', resize: 'none', lineHeight: 1.4}}/>
        </div>
      )}

      {modalMode === 'answer' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.3)'}}>
            <h3 style={{margin: '0 0 10px', color: cur.text, fontFamily: 'serif', fontSize: 28, fontStyle: 'italic'}}>Свидетельство</h3>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Опишите чудо..." style={{width: '100%', height: 120, padding: 16, borderRadius: 16, border: 'none', marginBottom: 20, fontSize: 16, fontFamily: 'sans-serif', resize: 'none', background: isDark ? '#0f172a' : '#f1f5f9', color: cur.text, outline: 'none'}}/>
            <div style={{display: 'flex', gap: 10}}>
              <button onClick={closeModal} style={{flex: 1, padding: 14, borderRadius: 14, border: 'none', background: isDark?'#334155':'#f1f5f9', color: isDark?'white':'#64748b', fontWeight: 'bold'}}>Отмена</button>
              <button onClick={saveAnswer} style={{flex: 1, padding: 14, borderRadius: 14, border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold'}}>Сохранить</button>
            </div>
          </motion.div>
        </div>
      )}

      {modalMode === 'settings' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
          <motion.div initial={{x:100}} animate={{x:0}} style={{background: isDark?'#1e293b':'white', width: '80%', maxWidth: 320, height: '100%', padding: 30, display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom: 30, fontFamily: 'serif', fontSize: 32, color: cur.text}}>Настройки</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 40}}>
              {Object.keys(THEMES).map(t => (<button key={t} onClick={() => setTheme(t)} style={{width: 44, height: 44, borderRadius: '50%', background: THEMES[t].bg, border: theme === t ? `2px solid ${cur.text}` : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer'}}/>))}
            </div>
            <div style={{marginTop: 'auto'}}><button onClick={logout} style={{width: '100%', padding: 16, background: isDark?'#334155':'#f1f5f9', border: 'none', borderRadius: 16, color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'}}><LogOut size={18}/> Выйти</button></div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AmenApp;
