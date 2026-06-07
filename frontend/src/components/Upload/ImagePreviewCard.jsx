import React from 'react';
import { X, FileText, Loader2, RefreshCw } from 'lucide-react';

const ImagePreviewCard = ({
  file,          // Can be a local File object or an object { url, publicId } from backend
  progress = 0,  // Upload progress percentage
  isUploading = false,
  onRemove,
  isPdf = false
}) => {
  const getUrl = () => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file.url;
  };

  const getFilename = () => {
    if (file instanceof File) {
      return file.name;
    }
    // Extract filename from URL path if it is a string url
    if (file.url) {
      const parts = file.url.split('/');
      return parts[parts.length - 1];
    }
    return 'uploaded_file';
  };

  const isLocalFile = file instanceof File;

  return (
    <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm flex flex-col items-center justify-center">
      {/* Document Icon for PDFs */}
      {isPdf ? (
        <div className="flex flex-col items-center justify-center w-full h-full p-3 bg-rose-50/20 text-rose-500">
          <FileText className="w-8 h-8 text-rose-500 mb-1" />
          <span className="text-[9px] font-extrabold truncate w-full text-center px-1 text-slate-500">
            {getFilename()}
          </span>
        </div>
      ) : (
        /* Image Preview */
        <img
          src={getUrl()}
          alt="Preview"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}

      {/* Uploading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mb-1" />
          <span className="text-[9px] font-bold">{progress}%</span>
          {/* Progress bar */}
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden mt-1.5 max-w-[80%]">
            <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Remove Overlay Button */}
      {!isUploading && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Delete file"
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default ImagePreviewCard;
