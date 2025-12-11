
import React, { useState, useEffect } from 'react';
import { Search, Zap, Settings, ChevronDown, ChevronUp, Palette, MessageSquare, LayoutTemplate, Sliders, Hash, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';
import { Y_IT_NANO_BOOK_SPEC } from '../constants';

interface InputSectionProps {
  onGenerate: (
    topic: string, 
    customSpec?: string, 
    tone?: string, 
    visualStyle?: string,
    lengthLevel?: number,
    imageDensity?: number,
    techLevel?: number,
    targetWordCount?: number,
    caseStudyCount?: number,
    frontCoverPrompt?: string,
    backCoverPrompt?: string,
    frontCoverImage?: string,
    backCoverImage?: string
  ) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [customSpec, setCustomSpec] = useState(Y_IT_NANO_BOOK_SPEC);
  const [tone, setTone] = useState('');
  const [visualStyle, setVisualStyle] = useState('');
  
  // Local state to prevent double-click while parent is updating
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  
  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset local submitting if loading completes (or errors out and returns to input)
  useEffect(() => {
    if (!isLoading) {
      setIsLocalSubmitting(false);
    }
  }, [isLoading]);
  
  // New "Throttle" Settings
  const [lengthLevel, setLengthLevel] = useState(2); // 1-3
  const [imageDensity, setImageDensity] = useState(2); // 1-3
  const [techLevel, setTechLevel] = useState(2); // 1-3
  
  // Exact Constraints
  const [targetWordCount, setTargetWordCount] = useState<number | ''>('');
  const [caseStudyCount, setCaseStudyCount] = useState<number | ''>('');

  // Cover Settings
  const [frontCoverPrompt, setFrontCoverPrompt] = useState('');
  const [backCoverPrompt, setBackCoverPrompt] = useState('');
  const [frontCoverImage, setFrontCoverImage] = useState<string | undefined>(undefined);
  const [backCoverImage, setBackCoverImage] = useState<string | undefined>(undefined);

  const validateInputs = (): boolean => {
    if (!topic.trim()) {
        setValidationError("Please enter a research topic.");
        return false;
    }
    if (topic.length > 100) {
        setValidationError("Topic is too long. Keep it under 100 characters.");
        return false;
    }

    if (targetWordCount !== '' && (targetWordCount < 100 || targetWordCount > 2000)) {
        setValidationError("Target word count must be between 100 and 2000 per chapter.");
        return false;
    }

    if (caseStudyCount !== '' && (caseStudyCount < 1 || caseStudyCount > 50)) {
        setValidationError("Case study count must be between 1 and 50.");
        return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLocalSubmitting || isLoading) return;

    if (validateInputs()) {
      setIsLocalSubmitting(true);
      onGenerate(
        topic, 
        showConfig ? customSpec : undefined, 
        tone, 
        visualStyle,
        lengthLevel,
        imageDensity,
        techLevel,
        targetWordCount === '' ? undefined : targetWordCount,
        caseStudyCount === '' ? undefined : caseStudyCount,
        frontCoverPrompt,
        backCoverPrompt,
        frontCoverImage,
        backCoverImage
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate File Size (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
          alert("File size too large. Please upload an image under 5MB.");
          return;
      }
      // Validate File Type
      if (!file.type.startsWith('image/')) {
          alert("Invalid file type. Please upload an image.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLabelForSlider = (val: number, labels: string[]) => labels[val - 1];

  const isProcessing = isLoading || isLocalSubmitting;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900 rounded-full blur-[128px]"></div>
      </div>

      <div className="z-10 max-w-3xl w-full text-center space-y-8 animate-fadeIn">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="bg-yellow-500 text-black px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm">
              Y-It Engine v2.5
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
            Expose the <span className="text-yellow-500">Hustle</span>.
          </h1>
          <p className="text-xl text-gray-400 max-w-lg mx-auto">
            Enter any internet side hustle. We'll generate a ruthlessly honest research dossier and a KDP-ready Nano-Book.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative w-full space-y-6">
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                  setTopic(e.target.value);
                  if (validationError) setValidationError(null);
              }}
              placeholder="e.g. Dropshipping, Dog Walking, AI Agency..."
              className={`w-full bg-gray-900 border ${validationError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-800'} text-white px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg placeholder-gray-600 transition-all shadow-2xl`}
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !topic.trim()}
              className="absolute right-2 top-2 bottom-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="animate-pulse">Deep Mining...</span>
              ) : (
                <>
                  <Search size={20} />
                  <span>Investigate</span>
                </>
              )}
            </button>
          </div>
          
          {validationError && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm animate-shake">
                  <AlertCircle size={16} />
                  <span>{validationError}</span>
              </div>
          )}

          {/* Unified Configuration Toggle */}
          <div className="w-full max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mx-auto mb-4 hover:bg-gray-900 px-4 py-2 rounded-full"
            >
              <Settings size={16} />
              {showConfig ? "Hide Configuration" : "Customize Settings (Tone, Visuals, Physics, Covers)"}
              {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 animate-slideDown backdrop-blur-sm text-left shadow-2xl h-[600px] overflow-y-auto custom-scrollbar">
                 
                 {/* Dimensions & Physics (Sliders) */}
                 <div className="md:col-span-2 space-y-6 bg-black/40 p-4 rounded-xl border border-gray-800">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        <Sliders size={14} className="text-orange-500"/>
                        Dimensions & Physics
                    </label>
                    
                    {/* Length Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>Book Length</span>
                            <span className="text-yellow-500 font-bold">{getLabelForSlider(lengthLevel, ['Nano (Condensed)', 'Standard', 'Deep Dive'])}</span>
                        </div>
                        <input 
                            type="range" min="1" max="3" step="1"
                            value={lengthLevel} onChange={(e) => setLengthLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>

                    {/* Image Density Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>Image Predominance</span>
                            <span className="text-purple-500 font-bold">{getLabelForSlider(imageDensity, ['Text Focused', 'Balanced', 'Visual Heavy'])}</span>
                        </div>
                        <input 
                            type="range" min="1" max="3" step="1"
                            value={imageDensity} onChange={(e) => setImageDensity(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* Technical Level Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>Visual Technicality</span>
                            <span className="text-blue-500 font-bold">{getLabelForSlider(techLevel, ['Artistic/Abstract', 'Hybrid', 'Technical/Charts'])}</span>
                        </div>
                        <input 
                            type="range" min="1" max="3" step="1"
                            value={techLevel} onChange={(e) => setTechLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                 </div>

                 {/* Cover Art Studio */}
                 <div className="md:col-span-2 space-y-4 bg-black/40 p-4 rounded-xl border border-gray-800">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <ImageIcon size={14} className="text-pink-500"/>
                        Cover Art Studio
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Front Cover */}
                        <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Front Cover</span>
                            <textarea 
                                value={frontCoverPrompt}
                                onChange={(e) => setFrontCoverPrompt(e.target.value)}
                                placeholder="Describe the front cover imagery... (Leave blank for auto-generated Y-It Brand style)"
                                className="w-full h-20 bg-black border border-gray-700 rounded p-2 text-xs focus:border-pink-500 focus:outline-none resize-none"
                            />
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, setFrontCoverImage)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <button type="button" className={`w-full py-2 rounded border border-dashed text-xs flex items-center justify-center gap-2 transition-colors ${frontCoverImage ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-gray-700 text-gray-500 group-hover:border-gray-500'}`}>
                                    <Upload size={12} />
                                    {frontCoverImage ? "Image Uploaded (Override Active)" : "Upload Custom Front Image"}
                                </button>
                            </div>
                        </div>

                        {/* Back Cover */}
                        <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Rear Cover</span>
                            <textarea 
                                value={backCoverPrompt}
                                onChange={(e) => setBackCoverPrompt(e.target.value)}
                                placeholder="Describe the rear cover imagery... (Leave blank for auto-generated Y-It Brand style)"
                                className="w-full h-20 bg-black border border-gray-700 rounded p-2 text-xs focus:border-pink-500 focus:outline-none resize-none"
                            />
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, setBackCoverImage)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <button type="button" className={`w-full py-2 rounded border border-dashed text-xs flex items-center justify-center gap-2 transition-colors ${backCoverImage ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-gray-700 text-gray-500 group-hover:border-gray-500'}`}>
                                    <Upload size={12} />
                                    {backCoverImage ? "Image Uploaded (Override Active)" : "Upload Custom Rear Image"}
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Exact Numbers */}
                 <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-gray-800">
                    <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Hash size={14} className="text-red-500"/>
                        Exact Constraints (Override)
                    </label>
                    <div>
                        <span className="text-[10px] text-gray-500 block mb-1">Words per Chapter (100-2000)</span>
                        <input 
                            type="number" 
                            min="100"
                            max="2000"
                            placeholder="e.g. 500"
                            value={targetWordCount}
                            onChange={(e) => setTargetWordCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full bg-black border border-gray-700 rounded p-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 block mb-1">Total Case Studies (1-50)</span>
                        <input 
                            type="number" 
                            min="1"
                            max="50"
                            placeholder="e.g. 15"
                            value={caseStudyCount}
                            onChange={(e) => setCaseStudyCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full bg-black border border-gray-700 rounded p-2 text-sm focus:border-red-500 focus:outline-none"
                        />
                    </div>
                 </div>

                 {/* Tone Input */}
                 <div className="md:col-span-1 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <MessageSquare size={14} className="text-blue-500"/>
                        Narrative Tone
                    </label>
                    <textarea 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        placeholder="Default: Satirical, forensic, data-driven."
                        className="w-full h-32 bg-black/80 border border-gray-700 rounded-lg p-4 text-xs focus:border-blue-500 focus:outline-none resize-none"
                    />
                 </div>

                 {/* Visual Input */}
                 <div className="md:col-span-1 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Palette size={14} className="text-purple-500"/>
                        Visual Style Note
                    </label>
                    <textarea 
                        value={visualStyle}
                        onChange={(e) => setVisualStyle(e.target.value)}
                        placeholder="Default: High contrast, editorial, gritty data."
                        className="w-full h-32 bg-black/80 border border-gray-700 rounded-lg p-4 text-xs focus:border-purple-500 focus:outline-none resize-none"
                    />
                 </div>

                 {/* Structure Input */}
                 <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <LayoutTemplate size={14} className="text-green-500"/>
                            Base Specification
                        </label>
                        <span className="text-[10px] text-gray-600">Markdown</span>
                    </div>
                    <textarea
                      value={customSpec}
                      onChange={(e) => setCustomSpec(e.target.value)}
                      className="w-full h-40 bg-black/80 border border-gray-700 rounded-lg p-4 text-[10px] font-mono text-gray-400 focus:border-green-500 focus:outline-none resize-y"
                    />
                 </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 pt-8">
          <span className="flex items-center gap-1"><Zap size={14} /> Deep Research</span>
          <span>•</span>
          <span>KDP 6x9 Export</span>
          <span>•</span>
          <span>AI Image Gen</span>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default InputSection;
