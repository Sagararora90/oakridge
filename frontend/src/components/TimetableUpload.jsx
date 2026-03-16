import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import useStore from '../store/useStore';

const TimetableUpload = ({ onComplete }) => {
  const [isOpen, setIsOpen]   = useState(false);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const { uploadTimetableOCR, loading } = useStore();

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('timetable', file);
    try {
      await uploadTimetableOCR(formData);
      setIsOpen(false);
      setFile(null);
      setPreview(null);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setPreview(null);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-accent/20"
      >
        <Sparkles className="w-4 h-4" />
        Smart Upload
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{   scale: 0.95, opacity: 0, y: 10  }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={modal.wrap}
            >
              {/* Header */}
              <div style={modal.header}>
                <div style={modal.iconWrap}>
                  <Upload size={18} style={{ color: 'var(--accent, #7c3aed)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={modal.title}>Smart Timetable Upload</h2>
                  <p style={modal.subtitle}>Upload a photo or PDF — we'll read your schedule automatically.</p>
                </div>
                <button onClick={handleClose} style={modal.closeBtn} className="hover:bg-bg transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={modal.body}>

                {/* Drop zone / Preview */}
                {!preview ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      ...modal.dropZone,
                      borderColor: dragOver ? 'var(--accent, #7c3aed)' : 'var(--color-border)',
                      background:  dragOver ? 'rgba(124,58,237,0.04)' : 'var(--color-bg)',
                    }}
                  >
                    <div style={modal.dropIcon}>
                      <ImageIcon size={28} style={{ color: dragOver ? 'var(--accent, #7c3aed)' : '#c8c5bf' }} />
                    </div>
                    <p style={modal.dropMain}>
                      {dragOver ? 'Drop it here' : 'Click to choose a file'}
                    </p>
                    <p style={modal.dropSub}>or drag and drop · JPG, PNG, PDF</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                  </label>
                ) : (
                  <div style={modal.previewWrap}>
                    <img
                      src={preview}
                      alt="Timetable preview"
                      style={modal.previewImg}
                    />
                    <div style={modal.previewOverlay}>
                      <div style={modal.previewMeta}>
                        <Check size={14} style={{ color: '#0F6E56' }} />
                        <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 500 }}>
                          {file?.name}
                        </span>
                      </div>
                      <button
                        onClick={() => { setFile(null); setPreview(null); }}
                        style={modal.removeBtn}
                        className="hover:bg-danger hover:text-white transition-all"
                      >
                        <X size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  style={{
                    ...modal.uploadBtn,
                    opacity:       (!file || loading) ? 0.5 : 1,
                    cursor:        (!file || loading) ? 'not-allowed' : 'pointer',
                    background:    'var(--accent, #7c3aed)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Parsing timetable…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Start Detection
                    </>
                  )}
                </button>

                {/* Fine print */}
                <p style={modal.hint}>
                  Works best with clear, well-lit photos. PDFs must be under 10 MB.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

const modal = {
  wrap: {
    background:   '#fff',
    borderRadius: 16,
    border:       '0.5px solid var(--color-border)',
    boxShadow:    '0 24px 60px rgba(0,0,0,0.12)',
    width:        '100%',
    maxWidth:     480,
    overflow:     'hidden',
  },
  header: {
    display:       'flex',
    alignItems:    'flex-start',
    gap:           14,
    padding:       '20px 20px 16px',
    borderBottom:  '0.5px solid #f2f0ec',
  },
  iconWrap: {
    width:           38,
    height:          38,
    borderRadius:    10,
    background:      'rgba(124,58,237,0.08)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  title: {
    fontSize:    15,
    fontWeight:  700,
    color:       'var(--color-text)',
    margin:      0,
    lineHeight:  1.3,
  },
  subtitle: {
    fontSize:   12,
    color:      'var(--color-subtext)',
    marginTop:  3,
    lineHeight: 1.5,
  },
  closeBtn: {
    width:           30,
    height:          30,
    borderRadius:    8,
    border:          '0.5px solid var(--color-border)',
    background:      'transparent',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    cursor:          'pointer',
    color:           'var(--color-subtext)',
    flexShrink:      0,
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  // Drop zone
  dropZone: {
    width:          '100%',
    height:         180,
    border:         '1.5px dashed',
    borderRadius:   12,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    transition:     'all 0.2s',
    gap:            6,
  },
  dropIcon: {
    width:           52,
    height:          52,
    borderRadius:    12,
    background:      '#f2f0ec',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  dropMain: { fontSize: 13, fontWeight: 600, color: '#4a4845', margin: 0 },
  dropSub:  { fontSize: 11, color: '#b0ada8', margin: 0 },

  // Preview
  previewWrap: {
    borderRadius: 12,
    overflow:     'hidden',
    border:       '0.5px solid var(--color-border)',
    position:     'relative',
  },
  previewImg: {
    width:      '100%',
    height:     160,
    objectFit:  'cover',
    display:    'block',
    filter:     'brightness(0.92)',
  },
  previewOverlay: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    background:     'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(4px)',
    padding:        '8px 12px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    borderTop:      '0.5px solid var(--color-border)',
  },
  previewMeta: {
    display:    'flex',
    alignItems: 'center',
    gap:        6,
    flex:       1,
    minWidth:   0,
    overflow:   'hidden',
  },
  removeBtn: {
    display:        'flex',
    alignItems:     'center',
    gap:            4,
    fontSize:       11,
    fontWeight:     600,
    color:          '#A32D2D',
    background:     '#FCEBEB',
    border:         'none',
    borderRadius:   6,
    padding:        '4px 8px',
    cursor:         'pointer',
    flexShrink:     0,
  },

  // Upload button
  uploadBtn: {
    width:          '100%',
    padding:        '13px',
    borderRadius:   10,
    border:         'none',
    color:          '#fff',
    fontSize:       14,
    fontWeight:     700,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    letterSpacing:  '0.01em',
  },

  hint: {
    fontSize:   11,
    color:      '#b0ada8',
    textAlign:  'center',
    margin:     0,
    lineHeight: 1.5,
  },
};

export default TimetableUpload;