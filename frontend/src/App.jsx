import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  UploadCloud, FileText, BarChart2, MessageSquare, TrendingUp, 
  AlertTriangle, Lightbulb, Trash2, ShieldCheck, Sun, Moon, 
  Database, Search, ChevronLeft, ChevronRight, HelpCircle, ArrowRight,
  TrendingDown, CheckCircle, Info
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('explorer');

  // Table pagination and search state
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 10;

  // Custom Chart Builder states
  const [chartType, setChartType] = useState('line');
  const [xAxisCol, setXAxisCol] = useState('');
  const [yAxisCol, setYAxisCol] = useState('');

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

  const API_BASE_URL = import.meta.env.PROD ? '' : 'http://127.0.0.1:8000';

  // Set default chart variables when analysis changes
  useEffect(() => {
    if (analysis) {
      // Pick first column for X axis
      if (analysis.columns && analysis.columns.length > 0) {
        setXAxisCol(analysis.columns[0]);
      }
      // Pick first numeric column for Y axis
      const numericColumns = analysis.columns.filter(col => {
        const stats = analysis.summary_stats[col];
        return stats && typeof stats.mean === 'number';
      });
      if (numericColumns.length > 0) {
        setYAxisCol(numericColumns[0]);
      } else if (analysis.columns && analysis.columns.length > 1) {
        setYAxisCol(analysis.columns[1]);
      }
      
      // Default to forecast tab if forecast ML results exist, otherwise explorer
      if (analysis.ml_predictions?.forecast) {
        setActiveTab('forecast');
      } else {
        setActiveTab('explorer');
      }
    }
  }, [analysis]);

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile) => {
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx')) {
        processFile(droppedFile);
      } else {
        alert("Only CSV and Excel files are supported");
      }
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const handleClearFile = () => {
    setFile(null);
    setAnalysis(null);
    setChatHistory([]);
    setTableSearch('');
    setTablePage(1);
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;
    if (!analysis) {
      alert("Please upload a dataset first.");
      return;
    }

    setChatHistory(prev => [...prev, { role: 'user', content: queryText }]);
    setChatLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chat`, {
        query: queryText,
        dataset_context: {
          columns: analysis.columns,
          summary_stats: analysis.summary_stats,
          ai_insights: analysis.ai_insights,
          data_rows_sample: analysis.preview_data
        }
      });

      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error answering your question. Please check the console log." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChat = () => {
    const query = chatQuery;
    setChatQuery('');
    sendQuery(query);
  };

  // Suggestion queries
  const suggestionQueries = [
    "What are the main insights or trends in this dataset?",
    "Detect any major anomalies or outliers",
    "List 3 actionable strategic recommendations",
    "Describe the distribution of the dataset values"
  ];

  // Calculate missing values summary count
  const totalMissingValues = useMemo(() => {
    if (!analysis || !analysis.missing_values) return 0;
    return Object.values(analysis.missing_values).reduce((sum, val) => sum + (val || 0), 0);
  }, [analysis]);

  // Table filtering and pagination calculation
  const filteredRows = useMemo(() => {
    if (!analysis || !analysis.preview_data) return [];
    if (!tableSearch.trim()) return analysis.preview_data;
    
    const searchLower = tableSearch.toLowerCase();
    return analysis.preview_data.filter(row => 
      Object.values(row).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
      )
    );
  }, [analysis, tableSearch]);

  const paginatedRows = useMemo(() => {
    const startIdx = (tablePage - 1) * tablePageSize;
    return filteredRows.slice(startIdx, startIdx + tablePageSize);
  }, [filteredRows, tablePage]);

  const totalPages = Math.ceil(filteredRows.length / tablePageSize) || 1;

  // Reset page number on search
  useEffect(() => {
    setTablePage(1);
  }, [tableSearch]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-100">
      
      {/* ENTERPRISE STUNNING HEADER */}
      <header className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BarChart2 className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              AI DATA ANALYST
            </h1>
            <p className="text-[10px] tracking-widest text-slate-400 dark:text-slate-500 font-bold uppercase">Enterprise Engine v1.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 shadow-sm transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Secure
          </div>
          
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 active:scale-95 cursor-pointer"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      <main className="max-w-[1500px] mx-auto p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Data Config & Chat Assistant */}
        <div className="xl:col-span-4 space-y-6 flex flex-col h-full">
          
          {/* DRAG AND DROP UPLOAD PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-6 transition-colors duration-300 hover-card-trigger">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" />
                Data Configuration
              </h2>
              {file && (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 rounded border border-indigo-100 dark:border-indigo-900/50">Active</span>
              )}
            </div>

            {!file ? (
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 text-center ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <UploadCloud className={`w-10 h-10 mb-3 transition-colors duration-200 ${dragActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Drag & Drop CSV / Excel</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Or click to browse from device</span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-3 font-extrabold tracking-wide uppercase">Requires .csv / .xlsx</span>
                <input id="file-upload" type="file" className="hidden" accept=".csv, .xlsx" onChange={handleFileUpload} />
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/50 dark:to-indigo-900/10 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={handleClearFile} 
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all group"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            )}
            
            {!file && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-2 text-slate-500 dark:text-slate-400 font-medium animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-350">
                  <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Suitable Datasets & Files</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] pl-1 font-semibold text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span>CSV & Excel files</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span>Numeric Metrics</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span>Date/Time Columns</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span>Sales & Stock Logs</span>
                  </li>
                </ul>
              </div>
            )}
            
            {loading && (
              <div className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/30 py-3 rounded-lg border border-indigo-100/50 dark:border-indigo-900/40 animate-pulse-border">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin" />
                Engine reading & indexing dataset...
              </div>
            )}
          </div>

          {/* AI CHAT PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col flex-1 min-h-[500px] transition-colors duration-300 hover-card-trigger">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              AI Analyst Chat
            </h2>
            
            {/* Conversations container */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 max-h-[360px] min-h-[220px]">
              {chatHistory.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 text-xs mt-12 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="font-semibold">{analysis ? "Upload complete. Ask custom questions or use the templates below." : "Awaiting data input to run chat..."}</span>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col gap-1 max-w-[85%] animate-fade-in ${
                      msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                      {msg.role === 'user' ? 'You' : 'Analyst AI'}
                    </span>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex flex-col gap-1 items-start max-w-[80%]">
                  <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Analyst AI</span>
                  <div className="p-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-none border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-1.5 w-max">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '0ms'}} />
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '150ms'}} />
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '300ms'}} />
                  </div>
                </div>
              )}
            </div>

            {/* Prompt suggestions / chips */}
            {analysis && (
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Suggested Queries</span>
                <div className="flex flex-wrap gap-2 max-h-[85px] overflow-y-auto pr-1">
                  {suggestionQueries.map((queryText, index) => (
                    <button
                      key={index}
                      onClick={() => sendQuery(queryText)}
                      disabled={chatLoading}
                      className="text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/30 text-slate-600 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-indigo-400 py-1.5 px-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer text-left truncate max-w-full"
                    >
                      {queryText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder={analysis ? "Ask questions about values, trends..." : "Upload data to query"}
                disabled={!analysis || chatLoading}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-100 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed transition-all shadow-inner"
              />
              <button 
                onClick={handleChat}
                disabled={!analysis || chatLoading}
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-400 text-white px-5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1.5"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dashboard Operations */}
        <div className="xl:col-span-8 space-y-6">
          {analysis ? (
            <div className="space-y-6">
              
              {/* STATS OVERVIEW CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover-card-trigger">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Records</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{analysis.rows_count.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover-card-trigger">
                  <div className="p-3 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 rounded-xl border border-pink-100/50 dark:border-pink-900/50">
                    <GridIcon />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Columns</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{analysis.columns.length}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover-card-trigger">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100/50 dark:border-amber-900/50">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Missing Cells</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{totalMissingValues.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm flex items-center gap-4 hover-card-trigger">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100/50 dark:border-emerald-900/50">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Accuracy Score</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                      {totalMissingValues === 0 ? '100%' : `${(100 - (totalMissingValues / (analysis.rows_count * analysis.columns.length)) * 100).toFixed(1)}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* TABS CONTAINER */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 flex flex-col overflow-hidden transition-colors duration-300">
                
                {/* TABS NAV */}
                <div className="flex border-b border-slate-200 dark:border-slate-800/80 px-6 bg-slate-50/50 dark:bg-slate-950/20">
                  <button 
                    onClick={() => setActiveTab('explorer')}
                    className={`py-4 px-4 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'explorer' 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    Data Explorer
                  </button>

                  <button 
                    onClick={() => setActiveTab('insights')}
                    className={`py-4 px-4 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'insights' 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Auto Insights
                  </button>

                  <button 
                    onClick={() => setActiveTab('charts')}
                    className={`py-4 px-4 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'charts' 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Chart Builder
                  </button>

                  {analysis.ml_predictions?.forecast && (
                    <button 
                      onClick={() => setActiveTab('forecast')}
                      className={`py-4 px-4 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'forecast' 
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      ML Forecast
                    </button>
                  )}
                </div>

                {/* TAB CONTENT: EXPLORER */}
                {activeTab === 'explorer' && (
                  <div className="p-6 space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dataset Raw Preview</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Previewing the first 100 rows loaded in workspace cache.</p>
                      </div>
                      
                      {/* TABLE SEARCH */}
                      <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          placeholder="Search records..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* DATA TABLE */}
                    <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-950">
                          <tr>
                            {analysis.columns.map((col, idx) => (
                              <th 
                                key={idx} 
                                className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {paginatedRows.length === 0 ? (
                            <tr>
                              <td colSpan={analysis.columns.length} className="px-4 py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                                No records found matching the search.
                              </td>
                            </tr>
                          ) : (
                            paginatedRows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                {analysis.columns.map((col, colIdx) => (
                                  <td 
                                    key={colIdx} 
                                    className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[200px]"
                                    title={String(row[col] ?? '')}
                                  >
                                    {row[col] === null || row[col] === undefined ? (
                                      <span className="text-[10px] font-black uppercase text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">NaN</span>
                                    ) : (
                                      String(row[col])
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {filteredRows.length > 0 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-bold text-slate-500">
                          Showing {Math.min(filteredRows.length, (tablePage - 1) * tablePageSize + 1)} - {Math.min(filteredRows.length, tablePage * tablePageSize)} of {filteredRows.length} rows
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTablePage(p => Math.max(1, p - 1))}
                            disabled={tablePage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            Page {tablePage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                            disabled={tablePage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: AUTO INSIGHTS */}
                {activeTab === 'insights' && (
                  <div className="p-6 space-y-6 animate-fade-in">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">AI Synthesized Intelligence</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">LLM generated overview pointing out observations, risks, and suggestions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* TRENDS */}
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Key Trends</h4>
                        </div>
                        <ul className="text-xs font-semibold text-slate-600 dark:text-slate-400 space-y-3">
                          {analysis.ai_insights?.insights?.length > 0 ? (
                            analysis.ai_insights.insights.map((item, i) => (
                              <li key={i} className="flex gap-2 items-start leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 font-medium italic">No obvious trends detected.</li>
                          )}
                        </ul>
                      </div>
                      
                      {/* ANOMALIES */}
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Anomalies Detected</h4>
                        </div>
                        <ul className="text-xs font-semibold text-slate-600 dark:text-slate-400 space-y-3">
                          {analysis.ai_insights?.anomalies?.length > 0 ? (
                            analysis.ai_insights.anomalies.map((item, i) => (
                              <li key={i} className="flex gap-2 items-start leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 font-medium italic flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              No data anomalies identified.
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* RECOMMENDATIONS */}
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
                            <Lightbulb className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Strategic Recommendations</h4>
                        </div>
                        <ul className="text-xs font-semibold text-slate-600 dark:text-slate-400 space-y-3">
                          {analysis.ai_insights?.recommendations?.length > 0 ? (
                            analysis.ai_insights.recommendations.map((item, i) => (
                              <li key={i} className="flex gap-2 items-start leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 font-medium italic">No immediate strategic advice generated.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: CHART BUILDER */}
                {activeTab === 'charts' && (
                  <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Interactive Visualization Studio</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Pick variables in the panel below to dynamically plot your custom graphs.</p>
                      </div>

                      {/* CHART BUILDER CONTROLS */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">X Axis</label>
                          <select 
                            value={xAxisCol}
                            onChange={(e) => setXAxisCol(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {analysis.columns.map((col, i) => (
                              <option key={i} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Y Axis</label>
                          <select 
                            value={yAxisCol}
                            onChange={(e) => setYAxisCol(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {analysis.columns.map((col, i) => (
                              <option key={i} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Chart Type</label>
                          <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
                            <button
                              onClick={() => setChartType('line')}
                              className={`px-2 py-1 text-[10px] font-bold rounded ${chartType === 'line' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                            >
                              Line
                            </button>
                            <button
                              onClick={() => setChartType('bar')}
                              className={`px-2 py-1 text-[10px] font-bold rounded ${chartType === 'bar' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                            >
                              Bar
                            </button>
                            <button
                              onClick={() => setChartType('area')}
                              className={`px-2 py-1 text-[10px] font-bold rounded ${chartType === 'area' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                            >
                              Area
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC CHART RENDER */}
                    <div className="h-[360px] w-full bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-4">
                      {xAxisCol && yAxisCol ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'line' ? (
                            <LineChart data={analysis.preview_data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                              <XAxis dataKey={xAxisCol} tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={tooltipStyles(isDarkMode)} />
                              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                              <Line type="monotone" dataKey={yAxisCol} stroke="#6366f1" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                            </LineChart>
                          ) : chartType === 'bar' ? (
                            <BarChart data={analysis.preview_data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                              <XAxis dataKey={xAxisCol} tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={tooltipStyles(isDarkMode)} />
                              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                              <Bar dataKey={yAxisCol} fill="#818cf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          ) : (
                            <AreaChart data={analysis.preview_data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                              <XAxis dataKey={xAxisCol} tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={tooltipStyles(isDarkMode)} />
                              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                              <Area type="monotone" dataKey={yAxisCol} stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#areaColor)" />
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <HelpCircle className="w-8 h-8 mb-2" />
                          <span className="text-xs font-semibold">Select variables above to generate visualizations.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PROPHET FORECAST */}
                {activeTab === 'forecast' && analysis.ml_predictions?.forecast && (
                  <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Prophet Time Series Forecast</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Auto-forecasting <span className="font-bold text-indigo-600 dark:text-indigo-400">"{analysis.ml_predictions.forecast.target_column}"</span> against <span className="font-bold text-slate-600 dark:text-slate-350">"{analysis.ml_predictions.forecast.date_column}"</span> for the next 30 intervals.
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/50 rounded-lg px-2.5 py-1 flex items-center gap-1">
                        Prophet AI Engine
                      </span>
                    </div>

                    {/* FORECAST CHART */}
                    <div className="h-[360px] w-full bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={
                          analysis.ml_predictions.forecast.data.forecast_dates.map((date, i) => ({
                            date: date,
                            predicted: analysis.ml_predictions.forecast.data.predicted_values[i],
                            upper: analysis.ml_predictions.forecast.data.upper_bound[i],
                            lower: analysis.ml_predictions.forecast.data.lower_bound[i]
                          }))
                        } margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                          <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} dy={5} />
                          <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={tooltipStyles(isDarkMode)} />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                          <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={3} dot={false} name="Forecast" activeDot={{ r: 5 }} />
                          <Line type="monotone" dataKey="upper" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1.2} dot={false} name="Upper Limit" />
                          <Line type="monotone" dataKey="lower" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth={1.2} dot={false} name="Lower Limit" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EMPTY STATE HERO */
            <div className="min-h-[660px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center p-12 text-center transition-colors duration-300 hover-card-trigger">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-100/80 dark:border-indigo-800/50 shadow-inner">
                <BarChart2 className="w-9 h-9 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">AI Data Analytics Workbench</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-xs font-semibold leading-relaxed mb-8">
                Connect your spreadsheets or comma-separated value database files. The analyst engine securely processes records, reveals internal anomalies, builds custom charts, and projects forecasts using automatic Prophet modeling.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl text-left space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest block">01. Ingestion</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">CSV and Excel uploads with instant parsing & vector storage.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl text-left space-y-1">
                  <span className="text-[10px] font-black uppercase text-pink-500 tracking-widest block">02. Insights</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">AI anomaly scanner detects extreme values & recommends actions.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl text-left space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block">03. Modeling</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Predictive Prophet forecasting pipelines with confidence bands.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Inline styling helpers
const tooltipStyles = (isDarkMode) => ({
  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
  borderRadius: '12px',
  border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  color: isDarkMode ? '#f8fafc' : '#0f172a',
  fontSize: '11px',
  fontFamily: 'sans-serif'
});

// Custom simple Lucide-like Grid icon fallback to avoid missing lucide icon crashes
function GridIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="lucide lucide-grid"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

export default App;
