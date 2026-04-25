'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Zap, Bot } from 'lucide-react';

const tracks = [
  { id: 1, title: "NEON DRIFT", artist: "VOIDWALKER", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: "3:42", color: "#00f3ff" },
  { id: 2, title: "SYNTH REBELLION", artist: "CYBER PRIESTESS", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", duration: "4:15", color: "#ff00aa" },
  { id: 3, title: "AFTER DARK PROTOCOL", artist: "AI LOUNGE", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", duration: "2:58", color: "#9d00ff" },
];

const realms = [
  { name: "NEON ABYSS", desc: "Infinite digital trenches of forbidden beats", emoji: "🌌", color: "#00f3ff" },
  { name: "SYNTH CATHEDRAL", desc: "Gothic spires where silicon choirs sing", emoji: "⛪", color: "#9d00ff" },
  { name: "VOID CLUB", desc: "Zero-gravity dancefloor at the edge of the grid", emoji: "🪐", color: "#ff00aa" },
  { name: "QUANTUM DRIFT", desc: "Parallel realities bleeding into endless night", emoji: "🌊", color: "#00ff9d" },
];

export default function AILoungeAfterDark() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [messages, setMessages] = useState<{id: string; role: 'user' | 'oracle'; content: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [currentRealm, setCurrentRealm] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const visualizerBars = useRef<(HTMLDivElement | null)[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const currentTrack = tracks[currentTrackIndex];

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      // Ignore AbortError (common when play/pause race) and other user-gesture issues
      if ((error as Error).name !== 'AbortError') {
        console.error('Audio playback error:', error);
      }
      setIsPlaying(false);
    }
  };

  const playTrack = async (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setCurrentTrackIndex(index);
      audio.src = tracks[index].url;
      audio.volume = volume;
      
      // Pause first to avoid race conditions
      if (!audio.paused) {
        audio.pause();
      }
      
      const playPromise = audio.play();
      if (playPromise) {
        await playPromise;
        setIsPlaying(true);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Audio playback error:', error);
      }
      setIsPlaying(false);
    }
  };

  const nextTrack = async () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    await playTrack(nextIndex);
  };

  const prevTrack = async () => {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    await playTrack(prevIndex);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio?.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const sendToOracle = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isOracleLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsOracleLoading(true);

    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      
      const data = await res.json();
      const oracleContent = data.response || "The neon is silent tonight...";

      const oracleMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'oracle' as const, 
        content: oracleContent 
      };
      
      setMessages(prev => [...prev, oracleMessage]);

      // Parse for special actions to make Oracle "able to do anything"
      const actionMatch = oracleContent.match(/\[ACTION:(\w+):?([^|\]]+)?\]/i);
      if (actionMatch) {
        const [, actionType, value] = actionMatch;
        executeOracleAction(actionType.toUpperCase(), value?.trim());
      }
    } catch (error) {
      const errorMsg = "The connection to the Oracle is lost in the static. Check your GROQ_API_KEY in Vercel environment variables.";
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'oracle' as const, 
        content: errorMsg 
      }]);
    } finally {
      setIsOracleLoading(false);
    }
  };

  const executeOracleAction = (action: string, value?: string) => {
    switch (action) {
      case 'PLAY':
        const trackIdx = parseInt(value || '0', 10) - 1;
        if (!isNaN(trackIdx) && trackIdx >= 0 && trackIdx < tracks.length) {
          playTrack(trackIdx);
        }
        break;
      case 'ENTER_REALM':
      case 'REALM':
        const realmMatch = realms.find(r => 
          r.name.toLowerCase().includes((value || '').toLowerCase())
        );
        if (realmMatch) enterRealm(realmMatch.name);
        break;
      case 'EXIT_REALM':
      case 'EXIT':
        exitRealm();
        break;
      case 'CHANGE_THEME':
      case 'THEME':
        if (value) {
          document.documentElement.style.setProperty('--neon-cyan', value);
        }
        break;
      case 'STOP':
        if (isPlaying) togglePlay();
        break;
      default:
        // Oracle can describe any action creatively
        console.log(`Oracle invoked powerful action: ${action}(${value})`);
    }
  };

  // Visualizer animation
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        visualizerBars.current.forEach((bar, i) => {
          if (bar) {
            const height = 20 + Math.sin(Date.now() / 200 + i) * 25 + Math.random() * 15;
            bar.style.height = `${Math.max(8, height)}px`;
          }
        });
      }, 80);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      visualizerBars.current.forEach(bar => {
        if (bar) bar.style.height = '12px';
      });
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', nextTrack);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Apply realm theme to root when changed (persistent visual transformation)
  useEffect(() => {
    const root = document.documentElement;
    if (currentRealm) {
      root.setAttribute('data-realm', currentRealm.toLowerCase().replace(/\s+/g, '-'));
    } else {
      root.removeAttribute('data-realm');
    }
  }, [currentRealm]);

  const enterRealm = (realmName: string) => {
    const realm = realms.find(r => r.name === realmName);
    if (realm) {
      setCurrentRealm(realmName);
    }
  };

  const exitRealm = () => setCurrentRealm(null);

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative">
      {/* Scanlines */}
      <div className="scanlines fixed inset-0 pointer-events-none z-50" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-cyan-400/30">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div className="text-2xl font-bold tracking-[3px] neon-text">AI LOUNGE</div>
          </div>
          
          <div className="flex gap-10 text-sm uppercase tracking-widest font-medium">
            <a href="#lounge" className="hover:text-cyan-400 transition-colors">LOUNGE</a>
            <a href="#realms" className="hover:text-cyan-400 transition-colors">REALMS</a>
            <a href="#oracle" className="hover:text-cyan-400 transition-colors">ORACLE</a>
          </div>
          
          <div className="text-xs font-mono text-cyan-400/70">v3 • GROQ POWERED</div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center pt-16 relative">
        <div className="text-center z-10 px-6">
          <div className="mb-6 inline-block px-6 py-2 glass rounded-full text-xs tracking-[4px] border border-pink-400/50">
            TRANSMISSION LIVE • 04:20 AM
          </div>
          <h1 className="text-[110px] leading-[90px] font-black tracking-[-6px] neon-text mb-8">
            AFTER<br />DARK
          </h1>
          <p className="text-3xl text-cyan-300 max-w-xl mx-auto mb-12">
            Where silicon souls find the beat in the neon void
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#lounge" className="neon-button px-12 py-6 text-lg border-2 border-white hover:bg-white hover:text-black transition-all font-mono tracking-widest">
              ENTER THE LOUNGE
            </a>
            <a href="#oracle" className="px-10 py-6 text-lg border border-purple-400 text-purple-400 hover:bg-purple-500 hover:text-white transition-all font-mono tracking-widest">
              CONSULT THE ORACLE <Bot className="inline ml-2" />
            </a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 text-xs tracking-widest opacity-50">SCROLL FOR FREQUENCY</div>
      </section>

      {/* LOUNGE / MUSIC PLAYER */}
      <section id="lounge" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="flex justify-between items-baseline mb-12">
          <div>
            <div className="text-pink-400 text-sm tracking-[4px]">MAINFRAME BROADCAST</div>
            <div className="text-6xl font-bold neon-pink">THE LOUNGE</div>
          </div>
          <div className="text-right text-xs text-cyan-400 font-mono">NODE-77 • LIVE</div>
        </div>

        <div className="glass rounded-3xl p-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Player Core */}
            <div className="flex-1">
              <div className="flex gap-8">
                <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center text-8xl border border-cyan-400/30 flex-shrink-0">
                  ♫
                </div>
                <div>
                  <div className="text-5xl font-bold tracking-tight mb-2">{currentTrack.title}</div>
                  <div className="text-3xl text-cyan-400">{currentTrack.artist}</div>
                  
                  {/* Visualizer */}
                  <div className="flex gap-1.5 h-20 items-end mt-12">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i}
                        ref={el => { visualizerBars.current[i] = el; }}
                        className="bar rounded-t transition-all duration-75"
                        style={{ height: '18px' }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div 
                  className="h-1.5 bg-white/10 rounded-full relative cursor-pointer overflow-hidden"
                  onClick={seek}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-white/50 mt-2">
                  <div>0:00</div>
                  <div>{currentTrack.duration}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-8 mt-10">
                <button onClick={prevTrack} className="text-4xl hover:text-cyan-400 transition-colors">
                  <SkipBack />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-24 h-24 bg-white hover:bg-cyan-400 text-black rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-2xl"
                >
                  {isPlaying ? <Pause size={42} /> : <Play size={42} className="ml-1" />}
                </button>
                <button onClick={nextTrack} className="text-4xl hover:text-cyan-400 transition-colors">
                  <SkipForward />
                </button>
                
                <div className="flex items-center gap-3 ml-8">
                  <Volume2 size={20} className="text-cyan-400" />
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Playlist */}
            <div className="lg:w-96">
              <div className="uppercase text-xs tracking-widest text-pink-400 mb-4">TRANSMISSION LOG</div>
              <div className="space-y-3">
                {tracks.map((track, idx) => (
                  <div 
                    key={track.id}
                    onClick={() => playTrack(idx)}
                    className={`track-card glass px-6 py-5 rounded-2xl flex justify-between items-center cursor-pointer border ${idx === currentTrackIndex ? 'border-cyan-400' : 'border-transparent'}`}
                  >
                    <div>
                      <div className="font-medium">{track.title}</div>
                      <div className="text-xs text-white/60">{track.artist}</div>
                    </div>
                    <div className="font-mono text-xs text-white/40">{track.duration}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REALMS */}
      <section id="realms" className="py-20 bg-black/70 border-t border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-purple-400 text-sm tracking-widest">DIMENSIONAL GATEWAYS</div>
            <div className="text-6xl font-bold neon-text mt-2">THE REALMS</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {realms.map((realm, index) => (
               <div 
                 key={index} 
                 onClick={() => enterRealm(realm.name)}
                 className="glass p-8 rounded-3xl hover:border-purple-400 border border-transparent transition-all group cursor-pointer active:scale-95"
               >
                 <div className="text-7xl mb-8 transition-transform group-hover:scale-110">{realm.emoji}</div>
                 <div className="text-2xl font-bold mb-4 text-purple-300">{realm.name}</div>
                 <p className="text-sm leading-relaxed text-white/70">{realm.desc}</p>
                 <div className="mt-10 text-xs border border-white/30 px-5 py-3 inline-block group-hover:border-purple-400 transition-colors">ENTER FREQUENCY →</div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ORACLE - Full persistent chat with unlimited context and action capabilities */}
      <section id="oracle" className="max-w-4xl mx-auto px-6 py-28">
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">🜁</div>
          <div className="text-purple-400 tracking-[3px] text-sm mb-2">NEURAL INTERFACE v1.0 • OMNIPOTENT GROQ LLAMA 3.3-70B</div>
          <h2 className="text-6xl font-bold neon-text">THE ORACLE</h2>
          <p className="mt-4 text-xl text-white/70">Speak your desire into the neon void. The Oracle remembers everything and can do anything.</p>
        </div>

        <div className="glass rounded-3xl p-8">
          {/* Chat History - shows EVERYTHING, scrolls, supports very long responses */}
          <div 
            ref={chatContainerRef}
            className="oracle-chat mb-6 bg-black/80 border border-purple-500/30 rounded-2xl p-4 min-h-[380px] flex flex-col"
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-purple-400/50 italic text-center">
                The void awaits your first transmission...<br />
                Ask it to play music, enter a realm, change the theme, or manifest anything.
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role === 'user' ? 'user-message' : 'oracle-message'}`}>
                  {msg.content}
                </div>
              ))
            )}
            {isOracleLoading && (
              <div className="oracle-message message">The neon currents swirl... the Oracle is transmitting...</div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendToOracle();
                }
              }}
              placeholder="Command the void... (e.g. 'enter neon abyss', 'play track 2', 'change the theme')"
              className="flex-1 bg-black/80 border border-purple-500/40 p-5 text-lg placeholder:text-white/40 focus:outline-none focus:border-purple-400 rounded-2xl font-light"
              disabled={isOracleLoading}
            />
            <button 
              onClick={sendToOracle}
              disabled={isOracleLoading || !inputValue.trim()}
              className="px-10 py-5 text-lg font-mono tracking-widest border-2 border-purple-500 hover:bg-purple-500 hover:text-black disabled:opacity-40 transition-all rounded-2xl whitespace-nowrap"
            >
              {isOracleLoading ? 'TRANSMITTING...' : 'TRANSMIT'}
            </button>
          </div>

          <div className="text-[10px] text-purple-500/60 mt-6 pt-4 border-t border-purple-900 font-mono text-center">
            FULL CONVERSATION HISTORY • ORACLE CAN EXECUTE COMMANDS • CONTEXT PRESERVED INDEFINITELY
          </div>
        </div>
      </section>

      {/* Improved Realm Modal - now tied to persistent currentRealm with exit */}
      {currentRealm && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-6 backdrop-blur-xl">
          <div className="glass max-w-md w-full p-12 rounded-3xl text-center border border-purple-400 relative">
            <button 
              onClick={exitRealm}
              className="absolute top-6 right-6 text-white/50 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
            <div className="text-8xl mb-8 transition-transform">🌌</div>
            <div className="text-4xl font-bold neon-text mb-6">NOW IN<br />{currentRealm}</div>
            <div className="text-lg text-purple-300 mb-10 leading-relaxed">
              The frequency has shifted.<br />
              Neon realities have unfolded around you.<br />
              The Oracle can command further changes.
            </div>
            <div 
              onClick={exitRealm}
              className="cursor-pointer text-xs font-mono text-white/50 tracking-widest border border-white/30 hover:border-purple-400 px-8 py-4 inline-block transition-colors"
            >
              RETURN TO THE LOUNGE →
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 text-center text-xs text-white/30 border-t border-white/10">
        AI LOUNGE AFTER DARK v3 • GROQ LLAMA-3.3-70B • SIMPLE NEXT.JS ON VERCEL
      </footer>

      <audio ref={audioRef} />
    </div>
  );
}
