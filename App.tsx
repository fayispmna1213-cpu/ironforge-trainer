import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, FitnessGoal, ExperienceLevel, Equipment, WorkoutPlanResponse, DayPlan, WorkoutLog, SavedPlan } from './types';
import { Button } from './components/Button';
import { Input, Select } from './components/InputGroup';
import { generateWorkoutPlan } from './services/geminiService';
import { PlanDisplay } from './components/PlanDisplay';
import { HistoryDisplay } from './components/HistoryDisplay';
import { SavedPlansDisplay } from './components/SavedPlansDisplay';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'app' | 'history' | 'saved'>('app');
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  
  // App Data
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    daysPerWeek: 4,
    experience: ExperienceLevel.INTERMEDIATE,
    goal: FitnessGoal.BUILD_MUSCLE,
    equipment: Equipment.GYM,
    gender: Gender.MALE
  });
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanResponse | null>(null);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    // History
    const savedHistory = localStorage.getItem('ironforge_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Saved Plans
    const savedPlansData = localStorage.getItem('ironforge_saved_plans');
    if (savedPlansData) {
      try {
        setSavedPlans(JSON.parse(savedPlansData));
      } catch (e) {
        console.error("Failed to parse saved plans", e);
      }
    }
    
    // Active Plan
    const savedPlan = localStorage.getItem('ironforge_plan');
    if (savedPlan) {
      try {
        setWorkoutPlan(JSON.parse(savedPlan));
        setStep('result');
      } catch (e) {
        console.error("Failed to parse saved plan", e);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.age || !formData.height || !formData.weight) {
      setError("Please fill in all basic physical details.");
      return;
    }

    setStep('loading');
    setError(null);

    try {
      // Cast to UserProfile since we validated required fields
      const plan = await generateWorkoutPlan(formData as UserProfile);
      setWorkoutPlan(plan);
      localStorage.setItem('ironforge_plan', JSON.stringify(plan));
      setStep('result');
    } catch (err: any) {
      setError(err.message || "Failed to generate plan. Please try again.");
      setStep('form');
    }
  };

  const handleReset = () => {
    setWorkoutPlan(null);
    localStorage.removeItem('ironforge_plan');
    setStep('form');
  };

  const handleLogWorkout = (day: DayPlan) => {
    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      dayName: day.dayName,
      focus: day.focus,
      completedAt: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updatedHistory = [newLog, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('ironforge_history', JSON.stringify(updatedHistory));
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your workout history?")) {
      setHistory([]);
      localStorage.removeItem('ironforge_history');
    }
  };

  const handleDeleteLog = (id: string) => {
     const updatedHistory = history.filter(h => h.id !== id);
     setHistory(updatedHistory);
     localStorage.setItem('ironforge_history', JSON.stringify(updatedHistory));
  };

  const handleSavePlan = () => {
    if (!workoutPlan) return;
    
    // Check if already saved (optional, but good UX)
    // For simplicity, we just add it. Or we could check duplicate logic but unique ID handles it.
    const newSavedPlan: SavedPlan = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      formattedDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      plan: workoutPlan
    };

    const updatedPlans = [newSavedPlan, ...savedPlans];
    setSavedPlans(updatedPlans);
    localStorage.setItem('ironforge_saved_plans', JSON.stringify(updatedPlans));
  };

  const handleDeleteSavedPlan = (id: string) => {
    if (confirm("Delete this saved plan?")) {
      const updatedPlans = savedPlans.filter(p => p.id !== id);
      setSavedPlans(updatedPlans);
      localStorage.setItem('ironforge_saved_plans', JSON.stringify(updatedPlans));
    }
  };

  const handleLoadPlan = (saved: SavedPlan) => {
    setWorkoutPlan(saved.plan);
    // Persist as current active plan
    localStorage.setItem('ironforge_plan', JSON.stringify(saved.plan));
    setStep('result');
    setViewMode('app');
  };

  return (
    <div className="min-h-screen bg-forge-900 text-gray-100 font-sans selection:bg-forge-accent selection:text-forge-900">
      
      {/* Navbar */}
      <nav className="border-b border-forge-800 bg-forge-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setViewMode('app')}
          >
            <div className="w-8 h-8 bg-forge-accent rounded flex items-center justify-center font-bold text-forge-900 text-xl font-heading">
              IF
            </div>
            <span className="font-heading font-bold text-xl tracking-wider text-white">IRON<span className="text-forge-accent">FORGE</span></span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             {step === 'result' && viewMode === 'app' && (
                <button onClick={handleReset} className="hidden md:block text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                  New Plan
                </button>
             )}
             
             <button 
                onClick={() => setViewMode('saved')}
                className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors ${viewMode === 'saved' ? 'bg-forge-700 text-white' : 'text-gray-400 hover:text-white hover:bg-forge-800'}`}
             >
                My Plans
             </button>
             
             <button 
                onClick={() => setViewMode('history')}
                className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors ${viewMode === 'history' ? 'bg-forge-700 text-white' : 'text-gray-400 hover:text-white hover:bg-forge-800'}`}
             >
                History
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {viewMode === 'history' ? (
          <HistoryDisplay 
            history={history} 
            onBack={() => setViewMode('app')} 
            onClear={handleClearHistory}
            onDelete={handleDeleteLog}
          />
        ) : viewMode === 'saved' ? (
          <SavedPlansDisplay 
            plans={savedPlans}
            onLoad={handleLoadPlan}
            onDelete={handleDeleteSavedPlan}
            onBack={() => setViewMode('app')}
          />
        ) : (
          <>
            {step === 'form' && (
              <div className="max-w-2xl mx-auto animate-fade-in-up">
                <div className="text-center mb-10">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                    BUILD YOUR <span className="text-forge-accent">PERFECT BODY</span>
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Tell us about yourself. Our veteran AI trainer will construct a program specifically for your genetics and goals.
                  </p>
                </div>

                <div className="bg-forge-800/50 p-8 rounded-2xl border border-forge-700 shadow-2xl backdrop-blur-sm">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Physical Stats Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input 
                        label="Age" 
                        type="number" 
                        name="age" 
                        value={formData.age || ''} 
                        onChange={handleNumberChange}
                        min="14" max="100" 
                        required 
                        placeholder="25"
                      />
                       <Input 
                        label="Height (cm)" 
                        type="number" 
                        name="height" 
                        value={formData.height || ''} 
                        onChange={handleNumberChange} 
                        required 
                        placeholder="180"
                      />
                       <Input 
                        label="Weight (kg)" 
                        type="number" 
                        name="weight" 
                        value={formData.weight || ''} 
                        onChange={handleNumberChange} 
                        required 
                        placeholder="80"
                      />
                      <Select 
                        label="Gender" 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleInputChange}
                        options={[
                          { label: 'Male', value: Gender.MALE },
                          { label: 'Female', value: Gender.FEMALE },
                          { label: 'Other', value: Gender.OTHER },
                        ]}
                      />
                    </div>

                    {/* Goals & Experience */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Select 
                        label="Main Goal" 
                        name="goal" 
                        value={formData.goal} 
                        onChange={handleInputChange}
                        options={Object.values(FitnessGoal).map(g => ({ label: g, value: g }))}
                      />
                      <Select 
                        label="Experience Level" 
                        name="experience" 
                        value={formData.experience} 
                        onChange={handleInputChange}
                        options={Object.values(ExperienceLevel).map(l => ({ label: l, value: l }))}
                      />
                    </div>

                     {/* Logistics */}
                     <div className="grid md:grid-cols-2 gap-6">
                      <Select 
                        label="Equipment Access" 
                        name="equipment" 
                        value={formData.equipment} 
                        onChange={handleInputChange}
                        options={Object.values(Equipment).map(e => ({ label: e, value: e }))}
                      />
                      <Input 
                        label="Days per Week" 
                        type="number" 
                        name="daysPerWeek" 
                        value={formData.daysPerWeek || ''} 
                        onChange={handleNumberChange}
                        min="1" max="7" 
                        required 
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Injuries / Limitations (Optional)</label>
                       <textarea
                          name="injuries"
                          value={formData.injuries || ''}
                          onChange={handleInputChange}
                          className="bg-forge-800 border border-forge-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-forge-accent focus:ring-1 focus:ring-forge-accent transition-all resize-none h-24"
                          placeholder="e.g. Lower back pain, bad left knee..."
                       />
                    </div>

                    {error && (
                      <div className="bg-red-900/50 text-red-200 border border-red-800 p-4 rounded-lg text-sm text-center">
                        {error}
                      </div>
                    )}

                    <div className="pt-4">
                      <Button type="submit" fullWidth>
                        Generate Program
                      </Button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
                 <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-t-4 border-forge-accent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-t-4 border-forge-700 rounded-full animate-spin-slow opacity-50"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-heading font-bold text-xl text-white">
                      IF
                    </div>
                 </div>
                 <h2 className="text-2xl font-heading font-bold text-white mb-2">Analyzing Profile...</h2>
                 <p className="text-gray-400 animate-pulse text-center max-w-md">
                   "Coach Steele is reviewing your stats. Designing the splits, calculating the volume, and writing your custom plan."
                 </p>
              </div>
            )}

            {step === 'result' && workoutPlan && (
              <PlanDisplay 
                plan={workoutPlan} 
                onReset={handleReset} 
                onLogWorkout={handleLogWorkout}
                onSavePlan={handleSavePlan}
              />
            )}
          </>
        )}

      </main>
      
      <footer className="border-t border-forge-800 py-8 mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} IronForge Trainer. AI Generated Advice - Consult a doctor before starting.</p>
      </footer>
    </div>
  );
};

export default App;
