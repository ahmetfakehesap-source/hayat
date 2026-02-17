// Global Types
export interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
    category?: string;
}

export interface Project {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
    progress: number;
    notes: string;
    milestones: Milestone[];
}

export interface Milestone {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
}

export interface CalorieEntry {
    id: string;
    date: string;
    time: string; // HH:MM format
    meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface WorkoutEntry {
    id: string;
    date: string;
    type: string;
    duration: number; // minutes
    caloriesBurned: number;
    notes?: string;
}

export interface BodyMeasurement {
    id: string;
    date: string;
    weight: number;
    bodyFat?: number;
    measurements?: {
        chest?: number;
        waist?: number;
        hips?: number;
        arms?: number;
    };
}

export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    instructions: string;
    calories: number;
    prepTime?: number;
    favorite: boolean;
    category?: string;
}

export interface HealthProduct {
    id: string;
    name: string;
    category: string;
    location: string;
    price: number;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    status: 'reading' | 'completed' | 'want-to-read';
    currentPage?: number;
    totalPages?: number;
    rating?: number;
    review?: string;
    startDate?: string;
    finishDate?: string;
}

export interface JournalEntry {
    id: string;
    date: string;
    content: string;
    mood: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
    tags?: string[];
}

export interface Investment {
    id: string;
    asset: string;
    type: 'stock' | 'crypto' | 'fund' | 'other';
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    notes?: string;
}

export interface ScheduleEntry {
    id: string;
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    time: string; // HH:MM format
    activity: string;
    category?: string;
}

export interface Goal {
    id: string;
    title: string;
    category: 'work' | 'health' | 'education' | 'finance' | 'personal' | 'other';
    deadline?: string;
    completed: boolean;
    completedDate?: string;
    notes?: string;
}



export interface Settings {
    theme: 'light' | 'dark';
    dailyCalorieGoal: number;
    dailyProteinGoal: number;
    dailyCarbsGoal: number;
    dailyFatGoal: number;
    yearlyBookGoal: number;
    weeklyWorkoutGoal: number;
    workoutDays: number[]; // 0=Sunday, 1=Monday, etc.
    monthlyWorkoutGoal: number;
}

export interface DailyScore {
    date: string;
    nutritionScore: number; // 0-65
    workoutScore: number; // 0-35
    totalScore: number; // 0-100
    calorieIntake: number;
    proteinIntake: number;
    carbsIntake: number;
    fatIntake: number;
    workedOut: boolean;
}

export interface AppData {
    tasks: Task[];
    projects: Project[];
    calorieEntries: CalorieEntry[];
    workoutEntries: WorkoutEntry[];
    bodyMeasurements: BodyMeasurement[];
    recipes: Recipe[];
    healthProducts: HealthProduct[];
    books: Book[];
    journalEntries: JournalEntry[];
    investments: Investment[];
    schedule: ScheduleEntry[];
    goals: Goal[];
    settings: Settings;
}
