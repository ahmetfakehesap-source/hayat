import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppData, Settings } from '../types';
import { storage } from '../utils/storage';

import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

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

    // Monitor Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // User logged in: Subscribe to Firestore
                const docRef = doc(db, 'users', currentUser.uid);

                // Check if user has data in Firestore
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    // First time login? Offer to migrate local data
                    const localData = storage.getData();
                    // We can't verify window.confirm in non-interactive environments easily, 
                    // but for a personal app this is fine. 
                    // Ideally we'd use a custom modal, but keeping it simple for now.
                    // For the "Silent Sync" request, we might just do it automatically or ask once.
                    // User asked for "automatic", so let's default to syncing local data if cloud is empty.
                    await setDoc(docRef, localData);
                }

                // Real-time listener
                const unsubFirestore = onSnapshot(docRef, (doc) => {
                    if (doc.exists()) {
                        const cloudData = doc.data() as AppData;
                        setData(cloudData);
                        setSettings(cloudData.settings);
                        // Also update local storage as backup/cache
                        storage.saveData(cloudData);
                    }
                });

                return () => unsubFirestore();
            } else {
                // User logged out: Revert to Local Storage
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

    const updateData = async (newData: Partial<AppData>) => {
        const updated = { ...data, ...newData };
        setData(updated);

        // Save to Local Storage always (for offline/backup)
        storage.saveData(updated);

        // If logged in, save to Firestore
        if (user) {
            try {
                const docRef = doc(db, 'users', user.uid);
                await setDoc(docRef, updated, { merge: true });
            } catch (error) {
                console.error("Error syncing to cloud:", error);
            }
        }
    };

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
