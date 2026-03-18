import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppData, Settings } from '../types';
import { storage } from '../utils/storage';

import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AppContextType {
    data: AppData;
    settings: Settings;
    user: User | null;
    updateData: (newData: Partial<AppData>) => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
    exportData: () => void;
    importData: (file: File) => void;
    googleLogin: () => Promise<void>;
    logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [data, setData] = useState<AppData>(storage.getData());
    const [settings, setSettings] = useState<Settings>(storage.getSettings());

    // Ref to hold the latest data for use in callbacks (prevents stale closure)
    const dataRef = useRef<AppData>(data);
    useEffect(() => { dataRef.current = data; }, [data]);
    // Track if we already loaded cloud data for this session
    const cloudLoadedRef = useRef(false);

    // Monitor Auth State - ONE-TIME load from Firestore, NO real-time listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser && !cloudLoadedRef.current) {
                cloudLoadedRef.current = true;
                const docRef = doc(db, 'users', currentUser.uid);

                try {
                    const docSnap = await getDoc(docRef);
                    const localData = storage.getData();
                    const localTimestamp = (localData as any).lastUpdated || 0;

                    if (docSnap.exists()) {
                        const cloudData = docSnap.data() as AppData;
                        const cloudTimestamp = (cloudData as any).lastUpdated || 0;

                        if (localTimestamp > cloudTimestamp) {
                            // Local is newer (F5 before cloud write completed) - keep local, push to cloud
                            console.log('Local data is newer, pushing to cloud');
                            setData(localData);
                            dataRef.current = localData;
                            if (localData.settings) setSettings(localData.settings);
                            await setDoc(docRef, localData);
                        } else {
                            // Cloud is newer or equal - use cloud data
                            console.log('Cloud data is newer, using cloud');
                            setData(cloudData);
                            dataRef.current = cloudData;
                            if (cloudData.settings) setSettings(cloudData.settings);
                            storage.saveData(cloudData);
                        }
                    } else {
                        // First time: upload local data to cloud
                        await setDoc(docRef, { ...localData, lastUpdated: Date.now() });
                    }
                } catch (error) {
                    console.error("Error loading cloud data:", error);
                    // Fall back to local data (already loaded)
                }
            } else if (!currentUser) {
                cloudLoadedRef.current = false;
                setData(storage.getData());
                setSettings(storage.getSettings());
            }
        });

        return () => unsubscribe();
    }, []);

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    const updateData = useCallback(async (newData: Partial<AppData>) => {
        const updated = { ...dataRef.current, ...newData, lastUpdated: Date.now() } as any;
        setData(updated);
        dataRef.current = updated;

        // Save to Local Storage always
        storage.saveData(updated);

        // If logged in, save to Firestore (write-only, no listener)
        if (auth.currentUser) {
            try {
                const docRef = doc(db, 'users', auth.currentUser.uid);
                await setDoc(docRef, updated);
            } catch (error) {
                console.error("Error syncing to cloud:", error);
            }
        }
    }, []);

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        // Update local storage
        storage.saveSettings(updated);

        // Update data object because settings is part of AppData
        updateData({ settings: updated });
    };

    const googleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed:", error);
            alert("Giriş yapılamadı.");
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            // Revert to local data on logout
            setData(storage.getData());
            setSettings(storage.getSettings());
        } catch (error) {
            console.error("Logout failed:", error);
        }
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
                    updateData(newData); // Handles both local and cloud update
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
                user,
                updateData,
                updateSettings,
                exportData,
                importData,
                googleLogin,
                logout
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
