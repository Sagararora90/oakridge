import { create } from 'zustand';
import api from '../services/api';

const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  subjects: [],
  projections: [],
  timetable: [],
  exams: [],
  aiBrief: '',
  theme: localStorage.getItem('theme') || 'light',
  notifications: [],
  loading: false,
  error: null,
  updatingAttendance: {}, // subjectId -> boolean

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    set({ theme: newTheme });
  },

  signup: async (userData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/signup', userData);
      localStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, subjects: [], timetable: [], projections: [] });
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/user');
      set({ 
        user: res.data, 
        subjects: res.data.subjects, 
        timetable: res.data.timetable,
        semesterEndDate: res.data.semesterEndDate
      });
    } catch (err) {
      set({ user: null, token: null });
      localStorage.removeItem('token');
    }
  },

  fetchSubjects: async () => {
    try {
      const res = await api.get('/subjects');
      set({ subjects: res.data });
    } catch (err) {}
  },

  fetchProjections: async (endDate) => {
    try {
      const res = await api.get(`/subjects/projections?endDate=${endDate}`);
      set({ projections: res.data });
    } catch (err) {}
  },

  addSubject: async (subjectData) => {
    try {
      const res = await api.post('/subjects', subjectData);
      set((state) => ({ subjects: [...state.subjects, res.data] }));
    } catch (err) {}
  },

  updateSubject: async (id, subjectData) => {
    try {
      const res = await api.put(`/subjects/${id}`, subjectData);
      set((state) => ({
        subjects: state.subjects.map((s) => (s._id === id ? res.data : s)),
      }));
    } catch (err) {}
  },

  markAttendance: async (id, status, credit = 1) => {
    if (get().updatingAttendance[id]) return;
    
    set((state) => ({ 
      updatingAttendance: { ...state.updatingAttendance, [id]: true } 
    }));

    try {
      const res = await api.put(`/subjects/${id}`, { status, credit });
      set((state) => ({
        subjects: state.subjects.map((s) => (s._id === id ? res.data : s)),
        updatingAttendance: { ...state.updatingAttendance, [id]: false }
      }));
    } catch (err) {
      set((state) => ({ 
        updatingAttendance: { ...state.updatingAttendance, [id]: false } 
      }));
      throw err;
    }
  },

  undoAttendance: async (id) => {
    if (get().updatingAttendance[id]) return;

    set((state) => ({ 
      updatingAttendance: { ...state.updatingAttendance, [id]: true } 
    }));

    try {
      const res = await api.put(`/subjects/${id}/undo`);
      set((state) => ({
        subjects: state.subjects.map((s) => (s._id === id ? res.data : s)),
        updatingAttendance: { ...state.updatingAttendance, [id]: false }
      }));
    } catch (err) {
      set((state) => ({ 
        updatingAttendance: { ...state.updatingAttendance, [id]: false } 
      }));
      throw err;
    }
  },

  setBaselineSnapshot: async (id, snapshotData) => {
    try {
      const res = await api.put(`/subjects/${id}/snapshot`, snapshotData);
      set((state) => ({
        subjects: state.subjects.map((s) => (s._id === id ? res.data : s)),
      }));
      toast.success('Snapshot baseline updated!');
    } catch (err) {
      toast.error('Failed to update baseline');
    }
  },

  autoFillMissed: async (startDate, endDate, status = 'Present') => {
    set({ loading: true });
    try {
      const res = await api.post('/subjects/batch-mark', { startDate, endDate, status });
      set({ subjects: res.data.subjects, loading: false });
      toast.success(res.data.message);
    } catch (err) {
      set({ loading: false });
      toast.error('Batch marking failed');
    }
  },

  addExtraAttendance: async (extraData) => {
    set({ loading: true });
    try {
      const res = await api.post('/subjects/extra-log', extraData);
      set((state) => ({
        subjects: state.subjects.map((s) => (s._id === extraData.subjectId ? res.data : s)),
        loading: false
      }));
      toast.success('Extra session logged!');
    } catch (err) {
      set({ loading: false });
      toast.error('Failed to log extra session');
    }
  },

  editDailyLog: async (id, logData) => {
    try {
      const res = await api.put(`/subjects/${id}/log`, logData);
      set((state) => ({
        subjects: state.subjects.map((s) => (s._id === id ? res.data : s)),
      }));
    } catch (err) {
      console.error('Failed to edit daily log:', err);
      throw err;
    }
  },

  fetchTimetable: async () => {
    try {
      const res = await api.get('/timetable');
      set({ timetable: res.data });
    } catch (err) {
      console.error('Fetch Timetable failed:', err);
    }
  },

  updateTimetable: async (timetableData) => {
    try {
      const res = await api.post('/timetable', timetableData);
      set({ timetable: res.data });
      return res.data;
    } catch (err) {
      console.error('Update Timetable failed:', err);
      set({ error: err.response?.data?.message || 'Failed to sync schedule' });
      throw err;
    }
  },

  uploadTimetableOCR: async (formData) => {
    set({ loading: true });
    try {
      const res = await api.post('/timetable/upload-ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set({ 
        subjects: res.data.subjects, 
        timetable: res.data.timetable, 
        loading: false 
      });
      return res.data;
    } catch (err) {
      set({ loading: false, error: 'OCR processing failed' });
      throw err;
    }
  },

  // Gamification
  gamification: { streak: 0, badges: [] },
  fetchGamification: async () => {
    try {
      const res = await api.get('/user/gamification');
      set({ gamification: res.data });
    } catch (err) {}
  },

  syncPortalAttendance: async (formData) => {
    set({ loading: true });
    try {
      const res = await api.post('/subjects/sync-portal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set({ subjects: res.data.subjects, loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false, error: 'Sync failed' });
      throw err;
    }
  },

  groups: [],
  semesterEndDate: localStorage.getItem('semesterEndDate') || null,
  fetchGroups: async () => {
    try {
      const res = await api.get('/groups');
      set({ groups: res.data });
    } catch (err) {}
  },
  createGroup: async (data) => {
    try {
      const res = await api.post('/groups', data);
      set(state => ({ groups: [...state.groups, res.data] }));
      return res.data;
    } catch (err) { throw err; }
  },
  joinGroup: async (inviteCode) => {
    try {
      const res = await api.post('/groups/join', { inviteCode });
      set(state => ({ groups: [...state.groups, res.data] }));
      return res.data;
    } catch (err) { throw err; }
  },
  updateSemesterEndDate: async (date) => {
    try {
      const res = await api.put('/user/semester-end', { date });
      set({ semesterEndDate: res.data.semesterEndDate });
      localStorage.setItem('semesterEndDate', res.data.semesterEndDate);
    } catch (err) {}
  },

  // Holiday management
  holidays: [],
  fetchHolidays: async () => {
    try {
      const res = await api.get('/user/holidays');
      set({ holidays: res.data });
    } catch (err) {}
  },
  addHoliday: async (date, label) => {
    try {
      const res = await api.post('/user/holidays', { date, label });
      set({ holidays: res.data });
    } catch (err) {}
  },
  deleteHoliday: async (id) => {
    try {
      const res = await api.delete(`/user/holidays/${id}`);
      set({ holidays: res.data });
    } catch (err) {}
  },

  // Extra Classes & Overrides
  extraClasses: [],
  fetchExtraClasses: async () => {
    try {
      const res = await api.get('/user/extra-classes');
      set({ extraClasses: res.data });
    } catch (err) {
      console.error('Error fetching extra classes:', err);
    }
  },

  fetchExams: async () => {
    try {
      const res = await api.get('/exams');
      set({ exams: res.data });
    } catch (err) {
      console.error('Fetch Exams failed:', err);
    }
  },

  addExam: async (examData) => {
    try {
      const res = await api.post('/exams', examData);
      set({ exams: res.data });
    } catch (err) {
      console.error('Add Exam failed:', err);
    }
  },

  deleteExam: async (id) => {
    try {
      const res = await api.delete(`/exams/${id}`);
      set({ exams: res.data });
    } catch (err) {
      console.error('Delete Exam failed:', err);
    }
  },

  fetchLeaderboard: async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/leaderboard`);
      return res.data;
    } catch (err) {
      console.error('Fetch Leaderboard failed:', err);
      return [];
    }
  },

  fetchAIBrief: async () => {
    try {
      const res = await api.get('/ai/brief');
      set({ aiBrief: res.data.briefing });
    } catch (err) {
      console.error('Error fetching AI brief:', err);
    }
  },
  addExtraClass: async (date, followsDay) => {
    try {
      const res = await api.post('/user/extra-classes', { date, followsDay });
      set({ extraClasses: res.data });
    } catch (err) {}
  },
  deleteExtraClass: async (id) => {
    try {
      const res = await api.delete(`/user/extra-classes/${id}`);
      set({ extraClasses: res.data });
    } catch (err) {}
  },

  getRecoveryDate: (subjectId) => {
    const { subjects, timetable, holidays, extraClasses, semesterEndDate } = get();
    const subject = subjects.find(s => s._id === subjectId);
    
    // Recovery forecasting requires parameters
    if (!semesterEndDate) return 'Set semester end to see date';
    if (!timetable.length) return 'Add schedule to see date';
    if (!subject) return null;

    const target = subject.requiredAttendance / 100;
    let currentAttended = subject.attended;
    let currentTotal = subject.total;

    // Safety Check
    if (currentTotal > 0 && currentAttended / currentTotal >= target) return 'Already safe';

    // Simulation should start from the NEXT class, not today if it's already marked
    const startFrom = new Date();
    startFrom.setHours(0, 0, 0, 0);

    // If the subject has a snapshot date, we ensure we don't simulate before it 
    // (though startFrom is likely always after it)
    const baseDate = subject.initialDate ? new Date(subject.initialDate) : null;
    const end = new Date(semesterEndDate);
    
    let checkDate = new Date(Math.max(startFrom, baseDate || 0));
    checkDate.setHours(0, 0, 0, 0);

    const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));
    const extraClassMap = {};
    extraClasses.forEach(ec => {
      extraClassMap[new Date(ec.date).toDateString()] = ec.followsDay;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Simulation Loop (Max 120 days safety break)
    let safetyCounter = 0;
    while (checkDate < end && safetyCounter < 120) {
      checkDate.setDate(checkDate.getDate() + 1);
      safetyCounter++;
      
      const dateStr = checkDate.toDateString();
      if (holidayDates.has(dateStr)) continue;

      let dayToFollow;
      if (extraClassMap[dateStr]) {
        dayToFollow = extraClassMap[dateStr];
      } else {
        dayToFollow = dayNames[checkDate.getDay()];
      }

      const daySchedule = timetable.find(t => t.day.toLowerCase() === dayToFollow.toLowerCase());
      
      if (daySchedule) {
        const slotsForSubject = daySchedule.slots.filter(slot => {
           const sId = slot.subject?._id || slot.subject?.toString() || slot.subject;
           return sId === subjectId;
        });

        if (slotsForSubject.length > 0) {
           slotsForSubject.forEach(slot => {
              currentAttended += (slot.credit || 1);
              currentTotal += (slot.credit || 1);
           });

           if (currentAttended / currentTotal >= target) {
              return checkDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
           }
        }
      }
    }

    return 'Impossible';
  },

  getRecoveryPlan: (subjectId) => {
    const { subjects, timetable, holidays, extraClasses, semesterEndDate } = get();
    const subject = subjects.find(s => s._id === subjectId);
    
    if (!semesterEndDate) return { status: 'error', message: 'Set semester end to see plan' };
    if (!timetable.length) return { status: 'error', message: 'Add schedule to see plan' };
    if (!subject) return { status: 'error', message: 'Subject not found' };

    const target = (subject.requiredAttendance || 75) / 100;
    let currentAttended = subject.attended;
    let currentTotal = subject.total;

    if (currentTotal > 0 && currentAttended / currentTotal >= target) return { status: 'safe' };

    const end = new Date(semesterEndDate);
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));
    const extraClassMap = {};
    extraClasses.forEach(ec => { extraClassMap[new Date(ec.date).toDateString()] = ec.followsDay; });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let safetyCounter = 0;
    const mandatoryDates = [];
    
    while (checkDate < end && safetyCounter < 120) {
      checkDate.setDate(checkDate.getDate() + 1);
      safetyCounter++;
      
      const dateStr = checkDate.toDateString();
      if (holidayDates.has(dateStr)) continue;

      let dayToFollow = extraClassMap[dateStr] || dayNames[checkDate.getDay()];
      const daySchedule = timetable.find(t => t.day.toLowerCase() === dayToFollow.toLowerCase());
      
      if (daySchedule) {
        const slotsForSubject = daySchedule.slots.filter(slot => {
           const sId = slot.subject?._id || slot.subject?.toString() || slot.subject;
           return sId === subjectId;
        });

        if (slotsForSubject.length > 0) {
           let classesOnThisDay = 0;
           slotsForSubject.forEach(slot => {
              const weight = slot.credit || 1;
              currentAttended += weight;
              currentTotal += weight;
              classesOnThisDay += weight;
           });

           if (classesOnThisDay > 0) {
              mandatoryDates.push({
                 date: new Date(checkDate).toISOString(),
                 classes: classesOnThisDay
              });
           }

           if (currentAttended / currentTotal >= target) {
              return { 
                 status: 'plan', 
                 targetDate: checkDate.toISOString(), 
                 dates: mandatoryDates,
                 totalRequired: mandatoryDates.reduce((a, d) => a + d.classes, 0)
              };
           }
        }
      }
    }
    return { status: 'impossible' };
  },

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      set({ notifications: res.data });
    } catch (err) {}
  },

  markNotificationsRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      }));
    } catch (err) {}
  },
}));

export default useStore;
