import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy – Skywage",
  description:
    "How the Skywage app collects, uses, shares, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return <LegalDocument file="privacy-policy.md" />;
}
