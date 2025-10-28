import { useEffect, useState } from "react";
import {
  getAppointments,
  updateAppointment,
  deleteAppointment,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Filter,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Stethoscope,
  FileText,
} from "lucide-react";

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter((apt) => apt.status === statusFilter)
      );
    }
  }, [statusFilter, appointments]);

  const loadAppointments = async () => {
    try {
      const data = await getAppointments();
      setAppointments(data);
      setFilteredAppointments(data);
    } catch (error) {
      console.error("Failed to load appointments", error);
      alert("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      alert(`Appointment ${newStatus} successfully!`);
      loadAppointments();
    } catch (error) {
      alert("Failed to update appointment status");
      console.error(error);
    }
  };

  const handleDelete = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await deleteAppointment(appointmentId);
        alert("Appointment deleted successfully!");
        loadAppointments();
      } catch (error) {
        alert("Failed to delete appointment");
        console.error(error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      no_show: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const canModifyAppointment = (appointment) => {
    if (user.role === "admin") return true;
    if (user.role === "doctor") return true;
    if (user.role === "patient") {
      return ["pending", "confirmed"].includes(appointment.status);
    }
    return false;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const viewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                My Appointments
              </h1>
            </div>
          </div>
          {user?.role === "patient" && (
            <button
              onClick={() => navigate("/appointments/new")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
            >
              + Book New Appointment
            </button>
          )}
        </div>

        {/* Filter Section */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filter by status:
            </span>
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "confirmed", "completed", "cancelled"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                      statusFilter === status
                        ? "bg-blue-600 text-white shadow"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== "all"
                ? `No ${statusFilter} appointments at the moment.`
                : "You haven't booked any appointments yet."}
            </p>
            {user?.role === "patient" && (
              <button
                onClick={() => navigate("/appointments/new")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Book Your First Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Appointment Header */}
                    <div className="flex items-center mb-4">
                      <span className="text-lg font-bold text-gray-900 mr-4">
                        {appointment.appointment_number}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Date & Time
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(appointment.appointment_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {appointment.reason && (
                      <div className="mb-3 bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          Reason for Visit
                        </p>
                        <p className="text-sm text-gray-700">
                          {appointment.reason}
                        </p>
                      </div>
                    )}

                    {/* Doctor's Notes, Diagnosis, Prescription */}
                    {(appointment.notes ||
                      appointment.diagnosis ||
                      appointment.prescription) && (
                      <button
                        onClick={() => viewDetails(appointment)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Medical Details →
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {canModifyAppointment(appointment) && (
                    <div className="ml-4 flex flex-col space-y-2">
                      {user.role === "doctor" &&
                        appointment.status === "confirmed" && (
                          <button
                            onClick={() =>
                              navigate(
                                `/appointments/${appointment.id}/details`
                              )
                            }
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm shadow-sm"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Add Details
                          </button>
                        )}
                      {user.role === "doctor" &&
                        appointment.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(appointment.id, "confirmed")
                              }
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(appointment.id, "cancelled")
                              }
                              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm shadow-sm"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </button>
                          </>
                        )}
                      {user.role === "doctor" &&
                        appointment.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "completed")
                            }
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </button>
                        )}
                      {user.role === "patient" &&
                        ["pending", "confirmed"].includes(
                          appointment.status
                        ) && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "cancelled")
                            }
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm shadow-sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        )}
                      {(user.role === "admin" ||
                        (user.role === "patient" &&
                          appointment.status === "cancelled")) && (
                        <button
                          onClick={() => handleDelete(appointment.id)}
                          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm shadow-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Medical Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">
                    Appointment Number
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedAppointment.appointment_number}
                  </p>
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Doctor's Notes
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  </div>
                )}

                {selectedAppointment.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Diagnosis
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-gray-700">
                        {selectedAppointment.diagnosis}
                      </p>
                    </div>
                  </div>
                )}

                {selectedAppointment.prescription && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Prescription
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-line">
                        {selectedAppointment.prescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
