import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DragDropZone from './DragDropZone';
import ImagePreviewCard from './ImagePreviewCard';
import { Camera, Loader2, AlertCircle } from 'lucide-react';

const ImageUploader = ({ initialImages = [], onChange, maxImages = 5 }) => {
  const [images, setImages] = useState(initialImages);
  const [uploads, setUploads] = useState([]); // Array to track active uploads: [{ id, filename, progress, isUploading }]
  const [error, setError] = useState('');

  useEffect(() => {
    // Keep internal state in sync with prop values
    if (JSON.stringify(images) !== JSON.stringify(initialImages)) {
      setImages(initialImages);
    }
  }, [initialImages]);

  const handleFilesSelected = async (selectedFiles) => {
    setError('');

    // Check if adding files exceeds max limit
    const totalSlotCount = images.length + uploads.length + selectedFiles.length;
    if (totalSlotCount > maxImages) {
      setError(`You can only upload up to ${maxImages} images in total.`);
      return;
    }

    // Process and upload each file
    selectedFiles.forEach(async (file) => {
      const uploadId = Date.now() + Math.random();
      
      // Add tracker
      const tracker = {
        id: uploadId,
        file,
        progress: 0,
        isUploading: true
      };
      setUploads(prev => [...prev, tracker]);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await API.post('/upload/food-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploads(prev =>
              prev.map(item => item.id === uploadId ? { ...item, progress: percent } : item)
            );
          }
        });

        if (res.data?.success) {
          const newImage = {
            url: res.data.data.url,
            publicId: res.data.data.publicId
          };
          
          setImages(prev => {
            const updated = [...prev, newImage];
            if (onChange) onChange(updated);
            return updated;
          });
        } else {
          setError(`Failed to upload "${file.name}": ${res.data?.message || 'Server error'}`);
        }
      } catch (err) {
        console.error(err);
        setError(`Failed to upload "${file.name}": ${err.response?.data?.message || 'Error occurred'}`);
      } finally {
        // Remove tracker
        setUploads(prev => prev.filter(item => item.id !== uploadId));
      }
    });
  };

  const handleRemoveImage = async (publicId) => {
    if (!window.confirm('Remove this food listing image?')) return;
    
    setError('');
    try {
      const res = await API.delete(`/upload/food-image/${encodeURIComponent(publicId)}`);
      if (res.data?.success) {
        setImages(prev => {
          const updated = prev.filter(img => img.publicId !== publicId);
          if (onChange) onChange(updated);
          return updated;
        });
      } else {
        setError(res.data?.message || 'Failed to delete image.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error deleting listing image.');
    }
  };

  return (
    <div className="space-y-4">
      {/* File Dropper DropZone */}
      {images.length < maxImages && (
        <DragDropZone
          onFilesSelected={handleFilesSelected}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          maxSizeMb={5}
          multiple={true}
          description={`Food Images (PNG, JPG, JPEG, WEBP up to 5MB, max ${maxImages})`}
        />
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thumbnail Gallery (Seeded + local Uploading state) */}
      {(images.length > 0 || uploads.length > 0) && (
        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-3xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">
            Images Gallery ({images.length}/{maxImages})
          </span>
          <div className="flex flex-wrap gap-3.5">
            {/* Seeded/Successfully Uploaded Images */}
            {images.map((img, idx) => (
              <ImagePreviewCard
                key={img.publicId || idx}
                file={img}
                onRemove={() => handleRemoveImage(img.publicId)}
              />
            ))}

            {/* Currently uploading trackers */}
            {uploads.map((upl) => (
              <ImagePreviewCard
                key={upl.id}
                file={upl.file}
                isUploading={true}
                progress={upl.progress}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
