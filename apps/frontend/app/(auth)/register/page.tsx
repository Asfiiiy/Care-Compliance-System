import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register Care Home | CareCompliance",
  description: "Register your care home and facility manager account for CQC Regulation 18 compliance.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
