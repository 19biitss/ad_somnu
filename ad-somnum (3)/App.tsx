
import React, { useState, useEffect, useRef } from 'react';
import { View, Language, Theme, ChatMessage, MusicTrack } from './types';
import { TRANSLATIONS, MUSIC_DATA } from './constants';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { createHipnosChat, generateTenguPlan, validateTenguInput } from './services/geminiService';
import { 
  MoonIcon, StarIcon, WindIcon, MusicIcon, 
  MessageSquareIcon, ClipboardIcon, SettingsIcon,
  PlayIcon, PauseIcon 
} from './components/Icons';

// --- Sub-components ---

// 1. Splash Screen
const SplashScreen = ({ onFinish, translations }: { onFinish: () => void; translations: any }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(onFinish, 1000); 
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-night-900 transition-opacity duration-1000 ${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative mb-6">
        <MoonIcon className="w-32 h-32 text-slate-400/80 drop-shadow-[0_0_25px_rgba(99,102,241,0.3)]" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-[-5px] ml-[2px]">
           <StarIcon className="w-8 h-8 text-white animate-star-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>
      </div>
      <h1 className="text-4xl font-light tracking-[0.2em] text-white mb-8 animate-fade-in font-serif">Ad somnum</h1>
      <p className="text-slate-400 text-sm max-w-xs text-center italic animate-fade-in delay-500">
        {translations.splashDedication}
      </p>
    </div>
  );
};

