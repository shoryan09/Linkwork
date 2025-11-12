import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RatingUpdateToast from "@/components/RatingUpdateToast";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-grow pt-16">{children}</main>
      <Footer />
      <RatingUpdateToast />
    </div>
  );
}
