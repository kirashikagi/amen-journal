import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Wind, BookOpen, Archive, Music, Volume2, VolumeX, Trash2,
  User, X, Sparkles, KeyRound, ArrowRight, Loader, Heart, Book, Star, LogOut, AlertTriangle, ChevronRight,
  SkipBack, SkipForward, Play, Pause
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

// --- 2. ВАША МУЗЫКА ---
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

// --- 3. АБСТРАКТНЫЕ ФОНЫ ДЛЯ КАРТОЧЕК ---
const CARD_STYLES = [
  { bg: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', decoration: 'radial-gradient(circle at 90% 10%, rgba(255, 200, 100, 0.2), transparent 40%)' }, // Светлый теплый
  { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', decoration: 'radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.1), transparent 50%)' }, // Небесный
  { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', decoration: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1), transparent 60%)' }, // Эдем
  { bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', decoration: 'radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.15), transparent 40%)' }, // Лаванда
  { bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', decoration: 'radial-gradient(circle at 80% 80%, rgba(244, 63, 94, 0.1), transparent 40%)' }, // Роза
  { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', decoration: 'radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.1), transparent 50%)' }, // Закат
  { bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', decoration: 'radial-gradient(circle at 50% 100%, rgba(148, 163, 184, 0.2), transparent 60%)' }, // Туман
];

