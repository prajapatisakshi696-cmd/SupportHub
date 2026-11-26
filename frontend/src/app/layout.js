import "./globals.css";
import StoreProvider from "../store/StoreProvider";

export const metadata = {
  title: "SupportHub | Customer support, in sync",
  description:
    "A focused workspace for teams to receive, manage, and resolve customer support requests.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
