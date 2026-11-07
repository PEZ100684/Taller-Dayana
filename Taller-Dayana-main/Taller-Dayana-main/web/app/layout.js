import "./globals.css";

export const metadata = {
  title: "Taller Dayana",
  description: "Enderezado y pintura automotriz en Costa Rica"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
