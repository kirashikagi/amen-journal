import React, { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { Loader, Wind } from "lucide-react";

/* ================= FIREBASE ================= */

const firebaseConfig = {
  apiKey: "AIzaSyCgOZoeEiiLQAobec0nckBhkXQF5Yxe68k",
  authDomain: "amen-journal.firebaseapp.com",
  projectId: "amen-journal",
  storageBucket: "amen-journal.appspot.com",
  messagingSenderId: "979782042974",
  appId: "1:979782042974:web:b35d08837ee633000ebbcf"
};

const appId = "amen"; // 🔥 КРИТИЧНО

let app, auth, db;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init error", e);
}

/* ================= DATA ================= */

const THEMES = {
  dawn: {
    id: "dawn",
    bg: "#fff7ed",
    primary: "#be123c",
    text: "#881337",
    card: "rgba(255,255,255,0.7)"
  }
};

const ONBOARDING_OPTIONS = [
  {
    id: "anxiety",
    label: "Тревога",
    icon: <Wind />,
    verse: "Не заботьтесь ни о чём…",
    ref: "Флп 4:6"
  }
];

/* ================= APP ================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [prayers, setPrayers] = useState([]);

  const cur = THEMES.dawn;

  /* ================= AUTH ================= */

  useEffect(() => {
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (u && db) {
        const snap = await getDocs(
          collection(db, "artifacts", appId, "users", u.uid, "prayers")
        );
        setPrayers(snap.docs.map(d => d.data()));
      }
    });

    return () => unsub();
  }, []);

  const handleAuth = async () => {
    setAuthError("");
    if (!nickname || password.length < 6) {
      setAuthError("Имя и пароль (6+)");
      return;
    }

    const email = `${nickname.toLowerCase()}@amen.local`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: nickname });
      } catch {
        setAuthError("Ошибка входа");
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        {onboardingStep === 0 && (
          <>
            <h1>Amen.</h1>
            {ONBOARDING_OPTIONS.map(o => (
              <button
                key={o.id}
                onClick={() => {
                  setSelectedMood(o);
                  setOnboardingStep(1);
                }}
              >
                {o.icon} {o.label}
              </button>
            ))}
            <br />
            <button onClick={() => setOnboardingStep(2)}>Войти</button>
          </>
        )}

        {onboardingStep === 1 && selectedMood && (
          <>
            <blockquote>{selectedMood.verse}</blockquote>
            <button onClick={() => setOnboardingStep(2)}>Продолжить</button>
          </>
        )}

        {onboardingStep === 2 && (
          <>
            <input
              placeholder="Имя"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button onClick={handleAuth}>Войти / Создать</button>
            {authError && <p style={{ color: "red" }}>{authError}</p>}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: cur.bg,
        color: cur.text,
        padding: 30
      }}
    >
      <h1>Amen.</h1>
      <p>Привет, {user.displayName || "друг"} 👋</p>

      <button onClick={logout}>Выйти</button>

      <h3>Ваши записи</h3>
      {prayers.length === 0 && <p>Пока пусто</p>}
      {prayers.map((p, i) => (
        <div key={i} style={{ background: cur.card, padding: 12, marginBottom: 8 }}>
          {p.text}
        </div>
      ))}
    </div>
  );
}