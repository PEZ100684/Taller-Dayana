"use client";

import { useMemo, useRef, useState } from "react";

const workTypeOptions = ["Pintura total", "Enderezado y pintura", "Enderezado"];
const workshopStatusOptions = ["received", "in_progress", "ready"];
const workshopStatusLabels = {
  received: "Recibido",
  in_progress: "En proceso",
  ready: "Listo para entregar"
};

export default function AdminPage() {
  const entryDateInputRef = useRef(null);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [token, setToken] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [workshopVehicles, setWorkshopVehicles] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    customerName: "",
    workType: workTypeOptions[0],
    entryDate: "",
    status: "received"
  });
  const [photoForm, setPhotoForm] = useState({
    plate: "",
    description: "",
    files: []
  });
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [quoteFilters, setQuoteFilters] = useState({
    month: "",
    plate: "",
    status: "",
    search: ""
  });
  const [recordsFilter, setRecordsFilter] = useState({
    type: "all",
    plate: "",
    customer: "",
    search: ""
  });
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [deletingRecordKey, setDeletingRecordKey] = useState("");
  const [activePhotosPlate, setActivePhotosPlate] = useState("");
  const [status, setStatus] = useState("");

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_API_BASE_URL ||
    "https://taller-dayana-api.onrender.com";

  const openEntryDatePicker = () => {
    const input = entryDateInputRef.current;
    if (!input) {
      return;
    }

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Continue with fallback methods for browsers that block showPicker.
    }

    input.click();
    input.focus();
  };

  const resolvePhotoUrl = (photoUrl) => {
    if (!photoUrl || typeof photoUrl !== "string") {
      return "";
    }

    if (photoUrl.startsWith("/")) {
      return `${apiBase}${photoUrl}`;
    }

    return photoUrl;
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = String(reader.result || "");
        if (!rawDataUrl.startsWith("data:image/")) {
          resolve(rawDataUrl);
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1600;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              const ratio = Math.min(maxDim / width, maxDim / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const login = async () => {
    setStatus("Autenticando...");
    const response = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      setStatus("Error de autenticacion");
      return;
    }

    const payload = await response.json();
    setToken(payload.token);
    setStatus("Autenticado. Cargando datos...");

    const authToken = payload.token;
    const authOnlyHeaders = { Authorization: `Bearer ${authToken}` };

    const [appointmentsResponse, quotesResponse, vehiclesResponse] = await Promise.all([
      fetch(`${apiBase}/api/admin/appointments`, { headers: authOnlyHeaders }),
      fetch(`${apiBase}/api/admin/quotes`, { headers: authOnlyHeaders }),
      fetch(`${apiBase}/api/admin/workshop-vehicles`, { headers: authOnlyHeaders })
    ]);

    if (appointmentsResponse.ok) {
      const appointmentsPayload = await appointmentsResponse.json();
      setAppointments(appointmentsPayload);
    }

    if (quotesResponse.ok) {
      const quotesPayload = await quotesResponse.json();
      setQuotes(quotesPayload);
    }

    if (vehiclesResponse.ok) {
      const vehiclesPayload = await vehiclesResponse.json();
      setWorkshopVehicles(vehiclesPayload);
    }

    setStatus("Autenticado y datos actualizados");
  };

  const filteredQuotes = useMemo(() => {
    const normalizedPlate = quoteFilters.plate.trim().toUpperCase();
    const normalizedSearch = quoteFilters.search.trim().toLowerCase();

    return quotes.filter((item) => {
      if (quoteFilters.status && item.status !== quoteFilters.status) {
        return false;
      }

      if (normalizedPlate && !String(item.plate || "").toUpperCase().includes(normalizedPlate)) {
        return false;
      }

      if (quoteFilters.month) {
        const createdAt = item.createdAt ? new Date(item.createdAt) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
          return false;
        }

        const itemMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (itemMonth !== quoteFilters.month) {
          return false;
        }
      }

      if (normalizedSearch) {
        const haystack = [item.customerName, item.vehicle, item.plate, item.damageDescription, item.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [quotes, quoteFilters]);

  const unifiedRecords = useMemo(() => {
    const quoteRows = quotes.map((item) => ({
      type: "quote",
      id: item.id,
      customerName: item.customerName || "",
      plate: item.plate || "",
      summary: item.vehicle || "",
      status: item.status || "",
      date: item.createdAt || null,
      details: item.damageDescription || "",
      recordKey: `quote-${item.id}`
    }));

    const appointmentRows = appointments.map((item) => ({
      type: "appointment",
      id: item.id,
      customerName: item.customerName || "",
      plate: item.plate || "",
      summary: item.vehicle || "",
      status: item.status || "",
      date: item.appointmentDate || item.createdAt || null,
      details: "Cita programada",
      recordKey: `appointment-${item.id}`
    }));

    const workshopRows = workshopVehicles.map((item) => ({
      type: "workshop",
      id: item.id,
      customerName: item.customerName || "",
      plate: item.plate || "",
      summary: item.workType || "",
      status: item.status || "",
      date: item.entryDate || item.createdAt || null,
      details: `Fotos: ${item.photoCount || 0}`,
      recordKey: `workshop-${item.id}`
    }));

    return [...quoteRows, ...appointmentRows, ...workshopRows].sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [quotes, appointments, workshopVehicles]);

  const filteredUnifiedRecords = useMemo(() => {
    const plateFilter = recordsFilter.plate.trim().toUpperCase();
    const customerFilter = recordsFilter.customer.trim().toLowerCase();
    const searchFilter = recordsFilter.search.trim().toLowerCase();

    return unifiedRecords.filter((item) => {
      if (recordsFilter.type !== "all" && item.type !== recordsFilter.type) {
        return false;
      }

      if (plateFilter && !String(item.plate).toUpperCase().includes(plateFilter)) {
        return false;
      }

      if (customerFilter && !String(item.customerName).toLowerCase().includes(customerFilter)) {
        return false;
      }

      if (searchFilter) {
        const haystack = [item.customerName, item.plate, item.summary, item.status, item.details].join(" ").toLowerCase();
        if (!haystack.includes(searchFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [recordsFilter, unifiedRecords]);

  const labelByRecordType = {
    quote: "Presupuesto",
    appointment: "Cita",
    workshop: "Vehiculo taller"
  };

  const loadAppointments = async () => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar citas");
      return;
    }

    const payload = await response.json();
    setAppointments(payload);
    setStatus(`Citas cargadas: ${payload.length}`);
  };

  const loadQuotes = async () => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/quotes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar presupuestos");
      return;
    }

    const payload = await response.json();
    setQuotes(payload);
    setStatus(`Presupuestos cargados: ${payload.length}`);
  };

  const markReady = async (id) => {
    const response = await fetch(`${apiBase}/api/admin/appointments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: "ready" })
    });

    if (!response.ok) {
      setStatus("No se pudo actualizar estado");
      return;
    }

    setStatus(`Cita ${id} actualizada a ready`);
    await loadAppointments();
  };

  const loadWorkshopVehicles = async () => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-vehicles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar vehiculos del taller");
      return;
    }

    const payload = await response.json();
    setWorkshopVehicles(payload);
    setStatus(`Vehiculos cargados: ${payload.length}`);
  };

  const registerWorkshopVehicle = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-vehicles`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        ...vehicleForm,
        plate: vehicleForm.plate.toUpperCase().trim(),
        customerName: vehicleForm.customerName.trim()
      })
    });

    if (!response.ok) {
      setStatus("No se pudo registrar el vehiculo");
      return;
    }

    setStatus("Vehiculo registrado correctamente");
    setVehicleForm({
      plate: "",
      customerName: "",
      workType: workTypeOptions[0],
      entryDate: "",
      status: "received"
    });
    await loadWorkshopVehicles();
  };

  const changeWorkshopStatus = async (id, nextStatus) => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-vehicles/${id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      setStatus("No se pudo cambiar el estado del vehiculo");
      return;
    }

    setStatus(`Estado del vehiculo #${id} actualizado`);
    await loadWorkshopVehicles();
  };

  const loadPhotosByPlate = async (plate) => {
    if (!token || !plate) {
      return;
    }

    setLoadingPhotos(true);
    const response = await fetch(`${apiBase}/api/admin/workshop-progress-photos/${plate}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar fotos de avance");
      setLoadingPhotos(false);
      return;
    }

    const payload = await response.json();
    setProgressPhotos(payload);
    setLoadingPhotos(false);
  };

  const uploadProgressPhoto = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    if (!Array.isArray(photoForm.files) || photoForm.files.length === 0) {
      setStatus("Debe seleccionar al menos una foto");
      return;
    }

    const photoUrls = await Promise.all(photoForm.files.map((file) => fileToDataUrl(file)));
    const response = await fetch(`${apiBase}/api/admin/workshop-progress-photos`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        plate: photoForm.plate.toUpperCase().trim(),
        description: photoForm.description.trim(),
        photoUrls
      })
    });

    if (!response.ok) {
      setStatus("No se pudo subir la foto");
      return;
    }

    const createdPayload = await response.json();
    const uploadedCount = Array.isArray(createdPayload) ? createdPayload.length : 1;
    setStatus(`Fotos de avance subidas: ${uploadedCount}`);
    const activePlate = photoForm.plate.toUpperCase().trim();
    setPhotoForm({ plate: activePlate, description: "", files: [] });
    setPhotoPreview(null);
    await loadWorkshopVehicles();
    await loadPhotosByPlate(activePlate);
  };

  const deleteProgressPhoto = async (photoId) => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const confirmed = window.confirm("¿Deseas eliminar esta foto de avance?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-progress-photos/${photoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudo eliminar la foto");
      return;
    }

    setStatus(`Foto eliminada (#${photoId})`);
    setProgressPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    await loadWorkshopVehicles();
  };

  const deleteUnifiedRecord = async (item) => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const confirmed = window.confirm(`¿Deseas eliminar este registro de ${labelByRecordType[item.type]} #${item.id}?`);
    if (!confirmed) {
      return;
    }

    setDeletingRecordKey(item.recordKey);

    const endpointByType = {
      quote: `${apiBase}/api/admin/quotes/${item.id}`,
      appointment: `${apiBase}/api/admin/appointments/${item.id}`,
      workshop: `${apiBase}/api/admin/workshop-vehicles/${item.id}`
    };

    try {
      const response = await fetch(endpointByType[item.type], {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setStatus(payload.error || "No se pudo eliminar el registro");
        return;
      }

      if (item.type === "quote") {
        setQuotes((prev) => prev.filter((entry) => entry.id !== item.id));
      } else if (item.type === "appointment") {
        setAppointments((prev) => prev.filter((entry) => entry.id !== item.id));
      } else if (item.type === "workshop") {
        setWorkshopVehicles((prev) => prev.filter((entry) => entry.id !== item.id));
        if (activePhotosPlate === item.plate) {
          setActivePhotosPlate("");
          setProgressPhotos([]);
        }
      }

      setStatus(`${labelByRecordType[item.type]} #${item.id} eliminado`);
    } finally {
      setDeletingRecordKey("");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 text-white md:px-8">
      <section className="section-card border-brandRed/40 bg-gradient-to-br from-zinc-950 to-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brandRed">Panel Interno</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Panel admin - Taller Dayana</h1>
            <p className="mt-2 text-zinc-300">Gestion de citas, vehiculos en proceso y avances de reparacion.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white"
            >
              ← Ir al inicio
            </a>
            <a
              href="/seguimiento"
              className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white"
            >
              Ver Seguimiento
            </a>
          </div>
        </div>
      </section>

      <section className="section-card space-y-3">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Autenticacion</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
          className="space-y-3"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
              value={credentials.username}
              onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Usuario"
            />
            <input
              type="password"
              className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
              value={credentials.password}
              onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Contrasena"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-md bg-brandRed px-4 py-2 font-semibold text-white transition hover:opacity-90">
              Ingresar
            </button>
            <button type="button" onClick={loadAppointments} className="rounded-md border border-zinc-500 px-4 py-2 text-zinc-100 transition hover:border-white">
              Cargar citas
            </button>
            <button type="button" onClick={loadQuotes} className="rounded-md border border-zinc-500 px-4 py-2 text-zinc-100 transition hover:border-white">
              Cargar presupuestos
            </button>
            <button type="button" onClick={loadWorkshopVehicles} className="rounded-md border border-zinc-500 px-4 py-2 text-zinc-100 transition hover:border-white">
              Cargar vehiculos en taller
            </button>
          </div>
        </form>
        <p className="text-sm text-zinc-300">{status}</p>
      </section>

      <section className="section-card space-y-4">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Registrar vehiculo en taller</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={registerWorkshopVehicle}>
          <input
            value={vehicleForm.plate}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Placa"
            required
          />
          <input
            value={vehicleForm.customerName}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, customerName: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Nombre del cliente"
            required
          />
          <select
            value={vehicleForm.workType}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, workType: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            required
          >
            {workTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="date"
            ref={entryDateInputRef}
            value={vehicleForm.entryDate}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, entryDate: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            onFocus={openEntryDatePicker}
            required
          />
          <button
            type="button"
            onClick={openEntryDatePicker}
            className="rounded-md border border-zinc-500 bg-zinc-950 px-4 py-3 text-zinc-100 transition hover:border-white"
          >
            Abrir calendario
          </button>
          <select
            value={vehicleForm.status}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white md:col-span-2"
            required
          >
            <option value="received">Recibido</option>
            <option value="in_progress">En proceso</option>
            <option value="ready">Listo para entregar</option>
          </select>
          <button type="submit" className="rounded-md bg-brandRed px-4 py-3 font-semibold text-white transition hover:opacity-90 md:col-span-2">
            Registrar vehiculo
          </button>
        </form>
      </section>

      <section className="section-card space-y-3">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Vehiculos en taller</h2>
        <div className="space-y-2">
          {workshopVehicles.map((item) => (
            <article key={item.id} className="rounded-md border border-zinc-700 bg-zinc-950 p-4">
              <p className="font-semibold">
                #{item.id} - {item.plate} - {item.customerName}
              </p>
              <p className="text-sm text-zinc-300">Trabajo: {item.workType}</p>
              <p className="text-sm text-zinc-300">Ingreso: {item.entryDate}</p>
              <p className="text-sm text-zinc-300">Estado: {workshopStatusLabels[item.status] || item.status}</p>
              <p className="text-sm text-zinc-300">
                Fotos de avance: {item.photoCount || 0}
                {item.lastPhotoAt ? ` | Ultima: ${new Date(item.lastPhotoAt).toLocaleString()}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workshopStatusOptions.map((nextStatus) => (
                  <button
                    key={`${item.id}-${nextStatus}`}
                    onClick={() => changeWorkshopStatus(item.id, nextStatus)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      item.status === nextStatus ? "bg-brandRed text-white" : "border border-zinc-500 text-zinc-100"
                    }`}
                  >
                    {workshopStatusLabels[nextStatus]}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setPhotoForm((prev) => ({ ...prev, plate: item.plate }));
                    setActivePhotosPlate(item.plate);
                    loadPhotosByPlate(item.plate);
                  }}
                  className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100"
                >
                  Subir foto de avance
                </button>
                <button
                  onClick={() => {
                    if (activePhotosPlate === item.plate) {
                      setActivePhotosPlate("");
                      setProgressPhotos([]);
                      return;
                    }

                    setActivePhotosPlate(item.plate);
                    loadPhotosByPlate(item.plate);
                  }}
                  className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100"
                >
                  {activePhotosPlate === item.plate ? "Ocultar fotos" : `Ver fotos (${item.photoCount || 0})`}
                </button>
              </div>

              {activePhotosPlate === item.plate ? (
                <div className="mt-4 rounded-md border border-zinc-700 bg-zinc-900 p-4">
                  <p className="mb-4 font-semibold text-white">Fotos del vehiculo {item.plate} ({progressPhotos.length})</p>
                  {loadingPhotos ? <p className="text-sm text-zinc-300">Cargando fotos...</p> : null}
                  {!loadingPhotos && progressPhotos.length === 0 ? (
                    <p className="text-sm text-zinc-300">No hay fotos para esta placa.</p>
                  ) : null}
                  {!loadingPhotos && progressPhotos.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {progressPhotos.map((photo) => (
                        <article key={photo.id} className="overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
                          <img
                            src={resolvePhotoUrl(photo.photoUrl)}
                            alt={photo.description}
                            className="h-40 w-full object-cover"
                          />
                          <div className="p-3">
                            <p className="mb-1 text-xs text-zinc-400">{new Date(photo.createdAt).toLocaleString()}</p>
                            <p className="mb-2 text-xs text-zinc-200 line-clamp-2">{photo.description}</p>
                            <button
                              type="button"
                              onClick={() => deleteProgressPhoto(photo.id)}
                              className="w-full rounded-md border border-red-500 px-2 py-1 text-xs text-red-200 transition hover:bg-red-950/50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
          {workshopVehicles.length === 0 ? <p className="text-zinc-300">No hay vehiculos registrados en taller.</p> : null}
        </div>
      </section>

      <section className="section-card space-y-4">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Subir foto de avance</h2>
        <form className="grid gap-3" onSubmit={uploadProgressPhoto}>
          <select
            value={photoForm.plate}
            onChange={(e) => {
              const selectedPlate = e.target.value;
              setPhotoForm((prev) => ({ ...prev, plate: selectedPlate }));
              if (selectedPlate) {
                setActivePhotosPlate(selectedPlate);
                loadPhotosByPlate(selectedPlate);
              }
            }}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            required
          >
            <option value="">Seleccionar vehiculo por placa</option>
            {workshopVehicles.map((item) => (
              <option key={`plate-${item.id}`} value={item.plate}>
                {item.plate} - {item.customerName}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="image/*"
            multiple
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-zinc-100"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setPhotoForm((prev) => ({ ...prev, files }));
              const firstFile = files[0] || null;
              if (!firstFile) {
                setPhotoPreview(null);
                return;
              }

              const reader = new FileReader();
              reader.onload = () => setPhotoPreview(String(reader.result || ""));
              reader.readAsDataURL(firstFile);
            }}
            required
          />

          <p className="text-sm text-zinc-300">Puedes elegir varias fotos a la vez en un solo paso.</p>
          <p className="text-sm text-zinc-300">Total seleccionado: {photoForm.files.length}</p>

          <textarea
            value={photoForm.description}
            onChange={(e) => setPhotoForm((prev) => ({ ...prev, description: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            rows={3}
            placeholder='Descripcion del avance (ej: "Dia 1 - Lijado inicial")'
            required
          />

          <p className="text-sm text-zinc-300">Fecha: se registra automaticamente al subir la foto.</p>

          {photoPreview ? (
            <div className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <p className="mb-2 text-sm text-zinc-300">Vista previa:</p>
              <img src={photoPreview} alt="Vista previa de avance" className="max-h-64 rounded-md border border-zinc-700" />
            </div>
          ) : null}

          <button type="submit" className="rounded-md bg-brandRed px-4 py-3 font-semibold text-white transition hover:opacity-90">
            Subir foto
          </button>
        </form>

        <div className="space-y-2 rounded-md border border-zinc-700 bg-zinc-950 p-3">
          <p className="font-semibold text-white">Historial de fotos por placa</p>
          {loadingPhotos ? <p className="text-zinc-300">Cargando fotos...</p> : null}
          {!loadingPhotos && progressPhotos.length === 0 ? (
            <p className="text-zinc-300">No hay fotos para la placa seleccionada.</p>
          ) : null}
          {!loadingPhotos
            ? progressPhotos.map((photo) => (
                <article key={photo.id} className="rounded-md border border-zinc-700 p-3">
                  <p className="text-sm text-zinc-300">{new Date(photo.createdAt).toLocaleString()}</p>
                  <p className="mb-2 text-sm text-zinc-200">{photo.description}</p>
                  <img src={resolvePhotoUrl(photo.photoUrl)} alt={photo.description} className="max-h-48 rounded-md border border-zinc-700" />
                  <button
                    type="button"
                    onClick={() => deleteProgressPhoto(photo.id)}
                    className="mt-3 rounded-md border border-red-500 px-3 py-1 text-sm text-red-200 transition hover:bg-red-950/50"
                  >
                    Eliminar foto
                  </button>
                </article>
              ))
            : null}
        </div>
      </section>

      <section className="section-card">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Filtro general de registros (pruebas)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select
            value={recordsFilter.type}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
          >
            <option value="all">Todos</option>
            <option value="workshop">Vehiculos en taller</option>
            <option value="appointment">Citas</option>
            <option value="quote">Presupuestos</option>
          </select>
          <input
            value={recordsFilter.plate}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Filtrar por placa"
          />
          <input
            value={recordsFilter.customer}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, customer: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Filtrar por cliente"
          />
          <input
            value={recordsFilter.search}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, search: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Buscar en resumen o estado"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setRecordsFilter({ type: "all", plate: "", customer: "", search: "" })}
            className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100 transition hover:border-white"
          >
            Limpiar filtros
          </button>
          <p className="self-center text-sm text-zinc-300">
            Mostrando {filteredUnifiedRecords.length} de {unifiedRecords.length} registros
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {filteredUnifiedRecords.map((item) => (
            <article key={item.recordKey} className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <p>
                [{labelByRecordType[item.type]}] #{item.id} - {item.customerName} - {item.summary} - {item.plate}
              </p>
              <p className="text-sm text-zinc-300">Estado: {item.status}</p>
              <p className="text-sm text-zinc-300">Fecha: {item.date ? new Date(item.date).toLocaleString() : "Sin fecha"}</p>
              <p className="text-sm text-zinc-300">Detalle: {item.details || "Sin detalle"}</p>
              <button
                type="button"
                onClick={() => deleteUnifiedRecord(item)}
                disabled={deletingRecordKey === item.recordKey}
                className="mt-2 rounded-md border border-red-500 px-3 py-1 text-sm text-red-200 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingRecordKey === item.recordKey ? "Eliminando..." : "Eliminar registro"}
              </button>
            </article>
          ))}
          {unifiedRecords.length === 0 ? <p className="text-zinc-300">No hay registros para mostrar.</p> : null}
          {unifiedRecords.length > 0 && filteredUnifiedRecords.length === 0 ? (
            <p className="text-zinc-300">No hay resultados con esos filtros.</p>
          ) : null}
        </div>
      </section>

      <section className="section-card">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Citas</h2>
        <div className="mt-3 space-y-2">
          {appointments.map((item) => (
            <article key={item.id} className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <p>
                #{item.id} - {item.customerName} - {item.vehicle} - {item.plate}
              </p>
              <p className="text-sm text-zinc-300">Estado: {item.status}</p>
              <button onClick={() => markReady(item.id)} className="mt-2 rounded-md bg-brandRed px-3 py-1 text-sm">
                Marcar listo
              </button>
            </article>
          ))}
          {appointments.length === 0 ? <p className="text-zinc-300">No hay citas registradas.</p> : null}
        </div>
      </section>

      <section className="section-card">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Presupuestos</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            type="month"
            value={quoteFilters.month}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, month: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            title="Filtrar por mes"
          />
          <input
            value={quoteFilters.plate}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Filtrar por placa"
          />
          <select
            value={quoteFilters.status}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
          >
            <option value="">Todos los estados</option>
            <option value="received">Recibido</option>
            <option value="reviewing">En revision</option>
            <option value="quoted">Cotizado</option>
            <option value="approved">Aprobado</option>
          </select>
          <input
            value={quoteFilters.search}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Buscar cliente, carro, detalle..."
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setQuoteFilters({ month: "", plate: "", status: "", search: "" })}
            className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100 transition hover:border-white"
          >
            Limpiar filtros
          </button>
          <p className="self-center text-sm text-zinc-300">
            Mostrando {filteredQuotes.length} de {quotes.length} presupuestos
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {filteredQuotes.map((item) => (
            <article key={item.id} className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <p>
                #{item.id} - {item.customerName} - {item.vehicle} - {item.plate}
              </p>
              <p className="text-sm text-zinc-300">Estado: {item.status}</p>
              <p className="text-sm text-zinc-300">Telefono: {item.phone || "No indicado"}</p>
              <p className="text-sm text-zinc-300">
                Fecha: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Sin fecha"}
              </p>
              <p className="text-sm text-zinc-300">Fotos: {Array.isArray(item.photos) ? item.photos.length : 0}</p>
              <p className="text-sm text-zinc-300">Detalle: {item.damageDescription}</p>
              {Array.isArray(item.photos) && item.photos.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {item.photos.map((photo, idx) => (
                    <a
                      key={`${item.id}-photo-${idx}`}
                      href={photo.dataUrl}
                      download={photo.name || `presupuesto-${item.plate}-${idx + 1}.jpg`}
                      className="block overflow-hidden rounded border border-zinc-700 bg-zinc-900 p-1"
                      title="Clic para descargar foto"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.name || `Foto ${idx + 1}`}
                        className="h-24 w-full rounded object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {quotes.length === 0 ? <p className="text-zinc-300">No hay presupuestos registrados.</p> : null}
          {quotes.length > 0 && filteredQuotes.length === 0 ? (
            <p className="text-zinc-300">No hay resultados con esos filtros.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
