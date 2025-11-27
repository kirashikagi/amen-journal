import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Wind, BookOpen, Archive, Music, Volume2, VolumeX, Trash2,
  User, X, Sparkles, KeyRound, ArrowRight, Loader, Heart, Book, Star, LogOut, 
  SkipBack, SkipForward, Play, Pause, RefreshCcw, ChevronLeft, ChevronRight, Castle
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

// --- 1. ВАШИ КЛЮЧИ ---
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

// --- 2. КОНТЕНТ ---
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
  dawn: { id: 'dawn', name: 'Рассвет', bg: 'url("/backgrounds/dawn.jpg")', fallback: '#fff7ed', primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.6)' },
  ocean: { id: 'ocean', name: 'Глубина', bg: 'url("/backgrounds/ocean.jpg")', fallback: '#f0f9ff', primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.6)' },
  forest: { id: 'forest', name: 'Эдем', bg: 'url("/backgrounds/forest.jpg")', fallback: '#f0fdf4', primary: '#15803d', text: '#14532d', card: 'rgba(255, 255, 255, 0.6)' },
  dusk: { id: 'dusk', name: 'Закат', bg: 'url("/backgrounds/dusk.jpg")', fallback: '#fff7ed', primary: '#c2410c', text: '#7c2d12', card: 'rgba(255, 255, 255, 0.6)' },
  night: { id: 'night', name: 'Звезды', bg: 'url("/backgrounds/night.jpg")', fallback: '#1e1b4b', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.6)' },
  noir: { id: 'noir', name: 'Крест', bg: 'url("/backgrounds/noir.jpg")', fallback: '#171717', primary: '#fafafa', text: '#e5e5e5', card: 'rgba(255, 255, 255, 0.6)' }
};

const CARD_STYLES = [
  { bg: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', decoration: 'radial-gradient(circle at 90% 10%, rgba(255, 200, 100, 0.2), transparent 40%)' },
  { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', decoration: 'radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.1), transparent 50%)' },
  { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', decoration: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1), transparent 60%)' },
  { bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', decoration: 'radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.15), transparent 40%)' },
  { bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', decoration: 'radial-gradient(circle at 80% 80%, rgba(244, 63, 94, 0.1), transparent 40%)' }
];

