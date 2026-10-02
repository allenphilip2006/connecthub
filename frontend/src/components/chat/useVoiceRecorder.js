import { useEffect, useRef, useState } from "react";

export default function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [blob, setBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        setBlob(b);
        setAudioURL(URL.createObjectURL(b));
      };
      mr.start();
      setIsRecording(true);
    } catch (e) {
      setIsRecording(false);
      throw e;
    }
  };

  const stop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const reset = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setBlob(null);
  };

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioURL) URL.revokeObjectURL(audioURL);
  }, [audioURL]);

  return { isRecording, audioURL, blob, start, stop, reset };
}
