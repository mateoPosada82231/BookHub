"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faStar,
  faSpinner,
  faMapMarkerAlt,
  faClock,
  faScissors,
  faUser,
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faCheck,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { appointmentsApi } from "@/lib/api/appointments";
import { Business, Service, Worker, WorkerSchedule, Review } from "@/types";
import { ImageGallery } from "@/components/ImageGallery";
import { ReviewList, ReviewsSummary } from "@/components/ReviewList";
import Image from "next/image";
import "@/styles/negocio.css";
import "@/styles/reviews.css";

// Booking steps
type BookingStep = "service" | "worker" | "datetime" | "confirm";

// Generate time slots for a day
function generateTimeSlots(
  schedule: WorkerSchedule | undefined,
  duration: number,
): string[] {
  if (!schedule || !schedule.is_available) return [];

  const slots: string[] = [];
  const [startHour, startMin] = schedule.start_time.split(":").map(Number);
  const [endHour, endMin] = schedule.end_time.split(":").map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin + duration <= endMin)
  ) {
    const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin
      .toString()
      .padStart(2, "0")}`;
    slots.push(timeStr);

    currentMin += 30; // 30-minute intervals
    if (currentMin >= 60) {
      currentHour += 1;
      currentMin -= 60;
    }
  }

  return slots;
}

// Format date for display
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

// Check if a date is in the past
function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

// Check if a date is today
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// Check if a time slot is in the past (with 15-minute buffer)
function isTimeSlotInPast(date: Date, timeSlot: string): boolean {
  const [hours, minutes] = timeSlot.split(":").map(Number);
  const slotDate = new Date(date);
  slotDate.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const bufferTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes ahead

  return slotDate < bufferTime;
}

// Generate dates for the next 14 days
function generateDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  return dates;
}

function NegocioContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const businessId = Number(params.id);

  // State
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Booking state
  const [step, setStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Availability state
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Available dates
  const availableDates = useMemo(() => generateDates(), []);

  // Load business data
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setLoading(true);
        const [businessData, servicesData, workersData] = await Promise.all([
          api.getBusinessById(businessId),
          api.getServices(businessId),
          api.getWorkers(businessId),
        ]);

        setBusiness(businessData);
        setServices(servicesData.filter((s) => s.active));
        setWorkers(workersData.filter((w) => w.active));
      } catch (err) {
        console.error("Error loading business:", err);
        setError("No se pudo cargar la información del negocio");
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadBusinessData();
    }
  }, [businessId]);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        const reviewsData = await api.getBusinessReviews(businessId, 0, 50);
        setReviews(reviewsData.content);
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (businessId) {
      loadReviews();
    }
  }, [businessId]);

  // Load worker availability when worker, date or service changes
  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedWorker || !selectedDate || !selectedService) {
        setBookedSlots([]);
        return;
      }

      try {
        setLoadingAvailability(true);
        const dateStr = selectedDate.toISOString().split("T")[0];
        const availability = await appointmentsApi.getWorkerAvailability(
          selectedWorker.id,
          dateStr,
          selectedService.duration_minutes,
        );

        // Extract booked slots (slots where available is false)
        const booked = availability.available_slots
          .filter((slot) => !slot.available)
          .map((slot) => slot.start_time);

        setBookedSlots(booked);
      } catch (err) {
        console.error("Error loading availability:", err);
        setBookedSlots([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [selectedWorker, selectedDate, selectedService]);

  // Get available time slots for selected date and worker
  const availableTimeSlots = useMemo(() => {
    if (!selectedWorker || !selectedDate || !selectedService) return [];

    const dayOfWeek = getDayOfWeek(selectedDate);
    const schedule = selectedWorker.schedules?.find(
      (s) => s.day_of_week === dayOfWeek,
    );

    return generateTimeSlots(schedule, selectedService.duration_minutes);
  }, [selectedWorker, selectedDate, selectedService]);

  // Handle booking
  const handleBooking = async () => {
    if (!isAuthenticated) {
      router.push(
        `/login?returnTo=${encodeURIComponent(`/negocio/${businessId}`)}`,
      );
      return;
    }
    if (!selectedService || !selectedWorker || !selectedDate || !selectedTime) {
      return;
    }

    try {
      setIsBooking(true);

      // Format date and time for API
      const dateStr = selectedDate.toISOString().split("T")[0];
      const startTimeStr = `${dateStr}T${selectedTime}:00`;

      await api.createAppointment({
        business_id: businessId,
        service_id: selectedService.id,
        worker_id: selectedWorker.id,
        start_time: startTimeStr,
        client_notes: bookingNotes || undefined,
      });

      setBookingSuccess(true);
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError("No se pudo crear la cita. Por favor, intenta de nuevo.");
    } finally {
      setIsBooking(false);
    }
  };

  // Go to next step
  const goToNextStep = () => {
    // Require auth to proceed with booking
    if (!isAuthenticated) {
      router.push(
        `/login?returnTo=${encodeURIComponent(`/negocio/${businessId}`)}`,
      );
      return;
    }
    if (step === "service" && selectedService) setStep("worker");
    else if (step === "worker" && selectedWorker) setStep("datetime");
    else if (step === "datetime" && selectedDate && selectedTime)
      setStep("confirm");
  };

  // Go to previous step
  const goToPreviousStep = () => {
    if (step === "worker") setStep("service");
    else if (step === "datetime") setStep("worker");
    else if (step === "confirm") setStep("datetime");
  };

  // Reset booking
  const resetBooking = () => {
    setStep("service");
    setSelectedService(null);
    setSelectedWorker(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingNotes("");
    setBookingSuccess(false);
  };

  // Loading state
  if (loading) {
    return (
      <LoadingSpinner size="lg" message="Cargando negocio..." fullScreen />
    );
  }

  // Error state
  if (error || !business) {
    return (
      <div className="negocio-container">
        <Navbar />
        <main className="negocio-main">
          <div className="negocio-error">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <h2>{error || "Negocio no encontrado"}</h2>
            <button className="btn-primary" onClick={() => router.push("/")}>
              Volver al inicio
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Success state
  if (bookingSuccess) {
    return (
      <div className="negocio-container">
        <Navbar />
        <main className="negocio-main">
          <div className="booking-success">
            <div className="success-icon">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <h2>¡Cita reservada!</h2>
            <p>Tu cita ha sido reservada exitosamente.</p>

            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Servicio</span>
                <span className="detail-value">{selectedService?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Profesional</span>
                <span className="detail-value">
                  {selectedWorker?.full_name}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha</span>
                <span className="detail-value">
                  {selectedDate && formatDateDisplay(selectedDate)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Hora</span>
                <span className="detail-value">{selectedTime}</span>
              </div>
            </div>

            <div className="success-actions">
              <button
                className="btn-primary"
                onClick={() => router.push("/mis-citas")}
              >
                Ver mis citas
              </button>
              <button className="btn-secondary" onClick={resetBooking}>
                Reservar otra cita
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="negocio-container">
      <Navbar />
      <main className="negocio-main">
        <div className="negocio-content">
          {/* Back button */}
          <button className="back-button" onClick={() => router.back()}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver
          </button>

          {/* Business header */}
          <div className="business-hero">
            <div className="business-hero-image">
              {business.cover_image_url ? (
                <Image
                  src={business.cover_image_url}
                  alt={business.name}
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              ) : (
                <div className="hero-placeholder">
                  <FontAwesomeIcon icon={faScissors} />
                </div>
              )}
            </div>
            <div className="business-hero-info">
              <span className="business-category">{business.category}</span>
              <h1 className="business-name">{business.name}</h1>
              <div className="business-meta">
                <span className="business-rating">
                  <FontAwesomeIcon icon={faStar} className="star-icon" />
                  {business.average_rating?.toFixed(1) || "Nuevo"}
                </span>
                <span className="business-address">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  {business.address}
                </span>
              </div>
              {business.description && (
                <p className="business-description">{business.description}</p>
              )}
            </div>
          </div>

          {/* Booking section */}
          <div className="booking-section">
            <h2 className="booking-title">Reservar cita</h2>

            {/* Progress steps */}
            <div className="booking-progress">
              <div
                className={`progress-step ${step === "service" ? "active" : ""} ${["worker", "datetime", "confirm"].includes(step) ? "completed" : ""}`}
              >
                <div className="step-number">1</div>
                <span>Servicio</span>
              </div>
              <div
                className={`progress-step ${step === "worker" ? "active" : ""} ${["datetime", "confirm"].includes(step) ? "completed" : ""}`}
              >
                <div className="step-number">2</div>
                <span>Profesional</span>
              </div>
              <div
                className={`progress-step ${step === "datetime" ? "active" : ""} ${step === "confirm" ? "completed" : ""}`}
              >
                <div className="step-number">3</div>
                <span>Fecha y hora</span>
              </div>
              <div
                className={`progress-step ${step === "confirm" ? "active" : ""}`}
              >
                <div className="step-number">4</div>
                <span>Confirmar</span>
              </div>
            </div>

            {/* Step content */}
            <div className="booking-step-content">
              {/* Step 1: Select Service */}
              {step === "service" && (
                <div className="step-service">
                  <h3>Selecciona un servicio</h3>
                  <div className="services-grid">
                    {services.length === 0 ? (
                      <p className="no-items">No hay servicios disponibles</p>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service.id}
                          className={`service-card ${selectedService?.id === service.id ? "selected" : ""}`}
                          onClick={() => setSelectedService(service)}
                        >
                          <div className="service-card-info">
                            <h4>{service.name}</h4>
                            {service.description && (
                              <p>{service.description}</p>
                            )}
                            <div className="service-card-meta">
                              <span>
                                <FontAwesomeIcon icon={faClock} />
                                {service.duration_minutes} min
                              </span>
                              <span className="service-price">
                                ${service.price.toLocaleString("es-CO")}
                              </span>
                            </div>
                          </div>
                          {selectedService?.id === service.id && (
                            <div className="selected-check">
                              <FontAwesomeIcon icon={faCheck} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Worker */}
              {step === "worker" && (
                <div className="step-worker">
                  <h3>Selecciona un profesional</h3>
                  <div className="workers-grid">
                    {workers.length === 0 ? (
                      <p className="no-items">
                        No hay profesionales disponibles
                      </p>
                    ) : (
                      workers.map((worker) => (
                        <div
                          key={worker.id}
                          className={`worker-card ${selectedWorker?.id === worker.id ? "selected" : ""}`}
                          onClick={() => setSelectedWorker(worker)}
                        >
                          <div className="worker-avatar">
                            {worker.avatar_url ? (
                              <Image
                                src={worker.avatar_url}
                                alt={worker.full_name}
                                width={48}
                                height={48}
                                loading="lazy"
                                style={{
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                }}
                              />
                            ) : (
                              <span>{worker.full_name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="worker-info">
                            <h4>{worker.full_name}</h4>
                            {worker.position && <p>{worker.position}</p>}
                          </div>
                          {selectedWorker?.id === worker.id && (
                            <div className="selected-check">
                              <FontAwesomeIcon icon={faCheck} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Select Date and Time */}
              {step === "datetime" && (
                <div className="step-datetime">
                  <h3>Selecciona fecha y hora</h3>

                  {/* Date picker */}
                  <div className="date-picker">
                    <h4>Fecha</h4>
                    <div className="dates-scroll">
                      {availableDates.map((date) => {
                        const isSelected =
                          selectedDate?.toDateString() === date.toDateString();
                        const dayOfWeek = getDayOfWeek(date);
                        const hasSchedule = selectedWorker?.schedules?.some(
                          (s) => s.day_of_week === dayOfWeek && s.is_available,
                        );

                        return (
                          <button
                            key={date.toISOString()}
                            className={`date-option ${isSelected ? "selected" : ""} ${!hasSchedule || isDateInPast(date) ? "disabled" : ""}`}
                            onClick={() =>
                              hasSchedule &&
                              !isDateInPast(date) &&
                              setSelectedDate(date)
                            }
                            disabled={!hasSchedule || isDateInPast(date)}
                            title={
                              isDateInPast(date)
                                ? "Fecha pasada"
                                : !hasSchedule
                                  ? "Sin horario"
                                  : ""
                            }
                          >
                            <span className="date-weekday">
                              {date.toLocaleDateString("es-ES", {
                                weekday: "short",
                              })}
                            </span>
                            <span className="date-day">{date.getDate()}</span>
                            <span className="date-month">
                              {date.toLocaleDateString("es-ES", {
                                month: "short",
                              })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time picker */}
                  {selectedDate && (
                    <div className="time-picker">
                      <h4>Hora</h4>
                      {loadingAvailability ? (
                        <div className="loading-slots">
                          <FontAwesomeIcon icon={faSpinner} spin />
                          <span>Cargando disponibilidad...</span>
                        </div>
                      ) : (
                        <div className="times-grid">
                          {availableTimeSlots.length === 0 ? (
                            <p className="no-items">
                              No hay horarios disponibles para esta fecha
                            </p>
                          ) : (
                            availableTimeSlots.map((time) => {
                              const isInPast = isTimeSlotInPast(
                                selectedDate,
                                time,
                              );
                              const isBooked = bookedSlots.includes(time);
                              const isDisabled = isInPast || isBooked;

                              return (
                                <button
                                  key={time}
                                  className={`time-option ${selectedTime === time ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                                  onClick={() =>
                                    !isDisabled && setSelectedTime(time)
                                  }
                                  disabled={isDisabled}
                                  title={
                                    isInPast
                                      ? "Hora pasada"
                                      : isBooked
                                        ? "Ocupado"
                                        : ""
                                  }
                                >
                                  {time}
                                  {isBooked && !isInPast && (
                                    <span className="slot-badge-busy">
                                      Ocupado
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Confirm */}
              {step === "confirm" && (
                <div className="step-confirm">
                  <h3>Confirma tu reserva</h3>

                  <div className="booking-summary">
                    <div className="summary-item">
                      <FontAwesomeIcon
                        icon={faScissors}
                        className="summary-icon"
                      />
                      <div>
                        <span className="summary-label">Servicio</span>
                        <span className="summary-value">
                          {selectedService?.name}
                        </span>
                      </div>
                      <span className="summary-price">
                        ${selectedService?.price.toLocaleString("es-CO")}
                      </span>
                    </div>

                    <div className="summary-item">
                      <FontAwesomeIcon icon={faUser} className="summary-icon" />
                      <div>
                        <span className="summary-label">Profesional</span>
                        <span className="summary-value">
                          {selectedWorker?.full_name}
                        </span>
                      </div>
                    </div>

                    <div className="summary-item">
                      <FontAwesomeIcon
                        icon={faCalendarAlt}
                        className="summary-icon"
                      />
                      <div>
                        <span className="summary-label">Fecha y hora</span>
                        <span className="summary-value">
                          {selectedDate && formatDateDisplay(selectedDate)} a
                          las {selectedTime}
                        </span>
                      </div>
                    </div>

                    <div className="summary-item">
                      <FontAwesomeIcon
                        icon={faClock}
                        className="summary-icon"
                      />
                      <div>
                        <span className="summary-label">Duración</span>
                        <span className="summary-value">
                          {selectedService?.duration_minutes} minutos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-notes">
                    <label htmlFor="notes">Notas adicionales (opcional)</label>
                    <textarea
                      id="notes"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Ej: Prefiero un corte más corto en los lados..."
                      rows={3}
                    />
                  </div>

                  <div className="booking-total">
                    <span>Total</span>
                    <span className="total-price">
                      ${selectedService?.price.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="booking-navigation">
              {step !== "service" && (
                <button className="btn-secondary" onClick={goToPreviousStep}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Anterior
                </button>
              )}

              {step === "confirm" ? (
                <button
                  className="btn-primary"
                  onClick={handleBooking}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Reservando...
                    </>
                  ) : (
                    <>
                      Confirmar reserva
                      <FontAwesomeIcon icon={faCheck} />
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={goToNextStep}
                  disabled={
                    (step === "service" && !selectedService) ||
                    (step === "worker" && !selectedWorker) ||
                    (step === "datetime" && (!selectedDate || !selectedTime))
                  }
                >
                  Siguiente
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="booking-error">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {error}
                <button onClick={() => setError(null)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            )}
          </div>

          {/* Gallery section */}
          {business.gallery_images && business.gallery_images.length > 0 && (
            <ImageGallery
              images={business.gallery_images}
              businessName={business.name}
            />
          )}

          {/* Reviews section */}
          <div className="reviews-section">
            <div className="reviews-section-header">
              <h3>Reseñas</h3>
              <ReviewsSummary
                averageRating={business.average_rating}
                totalReviews={business.total_reviews}
              />
            </div>
            <ReviewList reviews={reviews} loading={reviewsLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NegocioPage() {
  return <NegocioContent />;
}
