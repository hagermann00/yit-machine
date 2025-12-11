
import React, { useState } from 'react';
import InputSection from './components/InputSection';
import Loader from './components/Loader';
import ResearchDashboard from './components/ResearchDashboard';
import BookReader from './components/BookReader';
import { generateBookContent } from './services/geminiService';
import { GeneratedContent, AppState, Book } from './types';
import { BookOpen, PieChart, FileText, ArrowLeft, Download, ChevronDown } from 'lucide-react';
import { downloadPdf } from './utils/pdfExport';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('INPUT');
  const [data, setData] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<'RESEARCH' | 'BOOK'>('RESEARCH');
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleGenerate = async (
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
  ) => {
    setState('GENERATING');
    setError(null);
    try {
      const result = await generateBookContent(
          topic, 
          customSpec, 
          tone, 
          visualStyle, 
          lengthLevel, 
          imageDensity, 
          techLevel, 
          targetWordCount, 
          caseStudyCount,
          frontCoverPrompt,
          backCoverPrompt,
          frontCoverImage,
          backCoverImage
      );
      setData(result);
      setState('RESULT');
    } catch (err) {
      console.error(err);
      setError("Failed to investigate topic. Please try again with a simpler topic or check your API limit.");
      setState('INPUT');
    }
  };

  const handleReset = () => {
    setState('INPUT');
    setData(null);
    setActiveTab('RESEARCH');
  };

  const updateBook = (updatedBook: Book) => {
    if (data) {
        setData({ ...data, book: updatedBook });
    }
  };

  const handleExportPdf = () => {
    if (data?.book) {
        downloadPdf(data.book);
        setShowExportMenu(false);
    }
  };

  const handleExportJson = () => {
    if (data) {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(data, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "y-it-data.json";
        link.click();
        setShowExportMenu(false);
    }
  };

  if (state === 'INPUT') {
    return (
      <>
        {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-bounce">
                <span>⚠️ {error}</span>
            </div>
        )}
        <InputSection onGenerate={handleGenerate} isLoading={false} />
      </>
    );
  }

  if (state === 'GENERATING') {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
            <button 
                onClick={handleReset}
                className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
                <ArrowLeft size={16} /> New Investigation
            </button>
            <div className="h-6 w-px bg-gray-800"></div>
            <h1 className="font-bold text-gray-100 hidden md:block truncate max-w-xs">{data?.book.title}</h1>
        </div>
        
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            <button 
                onClick={() => setActiveTab('RESEARCH')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'RESEARCH' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <PieChart size={14} /> Intel
            </button>
            <button 
                onClick={() => setActiveTab('BOOK')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'BOOK' ? 'bg-yellow-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <BookOpen size={14} /> Book
            </button>
        </div>

        <div className="relative">
            <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="text-gray-500 hover:text-white transition-colors flex items-center gap-1" 
                title="Export"
            >
                <Download size={20} />
                <ChevronDown size={14} />
            </button>
            
            {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 z-50">
                    <button 
                        onClick={handleExportPdf}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 text-gray-300 hover:text-white"
                    >
                        Download KDP PDF (6x9")
                    </button>
                    <button 
                         onClick={handleExportJson}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 text-gray-300 hover:text-white"
                    >
                        Export Raw JSON
                    </button>
                </div>
            )}
        </div>
      </header>

      {/* Main View */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {data && (
            <>
                {activeTab === 'RESEARCH' ? (
                    <ResearchDashboard data={data.research} />
                ) : (
                    <BookReader 
                        book={data.book} 
                        visualStyle={data.settings.visualStyle} 
                        onUpdateBook={updateBook} 
                    />
                )}
            </>
        )}
      </main>
    </div>
  );
};

export default App;