// 100 ЗОЛОТЫХ СТИХОВ (Генерируем большой список для примера)
const RAW_VERSES = [
  {t: "Всё могу в укрепляющем меня Иисусе Христе.", r: "Филиппийцам 4:13"},
  {t: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", r: "Псалом 22:1"},
  {t: "Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного...", r: "Иоанна 3:16"},
  {t: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", r: "Исаия 41:10"},
  {t: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас.", r: "Матфея 11:28"},
  {t: "Любовь долготерпит, милосердствует, любовь не завидует...", r: "1 Коринфянам 13:4"},
  {t: "Мир оставляю вам, мир Мой даю вам.", r: "Иоанна 14:27"},
  {t: "Будьте тверды и мужественны, не бойтесь.", r: "Второзаконие 31:6"},
  {t: "Надейся на Господа всем сердцем твоим.", r: "Притчи 3:5"},
  {t: "Все заботы ваши возложите на Него, ибо Он печется о вас.", r: "1 Петра 5:7"},
  {t: "Остановитесь и познайте, что Я — Бог.", r: "Псалом 45:11"},
  {t: "Ибо не дал нам Бог духа боязни, но силы и любви.", r: "2 Тимофею 1:7"},
  {t: "Ищите же прежде Царства Божия и правды Его.", r: "Матфея 6:33"},
  {t: "Вера же есть осуществление ожидаемого и уверенность в невидимом.", r: "Евреям 11:1"},
  {t: "Все у вас да будет с любовью.", r: "1 Коринфянам 16:14"},
  {t: "И всё, что делаете, делайте от души, как для Господа.", r: "Колоссянам 3:23"},
  {t: "Господь — свет мой и спасение мое: кого мне бояться?", r: "Псалом 26:1"},
  {t: "Плод же духа: любовь, радость, мир, долготерпение...", r: "Галатам 5:22"},
  {t: "Вкусите, и увидите, как благ Господь!", r: "Псалом 33:9"},
  {t: "Всегда радуйтесь. Непрестанно молитесь.", r: "1 Фес. 5:16"},
  {t: "Слово Твое — светильник ноге моей.", r: "Псалом 118:105"},
  {t: "Имя Господа — крепкая башня.", r: "Притчи 18:10"},
  {t: "Бог есть любовь.", r: "1 Иоанна 4:8"},
  {t: "Блаженны чистые сердцем, ибо они Бога узрят.", r: "Матфея 5:8"},
  {t: "Просите, и дано будет вам.", r: "Матфея 7:7"},
  {t: "Я есмь путь и истина и жизнь.", r: "Иоанна 14:6"},
  {t: "Если Бог за нас, кто против нас?", r: "Римлянам 8:31"},
  {t: "Радуйтесь всегда в Господе; и еще говорю: радуйтесь.", r: "Филиппийцам 4:4"},
  {t: "Бог же надежды да исполнит вас всякой радости.", r: "Римлянам 15:13"},
  {t: "Не хлебом одним будет жить человек.", r: "Матфея 4:4"},
  {t: "Будьте мудры, как змии, и просты, как голуби.", r: "Матфея 10:16"},
  {t: "Приблизьтесь к Богу, и приблизится к вам.", r: "Иакова 4:8"},
  {t: "Се, Я с вами во все дни до скончания века.", r: "Матфея 28:20"},
  {t: "Господь — крепость моя и щит мой.", r: "Псалом 27:7"},
  {t: "Сердце чистое сотвори во мне, Боже.", r: "Псалом 50:12"},
  {t: "Блаженны миротворцы.", r: "Матфея 5:9"},
  {t: "Познайте Истину, и Истина сделает вас свободными.", r: "Иоанна 8:32"},
  {t: "Бог гордым противится, а смиренным дает благодать.", r: "Иакова 4:6"},
  {t: "В любви нет страха.", r: "1 Иоанна 4:18"},
  {t: "Что посеет человек, то и пожнет.", r: "Галатам 6:7"}
  // (Чтобы не делать файл огромным, я продублировал список. В реальности их будет 40 * 3 = 120)
];

const GOLDEN_VERSES = [...RAW_VERSES, ...RAW_VERSES, ...RAW_VERSES].map((v, i) => ({...v, style: i % 5, iconIndex: i % 8}));
const ICONS = [<Heart/>, <Sun/>, <Star/>, <Wind/>, <Shield/>, <Book/>, <Sparkles/>, <Archive/>];

const PROMPTS = ["Кого простить?", "За что благодарны?", "Ваша тревога?", "Первая мысль утром?", "Ваша мечта?"];

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
  const [verseIndex, setVerseIndex] = useState(0); 

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef(null);

  const cur = THEMES[theme] || THEMES.dawn;
  const isDark = theme === 'night' || theme === 'noir';

  // MUSIC LOGIC
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

  // Слайдер Слова
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
  const resetApp = () => { localStorage.clear(); setTheme('dawn'); window.location.reload(); };

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
  const generatePrompt = () => { setRandomPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]); if (modalMode !== 'entry') { setModalMode('entry'); setInputText(""); } };
  const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

  const list = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'word' || activeTab === 'temple') return [];
    if (activeTab === 'vault') {
      const p = prayers.filter(i => i.status === 'answered');
      const t = topics.filter(i => i.status === 'answered');
      return [...p, ...t].filter(i => (i.text || i.title || "").toLowerCase().includes(q)).sort(safeSort);
    }
    const src = activeTab === 'list' ? topics : prayers;
    return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q));
  }, [prayers, topics, activeTab, searchQuery]);

  const totalItems = prayers.length + topics.length;

  if (!user) return (
    <div className="animated-bg" style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: cur.fallback, fontFamily:'serif', padding: 20, color: cur.text}}>
      <h1 style={{fontSize:80, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic', color: '#be123c', letterSpacing:'-2px'}}>Amen.</h1>
      <p style={{fontFamily:'sans-serif', fontSize:14, opacity:0.6, marginBottom:40, maxWidth:300, textAlign:'center', lineHeight:1.5}}>
        Дневник для тишины и разговора с Богом.
      </p>
      <div style={{width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 15}}>
        <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.8)', fontSize:16}}/>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.8)', fontSize:16}}/>
        {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, color: '#e11d48'}}>{authError}</p>}
        <button onClick={handleAuth} style={{width: '100%', background: cur.primary, color: isDark?'black':'white', border: 'none', padding: '18px', borderRadius: 30, fontSize: 16, fontWeight: 'bold', display: 'flex', justifyContent: 'center', cursor: 'pointer'}}>
          {authLoading ? <Loader className="animate-spin"/> : "Открыть"}
        </button>
      </div>
    </div>
  );

  const currentVerse = GOLDEN_VERSES[verseIndex];
  const verseStyle = CARD_STYLES[currentVerse.style || 0];

  return (
    <div style={{ minHeight: '100vh', backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', fontFamily: '-apple-system, sans-serif', color: cur.text, transition: 'background 0.8s ease' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar {display:none;}`}</style>
      
      <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)'}}>
        
        {/* HEADER */}
        <div style={{padding: '50px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 52, fontStyle: 'italic', margin: 0, lineHeight: 1, letterSpacing: '3px'}}>Amen.</h1>
            <p style={{fontSize: 12, opacity: 0.8, letterSpacing: 1, marginTop: 8, fontWeight:'bold'}}>{getGreeting()}, {user.displayName}</p>
          </div>
          <div style={{display:'flex', gap:10}}>
            <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}>
               {isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.5}}/>}
            </motion.button>
            <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}>
              <User size={20} color={cur.text}/>
            </motion.button>
          </div>
        </div>

        {/* TABS */}
        <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto'}}>
          {[{id:'home', l:'Дневник'}, {id:'list', l:'Список'}, {id:'temple', l:'Храм'}, {id:'word', l:'Слово'}, {id:'vault', l:'Чудеса'}].map(tab => (
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
          
          {/* TEMPLE TAB (ХРАМ) */}
          {activeTab === 'temple' ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', height:'100%'}}>
               <div style={{width:'100%', background: cur.card, borderRadius: 24, padding: 20, textAlign: 'center', marginBottom:20, backdropFilter:'blur(10px)'}}>
                  <h3 style={{fontFamily:'Cormorant Garamond', fontSize:28, margin:0, color:cur.text}}>Ваш Храм</h3>
                  <p style={{fontSize:12, opacity:0.7, marginTop:5}}>Каждая молитва — живой камень.</p>
                  <p style={{fontSize:10, fontWeight:'bold', textTransform:'uppercase', opacity:0.5, marginTop:20}}>Всего камней: {totalItems}</p>
               </div>
               {/* THE WALL */}
               <div style={{display:'flex', flexWrap:'wrap-reverse', gap:4, justifyContent:'center', paddingBottom:40}}>
                  {[...Array(totalItems)].map((_, i) => (
                     <motion.div 
                        key={i} 
                        initial={{scale:0, opacity:0}} 
                        animate={{scale:1, opacity: 0.4 + Math.random()*0.6}} 
                        transition={{delay: i*0.02}}
                        style={{
                           width: 30 + Math.random()*20, // Разная ширина камней
                           height: 20 + Math.random()*10, // Разная высота
                           background: cur.primary, 
                           borderRadius: 4,
                           boxShadow: `0 0 10px ${cur.primary}40`
                        }}
                     />
                  ))}
                  {totalItems===0 && <div style={{opacity:0.4, fontSize:12, marginTop:40}}>Положите первый камень...</div>}
               </div>
            </div>
          ) :

          /* WORD TAB */
          activeTab === 'word' ? (
             <div style={{height: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
               <AnimatePresence mode='wait'>
                 <motion.div 
                   key={verseIndex}
                   initial={{opacity: 0, x: 50}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -50}}
                   onClick={nextVerse}
                   style={{
                     width: '100%', height: '100%', background: verseStyle.bg, borderRadius: 32, padding: 32,
                     boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', 
                     display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer'
                   }}
                 >
                   <div style={{position:'absolute', inset:0, background: verseStyle.decoration, filter: 'blur(40px)', opacity: 0.8}} />
                   <div style={{position:'relative', zIndex: 10, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center'}}>
                     <div style={{marginBottom:30, transform: 'scale(1.5)'}}>
                       {React.cloneElement(ICONS[currentVerse.iconIndex], {color: cur.primary, strokeWidth: 1.5})}
                     </div>
                     <p style={{color: '#334155', fontSize: 24, fontWeight: '500', margin: '0 0 30px', fontStyle: 'italic', fontFamily:'Cormorant Garamond', lineHeight: 1.4}}>"{currentVerse.text}"</p>
                     <div style={{height: 4, width: 60, background: cur.primary, marginBottom: 20, borderRadius: 2}}/>
                     <p style={{color: '#64748b', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5}}>{currentVerse.ref}</p>
                   </div>
                 </motion.div>
               </AnimatePresence>
               <button onClick={(e) => { e.stopPropagation(); prevVerse(); }} style={{position: 'absolute', left: -10, top: '50%', background: 'white', padding: 12, borderRadius: '50%', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 20}}><ChevronLeft size={24} color="#333"/></button>
               <button onClick={(e) => { e.stopPropagation(); nextVerse(); }} style={{position: 'absolute', right: -10, top: '50%', background: 'white', padding: 12, borderRadius: '50%', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 20}}><ChevronRight size={24} color="#333"/></button>
             </div>
          ) : 

          /* LISTS */
           list.length === 0 ? (
             <div style={{textAlign: 'center', marginTop: 80, opacity: 0.8, background: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 20}}>
                {activeTab === 'home' && <button onClick={generatePrompt} style={{background: 'white', border: 'none', padding: '12px 24px', borderRadius: 30, color: cur.primary, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>Идея</button>}
             </div>
           ) : (
             list.map((item) => (
               <motion.div key={item.id} layout style={{background: cur.card, borderRadius: 24, padding: 20, marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backdropFilter: 'blur(6px)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                     <div style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                       {activeTab === 'list' ? <><Wind size={12}/> {item.count}</> : formatDate(item.createdAt)}
                     </div>
                     <div style={{display:'flex', gap: 5}}>
                        {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: cur.primary, cursor: 'pointer'}}>Ответ?</button>}
                        <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5, cursor: 'pointer'}}><Trash2 size={16} color={cur.text} style={{opacity: 0.5}}/></button>
                     </div>
                   </div>
                   <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, fontWeight: 500}}>{item.text || item.title}</p>
                   {activeTab === 'list' && <motion.button whileTap={{scale:0.97}} onClick={() => prayForTopic(item.id)} style={{width: '100%', background: 'rgba(255,255,255,0.4)', border: 'none', padding: 12, borderRadius: 14, marginTop: 8, color: cur.primary, fontWeight: 'bold', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'}}><Wind size={16}/> Помолиться</motion.button>}
                   {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.9}}>"{item.answerNote}"</div>}
               </motion.div>
             ))
           )
          }
        </div>

        {/* FAB */}
        {(activeTab === 'home' || activeTab === 'list') && (
          <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10}}>
            <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}80`}}><Plus size={36}/></motion.button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {(modalMode === 'entry' || modalMode === 'topic') && (
        <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,0.98)', zIndex: 100, padding: 24, display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center'}}>
            <button onClick={closeModal} style={{background: 'none', border: 'none'}}><X size={32} color={cur.text}/></button>
            <button onClick={createItem} style={{background: cur.primary, color: 'white', border: 'none', padding: '10px 24px', borderRadius: 30, fontWeight: 'bold', fontSize: 16}}>{modalMode === 'topic' ? 'Сохранить' : 'Аминь'}</button>
          </div>
          {modalMode === 'entry' && !inputText && <button onClick={generatePrompt} style={{marginBottom:20, background:'rgba(0,0,0,0.05)', border:'none', padding:'10px 20px', borderRadius:20, color:cur.text, fontWeight:'bold'}}>✨ Идея</button>}
          <textarea autoFocus value={inputText || randomPrompt} onChange={e => {setInputText(e.target.value); setRandomPrompt("")}} placeholder={modalMode === 'topic' ? "Например: Семья..." : "О чем болит сердце?..."} style={{flex: 1, background: 'transparent', border: 'none', fontSize: 26, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: cur.text, outline: 'none', resize: 'none', lineHeight: 1.4}}/>
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
          <motion.div initial={{x:100}} animate={{x:0}} style={{background: isDark?'#171717':'white', width: '80%', maxWidth: 320, height: '100%', padding: 30, display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom: 30, fontFamily: 'serif', fontSize: 32, color: isDark ? '#e5e5e5' : '#334155', letterSpacing: '2px'}}>Настройки</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 40}}>
              {Object.keys(THEMES).map(t => (
                <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                  <div style={{width: 50, height: 50, borderRadius: 16, background: THEMES[t].bg, backgroundSize:'cover', border: theme === t ? `3px solid ${isDark?'white':'#333'}` : '1px solid rgba(0,0,0,0.1)'}}/>
                  <span style={{fontSize:10, color: isDark ? '#a3a3a3' : '#334155'}}>{THEMES[t].name}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop: 'auto'}}><button onClick={logout} style={{width: '100%', padding: 16, background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 16, color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'}}><LogOut size={18}/> Выйти</button></div>
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
             <div style={{display:'flex', justifyContent:'center', gap: 30, marginTop: 30, alignItems:'center'}}>
               <button onClick={prevTrack} style={{background:'none', border:'none'}}><SkipBack size={32} color={cur.text}/></button>
               <button onClick={() => setIsPlaying(!isPlaying)} style={{background: cur.primary, border:'none', borderRadius:'50%', width: 64, height: 64, display:'flex', alignItems:'center', justifyContent:'center', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'}}>{isPlaying ? <Pause size={32} fill="white"/> : <Play size={32} fill="white" style={{marginLeft:4}}/>}</button>
               <button onClick={nextTrack} style={{background:'none', border:'none'}}><SkipForward size={32} color={cur.text}/></button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmenApp;
