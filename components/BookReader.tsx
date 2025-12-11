
import React, { useState } from 'react';
import { Book, Chapter, VisualElement } from '../types';
import { ChevronLeft, ChevronRight, Image as ImageIcon, BarChart2, AlertCircle, Wand2, RefreshCw, Edit3, Upload, X, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateImage, editImage } from '../services/geminiService';

interface Props {
  book: Book;
  visualStyle?: string;
  onUpdateBook: (updatedBook: Book) => void;
}

const BookReader: React.FC<Props> = ({ book, visualStyle, onUpdateBook }) => {
  // Use -1 for Front Cover, chapters.length for Back Cover
  const [activePageIndex, setActivePageIndex] = useState(-1);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  
  // Track which visual is currently being "Studio Edited"
  // Key format: "chapterIndex-visualIndex" or "cover-front" / "cover-back"
  const [expandedStudioKey, setExpandedStudioKey] = useState<string | null>(null);
  
  // State for the studio inputs
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioMode, setStudioMode] = useState<'GENERATE' | 'EDIT' | 'UPLOAD'>('GENERATE');

  const isFrontCover = activePageIndex === -1;
  const isBackCover = activePageIndex === book.chapters.length;
  const activeChapterIndex = (!isFrontCover && !isBackCover) ? activePageIndex : null;
  const activeChapter = activeChapterIndex !== null ? book.chapters[activeChapterIndex] : null;

  const toggleStudio = (key: string, defaultPrompt: string) => {
    if (expandedStudioKey === key) {
        setExpandedStudioKey(null);
    } else {
        setExpandedStudioKey(key);
        setStudioPrompt(defaultPrompt);
        setStudioMode('GENERATE'); // Default to Generate
    }
  };

  const handleStudioAction = async (key: string, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
      // Prevent double click/execution if already generating this key
      if (generatingImages[key]) return;

      setGeneratingImages(prev => ({ ...prev, [key]: true }));
      
      try {
        let imageUrl = "";
        
        // 1. Upload Logic is handled instantly by file input, so this action is for Gen/Edit
        if (studioMode === 'GENERATE') {
             // High Res Generation
             imageUrl = await generateImage(studioPrompt, visualStyle, true); // true = High Res
        } else if (studioMode === 'EDIT') {
             // Image Editing
             // Need current image.
             let currentImage = "";
             if (chapterIndex === 'front') currentImage = book.frontCover?.imageUrl || "";
             else if (chapterIndex === 'back') currentImage = book.backCover?.imageUrl || "";
             else if (typeof chapterIndex === 'number' && visualIndex !== undefined) {
                 currentImage = book.chapters[chapterIndex].visuals?.[visualIndex].imageUrl || "";
             }

             if (!currentImage) {
                 alert("Cannot edit - no image exists yet. Generate one first.");
                 setGeneratingImages(prev => ({ ...prev, [key]: false }));
                 return;
             }
             
             imageUrl = await editImage(currentImage, studioPrompt);
        }

        // Update Book State
        const newBook = JSON.parse(JSON.stringify(book)) as Book;
        
        if (chapterIndex === 'front' && newBook.frontCover) {
            newBook.frontCover.imageUrl = imageUrl;
             // Update description if it was a total regen to match logic? No, keep original "concept" but maybe update local prompt?
        } else if (chapterIndex === 'back' && newBook.backCover) {
            newBook.backCover.imageUrl = imageUrl;
        } else if (typeof chapterIndex === 'number' && visualIndex !== undefined) {
            if (newBook.chapters[chapterIndex].visuals) {
                newBook.chapters[chapterIndex].visuals![visualIndex].imageUrl = imageUrl;
                // Ideally update description too if changed significantly
            }
        }
        
        onUpdateBook(newBook);
        setExpandedStudioKey(null); // Close studio on success

      } catch (e) {
          console.error("Studio action failed", e);
          alert("Action failed. Please try again.");
      } finally {
          setGeneratingImages(prev => ({ ...prev, [key]: false }));
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              const newBook = JSON.parse(JSON.stringify(book)) as Book;
              
              if (chapterIndex === 'front' && newBook.frontCover) {
                  newBook.frontCover.imageUrl = result;
              } else if (chapterIndex === 'back' && newBook.backCover) {
                  newBook.backCover.imageUrl = result;
              } else if (typeof chapterIndex === 'number' && visualIndex !== undefined) {
                  if (newBook.chapters[chapterIndex].visuals) {
                      newBook.chapters[chapterIndex].visuals![visualIndex].imageUrl = result;
                  }
              }
              onUpdateBook(newBook);
              setExpandedStudioKey(null);
          };
          reader.readAsDataURL(file);
      }
  };

  const renderStudioPanel = (key: string, chapterIndex: number | 'front' | 'back', visualIndex?: number) => {
      if (expandedStudioKey !== key) return null;
      
      const isGenerating = generatingImages[key];

      return (
          <div className="mt-4 p-4 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 animate-slideDown z-20 relative">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Zap size={14} className="text-yellow-500"/>
                      Image Studio (Pro)
                  </h4>
                  <button onClick={() => setExpandedStudioKey(null)} className="text-gray-400 hover:text-white"><X size={16}/></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setStudioMode('GENERATE')}
                    className={`px-3 py-1 rounded text-xs font-bold ${studioMode === 'GENERATE' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Regenerate (High Res)
                  </button>
                  <button 
                    onClick={() => setStudioMode('EDIT')}
                    className={`px-3 py-1 rounded text-xs font-bold ${studioMode === 'EDIT' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Edit Existing (AI)
                  </button>
                  <button 
                    onClick={() => setStudioMode('UPLOAD')}
                    className={`px-3 py-1 rounded text-xs font-bold ${studioMode === 'UPLOAD' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Upload File
                  </button>
              </div>

              {/* Content */}
              {studioMode !== 'UPLOAD' ? (
                  <div className="space-y-3">
                      <textarea
                          value={studioPrompt}
                          onChange={(e) => setStudioPrompt(e.target.value)}
                          placeholder={studioMode === 'GENERATE' ? "Describe the image..." : "Describe changes (e.g. 'Make it darker', 'Add a robot')..."}
                          className="w-full h-24 bg-black border border-gray-700 rounded p-3 text-sm focus:border-yellow-500 focus:outline-none"
                      />
                      <button
                          onClick={() => handleStudioAction(key, chapterIndex, visualIndex)}
                          disabled={isGenerating}
                          className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 ${
                              studioMode === 'GENERATE' ? 'bg-white text-black hover:bg-gray-200' : 'bg-purple-600 text-white hover:bg-purple-500'
                          } disabled:opacity-50`}
                      >
                          {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
                          {isGenerating ? "Processing..." : (studioMode === 'GENERATE' ? "Generate High Quality (2K)" : "Apply AI Edits")}
                      </button>
                      <p className="text-[10px] text-gray-500 text-center">
                          Powered by Gemini Pro Vision (Nano Banana Pro). Optimized for KDP 6x9 Print.
                      </p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer relative">
                          <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, chapterIndex, visualIndex)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Upload className="mx-auto mb-2 text-gray-500" size={24} />
                          <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
                          <p className="text-[10px] text-gray-600 mt-1">Recommended: 1800x2700px (300dpi) for full page</p>
                      </div>
                  </div>
              )}
          </div>
      )
  };

  const renderVisual = (visual: VisualElement, vIdx: number, chapterIndex: number) => {
    const key = `${chapterIndex}-${vIdx}`;
    // We only use isGenerating here for the Quick Regen button if implemented, but Studio handles its own state mostly
    // We can still use the global generatingImages to lock UI
    
    return (
        <div key={key} className="my-8 group relative">
             {visual.imageUrl ? (
                 <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-100 relative">
                     <img src={visual.imageUrl} alt={visual.description} className="w-full h-auto object-cover" />
                     {visual.caption && <div className="bg-gray-100 p-2 text-xs text-gray-500 text-center italic border-t border-gray-200">{visual.caption}</div>}
                 </div>
             ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 flex flex-col items-center text-center space-y-4 hover:border-yellow-500 transition-colors">
                    {visual.type === 'CHART' ? <BarChart2 size={32} className="text-gray-400" /> : 
                     visual.type === 'HERO' ? <ImageIcon size={32} className="text-gray-400" /> :
                     <AlertCircle size={32} className="text-gray-400" />}
                    
                    <div className="space-y-1">
                        <div className="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">{visual.type} PLACEHOLDER</div>
                        <p className="font-serif text-sm text-gray-700 italic max-w-lg mx-auto">"{visual.description}"</p>
                    </div>
                </div>
             )}

             {/* Studio Toggle Button (Always visible on hover or if no image) */}
             <div className="mt-2 flex justify-center">
                 <button 
                    onClick={() => toggleStudio(key, visual.description)}
                    className="flex items-center gap-2 text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-full shadow hover:bg-yellow-500 hover:text-black transition-colors"
                 >
                     <Edit3 size={12} /> {expandedStudioKey === key ? "Close Studio" : "Open Image Studio"}
                 </button>
             </div>

             {/* The Expandable Studio Panel */}
             {renderStudioPanel(key, chapterIndex, vIdx)}
        </div>
    );
  };

  const renderCover = (isFront: boolean) => {
    const coverData = isFront ? book.frontCover : book.backCover;
    const key = isFront ? 'cover-front' : 'cover-back';
    
    if (!coverData) return <div className="p-20 text-center">Cover data unavailable</div>;

    return (
        <div className="max-w-xl mx-auto py-10">
            <div className="aspect-[6/9] bg-gray-900 shadow-2xl rounded-sm relative flex flex-col overflow-hidden group">
                {coverData.imageUrl ? (
                     <img src={coverData.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity" />
                ) : (
                     <div className="absolute inset-0 bg-[#F5B700] flex flex-col items-center justify-center p-8 text-center border-[16px] border-black">
                        <div className="bg-black text-white px-4 py-2 font-mono text-xs mb-4 uppercase tracking-widest">
                            Y-It Cover Concept
                        </div>
                        <p className="font-serif text-black text-lg italic leading-tight max-w-sm">
                            "{coverData.visualDescription}"
                        </p>
                     </div>
                )}
                
                {/* Text Overlay */}
                <div className="relative z-10 p-8 h-full flex flex-col justify-between pointer-events-none">
                    {isFront ? (
                        <>
                             <div className="text-center space-y-4 pt-10">
                                <h1 className="font-serif text-5xl font-bold text-white leading-tight drop-shadow-xl border-b-4 border-yellow-500 pb-4 inline-block">
                                    {coverData.titleText || book.title}
                                </h1>
                                <p className="font-sans text-xl text-gray-200 tracking-wide font-light drop-shadow-md">
                                    {coverData.subtitleText || book.subtitle}
                                </p>
                             </div>
                             <div className="text-center text-gray-400 font-mono text-xs tracking-[0.2em] pb-4">
                                Y-IT ENGINE SERIES
                             </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center text-gray-400 font-mono text-xs tracking-[0.2em] pt-4">
                                EXPOSED TRUTHS
                            </div>
                            <div className="bg-black/70 p-6 backdrop-blur-sm border border-gray-700">
                                <p className="text-white font-serif text-lg leading-relaxed text-center">
                                    "{coverData.blurb || "Read the book that exposes the truth behind the hustle."}"
                                </p>
                            </div>
                            <div className="text-center pb-4">
                                <div className="inline-block bg-white p-2">
                                    <div className="h-8 w-32 bg-black repeating-linear-gradient"></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="mt-4 text-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isFront ? 'Front Cover' : 'Back Cover'}</h3>
                <p className="text-sm text-gray-500 mt-1 italic mb-4">{coverData.visualDescription}</p>
                
                 {/* Studio Toggle Button */}
                 <button 
                    onClick={() => toggleStudio(key, coverData.visualDescription)}
                    className="flex items-center gap-2 text-xs font-bold bg-gray-900 text-white px-4 py-2 rounded-full shadow hover:bg-yellow-500 hover:text-black transition-colors mx-auto"
                 >
                     <Edit3 size={12} /> {expandedStudioKey === key ? "Close Cover Studio" : "Open Cover Studio"}
                 </button>

                 {/* Studio Panel for Cover */}
                 <div className="text-left">
                    {renderStudioPanel(key, isFront ? 'front' : 'back')}
                 </div>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] bg-white text-gray-900 overflow-hidden rounded-xl shadow-2xl">
      {/* Sidebar TOC */}
      <div className="w-full lg:w-72 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
            <h2 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-1">Y-It Nano-Book</h2>
            <h1 className="font-serif font-bold text-xl leading-tight">{book.title}</h1>
        </div>
        <nav className="p-2 space-y-1">
             <button
                onClick={() => setActivePageIndex(-1)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                    activePageIndex === -1
                    ? 'bg-gray-800 text-white font-semibold' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
            >
                <ImageIcon size={14} /> Front Cover
            </button>

            {book.chapters.map((chapter, idx) => (
                <button
                    key={chapter.number}
                    onClick={() => setActivePageIndex(idx)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                        activePageIndex === idx 
                        ? 'bg-yellow-100 text-yellow-900 font-semibold' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                >
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-mono shrink-0">
                        {chapter.number}
                    </span>
                    <span className="truncate">{chapter.title}</span>
                    {chapter.title.includes("ROADMAP") && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200 ml-auto">FREE</span>}
                </button>
            ))}

            <button
                onClick={() => setActivePageIndex(book.chapters.length)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                    activePageIndex === book.chapters.length
                    ? 'bg-gray-800 text-white font-semibold' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
            >
                <ImageIcon size={14} /> Back Cover
            </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-white relative scroll-smooth" id="reader-content">
        <div className="max-w-3xl mx-auto p-8 lg:p-16 min-h-full">
            
            {/* Conditional Rendering */}
            {isFrontCover ? (
                renderCover(true)
            ) : isBackCover ? (
                renderCover(false)
            ) : activeChapter ? (
                <>
                    {/* Chapter Header */}
                    <div className="mb-12 text-center border-b pb-8">
                        <span className="font-mono text-sm text-gray-400 uppercase tracking-widest">Chapter {activeChapter.number}</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-2 text-gray-900">{activeChapter.title}</h2>
                    </div>

                    {/* Visuals: Top (Hero) */}
                    {activeChapter.visuals?.map((v, idx) => v.type === 'HERO' ? renderVisual(v, idx, activePageIndex) : null)}

                    {/* Content Body with PosiBot Injection */}
                    <div className="font-serif text-lg leading-relaxed text-gray-800 space-y-6 relative">
                        {/* PosiBot */}
                        {activeChapter.posiBotQuotes?.map((quote, qIdx) => (
                            <div 
                                key={qIdx}
                                className={`
                                    my-8 lg:my-0 lg:w-48 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg
                                    lg:absolute lg:${quote.position === 'RIGHT' ? '-right-56' : '-left-56'}
                                    transform rotate-1 flex flex-col items-center text-center
                                `}
                                style={{ top: `${(qIdx + 1) * 300}px` }} 
                            >
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl mb-2 shadow-inner">
                                    🤖
                                </div>
                                <p className="font-sans text-xs font-bold text-blue-800 uppercase leading-snug">
                                    "{quote.text}"
                                </p>
                            </div>
                        ))}

                        {/* Markdown Content */}
                        <div className="prose prose-lg prose-headings:font-sans prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-black">
                            <ReactMarkdown>{activeChapter.content}</ReactMarkdown>
                        </div>
                        
                        {/* Visuals: In-content (Charts/Diagrams) */}
                        {activeChapter.visuals?.map((v, idx) => v.type !== 'HERO' ? renderVisual(v, idx, activePageIndex) : null)}
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Select a chapter</div>
            )}

            {/* Navigation Footer */}
            <div className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center text-sm font-sans">
                <button 
                    disabled={isFrontCover}
                    onClick={() => {
                        setActivePageIndex(prev => prev - 1);
                        document.getElementById('reader-content')?.scrollTo(0,0);
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-gray-300">
                    {isFrontCover ? "Cover" : isBackCover ? "Back" : `Page ${activePageIndex + 1}`}
                </span>
                <button 
                    disabled={isBackCover}
                    onClick={() => {
                        setActivePageIndex(prev => prev + 1);
                        document.getElementById('reader-content')?.scrollTo(0,0);
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookReader;
