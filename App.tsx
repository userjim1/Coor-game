import React, { useState, useCallback, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import TwoDView from './components/TwoDView';
import { LigandMap, LigandType, CheckResult, IsomerTarget, ViewMode, GameState } from './types';
import { SLOTS, COLORS, SOLUTIONS, LEVELS } from './constants';
import * as THREE from 'three';
import { 
  Beaker, 
  RefreshCw, 
  CheckCircle2, 
  FlaskConical, 
  Atom, 
  AlertTriangle, 
  Eye, 
  Box, 
  Layout, 
  Play,
  BookOpen,
  ChevronRight,
  RotateCcw,
  Trophy,
  Send,
  X,
  ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const currentLevel = LEVELS[currentLevelIndex];

  // Gameplay State
  const [ligands, setLigands] = useState<LigandMap>({});
  const [selectedTool, setSelectedTool] = useState<LigandType>('NH3');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('3D');

  // Background animation state (for start screen)
  const [demoLigands, setDemoLigands] = useState<LigandMap>({});

  // Setup demo rotation for start screen
  useEffect(() => {
    if (gameState === 'START') {
      const demo: LigandMap = { 0: 'Cl', 1: 'NH3', 2: 'Cl', 3: 'NH3', 4: 'Cl', 5: 'NH3' }; // Fac-like
      setDemoLigands(demo);
    } else {
      setDemoLigands({});
    }
  }, [gameState]);

  const handleSlotClick = useCallback((slotId: number) => {
    if (gameState !== 'PLAYING') return;
    setLigands((prev) => {
      const newState = { ...prev };
      newState[slotId] = selectedTool;
      return newState;
    });
    setResult(null);
  }, [selectedTool, gameState]);

  const handleReset = () => {
    setLigands({});
    setResult(null);
  };

  const handleShowAnswer = () => {
    setLigands(SOLUTIONS[currentLevel.target]);
    setResult({
      type: 'info',
      message: `Solution: This is the correct ${currentLevel.target} configuration.`,
      isomerType: currentLevel.target
    });
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setLigands({});
      setResult(null);
    } else {
      setGameState('COMPLETED');
    }
  };

  const checkIsomer = () => {
    const clIndices = Object.entries(ligands)
      .filter(([_, type]) => type === 'Cl')
      .map(([id]) => parseInt(id));

    const nh3Indices = Object.entries(ligands)
      .filter(([_, type]) => type === 'NH3')
      .map(([id]) => parseInt(id));

    // Check Counts
    if (clIndices.length !== currentLevel.requiredCl || nh3Indices.length !== currentLevel.requiredNH3) {
      setResult({
        type: 'error',
        message: `Incorrect Composition. Need ${currentLevel.requiredCl} Cl and ${currentLevel.requiredNH3} NH₃. Currently: ${clIndices.length} Cl, ${nh3Indices.length} NH₃.`,
      });
      return;
    }

    // Determine Isomer Type
    let detectedType: IsomerTarget | 'UNKNOWN' = 'UNKNOWN';

    if (currentLevel.requiredCl === 2) {
      // CIS / TRANS Logic
      const v1 = SLOTS[clIndices[0]].position;
      const v2 = SLOTS[clIndices[1]].position;
      // Dot product: 1*1 + 0 + 0 etc. 
      // Since they are axis aligned unit vectors:
      // Dot = 1 or -1 (Co-linear), 0 (Perpendicular)
      const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
      
      if (dot < -0.9) detectedType = 'TRANS';
      else if (Math.abs(dot) < 0.1) detectedType = 'CIS';

    } else if (currentLevel.requiredCl === 3) {
      // FAC / MER Logic
      // MER: Has at least one TRANS pair (180 deg)
      // FAC: All pairs are CIS (90 deg)
      let hasTransPair = false;
      
      for (let i = 0; i < clIndices.length; i++) {
        for (let j = i + 1; j < clIndices.length; j++) {
          const v1 = SLOTS[clIndices[i]].position;
          const v2 = SLOTS[clIndices[j]].position;
          const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
          if (dot < -0.9) {
            hasTransPair = true;
            break;
          }
        }
      }
      detectedType = hasTransPair ? 'MER' : 'FAC';
    }

    if (detectedType === currentLevel.target) {
      setResult({
        type: 'success',
        message: `Correct! You have built the ${currentLevel.target} isomer.`,
        isomerType: detectedType as IsomerTarget,
      });
    } else {
      setResult({
        type: 'error',
        message: `This is the ${detectedType} isomer. Try rearranging the Chlorines to form the ${currentLevel.target} isomer.`,
      });
    }
  };

  // --- Screens ---

  const StartScreen = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-1000">
      <div className="bg-slate-900/90 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-500/20 rounded-2xl ring-1 ring-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Atom className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Iso-Metric</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Master the geometry of octahedral complexes through interactive 3D puzzles.
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              setGameState('PLAYING');
              setLigands({});
              setResult(null);
              setCurrentLevelIndex(0);
            }}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.02]"
          >
            <Play className="w-5 h-5 fill-current" /> Start Campaign
          </button>
          <button 
            onClick={() => setGameState('GUIDE')}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-3 transition-all border border-white/5"
          >
            <BookOpen className="w-5 h-5" /> User Guide
          </button>
        </div>
      </div>
    </div>
  );

  const GuideScreen = () => (
    <div className="absolute inset-0 z-30 bg-slate-950/95 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-400" /> User Guide
          </h2>
          <button onClick={() => setGameState('START')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-8 space-y-8">
          
          <section>
            <h3 className="text-xl font-bold text-indigo-400 mb-4">Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <Box className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold">Interaction</span>
                </div>
                <p className="text-sm text-slate-400">Click on the grey wireframe spheres (slots) to place an atom. Select your element from the left panel.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <RotateCcw className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold">Camera</span>
                </div>
                <p className="text-sm text-slate-400">Click and drag anywhere on the background to rotate the molecule. Scroll to zoom in/out.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-indigo-400 mb-4">Isomer Types</h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <span className="font-bold text-indigo-400">CIS</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Cis-Isomer</h4>
                  <p className="text-sm text-slate-400 mt-1">Ligands are adjacent (90°). Think "Neighbors".</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                  <span className="font-bold text-rose-400">TRANS</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Trans-Isomer</h4>
                  <p className="text-sm text-slate-400 mt-1">Ligands are opposite (180°). Think "Across".</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <span className="font-bold text-amber-400">FAC</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Facial (Fac)</h4>
                  <p className="text-sm text-slate-400 mt-1">Three identical ligands occupy the corners of one triangular face. All 90° to each other.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <span className="font-bold text-emerald-400">MER</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Meridional (Mer)</h4>
                  <p className="text-sm text-slate-400 mt-1">Three identical ligands form a T-shape or line along the meridian. Includes a 180° angle.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        <div className="p-6 border-t border-white/10 bg-slate-800/50 text-center">
          <button 
            onClick={() => setGameState('START')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );

  const CompletedScreen = () => (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/30 p-10 rounded-3xl shadow-2xl max-w-lg text-center">
        <div className="inline-flex p-5 rounded-full bg-emerald-500/20 mb-6 ring-4 ring-emerald-500/10">
          <Trophy className="w-16 h-16 text-emerald-400" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">Course Completed!</h2>
        <p className="text-slate-300 text-lg mb-8">
          You have mastered the basics of Octahedral Isomerism. <br/>
          You successfully identified Cis, Trans, Fac, and Mer structures.
        </p>
        <button 
          onClick={() => {
            setGameState('START');
            setCurrentLevelIndex(0);
            setLigands({});
            setResult(null);
          }}
          className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-5 h-5" /> Return to Menu
        </button>
      </div>
    </div>
  );

  const ToolButton = ({ type, label, colorHex }: { type: LigandType, label: string, colorHex: number }) => {
    const isActive = selectedTool === type;
    const colorString = `#${colorHex.toString(16).padStart(6, '0')}`;
    
    return (
      <button 
        onClick={() => setSelectedTool(type)}
        className={`
          group relative flex items-center justify-between w-full p-3 mb-2 
          border transition-all duration-300 rounded-xl overflow-hidden
          ${isActive 
            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
          }
        `}
      >
        <div className="flex items-center gap-3 pl-2">
          <div 
            className="w-6 h-6 rounded-full shadow-lg ring-2 ring-white/10"
            style={{ backgroundColor: colorString }} 
          />
          <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
            {label}
          </span>
        </div>
        {isActive && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
      </button>
    );
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans text-slate-100 selection:bg-indigo-500/30">
      
      {/* 3D Scene Layer (Always rendered for background effect) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        {viewMode === '3D' ? (
          <Scene3D ligands={gameState === 'START' ? demoLigands : ligands} onSlotClick={handleSlotClick} />
        ) : (
          <div className="w-full max-w-2xl aspect-square pointer-events-auto">
            <TwoDView ligands={ligands} onSlotClick={handleSlotClick} />
          </div>
        )}
      </div>

      {/* Screen Overlays */}
      {gameState === 'START' && <StartScreen />}
      {gameState === 'GUIDE' && <GuideScreen />}
      {gameState === 'COMPLETED' && <CompletedScreen />}

      {/* Game UI - Only Visible when PLAYING */}
      {gameState === 'PLAYING' && (
        <>
          {/* Top Bar Level Info */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-center pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
              <span className="text-xs font-bold text-slate-500 tracking-wider">LEVEL {currentLevelIndex + 1}/{LEVELS.length}</span>
              <div className="w-px h-4 bg-white/10" />
              <span className="text-sm font-bold text-white">{currentLevel.name}</span>
            </div>
          </div>

          {/* Left Panel */}
          <div className="absolute top-0 left-0 bottom-0 z-10 w-full sm:w-[380px] p-4 flex flex-col gap-4 pointer-events-none pt-20 sm:pt-4">
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-in slide-in-from-left-4 duration-500 max-h-full overflow-y-auto">
              
              <header className="border-b border-white/10 pb-4">
                 <h2 className="text-lg font-bold text-white flex items-center gap-2">
                   Target: <span className="text-indigo-400">{currentLevel.target}</span>
                 </h2>
                 <div className="mt-2 text-xs bg-slate-800 rounded-lg p-3 text-slate-300 border border-white/5">
                    {currentLevel.description}
                    <div className="mt-2 pt-2 border-t border-white/5 font-mono text-indigo-300">
                      {currentLevel.formula}
                    </div>
                 </div>
              </header>

              {/* Tools */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Elements</label>
                <ToolButton type="NH3" label={`NH₃ (Need ${currentLevel.requiredNH3})`} colorHex={COLORS.NH3} />
                <ToolButton type="Cl" label={`Cl⁻ (Need ${currentLevel.requiredCl})`} colorHex={COLORS.Cl} />
              </div>

              {/* View Toggle */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">View Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setViewMode('3D')} className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all ${viewMode === '3D' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    <Box className="w-4 h-4" /> 3D
                  </button>
                  <button onClick={() => setViewMode('2D')} className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all ${viewMode === '2D' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    <Layout className="w-4 h-4" /> 2D
                  </button>
                </div>
              </div>

              {/* Main Actions */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                {result?.type === 'success' ? (
                  <button
                    onClick={handleNextLevel}
                    className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg animate-pulse"
                  >
                    Next Level <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={checkIsomer}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                    >
                      <Send className="w-4 h-4" /> Submit
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" /> Reset
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Result Card */}
            <div className={`pointer-events-auto backdrop-blur-xl border rounded-2xl p-4 shadow-xl transition-all duration-300 ${
              result 
                ? result.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30' 
                : result.type === 'info' ? 'bg-indigo-950/80 border-indigo-500/30'
                : 'bg-rose-950/80 border-rose-500/30'
                : 'bg-slate-900/80 border-white/10'
            }`}>
              {result ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full shrink-0 ${result.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : result.type === 'info' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {result.type === 'success' ? <Trophy className="w-5 h-5" /> : result.type === 'info' ? <Eye className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm mb-0.5 ${result.type === 'success' ? 'text-emerald-400' : result.type === 'info' ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {result.type === 'success' ? 'Level Complete!' : result.type === 'info' ? 'Answer Key' : 'Incorrect'}
                      </h3>
                      <p className="text-[11px] text-slate-300 leading-tight">{result.message}</p>
                    </div>
                  </div>
                  {result.type === 'error' && (
                    <button onClick={handleShowAnswer} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white border border-white/10 flex items-center justify-center gap-2 transition-colors">
                      <Eye className="w-3 h-3" /> Show Correct Answer
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 opacity-80">
                  <FlaskConical className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm mb-0.5">Objective</h3>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Build the <strong className="text-white">{currentLevel.target}</strong> isomer using the tools above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute top-4 right-4 z-10">
             <button onClick={() => setGameState('START')} className="p-3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;