const GOLDEN_VERSES = [
  { text: "Всё могу в укрепляющем меня Иисусе Христе.", ref: "Филиппийцам 4:13" },
  { text: "Ибо только Я знаю намерения, какие имею о вас, говорит Господь, намерения во благо.", ref: "Иеремия 29:11" },
  { text: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", ref: "Псалом 22:1" },
  { text: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой; Я укреплю тебя и помогу тебе.", ref: "Исаия 41:10" },
  { text: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас.", ref: "Матфея 11:28" },
  { text: "Любовь долготерпит, милосердствует, любовь не завидует, не превозносится.", ref: "1 Коринфянам 13:4" },
  { text: "Мир оставляю вам, мир Мой даю вам; не так, как мир дает, Я даю вам.", ref: "Иоанна 14:27" },
  { text: "Будьте тверды и мужественны, не бойтесь, ибо Господь Бог твой пойдет с тобою.", ref: "Второзаконие 31:6" },
  { text: "Надейся на Господа всем сердцем твоим, и не полагайся на разум твой.", ref: "Притчи 3:5" },
  { text: "А надеющиеся на Господа обновятся в силе: поднимут крылья, как орлы.", ref: "Исаия 40:31" },
  { text: "Все заботы ваши возложите на Него, ибо Он печется о вас.", ref: "1 Петра 5:7" },
  { text: "Остановитесь и познайте, что Я — Бог.", ref: "Псалом 45:11" },
  { text: "Ибо не дал нам Бог духа боязни, но силы и любви и целомудрия.", ref: "2 Тимофею 1:7" },
  { text: "Возвожу очи мои к горам, откуда придет помощь моя. Помощь моя от Господа.", ref: "Псалом 120:1-2" },
  { text: "По милости Господа мы не исчезли, ибо милосердие Его не истощилось.", ref: "Плач Иеремии 3:22" },
  { text: "Ищите же прежде Царства Божия и правды Его, и это все приложится вам.", ref: "Матфея 6:33" },
  { text: "Вера же есть осуществление ожидаемого и уверенность в невидимом.", ref: "Евреям 11:1" },
  { text: "Все у вас да будет с любовью.", ref: "1 Коринфянам 16:14" },
  { text: "И всё, что делаете, делайте от души, как для Господа.", ref: "Колоссянам 3:23" },
  { text: "Господь — свет мой и спасение мое: кого мне бояться?", ref: "Псалом 26:1" },
  { text: "Плод же духа: любовь, радость, мир, долготерпение, благость, милосердие, вера.", ref: "Галатам 5:22" },
  { text: "Будьте друг ко другу добры, сострадательны, прощайте друг друга.", ref: "Ефесянам 4:32" },
  { text: "Вкусите, и увидите, как благ Господь! Блажен человек, который уповает на Него!", ref: "Псалом 33:9" },
  { text: "Утешайтесь надеждою; в скорби будьте терпеливы, в молитве постоянны.", ref: "Римлянам 12:12" },
  { text: "Всегда радуйтесь. Непрестанно молитесь. За все благодарите.", ref: "1 Фессалоникийцам 5:16-18" },
  { text: "Имя Господа — крепкая башня: убегает в нее праведник и безопасен.", ref: "Притчи 18:10" },
  { text: "Слово Твое — светильник ноге моей и свет стезе моей.", ref: "Псалом 118:105" },
  { text: "Господь Бог твой среди тебя, Он силен спасти тебя.", ref: "Софония 3:17" },
  { text: "Вы — свет мира. Не может укрыться город, стоящий на верху горы.", ref: "Матфея 5:14" },
  { text: "Бог же надежды да исполнит вас всякой радости и мира в вере.", ref: "Римлянам 15:13" }
];

const THEMES = {
  dawn: { id: 'dawn', name: 'Рассвет', bg: 'radial-gradient(circle at 50% 20%, rgba(255,228,230,1) 0%, rgba(254,202,202,1) 40%, rgba(255,237,213,1) 100%)', primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.45)' },
  ocean: { id: 'ocean', name: 'Глубина', bg: 'radial-gradient(circle at 10% 20%, rgb(186, 230, 253) 0%, rgb(125, 211, 252) 40%, rgb(56, 189, 248) 90%)', primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.45)' },
  forest: { id: 'forest', name: 'Эдем', bg: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)', primary: '#15803d', text: '#14532d', card: 'rgba(255, 255, 255, 0.5)' },
  dusk: { id: 'dusk', name: 'Закат', bg: 'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)', primary: '#c2410c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.45)' },
  night: { id: 'night', name: 'Звезды', bg: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(15, 23, 42, 0.5)' },
  noir: { id: 'noir', name: 'Крест', bg: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)', primary: '#404040', text: '#171717', card: 'rgba(255, 255, 255, 0.5)' }
};

const PROMPTS = ["Кого простить?", "За что благодарны?", "Ваша тревога?", "Первая мысль утром?", "Ваша мечта?", "О ком позаботиться?"];

// Хелперы
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try { if (timestamp.toDate) return timestamp.toDate().toLocaleDateString(); return new Date(timestamp).toLocaleDateString(); } catch (e) { return ''; }
};
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
  
  // Music Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  // Инициализация аудио с первым треком
  const audioRef = useRef(null);
  
  const cur = THEMES[theme];
  const isDark = theme === 'night' || theme === 'noir';

  // Эффект для смены трека и управления воспроизведением
  useEffect(() => {
    // Создаем аудио только на клиенте
    if (!audioRef.current) {
        audioRef.current = new Audio(TRACKS[0].file);
    }
    const audio = audioRef.current;
    
    // Если сменился трек, обновляем src
    if (audio.src !== new URL(TRACKS[currentTrackIndex].file, window.location.href).href) {
       audio.src = TRACKS[currentTrackIndex].file;
       audio.load();
    }

    audio.loop = true;

    if (isPlaying) {
      audio.play().catch(error => {
        console.log("Autoplay prevented or source error:", error);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  // Хендлеры плеера
  const nextTrack = () => setCurrentTrackIndex(prev => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex(prev => (prev - 1 + TRACKS.length) % TRACKS.length);

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
    const data = modalMode === 'topic' 
      ? { title: text, status: 'active', count: 0, lastPrayedAt: null, createdAt: serverTimestamp() }
      : { text, status: 'active', createdAt: serverTimestamp(), comments: [] };
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
        <div style={{background: isDark?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.85)', borderRadius: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(10px)'}}>
          <User size={18} style={{marginRight: 10, opacity: 0.7}}/>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{border: 'none', background: 'transparent', fontSize: 16, width: '100%', outline: 'none', color: 'inherit', fontFamily: 'sans-serif'}}/>
        </div>
        <div style={{background: isDark?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.85)', borderRadius: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(10px)'}}>
          <KeyRound size={18} style={{marginRight: 10, opacity: 0.7}}/>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{border: 'none', background: 'transparent', fontSize: 16, width: '100%', outline: 'none', color: 'inherit', fontFamily: 'sans-serif'}}/>
        </div>
        {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, opacity: 0.9, background: 'rgba(255,0,0,0.15)', padding: 8, borderRadius: 8, color: '#fff', fontWeight:'bold'}}>{authError}</p>}
        <motion.button whileTap={{scale:0.95}} onClick={handleAuth} disabled={authLoading} style={{width: '100%', background: cur.primary, color: isDark?'black':'white', border: 'none', padding: '16px', borderRadius: 30, fontSize: 16, fontWeight: 'bold', opacity: authLoading?0.7:1, display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, cursor: 'pointer'}}>
          {authLoading ? <Loader className="animate-spin"/> : <>Войти <ArrowRight/></>}
        </motion.button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', fontFamily: '-apple-system, sans-serif', color: cur.text, transition: 'background 0.8s ease' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}`}</style>
      
      <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(3px)'}}>
        
        {/* HEADER */}
        <div style={{padding: '50px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 48, fontStyle: 'italic', margin: 0, lineHeight: 1}}>Amen.</h1>
            <p style={{fontSize: 12, opacity: 0.8, letterSpacing: 1, marginTop: 5, fontWeight:'bold'}}>{getGreeting()}, {user.displayName}</p>
          </div>
          <div style={{display:'flex', gap:10}}>
            <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}>
               {isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.5}}/>}
            </motion.button>
            <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}>
              <User size={20} color={cur.text}/>
            </motion.button>
          </div>
        </div>

        {/* TABS */}
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

        {/* CONTENT */}
        <div style={{flex: 1, padding: '10px 20px 100px', overflowY: 'auto'}}>
          
          {activeTab === 'word' ? (
             <div style={{display: 'flex', gap: 16, overflowX: 'auto', padding: '0 4px 20px', scrollSnapType: 'x mandatory', height: '70vh'}}>
               {GOLDEN_VERSES.map((v, i) => {
                 const style = CARD_STYLES[i % CARD_STYLES.length];
                 return (
                   <div key={i} style={{
                     scrollSnapAlign: 'center', flexShrink: 0, width: '85vw', height: '100%',
                     background: style.bg, borderRadius: 32, padding: 32,
                     boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.5)',
                     position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                   }}>
                     <div style={{position:'absolute', inset:0, background: style.decoration, filter: 'blur(60px)', opacity: 0.8}} />
                     <div style={{position:'relative', zIndex: 10}}>
                       <Book size={32} color={cur.primary} style={{marginBottom: 30, opacity: 0.5}}/>
                       <p style={{color: '#334155', fontSize: 24, fontWeight: '500', margin: '0 0 30px', fontStyle: 'italic', fontFamily:'Cormorant Garamond', lineHeight: 1.3}}>"{v.text}"</p>
                       <div style={{height: 3, width: 60, background: cur.primary, marginBottom: 15, borderRadius: 2}}/>
                       <p style={{color: '#64748b', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5}}>{v.ref}</p>
                     </div>
                   </div>
                 )
               })}
             </div>
          ) : loading ? <div style={{textAlign:'center', marginTop:50, opacity:0.5}}><Loader className="animate-spin" style={{margin:'0 auto'}}/></div> :
           list.length === 0 ? (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign: 'center', marginTop: 80, opacity: 0.8}}>
                <div style={{fontStyle: 'italic', marginBottom: 20, background: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 20, backdropFilter: 'blur(5px)'}}>
                  {activeTab === 'home' ? "Здесь живут ваши мысли..." : activeTab === 'list' ? "Добавьте постоянные нужды." : "Место для ваших свидетельств."}
                </div>
                {activeTab === 'home' && <button onClick={generatePrompt} style={{background: 'white', border: 'none', padding: '12px 24px', borderRadius: 30, color: cur.primary, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>✨ О чем помолиться?</button>}
             </motion.div>
           ) : (
             <AnimatePresence mode='popLayout'>
               {list.map((item, i) => (
                 <motion.div 
                   key={item.id} layout initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} transition={{duration:0.3, delay: i*0.05}}
                   style={{
                     background: cur.card, borderRadius: 24, padding: 20, marginBottom: 12, 
                     boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                     backdropFilter: 'blur(5px)'
                   }}
                 >
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                     <div style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                       {activeTab === 'list' ? <><Wind size={12}/> {item.count}</> : formatDate(item.createdAt)}
                     </div>
                     <div style={{display:'flex', gap: 5}}>
                        {activeTab !== 'vault' && (
                          <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: cur.primary, cursor: 'pointer'}}>Ответ?</button>
                        )}
                        <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5, cursor: 'pointer'}}><Trash2 size={16} color={cur.text} style={{opacity: 0.5}}/></button>
                     </div>
                   </div>
                   <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500}}>{item.text || item.title}</p>
                   
                   {activeTab === 'list' && (
                     <motion.button whileTap={{scale:0.97}} onClick={() => prayForTopic(item.id)} style={{width: '100%', background: 'rgba(255,255,255,0.4)', border: 'none', padding: 12, borderRadius: 14, marginTop: 8, color: cur.primary, fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'}}>
                       <Wind size={16}/> Помолиться сейчас
                     </motion.button>
                   )}
                   
                   {activeTab === 'vault' && item.answerNote && (
                     <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.9}}>"{item.answerNote}"</div>
                   )}
                 </motion.div>
               ))}
             </AnimatePresence>
           )
          }
        </div>

        {/* FAB */}
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

      {/* MUSIC PLAYER MODAL */}
      {modalMode === 'music' && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
          <motion.div initial={{y:100}} animate={{y:0}} style={{background: isDark?'#1e293b':'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30}} onClick={e=>e.stopPropagation()}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
               <h3 style={{margin:0, fontSize:20, color:cur.text}}>Музыка души</h3>
               <button onClick={closeModal}><X size={24} color={cur.text}/></button>
             </div>
             <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:'50vh', overflowY:'auto'}}>
               {TRACKS.map((track, i) => (
                 <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{
                   background: i === currentTrackIndex ? cur.primary : 'rgba(0,0,0,0.05)',
                   color: i === currentTrackIndex ? 'white' : cur.text,
                   border: 'none', padding: 15, borderRadius: 12, textAlign: 'left', fontWeight: 'bold',
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                 }}>
                   <span>{track.title}</span>
                   {i === currentTrackIndex && isPlaying && <Loader className="animate-spin" size={16}/>}
                 </button>
               ))}
             </div>
             <div style={{display:'flex', justifyContent:'center', gap: 30, marginTop: 30, alignItems:'center'}}>
               <button onClick={prevTrack} style={{background:'none', border:'none'}}><SkipBack size={32} color={cur.text}/></button>
               <button onClick={() => setIsPlaying(!isPlaying)} style={{background: cur.primary, border:'none', borderRadius:'50%', width: 64, height: 64, display:'flex', alignItems:'center', justifyContent:'center', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'}}>
                 {isPlaying ? <Pause size={32} fill="white"/> : <Play size={32} fill="white" style={{marginLeft:4}}/>}
               </button>
               <button onClick={nextTrack} style={{background:'none', border:'none'}}><SkipForward size={32} color={cur.text}/></button>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AmenApp;
