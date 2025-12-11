import React, { useEffect, useRef } from 'react';
import { Terminal, Activity } from 'lucide-react';

interface AgentStatusProps {
    logs: string[];
    status: string;
}

const AgentStatus: React.FC<AgentStatusProps> = ({ logs, status }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full max-w-2xl mx-auto bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl font-mono text-xs md:text-sm">
            <div className="bg-gray-900 p-2 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                    <Terminal size={14} />
                    <span className="uppercase tracking-widest font-bold">Y-It Forensic Engine</span>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'RESEARCHING' && <Activity size={14} className="text-green-500 animate-pulse" />}
                    <span className={`uppercase font-bold ${status === 'RESEARCHING' || status === 'DRAFTING' ? 'text-green-500' : 'text-gray-500'}`}>
                        {status === 'RESEARCHING' ? 'Active Scan' : status === 'DRAFTING' ? 'Compiling' : 'Standby'}
                    </span>
                </div>
            </div>
            <div
                ref={scrollRef}
                className="h-64 overflow-y-auto p-4 space-y-2 bg-black/90 text-gray-300"
            >
                {logs.length === 0 && <span className="text-gray-600 italic">Initializing system...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                        <span className={log.includes("Error") ? "text-red-500" : log.includes("Complete") ? "text-green-400" : "text-gray-300"}>
                            {log}
                        </span>
                    </div>
                ))}
                {(status === 'RESEARCHING' || status === 'DRAFTING') && (
                    <div className="animate-pulse text-yellow-500">_</div>
                )}
            </div>
        </div>
    );
};

export default AgentStatus;
