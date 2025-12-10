import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
Plus, Wind, Music, Volume2, Trash2, User, X, Loader,
LogOut, SkipBack, SkipForward, Play, Pause,
Heart, Moon, Flame, Crown, Sparkles, Zap, CheckCircle2, Info, ChevronRight, Copy, Check, UploadCloud, Users, MessageSquare, RefreshCw,
ArrowRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
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

// --- 1. CONFIG & CONSTANTS ---
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
const ADMIN_EMAIL = "kiraishikagi@amen.local";

// --- ONBOARDING DATA ---
const ONBOARDING_OPTIONS = [
   { id: 'anxiety', label: 'Тревога', icon: <Wind size={24}/>, verse: "Не заботьтесь ни о чем, но всегда в молитве открывайте свои желания пред Богом.", ref: "Филиппийцам 4:6" },
   { id: 'weary', label: 'Усталость', icon: <Moon size={24}/>, verse: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас.", ref: "Матфея 11:28" },
   { id: 'lonely', label: 'Одиночество', icon: <User size={24}/>, verse: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", ref: "Исаия 41:10" },
   { id: 'grateful', label: 'Благодарность', icon: <Heart size={24}/>, verse: "Славьте Господа, ибо Он благ, ибо вовек милость Его.", ref: "Псалом 106:1" }
];

const INITIAL_DATA = [
{ day: 1, reference: "Филиппийцам 4:6-7", text: "Не заботьтесь ни о чем, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом.", explanation: "Тревога — это сигнал к молитве. Вместо сценариев катастроф, превратите каждую заботу в просьбу.", action: "Выпишите одну вещь, которая тревожит вас сегодня, и помолитесь о ней прямо сейчас." },
{ day: 2, reference: "Псалом 22:1", text: "Господь — Пастырь мой; я ни в чем не буду нуждаться.", explanation: "Если Он — Пастырь, то ответственность за обеспечение лежит на Нем. Вы в надежных руках.", action: "Скажите вслух: «Господь восполнит это», и отпустите контроль над ситуацией." },
{ day: 3, reference: "Иеремия 29:11", text: "Ибо только Я знаю намерения, какие имею о вас... намерения во благо, а не на зло.", explanation: "Даже если сейчас хаос, у Бога есть план. Ваше текущее положение — это не конец истории.", action: "Поблагодарите Бога за будущее, которое вы еще не видите." },
{ day: 4, reference: "Иакова 1:5", text: "Если же у кого из вас недостает мудрости, да просит у Бога, дающего всем просто и без упреков.", explanation: "Вам не нужно гадать. Бог хочет дать вам решение, просто попросите Его.", action: "Есть ли сложный выбор перед вами? Попросите мудрости конкретно для этой ситуации." },
{ day: 5, reference: "Исаия 41:10", text: "Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой.", explanation: "Страх исчезает в присутствии Бога. Он обещает не просто наблюдать, а активно поддерживать.", action: "Назовите свой страх по имени и провозгласите над ним Божье присутствие." },
{ day: 6, reference: "Матфея 11:28", text: "Придите ко Мне все труждающиеся и обремененные, и Я успокою вас.", explanation: "Покой — это подарок, а не награда за изнеможение. Не несите тяжесть мира на своих плечах.", action: "Сделайте глубокий вдох и мысленно передайте свой самый тяжелый груз Иисусу." },
{ day: 7, reference: "Притчи 3:5-6", text: "Надейся на Господа всем сердцем твоим, и не полагайся на разум твой.", explanation: "Наш разум ограничен. Доверие Богу открывает двери, которые логика держит закрытыми.", action: "Где вы пытаетесь все просчитать? Попробуйте довериться интуиции от Духа сегодня." },
{ day: 8, reference: "Римлянам 8:28", text: "Притом знаем, что любящим Бога... все содействует ко благу.", explanation: "Даже ошибки Бог может переплавить в часть вашего успеха. Ничто не пропадает зря.", action: "Вспомните прошлую неудачу, которая привела к чему-то хорошему." },
{ day: 9, reference: "Иисус Навин 1:9", text: "Будь тверд и мужествен... ибо с тобою Господь Бог твой везде, куда ни пойдешь.", explanation: "Мужество — это действие вопреки страху, зная, что Бог рядом.", action: "Сделайте сегодня одно маленькое дело, которое вы откладывали из-за страха." },
{ day: 10, reference: "1 Петра 5:7", text: "Все заботы ваши возложите на Него, ибо Он печется о вас.", explanation: "Бог заботится о деталях вашей жизни. Ему не всё равно, что вас беспокоит.", action: "Представьте, как вы снимаете рюкзак с заботами и ставите его у ног Христа." },
{ day: 11, reference: "2 Тимофею 1:7", text: "Ибо дал нам Бог духа не боязни, но силы и любви и целомудрия.", explanation: "Робость не от Бога. В вас заложен потенциал силы и здравого смысла.", action: "Выпрямите спину. Скажите: «Во мне Дух силы». Действуйте из этого состояния." },
{ day: 12, reference: "Псалом 45:2", text: "Бог нам прибежище и сила, скорый помощник в бедах.", explanation: "Он не запаздывает. Когда приходит беда, Он уже там как убежище.", action: "Посидите в тишине 2 минуты, зная, что вы в полной безопасности." },
{ day: 13, reference: "Плач Иеремии 3:23", text: "Милосердие Его обновляется каждое утро; велика верность Твоя!", explanation: "Вчерашние ошибки остались во вчерашнем дне. Сегодня у вас есть новый запас милости.", action: "Простите себя за вчерашнюю ошибку. Начните день с чистого листа." },
{ day: 14, reference: "Иоанна 14:27", text: "Мир оставляю вам, мир Мой даю вам... Да не смущается сердце ваше.", explanation: "Мир Божий не зависит от новостей. Это внутреннее состояние.", action: "Отключите новости на час. Сосредоточьтесь на Его мире." },
{ day: 15, reference: "Псалом 118:105", text: "Слово Твое — светильник ноге моей и свет стезе моей.", explanation: "Бог часто показывает только следующий шаг, а не весь путь. Этого достаточно.", action: "Какой один маленький шаг вы можете сделать сегодня? Сделайте его." },
{ day: 16, reference: "Ефесянам 2:10", text: "Ибо мы — Его творение, созданы... на добрые дела.", explanation: "Вы не случайность. У вас есть предназначение и задачи, под которые вы «заточены».", action: "Спросите Бога: «Какое доброе дело Ты подготовил для меня сегодня?»" },
{ day: 17, reference: "Матфея 6:33", text: "Ищите же прежде Царства Божия... и это все приложится вам.", explanation: "Приоритеты решают все. Когда Бог на первом месте, остальное встает на свои места.", action: "Проверьте свои планы. Есть ли там время для Бога?" },
{ day: 18, reference: "Псалом 36:4", text: "Утешайся Господом, и Он исполнит желания сердца твоего.", explanation: "Когда мы находим радость в Боге, наши желания очищаются и начинают совпадать с Его волей.", action: "Вспомните момент, когда вы искренне радовались Богу." },
{ day: 19, reference: "1 Коринфянам 10:13", text: "Верен Бог, Который не попустит вам быть искушаемыми сверх сил.", explanation: "Вы сильнее, чем думаете. С Божьей помощью выход есть из любого тупика.", action: "Если вы в тупике, попросите Бога показать «выход», о котором говорит этот стих." },
{ day: 20, reference: "Римлянам 12:2", text: "Преобразуйтесь обновлением ума вашего.", explanation: "Изменения начинаются с мышления. То, как вы думаете, определяет то, как вы живете.", action: "Поймайте одну негативную мысль сегодня и замените ее истиной." },
{ day: 21, reference: "Псалом 102:12", text: "Как далеко восток от запада, так удалил Он от нас беззакония наши.", explanation: "Бог не хранит списки ваших старых грехов. Не напоминайте себе о том, что Он уже забыл.", action: "Если чувствуете вину за старое, скажите вслух: «Я прощен»." },
{ day: 22, reference: "Галатам 6:9", text: "Делая добро, да не унываем, ибо в свое время пожнем.", explanation: "Урожай приходит не сразу после посева. Верность требует терпения.", action: "Продолжайте делать то правильное дело, которое кажется бесполезным." },
{ day: 23, reference: "Евреям 4:16", text: "Да приступаем с дерзновением к престолу благодати.", explanation: "Вам не нужно «заслуживать» право прийти к Богу. Дверь всегда открыта.", action: "Придите к Богу прямо сейчас просто как ребенок к Отцу." },
{ day: 24, reference: "Исаия 43:2", text: "Будешь ли переходить через воды, Я с тобою.", explanation: "Трудности неизбежны, но одиночество в них — нет. Он проходит через огонь с вами.", action: "Признайте Его присутствие рядом в вашей текущей трудности." },
{ day: 25, reference: "Матфея 5:14", text: "Вы — свет мира.", explanation: "Ваша жизнь влияет на других, даже если вы этого не замечаете. Светите.", action: "Сделайте комплимент или помогите кому-то сегодня просто так." },
{ day: 26, reference: "Псалом 138:14", text: "Славлю Тебя, потому что я дивно устроен.", explanation: "Самокритика убивает хвалу. Вы — шедевр Божий.", action: "Найдите в себе одну черту, за которую вы благодарны Богу." },
{ day: 27, reference: "Притчи 18:21", text: "Смерть и жизнь — во власти языка.", explanation: "Слова — это семена. То, что вы говорите сегодня, прорастет завтра.", action: "Воздержитесь от жалоб и критики в течение следующих 24 часов." },
{ day: 28, reference: "1 Иоанна 4:18", text: "Совершенная любовь изгоняет страх.", explanation: "Когда вы понимаете, насколько глубоко любимы, страху не остается места.", action: "Напомните себе: «Я любим Богом безусловно»." },
{ day: 29, reference: "Псалом 26:1", text: "Господь — свет мой и спасение мое: кого мне бояться?", explanation: "Уверенность исходит из осознания того, КТО стоит за вашей спиной.", action: "Представьте Бога как вашу нерушимую крепостную стену." },
{ day: 30, reference: "Откровение 21:4", text: "И отрет Бог всякую слезу... и смерти не будет уже.", explanation: "Лучшее еще впереди. Вечность с Богом — это надежда, дающая силы.", action: "Взгляните на свои проблемы с точки зрения вечности." }
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
aether: { id: 'aether', name: 'Эфир', bg: '', fallback: '#000000', primary: '#d8b4fe', text: '#f3f4f6', card: 'rgba(10, 10, 10, 0.7)' }
};

// --- 2. HELPERS & UTILS ---
const formatDate = (timestamp) => {
   if (!timestamp) return '';
   try { if (timestamp.toDate) return timestamp.toDate().toLocaleDateString(); return new Date(timestamp).toLocaleDateString(); } catch (e) { return ''; }
};

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const getDaysInMonth = () => {
   const date = new Date();
   const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
   return Array.from({ length: days }, (_, i) => i + 1);
};

const Starfield = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let width = window.innerWidth, height = window.innerHeight;
      canvas.width = width; canvas.height = height;
      const stars = Array.from({ length: 400 }).map(() => ({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 1.5 + 0.1, speed: (Math.random() * 0.2 + 0.05), opacity: Math.random() * 0.7 + 0.3 }));
      const animate = () => {
          ctx.fillStyle = 'black'; ctx.fillRect(0, 0, width, height);
          stars.forEach(star => {
              ctx.beginPath(); ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
              ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
              star.y -= star.speed * (star.size * 0.5);
              if (star.y < 0) { star.y = height; star.x = Math.random() * width; }
          });
          requestAnimationFrame(animate);
      };
      const animationId = requestAnimationFrame(animate);
      const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
      window.addEventListener('resize', handleResize);
      return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', handleResize); };
  }, []);
  return <canvas ref={canvasRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1}} />;
};

