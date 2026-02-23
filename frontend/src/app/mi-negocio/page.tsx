"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faCalendarDays,
  faUsers,
  faStar,
  faPlus,
  faGear,
  faPen,
  faTrash,
  faClock,
  faSpinner,
  faScissors,
  faDollarSign,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type {
  BusinessSummary,
  Business,
  BusinessStats,
  Service,
  Worker,
  BusinessImage,
} from "@/types";
import Image from "next/image";
import "@/styles/mi-negocio.css";
import "@/styles/reviews.css";
import {
  BusinessForm,
  ServiceForm,
  WorkerForm,
  WorkerScheduleForm,
} from "./components";

function MiNegocioContent() {
  // Estados principales
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Estados de modales
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingWorkerSchedule, setEditingWorkerSchedule] =
    useState<Worker | null>(null);

  // Tab activo
  const [activeTab, setActiveTab] = useState<
    "overview" | "services" | "workers"
  >("overview");

  // Estados de galería
  const [galleryImages, setGalleryImages] = useState<BusinessImage[]>([]);
  const [showAddImageForm, setShowAddImageForm] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Estados de confirmación
  const [confirmAction, setConfirmAction] = useState<{
    type: "service" | "worker" | "image";
    id: number;
    message: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Cargar imágenes de galería
  const loadGalleryImages = useCallback(async (businessId: number) => {
    try {
      const images = await api.getBusinessImages(businessId);
      setGalleryImages(images);
    } catch (err: any) {
      console.error("Error loading gallery images:", err);
    }
  }, []);

  // Cargar detalles de un negocio
  const loadBusinessDetails = useCallback(
    async (id: number) => {
      try {
        const [business, servicesData, workersData] = await Promise.all([
          api.getBusinessById(id),
          api.getServices(id),
          api.getWorkers(id),
        ]);
        setSelectedBusiness(business);
        setServices(servicesData);
        setWorkers(workersData);
        loadGalleryImages(id);
        // Load stats in background
        api
          .getBusinessStats(id)
          .then(setBusinessStats)
          .catch(() => setBusinessStats(null));
      } catch (err: any) {
        console.error("Error loading business details:", err);
      }
    },
    [loadGalleryImages],
  );

  // Cargar mis negocios
  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMyBusinesses();
      setBusinesses(data);
      if (data.length > 0) {
        loadBusinessDetails(data[0].id);
      }
    } catch (err: any) {
      console.error("Error loading businesses:", err);
    } finally {
      setLoading(false);
    }
  }, [loadBusinessDetails]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  // Handlers de formularios
  const handleBusinessSaved = () => {
    setShowBusinessForm(false);
    loadBusinesses();
  };

  const handleServiceSaved = () => {
    setShowServiceForm(false);
    setEditingService(null);
    if (selectedBusiness) {
      loadBusinessDetails(selectedBusiness.id);
    }
  };

  const handleWorkerSaved = () => {
    setShowWorkerForm(false);
    if (selectedBusiness) {
      loadBusinessDetails(selectedBusiness.id);
    }
  };

  const handleScheduleSaved = () => {
    setShowScheduleForm(false);
    setEditingWorkerSchedule(null);
    if (selectedBusiness) {
      loadBusinessDetails(selectedBusiness.id);
    }
  };

  const handleEditSchedule = (worker: Worker) => {
    setEditingWorkerSchedule(worker);
    setShowScheduleForm(true);
  };

  const handleDeleteService = (serviceId: number) => {
    if (!selectedBusiness) return;
    setConfirmAction({
      type: "service",
      id: serviceId,
      message:
        "¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer.",
    });
  };

  const handleDeleteWorker = (workerId: number) => {
    if (!selectedBusiness) return;
    setConfirmAction({
      type: "worker",
      id: workerId,
      message:
        "¿Estás seguro de eliminar este trabajador? Se desvinculará del negocio.",
    });
  };

  // Handlers de galería
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !newImageUrl.trim()) return;

    setAddingImage(true);
    try {
      await api.addBusinessImage(selectedBusiness.id, {
        image_url: newImageUrl.trim(),
        caption: newImageCaption.trim() || undefined,
      });
      await loadGalleryImages(selectedBusiness.id);
      setNewImageUrl("");
      setNewImageCaption("");
      setShowAddImageForm(false);
      notify.success("Imagen agregada correctamente");
    } catch (err: any) {
      notify.error(err.message || "Error al agregar imagen");
    } finally {
      setAddingImage(false);
    }
  };

  const handleDeleteImage = (imageId: number) => {
    if (!selectedBusiness) return;
    setConfirmAction({
      type: "image",
      id: imageId,
      message: "¿Estás seguro de eliminar esta imagen de la galería?",
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !selectedBusiness) return;
    setConfirmLoading(true);
    try {
      switch (confirmAction.type) {
        case "service":
          await api.deleteService(selectedBusiness.id, confirmAction.id);
          notify.success("Servicio eliminado correctamente");
          break;
        case "worker":
          await api.removeWorker(selectedBusiness.id, confirmAction.id);
          notify.success("Trabajador eliminado correctamente");
          break;
        case "image":
          await api.removeBusinessImage(selectedBusiness.id, confirmAction.id);
          notify.success("Imagen eliminada correctamente");
          break;
      }
      loadBusinessDetails(selectedBusiness.id);
    } catch (err: any) {
      notify.error(
        err.message ||
          `Error al eliminar ${confirmAction.type === "service" ? "servicio" : confirmAction.type === "worker" ? "trabajador" : "imagen"}`,
      );
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  // Estado de carga
  if (loading && businesses.length === 0) {
    return (
      <LoadingSpinner size="lg" message="Cargando tus negocios..." fullScreen />
    );
  }

  return (
    <div className="mi-negocio-container">
      <Navbar />

      <main className="mi-negocio-main">
        <div className="mi-negocio-content">
          {/* Header */}
          <header className="mi-negocio-header">
            <div>
              <h1 className="page-title">Mi Negocio</h1>
              <p className="page-subtitle">
                Gestiona tu negocio, servicios y trabajadores
              </p>
            </div>
            <button
              onClick={() => setShowBusinessForm(true)}
              className="btn-primary"
            >
              <FontAwesomeIcon icon={faPlus} />
              Nuevo Negocio
            </button>
          </header>

          {/* Lista de negocios (si hay más de uno) */}
          {businesses.length > 1 && (
            <div className="business-selector">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => loadBusinessDetails(b.id)}
                  className={`business-selector-item ${
                    selectedBusiness?.id === b.id ? "active" : ""
                  }`}
                >
                  <FontAwesomeIcon icon={faStore} />
                  {b.name}
                </button>
              ))}
            </div>
          )}

          {/* No tiene negocios */}
          {businesses.length === 0 && !loading && (
            <div className="empty-state-container">
              <div className="empty-state-icon">
                <FontAwesomeIcon icon={faStore} />
              </div>
              <h2>No tienes negocios registrados</h2>
              <p>Crea tu primer negocio para empezar a recibir reservas</p>
              <button
                onClick={() => setShowBusinessForm(true)}
                className="btn-primary"
              >
                <FontAwesomeIcon icon={faPlus} />
                Crear mi primer negocio
              </button>
            </div>
          )}

          {/* Contenido del negocio seleccionado */}
          {selectedBusiness && (
            <>
              {/* Business Card */}
              <div className="business-card">
                <div className="business-card-image">
                  <Image
                    src={
                      selectedBusiness.cover_image_url ||
                      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop"
                    }
                    alt={selectedBusiness.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>
                <div className="business-card-content">
                  <div className="business-card-header">
                    <div>
                      <span className="business-category">
                        {selectedBusiness.category_display}
                      </span>
                      <h2 className="business-name">{selectedBusiness.name}</h2>
                      <div className="business-rating">
                        <FontAwesomeIcon icon={faStar} className="star-icon" />
                        <span>
                          {(selectedBusiness.average_rating || 0).toFixed(1)}
                        </span>
                        <span className="rating-count">
                          ({selectedBusiness.total_reviews} reseñas)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBusinessForm(true)}
                      className="btn-icon"
                      title="Editar negocio"
                    >
                      <FontAwesomeIcon icon={faGear} />
                    </button>
                  </div>
                  <p className="business-address">
                    {selectedBusiness.address}, {selectedBusiness.city}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-blue">
                    <FontAwesomeIcon icon={faCalendarDays} />
                  </div>
                  <div className="stat-value">
                    {businessStats?.appointments_today ?? "-"}
                  </div>
                  <div className="stat-label">Citas hoy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-green">
                    <FontAwesomeIcon icon={faDollarSign} />
                  </div>
                  <div className="stat-value">
                    {businessStats
                      ? `$${businessStats.revenue_this_week.toLocaleString()}`
                      : "-"}
                  </div>
                  <div className="stat-label">Ingresos semana</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-purple">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div className="stat-value">{workers.length}</div>
                  <div className="stat-label">Trabajadores</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon stat-icon-orange">
                    <FontAwesomeIcon icon={faScissors} />
                  </div>
                  <div className="stat-value">{services.length}</div>
                  <div className="stat-label">Servicios</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs-container">
                <div className="tabs">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`tab ${activeTab === "overview" ? "active" : ""}`}
                  >
                    Resumen
                  </button>
                  <button
                    onClick={() => setActiveTab("services")}
                    className={`tab ${activeTab === "services" ? "active" : ""}`}
                  >
                    Servicios ({services.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("workers")}
                    className={`tab ${activeTab === "workers" ? "active" : ""}`}
                  >
                    Trabajadores ({workers.length})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="overview-content">
                      <div className="overview-section">
                        <h3>Descripción</h3>
                        <p>
                          {selectedBusiness.description || "Sin descripción"}
                        </p>
                      </div>
                      <div className="overview-section">
                        <h3>Información de contacto</h3>
                        <p>
                          <strong>Dirección:</strong> {selectedBusiness.address}
                          , {selectedBusiness.city}
                        </p>
                        <p>
                          <strong>Teléfono:</strong>{" "}
                          {selectedBusiness.phone || "No especificado"}
                        </p>
                      </div>

                      {/* Gallery Management */}
                      <div className="overview-section gallery-management">
                        <div className="gallery-management-header">
                          <h4>
                            <FontAwesomeIcon icon={faImage} />
                            Galería de imágenes
                          </h4>
                          <button
                            onClick={() =>
                              setShowAddImageForm(!showAddImageForm)
                            }
                            className="btn-add-image"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            Agregar imagen
                          </button>
                        </div>

                        {/* Add Image Form */}
                        {showAddImageForm && (
                          <form
                            onSubmit={handleAddImage}
                            className="add-image-form"
                          >
                            <div className="form-row">
                              <div className="form-group">
                                <label>URL de la imagen</label>
                                <input
                                  type="url"
                                  value={newImageUrl}
                                  onChange={(e) =>
                                    setNewImageUrl(e.target.value)
                                  }
                                  placeholder="https://..."
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>Leyenda (opcional)</label>
                                <input
                                  type="text"
                                  value={newImageCaption}
                                  onChange={(e) =>
                                    setNewImageCaption(e.target.value)
                                  }
                                  placeholder="Descripción de la imagen"
                                  maxLength={255}
                                />
                              </div>
                            </div>
                            <div className="form-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddImageForm(false);
                                  setNewImageUrl("");
                                  setNewImageCaption("");
                                }}
                                className="btn-secondary"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={addingImage || !newImageUrl.trim()}
                                className="btn-primary"
                              >
                                {addingImage ? "Agregando..." : "Agregar"}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Gallery Grid */}
                        <div className="gallery-management-grid">
                          {galleryImages.length === 0 ? (
                            <div className="gallery-empty">
                              <FontAwesomeIcon icon={faImage} />
                              <p>No hay imágenes en la galería</p>
                            </div>
                          ) : (
                            galleryImages.map((image) => (
                              <div
                                key={image.id}
                                className="gallery-management-item"
                              >
                                <Image
                                  src={image.image_url}
                                  alt={image.caption || "Imagen"}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 200px"
                                  loading="lazy"
                                  style={{ objectFit: "cover" }}
                                />
                                {image.caption && (
                                  <div className="gallery-item-caption">
                                    {image.caption}
                                  </div>
                                )}
                                <button
                                  onClick={() => handleDeleteImage(image.id)}
                                  disabled={deletingImageId === image.id}
                                  className="gallery-item-delete"
                                  title="Eliminar imagen"
                                >
                                  {deletingImageId === image.id ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                  ) : (
                                    <FontAwesomeIcon icon={faTrash} />
                                  )}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Services Tab */}
                  {activeTab === "services" && (
                    <div className="services-content">
                      <div className="section-header">
                        <h3>Servicios</h3>
                        <button
                          onClick={() => {
                            setEditingService(null);
                            setShowServiceForm(true);
                          }}
                          className="btn-secondary btn-sm"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          Agregar servicio
                        </button>
                      </div>

                      {services.length === 0 ? (
                        <div className="empty-list">
                          <p>No hay servicios registrados</p>
                        </div>
                      ) : (
                        <div className="services-list">
                          {services.map((service) => (
                            <div key={service.id} className="service-item">
                              <div className="service-info">
                                <h4>{service.name}</h4>
                                <p className="service-description">
                                  {service.description || "Sin descripción"}
                                </p>
                                <div className="service-meta">
                                  <span>
                                    <FontAwesomeIcon icon={faClock} />
                                    {service.duration_minutes} min
                                  </span>
                                  <span>
                                    <FontAwesomeIcon icon={faDollarSign} />$
                                    {service.price.toLocaleString("es-CO")}
                                  </span>
                                </div>
                              </div>
                              <div className="service-actions">
                                <button
                                  onClick={() => {
                                    setEditingService(service);
                                    setShowServiceForm(true);
                                  }}
                                  className="btn-icon-sm"
                                  title="Editar"
                                >
                                  <FontAwesomeIcon icon={faPen} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteService(service.id)
                                  }
                                  className="btn-icon-sm btn-danger"
                                  title="Eliminar"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workers Tab */}
                  {activeTab === "workers" && (
                    <div className="workers-content">
                      <div className="section-header">
                        <h3>Trabajadores</h3>
                        <button
                          onClick={() => setShowWorkerForm(true)}
                          className="btn-secondary btn-sm"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          Agregar trabajador
                        </button>
                      </div>

                      {workers.length === 0 ? (
                        <div className="empty-list">
                          <p>No hay trabajadores registrados</p>
                        </div>
                      ) : (
                        <div className="workers-list">
                          {workers.map((worker) => (
                            <div key={worker.id} className="worker-item">
                              <div className="worker-avatar">
                                {worker.full_name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </div>
                              <div className="worker-info">
                                <h4>{worker.full_name}</h4>
                                <p>{worker.position || "Sin cargo asignado"}</p>
                                <p className="worker-email">{worker.email}</p>
                                {worker.schedules &&
                                  worker.schedules.length > 0 && (
                                    <p className="worker-schedule-summary">
                                      <FontAwesomeIcon icon={faClock} />
                                      {
                                        worker.schedules.filter(
                                          (s) => s.is_available,
                                        ).length
                                      }{" "}
                                      días configurados
                                    </p>
                                  )}
                              </div>
                              <div className="worker-actions">
                                <button
                                  onClick={() => handleEditSchedule(worker)}
                                  className="btn-icon-sm"
                                  title="Configurar horario"
                                >
                                  <FontAwesomeIcon icon={faClock} />
                                </button>
                                <button
                                  onClick={() => handleDeleteWorker(worker.id)}
                                  className="btn-icon-sm btn-danger"
                                  title="Eliminar"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modales */}
      {showBusinessForm && (
        <BusinessForm
          business={selectedBusiness}
          onSave={handleBusinessSaved}
          onCancel={() => setShowBusinessForm(false)}
        />
      )}

      {showServiceForm && selectedBusiness && (
        <ServiceForm
          businessId={selectedBusiness.id}
          service={editingService}
          onSave={handleServiceSaved}
          onCancel={() => {
            setShowServiceForm(false);
            setEditingService(null);
          }}
        />
      )}

      {showWorkerForm && selectedBusiness && (
        <WorkerForm
          businessId={selectedBusiness.id}
          onSave={handleWorkerSaved}
          onCancel={() => setShowWorkerForm(false)}
        />
      )}

      {showScheduleForm && selectedBusiness && editingWorkerSchedule && (
        <WorkerScheduleForm
          businessId={selectedBusiness.id}
          worker={editingWorkerSchedule}
          onSave={handleScheduleSaved}
          onCancel={() => {
            setShowScheduleForm(false);
            setEditingWorkerSchedule(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={
          confirmAction?.type === "service"
            ? "Eliminar servicio"
            : confirmAction?.type === "worker"
              ? "Eliminar trabajador"
              : "Eliminar imagen"
        }
        message={confirmAction?.message || ""}
        confirmText="Eliminar"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
}

export default function MiNegocioPage() {
  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <MiNegocioContent />
    </ProtectedRoute>
  );
}
