import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Project, Branch, GenSettings, Book, ResearchData, AppState } from '../types';
import { ResearchCoordinator } from '../services/orchestrator';

// Define the State
interface ProjectState {
    status: AppState;
    project: Project | null;
    activeBranchId: string | null;
    logs: string[];
    error: string | null;
}

// Initial State
const initialState: ProjectState = {
    status: 'INPUT',
    project: null,
    activeBranchId: null,
    logs: [],
    error: null,
};

// Actions
type Action =
    | { type: 'START_RESEARCH'; payload: { topic: string } }
    | { type: 'ADD_LOG'; payload: string }
    | { type: 'RESEARCH_SUCCESS'; payload: { research: ResearchData; topic: string } }
    | { type: 'DRAFT_START' }
    | { type: 'DRAFT_SUCCESS'; payload: { book: Book; settings: GenSettings } }
    | { type: 'ERROR'; payload: string }
    | { type: 'RESET' }
    | { type: 'SET_ACTIVE_BRANCH'; payload: string }
    | { type: 'UPDATE_BOOK'; payload: { book: Book } };

// Reducer
function projectReducer(state: ProjectState, action: Action): ProjectState {
    switch (action.type) {
        case 'START_RESEARCH':
            return {
                ...state,
                status: 'RESEARCHING',
                error: null,
                logs: [`Starting research on: ${action.payload.topic}`],
                project: {
                    topic: action.payload.topic,
                    research: {} as ResearchData, // Placeholder until complete
                    branches: []
                }
            };
        case 'ADD_LOG':
            return {
                ...state,
                logs: [...state.logs, action.payload]
            };
        case 'RESEARCH_SUCCESS':
            return {
                ...state,
                status: 'DRAFTING', // Auto-transition to drafting usually, or pause? App flow suggests drafting immediately.
                project: state.project ? {
                    ...state.project,
                    research: action.payload.research
                } : null
            };
        case 'DRAFT_START':
            return {
                ...state,
                status: 'DRAFTING'
            };
        case 'DRAFT_SUCCESS':
            if (!state.project) return state;
            const newBranch: Branch = {
                id: Date.now().toString(),
                name: state.project.branches.length === 0 ? "Original Draft" : `Draft ${state.project.branches.length + 1}`,
                timestamp: Date.now(),
                settings: action.payload.settings,
                book: action.payload.book
            };
            return {
                ...state,
                status: 'RESULT',
                project: {
                    ...state.project,
                    branches: [...state.project.branches, newBranch]
                },
                activeBranchId: newBranch.id
            };
        case 'ERROR':
            return {
                ...state,
                status: 'INPUT', // Or stay in RESEARCHING with error? Usually reset to input or show error overlay.
                error: action.payload,
                logs: [...state.logs, `Error: ${action.payload}`]
            };
        case 'RESET':
            return initialState;
        case 'SET_ACTIVE_BRANCH':
            return {
                ...state,
                activeBranchId: action.payload
            };
        case 'UPDATE_BOOK':
             if (!state.project || !state.activeBranchId) return state;
             return {
                 ...state,
                 project: {
                     ...state.project,
                     branches: state.project.branches.map(b =>
                         b.id === state.activeBranchId ? { ...b, book: action.payload.book } : b
                     )
                 }
             };
        default:
            return state;
    }
}

// Context
interface ProjectContextType extends ProjectState {
    startProject: (topic: string, settings: GenSettings) => Promise<void>;
    addBranch: (settings: GenSettings) => Promise<void>;
    resetProject: () => void;
    setActiveBranch: (id: string) => void;
    updateActiveBook: (book: Book) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(projectReducer, initialState);

    const coordinator = ResearchCoordinator.getInstance();

    // Hook up the logger
    React.useEffect(() => {
        coordinator.setStatusCallback((msg) => {
            dispatch({ type: 'ADD_LOG', payload: msg });
        });
    }, []);

    const startProject = useCallback(async (topic: string, settings: GenSettings) => {
        dispatch({ type: 'START_RESEARCH', payload: { topic } });
        try {
            // 1. Research
            const research = await coordinator.performResearch(topic, settings.caseStudyCount);
            dispatch({ type: 'RESEARCH_SUCCESS', payload: { research, topic } });

            // 2. Draft
            dispatch({ type: 'DRAFT_START' });
            const book = await coordinator.generateDraft(topic, research, settings);
            dispatch({ type: 'DRAFT_SUCCESS', payload: { book, settings } });

        } catch (error: any) {
            console.error(error);
            dispatch({ type: 'ERROR', payload: error.message || "An unexpected error occurred." });
        }
    }, []);

    const addBranch = useCallback(async (settings: GenSettings) => {
        if (!state.project) return;
        dispatch({ type: 'DRAFT_START' });
        try {
            const book = await coordinator.generateDraft(state.project.topic, state.project.research, settings);
            dispatch({ type: 'DRAFT_SUCCESS', payload: { book, settings } });
        } catch (error: any) {
            dispatch({ type: 'ERROR', payload: error.message });
        }
    }, [state.project]);

    const resetProject = useCallback(() => dispatch({ type: 'RESET' }), []);
    const setActiveBranch = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE_BRANCH', payload: id }), []);
    const updateActiveBook = useCallback((book: Book) => dispatch({ type: 'UPDATE_BOOK', payload: { book } }), []);

    return (
        <ProjectContext.Provider value={{ ...state, startProject, addBranch, resetProject, setActiveBranch, updateActiveBook }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProject must be used within a ProjectProvider");
    }
    return context;
};
