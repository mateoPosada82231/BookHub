"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCalendarDays,
  faHeart,
  faUser,
  faStore,
  faBars,
  faXmark,
  faRightFromBracket,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "@/styles/home.css";

interface NavItem {
  href: string;
  label: string;
  icon: IconDefinition;
  /** Si es true, solo se muestra si está autenticado */
  authRequired?: boolean;
  /** Roles que pueden ver este item. Si no se especifica, todos los roles autenticados lo ven */
  roles?: ("OWNER" | "WORKER" | "CLIENT")[];
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isOwner, isWorker, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Items de navegación basados en roles
  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { href: "/", label: "Inicio", icon: faHouse },
      {
        href: "/mis-citas",
        label: "Mis Citas",
        icon: faCalendarDays,
        authRequired: true,
      },
      {
        href: "/favoritos",
        label: "Favoritos",
        icon: faHeart,
        authRequired: true,
      },
      { href: "/perfil", label: "Perfil", icon: faUser, authRequired: true },
    ];

    // Agregar "Mi Agenda" solo para trabajadores
    if (isWorker) {
      items.splice(2, 0, {
        href: "/mi-agenda",
        label: "Mi Agenda",
        icon: faClipboardList,
        authRequired: true,
        roles: ["WORKER"],
      });
    }

    // Agregar "Mi Negocio" solo para owners
    if (isOwner) {
      items.push({
        href: "/mi-negocio",
        label: "Mi Negocio",
        icon: faStore,
        authRequired: true,
        roles: ["OWNER"],
      });
    }

    return items;
  }, [isOwner, isWorker]);

  // Filtrar items visibles
  const visibleItems = useMemo(() => {
    return navItems.filter((item) => {
      // Si requiere auth y no está autenticado, no mostrar
      if (item.authRequired && !isAuthenticated) return false;

      // Si tiene roles específicos, verificar
      if (item.roles && user) {
        return item.roles.includes(user.role);
      }

      return true;
    });
  }, [navItems, isAuthenticated, user]);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <span className="navbar-logo-text">BOOKHUB</span>
          </Link>

          {/* User info - Desktop */}
          {isAuthenticated && user && (
            <div className="hidden md:flex items-center gap-2 text-sm text-neutral-400">
              <span className="text-neutral-500">Hola,</span>
              <span className="text-white font-medium">
                {user.fullName.split(" ")[0]}
              </span>
              <span className="px-2 py-0.5 text-xs bg-neutral-800 rounded-full text-neutral-300">
                {user.role === "OWNER"
                  ? "Dueño"
                  : user.role === "WORKER"
                    ? "Trabajador"
                    : "Cliente"}
              </span>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="navbar-desktop">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`navbar-link ${isActive ? "navbar-link-active" : ""}`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="navbar-link-icon"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="navbar-link navbar-logout"
              >
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  className="navbar-link-icon"
                />
                <span>Salir</span>
              </button>
            ) : (
              <div className="navbar-auth-buttons">
                <Link href="/login" className="navbar-link">
                  Iniciar Sesión
                </Link>
                <Link href="/registro" className="navbar-login-btn">
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="navbar-mobile-toggle"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <FontAwesomeIcon
              icon={isMobileMenuOpen ? faXmark : faBars}
              className="navbar-mobile-toggle-icon"
            />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile">
          {/* User info - Mobile */}
          {isAuthenticated && user && (
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm text-neutral-400">
                Hola,{" "}
                <span className="text-white font-medium">{user.fullName}</span>
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-neutral-800 rounded-full text-neutral-300">
                {user.role === "OWNER"
                  ? "Dueño"
                  : user.role === "WORKER"
                    ? "Trabajador"
                    : "Cliente"}
              </span>
            </div>
          )}

          <div className="navbar-mobile-links">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`navbar-mobile-link ${isActive ? "navbar-mobile-link-active" : ""}`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="navbar-mobile-link-icon"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="navbar-mobile-link navbar-mobile-logout"
              >
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  className="navbar-mobile-link-icon"
                />
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="navbar-mobile-link"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={closeMobileMenu}
                  className="navbar-mobile-login-btn"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
