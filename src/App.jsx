import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
 Plus, Wind, BookOpen, Archive, Music, Volume2, Trash2,
 User, X, Sparkles, KeyRound, ArrowRight, Loader, Book, LogOut,
 SkipBack, SkipForward, Play, Pause, Info, Heart
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

let app; try { app = initializeApp(firebaseConfig); } catch (e) {}
const auth = getAuth(); const db = getFirestore(); const appId = firebaseConfig.projectId;

// --- 2. МУЗЫКА ---
const TRACKS = [
 { title: "Beautiful Worship", file: "/music/beautiful-worship.mp3" },
 { title: "Celestial Prayer", file: "/music/celestial-prayer.mp3" },
 { title: "Meditation Bliss", file: "/music/meditation-bliss.mp3" },
 { title: "Piano Ambient", file: "/music/piano-ambient.mp3" },
 { title: "Soothing Worship", file: "/music/soothing-worship.mp3" }
];

// --- 3. СТИЛИ КАРТОЧЕК ---
const CARD_STYLES = [
 { bg: 'linear-gradient(135deg, #fdfbf7 0%, #e2e8f0 100%)', decoration: 'radial-gradient(circle at 90% 10%, rgba(255, 200, 100, 0.2), transparent 40%)' },
 { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', decoration: 'radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.1), transparent 50%)' },
 { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', decoration: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1), transparent 60%)' },
 { bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', decoration: 'radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.15), transparent 40%)' },
 { bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', decoration: 'radial-gradient(circle at 80% 80%, rgba(244, 63, 94, 0.1), transparent 40%)' }
];

