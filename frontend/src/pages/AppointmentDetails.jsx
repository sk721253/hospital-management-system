import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAppointment, updateAppointment } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, FileText, Stethoscope, Pill, Save } from "lucide-react";

export default function AppointmentDetails() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [formData, setFormData] = useState({
    notes: "",
    diagnosis: "",
    prescription: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const data = await getAppointment(appointmentId);
      setAppointment(data);
      setFormData({
        notes: data.notes || "",
        diagnosis: data.diagnosis || "",
        prescription: data.prescription || "",
      });
    } catch (error) {
      console.error("Failed to load appointment", error);
      setError("Failed to load appointment details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateAppointment(appointmentId, formData);
      alert("Medical details saved successfully!");
      navigate("/appointments");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save medical details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate("/appointments")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/appointments")}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center">
            <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Medical Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Appointment: {appointment?.appointment_number}
              </p>
            </div>
          </div>
        </div>

        {/* Appointment Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appointment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(appointment?.appointment_date).toLocaleString(
                  "en-IN",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {appointment?.status.replace("_", " ")}
              </p>
            </div>
            {appointment?.reason && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Reason for Visit</p>
                <p className="text-sm text-gray-700 mt-1">
                  {appointment.reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Medical Details Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add Medical Details
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor's Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  Doctor's Notes
                </div>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="General observations, patient condition, examination findings..."
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                Record your observations during the consultation
              </p>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Stethoscope className="w-4 h-4 mr-2 text-gray-500" />
                  Diagnosis
                </div>
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Primary diagnosis, secondary conditions, ICD codes..."
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                Medical diagnosis based on examination
              </p>
            </div>

            {/* Prescription */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Pill className="w-4 h-4 mr-2 text-gray-500" />
                  Prescription
                </div>
              </label>
              <textarea
                name="prescription"
                value={formData.prescription}
                onChange={handleChange}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Example:
1. Medicine Name 500mg - Twice daily after meals - 7 days
2. Medicine Name 10mg - Once daily before sleep - 14 days

Instructions:
- Take with plenty of water
- Avoid alcohol
- Follow up after 1 week"
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                List medications with dosage, frequency, and duration
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate("/appointments")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Medical Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Important Guidelines
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Ensure all medical details are accurate and complete</li>
            <li>Use standard medical terminology</li>
            <li>Include follow-up instructions if necessary</li>
            <li>Patient will be able to view these details</li>
            <li>All records are timestamped and permanent</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
