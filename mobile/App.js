import React, { useEffect, useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Constants from "expo-constants";

const LOGO_IMAGE = require("./assets/logo-taller-dayana.jpg");

const API_BASE = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || "https://taller-dayana-api.onrender.com";

export default function App() {
  const [quote, setQuote] = useState({ customerName: "", phone: "", vehicle: "", plate: "", damageDescription: "" });
  const [appointment, setAppointment] = useState({ customerName: "", phone: "", vehicle: "", plate: "", appointmentDate: "" });
  const [plateQuery, setPlateQuery] = useState("");
  const [repairStatus, setRepairStatus] = useState("Sin consulta");
  const [progressMedia, setProgressMedia] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [notification, setNotification] = useState("Sin notificaciones");
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/gallery`)
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => {
        if (active && Array.isArray(items)) {
          setGalleryItems(items.slice(0, 12));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const postJson = async (path, payload, successMessage) => {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        Alert.alert("Error", "No se pudo completar la solicitud");
        return;
      }

      Alert.alert("Listo", successMessage);
    } catch (_error) {
      Alert.alert("Error", "No hay conexion con backend");
    }
  };

  const checkStatus = async () => {
    if (!plateQuery) {
      Alert.alert("Atencion", "Ingrese una placa");
      return;
    }

    try {
      const statusResponse = await fetch(`${API_BASE}/api/repairs/status/${plateQuery}`);
      const statusPayload = await statusResponse.json();

      if (!statusResponse.ok) {
        setRepairStatus(statusPayload.error || "Sin datos");
        setProgressMedia([]);
      } else {
        setRepairStatus(`Cita: ${statusPayload.appointmentStatus} | Presupuesto: ${statusPayload.quoteStatus}`);
        const media = Array.isArray(statusPayload.progressPhotos)
          ? statusPayload.progressPhotos.filter((item) => item && (item.photoUrl || item.videoUrl))
          : [];
        setProgressMedia(media);
      }

      const notificationResponse = await fetch(`${API_BASE}/api/notifications/${plateQuery}`);
      const notifications = await notificationResponse.json();

      if (Array.isArray(notifications) && notifications.length > 0) {
        setNotification(notifications[notifications.length - 1].message);
      } else {
        setNotification("Sin notificaciones para esta placa");
      }
    } catch (_error) {
      setRepairStatus("No hay conexion con backend");
      setNotification("No hay conexion con backend");
    }
  };

  const submitAppointment = () => {
    const rawDate = String(appointment.appointmentDate || "").trim();
    const formattedDate = rawDate && !rawDate.includes("T") ? `${rawDate}T09:00` : rawDate;
    postJson("/api/appointments", { ...appointment, appointmentDate: formattedDate }, "Cita enviada");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <Pressable
            onPress={() =>
              setSelectedMedia({
                kind: "image",
                source: LOGO_IMAGE,
                caption: "Taller Dayana • Calidad & Confianza"
              })
            }
            style={styles.logoButton}
          >
            <Image source={LOGO_IMAGE} style={styles.logoThumb} />
          </Pressable>
          <View style={styles.brandTextWrap}>
            <Text style={styles.brand}>Taller Dayana</Text>
            <Text style={styles.subtitle}>App de citas, presupuestos y seguimiento</Text>
          </View>
        </View>

        <Modal
          visible={Boolean(selectedMedia)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMedia(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMedia(null)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              {selectedMedia ? (
                <>
                  <Image source={selectedMedia.source} style={styles.logoFull} resizeMode="contain" />
                  <Text style={styles.modalCaption}>{selectedMedia.caption}</Text>
                  {selectedMedia.kind === "video" && selectedMedia.videoUrl ? (
                    <Pressable
                      style={styles.modalVideoBtn}
                      onPress={() => Linking.openURL(selectedMedia.videoUrl)}
                    >
                      <Text style={styles.buttonText}>▶ Ver video en pantalla completa</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
              <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedMedia(null)}>
                <Text style={styles.buttonText}>Cerrar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={styles.card}>
          <Text style={styles.title}>Pedir presupuesto</Text>
          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#ccc" onChangeText={(v) => setQuote((p) => ({ ...p, customerName: v }))} />
          <TextInput style={styles.input} placeholder="Telefono" placeholderTextColor="#ccc" onChangeText={(v) => setQuote((p) => ({ ...p, phone: v }))} />
          <TextInput style={styles.input} placeholder="Vehiculo" placeholderTextColor="#ccc" onChangeText={(v) => setQuote((p) => ({ ...p, vehicle: v }))} />
          <TextInput style={styles.input} placeholder="Placa" placeholderTextColor="#ccc" onChangeText={(v) => setQuote((p) => ({ ...p, plate: v }))} />
          <TextInput style={styles.input} placeholder="Dano" placeholderTextColor="#ccc" onChangeText={(v) => setQuote((p) => ({ ...p, damageDescription: v }))} />
          <Pressable style={styles.button} onPress={() => postJson("/api/quotes", quote, "Presupuesto enviado") }>
            <Text style={styles.buttonText}>Enviar presupuesto</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Pedir cita</Text>
          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#ccc" onChangeText={(v) => setAppointment((p) => ({ ...p, customerName: v }))} />
          <TextInput style={styles.input} placeholder="Telefono" placeholderTextColor="#ccc" onChangeText={(v) => setAppointment((p) => ({ ...p, phone: v }))} />
          <TextInput style={styles.input} placeholder="Vehiculo" placeholderTextColor="#ccc" onChangeText={(v) => setAppointment((p) => ({ ...p, vehicle: v }))} />
          <TextInput style={styles.input} placeholder="Placa" placeholderTextColor="#ccc" onChangeText={(v) => setAppointment((p) => ({ ...p, plate: v }))} />
          <TextInput style={styles.input} placeholder="Fecha (YYYY-MM-DD o YYYY-MM-DDTHH:mm)" placeholderTextColor="#ccc" onChangeText={(v) => setAppointment((p) => ({ ...p, appointmentDate: v }))} />
          <Pressable style={styles.button} onPress={submitAppointment}>
            <Text style={styles.buttonText}>Enviar cita</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Estado de reparacion</Text>
          <TextInput style={styles.input} placeholder="Placa" placeholderTextColor="#ccc" value={plateQuery} onChangeText={setPlateQuery} />
          <Pressable style={styles.button} onPress={checkStatus}>
            <Text style={styles.buttonText}>Consultar estado</Text>
          </Pressable>
          <Text style={styles.info}>{repairStatus}</Text>
          <Text style={styles.info}>Notificacion: {notification}</Text>
          {progressMedia.length > 0 ? (
            <View style={styles.photosGrid}>
              {progressMedia.map((item) => {
                const isVideo =
                  item.mediaType === "video" ||
                  Boolean(item.videoUrl) ||
                  /video/i.test(String(item.description || ""));
                const thumbSource = item.photoUrl ? { uri: item.photoUrl } : LOGO_IMAGE;
                return (
                  <Pressable
                    key={String(item.id || item.photoUrl || item.videoUrl)}
                    onPress={() =>
                      setSelectedMedia({
                        kind: isVideo ? "video" : "image",
                        source: thumbSource,
                        videoUrl: item.videoUrl || item.photoUrl,
                        caption: item.description || `Avance placa ${item.plate || plateQuery}`
                      })
                    }
                    style={styles.photoThumbWrap}
                  >
                    <Image source={thumbSource} style={styles.photoThumb} resizeMode="cover" />
                    {isVideo ? <Text style={styles.videoBadge}>▶ VIDEO</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Galeria de trabajos</Text>
          {galleryItems.length > 0 ? (
            <View style={styles.photosGrid}>
              {galleryItems.map((item, idx) => {
                const imgUrl = item.image || item.photoUrl;
                const isVideo = item.mediaType === "video" || Boolean(item.videoUrl);
                const thumbSource = imgUrl ? { uri: imgUrl } : LOGO_IMAGE;
                return (
                  <Pressable
                    key={String(item.id || idx)}
                    onPress={() =>
                      setSelectedMedia({
                        kind: isVideo ? "video" : "image",
                        source: thumbSource,
                        videoUrl: item.videoUrl || imgUrl,
                        caption: item.title || item.description || `Trabajo #${idx + 1}`
                      })
                    }
                    style={styles.photoThumbWrap}
                  >
                    <Image source={thumbSource} style={styles.photoThumb} resizeMode="cover" />
                    {isVideo ? <Text style={styles.videoBadge}>▶ VIDEO</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.info}>Cargando trabajos...</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Contacto rapido</Text>
          <Pressable style={styles.button} onPress={() => Linking.openURL("tel:+50670439248") }>
            <Text style={styles.buttonText}>Llamar (7043-9248)</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => Linking.openURL("tel:+50688698157") }>
            <Text style={styles.buttonText}>Llamar (8869-8157)</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => Linking.openURL("https://wa.me/50670439248") }>
            <Text style={styles.buttonText}>WhatsApp (7043-9248)</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => Linking.openURL("https://wa.me/50688698157") }>
            <Text style={styles.buttonText}>WhatsApp (8869-8157)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B"
  },
  content: {
    gap: 14,
    padding: 16
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logoButton: {
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#D62828",
    overflow: "hidden"
  },
  logoThumb: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  brandTextWrap: {
    flex: 1
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#131313",
    borderColor: "#363636",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 12
  },
  logoFull: {
    width: "100%",
    height: 320,
    borderRadius: 14
  },
  modalCaption: {
    color: "#ccc",
    fontSize: 13,
    textAlign: "center"
  },
  modalCloseBtn: {
    backgroundColor: "#D62828",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: "center"
  },
  brand: {
    color: "#F7F7F7",
    fontSize: 32,
    fontWeight: "800"
  },
  subtitle: {
    color: "#F7F7F7",
    opacity: 0.8
  },
  card: {
    backgroundColor: "#131313",
    borderColor: "#363636",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  title: {
    color: "#F7F7F7",
    fontSize: 18,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#202020",
    color: "#F7F7F7",
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  button: {
    backgroundColor: "#D62828",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonSecondary: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700"
  },
  info: {
    color: "#F7F7F7"
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6
  },
  photoThumbWrap: {
    width: "48%",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#363636"
  },
  photoThumb: {
    width: "100%",
    height: 110
  },
  videoBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#D62828",
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  modalVideoBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center"
  }
});