const DigitalAether = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let width = window.innerWidth, height = window.innerHeight;
      canvas.width = width; canvas.height = height;
      const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const PARTICLE_COUNT = IS_MOBILE ? 1500 : 4000;
      let particles = [], hue = 0, hoverX = null, hoverY = null, isTouching = false;
      class Particle {
          constructor() { this.reset(); this.x = Math.random() * width; this.y = Math.random() * height; }
          reset() { this.x = Math.random() * width; this.y = Math.random() * height; this.vx = 0; this.vy = 0; this.life = Math.random() * 100 + 50; this.speed = Math.random() * 2 + 1; this.size = Math.random() * 1.5 + 0.5; }
          update() {
              const angle = (Math.cos(this.x * 0.005) + Math.sin(this.y * 0.005) * Math.PI) * 2;
              let forceX = Math.cos(angle), forceY = Math.sin(angle);
              if (isTouching && hoverX !== null) { const dx = hoverX - this.x, dy = hoverY - this.y; if (Math.sqrt(dx*dx + dy*dy) < 300) { forceX += dx * 0.05; forceY += dy * 0.05; } }
              this.vx += forceX * 0.1; this.vy += forceY * 0.1; this.vx *= 0.95; this.vy *= 0.95;
              this.x += this.vx * this.speed * (IS_MOBILE ? 1.5 : 2); this.y += this.vy * this.speed * (IS_MOBILE ? 1.5 : 2);
              this.life--; if (this.x < 0 || this.x > width || this.y < 0 || this.y > height || this.life < 0) this.reset();
          }
          draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); const speed = Math.abs(this.vx) + Math.abs(this.vy); const localHue = (hue + speed * 20) % 360; ctx.fillStyle = `hsl(${localHue}, 70%, 60%)`; ctx.fill(); }
      }
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
      let animationId;
      const animate = () => { ctx.fillStyle = `rgba(0, 0, 0, 0.08)`; ctx.fillRect(0, 0, width, height); ctx.globalCompositeOperation = 'lighter'; particles.forEach(p => { p.update(); p.draw(); }); ctx.globalCompositeOperation = 'source-over'; hue += 0.2; animationId = requestAnimationFrame(animate); }
      animate();
      const updateInput = (x, y) => { hoverX = x; hoverY = y; isTouching = true; }
      const hMM = e => updateInput(e.clientX, e.clientY), hTS = e => { isTouching = true; updateInput(e.touches[0].clientX, e.touches[0].clientY); }, hTM = e => updateInput(e.touches[0].clientX, e.touches[0].clientY), hTE = () => isTouching = false;
      window.addEventListener('mousemove', hMM); window.addEventListener('touchstart', hTS, {passive:true}); window.addEventListener('touchmove', hTM, {passive:true}); window.addEventListener('touchend', hTE);
      const resize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
      window.addEventListener('resize', resize);
      return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', hMM); window.removeEventListener('touchstart', hTS); window.removeEventListener('touchmove', hTM); window.removeEventListener('touchend', hTE); };
  }, []);
  return <canvas ref={canvasRef} style={{position: 'fixed', top: 0, left: 0, zIndex: -1}} />;
};

// --- 3. REUSABLE UI COMPONENTS ---