const GOLDEN_VERSES = [
 { text: "Всё могу в укрепляющем меня Иисусе Христе.", ref: "Филиппийцам 4:13", style: 0 },
 { text: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", ref: "Исаия 41:10", style: 3 },
 { text: "Придите ко Мне все труждающиеся и обремененные.", ref: "Матфея 11:28", style: 4 },
 { text: "Любовь долготерпит, милосердствует...", ref: "1 Коринфянам 13:4", style: 1 },
 { text: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", ref: "Псалом 22:1", style: 2 }
];

const THEMES = {
 dawn: { id: 'dawn', name: 'Рассвет', bg: 'url("/backgrounds/dawn.jpg")', fallback: '#fff7ed', primary: '#be123c', text: '#881337', card: 'rgba(255, 255, 255, 0.6)' },
 ocean: { id: 'ocean', name: 'Глубина', bg: 'url("/backgrounds/ocean.jpg")', fallback: '#f0f9ff', primary: '#0369a1', text: '#0c4a6e', card: 'rgba(255, 255, 255, 0.6)' },
 forest: { id: 'forest', name: 'Эдем', bg: 'url("/backgrounds/forest.jpg")', fallback: '#f0fdf4', primary: '#15803d', text: '#14532d', card: 'rgba(255, 255, 255, 0.6)' },
 night: { id: 'night', name: 'Звезды', bg: 'url("/backgrounds/night.jpg")', fallback: '#1e1b4b', primary: '#818cf8', text: '#e2e8f0', card: 'rgba(30, 41, 59, 0.6)' },
 noir: { id: 'noir', name: 'Крест', bg: 'url("/backgrounds/noir.jpg")', fallback: '#171717', primary: '#404040', text: '#171717', card: 'rgba(255, 255, 255, 0.6)' }
};

const PROMPTS = ["Кого простить?", "За что благодарны?", "Ваша тревога?", "Первая мысль утром?", "Ваша мечта?"];

const AmenApp = () => {
 const [user, setUser] = useState(null);
 const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
 const [activeTab, setActiveTab] = useState('home');
 const [searchQuery, setSearchQuery] = useState("");
 const [prayers, setPrayers] = useState([]);
 const [topics, setTopics] = useState([]);
 const [loading, setLoading] = useState(true);
 const [authLoading, setAuthLoading] = useState(true);
 
 // UI
 const [modalMode, setModalMode] = useState(null);
 const [selectedItem, setSelectedItem] = useState(null);
 const [inputText, setInputText] = useState("");
 const [randomPrompt, setRandomPrompt] = useState("");

 // Auth
 const [nickname, setNickname] = useState("");
 const [password, setPassword] = useState("");
 const [authError, setAuthError] = useState("");

 // Music
 const [isPlaying, setIsPlaying] = useState(false);
 const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
 const audioRef = useRef(null);

 const cur = THEMES[theme];
 const isDark = theme === 'night' || theme === 'noir';

 // --- MUSIC LOGIC ---
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
 useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); if (u) setLoading(false); setAuthLoading(false); }); return () => unsub(); }, []);

 // Sync
 useEffect(() => {
   if (!user) return;
   setLoading(true);
   const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), orderBy('createdAt', 'desc')), s => {
     setPrayers(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() })));
     setLoading(false);
   });
   const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics')), s => {
     setTopics(s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null })));
   });
   return () => { unsubP(); unsubT(); };
 }, [user]);

 // Actions
 const handleAuth = async () => {
   if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+)"); return; }
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
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, selectedItem.title ? 'prayer_topics' : 'prayers', selectedItem.id));
      closeModal();
   }
 };

 const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); };
 const generatePrompt = () => { setRandomPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]); if (modalMode !== 'entry') { setModalMode('entry'); setInputText(""); } };

 const list = useMemo(() => {
   const q = searchQuery.toLowerCase();
   if (activeTab === 'word') return [];
   if (activeTab === 'vault') {
     const all = [...prayers, ...topics].filter(i => i.status === 'answered');
     return all.filter(i => (i.text || i.title || "").toLowerCase().includes(q)).sort((a,b) => (b.answeredAt?.seconds || 0) - (a.answeredAt?.seconds || 0));
   }
   const src = activeTab === 'list' ? topics : prayers;
   return src.filter(i => i.status === 'active' && (i.text || i.title || "").toLowerCase().includes(q));
 }, [prayers, topics, activeTab, searchQuery]);

 if (!user) return (
   <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: cur.fallback, fontFamily:'serif', padding: 20, color: cur.text}}>
     <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic'}}>Amen.</h1>
     <div style={{width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 15, marginTop: 40}}>
       <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{padding:14, borderRadius:12, border:'none', background:'rgba(255,255,255,0.8)'}}/>
       <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{padding:14, borderRadius:12, border:'none', background:'rgba(255,255,255,0.8)'}}/>
       {authError && <p style={{color:'red', fontSize:12, textAlign:'center'}}>{authError}</p>}
       <button onClick={handleAuth} style={{padding:16, borderRadius:30, background: cur.primary, color:'white', border:'none', fontWeight:'bold'}}>{authLoading ? "..." : "Войти"}</button>
     </div>
   </div>
 );

 return (
   <div style={{ minHeight: '100vh', backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', fontFamily: '-apple-system, sans-serif', color: cur.text, transition: 'background 0.8s ease' }}>
     <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}`}</style>
     
     <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(3px)'}}>
       {/* HEADER */}
       <div style={{padding: '50px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
         <div><h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 48, fontStyle: 'italic', margin: 0, lineHeight: 1}}>Amen.</h1><p style={{fontSize: 12, opacity: 0.8, marginTop: 5, fontWeight:'bold'}}>{user.displayName}</p></div>
         <div style={{display:'flex', gap:10}}>
           <button onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{isPlaying ? <Volume2 size={20} color={cur.text}/> : <Music size={20} color={cur.text} style={{opacity:0.5}}/>}</button>
           <button onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.4)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><User size={20} color={cur.text}/></button>
         </div>
       </div>

       {/* TABS */}
       <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto'}}>
         {[{id:'home', l:'Дневник'}, {id:'list', l:'Список'}, {id:'word', l:'Слово'}, {id:'vault', l:'Чудеса'}].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{flex: 1, background: 'none', border: 'none', padding: '12px 0', whiteSpace: 'nowrap', color: cur.text, opacity: activeTab === tab.id ? 1 : 0.6, fontWeight: '800', fontSize: 14, borderBottom: activeTab === tab.id ? `3px solid ${cur.primary}` : 'none'}}>{tab.l}</button>
         ))}
       </div>

       {/* CONTENT */}
       <div style={{flex: 1, padding: '10px 20px 100px', overflowY: 'auto'}}>
         {activeTab === 'word' ? (
            <div style={{display: 'flex', gap: 16, overflowX: 'auto', padding: '0 4px 20px', height: '65vh'}}>
              {GOLDEN_VERSES.map((v, i) => {
                const style = CARD_STYLES[i % CARD_STYLES.length];
                return (
                  <div key={i} style={{minWidth: '85vw', height: '100%', background: style.bg, borderRadius: 32, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
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
         ) : list.length === 0 ? (
            <div style={{textAlign: 'center', marginTop: 80, opacity: 0.8, background: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 20}}>{activeTab === 'home' && <button onClick={generatePrompt} style={{background: 'white', border: 'none', padding: '12px 24px', borderRadius: 30, color: cur.primary, fontSize: 14, fontWeight: 'bold'}}>✨ Идея</button>}</div>
          ) : (
            list.map((item) => (
              <motion.div key={item.id} layout style={{background: cur.card, borderRadius: 24, padding: 20, marginBottom: 12, backdropFilter: 'blur(10px)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                    <div style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>{activeTab === 'list' ? <><Wind size={12}/> {item.count}</> : new Date(item.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</div>
                    <div style={{display:'flex', gap: 5}}>
                       {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: cur.primary}}>Ответ?</button>}
                       <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5}}><Trash2 size={16} color={cur.text} style={{opacity: 0.5}}/></button>
                    </div>
                  </div>
                  <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, fontWeight: 500}}>{item.text || item.title}</p>
                  {activeTab === 'list' && <button onClick={() => prayForTopic(item.id)} style={{width: '100%', background: 'rgba(255,255,255,0.4)', border: 'none', padding: 12, borderRadius: 14, color: cur.primary, fontWeight: 'bold'}}>Помолиться</button>}
                  {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`}}>"{item.answerNote}"</div>}
              </motion.div>
            ))
          )
         }
       </div>

       {/* FAB */}
       {(activeTab === 'home' || activeTab === 'list') && (
         <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10}}>
           <button onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : 'entry'); setInputText(""); }} style={{width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}80`}}><Plus size={36}/></button>
         </div>
       )}
     </div>

     {/* MODALS */}
     {(modalMode === 'entry' || modalMode === 'topic') && (
       <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,0.98)', zIndex: 100, padding: 24, display: 'flex', flexDirection: 'column'}}>
         <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
           <button onClick={closeModal} style={{background: 'none', border: 'none'}}><X size={32} color={cur.text}/></button>
           <button onClick={createItem} style={{background: cur.primary, color: 'white', border: 'none', padding: '10px 24px', borderRadius: 30, fontWeight: 'bold'}}>Сохранить</button>
         </div>
         {modalMode === 'entry' && !inputText && <button onClick={generatePrompt} style={{marginBottom:20, background:'rgba(0,0,0,0.05)', border:'none', padding:'10px 20px', borderRadius:20, color:cur.text, fontWeight:'bold'}}>✨ Идея</button>}
         <textarea autoFocus value={inputText || randomPrompt} onChange={e => {setInputText(e.target.value); setRandomPrompt("")}} placeholder={modalMode === 'topic' ? "Например: Семья..." : "Мысли..."} style={{flex: 1, background: 'transparent', border: 'none', fontSize: 26, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: cur.text, outline: 'none', resize: 'none'}}/>
       </div>
     )}

     {modalMode === 'answer' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
          <div style={{background: isDark?'#1e293b':'white', width:'100%', borderRadius:24, padding:24}}>
            <h3 style={{margin:'0 0 10px', color:cur.text}}>Свидетельство</h3>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Опишите чудо..." style={{width:'100%', height:120, border:'none', background:isDark?'#0f172a':'#f1f5f9', padding:16, borderRadius:16, color:cur.text}}/>
            <div style={{display:'flex', gap:10, marginTop:10}}>
              <button onClick={closeModal} style={{flex:1, padding:14, border:'none', background:'rgba(0,0,0,0.05)', borderRadius:14, fontWeight:'bold', color:cur.text}}>Отмена</button>
              <button onClick={saveAnswer} style={{flex:1, padding:14, border:'none', background:cur.primary, borderRadius:14, color:'white', fontWeight:'bold'}}>Сохранить</button>
            </div>
          </div>
       </div>
     )}

     {modalMode === 'settings' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
         <div style={{background: isDark?'#1e293b':'white', width: '80%', maxWidth: 320, height: '100%', padding: 30, display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
           <h2 style={{marginBottom: 20, fontFamily: 'serif', fontSize: 32, color: cur.text}}>Настройки</h2>
           <div style={{marginBottom: 30}}>
              <h4 style={{fontSize:14, color:cur.text, marginBottom:10, fontWeight:'bold'}}>Как пользоваться</h4>
              <ul style={{fontSize:13, color:cur.text, opacity:0.8, lineHeight:1.6, paddingLeft:20}}>
                <li><b>Дневник:</b> Записывайте мысли и молитвы каждый день.</li>
                <li><b>Список:</b> Добавьте нужды, о которых молитесь постоянно.</li>
                <li><b>Слово:</b> Вдохновляйтесь стихами.</li>
                <li><b>Чудеса:</b> Здесь сохраняются отвеченные молитвы.</li>
              </ul>
           </div>
           <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15}}>
             {Object.keys(THEMES).map(t => (
               <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                 <div style={{width: 50, height: 50, borderRadius: 16, background: THEMES[t].bg, backgroundSize:'cover', border: theme === t ? `3px solid ${cur.text}` : '1px solid rgba(0,0,0,0.1)'}}/>
                 <span style={{fontSize:10, color:cur.text}}>{THEMES[t].name}</span>
               </div>
             ))}
           </div>
           <button onClick={logout} style={{marginTop: 'auto', padding: 16, background: '#fee2e2', color: 'red', border: 'none', borderRadius: 16, fontWeight: 'bold'}}>Выйти</button>
         </div>
       </div>
     )}

     {modalMode === 'music' && (
       <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
         <div style={{background: isDark?'#1e293b':'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}><h3 style={{margin:0, fontSize:20, color:cur.text}}>Музыка</h3><button onClick={closeModal}><X size={24} color={cur.text}/></button></div>
            <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:'40vh', overflowY:'auto'}}>
              {TRACKS.map((track, i) => (
                <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{background: i===currentTrackIndex ? cur.primary : 'rgba(0,0,0,0.05)', color: i===currentTrackIndex ? 'white' : cur.text, border:'none', padding:15, borderRadius:12, textAlign:'left', fontWeight:'bold'}}>{track.title}</button>
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'center', gap: 30, marginTop: 30, alignItems:'center'}}>
              <button onClick={prevTrack} style={{background:'none', border:'none'}}><SkipBack size={32} color={cur.text}/></button>
              <button onClick={() => setIsPlaying(!isPlaying)} style={{background: cur.primary, border:'none', borderRadius:'50%', width: 64, height: 64, display:'flex', alignItems:'center', justifyContent:'center', color: 'white'}}>{isPlaying ? <Pause size={32} fill="white"/> : <Play size={32} fill="white" style={{marginLeft:4}}/>}</button>
              <button onClick={nextTrack} style={{background:'none', border:'none'}}><SkipForward size={32} color={cur.text}/></button>
            </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default AmenApp;