import { Suspense } from "react";
import UserBookingsPage from "./UserBookingsPage";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <UserBookingsPage />
    </Suspense>
  );
}