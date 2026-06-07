import React, { useState } from 'react';
import API from '../../services/api';
import { Camera, User, Trash2, Loader2, AlertCircle } from 'lucide-react';

const ProfilePhotoUploader = ({ initialPhotoUrl, onUploadSuccess, onRemoveSuccess }) => {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size and format
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      setError('Only PNG, JPG, JPEG or WEBP formats are allowed.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await API.post('/upload/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      if (res.data?.success) {
        const uploadedData = res.data.data;
        setPhotoUrl(uploadedData.url);
        if (onUploadSuccess) {
          onUploadSuccess(uploadedData);
        }
      } else {
        setError(res.data?.message || 'Failed to upload photo.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error uploading profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    
    setUploading(true);
    setError('');

    try {
      const res = await API.delete('/upload/profile-photo');
      if (res.data?.success) {
        setPhotoUrl('');
        if (onRemoveSuccess) {
          onRemoveSuccess();
        }
      } else {
        setError(res.data?.message || 'Failed to remove photo.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Avatar Container */}
      <div className="relative group w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl shadow-slate-200/50 flex items-center justify-center">
        {photoUrl ? (
          <img
            src={getFullUrl(photoUrl)}
            alt="Profile Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-16 h-16 text-slate-300" />
        )}

        {/* Upload progress indicator */}
        {uploading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-1" />
            <span className="text-[10px] font-bold">{progress}%</span>
          </div>
        )}

        {/* Hover Camera overlay */}
        {!uploading && (
          <label className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Camera className="w-6 h-6 mb-1 text-slate-200" />
            <span className="text-[10px] font-bold">Update Photo</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Remove trigger */}
      {photoUrl && !uploading && (
        <button
          type="button"
          onClick={handleRemovePhoto}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-rose-50 text-rose-500 text-xs font-bold transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Photo</span>
        </button>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-1.5 max-w-xs text-center">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUploader;
