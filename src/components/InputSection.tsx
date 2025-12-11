import React, { useState, useEffect } from 'react';
import { Search, Settings, ChevronDown, ChevronUp, Palette, MessageSquare, LayoutTemplate, Sliders, Hash, Image as ImageIcon, Upload, AlertCircle, GitBranch, Plus, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { Y_IT_NANO_BOOK_SPEC, IMAGE_MODELS } from '../constants';
import { GenSettings, ImageModelID } from '../types';

interface InputSectionProps {
  onGenerate: (topic: string, settings: GenSettings) => void;
  isLoading: boolean;
  existingResearchTopic?: string; // If present, we are in "New Branch" mode
  defaultSettings?: GenSettings; // Settings to inherit/shadow from original draft
}

const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading, existingResearchTopic, defaultSettings }) => {
  const [topic, setTopic] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [customSpec, setCustomSpec] = useState(Y_IT_NANO_BOOK_SPEC);
  const [tone, setTone] = useState('');
  const [visualStyle, setVisualStyle] = useState('');
  
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Branch Mode: Shadowing Settings
  const [inheritSettings, setInheritSettings] = useState(!!defaultSettings);

  useEffect(() => {
    if (!isLoading) setIsLocalSubmitting(false);
    
    // If starting a new branch, auto-open config so user can change settings
    if (existingResearchTopic && !isLoading) setShowConfig(true);
  }, [isLoading, existingResearchTopic]);

  // Settings State
  const [lengthLevel, setLengthLevel] = useState(2);
  const [imageDensity, setImageDensity] = useState(2);
  const [techLevel, setTechLevel] = useState(2);
  const [targetWordCount, setTargetWordCount] = useState<number | ''>('');
  const [caseStudyCount, setCaseStudyCount] = useState<number | ''>('');

  const [frontCoverPrompt, setFrontCoverPrompt] = useState('');
  const [backCoverPrompt, setBackCoverPrompt] = useState('');

  // Image Hierarchy State
  const [modelHierarchy, setModelHierarchy] = useState<ImageModelID[]>(IMAGE_MODELS.map(m => m.id as ImageModelID));
  
  // Apply Default Settings (Shadowing) Logic
  useEffect(() => {
    if (inheritSettings && defaultSettings) {
        setTone(defaultSettings.tone);
        setVisualStyle(defaultSettings.visualStyle);
        setLengthLevel(defaultSettings.lengthLevel);
        setImageDensity(defaultSettings.imageDensity);
        setTechLevel(defaultSettings.techLevel);
        setTargetWordCount(defaultSettings.targetWordCount || '');
        setCaseStudyCount(defaultSettings.caseStudyCount || '');
        setFrontCoverPrompt(defaultSettings.frontCoverPrompt || '');
        setBackCoverPrompt(defaultSettings.backCoverPrompt || '');
        setCustomSpec(defaultSettings.customSpec || Y_IT_NANO_BOOK_SPEC);
        if (defaultSettings.imageModelHierarchy) {
            setModelHierarchy(defaultSettings.imageModelHierarchy);
        }
    } else if (!inheritSettings && existingResearchTopic) {
        // Reset to defaults when inheritance is turned off in branch mode
        setTone('');
        setVisualStyle('');
        setLengthLevel(2);
        setImageDensity(2);
        setTechLevel(2);
        setTargetWordCount('');
        setCaseStudyCount('');
        setFrontCoverPrompt('');
        setBackCoverPrompt('');
        setCustomSpec(Y_IT_NANO_BOOK_SPEC);
        setModelHierarchy(IMAGE_MODELS.map(m => m.id as ImageModelID));
    }
  }, [inheritSettings, defaultSettings, existingResearchTopic]);

  // If in branch mode, topic is fixed
  useEffect(() => {
    if (existingResearchTopic) setTopic(existingResearchTopic);
  }, [existingResearchTopic]);

  const validateInputs = (): boolean => {
    if (!topic.trim()) {
        setValidationError("Please enter a research topic.");
        return false;
    }
    if (topic.length > 100) {
        setValidationError("Topic is too long.");
        return false;
    }
    if (targetWordCount !== '' && (targetWordCount < 100 || targetWordCount > 2000)) {
        setValidationError("Target word count must be between 100 and 2000.");
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
    if (isLocalSubmitting || isLoading) return;

    if (validateInputs()) {
      setIsLocalSubmitting(true);
      
      const settings: GenSettings = {
          tone,
          visualStyle,
          lengthLevel,
          imageDensity,
          techLevel,
          targetWordCount: targetWordCount === '' ? undefined : targetWordCount,
          caseStudyCount: caseStudyCount === '' ? undefined : caseStudyCount,
          frontCoverPrompt,
          backCoverPrompt,
          customSpec: showConfig ? customSpec : undefined,
          imageModelHierarchy: modelHierarchy
      };
      
      onGenerate(topic, settings);
    }
  };

  const moveModel = (index: number, direction: 'up' | 'down') => {
      const newHierarchy = [...modelHierarchy];
      if (direction === 'up' && index > 0) {
          [newHierarchy[index], newHierarchy[index - 1]] = [newHierarchy[index - 1], newHierarchy[index]];
      } else if (direction === 'down' && index < newHierarchy.length - 1) {
          [newHierarchy[index], newHierarchy[index + 1]] = [newHierarchy[index + 1], newHierarchy[index]];
      }
      setModelHierarchy(newHierarchy);
      if (inheritSettings) setInheritSettings(false);
  };

  const getLabelForSlider = (val: number, labels: string[]) => labels[val - 1];
  const isProcessing = isLoading || isLocalSubmitting;

  return (
    <div className={`flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden ${existingResearchTopic ? 'min-h-0' : 'min-h-screen'}`}>
      
      {/* Background only on initial screen */}
      {!existingResearchTopic && (
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-[128px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900 rounded-full blur-[128px]"></div>
          </div>
      )}

      <div className="z-10 max-w-3xl w-full text-center space-y-6 animate-fadeIn">
        
        {!existingResearchTopic ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="bg-yellow-500 text-black px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm">
                  Y-It Engine v3.0
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
                Expose the <span className="text-yellow-500">Hustle</span>.
              </h1>
              <p className="text-xl text-gray-400 max-w-lg mx-auto">
                Enter any internet side hustle. We'll generate a ruthlessly honest research dossier and multiple book variations.
              </p>
            </div>
        ) : (
            <div className="bg-gray-900/80 p-6 rounded-xl border border-yellow-500/30">
                <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
                    <GitBranch size={24} />
                    <h2 className="text-xl font-bold">Create New Branch</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                    Generate a distinct variation of the book using the existing research for 
                    <span className="text-white font-bold mx-1">"{existingResearchTopic}"</span>.
                </p>
                {defaultSettings && (
                   <div className="flex items-center justify-center gap-3">
                       <label className="flex items-center cursor-pointer relative">
                            <input 
                                type="checkbox" 
                                checked={inheritSettings} 
                                onChange={(e) => setInheritSettings(e.target.checked)} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                            <span className="ml-3 text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Copy size={14}/> Inherit Original Settings
                            </span>
                       </label>
                   </div>
                )}
            </div>
        )}

        <form onSubmit={handleSubmit} className="relative w-full space-y-6">
          {!existingResearchTopic && (
              <div className="relative max-w-lg mx-auto">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Dropshipping, Dog Walking..."
                  className={`w-full bg-gray-900 border ${validationError ? 'border-red-500' : 'border-gray-800'} text-white px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg shadow-2xl`}
                  disabled={isProcessing}
                />
              </div>
          )}

            <button
              type="submit"
              disabled={isProcessing || !topic.trim()}
              className={`mx-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-500/20`}
            >
              {isProcessing ? (
                <span className="animate-pulse">Processing...</span>
              ) : existingResearchTopic ? (
                <>
                  <Plus size={20} />
                  <span>Generate New Draft Branch</span>
                </>
              ) : (
                <>
                  <Search size={20} />
                  <span>Start Investigation</span>
                </>
              )}
            </button>
          
          {validationError && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm animate-shake">
                  <AlertCircle size={16} />
                  <span>{validationError}</span>
              </div>
          )}

          {/* Configuration Toggle */}
          <div className="w-full max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mx-auto mb-4 hover:bg-gray-900 px-4 py-2 rounded-full"
            >
              <Settings size={16} />
              {showConfig ? "Hide Settings" : "Customize Settings (Tone, Specs, Covers)"}
              {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 animate-slideDown backdrop-blur-sm text-left shadow-2xl h-[500px] overflow-y-auto custom-scrollbar">
                 
                 {/* Sliders */}
                 <div className="md:col-span-2 space-y-6 bg-black/40 p-4 rounded-xl border border-gray-800">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        <Sliders size={14} className="text-orange-500"/> Dimensions & Physics
                    </label>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>Length</span>
                            <span className="text-yellow-500 font-bold">{getLabelForSlider(lengthLevel, ['Nano', 'Standard', 'Deep'])}</span>
                        </div>
                        <input type="range" min="1" max="3" step="1" value={lengthLevel} onChange={(e) => { setLengthLevel(parseInt(e.target.value)); if(inheritSettings) setInheritSettings(false); }} className="w-full h-2 bg-gray-700 rounded-lg accent-yellow-500" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>Image Density</span>
                            <span className="text-purple-500 font-bold">{getLabelForSlider(imageDensity, ['Text', 'Balanced', 'Heavy'])}</span>
                        </div>
                        <input type="range" min="1" max="3" step="1" value={imageDensity} onChange={(e) => { setImageDensity(parseInt(e.target.value)); if(inheritSettings) setInheritSettings(false); }} className="w-full h-2 bg-gray-700 rounded-lg accent-purple-500" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>Visual Tech</span>
                            <span className="text-blue-500 font-bold">{getLabelForSlider(techLevel, ['Artistic', 'Hybrid', 'Technical'])}</span>
                        </div>
                        <input type="range" min="1" max="3" step="1" value={techLevel} onChange={(e) => { setTechLevel(parseInt(e.target.value)); if(inheritSettings) setInheritSettings(false); }} className="w-full h-2 bg-gray-700 rounded-lg accent-blue-500" />
                    </div>
                 </div>

                 {/* Generator Hierarchy */}
                 <div className="md:col-span-2 space-y-4 bg-black/40 p-4 rounded-xl border border-gray-800">
                     <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                         <Upload size={14} className="text-green-500"/> Generator Hierarchy (Fallback Order)
                     </label>
                     <div className="space-y-2">
                         {modelHierarchy.map((modelId, index) => {
                             const modelInfo = IMAGE_MODELS.find(m => m.id === modelId);
                             return (
                                 <div key={modelId} className="flex items-center justify-between bg-gray-800 p-2 rounded text-sm border border-gray-700">
                                     <div className="flex items-center gap-2">
                                         <span className="bg-gray-700 text-gray-400 w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono">{index + 1}</span>
                                         <span>{modelInfo?.name || modelId}</span>
                                     </div>
                                     <div className="flex gap-1">
                                         <button 
                                            type="button" 
                                            onClick={() => moveModel(index, 'up')} 
                                            disabled={index === 0}
                                            className="p-1 hover:bg-gray-600 rounded disabled:opacity-30"
                                         >
                                             <ArrowUp size={14} />
                                         </button>
                                         <button 
                                            type="button" 
                                            onClick={() => moveModel(index, 'down')} 
                                            disabled={index === modelHierarchy.length - 1}
                                            className="p-1 hover:bg-gray-600 rounded disabled:opacity-30"
                                         >
                                             <ArrowDown size={14} />
                                         </button>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>

                 {/* Cover Art */}
                 <div className="md:col-span-2 space-y-4 bg-black/40 p-4 rounded-xl border border-gray-800">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <ImageIcon size={14} className="text-pink-500"/> Cover Art Studio
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea value={frontCoverPrompt} onChange={(e) => { setFrontCoverPrompt(e.target.value); if(inheritSettings) setInheritSettings(false); }} placeholder="Front Cover Prompt..." className="w-full h-20 bg-black border border-gray-700 rounded p-2 text-xs" />
                        <textarea value={backCoverPrompt} onChange={(e) => { setBackCoverPrompt(e.target.value); if(inheritSettings) setInheritSettings(false); }} placeholder="Back Cover Prompt..." className="w-full h-20 bg-black border border-gray-700 rounded p-2 text-xs" />
                    </div>
                 </div>

                 {/* Numbers Override */}
                 <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-gray-800">
                    <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Hash size={14} className="text-red-500"/> Constraints
                    </label>
                    <input type="number" min="100" max="2000" placeholder="Target Words (e.g. 500)" value={targetWordCount} onChange={(e) => { setTargetWordCount(e.target.value ? parseInt(e.target.value) : ''); if(inheritSettings) setInheritSettings(false); }} className="bg-black border border-gray-700 rounded p-2 text-sm" />
                    <input type="number" min="1" max="50" placeholder="Case Studies (e.g. 15)" value={caseStudyCount} onChange={(e) => { setCaseStudyCount(e.target.value ? parseInt(e.target.value) : ''); if(inheritSettings) setInheritSettings(false); }} className="bg-black border border-gray-700 rounded p-2 text-sm" />
                 </div>

                 {/* Tone & Visual */}
                 <textarea value={tone} onChange={(e) => { setTone(e.target.value); if(inheritSettings) setInheritSettings(false); }} placeholder="Narrative Tone..." className="h-24 bg-black/80 border border-gray-700 rounded p-4 text-xs" />
                 <textarea value={visualStyle} onChange={(e) => { setVisualStyle(e.target.value); if(inheritSettings) setInheritSettings(false); }} placeholder="Visual Style..." className="h-24 bg-black/80 border border-gray-700 rounded p-4 text-xs" />

                 {/* Spec */}
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 mb-2">Base Spec</label>
                    <textarea value={customSpec} onChange={(e) => { setCustomSpec(e.target.value); if(inheritSettings) setInheritSettings(false); }} className="w-full h-32 bg-black/80 border border-gray-700 rounded p-4 text-[10px] font-mono text-gray-400" />
                 </div>
              </div>
            )}
          </div>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default InputSection;