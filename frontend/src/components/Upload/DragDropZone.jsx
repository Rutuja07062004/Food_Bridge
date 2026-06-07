import React, { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle2 } from 'lucide-react';

const DragDropZone = ({
  onFilesSelected,
  accept = 'image/*',
  maxSizeMb = 5,
  multiple = false,
  description = 'PNG, JPG, JPEG or WEBP up to 5MB'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcessFiles = (filesList) => {
    setError('');
    const files = Array.from(filesList);
    const validFiles = [];

    // Filter by quantity limits
    if (!multiple && files.length > 1) {
      setError('Only one file can be uploaded at a time.');
      return;
    }

    const maxSize = maxSizeMb * 1024 * 1024;
    const acceptRegex = new RegExp(accept.replace('*', '.*').replace(/,/g, '|'));

    for (const file of files) {
      // Validate File Size
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds the maximum size limit of ${maxSizeMb}MB.`);
        return;
      }
      
      // Validate File Mimetype / Type
      if (accept && !file.type.match(acceptRegex) && !file.name.endsWith('.pdf')) {
        setError(`Invalid file format for "${file.name}". Expected: ${description}`);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const triggerInputClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        className={`w-full py-8 px-6 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/20 scale-[1.01]'
            : 'border-slate-200 bg-slate-50/50 hover:bg-emerald-50/10 hover:border-emerald-200'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors mb-3">
          <Upload className={`w-6 h-6 transition-transform duration-300 ${dragActive ? '-translate-y-0.5 text-emerald-600' : ''}`} />
        </div>

        <p className="text-xs font-extrabold text-slate-700">
          Drag & drop your files here, or <span className="text-emerald-600 hover:text-emerald-700">browse</span>
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
          {description}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DragDropZone;
