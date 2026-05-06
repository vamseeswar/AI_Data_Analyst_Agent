import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, BarChart2, MessageSquare, TrendingUp, AlertTriangle, Lightbulb, Trash2, ShieldCheck, Sun, Moon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysis(response.data.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to analyze dataset.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setAnalysis(null);
    setChatHistory([]);
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleChat = async () => {
    if (!chatQuery.trim()) return;
    if (!analysis) {
      alert("Please upload a dataset first before asking questions.");
      return;
    }
    
    const userQuery = chatQuery;
    setChatQuery('');
    setChatHistory([...chatHistory, { role: 'user', content: userQuery }]);
    setChatLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chat`, {
        query: userQuery,
        dataset_context: analysis ? {
          columns: analysis.columns,
          summary_stats: analysis.summary_stats,
          ai_insights: analysis.ai_insights,
          data_rows_sample: analysis.preview_data
        } : null
      });

      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100">
      
      {/* ENTERPRISE HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
            <BarChart2 className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            AI Data Analyst
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Secure
          </div>
          
          {/* THEME TOGGLE BUTTON */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Upload & Chat */}
        <div className="xl:col-span-4 space-y-6 flex flex-col">
          
          {/* UPLOAD PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">
              Dataset Configuration
            </h2>
            <label className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 group">
              <UploadCloud className="w-8 h-8 text-blue-400 dark:text-blue-500 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">Click to upload CSV or Excel</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Maximum file size 50MB</span>
              <input id="file-upload" type="file" className="hidden" accept=".csv, .xlsx" onChange={handleFileUpload} />
            </label>
            
            {loading && (
              <div className="mt-5 text-center text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-3 bg-blue-50 dark:bg-blue-900/30 py-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="w-4 h-4 rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin" />
                Processing your data securely...
              </div>
            )}
            
            {file && !loading && (
              <div className="mt-5 flex items-center justify-between p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/30 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-slate-600 shadow-sm">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={handleClearFile} 
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900 hover:shadow-sm transition-all group"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* CHAT PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 p-6 flex flex-col flex-1 min-h-[500px] transition-colors duration-300">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              AI Query Assistant
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-5 pr-2 bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-800/50 dark:to-purple-900/10 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
              {chatHistory.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 text-sm mt-16 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <MessageSquare className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                  </div>
                  <span className="font-medium">{analysis ? "Data loaded. Ask natural language questions below." : "Awaiting dataset upload..."}</span>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white ml-8 rounded-tr-sm shadow-md font-medium' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-8 rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm font-medium'
                  }`}>
                    {msg.content}
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="p-4 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-12 rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 w-max">
                   <div className="w-2 h-2 rounded-full bg-purple-300 dark:bg-purple-600 animate-pulse" />
                   <div className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-500 animate-pulse delay-75" />
                   <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse delay-150" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder={analysis ? "Type your question..." : "Upload data to enable chat"}
                disabled={!analysis || chatLoading}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-sm"
              />
              <button 
                onClick={handleChat}
                disabled={!analysis || chatLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dashboard */}
        <div className="xl:col-span-8 space-y-6">
          {analysis ? (
            <>
              {/* INSIGHTS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Key Trends</h3>
                  </div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2.5">
                    {analysis.ai_insights?.insights?.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start"><span className="text-blue-500 font-bold mt-0.5">·</span> <span>{item}</span></li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-md">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Anomalies Detected</h3>
                  </div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2.5">
                    {analysis.ai_insights?.anomalies?.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start"><span className="text-amber-500 font-bold mt-0.5">·</span> <span>{item}</span></li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-md">
                      <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Strategic Actions</h3>
                  </div>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2.5">
                    {analysis.ai_insights?.recommendations?.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start"><span className="text-emerald-500 font-bold mt-0.5">·</span> <span>{item}</span></li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* DATA VISUALIZATION */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 p-8 h-[480px] flex flex-col transition-colors duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    {analysis.ml_predictions?.forecast ? 'Time Series Forecast' : 'Dataset Overview'}
                  </h2>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                    Powered by Prophet ML
                  </div>
                </div>
                
                {analysis.ml_predictions?.forecast ? (
                  <div className="w-full flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={
                        analysis.ml_predictions.forecast.data.forecast_dates.map((date, i) => ({
                          date: date,
                          predicted: analysis.ml_predictions.forecast.data.predicted_values[i],
                          upper: analysis.ml_predictions.forecast.data.upper_bound[i],
                          lower: analysis.ml_predictions.forecast.data.lower_bound[i]
                        }))
                      } margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} dy={10} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                            borderRadius: '8px', 
                            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            color: isDarkMode ? '#f8fafc' : '#0f172a'
                          }} 
                          itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#475569' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                        <Line type="monotone" dataKey="predicted" stroke="#4f46e5" strokeWidth={3} dot={false} name="Forecast" activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="upper" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Upper Bound" />
                        <Line type="monotone" dataKey="lower" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Lower Bound" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <BarChart2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium">No time series date columns found.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload a dataset with a standard date column to generate forecasts.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center transition-colors duration-300">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800">
                <BarChart2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3 tracking-tight">Enterprise Analytics Ready</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-base leading-relaxed">
                Connect your CSV or Excel datasets to our automated pipeline. The system will securely analyze your data, extract key insights, and run Prophet ML forecasts instantly.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
