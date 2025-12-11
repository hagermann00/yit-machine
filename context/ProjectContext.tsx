import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Project, ResearchData, GenSettings, Branch, Book } from '../types';
import { AgentState, ResearchCoordinator } from '../services/orchestrator';
import { AuthorAgent } from '../services/agents/AuthorAgent';

interface State {
  status: 'INPUT' | 'RESEARCHING' | 'DRAFTING' | 'RESULT' | 'ERROR';
  project: Project | null;
  agentStates: AgentState[];
  error: string | null;
  activeBranchId: string | null;
}

type Action =
  | { type: 'START_RESEARCH' }
  | { type: 'UPDATE_AGENTS', payload: AgentState[] }
  | { type: 'START_DRAFTING' }
  | { type: 'RESEARCH_SUCCESS', payload: { topic: string; data: ResearchData; settings: GenSettings; draft: any } }
  | { type: 'SET_ERROR', payload: string }
  | { type: 'RESET' }
  | { type: 'ADD_BRANCH', payload: Branch }
  | { type: 'SET_ACTIVE_BRANCH', payload: string }
  | { type: 'UPDATE_BOOK', payload: { branchId: string, book: Book } };

const initialState: State = {
  status: 'INPUT',
  project: null,
  agentStates: [],
  error: null,
  activeBranchId: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_RESEARCH':
      return { ...state, status: 'RESEARCHING', error: null, agentStates: [] };
    case 'UPDATE_AGENTS':
      return { ...state, agentStates: action.payload };
    case 'START_DRAFTING':
      return { ...state, status: 'DRAFTING' };
    case 'RESEARCH_SUCCESS':
       const firstBranch: Branch = {
          id: Date.now().toString(),
          name: "Original Draft",
          timestamp: Date.now(),
          settings: action.payload.settings,
          book: action.payload.draft
      };
      return {
        ...state,
        status: 'RESULT',
        project: {
          topic: action.payload.topic,
          research: action.payload.data,
          branches: [firstBranch]
        },
        activeBranchId: firstBranch.id
      };
    case 'SET_ERROR':
      return { ...state, status: 'ERROR', error: action.payload };
    case 'RESET':
      return initialState;
    case 'ADD_BRANCH':
      return {
        ...state,
        project: state.project ? {
          ...state.project,
          branches: [...state.project.branches, action.payload]
        } : null,
        activeBranchId: action.payload.id
      };
    case 'SET_ACTIVE_BRANCH':
      return { ...state, activeBranchId: action.payload };
    case 'UPDATE_BOOK':
        if (!state.project) return state;
        const updatedBranches = state.project.branches.map(b =>
            b.id === action.payload.branchId ? { ...b, book: action.payload.book } : b
        );
        return {
            ...state,
            project: { ...state.project, branches: updatedBranches }
        };
    default:
      return state;
  }
};

const ProjectContext = createContext<{
  state: State;
  startInvestigation: (topic: string, settings: GenSettings) => Promise<void>;
  createBranch: (settings: GenSettings) => Promise<void>;
  updateBook: (book: Book) => void;
  resetProject: () => void;
  setActiveBranch: (id: string) => void;
} | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const coordinator = new ResearchCoordinator();
  const author = new AuthorAgent();

  const startInvestigation = async (topic: string, settings: GenSettings) => {
    dispatch({ type: 'START_RESEARCH' });
    try {
      // 1. Research Phase
      const researchData = await coordinator.execute(topic, (agentStates) => {
        dispatch({ type: 'UPDATE_AGENTS', payload: agentStates });
      }) as ResearchData;

      // 2. Drafting Phase
      dispatch({ type: 'START_DRAFTING' });
      const draft = await author.generateDraft(topic, researchData, settings);

      dispatch({ type: 'RESEARCH_SUCCESS', payload: { topic, data: researchData, settings, draft: draft as Book } });
    } catch (e: any) {
      console.error(e);
      dispatch({ type: 'SET_ERROR', payload: e.message || "Investigation failed." });
    }
  };

  const createBranch = async (settings: GenSettings) => {
    if (!state.project) return;
    // Note: We might want a 'CREATING_BRANCH' status in the future for UI feedback
    try {
      const draft = await author.generateDraft(state.project.topic, state.project.research, settings);
      const newBranch: Branch = {
          id: Date.now().toString(),
          name: `Draft ${state.project.branches.length + 1}`,
          timestamp: Date.now(),
          settings: settings,
          book: draft as Book
      };
      dispatch({ type: 'ADD_BRANCH', payload: newBranch });
    } catch (e: any) {
       console.error("Branch generation failed", e);
       // Optional: dispatch error specifically for branch creation
    }
  };

  const updateBook = (book: Book) => {
      if (state.activeBranchId) {
          dispatch({ type: 'UPDATE_BOOK', payload: { branchId: state.activeBranchId, book } });
      }
  };

  const resetProject = () => dispatch({ type: 'RESET' });
  const setActiveBranch = (id: string) => dispatch({ type: 'SET_ACTIVE_BRANCH', payload: id });

  return (
    <ProjectContext.Provider value={{ state, startInvestigation, createBranch, updateBook, resetProject, setActiveBranch }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};