const Card = ({ children, style, theme, onClick, animate = false }) => {
   const isDark = ['night', 'noir', 'forest', 'cosmos', 'aether', 'matrix'].includes(theme.id);
   const Component = animate ? motion.div : 'div';
   return (
       <Component
           layout={animate}
           onClick={onClick}
           style={{
               background: theme.card,
               borderRadius: 24,
               padding: 20,
               marginBottom: 12,
               backdropFilter: 'blur(3px)',
               border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
               boxShadow: animate ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
               ...style
           }}
       >
           {children}
       </Component>
   );
};

const Button = ({ children, onClick, theme, variant = 'primary', style, icon }) => {
   const isDark = ['night', 'noir', 'forest', 'cosmos', 'aether', 'matrix'].includes(theme.id);
   const baseStyle = {
       border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14,
       display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
       cursor: 'pointer', transition: 'all 0.2s', padding: '12px 16px'
   };
   
   let variantStyle = {};
   if (variant === 'primary') {
       variantStyle = {
           background: theme.primary,
           color: theme.id === 'noir' ? 'black' : 'white',
           width: '100%',
       };
   } else if (variant === 'ghost') {
       variantStyle = {
           background: 'none', padding: 4, opacity: 0.7, color: theme.text
       };
   } else if (variant === 'soft') {
       variantStyle = {
           background: 'rgba(255,255,255,0.4)', color: theme.id === 'noir' ? 'black' : theme.primary, width: '100%'
       };
   } else if (variant === 'amen') {
       variantStyle = {
           padding: '8px 16px', borderRadius: 20, fontSize: 13,
           background: 'rgba(0,0,0,0.05)', color: theme.text
       }
   }

   return (
       <motion.button whileTap={{scale: 0.96}} onClick={onClick} style={{...baseStyle, ...variantStyle, ...style}}>
           {icon} {children}
       </motion.button>
   );
};

