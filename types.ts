export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum FitnessGoal {
  LOSE_WEIGHT = 'Lose Weight & Burn Fat',
  BUILD_MUSCLE = 'Build Muscle & Hypertrophy',
  STRENGTH = 'Gain Raw Strength',
  ATHLETICISM = 'Improve Athleticism & Cardio',
}

export enum ExperienceLevel {
  BEGINNER = 'Beginner (0-1 years)',
  INTERMEDIATE = 'Intermediate (1-3 years)',
  ADVANCED = 'Advanced (3+ years)',
}

export enum Equipment {
  GYM = 'Full Commercial Gym',
  HOME_DUMBBELLS = 'Home (Dumbbells & Bench)',
  BODYWEIGHT = 'Bodyweight Only',
  HOME_GARAGE = 'Garage Gym (Barbell, Rack, Bench)',
}

export interface UserProfile {
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  equipment: Equipment;
  daysPerWeek: number;
  injuries?: string;
}

// Data structures for the AI response
export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string; // e.g., "60s"
  tempo?: string; // e.g., "3-0-1-0"
  notes?: string; // Tips from the trainer
}

export interface DayPlan {
  dayName: string; // e.g., "Monday - Push Day"
  focus: string; // e.g., "Chest, Shoulders, Triceps"
  warmUp: string[];
  exercises: Exercise[];
  coolDown: string[];
}

export interface WorkoutPlanResponse {
  trainerName: string;
  programTitle: string;
  introMessage: string;
  weeklySchedule: DayPlan[];
  nutritionTips: string[];
  recoveryTips: string[];
}

export interface WorkoutLog {
  id: string;
  timestamp: number;
  dayName: string;
  focus: string;
  completedAt: string; // Formatted date string
}

export interface SavedPlan {
  id: string;
  createdAt: number;
  formattedDate: string;
  plan: WorkoutPlanResponse;
}
