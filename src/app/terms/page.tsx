import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service – Skywage",
  description: "The terms governing your use of the Skywage app.",
};

export default function TermsOfServicePage() {
  return <LegalDocument file="terms-of-service.md" />;
}
