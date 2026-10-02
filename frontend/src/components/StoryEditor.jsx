import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipientSelector from './RecipientSelector';

const StoryEditor = ({ isOpen, onClose, onSave }) => {
    const [mediaFile, setMediaFile] = useState(null);
    const [caption, setCaption] = useState('');
    const [captionPosition, setCaptionPosition] = useState({ x: 50, y: 50 }); // Initial position in percentage
    const [music, setMusic] = useState('');
    const [audience, setAudience] = useState('FOLLOWERS');
    const [showRecipientSelector, setShowRecipientSelector] = useState(false);
    const mediaInputRef = useRef(null);
    const editorRef = useRef(null); // Ref for the entire editor modal
    const mediaPreviewRef = useRef(null); // Ref for the media preview area

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setMediaFile(file);
        }
    };

    const handleSave = () => {
        if (audience === 'CLOSE_FRIENDS') {
            setShowRecipientSelector(true);
        } else {
            onSave({ mediaFile, caption, captionPosition, music, audience });
            onClose();
        }
    };

    const handleSendToRecipients = (recipients) => {
        onSave({ mediaFile, caption, captionPosition, music, audience, recipients });
        onClose();
    };

    const handleDragEnd = (event, info) => {
        if (mediaPreviewRef.current) {
            const mediaRect = mediaPreviewRef.current.getBoundingClientRect();
            // Calculate new position relative to the media preview area
            const newX = ((info.point.x - mediaRect.left) / mediaRect.width) * 100;
            const newY = ((info.point.y - mediaRect.top) / mediaRect.height) * 100;

            setCaptionPosition({
                x: Math.max(0, Math.min(100, newX)),
                y: Math.max(0, Math.min(100, newY))
            });
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] flex items-center justify-center p-6"
                >
                    <div className="absolute inset-0 bg-black/70" onClick={onClose} />
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        ref={editorRef}
                        className="relative w-full max-w-2xl glass-card rounded-[2rem] border-white/10 p-6 flex flex-col"
                    >
                        <h3 className="text-lg font-black text-white mb-4">Create New Story</h3>
                        <div className="flex-1 flex flex-col space-y-4">
                            {/* Media Selection and Preview */}
                            <div ref={mediaPreviewRef} className="relative border border-white/10 rounded-xl p-4 flex-1 flex items-center justify-center bg-zinc-900/50 overflow-hidden">
                                {mediaFile ? (
                                    mediaFile.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(mediaFile)} alt="preview" className="max-h-full max-w-full object-contain rounded-lg" />
                                    ) : (
                                        <video src={URL.createObjectURL(mediaFile)} controls className="max-h-full max-w-full object-contain rounded-lg" />
                                    )
                                ) : (
                                    <p className="text-gray-400">No media selected</p>
                                )}
                                <input
                                    type="file"
                                    ref={mediaInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*,video/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => mediaInputRef.current?.click()}
                                    className="absolute bottom-4 right-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-black"
                                >
                                    {mediaFile ? 'Change Media' : 'Select Media'}
                                </button>

                                {/* Draggable Caption */}
                                {mediaFile && (
                                    <motion.input
                                        type="text"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Add a caption..."
                                        className="absolute bg-transparent text-white text-lg font-bold text-center outline-none border-none resize-none"
                                        style={{
                                            left: `${captionPosition.x}%`,
                                            top: `${captionPosition.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            width: '80%', // Adjust as needed
                                        }}
                                        drag
                                        dragConstraints={mediaPreviewRef} // Constrain drag to media preview area
                                        onDragEnd={handleDragEnd}
                                    />
                                )}
                            </div>

                            {/* Music Input */}
                            <input
                                value={music}
                                onChange={(e) => setMusic(e.target.value)}
                                placeholder="Add a music track (optional)"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
                            />

                            {/* Audience Selection */}
                            <select
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none"
                            >
                                <option value="PUBLIC">Public</option>
                                <option value="FOLLOWERS">Followers</option>
                                <option value="CLOSE_FRIENDS">Close Friends</option>
                            </select>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button onClick={onClose} className="px-6 py-2 bg-white/10 text-white rounded-xl text-sm font-black">
                                    Discard
                                </button>
                                <button onClick={handleSave} className="px-6 py-2 bg-white text-black rounded-xl text-sm font-black">
                                    Share Story
                                 </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            <RecipientSelector
                isOpen={showRecipientSelector}
                onClose={() => setShowRecipientSelector(false)}
                onSelectRecipients={handleSendToRecipients}
            />
        </AnimatePresence>
    );
};

export default StoryEditor;
