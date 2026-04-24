import React, { useState } from "react";
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Constants from "expo-constants";

const API_BASE = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";

const gallery = ["Trabajo #1", "Trabajo #2", "Trabajo #3"];

export default function App() {
  const [quote, setQuote] = useState({ customerName: "", phone: "", vehicle: "", plate: "", damageDescription: "" });
  const [appointment, setAppointment] = useState({ customerName: "", phone: "", vehicle: "", plate: "", appointmentDate: "" });
  const [plateQuery, setPlateQuery] = useState("");
  const [repairStatus, setRepairStatus] = useState("Sin consulta");
  const [notification, setNotification] = useState("Sin notificaciones");

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
      } else {
        setRepairStatus(`Cita: ${statusPayload.appointmentStatus} | Presupuesto: ${statusPayload.quoteStatus}`);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Taller Dayana</Text>
        <Text style={styles.subtitle}>App de citas, presupuestos y seguimiento</Text>

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
          <TextInput style={styles.input} placeholder="Fecha (YYYY-MM-DD)" placeholderTextColor="#ccc" onChangeText={(v) => setAppointment((p) => ({ ...p, appointmentDate: v }))} />
          <Pressable style={styles.button} onPress={() => postJson("/api/appointments", appointment, "Cita enviada") }>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Galeria de trabajos</Text>
          {gallery.map((item) => (
            <Text key={item} style={styles.info}>{item}</Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Contacto rapido</Text>
          <Pressable style={styles.button} onPress={() => Linking.openURL("tel:+50600000000") }>
            <Text style={styles.buttonText}>Llamar</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => Linking.openURL("https://wa.me/50600000000") }>
            <Text style={styles.buttonText}>WhatsApp</Text>
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
  }
});