// 2. Breathing Component
const BreathingView = ({ t }: { t: any }) => {
  const [active, setActive] = useState(false);
  const [phaseText, setPhaseText] = useState(t.start);
  const [scale, setScale] = useState(1);
  const [duration, setDuration] = useState(1000); 

  useEffect(() => {
    if (!active) {
      setPhaseText(t.start);
      setScale(1);
      setDuration(1000);
      return;
    }

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const runCycle = () => {
      setPhaseText(t.inhale);
      setScale(1.5); 
      setDuration(4000);

      const holdTimeout = setTimeout(() => {
        setPhaseText(t.hold);
      }, 4000);

      const exhaleTimeout = setTimeout(() => {
        setPhaseText(t.exhale);
        setScale(1);
        setDuration(8000); 
      }, 11000); 

      timeouts.push(holdTimeout, exhaleTimeout);
    };

    runCycle();
    const interval = setInterval(() => {
      runCycle();
    }, 19000); 

    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, [active, t]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <h2 className="text-2xl font-light mb-2 text-day-text dark:text-night-text tracking-wide">{t.sectionBreathing}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mb-12 leading-relaxed">{t.descBreathing}</p>
      
      <div className="relative w-64 h-64 flex items-center justify-center">
        <div 
          className={`absolute w-full h-full rounded-full blur-xl transition-all ease-in-out`}
          style={{ 
            transform: `scale(${active ? (scale * 1.1) : 1})`, 
            opacity: active ? 0.6 : 0.2,
            transitionDuration: `${duration}ms`
          }}
        >
          <div className="w-full h-full rounded-full bg-indigo-300 dark:bg-sky-200/40"></div>
        </div>
        
        <div 
          className={`w-32 h-32 rounded-full shadow-xl flex items-center justify-center z-10 transition-transform ease-in-out bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-cyan-500 dark:to-indigo-600`}
          style={{ 
            transform: `scale(${scale})`, 
            transitionDuration: `${duration}ms`
          }}
        >
          <span className="text-white font-medium tracking-widest uppercase text-sm drop-shadow-md animate-fade-in">
            {phaseText}
          </span>
        </div>
      </div>

      <button
        onClick={() => setActive(!active)}
        className="mt-20 px-8 py-3 rounded-full border border-indigo-400/50 text-indigo-500 hover:bg-indigo-500 hover:text-white dark:border-slate-400 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-all uppercase tracking-widest text-sm"
      >
        {active ? t.stop : t.start}
      </button>
    </div>
  );
};

// 3. Music Component
const MusicView = ({ t }: { t: any }) => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingId !== null) {
      const track = MUSIC_DATA.find(t => t.id === playingId);
      if (track && track.url) {
        audioRef.current = new Audio(track.url);
        audioRef.current.loop = true; 
        audioRef.current.play().catch(e => {
            console.error("Audio playback failed:", e);
            setPlayingId(null);
        });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [playingId]);

  const togglePlay = (id: number) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const RenderSection = ({ title, tracks }: { title: string, tracks: MusicTrack[] }) => (
    <div className="mb-8 w-full">
      <h3 className="text-lg font-medium mb-4 text-indigo-600 dark:text-indigo-400 border-b border-slate-300 dark:border-slate-700 pb-2">{title}</h3>
      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-day-text dark:text-night-text">{track.title}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{track.hzDescription}</span>
            </div>
            <button 
              onClick={() => togglePlay(track.id)}
              className={`p-2 rounded-full transition-all ${playingId === track.id 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-transparent text-indigo-500 dark:text-slate-400 border border-indigo-200 dark:border-slate-600'}`}
            >
              {playingId === track.id ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center h-full overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
      <div className="text-center mb-6 mt-2">
         <h2 className="text-2xl font-light text-day-text dark:text-night-text tracking-wide mb-1">{t.sectionMusic}</h2>
         <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">{t.descMusic}</p>
      </div>
      
      <div className="w-full max-w-md">
        <RenderSection title={t.categoryNature} tracks={MUSIC_DATA.filter(m => m.category === 'nature')} />
        <RenderSection title={t.categoryMelody} tracks={MUSIC_DATA.filter(m => m.category === 'melody')} />
      </div>
    </div>
  );
};

// 4. Chat View
interface ChatViewProps {
  t: any;
  name: string;
  intro: string;
  systemType: 'HIPNOS';
  language: Language;
}

const ChatView = ({ t, name, intro, language }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.onLine) {
       try {
        // Fix: Use process.env.API_KEY directly for initialization as per guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const newChat = createHipnosChat(ai, language);
        setChatSession(newChat);
        setMessages([{ id: 'init', role: 'model', text: intro, timestamp: Date.now() }]);
      } catch (error) {
        console.error(error);
      }
    } else {
       setMessages([{ id: 'offline', role: 'model', text: t.errorNoInternet, timestamp: Date.now() }]);
    }
  }, [language, intro, t.errorNoInternet]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (!navigator.onLine) {
      setMessages(prev => [...prev, { id: 'off', role: 'model', text: t.errorNoInternet, timestamp: Date.now() }]);
      return;
    }
    setLoading(true);
    try {
      // Fix: sendMessage returns a response where the text can be accessed via the .text property.
      const result = await chatSession.sendMessage({ message: userMsg.text });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: result.text || "", timestamp: Date.now() }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: t.errorGeneric, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto max-w-md">
      <div className="px-4 pt-4 pb-2 text-center border-b border-transparent">
        <h2 className="text-xl font-light text-day-text dark:text-night-text tracking-wide">{name}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">{t.descHipnos}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 scrollbar-hide space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white dark:bg-white/10 p-3 rounded-2xl rounded-tl-none flex space-x-2 items-center"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-transparent border-t border-slate-200/50 dark:border-white/5">
        <div className="flex items-center bg-white/50 dark:bg-slate-800/50 rounded-full px-4 py-2 border border-slate-300/50 dark:border-white/10 shadow-sm transition-all focus-within:ring-1 focus-within:ring-indigo-400/20">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t.chatPlaceholder} className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white text-sm" />
          <button onClick={handleSend} className="ml-2 text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-45"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg></button>
        </div>
      </div>
    </div>
  );
};

