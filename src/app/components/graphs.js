"use client";
import { useState, useEffect } from 'react';
import * as math from 'mathjs';

export default function MathEquationPlayground() {
  // App state
  const [mode, setMode] = useState('visualization'); // 'visualization' or 'challenge'
  const [equation, setEquation] = useState('x^2');
  const [xRange, setXRange] = useState([-10, 10]);
  const [yRange, setYRange] = useState([-10, 10]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [theme, setTheme] = useState('blue');
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Challenge mode state
  const [challenge, setChallenge] = useState(null);
  const [score, setScore] = useState(0);
  const [showReward, setShowReward] = useState(false);
  
  // Constants
  const graphWidth = 600;
  const graphHeight = 500;
  
  // Theme configurations
  const themes = {
    blue: {
      primary: '#3b82f6',
      secondary: '#bfdbfe',
      accent: '#1d4ed8',
      text: '#1e3a8a',
      graph: '#60a5fa',
      bg: 'from-blue-50 to-blue-100',
      reward: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    purple: {
      primary: '#8b5cf6',
      secondary: '#ddd6fe',
      accent: '#6d28d9',
      text: '#5b21b6',
      graph: '#a78bfa',
      bg: 'from-purple-50 to-purple-100',
      reward: 'bg-purple-100 border-purple-300 text-purple-800'
    },
    teal: {
      primary: '#14b8a6',
      secondary: '#ccfbf1',
      accent: '#0d9488',
      text: '#115e59',
      graph: '#2dd4bf',
      bg: 'from-teal-50 to-teal-100',
      reward: 'bg-teal-100 border-teal-300 text-teal-800'
    }
  };
  
  // Challenge database
  const challenges = [
    { 
      name: "Find the roots", 
      equation: "x^2 - 4", 
      target: [{x: -2, y: 0}, {x: 2, y: 0}], 
      hint: "Find where the graph crosses the x-axis (y = 0)",
      points: 10
    },
    { 
      name: "Find the vertex", 
      equation: "x^2 - 6x + 8", 
      target: [{x: 3, y: -1}], 
      hint: "Find the minimum point of the parabola",
      points: 15
    },
    { 
      name: "Find the y-intercept", 
      equation: "2x + 5", 
      target: [{x: 0, y: 5}], 
      hint: "Where does the line cross the y-axis? (x = 0)",
      points: 5
    },
    { 
      name: "Find where x = y", 
      equation: "2x - 3", 
      target: [{x: 3, y: 3}], 
      hint: "At what point does the y-value equal the x-value?",
      points: 10
    },
    { 
      name: "Find the inflection point", 
      equation: "x^3", 
      target: [{x: 0, y: 0}], 
      hint: "Where does the curve change concavity?",
      points: 20
    }
  ];
  
  // Coordinate mapping functions
  const mapToScreen = (x, y) => {
    const screenX = ((x - xRange[0]) / (xRange[1] - xRange[0])) * graphWidth;
    const screenY = graphHeight - ((y - yRange[0]) / (yRange[1] - yRange[0])) * graphHeight;
    return { x: screenX, y: screenY };
  };
  
  const mapToMath = (screenX, screenY) => {
    const x = xRange[0] + (screenX / graphWidth) * (xRange[1] - xRange[0]);
    const y = yRange[0] + ((graphHeight - screenY) / graphHeight) * (yRange[1] - yRange[0]);
    return { x, y };
  };
  
  // Generate points for the equation graph
  const generatePoints = (eq) => {
    const points = [];
    try {
      const expression = math.compile(eq);
      const step = (xRange[1] - xRange[0]) / 200;
      
      for (let x = xRange[0]; x <= xRange[1]; x += step) {
        try {
          const y = expression.evaluate({ x: x });
          if (isFinite(y) && y >= yRange[0] && y <= yRange[1]) {
            points.push({ x, y });
          }
        } catch (err) {
          // Skip invalid points
        }
      }
    } catch (err) {
      console.error("Error evaluating equation:", err);
    }
    return points;
  };
  
  // Start a new challenge
  const startChallenge = () => {
    setIsLoading(true);
    setTimeout(() => {
      const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
      setEquation(randomChallenge.equation);
      setChallenge(randomChallenge);
      setCurrentPoint(null);
      setIsLoading(false);
    }, 500);
  };
  
  // Check if point is close to target
  const isCloseToTarget = (point) => {
    if (!challenge) return false;
    
    return challenge.target.some(target => {
      const distance = Math.sqrt(Math.pow(point.x - target.x, 2) + Math.pow(point.y - target.y, 2));
      return distance < 0.5;
    });
  };
  
  // Handle graph clicks
  const handleGraphClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    const mathPoint = mapToMath(screenX, screenY);
    
    try {
      const expression = math.compile(equation);
      const yValue = expression.evaluate({ x: mathPoint.x });
      const graphPoint = { x: mathPoint.x, y: yValue };
      
      setCurrentPoint(graphPoint);
      
      const distance = Math.abs(mathPoint.y - yValue);
      if (distance < 0.5 && challenge && isCloseToTarget(graphPoint)) {
        const pointsEarned = challenge.points;
        setScore(prev => prev + pointsEarned);
        setFeedback({
          type: 'success',
          message: `Correct! You earned ${pointsEarned} points.`,
          point: graphPoint
        });
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2000);
        setTimeout(() => setFeedback(null), 3000);
        startChallenge(); // Automatically start new challenge
      }
    } catch (err) {
      console.error("Error evaluating point:", err);
    }
  };
  
  // Generate SVG path for the equation graph
  const generatePath = () => {
    const graphPoints = generatePoints(equation);
    if (graphPoints.length === 0) return "";
    
    let path = `M ${mapToScreen(graphPoints[0].x, graphPoints[0].y).x} ${mapToScreen(graphPoints[0].x, graphPoints[0].y).y}`;
    
    for (let i = 1; i < graphPoints.length; i++) {
      const { x, y } = mapToScreen(graphPoints[i].x, graphPoints[i].y);
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };
  
  const activeTheme = themes[theme];
  
  return (
    <div className={`min-h-screen p-6 bg-gradient-to-br ${activeTheme.bg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Have Fun With Equations!</h1>
            <p className="text-gray-600 mt-1">
              {mode === 'visualization' ? 'Visualize mathematical functions' : 'Complete challenges to test your skills'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* Theme Switcher */}
            <div className="flex space-x-2 mr-4">
              {Object.keys(themes).map(t => (
                <button 
                  key={t} 
                  onClick={() => setTheme(t)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${theme === t ? 'scale-110 ring-2 ring-white ring-offset-2' : ''}`}
                  style={{ background: themes[t].primary }}
                  aria-label={`${t} theme`}
                />
              ))}
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200 mr-4">
              <button
                onClick={() => setMode('visualization')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'visualization' ? 'bg-gray-100 font-medium' : 'text-gray-600'}`}
              >
                Visualization
              </button>
              <button
                onClick={() => {
                  setMode('challenge');
                  if (!challenge) startChallenge();
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'challenge' ? 'bg-gray-100 font-medium' : 'text-gray-600'}`}
              >
                Challenges
              </button>
            </div>
            
            {/* Challenge Mode Button */}
            {mode === 'challenge' && (
              <button
                onClick={startChallenge}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg shadow-md transition-all hover:shadow-lg flex items-center
                  ${isLoading ? 'bg-gray-400' : ''}`}
                style={{ 
                  backgroundColor: isLoading ? '#9ca3af' : activeTheme.primary,
                  color: 'white'
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : 'New Challenge'}
              </button>
            )}
          </div>
        </header>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Equation Input */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equation (in terms of x)
              </label>
              <input
                type="text"
                value={equation}
                onChange={(e) => setEquation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ 
                  focusRing: activeTheme.primary,
                  borderColor: activeTheme.secondary
                }}
                placeholder="e.g., x^2 + 3x - 4"
                disabled={mode === 'challenge'}
              />
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={xRange[0]}
                      onChange={(e) => setXRange([Number(e.target.value), xRange[1]])}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={xRange[1]}
                      onChange={(e) => setXRange([xRange[0], Number(e.target.value)])}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={yRange[0]}
                      onChange={(e) => setYRange([Number(e.target.value), yRange[1]])}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={yRange[1]}
                      onChange={(e) => setYRange([yRange[0], Number(e.target.value)])}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Challenge Info */}
            {mode === 'challenge' && challenge && (
              <div className="bg-white p-6 rounded-xl shadow-md animate-fade-in">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg" style={{ color: activeTheme.text }}>
                    Challenge: {challenge.name}
                  </h3>
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                    Score: {score}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg mb-3">
                  <p className="text-sm font-mono" style={{ color: activeTheme.accent }}>
                    {challenge.equation}
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5" style={{ color: activeTheme.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-2 text-sm" style={{ color: activeTheme.accent }}>
                    {challenge.hint}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Target Points: {challenge.target.length}</p>
                  <p className="text-xs text-gray-500">Points: {challenge.points}</p>
                </div>
              </div>
            )}
            
            {/* Current Point Info */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-bold text-lg mb-4" style={{ color: activeTheme.text }}>
                Current Point
              </h3>
              
              {currentPoint ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">X Value</span>
                    <span className="font-mono font-bold" style={{ color: activeTheme.primary }}>
                      {currentPoint.x.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Y Value</span>
                    <span className="font-mono font-bold" style={{ color: activeTheme.primary }}>
                      {currentPoint.y.toFixed(3)}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Coordinates</span>
                    <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg font-mono text-sm">
                      ({currentPoint.x.toFixed(2)}, {currentPoint.y.toFixed(2)})
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Click on the graph to see coordinates
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Graph Area */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-xl relative">
              {/* Reward Animation */}
              {showReward && (
                <div className={`absolute inset-0 flex items-center justify-center z-10 animate-fade-in`}>
                  <div className={`${activeTheme.reward} border-2 rounded-full p-8 shadow-lg transform scale-0 animate-grow`}>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">+{challenge.points}</div>
                      <div className="text-lg font-medium">Points Earned!</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Feedback Message */}
              {feedback && (
                <div className={`mb-6 p-4 rounded-lg shadow-md animate-fade-in ${feedback.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
                  <div className="flex items-center">
                    {feedback.type === 'success' ? (
                      <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <div>
                      <p className={`font-medium ${feedback.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                        {feedback.message}
                      </p>
                      {feedback.point && (
                        <p className="text-sm mt-1 font-mono">
                          ({feedback.point.x.toFixed(2)}, {feedback.point.y.toFixed(2)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Graph SVG */}
              <div className="relative">
                <svg
                  width={graphWidth}
                  height={graphHeight}
                  className="w-full h-auto bg-white rounded-lg cursor-crosshair border border-gray-200"
                  onClick={handleGraphClick}
                >
                  {/* Grid lines */}
                  {Array.from({ length: 21 }, (_, i) => {
                    const value = xRange[0] + i * (xRange[1] - xRange[0]) / 20;
                    const { x } = mapToScreen(value, 0);
                    return (
                      <line
                        key={`grid-x-${i}`}
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={graphHeight}
                        stroke={value === 0 ? "#555" : "#f0f0f0"}
                        strokeWidth={value === 0 ? 2 : 1}
                        strokeDasharray={value === 0 ? "" : "2,2"}
                      />
                    );
                  })}
                  
                  {Array.from({ length: 21 }, (_, i) => {
                    const value = yRange[0] + i * (yRange[1] - yRange[0]) / 20;
                    const { y } = mapToScreen(0, value);
                    return (
                      <line
                        key={`grid-y-${i}`}
                        x1={0}
                        y1={y}
                        x2={graphWidth}
                        y2={y}
                        stroke={value === 0 ? "#555" : "#f0f0f0"}
                        strokeWidth={value === 0 ? 2 : 1}
                        strokeDasharray={value === 0 ? "" : "2,2"}
                      />
                    );
                  })}
                  
                  {/* Axes labels */}
                  {Array.from({ length: 11 }, (_, i) => {
                    const value = xRange[0] + i * (xRange[1] - xRange[0]) / 10;
                    const { x, y } = mapToScreen(value, 0);
                    return (
                      <text
                        key={`label-x-${i}`}
                        x={x}
                        y={mapToScreen(0, 0).y + 20}
                        fontSize="12"
                        textAnchor="middle"
                        fill="#666"
                      >
                        {value % 1 === 0 ? value : value.toFixed(1)}
                      </text>
                    );
                  })}
                  
                  {Array.from({ length: 11 }, (_, i) => {
                    const value = yRange[0] + i * (yRange[1] - yRange[0]) / 10;
                    const { x, y } = mapToScreen(0, value);
                    return (
                      <text
                        key={`label-y-${i}`}
                        x={mapToScreen(0, 0).x - 15}
                        y={y + 4}
                        fontSize="12"
                        textAnchor="end"
                        fill="#666"
                      >
                        {value % 1 === 0 ? value : value.toFixed(1)}
                      </text>
                    );
                  })}
                  
                  {/* Graph line with glow effect */}
                  <defs>
                    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  
                  <path
                    d={generatePath()}
                    fill="none"
                    stroke={activeTheme.graph}
                    strokeWidth="3"
                    filter="url(#glow)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Current point indicator */}
                  {currentPoint && (
                    <g>
                      <circle
                        cx={mapToScreen(currentPoint.x, currentPoint.y).x}
                        cy={mapToScreen(currentPoint.x, currentPoint.y).y}
                        r="10"
                        fill={activeTheme.primary}
                        opacity="0.2"
                      />
                      <circle
                        cx={mapToScreen(currentPoint.x, currentPoint.y).x}
                        cy={mapToScreen(currentPoint.x, currentPoint.y).y}
                        r="6"
                        fill={activeTheme.primary}
                        stroke="white"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </svg>
                
                <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                  Click anywhere on the graph to evaluate
                </div>
              </div>
            </div>
            
            {/* Help Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2" style={{ color: activeTheme.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Start
                </h4>
                <p className="text-sm text-gray-600">
                  {mode === 'visualization' 
                    ? 'Enter any equation in terms of x to visualize it. Try polynomials, trigonometric functions, or logarithms.'
                    : 'Click on the graph to find solution points. Earn points for correct answers!'}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2" style={{ color: activeTheme.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {mode === 'visualization' ? 'Equation Examples' : 'Challenge Tips'}
                </h4>
                <p className="text-sm text-gray-600">
                  {mode === 'visualization'
                    ? 'Try: x^2 (quadratic), sin(x) (sine wave), exp(x) (exponential), or sqrt(x) (square root)'
                    : 'Read the hint carefully. Zoom in/out by adjusting the X/Y ranges if needed.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tailwind animation keyframes (add to your CSS) */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes grow {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-grow {
          animation: grow 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}