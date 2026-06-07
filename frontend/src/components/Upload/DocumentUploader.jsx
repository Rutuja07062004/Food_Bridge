import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DragDropZone from './DragDropZone';
import ImagePreviewCard from './ImagePreviewCard';
import { FileText, AlertCircle, Trash2, Loader2 } from 'lucide-react';

const DocumentUploader = ({ initialDocument, onChange }) => {
  const [document, setDocument] = useState(initialDocument || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setDocument(initialDocument);
  }, [initialDocument]);

  const handleFileSelected = async (files) => {
    const file = files[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await API.post('/upload/ngo-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });

      if (res.data?.success) {
        const docData = {
          url: res.data.data.url,
          publicId: res.data.data.publicId
        };
        setDocument(docData);
        if (onChange) onChange(docData);
      } else {
        setError(res.data?.message || 'Failed to upload document.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred during document upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = async () => {
    if (!document) return;
    if (!window.confirm('Are you sure you want to remove this verification document?')) return;

    setError('');
    setUploading(true);

    try {
      const res = await API.delete(`/upload/ngo-document/${encodeURIComponent(document.publicId)}`);
      if (res.data?.success) {
        setDocument(null);
        if (onChange) onChange(null);
      } else {
        setError(res.data?.message || 'Failed to delete document.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting verification document.');
    } finally {
      setUploading(false);
    }
  };

  const isPdf = document?.url?.toLowerCase().endsWith('.pdf') || document?.publicId?.toLowerCase().endsWith('.pdf') || document?.url?.includes('/raw/');

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {!document && !uploading && (
        <DragDropZone
          onFilesSelected={handleFileSelected}
          accept="application/pdf, image/png, image/jpeg, image/jpg"
          maxSizeMb={10}
          multiple={false}
          description="NGO Verification Certificate (PDF, PNG, JPG up to 10MB)"
        />
      )}

      {/* Loading Progress */}
      {uploading && !document && (
        <div className="w-full py-8 px-6 rounded-3xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-bold text-slate-600">Uploading document... {progress}%</span>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden max-w-[50%]">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Display uploaded document */}
      {document && (
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Verification Certificate</span>
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-extrabold text-slate-700 hover:text-emerald-600 mt-0.5 leading-normal block underline truncate max-w-sm sm:max-w-md"
              >
                {isPdf ? 'Review Certificate Document (PDF)' : 'Review Certificate Image'}
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveDocument}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-bold transition-all cursor-pointer self-end sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