// 5. Tengu View
const TenguView = ({ t, language }: { t: any; language: Language }) => {
  const [dinnerTime, setDinnerTime] = useState('');
  const [bedTime, setBedTime] = useState('');
  const [habits, setHabits] = useState('');
  const [plan, setPlan] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);

  const handleSubmit = async () => {
    if (!dinnerTime || !bedTime || !habits) return; 
    
    setLoading(true);
    setInputError(false);
    
    try {
      // Fix: Use process.env.API_KEY directly to initialize the GoogleGenAI instance.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const isValid = await validateTenguInput(ai, habits);
      if (!isValid) {
        setInputError(true);
        setLoading(false);
        return;
      }
      const result = await generateTenguPlan(ai, language, dinnerTime, bedTime, habits);
      setPlan(result);
    } catch (e) {
      console.error(e);
      alert(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (plan) {
    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 overflow-y-auto pb-24 scrollbar-hide">
         <div className="mb-6 text-center">
            <h2 className="text-xl font-light text-day-text dark:text-night-text tracking-wide mb-2">{t.tenguResultTitle}</h2>
            <div className="w-16 h-1 bg-indigo-500 mx-auto rounded-full opacity-50"></div>
         </div>
         
         <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl bg-white/40 dark:bg-white/5 backdrop-blur-md">
           <table className="w-full text-left text-sm">
             <thead>
               <tr className="bg-slate-100 dark:bg-white/10 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                 <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{t.tenguColTime}</th>
                 <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{t.tenguColAction}</th>
                 <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{t.tenguColGoal}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-200 dark:divide-white/5">
               {plan.map((row, idx) => (
                 <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                   <td className="px-4 py-4 whitespace-nowrap font-medium text-indigo-600 dark:text-indigo-400">{row.time}</td>
                   <td className="px-4 py-4 text-day-text dark:text-night-text font-light">{row.action}</td>
                   <td className="px-4 py-4 italic text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{row.why}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>

         <button onClick={() => setPlan(null)} className="mt-8 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg transition-all transform hover:scale-[1.01]">
            {t.tenguBtnReset}
          </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto p-6 overflow-y-auto pb-24 scrollbar-hide">
      <div className="text-center mb-8">
        <h2 className="text-xl font-light text-day-text dark:text-night-text tracking-wide">Tengu</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">{t.descTengu}</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t.tenguLabelHabits}</label>
          <textarea 
            value={habits} 
            onChange={(e) => {
              setHabits(e.target.value);
              if(inputError) setInputError(false);
            }} 
            placeholder={t.tenguPlaceholderHabits} 
            rows={4} 
            className={`w-full p-4 rounded-xl bg-white dark:bg-slate-800/50 border ${inputError ? 'border-red-500 animate-pulse' : 'border-slate-200 dark:border-white/10'} text-day-text dark:text-white outline-none focus:border-indigo-500 transition-colors text-sm resize-none`} 
          />
          {inputError && <p className="mt-2 text-xs text-red-500 font-medium animate-fade-in">{t.tenguErrorInvalid}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t.tenguLabelDinner}</label>
            <input type="time" value={dinnerTime} onChange={(e) => setDinnerTime(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-day-text dark:text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t.tenguLabelBed}</label>
            <input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-day-text dark:text-white outline-none focus:border-indigo-500" />
          </div>
        </div>
        <button onClick={handleSubmit} disabled={loading || !dinnerTime || !bedTime || !habits} className={`w-full py-4 rounded-xl font-medium tracking-wide shadow-lg transition-all ${loading || !dinnerTime || !bedTime || !habits ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02]'}`}>
          {loading ? "..." : t.tenguBtnGenerate}
        </button>
      </div>
    </div>
  );
};

// 6. Settings View
const SettingsView = ({ t, language, setLanguage, theme, setTheme }: { t: any, language: Language, setLanguage: (l: Language) => void, theme: Theme, setTheme: (t: Theme) => void }) => (
  <div className="p-6 w-full max-w-md mx-auto space-y-8 overflow-y-auto pb-24 scrollbar-hide">
    <h2 className="text-2xl font-light text-day-text dark:text-night-text tracking-wide mb-1">{t.navSettings}</h2>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t.settingsLang}</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="w-full p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-day-text dark:text-night-text outline-none focus:border-indigo-500 appearance-none shadow-sm">
          <option value={Language.ES}>Español</option>
          <option value={Language.CA}>Català</option>
          <option value={Language.EN}>English</option>
          <option value={Language.FR}>Français</option>
          <option value={Language.DE}>Deutsch</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t.settingsTheme}</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className="w-full p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-day-text dark:text-night-text outline-none focus:border-indigo-500 appearance-none shadow-sm">
          <option value={Theme.DARK}>{t.themeDark}</option>
          <option value={Theme.LIGHT}>{t.themeLight}</option>
        </select>
      </div>
    </div>

    <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700/50">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
        <ClipboardIcon className="w-4 h-4 text-indigo-500" />
        {t.installTitle}
      </label>
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300">
           {t.installStepAndroid}
        </div>
        <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300">
           {t.installStepIOS}
        </div>
      </div>
    </div>

    <div className="space-y-2 pt-6 border-t border-slate-200 dark:border-slate-700/50">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t.settingsInfo}</label>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">{t.infoPlaceholder}</p>
    </div>
  </div>
);

// --- Main App ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>(View.BREATHING);
  const [language, setLanguage] = useState<Language>(Language.ES);
  const [theme, setTheme] = useState<Theme>(Theme.DARK);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.DARK) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} translations={t} />;

  const bgClass = theme === Theme.DARK ? "bg-night-900" : "bg-day-100";

  return (
    <div className={`h-screen w-full flex flex-col items-center justify-center transition-colors duration-500 ${bgClass}`}>
      {/* Container Principal: Actúa como marco del móvil en ordenadores */}
      <div className={`h-full w-full max-w-2xl flex flex-col relative overflow-hidden shadow-2xl ${theme === Theme.DARK ? 'bg-gradient-to-b from-night-800 to-night-900 text-night-text' : 'bg-day-100 text-day-text'}`}>
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {view === View.BREATHING && <BreathingView t={t} />}
          {view === View.MUSIC && <MusicView t={t} />}
          {view === View.HIPNOS && <ChatView t={t} name="Hipnos" intro={t.hipnosIntro} systemType="HIPNOS" language={language} />}
          {view === View.TENGU && <TenguView t={t} language={language} />}
          {view === View.SETTINGS && <SettingsView t={t} language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} />}
        </main>
        
        <nav className={`h-20 flex-shrink-0 flex justify-around items-center px-2 pb-2 backdrop-blur-lg border-t ${theme === Theme.DARK ? 'bg-night-900/95 border-white/5' : 'bg-white/95 border-slate-200'}`}>
          <NavButton active={view === View.BREATHING} onClick={() => setView(View.BREATHING)} icon={<WindIcon className="w-6 h-6" />} label={t.navBreathing} theme={theme} />
          <NavButton active={view === View.MUSIC} onClick={() => setView(View.MUSIC)} icon={<MusicIcon className="w-6 h-6" />} label={t.navMusic} theme={theme} />
          <NavButton active={view === View.HIPNOS} onClick={() => setView(View.HIPNOS)} icon={<MessageSquareIcon className="w-6 h-6" />} label={t.navHipnos} theme={theme} />
          <NavButton active={view === View.TENGU} onClick={() => setView(View.TENGU)} icon={<ClipboardIcon className="w-6 h-6" />} label={t.navTengu} theme={theme} />
          <NavButton active={view === View.SETTINGS} onClick={() => setView(View.SETTINGS)} icon={<SettingsIcon className="w-6 h-6" />} label={t.navSettings} theme={theme} />
        </nav>
      </div>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme: Theme }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${active ? (theme === Theme.DARK ? 'text-indigo-400' : 'text-indigo-600') : (theme === Theme.DARK ? 'text-slate-500' : 'text-slate-400')}`}>
    <div className={`mb-1 transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
    <span className="text-[10px] uppercase tracking-wide font-bold">{label}</span>
  </button>
);
