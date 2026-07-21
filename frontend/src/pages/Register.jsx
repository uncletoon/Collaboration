import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GraduationCap, Lock, Mail, User, BookOpen, Loader2 } from 'lucide-react';

const Register = ({ onSwitchLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [bio, setBio] = useState('');
  
  // Metadata state
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch institutions on mount
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await api.getInstitutions();
        setInstitutions(res.institutions || []);
      } catch (err) {
        console.error('Error fetching institutions:', err);
      }
    };
    loadInstitutions();
  }, []);

  // Fetch departments when selected institution changes
  useEffect(() => {
    if (!selectedInstitution) {
      setDepartments([]);
      setSelectedDepartment('');
      return;
    }

    const loadDepartments = async () => {
      setLoadingDepts(true);
      try {
        const res = await api.getDepartments(selectedInstitution);
        setDepartments(res.departments || []);
        setSelectedDepartment('');
      } catch (err) {
        console.error('Error fetching departments:', err);
      } finally {
        setLoadingDepts(false);
      }
    };
    loadDepartments();
  }, [selectedInstitution]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName || !role) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      await register({
        email,
        password,
        fullName,
        role,
        institutionId: selectedInstitution || null,
        departmentId: selectedDepartment || null,
        bio
      });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slatebg-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="w-full max-w-lg bg-slatebg-900 border border-slatebg-800 shadow-2xl rounded-2xl p-8 z-10 animate-slide-up relative">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-brand-950/40 border border-brand-800 rounded-2xl text-brand-400 mb-2 shadow-inner">
            <GraduationCap className="h-9 w-9 stroke-[1.2]" />
          </div>
          <h2 className="text-xl font-bold text-white">Create Account</h2>
          <p className="text-xs text-slatebg-400 mt-1">Join the cross-institutional academic network</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slatebg-500">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-600 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Email Address *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slatebg-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="john.doe@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-600 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Password *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slatebg-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-600 focus:outline-none focus:border-brand-500 text-white"
                  required
                />
              </div>
            </div>

            {/* Academic Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Academic Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm text-slatebg-100 focus:outline-none focus:border-brand-500 text-white"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="researcher">Researcher</option>
                <option value="admin">Institution Administrator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Institution Selection */}
            <div>
              <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Institution</label>
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm text-slatebg-100 focus:outline-none focus:border-brand-500 text-white"
              >
                <option value="">Select Institution...</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">
                Department {loadingDepts && <span className="text-[10px] text-brand-400 lowercase">(loading...)</span>}
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedInstitution || loadingDepts}
                className="w-full px-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm text-slatebg-100 disabled:opacity-50 focus:outline-none focus:border-brand-500 text-white"
              >
                <option value="">Select Department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-xs font-semibold text-slatebg-400 mb-1.5 uppercase tracking-wider">Academic Bio / Research Interests</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-slatebg-500">
                <BookOpen className="h-4.5 w-4.5" />
              </span>
              <textarea
                placeholder="Share your fields of study, academic focus, or research projects..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="3"
                className="w-full pl-9 pr-4 py-2.5 bg-slatebg-950 border border-slatebg-800 rounded-xl text-sm placeholder-slatebg-600 focus:outline-none focus:border-brand-500 text-white resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-950/40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slatebg-800 text-center">
          <p className="text-xs text-slatebg-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchLogin}
              className="text-brand-400 hover:text-brand-300 font-semibold underline transition-colors"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
// 
