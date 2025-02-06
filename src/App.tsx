import React, { useState, useEffect } from 'react';
import { Grid, Download, LogOut, Upload, Users, CheckCircle } from 'lucide-react';
import { RatingSlider } from './components/RatingSlider';
import { ImageGrid } from './components/ImageGrid';
import { UserLogin } from './components/UserLogin';
import { getCurrentUser, setCurrentUser, getRatings, saveRatings, exportUserRatings, getCompletionStats } from './utils/storage';
import { parseReportsCSV } from './utils/csv';
import { getImageUrl } from './utils/image';
import type { Report, Scores, ImageRating, ModelRating, User } from './types';

const defaultScores: Scores = {
  accuracy: 3,
  comprehensiveness: 3,
  clarity: 3,
  interpretation: 3,
  terminology: 3,
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [ratings, setRatings] = useState<ImageRating[]>([]);
  const [modelScores, setModelScores] = useState<ModelRating[]>([]);
  const [modelOrder, setModelOrder] = useState<number[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isAdmin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === 'true';
  });

  useEffect(() => {
    if (currentUser) {
      const savedRatings = getRatings(currentUser.id);
      if (savedRatings.length > 0) {
        setRatings(savedRatings);
        const lastRatedIndex = savedRatings.findIndex(r => r.modelRatings.length < 5);
        setCurrentIndex(lastRatedIndex >= 0 ? lastRatedIndex : savedRatings.length - 1);
      } else if (reports.length > 0) {
        setRatings(reports.map(r => ({ 
          idx: r.idx, 
          image_path: r.image_path, 
          modelRatings: [] 
        })));
      }
    }
  }, [currentUser, reports]);

  useEffect(() => {
    if (reports.length > 0) {
      setModelOrder([...Array(5)].map((_, i) => i).sort(() => Math.random() - 0.5));
      const currentRating = ratings.find(r => r.idx === reports[currentIndex].idx);
      setModelScores(currentRating?.modelRatings || []);
    }
  }, [currentIndex, ratings, reports]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const loadedReports = await parseReportsCSV(file);
        setReports(loadedReports);
        // Reset ratings for all users when new reports are loaded
        localStorage.clear();
        window.location.reload();
      } catch (error) {
        console.error('Error loading CSV:', error);
        alert('Error loading CSV file. Please check the format.');
      }
    }
  };

  const handleScoreChange = (modelIndex: number, scoreType: keyof Scores, value: number) => {
    setModelScores(prev => {
      const existing = prev.find(s => s.modelIndex === modelIndex);
      if (existing) {
        return prev.map(s => s.modelIndex === modelIndex 
          ? { ...s, scores: { ...s.scores, [scoreType]: value }} 
          : s
        );
      }
      return [...prev, {
        modelIndex,
        scores: { ...defaultScores, [scoreType]: value }
      }];
    });
  };

  const saveCurrentRatings = () => {
    if (!currentUser) return;
    
    const newRatings = ratings.map(r => 
      r.idx === reports[currentIndex].idx
        ? { ...r, modelRatings: modelScores }
        : r
    );
    
    setRatings(newRatings);
    saveRatings(currentUser.id, newRatings);
  };

  const handleNext = () => {
    saveCurrentRatings();
    setCurrentIndex(i => (i + 1) % reports.length);
  };

  const handleSelectImage = (idx: number) => {
    saveCurrentRatings();
    setCurrentIndex(reports.findIndex(r => r.idx === idx));
    setShowGrid(false);
  };

  const handleLogout = () => {
    saveCurrentRatings();
    setCurrentUser(null);
    window.localStorage.removeItem('current-user');
  };

  const handleExport = () => {
    if (!currentUser) return;
    exportUserRatings(currentUser.id);
  };

  if (!currentUser) {
    return <UserLogin onLogin={user => setCurrentUser(user)} />;
  }

  if (reports.length === 0) {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold mb-4">No Reports Available</h1>
            <p className="text-gray-600">Please wait for an administrator to load the reports.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Upload Reports CSV</h1>
          <p className="text-gray-600 mb-4">Please upload a CSV file with the following columns:</p>
          <ul className="text-left text-sm text-gray-600 mb-6 space-y-1">
            <li>• idx (number)</li>
            <li>• image_path (URL)</li>
            <li>• model1_response (text)</li>
            <li>• model2_response (text)</li>
            <li>• model3_response (text)</li>
            <li>• model4_response (text)</li>
            <li>• model5_response (text)</li>
          </ul>
          <label className="block w-full">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </label>
        </div>
      </div>
    );
  }

  const currentReport = reports[currentIndex];
  const stats = getCompletionStats(reports.length);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Radiologist Report Rating System</h1>
            <p className="text-sm text-gray-600">Welcome, {currentUser.name}</p>
          </div>
          <div className="flex gap-4">
            {isAdmin && (
              <>
                <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                  <Upload size={20} />
                  <span>Upload New CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Users size={20} />
                    <span>
                      {stats.activeRadiologists} active / {stats.totalRadiologists} total radiologists
                    </span>
                  </div>
                  <div className="space-y-1">
                    {stats.completionRates.map(rate => (
                      <div key={rate.userId} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className="text-green-600" />
                        <span>{rate.name}:</span>
                        <span className="font-medium">
                          {((rate.completed / rate.total) * 100).toFixed(1)}%
                        </span>
                        <span className="text-gray-500">
                          ({rate.completed}/{rate.total})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              Export My Ratings
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Grid size={20} />
              Show Progress
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8">
          <img
            src={getImageUrl(currentReport.image_path)}
            alt={`X-ray ${currentReport.idx}`}
            className="w-full max-h-96 object-contain bg-black"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.onerror = null; // Prevent infinite loop
              img.src = '/placeholder-xray.png'; // Fallback image
            }}
          />
        </div>

        <div className="space-y-8">
          {modelOrder.map((modelIdx, displayIdx) => (
            <div key={modelIdx} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Report {displayIdx + 1}</h3>
              <p className="mb-4 whitespace-pre-wrap">{currentReport.model_responses[modelIdx]}</p>
              <div className="space-y-2">
                {Object.keys(defaultScores).map((scoreType) => (
                  <RatingSlider
                    key={scoreType}
                    label={scoreType.charAt(0).toUpperCase() + scoreType.slice(1)}
                    value={modelScores.find(s => s.modelIndex === modelIdx)?.scores[scoreType as keyof Scores] ?? defaultScores[scoreType as keyof Scores]}
                    onChange={(value) => handleScoreChange(modelIdx, scoreType as keyof Scores, value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next Image
          </button>
        </div>
      </div>

      {showGrid && (
        <ImageGrid
          ratings={ratings}
          currentIndex={currentReport.idx}
          onSelectImage={handleSelectImage}
        />
      )}
    </div>
  );
}

export default App;