import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "بانک محتوا | استودیو معراج اندیشه",
  description: "مرجع محتواهای مستند تبیینی، تحلیلی، فرهنگی و مهارتی",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body data-age-theme="adult" data-motif="geometric">{children}</body>
    </html>
  );
}
