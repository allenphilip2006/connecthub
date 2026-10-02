import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip, Image as ImageIcon, Smile, Mic,
  Send, ThumbsUp, X, Play, Pause, ChevronUp,
  Reply, MoreVertical, Heart, Flame, MessageSquare,
  Gift, Trash2, Check, CheckCheck, MapPin, Hash, AtSign
} from "lucide-react";
import { orbitService } from "@/services/api";

export default function OrbitChat({ room, onSend, onTyping }) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showGifs, setShowGifs] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const chatEndRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.messages]);

  // Handle typing status
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
    }
  };

  // Voice recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) recorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const send = async () => {
    if (!message.trim() && !attachment && !audioBlob) return;

    let mediaUrl = null;
    if (attachment) {
      const up = await orbitService.upload(attachment);
      mediaUrl = up?.url;
    } else if (audioBlob) {
      const up = await orbitService.upload(new File([audioBlob], "voice.webm", { type: "audio/webm" }));
      mediaUrl = up?.url;
    }

    onSend({
      text: message.trim(),
      mediaUrl,
      replyTo: replyTo?.id,
      timestamp: Date.now(),
      type: audioBlob ? "voice" : attachment ? (attachment.type.startsWith("video/") ? "video" : "image") : "text"
    });

    setMessage("");
    setAttachment(null);
    setAttachmentPreview(null);
    setAudioBlob(null);
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#06060a]/40 backdrop-blur-3xl">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto thin-purple-scroll p-4 space-y-6">
        <AnimatePresence initial={false}>
          {(room.messages || []).map((m) => {
            const isMe = m.senderId === localStorage.getItem("userEmail");
            const isSystem = m.senderId === "SYSTEM";
            const reply = m.replyTo ? room.messages?.find(rm => rm.id === m.replyTo) : null;

            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-4 py-1 rounded-full border border-white/5">
                    {m.text}
                  </span>
                </div>
              );
            }

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Username */}
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-2">
                  {m.senderUsername} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className={`relative group max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                  {/* Reply Snippet */}
                  {reply && (
                    <div className={`mb-1 px-3 py-1 bg-white/5 rounded-t-xl border-l-2 border-purple-500 text-[10px] text-white/40 truncate w-fit max-w-full`}>
                      <span className="font-black text-purple-400">Replying to {reply.senderUsername}:</span> {reply.text}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`rounded-2xl p-4 shadow-2xl transition-all border ${isMe
                      ? "bg-gradient-to-br from-purple-600/80 to-blue-600/60 border-white/10 rounded-tr-none text-white"
                      : "bg-white/5 border-white/5 rounded-tl-none text-white/90"
                    }`}>
                    {/* Media content */}
                    {m.mediaUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                        {m.type === "video" ? (
                          <video src={m.mediaUrl} controls className="max-h-72 w-full object-contain" />
                        ) : m.type === "voice" ? (
                          <div className="p-3 flex items-center gap-4 min-w-[240px]">
                            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><Play size={20} fill="currentColor" /></button>
                            <div className="flex-1 h-8 flex items-center gap-1">
                              {[...Array(20)].map((_, i) => (
                                <div key={i} className="flex-1 bg-white/20 rounded-full" style={{ height: `${Math.random() * 80 + 20}%` }} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <img src={m.mediaUrl.startsWith('http') ? m.mediaUrl : `http://localhost:62223${m.mediaUrl}`} alt="media" className="max-h-72 w-full object-contain cursor-pointer" />
                        )}
                      </div>
                    )}

                    <div className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                      {m.text}
                    </div>

                    {/* Reactions */}
                    <div className={`absolute -bottom-2 ${isMe ? "right-0" : "left-0"} flex gap-1`}>
                      {(m.reactions || []).map((r, i) => (
                        <div key={i} className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[10px] shadow-lg">
                          {r.emoji} {r.count > 1 && r.count}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className={`absolute top-0 ${isMe ? "-left-12" : "-right-12"} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                    <button onClick={() => setReplyTo(m)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"><Reply size={16} /></button>
                    <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"><MoreVertical size={16} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/5 relative">
        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="mb-3 px-4 py-2 bg-purple-500/10 border-l-2 border-purple-500 flex items-center justify-between rounded-r-xl">
              <div className="text-xs truncate">
                <span className="font-black text-purple-400">Replying to {replyTo.senderUsername}:</span> {replyTo.text}
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/40 hover:text-white"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Preview */}
        <AnimatePresence>
          {attachmentPreview && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="mb-3 relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500">
              <img src={attachmentPreview} className="w-full h-full object-cover" />
              <button onClick={() => { setAttachment(null); setAttachmentPreview(null); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"><X size={12} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3 bg-black/40 p-2 rounded-[2rem] border border-white/5">
          <div className="flex gap-1 mb-1">
            <button className="p-2.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition" onClick={() => document.getElementById("chat-file").click()}>
              <Paperclip size={20} />
            </button>
            <button className="p-2.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition" onClick={() => setShowGifs(!showGifs)}>
              <Gift size={20} />
            </button>
            <button className="p-2.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition">
              <Smile size={20} />
            </button>
          </div>

          <textarea
            value={message}
            onChange={handleMessageChange}
            placeholder={isRecording ? "Recording voice..." : "Type a message..."}
            className="flex-1 bg-transparent py-3 px-1 text-sm font-medium outline-none resize-none max-h-32 placeholder-white/10"
            rows={1}
            disabled={isRecording}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />

          <div className="flex gap-1 mb-1 pr-1">
            {isRecording ? (
              <div className="flex items-center gap-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black text-red-500">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={stopRecording} className="p-3 rounded-full bg-red-500 text-white shadow-lg"><Send size={18} /></button>
              </div>
            ) : (
              <>
                <button onMouseDown={startRecording} className="p-2.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition">
                  <Mic size={20} />
                </button>
                <button onClick={send} className={`p-3 rounded-full transition-all shadow-xl ${message.trim() || attachment ? "bg-purple-500 text-white scale-110" : "bg-white/5 text-white/20"}`}>
                  {message.trim() || attachment ? <Send size={18} /> : <ThumbsUp size={18} />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <input type="file" id="chat-file" className="hidden" accept="image/*,video/*" onChange={handleFile} />
    </div>
  );
}
