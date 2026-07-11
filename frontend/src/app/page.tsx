'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Family Profile Data matching Stitch screen categories
const PROFILES = [
  { id: 'parent', name: 'Parent', role: 'Devi & Srinivas (Admin)', avatarBg: '#ffb4a5', icon: 'person' },
  { id: 'child', name: 'Child', role: 'Ananya (Age 8)', avatarBg: '#d6e7a1', icon: 'child_care' },
  { id: 'grandpa', name: 'Grandpa', role: 'Elder', avatarBg: '#f1e1be', icon: 'elderly' }
];

// Screen options matching the 8 Stitch mockups
const SCREENS = [
  { id: 'dashboard', name: 'Dashboard', icon: 'home', desc: 'Household overview' },
  { id: 'logistics', name: 'Logistics & Schedule', icon: 'calendar_month', desc: 'Conflict resolver & timeline' },
  { id: 'health', name: 'Health & Inventory', icon: 'eco', desc: 'Telemetry & pantry tracking' },
  { id: 'child_mode', name: 'Child Mode', icon: 'lightbulb', desc: 'Wisdom & storytelling' },
  { id: 'legacy_vault', name: 'Legacy Vault', icon: 'history', desc: 'Family journals & memories' },
  { id: 'settings', name: 'Settings Hub', icon: 'settings', desc: 'Agent & GCP parameters' },
  { id: 'faq', name: 'FAQ & Support', icon: 'help_outline', desc: 'System FAQ logs' },
  { id: 'about', name: 'About & Mission', icon: 'info', desc: 'Philosophy & design' }
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

// WebGL sound-reactive pulsing orb from Stitch design
const WebGLShaderOrb = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
          float dist = length(uv);
          float glow = 0.05 / (dist + 0.1);
          float pulse = sin(u_time * 3.0) * 0.1 + 0.9;
          float orb = smoothstep(0.4 * pulse, 0.38 * pulse, dist);
          vec3 col1 = vec3(0.88, 0.45, 0.36); // Terracotta
          vec3 col2 = vec3(0.55, 0.65, 0.55); // Sage
          vec3 col3 = vec3(0.95, 0.88, 0.75); // Sand
          vec3 finalCol = mix(col1, col2, sin(u_time + uv.x * 2.0) * 0.5 + 0.5);
          finalCol = mix(finalCol, col3, cos(u_time + uv.y * 3.0) * 0.5 + 0.5);
          gl_FragColor = vec4(finalCol * orb + finalCol * glow, orb + glow * 0.5);
      }
    `;

    const sVal = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram();
    if (!prog) return;
    const vShader = sVal(gl.VERTEX_SHADER, vs);
    const fShader = sVal(gl.FRAGMENT_SHADER, fs);
    if (!vShader || !fShader) return;

    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let animationId: number;

    const resize = () => {
      const w = canvas.clientWidth || 256;
      const h = canvas.clientHeight || 256;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const render = (time: number) => {
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, time * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      gl.deleteProgram(prog);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block rounded-full" />;
};

export default function Home() {
  const [activeProfile, setActiveProfile] = useState(PROFILES[0]);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [activeAgent, setActiveAgent] = useState({ name: 'Coordinator', state: 'idle', message: 'Ready' });
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('Listening for voice commands...');
  const [loading, setLoading] = useState(false);

  // Settings states
  const [gcpProject, setGcpProject] = useState('omnihearth-project');
  const [gcpRegion, setGcpRegion] = useState('us-central1');
  const [emulatorMode, setEmulatorMode] = useState(true);

  // System logs stream
  const [agentLogs, setAgentLogs] = useState<Array<{ time: string; msg: string; level: string }>>([]);

  // Real-time memory graph state
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: any[] }>({ 
    nodes: [
      { id: 'event_piano', label: 'Event', properties: { title: 'Piano Class', time: '16:00', member: 'Ananya', status: 'Confirmed' } },
      { id: 'event_dentist', label: 'Event', properties: { title: 'Dentist Appointment', time: '16:30', member: 'Mother', status: 'Confirmed' } }
    ], 
    edges: [] 
  });

  // Dark Mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Client logs mount effect
  useEffect(() => {
    setAgentLogs([
      { time: new Date().toLocaleTimeString(), msg: 'OmniHearth Household OS Hydrated.', level: 'success' },
      { time: new Date().toLocaleTimeString(), msg: 'Stitch design layout tokens successfully ingested.', level: 'info' }
    ]);
  }, []);

  // SSE Subscription setup
  useEffect(() => {
    const sse = new EventSource(`${API_BASE}/v1/events`);
    
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const time = new Date().toLocaleTimeString();
        
        if (data.type === 'connection_established') {
          setAgentLogs(prev => [...prev, { time, msg: 'SSE stream connected successfully.', level: 'success' }]);
          if (data.graph && data.graph.nodes && data.graph.nodes.length > 0) {
            setGraph(data.graph);
          }
        } else if (data.type === 'heartbeat') {
          // Heartbeat keepalive
        } else if (data.type === 'agent_state') {
          setActiveAgent({ name: data.agent, state: data.state, message: data.message });
          let level = 'info';
          if (data.state === 'error') level = 'error';
          if (data.state === 'done') level = 'success';
          setAgentLogs(prev => [...prev, { time, msg: `[${data.agent}] ${data.message}`, level }]);
        } else if (data.type === 'graph_update') {
          if (data.graph) setGraph(data.graph);
          setAgentLogs(prev => [...prev, { time, msg: 'Memory graph updated by autonomous agent.', level: 'success' }]);
        }
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    sse.onerror = () => {
      const time = new Date().toLocaleTimeString();
      setAgentLogs(prev => [...prev, { time, msg: 'SSE server connection lost. Retrying...', level: 'warning' }]);
    };

    return () => {
      sse.close();
    };
  }, []);

  // Trigger Simulator Actions
  const handleTriggerEvent = async (eventType: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    const time = new Date().toLocaleTimeString();
    setAgentLogs(prev => [...prev, { time, msg: `Manual trigger dispatched: ${eventType}`, level: 'info' }]);
    
    try {
      const res = await fetch(`${API_BASE}/v1/events/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType, payload })
      });
      
      if (!res.ok) throw new Error('API server returned error code');
    } catch (err: any) {
      setAgentLogs(prev => [...prev, { time, msg: `Agent trigger failed: ${err.message}`, level: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Voice Modal
  const toggleVoice = () => {
    setVoiceActive(!voiceActive);
    if (!voiceActive) {
      setVoiceText('Listening for voice commands...');
      setTimeout(() => {
        setVoiceText('Recognized command: "Set Bedtime Routine for Ananya"');
        setTimeout(() => {
          setVoiceActive(false);
          handleTriggerEvent('screentime_exceeded', { member: 'ananya', screentime_minutes: 130, detox_quota_minutes: 120 });
        }, 1500);
      }, 2000);
    }
  };

  // Auto-route helper when selecting family profile
  const handleProfileSelect = (profile: typeof PROFILES[0]) => {
    setActiveProfile(profile);
    if (profile.id === 'child') {
      setCurrentScreen('child_mode');
    } else if (profile.id === 'grandpa') {
      setCurrentScreen('legacy_vault');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  // Extract variables
  const schedule = graph.nodes.filter(n => n.label === 'Event');
  const hasConflict = schedule.length > 1 && schedule[0].properties?.time === schedule[1].properties?.time;

  return (
    <div className="flex h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden select-none transition-colors duration-300 font-sans">
      
      {/* 1. TopAppBar (Google Stitch replica header) */}
      <header className="fixed top-0 left-0 w-full h-20 z-40 flex justify-between items-center px-10 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)]/40 shadow-sm transition-colors duration-300">
        <div className="text-xl font-bold tracking-tight text-[var(--accent-primary)] font-display flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] inline-block animate-pulse"></span>
          The Hearth
        </div>
        
        {/* Agent Activity Pipeline indicators */}
        <div className="hidden md:flex items-center space-x-6">
          {['Logistics', 'Vitality', 'Guardian', 'Scholar'].map((agentName) => {
            const isCurrent = activeAgent.name.toLowerCase().includes(agentName.toLowerCase());
            const isDone = activeAgent.state === 'done' && isCurrent;
            const isError = activeAgent.state === 'error' && isCurrent;
            const isActive = activeAgent.state === 'active' && isCurrent;

            return (
              <div key={agentName} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone ? 'bg-[#d6e7a1] text-[#56642b] shadow-inner' :
                  isError ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                  isActive ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] animate-pulse ring-2 ring-[var(--accent-primary)]' :
                  'bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)] neumorphic-pressed'
                }`}>
                  {agentName[0]}
                </div>
                <span className={`text-[11px] font-bold tracking-wide ${isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]/50'}`}>
                  {agentName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--bg-canvas)] neumorphic-card hover:scale-105 transition-all text-[var(--accent-primary)] border border-[var(--border-subtle)]/20"
            aria-label="Toggle Dark Mode"
          >
            <span className="material-symbols-outlined text-xl">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>

          {/* Voice Assistant Mic */}
          <button 
            onClick={toggleVoice}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--bg-canvas)] neumorphic-card hover:scale-105 transition-all text-[var(--accent-primary)] border border-[var(--border-subtle)]/20"
            aria-label="Toggle Voice Control"
          >
            <span className="material-symbols-outlined text-2xl">mic</span>
          </button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden neumorphic-card flex items-center justify-center bg-[var(--bg-container)] border border-[var(--border-subtle)]/20">
            <span className="material-symbols-outlined text-2xl text-[var(--text-muted)]">account_circle</span>
          </div>
        </div>
      </header>

      {/* 2. SideNavBar (Navigation System matching Stitch screens) */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-[var(--bg-canvas)] border-r border-[var(--border-subtle)]/40 flex flex-col p-6 gap-y-4 pt-24 hidden lg:flex z-30 transition-colors duration-300">
        
        {/* Family Profiles switchers */}
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]/70 mb-2">Family</h3>
          <div className="flex gap-2">
            {PROFILES.map(p => {
              const active = activeProfile.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProfileSelect(p)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    active ? 'ring-2 ring-[var(--accent-primary)] scale-105' : 'opacity-65 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: p.avatarBg, color: '#000' }}
                  title={`${p.name} Profile`}
                >
                  <span className="material-symbols-outlined text-xl">{p.icon}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs font-semibold text-[var(--text-primary)]">
            Active View: <span className="text-[var(--accent-primary)]">{activeProfile.role}</span>
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)]/45 my-2"></div>

        {/* Feature Screen list navigation */}
        <div className="flex-1 space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]/70 mb-2">Systems</h3>
          {SCREENS.map((screen) => {
            const isSelected = currentScreen === screen.id;

            return (
              <button
                key={screen.id}
                onClick={() => setCurrentScreen(screen.id)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-[20px] text-left transition-all ${
                  isSelected 
                    ? 'neumorphic-inset border border-[var(--border-subtle)]/20 text-[var(--accent-primary)] font-bold translate-y-px shadow-inner' 
                    : 'text-[var(--text-muted)] hover:translate-x-1 hover:text-[var(--text-primary)]'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]/80'}`}>
                  {screen.icon}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{screen.name}</div>
                  <div className="text-xs font-normal text-[var(--text-muted)]/60 leading-none">{screen.desc}</div>
                </div>
                {isSelected && <span className="material-symbols-outlined text-sm text-[var(--accent-primary)]">chevron_right</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Main Stage Content Container */}
      <main className="flex-1 pt-24 pb-16 lg:ml-64 px-10 overflow-y-auto h-full flex flex-col space-y-6 bg-[var(--bg-canvas)] transition-colors duration-300">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-1 flex flex-col space-y-6"
          >

            {/* SCREEN 1: PRIMARY DASHBOARD */}
            {currentScreen === 'dashboard' && (
              <>
                {/* Hero Right Now Panel */}
                <section className="relative mt-2">
                  <div className="neumorphic-card rounded-lg overflow-hidden p-8 md:p-12 min-h-[320px] flex flex-col justify-center relative group border border-[var(--border-subtle)]/10">
                    {/* Background Pulse */}
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                      <div className="w-full h-full bg-[var(--accent-primary)] rounded-full blur-[100px] animate-pulse-soft"></div>
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3 text-[var(--accent-primary)] uppercase tracking-widest font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping"></span>
                        Right Now
                      </div>
                      <h1 className="font-display text-3xl md:text-4xl text-[var(--text-primary)] max-w-2xl">
                        Dinner prep in 30 mins
                      </h1>
                      <p className="font-body text-sm text-[var(--text-muted)] max-w-lg">
                        Oven preheating requested. We have all the ingredients for the Lemon Herb Roasted Chicken.
                      </p>
                      <div className="pt-4 flex flex-wrap gap-4">
                        <button 
                          onClick={() => handleTriggerEvent('calendar_conflict_detected')} 
                          className="neumorphic-button-primary text-white font-bold py-4 px-8 rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          <span>View Recipe</span>
                          <span className="material-symbols-outlined text-lg">restaurant_menu</span>
                        </button>
                        <button className="neumorphic-card font-bold py-4 px-8 rounded-full text-[var(--text-muted)] hover:scale-105 transition-transform border border-[var(--border-subtle)]/10">
                          Dismiss
                        </button>
                      </div>
                    </div>
                    {/* Abstract Decorative Image from Stitch design */}
                    <div className="absolute right-0 bottom-0 md:right-12 md:top-12 hidden lg:block w-72 h-72">
                      <img 
                        className="w-full h-full object-cover rounded-xl shadow-lg transform rotate-3 border border-[var(--border-subtle)]/20" 
                        alt="A warm, inviting kitchen scene captured in a high-end photography style." 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoZSXAfVZBoY-7BiAcCeY7LMXqdNbjYJhOm1axCp-BlawA8Xl1zC2kythXoPn7VlnR3_cnt_pVHjTfvptZaomnpi0mN-D5OUhXnEkyfOUneNJMJuo85Oz4uRKc3oSHP-kp4KZT_P4T_sqt9NiDKhLS56hKRI6-SgSYeN1odIC1rtFjbgTks4nxKpZCeTQoIMIG9ryWrLpu_by1acGID5-HxRS6QHDgMndHCTeDy40h1BO9mGceLjkCmg"
                      />
                    </div>
                  </div>
                </section>

                {/* Dashboard Grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  
                  {/* Timeline widget */}
                  <div className="neumorphic-card rounded-lg p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-headline-md text-[var(--accent-primary)] font-display">Logistics</h3>
                      <span className="material-symbols-outlined text-[var(--text-muted)]">schedule</span>
                    </div>
                    <div className="space-y-6 relative border-l-2 border-[var(--border-subtle)]/40 ml-3 pl-6">
                      {schedule.map((item, idx) => {
                        const isConflict = hasConflict && idx === 1;
                        return (
                          <div key={idx} className="relative group text-xs">
                            <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-[var(--bg-canvas)] shadow-md ${
                              isConflict ? 'bg-[#ba1a1a] animate-pulse' : 'bg-[var(--accent-secondary)]'
                            }`} />
                            <p className={`font-bold ${isConflict ? 'text-[#ba1a1a]' : 'text-[var(--accent-secondary)]'}`}>{item.properties?.time} PM</p>
                            <h4 className="font-bold text-[var(--text-primary)]">{item.properties?.title}</h4>
                            <p className="text-[10px] text-[var(--text-muted)]">{item.properties?.member} • {item.properties?.status}</p>
                          </div>
                        );
                      })}
                    </div>
                    {hasConflict && (
                      <button 
                        onClick={() => handleTriggerEvent('calendar_conflict_detected')} 
                        className="w-full py-3 neumorphic-button-primary text-white rounded-lg text-xs font-bold active:scale-95 transition-all"
                      >
                        Resolve Conflict
                      </button>
                    )}
                  </div>

                  {/* Health Progress widget */}
                  <div className="neumorphic-card rounded-lg p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-headline-md text-[var(--accent-secondary)] font-display">Health &amp; Pantry</h3>
                      <span className="material-symbols-outlined text-[var(--accent-secondary)]">eco</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle className="text-[var(--border-subtle)]/20" cx="40" cy="40" fill="transparent" r="32" stroke="currentColor" strokeWidth="6"></circle>
                          <circle className="text-[var(--accent-secondary)]" cx="40" cy="40" fill="transparent" r="32" stroke="currentColor" strokeDasharray="201" strokeDashoffset={50} strokeWidth="6"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="font-bold text-sm text-[var(--text-primary)]">75%</span>
                          <span className="text-[8px] uppercase font-bold text-[var(--text-muted)]">Daily</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--text-primary)]">Household Energy</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Saving 12% vs last week.</p>
                      </div>
                    </div>
                    <div className="neumorphic-inset rounded-lg p-4 space-y-3 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-primary)] font-medium">Oat Milk (Running Low)</span>
                        <span className="material-symbols-outlined text-[#ba1a1a] text-lg">warning</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-primary)] font-medium">Avocados (Out of stock)</span>
                        <span className="text-[9px] px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded-full font-bold">Alert</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleTriggerEvent('wearable_telemetry_sync')}
                      className="w-full py-4 neumorphic-card text-[var(--accent-secondary)] font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">shopping_cart</span>
                      Auto-Order
                    </button>
                  </div>

                  {/* Quick Appliance Switches */}
                  <div className="neumorphic-card rounded-lg p-6 flex flex-col gap-4">
                    <h3 className="font-headline-md text-headline-md text-[var(--text-primary)] font-display">Quick-Tap</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <button onClick={() => handleTriggerEvent('brew_espresso')} className="flex flex-col items-center justify-center p-4 neumorphic-card rounded-xl text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">
                        <span className="material-symbols-outlined text-3xl mb-2">coffee</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight">Brew Espresso</span>
                      </button>
                      <button onClick={() => handleTriggerEvent('vacuum_hall')} className="flex flex-col items-center justify-center p-4 neumorphic-card rounded-xl text-[var(--text-primary)] hover:text-[var(--accent-secondary)] transition-colors">
                        <span className="material-symbols-outlined text-3xl mb-2">vacuum</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight">Clean Hall</span>
                      </button>
                    </div>
                  </div>

                </div>
              </>
            )}

            {/* SCREEN 2: LOGISTICS DETAILS */}
            {currentScreen === 'logistics' && (
              <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--accent-primary)] font-display">Logistics Scheduler</h2>
                    <p className="text-xs text-[var(--text-muted)]">Calendar synchronizer and conflict resolving engine</p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-[var(--accent-primary)]">calendar_month</span>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                    <div key={day} className={`p-3 rounded-[16px] ${i === 2 ? 'neumorphic-inset border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold' : 'neumorphic-card'}`}>
                      <div>{day}</div>
                      <div className="text-[10px] font-normal text-[var(--text-muted)]/60">12/Jul</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Timeline Logs</h3>
                  <div className="space-y-3">
                    {schedule.map((item, idx) => {
                      const isOverlap = hasConflict && idx === 1;
                      return (
                        <div key={idx} className={`p-4 rounded-[24px] neumorphic-card border flex items-center justify-between transition-all ${
                          isOverlap ? 'border-[#ba1a1a]/30 bg-[#ffdad6]/10' : 'border-[var(--border-subtle)]/10'
                        }`}>
                          <div className="flex gap-4 items-center">
                            <div className="p-2.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)]/20 shadow-inner text-[var(--accent-secondary)]">
                              <span className="material-symbols-outlined text-lg">schedule</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[var(--text-primary)]">{item.properties?.title}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">{item.properties?.member} • {item.properties?.time} PM</p>
                            </div>
                          </div>
                          <div>
                            {isOverlap ? (
                              <span className="text-[9px] font-bold uppercase tracking-wide bg-[#ffdad6] text-[#ba1a1a] px-3 py-1 rounded-full animate-pulse">Overlap Conflict</span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wide bg-[#d6e7a1]/60 text-[#56642b] px-3 py-1 rounded-full">Ok</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {hasConflict && (
                  <div className="p-5 rounded-[24px] bg-[#ffdad6]/20 border border-[#ffb4a5]/40 text-xs leading-relaxed space-y-3 text-[var(--text-primary)]">
                    <p className="font-semibold text-[#ba1a1a]">LogisticsAgent Conflict Detected:</p>
                    <p className="text-[var(--text-muted)]">Dentist Appointment at 16:30 overlaps with Piano Class at 16:00. Suggested resolution: Reschedule Piano Class to 17:30.</p>
                    <button 
                      onClick={() => handleTriggerEvent('calendar_conflict_detected', { piano: '17:30', dentist: '16:30' })} 
                      className="neumorphic-button-primary w-full py-2.5"
                    >
                      Apply Resolution
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN 3: HEALTH & INVENTORY DETAILS */}
            {currentScreen === 'health' && (
              <div className="space-y-6">
                <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--accent-secondary)] font-display">Health &amp; Telemetry</h2>
                      <p className="text-xs text-[var(--text-muted)]">Active wearables data and body diagnostic charts</p>
                    </div>
                    <span className="material-symbols-outlined text-3xl text-[var(--accent-secondary)]">eco</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-[24px] neumorphic-card border border-[var(--border-subtle)]/10 text-center">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Sleep Average</p>
                      <p className="text-lg font-bold text-[var(--accent-secondary)] mt-1">7.4 hrs</p>
                      <p className="text-[9px] text-[var(--text-muted)]/70">85% efficiency score</p>
                    </div>
                    <div className="p-4 rounded-[24px] neumorphic-card border border-[var(--border-subtle)]/10 text-center">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Active Energy</p>
                      <p className="text-lg font-bold text-[var(--accent-primary)] mt-1">450 kcal</p>
                      <p className="text-[9px] text-[var(--text-muted)]/70">+12% vs yesterday</p>
                    </div>
                    <div className="p-4 rounded-[24px] neumorphic-card border border-[var(--border-subtle)]/10 text-center">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Avg Heart Rate</p>
                      <p className="text-lg font-bold text-[var(--text-primary)] mt-1">72 bpm</p>
                      <p className="text-[9px] text-[var(--text-muted)]/70">Normal resting rhythm</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-display">Pantry Stock &amp; Logistics</h3>
                    <span className="material-symbols-outlined text-lg text-[var(--text-muted)]">shopping_cart</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3.5 rounded-[18px] neumorphic-inset">
                      <span className="font-semibold text-[var(--text-primary)]">Organic Oat Milk</span>
                      <span className="px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] font-bold text-[9px] rounded-full">Out of Stock</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-[18px] neumorphic-card border border-[var(--border-subtle)]/10">
                      <span className="text-[var(--text-primary)]">Whole Oats</span>
                      <span className="text-[10px] text-[var(--text-muted)]">2.5 kg</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleTriggerEvent('wearable_telemetry_sync')}
                    className="w-full py-3.5 neumorphic-button-primary text-xs font-bold"
                  >
                    Sync Pantry Wearables Telemetry
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 4: CHILD MODE */}
            {currentScreen === 'child_mode' && (
              <div className="space-y-6">
                <div className="neumorphic-card rounded-lg overflow-hidden flex flex-col md:flex-row">
                  {/* Styled educational illustration from Stitch design */}
                  <div 
                    className="h-40 md:h-auto md:w-1/3 bg-cover bg-center min-h-[160px]" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDEh_3Ls8uAl7jfI1bH6gg9qkBTAx-1MvJXz6DCIsvLfeVCblqeqBPEF7jmUYEBtxnw8q9Hhh8te83We21fuY-WXV8Xn3xZ98pmlvXN4D4a3RgPQPnaI0cl5JRTfCWq_dPA-YJwrHrJ3n97mt7hF5K4DtMF9kTxS8LBptbGl3_-hOowxRK0Fs9CBqxs-GJlgsGTMuIEbIDQs2xkPOzP7Gmy7rtvEXTz7dtyhV6I8sLRVsXiB4wiEen9Sw')" }}
                  />
                  <div className="p-6 md:p-8 flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-headline-md text-tertiary text-[var(--accent-tertiary)]">Wisdom &amp; Play</h3>
                      <span className="material-symbols-outlined text-3xl text-[var(--accent-tertiary)]">lightbulb</span>
                    </div>
                    <p className="font-bold text-[var(--text-primary)] text-sm">Tonight's 10-minute Science Project</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">Activity: Create a cloud in a jar and learn about the Water Cycle.</p>
                    <button 
                      onClick={() => handleTriggerEvent('quest_narrative_request')} 
                      className="w-full py-4 bg-[var(--accent-tertiary)] text-white font-bold rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">play_circle</span>
                      Start Quest
                    </button>
                  </div>
                </div>

                {/* Storyteller Control */}
                <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-display">Sangam Literature Narrator</h3>
                    <span className="material-symbols-outlined text-lg text-[var(--accent-secondary)]">book</span>
                  </div>
                  
                  <div className="p-5 rounded-[24px] neumorphic-inset text-xs space-y-4">
                    <p className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">
                      "King Pari did not hesitate. He dismounted his gold-plated chariot, leaving it beside the jasmine climber so the weak vine could crawl onto it for support..."
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleTriggerEvent('quest_narrative_request')} className="px-4 py-2 rounded-full text-[10px] font-bold neumorphic-card border border-[var(--border-subtle)]/10 text-[var(--text-primary)]">Narrate Another</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 5: LEGACY VAULT */}
            {currentScreen === 'legacy_vault' && (
              <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--accent-tertiary)] font-display">Legacy Vault</h2>
                    <p className="text-xs text-[var(--text-muted)]">Family memory journals, photo archives, and timeline milestones</p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-[var(--accent-tertiary)]">history</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-[24px] neumorphic-card border border-[var(--border-subtle)]/10 space-y-2">
                    <div className="w-full h-24 bg-[#ccdce9]/25 rounded-[18px] flex items-center justify-center border border-[var(--border-subtle)]/10 text-[var(--text-muted)]">
                      <span className="material-symbols-outlined text-3xl">auto_stories</span>
                    </div>
                    <p className="font-bold text-[var(--text-primary)] text-center">Grandpa's Memoir Log</p>
                    <p className="text-[10px] text-[var(--text-muted)] text-center">Created 3 days ago</p>
                  </div>
                  <div className="p-4 rounded-[24px] neumorphic-card border border-[var(--border-subtle)]/10 space-y-2">
                    <div className="w-full h-24 bg-[#ccdce9]/25 rounded-[18px] flex items-center justify-center border border-[var(--border-subtle)]/10 text-[var(--text-muted)]">
                      <span className="material-symbols-outlined text-3xl">photo_album</span>
                    </div>
                    <p className="font-bold text-[var(--text-primary)] text-center">Ananya's First Piano Class</p>
                    <p className="text-[10px] text-[var(--text-muted)] text-center">Created 1 week ago</p>
                  </div>
                </div>

                <div className="p-4 rounded-[24px] neumorphic-inset text-xs space-y-3">
                  <h3 className="font-bold text-[var(--text-primary)]">Add Milestone Memory</h3>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Title of the memory..." className="flex-1 p-3 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)]/30 text-xs text-[var(--text-primary)] focus:outline-none" />
                    <button className="px-4 py-2.5 rounded-full bg-[var(--accent-tertiary)] text-white font-bold hover:bg-[var(--accent-tertiary)]/90">Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 6: SETTINGS HUB */}
            {currentScreen === 'settings' && (
              <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">Settings Hub</h2>
                    <p className="text-xs text-[var(--text-muted)]">Configure GCP Project credentials, databases, and simulation modes</p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-[var(--text-muted)]">settings</span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[var(--text-primary)]">Google Cloud Project ID</label>
                    <input 
                      type="text" 
                      value={gcpProject}
                      onChange={(e) => setGcpProject(e.target.value)}
                      className="w-full p-3.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)]/30 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[var(--text-primary)]">Google Cloud Region</label>
                    <input 
                      type="text" 
                      value={gcpRegion}
                      onChange={(e) => setGcpRegion(e.target.value)}
                      className="w-full p-3.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)]/30 text-xs text-[var(--text-primary)] focus:outline-none" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-[24px] neumorphic-inset mt-2">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Local Memory Graph Emulator Mode</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Falls back to in-memory db if Firestore credentials are missing.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={emulatorMode}
                      onChange={(e) => setEmulatorMode(e.target.checked)}
                      className="w-5 h-5 accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      const time = new Date().toLocaleTimeString();
                      setAgentLogs(prev => [...prev, { time, msg: `GCP Project configured: ${gcpProject} (${gcpRegion})`, level: 'success' }]);
                      alert('GCP Settings updated successfully!');
                    }} 
                    className="w-full py-3.5 neumorphic-button-primary font-bold text-xs"
                  >
                    Save Hardware &amp; GCP Settings
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 7: FAQ & SUPPORT */}
            {currentScreen === 'faq' && (
              <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">FAQ &amp; Help</h2>
                    <p className="text-xs text-[var(--text-muted)]">Troubleshoot coordination pipelines and understand agent dynamics</p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-[var(--text-primary)]">help_outline</span>
                </div>

                <div className="space-y-4 text-xs font-body">
                  <div className="p-4 rounded-[20px] neumorphic-inset space-y-1">
                    <p className="font-bold text-[var(--text-primary)]">Q: How do modular specialists coordinate?</p>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">A: The CoordinatorAgent intercepts webhook inputs, matches them against semantics in the memory graph, and routes execution payloads to the targeted modular agent.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 8: ABOUT & MISSION */}
            {currentScreen === 'about' && (
              <div className="p-8 rounded-[32px] neumorphic-card border border-[var(--border-subtle)]/15 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">About OmniHearth</h2>
                    <p className="text-xs text-[var(--text-muted)]">Autonomous Household Operating System and values</p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-[var(--text-primary)]">info</span>
                </div>

                <div className="text-xs font-body leading-relaxed space-y-4 text-[var(--text-muted)]">
                  <p>
                    <strong className="text-[var(--text-primary)]">OmniHearth</strong> is designed on the belief that smart homes should not be simple collections of isolated devices. By uniting scheduling, health telemetry, safety triggers, and cultural educational narratives over a single **unified memory graph**, OmniHearth builds a cohesive household companion.
                  </p>
                </div>
              </div>
            )}

            {/* Global Console Logs & Sandbox Triggers Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              
              {/* Logs Console Pane */}
              <div className="lg:col-span-2 flex flex-col space-y-2">
                <h3 className="text-xs font-bold uppercase text-[var(--text-muted)]/70 tracking-wider font-display">
                  System Logs Console
                </h3>
                <div 
                  className="h-44 overflow-y-auto p-4 rounded-[24px] neumorphic-inset border border-[var(--border-subtle)]/20 font-mono text-xs bg-[var(--bg-canvas)] space-y-1.5 transition-colors duration-300"
                  aria-live="polite"
                >
                  {agentLogs.map((log, idx) => (
                    <div key={idx} className="flex space-x-1.5 items-start">
                      <span className="text-[var(--text-muted)]/40">[{log.time}]</span>
                      <span className={
                        log.level === 'success' ? 'text-[#56642b]' :
                        log.level === 'error' ? 'text-[#ba1a1a] font-semibold' :
                        log.level === 'warning' ? 'text-[#685d42]' : 'text-[var(--text-primary)]'
                      }>
                        {log.msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sandbox Triggers Pane */}
              <div className="flex flex-col space-y-2">
                <h3 className="text-xs font-bold uppercase text-[var(--text-muted)]/70 tracking-wider font-display">
                  State Trigger Sandbox
                </h3>
                <div className="p-4 rounded-[24px] neumorphic-card border border-[var(--border-subtle)]/20 flex flex-col space-y-2">
                  <button 
                    onClick={() => handleTriggerEvent('calendar_conflict_detected', { piano: '16:00', dentist: '16:30' })}
                    disabled={loading}
                    className="w-full text-xs font-semibold py-2 px-3 rounded-full text-left bg-[var(--bg-canvas)] neumorphic-card hover:translate-y-px text-[var(--text-primary)] border border-[var(--border-subtle)]/10 disabled:opacity-50"
                  >
                    ⚡ Trigger Schedule Conflict
                  </button>
                  <button 
                    onClick={() => handleTriggerEvent('wearable_telemetry_sync', { member: 'ananya', steps: 9420, sleep_hours: 5.2 })}
                    disabled={loading}
                    className="w-full text-xs font-semibold py-2 px-3 rounded-full text-left bg-[var(--bg-canvas)] neumorphic-card hover:translate-y-px text-[var(--text-primary)] border border-[var(--border-subtle)]/10 disabled:opacity-50"
                  >
                    ⚡ Log Wearable Sleep Alerts
                  </button>
                  <button 
                    onClick={() => handleTriggerEvent('screentime_exceeded', { member: 'ananya', screentime_minutes: 190, detox_quota_minutes: 120 })}
                    disabled={loading}
                    className="w-full text-xs font-semibold py-2 px-3 rounded-full text-left bg-[var(--bg-canvas)] neumorphic-card hover:translate-y-px text-[var(--text-primary)] border border-[var(--border-subtle)]/10 disabled:opacity-50"
                  >
                    ⚡ Exceed Screentime Limit
                  </button>
                </div>
              </div>

            </div>

          </motion.div>
        </AnimatePresence>

      </main>

      {/* 4. Voice Assistant Fullscreen Overlay with pulsing WebGL shader ball */}
      <AnimatePresence>
        {voiceActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-md bg-[var(--bg-canvas)]/85"
          >
            <div className="w-64 h-64 relative mb-12 border border-[var(--border-subtle)]/10 rounded-full overflow-hidden">
              <WebGLShaderOrb />
              {/* Pulsing outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-primary)] opacity-30 animate-pulse pointer-events-none"></div>
            </div>
            
            <div className="text-center space-y-6">
              <h2 className="font-display text-3xl text-[var(--accent-primary)]">I'm listening...</h2>
              <p className="font-body text-sm text-[var(--text-muted)] max-w-md mx-auto">
                {voiceText}
              </p>
              <button 
                onClick={toggleVoice}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--bg-canvas)] neumorphic-card text-[var(--text-primary)] hover:text-[#ba1a1a] transition-all mx-auto"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
