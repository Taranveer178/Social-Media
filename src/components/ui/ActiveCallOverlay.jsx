import { useEffect, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { useData } from '../../contexts/useData';

export const ActiveCallOverlay = () => {
  const { activeCall, setActiveCall, showToast } = useData();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!activeCall) {
      setSeconds(0);
      setIsMuted(false);
      setIsCameraOff(false);
      return undefined;
    }
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [activeCall]);

  if (!activeCall) return null;

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-8 text-white animate-fade-in">
      <div className="text-center space-y-2 mt-8">
        <Avatar src={activeCall.user?.avatar} name={activeCall.user?.name} size="xl" className="mx-auto" />
        <h2 className="text-2xl font-bold">{activeCall.user?.name || 'Vibely Call'}</h2>
        <p className="text-xs text-violet-400 font-medium">
          Vibely Encrypted {activeCall.type === 'video' ? 'Video' : 'Voice'} Call • {formattedTime}
        </p>
        {isMuted && <span className="inline-block text-[11px] bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full">Microphone Muted</span>}
      </div>

      <div className="flex items-center space-x-6 mb-12">
        <button
          onClick={() => setIsMuted((m) => !m)}
          className={`p-4 rounded-full transition-all ${isMuted ? 'bg-amber-500 text-slate-950' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button
          onClick={() => {
            setActiveCall(null);
            showToast(`Call ended (${formattedTime})`);
          }}
          className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/40"
          title="End Call"
        >
          <PhoneOff size={28} />
        </button>
        {activeCall.type === 'video' ? (
          <button
            onClick={() => setIsCameraOff((c) => !c)}
            className={`p-4 rounded-full transition-all ${isCameraOff ? 'bg-amber-500 text-slate-950' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        ) : (
          <button
            onClick={() => showToast('Speakerphone toggled 🔊')}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all"
            title="Speaker"
          >
            <Volume2 size={22} />
          </button>
        )}
      </div>
    </div>
  );
};
