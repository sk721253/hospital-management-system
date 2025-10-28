import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  const response = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Patient APIs
export const registerPatient = async (patientData) => {
  const response = await api.post('/patients/register', patientData);
  return response.data;
};

export const getPatients = async () => {
  const response = await api.get('/patients/');
  return response.data;
};

export const getMyPatientProfile = async () => {
  const response = await api.get('/patients/me');
  return response.data;
};

export const updatePatient = async (patientId, data) => {
  const response = await api.put(`/patients/${patientId}`, data);
  return response.data;
};

// Doctor APIs
export const getDoctors = async (specialization = null) => {
  const params = specialization ? { specialization } : {};
  const response = await api.get('/doctors/', { params });
  return response.data;
};

export const getDoctor = async (doctorId) => {
  const response = await api.get(`/doctors/${doctorId}`);
  return response.data;
};

export const getMyDoctorProfile = async () => {
  const response = await api.get('/doctors/me');
  return response.data;
};

// Appointment APIs
export const createAppointment = async (appointmentData) => {
  const response = await api.post('/appointments/', appointmentData);
  return response.data;
};

export const getAppointments = async (status = null) => {
  const params = status ? { status } : {};
  const response = await api.get('/appointments/', { params });
  return response.data;
};

export const getAppointment = async (appointmentId) => {
  const response = await api.get(`/appointments/${appointmentId}`);
  return response.data;
};

export const updateAppointment = async (appointmentId, data) => {
  const response = await api.put(`/appointments/${appointmentId}`, data);
  return response.data;
};

export const deleteAppointment = async (appointmentId) => {
  const response = await api.delete(`/appointments/${appointmentId}`);
  return response.data;
};

export default api;