// --- 4. MAIN APP COMPONENT ---
const AmenApp = () => {
   const [user, setUser] = useState(null);
   const [theme, setTheme] = useState(() => localStorage.getItem('amen_theme') || 'dawn');
   const [activeTab, setActiveTab] = useState('home');
   const [searchQuery, setSearchQuery] = useState("");
   const [prayers, setPrayers] = useState([]);
   const [topics, setTopics] = useState([]);
   const [publicRequests, setPublicRequests] = useState([]);
   const [feedbacks, setFeedbacks] = useState([]);
   // Loading is true by default to prevent "flash" of onboarding
   const [loading, setLoading] = useState(true);
   const [authLoading, setAuthLoading] = useState(true);

   const [modalMode, setModalMode] = useState(null);
   const [selectedItem, setSelectedItem] = useState(null);
   const [inputText, setInputText] = useState("");

   // --- ONBOARDING STATE ---
   // Initialize state based on localStorage. If visited before, start at Step 2 (Auth).
   const [onboardingStep, setOnboardingStep] = useState(() => {
       return localStorage.getItem('amen_visited') ? 2 : 0;
   });
   const [selectedMood, setSelectedMood] = useState(null);

   // --- LOGIC STATE ---
   const [devotionals, setDevotionals] = useState(INITIAL_DATA);
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

   const cur = THEMES[theme] || THEMES.dawn;
   const isDark = ['night', 'noir', 'forest', 'cosmos', 'aether', 'matrix'].includes(theme);
   const isAdmin = user?.email === ADMIN_EMAIL;

   // --- SYSTEM & EFFECTS ---
   useEffect(() => {
       const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
       link.type = 'image/png'; link.rel = 'shortcut icon'; link.href = '/icon-192.png';
       document.getElementsByTagName('head')[0].appendChild(link);
   }, []);

   useEffect(() => {
       const fetchDevotionals = async () => {
           try {
               const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_word'), orderBy('day'));
               const querySnapshot = await getDocs(q);
               if (!querySnapshot.empty) { const data = querySnapshot.docs.map(doc => doc.data()); if (data.length > 0) setDevotionals(data); }
           } catch (e) { console.error(e); }
       };
       fetchDevotionals();
   }, []);

   useEffect(() => {
       if (!user) return;
       let unsubReqs = () => {}, unsubFeedback = () => {};
       if (activeTab === 'community') {
           const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), orderBy('createdAt', 'desc'));
           unsubReqs = onSnapshot(q, (snapshot) => setPublicRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))));
       }
       if (activeTab === 'admin_feedback' && isAdmin) {
           const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback'), orderBy('createdAt', 'desc'));
           unsubFeedback = onSnapshot(q, (snapshot) => setFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))));
       }
       return () => { unsubReqs(); unsubFeedback(); };
   }, [user, activeTab, isAdmin]);

   useEffect(() => {
       if (!audioRef.current) audioRef.current = new Audio();
       const audio = audioRef.current;
       const handleEnded = () => setCurrentTrackIndex(prev => (prev + 1) % TRACKS.length);
       audio.addEventListener('ended', handleEnded);
       return () => audio.removeEventListener('ended', handleEnded);
   }, []);

   useEffect(() => {
       const audio = audioRef.current;
       const track = TRACKS[currentTrackIndex];
       if (track && track.file) {
           const newSrc = new URL(track.file, window.location.href).href;
           if (audio.src !== newSrc) { audio.src = track.file; audio.load(); if (isPlaying) audio.play().catch(e => console.log(e)); }
           else { if (isPlaying && audio.paused) audio.play().catch(e => console.log(e)); if (!isPlaying && !audio.paused) audio.pause(); }
       }
   }, [currentTrackIndex, isPlaying]);

   useEffect(() => { localStorage.setItem('amen_theme', theme); }, [theme]);

   useEffect(() => {
       const unsub = onAuthStateChanged(auth, (u) => {
           setUser(u);
           setLoading(false); // Global loading done
           if (u) {
               // User logged in, mark as visited
               localStorage.setItem('amen_visited', 'true');
               
               // If user came from mood onboarding, save it
               if (selectedMood) {
                   const saveInitialPrayer = async () => {
                       await addDoc(collection(db, 'artifacts', appId, 'users', u.uid, 'prayers'), {
                           text: `Боже, я чувствую: ${selectedMood.label}. Спасибо за слово: "${selectedMood.verse}"`,
                           status: 'active',
                           createdAt: serverTimestamp(),
                           comments: []
                       });
                   };
                   saveInitialPrayer();
                   setSelectedMood(null);
               }
           }
           setAuthLoading(false);
       });
       return () => unsub();
   }, [selectedMood]);

   useEffect(() => {
       if (!user) return;
       setLoading(true);
       const unsubP = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), orderBy('createdAt', 'desc')), s => {
           setPrayers(s.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))); setLoading(false);
       });
       const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'prayer_topics')), s => {
           setTopics(s.docs.map(d => ({ id: d.id, ...d.data(), lastPrayedAt: d.data().lastPrayedAt?.toDate() || null, createdAt: d.data().createdAt?.toDate() || new Date() })));
       });
       const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), (d) => {
           if (d.exists()) { const data = d.data(); setUserStats({ ...data, history: data.history || {} }); setDailyFocusDone(data.lastPrayedDate === getTodayString()); } else setDailyFocusDone(false);
       });
       const unsubRefl = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), (d) => {
           if (d.exists() && d.data()[getTodayString()]) setDailyReflectionDone(true); else setDailyReflectionDone(false);
       });
       return () => { unsubP(); unsubT(); unsubStats(); unsubRefl(); };
   }, [user]);

   useEffect(() => {
      if (!dailyFocusDone && !focusItem && (prayers.length > 0 || topics.length > 0)) selectRandomFocus();
   }, [prayers, topics, dailyFocusDone, focusItem]);


   // --- HANDLERS ---
   const handleAuth = async () => {
     if (!nickname.trim() || password.length < 6) { setAuthError("Имя и пароль (6+) обязательны"); return; }
     setAuthLoading(true); setAuthError("");
     const email = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '')}@amen.local`;
     try { await signInWithEmailAndPassword(auth, email, password); }
     catch { try { const u = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(u.user, { displayName: nickname }); } catch { setAuthError("Ошибка входа"); } }
     setAuthLoading(false);
   };

   const logout = () => { signOut(auth); setNickname(""); setPassword(""); setIsPlaying(false); };
   
   const uploadDevotionalsToDB = async () => {
      if (!window.confirm("Загрузить базу слов?")) return;
      try { const batch = writeBatch(db); INITIAL_DATA.forEach((item) => { batch.set(doc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_word'), `day_${item.day}`), item); }); await batch.commit(); alert("Успешно!"); } catch (e) { alert("Ошибка: " + e.message); }
   };

   const selectRandomFocus = () => {
      const allActive = [...prayers, ...topics].filter(i => i.status === 'active');
      if (allActive.length > 0) {
          const candidates = allActive.filter(i => !focusItem || i.id !== focusItem.id);
          setFocusItem(candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : allActive[Math.floor(Math.random() * allActive.length)]);
      } else setFocusItem(null);
   };

   const handleFocusPray = async () => {
      if (!focusItem || dailyFocusDone) return;
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: [cur.primary, '#fbbf24', '#ffffff'] });
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      const coll = focusItem.title ? 'prayer_topics' : 'prayers';
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, focusItem.id), { count: increment(1), lastPrayedAt: serverTimestamp() });
      const todayStr = getTodayString();
      let newStreak = userStats.streak;
      if (userStats.lastPrayedDate !== todayStr) {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          if (userStats.lastPrayedDate === `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`) newStreak += 1; else newStreak = 1;
      }
      const newHistory = { ...userStats.history, [todayStr]: true };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats'), { streak: newStreak, lastPrayedDate: todayStr, history: newHistory }, { merge: true });
      setUserStats({ streak: newStreak, lastPrayedDate: todayStr, history: newHistory });
      setDailyFocusDone(true);
      if (MEDALS[newStreak]) { setNewMedal(MEDALS[newStreak]); setModalMode('medal'); }
   };

   const handleReflection = async () => {
      if (!inputText.trim()) return;
      const text = inputText; closeModal();
      confetti({ shapes: ['star'], colors: ['#FFD700', '#FFA500'] });
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'prayers'), { text: "Вечерняя благодарность", status: 'answered', answerNote: text, createdAt: serverTimestamp(), answeredAt: serverTimestamp() });
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'reflections'), { [getTodayString()]: true }, { merge: true });
      setDailyReflectionDone(true);
   };

   const handleUpdateName = async () => {
       if (!editNameValue.trim()) return;
       try { await updateProfile(user, { displayName: editNameValue }); setUser({ ...user, displayName: editNameValue }); setIsEditingName(false); } catch (e) { alert("Ошибка обновления имени"); }
   };

   const createPublicRequest = async () => {
       if (!inputText.trim()) return;
       const text = inputText; closeModal();
       await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), { text, authorId: user.uid, authorName: user.displayName || "Аноним", amenCount: 0, amens: [], createdAt: serverTimestamp() });
   };

   const createFeedback = async () => {
       if (!inputText.trim()) return;
       const text = inputText; closeModal();
       await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedback'), { text, authorId: user.uid, authorName: user.displayName || "Аноним", createdAt: serverTimestamp() });
       alert("Спасибо! Ваше сообщение отправлено.");
   };

   const handleAmen = async (req) => {
       if (!user || req.amens?.includes(user.uid)) return;
       if (navigator.vibrate) navigator.vibrate(30);
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', req.id), { amenCount: increment(1), amens: arrayUnion(user.uid) });
   };

   const deletePublicRequest = async (id) => { if (window.confirm("Удалить просьбу?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id)); };
   const deleteFeedback = async (id) => { if (window.confirm("Удалить отзыв?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_feedback', id)); };
   
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
     const coll = selectedItem.title ? 'prayer_topics' : 'prayers'; closeModal();
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
        const coll = (selectedItem.title) ? 'prayer_topics' : 'prayers';
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, coll, selectedItem.id));
        closeModal();
     }
   };

   const closeModal = () => { setModalMode(null); setSelectedItem(null); setInputText(""); setNewMedal(null); };
   const nextTrack = () => setCurrentTrackIndex(p => (p + 1) % TRACKS.length);
   const prevTrack = () => setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length);
   const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
   const getGreeting = () => { const h = new Date().getHours(); return h < 6 ? "Тихой ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"; };

   // --- DERIVED STATE ---
   const getDailyDevotional = () => {
       const today = new Date().getDate();
       if (!devotionals || devotionals.length === 0) return INITIAL_DATA[(today - 1) % INITIAL_DATA.length];
       return devotionals[(today - 1) % devotionals.length];
   };
   const todaysDevotional = getDailyDevotional();
   const isEvening = new Date().getHours() >= 18;

   const list = useMemo(() => {
     const q = searchQuery.toLowerCase();
     const safeSort = (a, b) => (b.answeredAt?.seconds || b.createdAt?.seconds || 0) - (a.answeredAt?.seconds || a.createdAt?.seconds || 0);
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

   // --- VIEW RENDERERS ---

   // NEW: Onboarding Render
   const renderOnboarding = () => {
       if (onboardingStep === 0) {
           return (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{padding: 30, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center'}}>
                   <h1 style={{fontSize: 42, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', color: cur.primary, marginBottom: 10, lineHeight: 1}}>Amen.</h1>
                   <h2 style={{fontSize: 28, marginBottom: 30, fontWeight: 500}}>Что у тебя на сердце сегодня?</h2>
                   <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                       {ONBOARDING_OPTIONS.map(opt => (
                           <motion.button
                               key={opt.id}
                               whileTap={{scale:0.98}}
                               onClick={() => { setSelectedMood(opt); setOnboardingStep(1); }}
                               style={{
                                   display: 'flex', alignItems: 'center', gap: 15, padding: 20,
                                   background: cur.card, border: 'none', borderRadius: 20,
                                   textAlign: 'left', cursor: 'pointer', fontSize: 18, fontWeight: 500, color: cur.text,
                                   boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                               }}
                           >
                               <div style={{color: cur.primary}}>{opt.icon}</div>
                               {opt.label}
                           </motion.button>
                       ))}
                   </div>
                   <div style={{marginTop: 30, textAlign: 'center', opacity: 0.6, fontSize: 13}}>
                       <span onClick={() => setOnboardingStep(2)} style={{textDecoration: 'underline', cursor: 'pointer'}}>У меня уже есть аккаунт</span>
                   </div>
               </motion.div>
           );
       } else if (onboardingStep === 1 && selectedMood) {
           return (
               <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} style={{padding: 30, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', textAlign: 'center'}}>
                   <div style={{marginBottom: 30}}>
                       <div style={{display: 'inline-flex', padding: 20, borderRadius: '50%', background: `${cur.primary}20`, color: cur.primary, marginBottom: 20}}>
                           {React.cloneElement(selectedMood.icon, {size: 48})}
                       </div>
                       <h2 style={{fontSize: 32, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.3, marginBottom: 10}}>"{selectedMood.verse}"</h2>
                       <p style={{fontSize: 14, fontWeight: 'bold', opacity: 0.6, textTransform: 'uppercase'}}>{selectedMood.ref}</p>
                   </div>
                   <p style={{marginBottom: 40, fontSize: 16, opacity: 0.8, lineHeight: 1.5}}>Бог слышит тебя. Ты не один в этом чувстве.</p>
                   <Button onClick={() => setOnboardingStep(2)} theme={cur} style={{padding: 20, fontSize: 16}}>
                       Сохранить это в дневник <ArrowRight size={20}/>
                   </Button>
               </motion.div>
           );
       } else {
           // AUTH SCREEN
           return (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 20}}>
                   <div style={{background: cur.card, padding: 30, borderRadius: 30, backdropFilter: 'blur(10px)', width: '100%', maxWidth: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}}>
                       <h1 style={{fontSize:64, margin:0, fontFamily:'Cormorant Garamond', fontStyle:'italic', color: cur.primary, textAlign:'center', lineHeight: 1}}>Amen.</h1>
                       <p style={{fontFamily:'sans-serif', fontSize:14, opacity:0.8, marginBottom:30, textAlign:'center', lineHeight:1.5, marginTop: 10}}>
                           {selectedMood ? "Создай аккаунт, чтобы сохранить этот момент тишины." : "Ваше личное пространство тишины."}
                       </p>
                       <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                           <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Имя" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.5)', fontSize:16}}/>
                           <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль" style={{padding:16, borderRadius:16, border:'none', background:'rgba(255,255,255,0.5)', fontSize:16}}/>
                           {authError && <p style={{fontSize: 12, textAlign: 'center', margin: 0, color: '#e11d48'}}>{authError}</p>}
                           <Button onClick={handleAuth} theme={cur}>{authLoading ? <Loader className="animate-spin"/> : (selectedMood ? "Сохранить и Войти" : "Войти / Создать")}</Button>
                           {selectedMood ?
                               <button onClick={() => setOnboardingStep(0)} style={{background:'none', border:'none', fontSize:12, opacity:0.5, marginTop:10, cursor:'pointer'}}>Назад к выбору</button>
                               : null
                           }
                       </div>
                   </div>
               </motion.div>
           );
       }
   };

   const renderWord = () => (
       <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
           <Card theme={cur}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                   <h2 style={{fontSize: 24, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', margin: 0}}>Слово на сегодня</h2>
                   <span style={{fontSize: 12, fontWeight: 'bold', padding: '4px 10px', background: cur.primary, color: theme === 'noir' ? 'black' : 'white', borderRadius: 20}}>
                       {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                   </span>
               </div>
               <div style={{marginBottom: 24}}>
                   <p style={{fontSize: 20, lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'Cormorant Garamond', marginBottom: 10}}>«{todaysDevotional.text}»</p>
                   <p style={{textAlign: 'right', fontSize: 13, fontWeight: 'bold', opacity: 0.8}}>— {todaysDevotional.reference}</p>
               </div>
               <div style={{background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16, marginBottom: 16}}>
                   <h3 style={{fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8}}>Мысль</h3>
                   <p style={{fontSize: 15, lineHeight: 1.5, opacity: 0.9}}>{todaysDevotional.explanation}</p>
               </div>
               <div style={{background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)', padding: 16, borderRadius: 16, borderLeft: `4px solid ${cur.primary}`}}>
                   <h3 style={{fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: cur.primary, marginBottom: 8}}>Действие</h3>
                   <p style={{fontSize: 15, lineHeight: 1.5, opacity: 0.9}}>{todaysDevotional.action}</p>
               </div>
           </Card>
       </motion.div>
   );

   const renderCommunity = () => (
       <div>
           <div style={{textAlign:'center', marginBottom:20, opacity:0.8, fontSize:13}}>Здесь мы несем бремена друг друга.<br/>Нажмите «Аминь», если помолились.</div>
           {publicRequests.length === 0 ? <div style={{textAlign: 'center', marginTop: 50, opacity: 0.5}}>Пока тишина...</div> :
               publicRequests.map(req => {
                   const isAmened = req.amens?.includes(user.uid);
                   return (
                       <Card key={req.id} theme={cur} animate>
                           <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                               <span style={{fontSize:11, fontWeight:'bold', opacity:0.7}}>{req.authorName} • {formatDate(req.createdAt)}</span>
                               {(user.uid === req.authorId || isAdmin) && <Button variant="ghost" onClick={() => deletePublicRequest(req.id)} theme={cur} icon={<Trash2 size={14} />} />}
                           </div>
                           <p style={{fontSize:16, lineHeight:1.5, marginBottom:15}}>{req.text}</p>
                           <Button
                               onClick={() => handleAmen(req)}
                               theme={cur}
                               variant="amen"
                               style={{
                                   background: isAmened ? cur.primary : 'rgba(0,0,0,0.05)',
                                   color: isAmened ? (theme==='noir'?'black':'white') : cur.text
                               }}
                           >
                               <Users size={16} style={{marginRight:6}}/> Аминь {req.amenCount > 0 && <span>• {req.amenCount}</span>}
                           </Button>
                       </Card>
                   )
               })
           }
       </div>
   );

   const renderAdminFeedback = () => (
       <div>
           <h3 style={{textAlign:'center', marginBottom:20}}>Отзывы</h3>
           {feedbacks.map(fb => (
               <div key={fb.id} style={{background: cur.card, padding: 15, borderRadius: 15, marginBottom: 10}}>
                   <div style={{display:'flex', justifyContent:'space-between', fontSize:11, opacity:0.7, marginBottom:5}}>
                       <span>{fb.authorName} • {formatDate(fb.createdAt)}</span>
                       <button onClick={() => deleteFeedback(fb.id)}><Trash2 size={14} /></button>
                   </div>
                   <p style={{fontSize:14}}>{fb.text}</p>
               </div>
           ))}
       </div>
   );

   const renderHome = () => (
       <div style={{marginBottom: 30}}>
           {/* FOCUS CARD */}
           {!dailyFocusDone && focusItem && (
               <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} style={{
                       background: `linear-gradient(135deg, ${cur.primary}15, ${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.6)'})`,
                       borderRadius: 30, padding: 24, border: `1px solid ${cur.primary}40`, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)', marginBottom: 20
                   }}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
                       <span style={{fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: cur.primary, display:'flex', alignItems:'center', gap: 6}}><Zap size={14} fill={cur.primary} /> Молитва сейчас</span>
                       <button onClick={selectRandomFocus} style={{background: 'none', border:'none', opacity:0.6, padding:0}}><RefreshCw size={14} color={cur.text}/></button>
                   </div>
                   <p style={{fontSize: 22, fontWeight: '500', fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.3, marginBottom: 25}}>"{focusItem.text || focusItem.title}"</p>
                   <Button onClick={handleFocusPray} theme={cur} variant="primary" icon={<Heart size={18} fill={theme === 'noir' ? 'black' : 'white'} />}>Помолиться</Button>
               </motion.div>
           )}
           
           {/* DAILY REFLECTION OR DONE STATE */}
           {dailyFocusDone && (
               <>
                   {isEvening && !dailyReflectionDone ? (
                       <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} style={{
                           background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                           borderRadius: 30, padding: 24, marginBottom: 20,
                           border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}`,
                           backdropFilter: 'blur(12px)', boxShadow: `0 10px 30px ${cur.primary}20`
                       }}>
                           <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10, opacity:0.8}}><Moon size={16} fill={isDark ? 'white' : cur.primary} color={isDark ? 'white' : cur.primary} /> <span style={{fontSize:11, fontWeight:'bold', textTransform:'uppercase', color: isDark ? 'white' : cur.text}}>Итоги дня</span></div>
                           <p style={{fontFamily:'Cormorant Garamond', fontSize:22, fontStyle:'italic', margin:'0 0 20px', color: isDark ? 'white' : cur.text}}>В чем ты увидел Бога сегодня?</p>
                           <Button onClick={() => {setModalMode('reflection'); setInputText("");}} theme={cur}>Написать благодарность</Button>
                       </motion.div>
                   ) : (
                       <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{
                           background: `linear-gradient(135deg, ${cur.primary}20, ${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.6)'})`,
                           borderRadius: 24, padding: 20, marginBottom: 20, border: `1px solid ${cur.primary}40`, display: 'flex', alignItems: 'center', gap: 15, backdropFilter: 'blur(5px)'
                       }}>
                           <div style={{background: isDark ? `${cur.primary}30` : 'white', padding: 10, borderRadius: '50%', boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'}}><CheckCircle2 size={24} color={cur.primary} /></div>
                           <div><h4 style={{margin:0, fontSize:16, color: cur.text}}>Огонь горит</h4><p style={{margin:0, fontSize:12, opacity:0.7, color: cur.text}}>Вы поддержали пламя молитвы.</p></div>
                       </motion.div>
                   )}
               </>
           )}

           {/* MAIN LIST */}
           <div style={{marginBottom: 10, fontSize: 12, opacity: 0.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center'}}>Ваши записи</div>
           {list.length === 0 ? <div style={{textAlign: 'center', marginTop: 30, opacity: 0.6}}><p style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:16}}>Больше ничего нет...</p></div> :
               list.map((item) => (
                   <Card key={item.id} theme={cur}>
                       <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                           <span style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold'}}>{formatDate(item.createdAt)}</span>
                           <div style={{display:'flex', gap: 5}}>
                               {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', color: theme === 'noir' ? 'black' : cur.primary}}>Ответ</button>}
                               <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 0}}><Trash2 size={14} color={cur.text} style={{opacity: 0.5}}/></button>
                           </div>
                       </div>
                       <p style={{margin: 0, fontSize: 16}}>{item.text || item.title}</p>
                       {activeTab === 'list' && (
                           <div style={{fontSize: 11, opacity: 0.6, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}>
                               <Wind size={12}/> {item.count} • {formatDate(item.createdAt)}
                           </div>
                       )}
                       {activeTab === 'list' && <Button variant="soft" onClick={() => prayForTopic(item.id)} theme={cur} icon={<Wind size={16}/>} style={{marginTop: 8}}>Помолиться</Button>}
                       {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.9}}>"{item.answerNote}"</div>}
                   </Card>
               ))
           }
       </div>
   );

   // --- MAIN RENDER ---
   return (
       <>
           {theme === 'cosmos' ? <Starfield /> : theme === 'aether' ? <DigitalAether /> : (
               <div style={{position: 'fixed', inset:0, backgroundImage: cur.bg, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -1, transition: 'background 0.8s ease'}} />
           )}

           <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', color: cur.text }}>
               <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap'); *{box-sizing:border-box; -webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar {display:none;}`}</style>
               
               {loading ? (
                   /* GLOBAL LOADING STATE */
                   <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                       <Loader className="animate-spin" size={32} color={cur.text} style={{opacity: 0.5}} />
                       <h1 style={{fontSize:24, fontFamily:'Cormorant Garamond', fontStyle:'italic', marginTop: 20, opacity: 0.5}}>Amen.</h1>
                   </div>
               ) : !user ? (
                   renderOnboarding()
               ) : (
                   <div style={{maxWidth: 500, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.1)'}}>
                       {/* HEADER */}
                       <div style={{padding: '60px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                           <div>
                               <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: 52, fontStyle: 'italic', margin: 0, lineHeight: 1, letterSpacing: '3px', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>Amen.</h1>
                               <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 8}}>
                                   <p style={{fontSize: 12, opacity: 0.9, letterSpacing: 1, fontWeight:'bold', margin: 0}}>{getGreeting()}, {user.displayName}</p>
                                   <div style={{display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, backdropFilter: 'blur(3px)'}}>
                                       <Flame size={14} fill={dailyFocusDone ? '#fbbf24' : 'none'} color={dailyFocusDone ? '#fbbf24' : cur.text} style={{opacity: dailyFocusDone ? 1 : 0.5}} />
                                       <span style={{fontSize: 11, fontWeight: 'bold', color: cur.text}}>{userStats.streak}</span>
                                   </div>
                               </div>
                           </div>
                           <div style={{display:'flex', gap:10}}>
                               <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('music')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}>
                                   {isPlaying ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}><Volume2 size={20} color={cur.text}/></motion.div> : <Music size={20} color={cur.text} style={{opacity:0.8}}/>}
                               </motion.button>
                               <motion.button whileTap={{scale:0.9}} onClick={() => setModalMode('settings')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'}}><User size={20} color={cur.text}/></motion.button>
                           </div>
                       </div>

                       {/* NAV TABS */}
                       <div style={{display: 'flex', padding: '0 24px', marginBottom: 10, gap: 10, overflowX: 'auto'}}>
                           {[{id:'home', l:'Дневник'}, {id:'word', l:'Слово'}, {id:'list', l:'Список'}, {id:'community', l:'Единство'}, {id:'vault', l:'Чудеса'}, ...(isAdmin ? [{id: 'admin_feedback', l: 'Отзывы'}] : [])].map(tab => (
                               <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                   flex: 1, background: 'none', border: 'none', padding: '12px 10px', whiteSpace: 'nowrap',
                                   color: cur.text, opacity: activeTab === tab.id ? 1 : 0.6,
                                   fontWeight: activeTab === tab.id ? '800' : '500', fontSize: 14, position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                               }}>
                                   {tab.l}
                                   {activeTab === tab.id && <motion.div layoutId="underline" style={{position:'absolute', bottom:0, left:0, right:0, height:3, background: cur.primary, borderRadius:2}} />}
                               </button>
                           ))}
                       </div>

                       {/* MAIN CONTENT AREA */}
                       <div style={{flex: 1, padding: `10px 20px ${isPlaying && modalMode !== 'music' ? '120px' : '100px'}`, overflowY: 'auto'}}>
                           {activeTab === 'home' && renderHome()}
                           {activeTab === 'word' && renderWord()}
                           {activeTab === 'community' && renderCommunity()}
                           {activeTab === 'admin_feedback' && isAdmin && renderAdminFeedback()}
                           {(activeTab === 'list' || activeTab === 'vault') && (
                               list.length === 0 ? <div style={{textAlign: 'center', marginTop: 80, opacity: 0.8, background: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 20, backdropFilter:'blur(5px)'}}><p style={{fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:18}}>Тишина...</p></div> :
                               list.map((item) => (
                                   <Card key={item.id} theme={cur} animate>
                                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                                           <div style={{fontSize: 11, opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', gap: 6, alignItems: 'center'}}>
                                               {activeTab === 'list' ? <><Wind size={12}/> {item.count} • {formatDate(item.createdAt)}</> : formatDate(item.createdAt)}
                                           </div>
                                           <div style={{display:'flex', gap: 5}}>
                                               {activeTab !== 'vault' && <button onClick={() => {setSelectedItem(item); setModalMode('answer');}} style={{background: 'rgba(255,255,255,0.8)', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', color: theme === 'noir' ? 'black' : cur.primary, cursor: 'pointer'}}>Ответ</button>}
                                               <button onClick={() => {setSelectedItem(item); deleteItem();}} style={{background: 'none', border: 'none', padding: 5, cursor: 'pointer'}}><Trash2 size={16} color={cur.text} style={{opacity: 0.5}}/></button>
                                           </div>
                                       </div>
                                       <p style={{margin: '0 0 10px', fontSize: 17, lineHeight: 1.5, fontWeight: 500}}>{item.text || item.title}</p>
                                       {activeTab === 'list' && <Button variant="soft" onClick={() => prayForTopic(item.id)} theme={cur} icon={<Wind size={16}/>}>Помолиться</Button>}
                                       {activeTab === 'vault' && item.answerNote && <div style={{background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, fontSize: 15, fontStyle: 'italic', borderLeft: `3px solid ${cur.primary}`, marginTop: 10, color: cur.text, opacity: 0.9}}>"{item.answerNote}"</div>}
                                   </Card>
                               ))
                           )}
                       </div>

                       {/* FAB */}
                       {(activeTab === 'home' || activeTab === 'list' || activeTab === 'community') && (
                           <div style={{position: 'fixed', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10}}>
                               <motion.button whileTap={{scale:0.9}} onClick={() => { setModalMode(activeTab === 'list' ? 'topic' : activeTab === 'community' ? 'public_request' : activeTab === 'admin_feedback' ? 'feedback' : 'entry'); setInputText(""); }} style={{pointerEvents: 'auto', width: 72, height: 72, borderRadius: '50%', background: cur.primary, border: 'none', color: isDark?'black':'white', boxShadow: `0 10px 40px ${cur.primary}80`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Plus size={36}/></motion.button>
                           </div>
                       )}

                       {/* MINI PLAYER */}
                       <AnimatePresence>
                           {isPlaying && modalMode !== 'music' && (
                               <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 50, opacity: 0}} style={{position: 'fixed', bottom: 110, right: 20, zIndex: 9, background: cur.card, backdropFilter: 'blur(10px)', padding: '10px 15px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`, boxShadow: '0 5px 20px rgba(0,0,0,0.1)'}}>
                                   <div onClick={() => setModalMode('music')} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
                                       <div style={{width: 8, height: 8, borderRadius: '50%', background: cur.primary, animation: 'pulse 2s infinite'}} />
                                       <span style={{fontSize: 12, fontWeight: 'bold', maxWidth: 100, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{TRACKS[currentTrackIndex].title}</span>
                                   </div>
                                   <button onClick={() => setIsPlaying(false)} style={{background: 'none', border: 'none', padding: 4, cursor: 'pointer'}}><Pause size={16} fill={cur.text} color={cur.text}/></button>
                               </motion.div>
                           )}
                       </AnimatePresence>
                   </div>
               )}
           </div>

           {/* --- MODALS (CLEANED UP) --- */}
           {modalMode === 'medal' && newMedal && (
               <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
                   <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} style={{background: 'white', padding: 40, borderRadius: 40, textAlign: 'center', maxWidth: 350}}>
                       <div style={{marginBottom: 20, transform: 'scale(1.5)'}}>{newMedal.icon}</div>
                       <h2>{newMedal.name}</h2><p>{newMedal.desc}</p>
                       <button onClick={() => setModalMode(null)} style={{marginTop: 30, background: '#f59e0b', color: 'white', border: 'none', padding: '12px 30px', borderRadius: 20}}>Принять</button>
                   </motion.div>
               </div>
           )}

           {(modalMode === 'entry' || modalMode === 'topic' || modalMode === 'reflection' || modalMode === 'public_request' || modalMode === 'feedback') && (
           <div onClick={closeModal} style={{position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}}>
               <motion.div initial={{scale: 0.95, opacity: 0, y: 10}} animate={{scale: 1, opacity: 1, y: 0}} onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: 450, background: isDark ? '#1e293b' : '#ffffff', borderRadius: 28, padding: 24}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                       <span style={{fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: cur.primary}}>
                           {modalMode === 'reflection' ? "Итоги дня" : modalMode === 'topic' ? "Новая тема" : modalMode === 'public_request' ? "Общая молитва" : modalMode === 'feedback' ? "Ваш отзыв" : "Молитва"}
                       </span>
                       <button onClick={closeModal} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: 8, borderRadius: '50%'}}><X size={20} color={cur.text} /></button>
                   </div>
                   <textarea autoFocus value={inputText} onChange={e => setInputText(e.target.value)} placeholder="..." style={{width: '100%', minHeight: 180, maxHeight: '40vh', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', border: 'none', borderRadius: 16, padding: 16, fontSize: 18, fontFamily: 'Cormorant Garamond', fontStyle: 'italic', lineHeight: 1.5, color: cur.text, outline: 'none', resize: 'none'}}/>
                   <Button onClick={modalMode === 'reflection' ? handleReflection : modalMode === 'public_request' ? createPublicRequest : modalMode === 'feedback' ? createFeedback : createItem} theme={cur} icon={<ChevronRight size={18} />}>
                       {modalMode === 'public_request' || modalMode === 'feedback' ? 'Отправить' : 'Аминь'}
                   </Button>
               </motion.div>
           </div>
           )}

           {modalMode === 'donate' && (
           <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}} onClick={closeModal}>
               <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 360, borderRadius: 30, padding: 24, textAlign: 'center'}} onClick={e => e.stopPropagation()}>
                   <button onClick={closeModal} style={{position:'absolute', top:16, right:16, background:'none', border:'none'}}><X size={24} color={cur.text}/></button>
                   <h3 style={{margin: '10px 0 10px', fontFamily: 'Cormorant Garamond', fontSize: 26, fontStyle: 'italic', color: cur.text}}>Поддержать проект</h3>
                   <p style={{fontSize: 14, lineHeight: 1.5, opacity: 0.8, marginBottom: 20, color: cur.text}}>На оплату серверов и дальнейшее развитие проекта. Спасибо, что помогаете сохранять это место тишины.</p>
                   <div style={{marginBottom: 25}}><div style={{background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10}}><span style={{fontSize: 15, fontFamily: 'monospace', fontWeight: 'bold', color: cur.text}}>42301810500073862125</span><button onClick={() => handleCopy("42301810500073862125")} style={{background: 'none', border: 'none', color: cur.primary}}>{copied ? <Check size={20}/> : <Copy size={20}/>}</button></div></div>
               </motion.div>
           </div>
           )}

           {modalMode === 'settings' && (
           <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end'}} onClick={closeModal}>
               <motion.div initial={{x:100}} animate={{x:0}} style={{background: isDark ? '#171717' : 'white', color: isDark ? 'white' : '#1A1A1A', width: '90%', maxWidth: 360, height: '100%', padding: '40px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                   <div style={{display:'flex', alignItems:'center', gap:15, marginBottom: 30}}>
                       <div style={{width: 60, height: 60, borderRadius: '50%', background: cur.primary, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:24, fontWeight:'bold'}}>{user.displayName ? user.displayName[0] : 'A'}</div>
                       <div>
                           {isEditingName ? (
                               <div style={{display:'flex', alignItems:'center', gap:8}}>
                                   <input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} style={{background: 'rgba(0,0,0,0.05)', border: 'none', padding: '8px', borderRadius: 8, fontSize: 16, width: 140, color: cur.text}} autoFocus />
                                   <button onClick={handleUpdateName} style={{background: cur.primary, color:'white', border:'none', borderRadius: 8, padding: 8}}><Check size={16}/></button>
                               </div>
                           ) : (
                               <h2 style={{margin:0, fontSize:22, display:'flex', alignItems:'center', gap: 8}}>{user.displayName}<button onClick={() => { setEditNameValue(user.displayName); setIsEditingName(true); }} style={{background:'none', border:'none', opacity:0.5, cursor:'pointer'}}><User size={16} color={cur.text}/></button></h2>
                           )}
                           <div style={{display:'flex', alignItems:'center', gap:5, opacity:0.7, fontSize:14, marginTop:4}}><Flame size={14} fill="#f59e0b" color="#f59e0b"/> <span>{userStats.streak} дней в духе</span></div>
                       </div>
                   </div>
                   
                   {/* STATS GRID RESTORED */}
                   <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30}}>
                       <div style={{background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', padding: 15, borderRadius: 20}}>
                           <span style={{fontSize:24, fontWeight:'bold'}}>{prayers.length + topics.length}</span>
                           <p style={{margin:0, fontSize:12, opacity:0.5}}>Всего молитв</p>
                       </div>
                       <div style={{background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', padding: 15, borderRadius: 20}}>
                           <span style={{fontSize:24, fontWeight:'bold'}}>{list.filter(i => i.status === 'answered').length}</span>
                           <p style={{margin:0, fontSize:12, opacity:0.5}}>Отвечено</p>
                       </div>
                   </div>

                   {/* CALENDAR RESTORED */}
                   <div style={{marginBottom: 30}}>
                       <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>История верности</h3>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8}}>
                           {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map((d, i) => (
                               <div key={i} style={{fontSize: 10, textAlign: 'center', opacity: 0.4, marginBottom: 5}}>{d}</div>
                           ))}
                           {getDaysInMonth().map(day => {
                               const d = new Date();
                               const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${day}`;
                               const isActive = userStats.history && userStats.history[dateKey];
                               const isFuture = day > d.getDate();
                               
                               return (
                                   <div key={day} style={{
                                       aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold',
                                       background: isActive ? cur.primary : isFuture ? 'transparent' : isDark?'rgba(255,255,255,0.05)':'#f1f5f9',
                                       color: isActive ? (theme === 'noir' ? 'black' : 'white') : isFuture ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : (isDark ? 'white' : 'black'),
                                       opacity: isActive ? 1 : isFuture ? 1 : 0.5
                                   }}>
                                       {day}
                                   </div>
                               )
                           })}
                       </div>
                   </div>

                   {/* MEDALS RESTORED */}
                   <div style={{marginBottom: 30}}>
                       <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>Зал Славы</h3>
                       <div style={{display: 'flex', gap: 15, overflowX: 'auto', paddingBottom: 10}}>
                           {Object.values(MEDALS).map(medal => {
                               const isUnlocked = userStats.streak >= parseInt(Object.keys(MEDALS).find(k => MEDALS[k] === medal));
                               return (
                                   <div key={medal.id} style={{
                                       minWidth: 100, background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', padding: 15, borderRadius: 20,
                                       display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                       opacity: isUnlocked ? 1 : 0.4, filter: isUnlocked ? 'none' : 'grayscale(100%)'
                                   }}>
                                       <div style={{marginBottom: 10}}>{React.cloneElement(medal.icon, { color: isUnlocked ? undefined : (isDark ? 'white' : 'black') })}</div>
                                       <span style={{fontSize: 12, fontWeight: 'bold'}}>{medal.name}</span>
                                       <span style={{fontSize: 10, opacity: 0.6}}>{medal.desc}</span>
                                   </div>
                               )
                           })}
                       </div>
                   </div>

                   <div style={{marginTop: 'auto'}}>
                       <h3 style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15}}>Тема</h3>
                       <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 30}}>
                           {Object.keys(THEMES).filter(t => isAdmin || !['cosmos', 'aether'].includes(t)).map(t => (
                               <div key={t} onClick={() => setTheme(t)} style={{cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                                   <div style={{width: 40, height: 40, borderRadius: 12, background: THEMES[t].bg, backgroundColor: THEMES[t].fallback, backgroundSize:'cover', border: theme === t ? `2px solid ${cur.text}` : '2px solid transparent'}}/>
                                   <span style={{fontSize: 10, opacity: 0.7, fontWeight: theme === t ? 'bold' : 'normal'}}>{THEMES[t].name}</span>
                               </div>
                           ))}
                       </div>
                       {user.email === ADMIN_EMAIL && <Button onClick={uploadDevotionalsToDB} theme={cur} style={{marginBottom: 10}} icon={<UploadCloud size={18} />}>ADMIN: Загрузить Слово</Button>}
                       <Button onClick={() => setModalMode('donate')} theme={cur} style={{marginBottom: 10}} icon={<Heart size={18} fill={cur.primary} color={cur.primary} />}>Поддержать проект</Button>
                       <Button onClick={() => setModalMode('feedback')} theme={cur} style={{marginBottom: 10}} icon={<MessageSquare size={18}/>}>Написать разработчику</Button>
                       <Button onClick={() => setModalMode('about')} theme={cur} style={{marginBottom: 10}} icon={<Info size={18}/>}>О приложении</Button>
                       <Button onClick={logout} theme={cur} style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)'}} icon={<LogOut size={18}/>}>Выйти</Button>
                   </div>
               </motion.div>
           </div>
           )}

           {modalMode === 'about' && (
               <div style={{position: 'fixed', inset: 0, background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.95)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20}} onClick={closeModal}>
                   <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={{background: isDark ? '#1e293b' : 'white', width: '100%', maxWidth: 350, borderRadius: 30, padding: 30}} onClick={e => e.stopPropagation()}>
                       <button onClick={closeModal} style={{position:'absolute', top:20, right:20, background:'none', border:'none'}}><X size={24} color={isDark?'white':'#333'}/></button>
                       <h2 style={{fontFamily: 'Cormorant Garamond', fontSize: 32, fontStyle: 'italic', color: cur.primary, marginBottom: 10}}>Amen.</h2>
                       <p style={{fontSize: 14, lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#4b5563', marginBottom: 20}}>Это приложение — ваш инструмент для осознанной духовной жизни. Здесь нет алгоритмов и лайков. Только вы и ваши мысли.</p>
                       <div style={{marginBottom: 20}}>
                           <h4 style={{fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: cur.primary, marginBottom: 8}}>Как это работает</h4>
                           <ul style={{fontSize: 13, lineHeight: 1.6, color: isDark ? '#cbd5e1' : '#4b5563', paddingLeft: 20, margin: 0}}>
                               <li style={{marginBottom: 5}}><b>Дневник:</b> Личные молитвы и фокус дня.</li>
                               <li style={{marginBottom: 5}}><b>Слово:</b> Ежедневное вдохновение.</li>
                               <li style={{marginBottom: 5}}><b>Список:</b> Ваши молитвенные нужды и трекер.</li>
                               <li style={{marginBottom: 5}}><b>Единство:</b> Анонимная поддержка других.</li>
                               <li style={{marginBottom: 5}}><b>Чудеса:</b> Архив ответов.</li>
                               <li><b>Огонь:</b> Символ вашей дисциплины.</li>
                           </ul>
                       </div>
                       <div style={{textAlign:'center', fontSize: 11, opacity: 0.4, color: isDark ? 'white' : 'black'}}>Версия 1.6</div>
                   </motion.div>
               </div>
           )}

           {modalMode === 'music' && (
           <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}} onClick={closeModal}>
               <div style={{background: theme === 'noir' ? '#171717' : (isDark ? '#1e293b' : 'white'), borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30}} onClick={e=>e.stopPropagation()}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                       <h3 style={{margin:0, fontSize:20, color:cur.text}}>Музыка души</h3>
                       <button onClick={closeModal}><X size={24} color={cur.text}/></button>
                   </div>
                   <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:'40vh', overflowY:'auto'}}>
                       {TRACKS.map((track, i) => (
                       <button key={i} onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} style={{background: i===currentTrackIndex ? cur.primary : 'rgba(0,0,0,0.05)', color: i===currentTrackIndex ? (theme === 'noir' ? 'black' : 'white') : cur.text, border:'none', padding:15, borderRadius:12, textAlign:'left', fontWeight:'bold'}}>{track.title}</button>
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
       </>
   );
};

export default AmenApp;