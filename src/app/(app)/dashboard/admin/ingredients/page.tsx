import { Metadata } from "next";
import { AdminIngredientsClient } from "./_components/admin-ingredients-client";

export const metadata: Metadata = {
  title: "Manage ingredients",
  description: "Super user: manage canonical ingredients",
};

export default function AdminIngredientsPage() {
  return <AdminIngredientsClient />;
}
