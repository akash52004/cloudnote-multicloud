import "./globals.css";

export const metadata = {
  title: "CloudNote | Multi-Cloud Notes",
  description: "A simple notes app deployed across Azure and AWS."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
