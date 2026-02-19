import type { AppData, Settings } from '../types';

const STORAGE_KEY = 'lifeos_data';
const SETTINGS_KEY = 'lifeos_settings';

const defaultSettings: Settings = {
    theme: 'light',
    dailyCalorieGoal: 1700, // Ramadan mode
    dailyProteinGoal: 120, // Increased protein focus
    dailyCarbsGoal: 150,
    dailyFatGoal: 50,
    yearlyBookGoal: 50, // Approx 1 book/week or based on 10 pages/day
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
    settings: defaultSettings,
};

export const storage = {
    // Get all data
    getData(): AppData {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return { ...defaultData, ...parsed };
            }
            return defaultData;
        } catch (error) {
            console.error('Error loading data:', error);
            return defaultData;
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
                return { ...defaultSettings, ...parsed };
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
        dates.push(date.toISOString().split('T')[0]);
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
