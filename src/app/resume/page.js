'use client';
// ============================================================
// Resume Upload + AI Analysis Page
// Upload PDF → extract skills → match internships → suggest improvements
// ============================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { resumeAPI } from '@/lib/api';

export default function ResumePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [activeResultTab, setActiveResultTab] = useState('suggestions');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setUploading(true);
    
    try {
      const data = await resumeAPI.upload(file);
      if (data.success) {
        setUploadResult(data);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setError('');
    setAnalyzing(true);
    
    try {
      const data = await resumeAPI.analyze();
      if (data.success) {
        setAnalysisResult(data);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Make sure you\'ve uploaded a resume first.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gray-900/50 border-b border-gray-800/50 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            🤖 AI Resume Analysis
          </h1>
          <p className="text-gray-500">
            Upload your resume and let AI find the best-matching internships for you
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Upload Section */}
          <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h2 className="text-lg font-semibold text-white mb-4">
                Step 1: Upload Resume
              </h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    file
                      ? 'border-violet-500/40 bg-violet-500/5'
                      : 'border-gray-700/50 hover:border-gray-600'
                  }`}
                  onClick={() => document.getElementById('resume-input').click()}
                >
                  <input
                    id="resume-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <div className="text-3xl mb-3">{file ? '📄' : '📤'}</div>
                  {file ? (
                    <>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {(file.size / 1024).toFixed(1)} KB • Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 font-medium">Drop your resume here</p>
                      <p className="text-gray-600 text-sm mt-1">PDF format, max 5MB</p>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload Resume'
                  )}
                </button>
              </form>

              {uploadResult && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-emerald-400 text-sm font-medium">✓ Resume uploaded successfully!</p>
                  {uploadResult.text_preview && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-3">{uploadResult.text_preview}</p>
                  )}
                </div>
              )}
            </div>

            {/* Analyze Section */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <h2 className="text-lg font-semibold text-white mb-4">
                Step 2: Analyze & Match
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                AI will extract your skills and match them against available internships.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !uploadResult}
                className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing with AI...
                  </span>
                ) : (
                  '🤖 Analyze Resume'
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6 lg:col-span-7 min-w-0">
            {analysisResult ? (
              <>
                {/* Result Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'suggestions', label: '💡 Suggestions', count: analysisResult.suggestions?.length },
                    { key: 'skills', label: '🎯 Skills', count: analysisResult.extracted_skills?.length },
                    { key: 'matches', label: '🏆 Matches', count: analysisResult.matches?.length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveResultTab(tab.key)}
                      className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all border ${
                        activeResultTab === tab.key
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                          : 'text-gray-500 hover:text-gray-300 border-gray-700/50 hover:border-gray-600/60'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-1.5 text-xs bg-gray-800 px-1.5 py-0.5 rounded-full">{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* SUGGESTIONS TAB */}
                {activeResultTab === 'suggestions' && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 shadow-xl shadow-black/20">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-white">
                        Resume Improvement Suggestions
                      </h3>
                      <span className="text-xs text-gray-500">
                        {analysisResult.suggestions?.length || 0} tips
                      </span>
                    </div>

                    {analysisResult.suggestions?.length > 0 ? (
                      <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1 scrollbar-thin">
                        {analysisResult.suggestions.map((tip, idx) => {
                          const priorityStyles = {
                            high: 'border-red-500/30 bg-red-500/5',
                            medium: 'border-amber-500/30 bg-amber-500/5',
                            low: 'border-emerald-500/30 bg-emerald-500/5',
                          };
                          const priorityBadge = {
                            high: 'bg-red-500/15 text-red-400 border-red-500/25',
                            medium: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
                            low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                          };
                          const categoryIcons = {
                            'Content': '📝',
                            'Formatting': '🎨',
                            'Skills': '⚡',
                            'Experience': '💼',
                            'Education': '🎓',
                            'Projects': '🔧',
                            'Keywords': '🔑',
                            'Impact': '📊',
                            'ATS Optimization': '🤖',
                          };

                          return (
                            <div
                              key={idx}
                              className={`border rounded-xl p-4 transition-all hover:shadow-lg ${
                                priorityStyles[tip.priority] || priorityStyles.medium
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-xl flex-shrink-0 mt-0.5">
                                  {categoryIcons[tip.category] || '💡'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <h4 className="text-sm font-semibold text-white">
                                      {tip.title}
                                    </h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${
                                      priorityBadge[tip.priority] || priorityBadge.medium
                                    }`}>
                                      {tip.priority}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800/50 text-gray-500 border border-gray-700/30">
                                      {tip.category}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400 leading-relaxed">
                                    {tip.suggestion}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-6">
                        No suggestions generated. Try uploading a different resume.
                      </p>
                    )}

                    {/* Summary Stats */}
                    {analysisResult.suggestions?.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-800/50 grid grid-cols-3 gap-4">
                        {['high', 'medium', 'low'].map((priority) => {
                          const count = analysisResult.suggestions.filter(s => s.priority === priority).length;
                          const colors = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-emerald-400' };
                          const labels = { high: 'High Priority', medium: 'Medium', low: 'Nice to Have' };
                          return (
                            <div key={priority} className="text-center">
                              <div className={`text-xl font-bold ${colors[priority]}`}>{count}</div>
                              <div className="text-xs text-gray-600">{labels[priority]}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SKILLS TAB */}
                {activeResultTab === 'skills' && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 shadow-xl shadow-black/20">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Extracted Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.extracted_skills?.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 text-sm bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {analysisResult.extracted_skills?.length === 0 && (
                      <p className="text-gray-500 text-sm mt-2">No skills could be extracted. Make sure your resume contains relevant technical skills.</p>
                    )}
                  </div>
                )}

                {/* MATCHES TAB */}
                {activeResultTab === 'matches' && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 shadow-xl shadow-black/20">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Top Matching Internships
                    </h3>
                    {analysisResult.matches?.length > 0 ? (
                      <div className="space-y-3">
                        {analysisResult.matches.map((match) => (
                          <div
                            key={match.internship._id}
                            className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 hover:border-gray-600/50 transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/internships/${match.internship._id}`}
                                  className="text-sm font-semibold text-white hover:text-violet-300 transition-colors"
                                >
                                  {match.internship.title}
                                </Link>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {match.internship.company} • {match.internship.location}
                                </p>
                                {match.matchingSkills?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {match.matchingSkills.map(s => (
                                      <span key={s} className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0 text-center">
                                <div className={`text-lg font-bold ${
                                  match.matchScore >= 70 ? 'text-emerald-400' :
                                  match.matchScore >= 40 ? 'text-amber-400' :
                                  'text-gray-400'
                                }`}>
                                  {match.matchScore}%
                                </div>
                                <div className="text-xs text-gray-600">match</div>
                              </div>
                            </div>
                            <a
                              href={match.internship.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-3 w-full text-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-500 hover:to-indigo-500 transition-all"
                            >
                              Apply Now 🚀
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No matching internships found. Try updating your resume with more skills.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-8 text-center shadow-xl shadow-black/20">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Analysis Results</h3>
                <p className="text-gray-500 text-sm">
                  Upload your resume and click &quot;Analyze&quot; to see:
                </p>
                <div className="flex flex-col gap-2 mt-4 text-sm text-gray-400">
                  <span>💡 Content improvement suggestions</span>
                  <span>🎯 Extracted skills from your resume</span>
                  <span>🏆 Best-matching internships with scores</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

