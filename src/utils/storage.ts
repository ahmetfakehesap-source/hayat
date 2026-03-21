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

const DATA_VERSION = 3; // Increment this when default settings change

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
                    return {
                        ...defaultData,
                        ...parsed,
                        settings: {
                            ...defaultData.settings, // Use new defaults as base
                            ...parsed.settings, // Keep user's theme etc if needed, but we want to force new goals
                            // Force overwrite specific goals for the migration
                            dailyCalorieGoal: defaultSettings.dailyCalorieGoal,
                            dailyProteinGoal: defaultSettings.dailyProteinGoal,
                            dailyCarbsGoal: defaultSettings.dailyCarbsGoal,
                            dailyFatGoal: defaultSettings.dailyFatGoal,
                            yearlyBookGoal: defaultSettings.yearlyBookGoal,
                            weeklyWorkoutGoal: defaultSettings.weeklyWorkoutGoal,
                        },
                        version: DATA_VERSION
                    };
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
