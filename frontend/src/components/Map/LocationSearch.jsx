import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import mapService from '../../services/mapService';

const LocationSearch = ({ onSelect, placeholder = 'Search address or location...', initialValue = '' }) => {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = async (val) => {
    if (!val || val.trim().length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await mapService.getAutocomplete(val);
      if (res.success) {
        setPredictions(res.predictions || []);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Places Autocomplete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPredictions(val);
    }, 450);
  };

  const handleSelectPrediction = (pred) => {
    setQuery(pred.description);
    setPredictions([]);
    setIsOpen(false);
    if (onSelect) {
      onSelect(pred.description);
    }
  };

  const handleClear = () => {
    setQuery('');
    setPredictions([]);
    setIsOpen(false);
    if (onSelect) {
      onSelect('');
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/40 text-sm font-medium bg-white shadow-sm transition-all"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        
        {loading && (
          <Loader2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 overflow-hidden divide-y divide-slate-50 animate-fadeIn">
          {predictions.map((pred, i) => (
            <div
              key={pred.place_id || i}
              onClick={() => handleSelectPrediction(pred)}
              className="px-4 py-3 hover:bg-emerald-50/40 flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-emerald-100/50 flex items-center justify-center flex-shrink-0 transition-colors">
                <MapPin className="w-4.5 h-4.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="text-xs font-bold text-slate-700 group-hover:text-slate-800 transition-colors truncate">
                {pred.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
