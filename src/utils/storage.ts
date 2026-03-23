import type { AppData, Settings } from '../types';

const STORAGE_KEY = 'lifeos_data';
const SETTINGS_KEY = 'lifeos_settings';

const defaultSettings: Settings = {
    theme: 'light',
    dailyCalorieGoal: 1700, // Ramadan mode
    dailyProteinGoal: 120, // Increased protein focus
    dailyCarbsGoal: 150,
    dailyFatGoal: 50,
    yearlyBookGoal: 9, // Approx 1 book/month or as per user request
    weeklyWorkoutGoal: 2, // 2 days/week walking
    workoutDays: [], // Flexible
    monthlyWorkoutGoal: 8,
};

const defaultData: AppData = {
    tasks: [],
    projects: [],
    calorieEntries: [],
    workoutEntries: [],
    bodyMeasurements: [],
    recipes: [],
    healthProducts: [],
    books: [],
    journalEntries: [],
    investments: [],
    schedule: [],
    goals: [],
    habits: [],
    habitLogs: [],
    settings: defaultSettings,
    customFoods: [],
    recentFoodEntries: [],
};

const DATA_VERSION = 4; // Increment this when default settings change

export const storage = {

    // Get all data
    getData(): AppData {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);

                // version check - if missing or old, merge new defaults
                if (!parsed.version || parsed.version < DATA_VERSION) {
                    console.log('Migrating data to version', DATA_VERSION);
                    const updated = { ...defaultData, ...parsed };

                    // Migration logic for older versions (version 3 updates)
                    if (!parsed.version || parsed.version < 3) {
                        updated.settings = {
                            ...defaultData.settings,
                            ...parsed.settings,
                            dailyCalorieGoal: defaultSettings.dailyCalorieGoal,
                            dailyProteinGoal: defaultSettings.dailyProteinGoal,
                            dailyCarbsGoal: defaultSettings.dailyCarbsGoal,
                            dailyFatGoal: defaultSettings.dailyFatGoal,
                            yearlyBookGoal: defaultSettings.yearlyBookGoal,
                            weeklyWorkoutGoal: defaultSettings.weeklyWorkoutGoal,
                        };
                    }

                    // Migration logic for version 4 (Adding initial user inputs: Tasks, Projects, Habits, Goals)
                    if (!parsed.version || parsed.version < 4) {
                        const dateStr = getLocalDate();

                        // 1. Yeni evin doğalgazını açtır (Görev)
                        if (!updated.tasks.some((t: { title: string }) => t.title.toLowerCase().includes('doğalgaz'))) {
                            updated.tasks.push({
                                id: generateId(),
                                title: 'Yeni evin doğalgazını açtır',
                                completed: false,
                                createdAt: dateStr,
                                category: 'personal'
                            });
                        }

                        // 2. Arbitraj Botu Sistemi (Proje)
                        if (!updated.projects.some((p: { name: string }) => p.name.toLowerCase().includes('arbitraj'))) {
                            updated.projects.push({
                                id: generateId(),
                                name: 'Arbitraj Botu Sistemi (Eldorado, G2G, Gamebus)',
                                startDate: dateStr,
                                endDate: '',
                                status: 'planning',
                                progress: 0,
                                notes: 'Fiyatları karşılaştırarak en karlı al-sat seçeneklerini gösteren sistem.',
                                milestones: []
                            });
                        }

                        // 3. Uzun vadede diş fırçalama (Alışkanlık)
                        if (!updated.habits.some((h: { name: string }) => h.name.toLowerCase().includes('diş'))) {
                            updated.habits.push({
                                id: generateId(),
                                name: 'Diş Fırçalama',
                                type: 'good',
                                createdAt: dateStr,
                                trigger: 'Sabah kahvaltıdan ve gece uyumadan önce'
                            });
                        }

                        // 4. Kilo vermek / Spora Gitmek (Hedef ve Alışkanlık)
                        if (!updated.goals.some((g: { title: string }) => g.title.toLowerCase().includes('kilo'))) {
                            updated.goals.push({
                                id: generateId(),
                                title: 'Kilo Vermek',
                                category: 'health',
                                completed: false,
                                notes: 'Spora düzenli giderek ve beslenmeyi düzene sokarak.'
                            });
                        }
                        if (!updated.habits.some((h: { name: string }) => h.name.toLowerCase().includes('spor'))) {
                            updated.habits.push({
                                id: generateId(),
                                name: 'Spora Gitmek',
                                type: 'good',
                                createdAt: dateStr,
                                trigger: 'Gün içindeki işler veya hedefler bittikten sonra vs.'
                            });
                        }

                        // 5. Robux Satışına Başla (Görev)
                        if (!updated.tasks.some((t: { title: string }) => t.title.toLowerCase().includes('robux'))) {
                            updated.tasks.push({
                                id: generateId(),
                                title: 'Robux satışına başla (Eksikler tamam, her şey hazır)',
                                completed: false,
                                createdAt: dateStr,
                                category: 'work'
                            });
                        }
                    }

                    updated.version = DATA_VERSION;
                    (updated as any).lastUpdated = Date.now();
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    } catch (e) {}
                    return updated;
                }

                return { ...defaultData, ...parsed };
            }
            return { ...defaultData, version: DATA_VERSION };
        } catch (error) {
            console.error('Error loading data:', error);
            return { ...defaultData, version: DATA_VERSION };
        }
    },

    // Save all data
    saveData(data: AppData): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    },

    // Get specific category
    getCategory<K extends keyof AppData>(category: K): AppData[K] {
        const data = this.getData();
        return data[category];
    },

    // Save specific category
    saveCategory<K extends keyof AppData>(category: K, value: AppData[K]): void {
        const data = this.getData();
        data[category] = value;
        this.saveData(data);
    },

    // Settings
    getSettings(): Settings {
        try {
            const settings = localStorage.getItem(SETTINGS_KEY);
            if (settings) {
                const parsed = JSON.parse(settings);
                
                // Apply forced migration for existing users to update goals
                const migratedSettings = { ...defaultSettings, ...parsed };
                
                // If the user's data does not match the new default goals and they haven't been updated
                // we'll force the new yearlyBookGoal since there wasn't a UI for it initially
                // To avoid being stuck on 50 forever:
                if (parsed.yearlyBookGoal === 50) {
                    migratedSettings.yearlyBookGoal = 9;
                    localStorage.setItem(SETTINGS_KEY, JSON.stringify(migratedSettings));
                }

                return migratedSettings;
            }
            return defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaultSettings;
        }
    },

    saveSettings(settings: Settings): void {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            // Also update in main data
            const data = this.getData();
            data.settings = settings;
            this.saveData(data);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },

    // Export data as JSON
    exportData(): string {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    },

    // Import data from JSON
    importData(jsonString: string): boolean {
        try {
            const data = JSON.parse(jsonString);
            this.saveData(data);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    // Clear all data
    clearData(): void {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
    },
};

// Utility functions
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Returns today's date in YYYY-MM-DD format using LOCAL timezone (not UTC)
export const getLocalDate = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Converts a Date object to YYYY-MM-DD string in LOCAL timezone
export const dateToLocalString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR');
};

export const formatDateTime = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleString('tr-TR');
};

export const getThisWeekDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get Monday of this week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    // Get all days from Monday to Sunday
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(dateToLocalString(date));
    }

    return dates;
};

export const downloadFile = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
