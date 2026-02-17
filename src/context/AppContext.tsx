import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppData, Settings } from '../types';
import { storage } from '../utils/storage';

interface AppContextType {
    data: AppData;
    settings: Settings;
    updateData: (newData: Partial<AppData>) => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
    exportData: () => void;
    importData: (file: File) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<AppData>(storage.getData());
    const [settings, setSettings] = useState<Settings>(storage.getSettings());

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    const updateData = (newData: Partial<AppData>) => {
        const updated = { ...data, ...newData };
        setData(updated);
        storage.saveData(updated);
    };

    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        storage.saveSettings(updated);
    };

    const exportData = () => {
        const jsonString = storage.exportData();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importData = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (storage.importData(content)) {
                    const newData = storage.getData();
                    setData(newData);
                    setSettings(newData.settings);
                    alert('Veriler başarıyla içe aktarıldı!');
                } else {
                    alert('Hata: Geçersiz veri formatı');
                }
            } catch (error) {
                alert('Hata: Dosya okunamadı');
            }
        };
        reader.readAsText(file);
    };

    return (
        <AppContext.Provider
            value={{
                data,
                settings,
                updateData,
                updateSettings,
                exportData,
                importData,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
