import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Upload, 
  Trash2, 
  Download, 
  FileText, 
  Search,
  ExternalLink,
  Plus
} from 'lucide-react';

const Research = () => {
  const { user } = useAuth();
  
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Search keyword filter
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Form fields
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [authors, setAuthors] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadPapers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getResearch();
      setPapers(res.papers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title || !authors || !selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('authors', authors);
    formData.append('researchPaper', selectedFile);

    try {
      await api.uploadResearch(formData);
      setTitle('');
      setAbstract('');
      setAuthors('');
      setSelectedFile(null);
      document.getElementById('researchFileInput').value = '';
      setShowUploadModal(false);
      loadPapers();
    } catch (err) {
      alert(err.message || 'Research paper publication failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePaper = async (paperId) => {
    if (!window.confirm('Delete this research publication from repository?')) return;
    try {
      await api.deleteResearch(paperId);
      loadPapers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter papers locally by query
  const filteredPapers = papers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.abstract.toLowerCase().includes(q) ||
      p.authors.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slatebg-900 border border-slatebg-800 p-6 rounded-2xl gap-4">
        <div className="flex-1">
          <h3 className="text-base font-bold text-white">Research Publication Repository</h3>
          <p className="text-xs text-slatebg-400 mt-0.5">Explore peer-reviewed publications, dissertations, and preprint documents</p>
        </div>

        {/* Global Search keywords input */}
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slatebg-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slatebg-950 border border-slatebg-850 rounded-xl text-xs text-white focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Publish Paper</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slatebg-400 text-xs">Loading publications list...</div>
      ) : filteredPapers.length === 0 ? (
        <div className="bg-slatebg-900 border border-slatebg-850 rounded-xl p-12 text-center text-slatebg-500 text-xs">
          No matching academic publications found in the repository.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((p) => (
            <div
              key={p.id}
              className="bg-slatebg-900 border border-slatebg-800 p-5 rounded-xl flex flex-col md:flex-row justify-between gap-5 hover:border-slatebg-700 transition-colors"
            >
              {/* Paper metadata */}
              <div className="space-y-3 flex-grow max-w-3xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-brand-400 font-bold bg-brand-950/40 px-2 py-0.5 rounded border border-brand-900/30 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> PDF DOCUMENT
                  </span>
                  <span className="text-[10px] text-slatebg-400 font-medium">
                    Published: {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{p.title}</h4>
                
                <div>
                  <span className="text-[10px] text-slatebg-500 uppercase tracking-wider block font-semibold">Authors</span>
                  <span className="text-xs text-brand-300 font-medium">{p.authors}</span>
                </div>

                {p.abstract && (
                  <div>
                    <span className="text-[10px] text-slatebg-500 uppercase tracking-wider block font-semibold">Abstract</span>
                    <p className="text-xs text-slatebg-400 leading-relaxed text-justify mt-0.5">{p.abstract}</p>
                  </div>
                )}

                <div className="text-[10px] text-slatebg-550 pt-1 font-medium">
                  Source: {p.uploader_name} ({p.institution_name || 'Cross-Institutional'})
                </div>
              </div>

              {/* Action columns */}
              <div className="flex flex-row md:flex-col justify-end md:justify-center items-center shrink-0 border-t md:border-t-0 md:border-l border-slatebg-850 pt-3 md:pt-0 md:pl-5 gap-3.5">
                <a
                  href={api.getDownloadUrl(p.id)}
                  download
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 w-full md:w-32 justify-center shadow"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>

                {(p.uploaded_by === user.id || user.role === 'admin') && (
                  <button
                    onClick={() => handleDeletePaper(p.id)}
                    className="px-4 py-2 bg-slatebg-800 hover:bg-red-950/20 text-slatebg-400 hover:text-red-400 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 w-full md:w-32 justify-center border border-slatebg-800 hover:border-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Paper Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slatebg-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slatebg-900 border border-slatebg-800 shadow-2xl rounded-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Publish Research Paper</h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Paper Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Federated Learning on Medical Imaging Databases"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Authors List *</label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Jane Smith, John Doe, Prof. Alan Turing"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Abstract / Summary</label>
                <textarea
                  placeholder="Provide a concise abstract of your research goals, methodologies, and findings..."
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-650 focus:outline-none focus:border-brand-500 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase">Document File (PDF / DOC) *</label>
                <input
                  type="file"
                  id="researchFileInput"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slatebg-400 bg-slatebg-950 p-2.5 border border-slatebg-850 rounded-xl cursor-pointer file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slatebg-800 file:text-white file:cursor-pointer focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slatebg-800 hover:bg-slatebg-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {uploading ? 'Uploading Paper...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Research;
// 
