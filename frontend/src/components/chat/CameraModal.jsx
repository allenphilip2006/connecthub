import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingUser, setFacingUser] = useState(true);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const start = async () => {
      if (!open) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingUser ? "user" : "environment" }, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        onClose?.();
      }
    };
    start();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [open, facingUser, onClose]);

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(v, 0, 0);
    canvas.toBlob((blob) => blob && onCapture?.(blob, "image"), "image/png");
  };

  const startVideo = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      onCapture?.(blob, "video");
      chunksRef.current = [];
    };
    mr.start();
    setRecording(true);
  };
  const stopVideo = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <div className="relative w-full max-w-md mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
              <video ref={videoRef} className="w-full h-[60vh] object-cover" muted playsInline />
            </div>
            <div className="absolute top-4 left-4">
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 border border-white/10">✕</button>
            </div>
            <div className="absolute top-4 right-4">
              <button onClick={() => setFacingUser(!facingUser)} className="w-10 h-10 rounded-full bg-white/10 border border-white/10">🔁</button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white text-black text-sm font-black">Photo</button>
              {!recording ? (
                <button onClick={startVideo} className="w-16 h-16 rounded-full bg-red-600 text-white text-sm font-black">Rec</button>
              ) : (
                <button onClick={stopVideo} className="w-16 h-16 rounded-full bg-red-600/40 text-white text-sm font-black border-2 border-red-500">Stop</button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
