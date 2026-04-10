import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "WebGit",
    description: "Web-based Git client inspired by GitHub Desktop",
    icons: {
        icon: "/icon.svg",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen antialiased">
                {children}
            </body>
        </html>
    );
}
