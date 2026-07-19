import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading application state...</p>
      </div>
    );
  }

  if (!user) {
    // If not authenticated, redirect based on route hint or default to student login
    const path = window.location.pathname;
    if (path.startsWith("/proctor")) {
      return <Navigate to="/proctor/login" replace />;
    }
    if (path.startsWith("/admin")) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/student/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized for the target route, redirect to their role's dashboard
    if (user.role === "STUDENT") {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (user.role === "PROCTOR") {
      return <Navigate to="/proctor/dashboard" replace />;
    }
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/login" replace />;
  }

  return <>{children}</>;
}
