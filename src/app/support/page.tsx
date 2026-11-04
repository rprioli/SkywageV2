import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Support – Skywage",
  description: "How to get help with the Skywage app.",
};

export default function SupportPage() {
  return <LegalDocument file="support.md" />;
}
