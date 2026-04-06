// Contexte global : partage la commande vocale en attente entre les pages
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types de commandes supportées par l’assistant vocal
export type VoiceCommandType = 
  | 'create-skill'
  | 'create-employee'
  | 'create-department'
  | 'create-activity'
  | 'modify-skill'
  | 'modify-employee'
  | 'modify-department'
  | 'delete-skill'
  | 'delete-employee'
  | 'delete-department'
  | 'search-employee'
  | 'search-skill'
  | 'search-department'
  | 'filter-employee'
  | 'filter-skill'
  | 'filter-department'
  | 'view-skill'
  | 'view-employee'
  | 'view-department'
  | null;

// Données additionnelles associées à une commande (nom, département, etc.)
interface VoiceCommandData {
  name?: string;
  description?: string;
  departmentId?: string;
  manager?: string;
  context?: 'Upskilling' | 'Expertise' | 'Development';
  seats?: number;
  id?: string;
}

interface VoiceCommandContextType {
  pendingCommand: VoiceCommandType;
  commandData: VoiceCommandData | null;
  setPendingCommand: (command: VoiceCommandType, data?: VoiceCommandData) => void;
  clearPendingCommand: () => void;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

// Provider : expose pendingCommand et les setters à toute l’app
export const VoiceCommandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingCommand, setPendingCommandState] = useState<VoiceCommandType>(null);
  const [commandData, setCommandData] = useState<VoiceCommandData | null>(null);

  const setPendingCommand = useCallback((command: VoiceCommandType, data?: VoiceCommandData) => {
    setPendingCommandState(command);
    setCommandData(data || null);
  }, []);

  const clearPendingCommand = useCallback(() => {
    setPendingCommandState(null);
    setCommandData(null);
  }, []);

  return (
    <VoiceCommandContext.Provider
      value={{
        pendingCommand,
        commandData,
        setPendingCommand,
        clearPendingCommand,
      }}
    >
      {children}
    </VoiceCommandContext.Provider>
  );
};

// Hook utilitaire pour consommer le contexte dans n’importe quelle page
export const useVoiceCommand = (): VoiceCommandContextType => {
  const context = useContext(VoiceCommandContext);
  if (context === undefined) {
    throw new Error('useVoiceCommand must be used within a VoiceCommandProvider');
  }
  return context;
};
