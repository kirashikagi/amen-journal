import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  BookOpen, 
  MessageCircle, 
  User, 
  Plus, 
  X, 
  Send, 
  Flame, 
  Calendar,
  Settings,
  Sun,
  Moon,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken,
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp, 
  increment,
  query,
  deleteDoc,
  getDocs
} from "firebase/firestore";

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config || '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Types ---
interface Prayer {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  amens: number;
  timestamp: any; // Firestore timestamp
  isPrivate: boolean;
  tags?: string[];
  amenedBy?: string[]; // Array of user IDs who clicked Amen
}

interface BibleVerse {
  text: string;
  reference: string;
}

// --- Helper Functions ---
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Только что';
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// --- Main Component ---
export default function AmenApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'bible' | 'personal' | 'profile'>('feed');
  const [showCompose, setShowCompose] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // Data State
  const [publicPrayers, setPublicPrayers] = useState<Prayer[]>([]);
  const [personalPrayers, setPersonalPrayers] = useState<Prayer[]>([]);
  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);

  // Compose State
  const [newPrayerText, setNewPrayerText] = useState('');
  const [isPrivateStart, setIsPrivateStart] = useState(false);

  // --- Auth & Initial Setup ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Fetch Daily Verse (Mock or Real API)
    fetchDailyVerse();

    return () => unsubscribe();
  }, []);

  const fetchDailyVerse = async () => {
    try {
      // Using a reliable Bible API fallback logic
      const response = await fetch('https://bible-api.com/?random=verse');
      const data = await response.json();
      setDailyVerse({
        text: data.text,
        reference: data.reference
      });
    } catch (e) {
      setDailyVerse({
        text: "Всё могу в укрепляющем меня Иисусе Христе.",
        reference: "Филиппийцам 4:13"
      });
    }
  };

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user) return;

    // 1. Public Feed Listener
    // Using simple collection query and sorting in memory to avoid index requirements
    const publicRef = collection(db, 'artifacts', appId, 'public', 'data', 'prayers');
    const unsubPublic = onSnapshot(publicRef, (snapshot) => {
      const prayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prayer));
      // Sort in memory: newest first
      prayers.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || Date.now();
        const timeB = b.timestamp?.toMillis() || Date.now();
        return timeB - timeA;
      });
      setPublicPrayers(prayers);
    }, (error) => console.error("Public feed error:", error));

    // 2. Personal Prayers Listener
    const personalRef = collection(db, 'artifacts', appId, 'users', user.uid, 'personal_prayers');
    const unsubPersonal = onSnapshot(personalRef, (snapshot) => {
      const prayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prayer));
      prayers.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || Date.now();
        const timeB = b.timestamp?.toMillis() || Date.now();
        return timeB - timeA;
      });
      setPersonalPrayers(prayers);
    }, (error) => console.error("Personal feed error:", error));

    return () => {
      unsubPublic();
      unsubPersonal();
    };
  }, [user]);

  // --- Actions ---

  const handlePostPrayer = async () => {
    if (!newPrayerText.trim() || !user) return;

    const prayerData = {
      text: newPrayerText,
      authorId: user.uid,
      authorName: `User ${user.uid.slice(0, 4)}`, // Anonymous name
      amens: 0,
      timestamp: serverTimestamp(),
      isPrivate: isPrivateStart,
      amenedBy: []
    };

    try {
      if (isPrivateStart) {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'personal_prayers'), prayerData);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'prayers'), prayerData);
      }
      setNewPrayerText('');
      setShowCompose(false);
    } catch (error) {
      console.error("Error posting prayer:", error);
    }
  };

  const handleAmen = async (prayer: Prayer, isPersonal: boolean) => {
    if (!user) return;
    
    // Optimistic UI update could be added here, but Firestore is fast enough usually
    const collectionPath = isPersonal 
      ? ['users', user.uid, 'personal_prayers']
      : ['public', 'data', 'prayers'];
      
    // Check if already amened (locally checked for UI, enforced by logic)
    if (prayer.amenedBy?.includes(user.uid)) return; // Prevent double amen

    const prayerRef = doc(db, 'artifacts', appId, (isPersonal ? 'users' : 'public'), (isPersonal ? user.uid : 'data'), (isPersonal ? 'personal_prayers' : 'prayers'), prayer.id);

    try {
      await updateDoc(prayerRef, {
        amens: increment(1),
        amenedBy: [...(prayer.amenedBy || []), user.uid]
      });
    } catch (error) {
      console.error("Error sending Amen:", error);
    }
  };

  const handleDelete = async (prayerId: string, isPersonal: boolean) => {
    if (!user) return;
    const confirmDelete = window.confirm("Вы уверены, что хотите удалить эту молитву?");
    if (!confirmDelete) return;

    try {
      const pathPart1 = isPersonal ? 'users' : 'public';
      const pathPart2 = isPersonal ? user.uid : 'data';
      const collectionName = isPersonal ? 'personal_prayers' : 'prayers';
      
      await deleteDoc(doc(db, 'artifacts', appId, pathPart1, pathPart2, collectionName, prayerId));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  }

  // --- UI Components ---

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center w-full py-3 transition-colors duration-200 ${
        activeTab === id 
          ? (darkMode ? 'text-amber-400' : 'text-indigo-600') 
          : (darkMode ? 'text-slate-400' : 'text-slate-400')
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  const PrayerCard = ({ prayer, isPersonal = false }: { prayer: Prayer, isPersonal?: boolean }) => {
    const isAmened = prayer.amenedBy?.includes(user?.uid || '');
    const isMine = prayer.authorId === user?.uid;

    return (
      <div className={`mb-4 rounded-xl p-5 shadow-sm border ${
        darkMode 
          ? 'bg-slate-800 border-slate-700 text-slate-100' 
          : 'bg-white border-slate-100 text-slate-800'
      }`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              darkMode ? 'bg-slate-700 text-amber-400' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {prayer.authorName[0]}
            </div>
            <div>
              <p className="text-xs font-bold opacity-80">{isPersonal ? 'Личная молитва' : prayer.authorName}</p>
              <p className="text-[10px] opacity-50">{formatDate(prayer.timestamp)}</p>
            </div>
          </div>
          {isMine && (
             <button 
               onClick={() => handleDelete(prayer.id, isPersonal)}
               className="text-xs text-red-400 opacity-60 hover:opacity-100"
             >
               Удалить
             </button>
          )}
        </div>
        
        <p className={`text-base leading-relaxed mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          {prayer.text}
        </p>

        <div className="flex items-center justify-between">
          <button 
            onClick={() => handleAmen(prayer, isPersonal)}
            disabled={isAmened}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isAmened 
                ? (darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-indigo-100 text-indigo-600')
                : (darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')
            }`}
          >
            <Heart size={16} fill={isAmened ? "currentColor" : "none"} />
            <span>{prayer.amens || 0} Аминь</span>
          </button>
          
          <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
            <Share2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Header */}
      <header className={`fixed top-0 w-full z-20 px-4 py-3 flex justify-between items-center backdrop-blur-md border-b ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Flame size={20} className={darkMode ? 'text-amber-400' : 'text-indigo-600'} fill="currentColor" />
          <h1 className="text-lg font-bold tracking-tight">Amen App <span className="text-xs opacity-50 font-normal">v5.2</span></h1>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-indigo-600'}`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-24 px-4 max-w-md mx-auto min-h-screen">
        
        {/* VIEW: PUBLIC FEED */}
        {activeTab === 'feed' && (
          <div className="animate-fade-in">
             <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Стена Молитв</h2>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Поддержите братьев и сестер словом "Аминь".
                </p>
             </div>
             
             {publicPrayers.length === 0 ? (
               <div className="text-center py-20 opacity-50">
                 <MessageCircle size={48} className="mx-auto mb-4" />
                 <p>Пока нет молитв. Будьте первым!</p>
               </div>
             ) : (
               publicPrayers.map(prayer => (
                 <PrayerCard key={prayer.id} prayer={prayer} />
               ))
             )}
          </div>
        )}

        {/* VIEW: BIBLE */}
        {activeTab === 'bible' && (
          <div className="animate-fade-in space-y-6">
            <div className={`p-6 rounded-2xl text-center border ${
              darkMode 
                ? 'bg-gradient-to-br from-amber-900/20 to-slate-800 border-amber-900/30' 
                : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100'
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">Стих Дня</h3>
              {dailyVerse ? (
                <>
                  <p className={`text-xl font-serif italic mb-4 leading-relaxed ${darkMode ? 'text-amber-100' : 'text-indigo-900'}`}>
                    "{dailyVerse.text}"
                  </p>
                  <p className="text-sm font-bold opacity-70">{dailyVerse.reference}</p>
                </>
              ) : (
                <div className="animate-pulse h-20 bg-slate-700/20 rounded"></div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button className={`p-4 rounded-xl text-left border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <BookOpen className="mb-2 text-blue-400" size={24} />
                  <div className="font-bold">Ветхий Завет</div>
                  <div className="text-xs opacity-50">39 книг</div>
               </button>
               <button className={`p-4 rounded-xl text-left border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <BookOpen className="mb-2 text-emerald-400" size={24} />
                  <div className="font-bold">Новый Завет</div>
                  <div className="text-xs opacity-50">27 книг</div>
               </button>
            </div>
            
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
               <h4 className="font-bold mb-2 flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-green-500"/>
                 План чтения
               </h4>
               <div className="space-y-3">
                 <div className="flex items-center justify-between text-sm">
                   <span className="opacity-80">Псалтирь 23</span>
                   <input type="checkbox" className="accent-amber-500 w-4 h-4" />
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="opacity-80">От Матфея 5</span>
                   <input type="checkbox" className="accent-amber-500 w-4 h-4" />
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* VIEW: PERSONAL */}
        {activeTab === 'personal' && (
          <div className="animate-fade-in">
             <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Личный Дневник</h2>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ваши сокровенные молитвы. Видны только вам.
                </p>
             </div>

             <button 
                onClick={() => { setIsPrivateStart(true); setShowCompose(true); }}
                className={`w-full py-4 rounded-xl border-2 border-dashed mb-6 flex items-center justify-center space-x-2 transition-colors ${
                  darkMode 
                    ? 'border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-400' 
                    : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
                }`}
             >
                <Plus size={20} />
                <span className="font-medium">Добавить личную запись</span>
             </button>

             {personalPrayers.length === 0 ? (
               <div className="text-center py-10 opacity-50">
                 <p>Ваш дневник пуст.</p>
               </div>
             ) : (
               personalPrayers.map(prayer => (
                 <PrayerCard key={prayer.id} prayer={prayer} isPersonal={true} />
               ))
             )}
          </div>
        )}

        {/* VIEW: PROFILE */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
             <div className="text-center mb-8">
               <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-3 ${
                 darkMode ? 'bg-slate-800 text-amber-400' : 'bg-indigo-100 text-indigo-600'
               }`}>
                 {user?.uid.slice(0,1).toUpperCase()}
               </div>
               <h2 className="text-xl font-bold">Пользователь</h2>
               <p className="text-xs opacity-50 font-mono">ID: {user?.uid.slice(0,8)}...</p>
             </div>

             <div className="space-y-3">
               <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
                 <div className="flex items-center gap-3">
                   <Calendar className="text-blue-400" size={20} />
                   <span>Дней с нами</span>
                 </div>
                 <span className="font-bold text-lg">1</span>
               </div>
               
               <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
                 <div className="flex items-center gap-3">
                   <Heart className="text-red-400" size={20} />
                   <span>Отдано Аминь</span>
                 </div>
                 <span className="font-bold text-lg">-</span>
               </div>

               <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
                 <div className="flex items-center gap-3">
                   <Settings className="text-slate-400" size={20} />
                   <span>Настройки</span>
                 </div>
               </div>
             </div>
             
             <button 
               onClick={() => signOut(auth)}
               className="mt-8 w-full py-3 text-red-400 hover:text-red-500 text-sm font-medium"
             >
               Выйти из аккаунта
             </button>
          </div>
        )}
      </main>

      {/* Floating Action Button (for Feed) */}
      {activeTab === 'feed' && (
        <button
          onClick={() => { setIsPrivateStart(false); setShowCompose(true); }}
          className={`fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30 ${
            darkMode ? 'bg-amber-500 text-slate-900 shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/30'
          }`}
        >
          <Plus size={28} />
        </button>
      )}

      {/* Navigation Bar */}
      <nav className={`fixed bottom-0 w-full pb-safe px-2 pt-1 z-30 flex justify-around items-center border-t backdrop-blur-md ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <TabButton id="feed" icon={Heart} label="Лента" />
        <TabButton id="bible" icon={BookOpen} label="Библия" />
        <TabButton id="personal" icon={User} label="Дневник" />
        <TabButton id="profile" icon={Settings} label="Профиль" />
      </nav>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl transform transition-all ${
            darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {isPrivateStart ? 'Новая личная запись' : 'Новая просьба о молитве'}
              </h3>
              <button onClick={() => setShowCompose(false)} className="p-1 rounded-full hover:bg-slate-700/20">
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={newPrayerText}
              onChange={(e) => setNewPrayerText(e.target.value)}
              placeholder={isPrivateStart ? "О чем вы хотите поговорить с Богом?" : "Поделитесь своей нуждой, и мы помолимся..."}
              className={`w-full h-32 p-4 rounded-xl resize-none text-base mb-4 focus:outline-none focus:ring-2 ${
                darkMode 
                  ? 'bg-slate-900 focus:ring-amber-500/50 placeholder-slate-600' 
                  : 'bg-slate-50 focus:ring-indigo-500/50 placeholder-slate-400'
              }`}
              autoFocus
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setIsPrivateStart(!isPrivateStart)}
                   className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                     isPrivateStart 
                       ? (darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600')
                       : (darkMode ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                   }`}
                 >
                   {isPrivateStart ? '🔒 Приватно' : '🌍 Публично'}
                 </button>
              </div>
              
              <button
                onClick={handlePostPrayer}
                disabled={!newPrayerText.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  !newPrayerText.trim()
                    ? 'opacity-50 cursor-not-allowed bg-slate-500 text-white'
                    : darkMode 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <span>Аминь</span>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

