"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { useDashboardAuth, dashboardAuthFetch } from "../providers/AuthProvider";

export type LanguageCode = "en" | "fr" | "es" | "rw";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "gb" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "fr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "es" },
  { code: "rw", label: "Kinyarwanda", nativeLabel: "Ikinyarwanda", flag: "rw" },
];

const VALID_CODES = new Set<LanguageCode>(["en", "fr", "es", "rw"]);
const STORAGE_KEY = "connekt-language";
const LEGACY_KEY = "locale";
const COOKIE_NAME = "connekt_locale";

function isValidLang(val: unknown): val is LanguageCode {
  return typeof val === "string" && VALID_CODES.has(val.trim().toLowerCase() as LanguageCode);
}

function readCookieLocale(): LanguageCode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const raw = match?.[1]?.trim().toLowerCase();
  return isValidLang(raw) ? raw : null;
}

function writeCookieLocale(lang: LanguageCode) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (typeof window !== "undefined" && window.location.hostname.endsWith("connekyt.com")) {
    document.cookie = `${COOKIE_NAME}=${lang}; domain=.connekyt.com; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

// ─── Exact translations dictionary (EN -> [FR, ES, RW]) ─────────────────────
const EXACT_DICT: Record<string, [string, string, string]> = {
  // Navigation & Groups
  "Overview": ["Aperçu", "Resumen", "Incamake"],
  "Work": ["Travail", "Trabajo", "Akazi"],
  "Money": ["Argent", "Dinero", "Amafaranga"],
  "Admin": ["Admin", "Admin", "Ubuyobozi"],
  "Home": ["Accueil", "Inicio", "Ahabanza"],
  "Dashboard": ["Tableau de bord", "Panel", "Imbonerahamwe"],
  "Notifications": ["Notifications", "Notificaciones", "Imenyesha"],
  "Inbox": ["Messagerie", "Mensajes", "Ubutumwa"],
  "Events": ["Événements", "Eventos", "Ibirori"],
  "My Events": ["Mes événements", "Mis eventos", "Ibirori byanjye"],
  "Clients": ["Clients", "Clientes", "Abakiriya"],
  "Wallet": ["Portefeuille", "Billetera", "Ikofi"],
  "Wallets": ["Portefeuilles", "Billeteras", "Amakofi"],
  "Transactions": ["Transactions", "Transacciones", "Ihererekanya"],
  "All Transactions": ["Toutes les transactions", "Todas las transacciones", "Ihererekanya ryose"],
  "Donate": ["Faire un don", "Donar", "Tanga inkunga"],
  "Donations": ["Dons", "Donaciones", "Inkunga"],
  "Collaborate": ["Collaborer", "Colaborar", "Gufatanya"],
  "Streams": ["Diffusions", "Transmisiones", "Imbonankubone"],
  "Live Streams": ["Diffusions en direct", "Transmisiones en vivo", "Imbonankubone"],
  "Gallery": ["Galerie", "Galería", "Ububiko bw'amafoto"],
  "Photographers": ["Photographes", "Fotógrafos", "Abafotora"],
  "Payments": ["Paiements", "Pagos", "Ubwishyu"],
  "Profile": ["Profil", "Perfil", "Umwirondoro"],
  "Preferences": ["Préférences", "Preferencias", "Ibyo ukunda"],
  "Settings": ["Paramètres", "Configuración", "Igenamiterere"],
  "SETTINGS": ["PARAMÈTRES", "CONFIGURACIÓN", "IGENAMITERERE"],
  "Logout": ["Déconnexion", "Cerrar sesión", "Sohoka"],
  "Sign out": ["Se déconnecter", "Cerrar sesión", "Sohoka"],
  "Sign Out": ["Se déconnecter", "Cerrar sesión", "Sohoka"],
  "Sign out of Connekyt?": ["Se déconnecter de Connekyt ?", "¿Cerrar sesión en Connekyt?", "Gusohoka muri Connekyt?"],
  "You'll need to sign in again to access your dashboard.": [
    "Vous devrez vous reconnecter pour accéder à votre tableau de bord.",
    "Deberás iniciar sesión nuevamente para acceder a tu panel.",
    "Uzongera kwinjira kugira ngo ubone imbonerahamwe yawe.",
  ],
  "Your session will end on this device.": [
    "Votre session prendra fin sur cet appareil.",
    "Tu sesión terminará en este dispositivo.",
    "Igice cyawe kizarangira kuri iki gikoresho.",
  ],

  // Roles
  "Photographer": ["Photographe", "Fotógrafo", "Umufotozi"],
  "Videographer": ["Vidéaste", "Videógrafo", "Ufata amashusho"],
  "Client": ["Client", "Cliente", "Umukiriya"],
  "Event Coordinator": ["Coordinateur d'événements", "Coordinador de eventos", "Umutegura w'ibirori"],
  "Coordinator": ["Coordinateur", "Coordinador", "Umutegura"],

  // Topbar & Common Banners
  "Balance": ["Solde", "Saldo", "Amafaranga asigaye"],
  "Tips": ["Pourboires", "Propinas", "Ishimwe"],
  "Mark all read": ["Tout marquer comme lu", "Marcar todo como leído", "Shyira byose nk'ibyasomwe"],
  "Mark all as read": ["Tout marquer comme lu", "Marcar todo como leído", "Shyira byose nk'ibyasomwe"],
  "Enable desktop alerts": ["Activer les alertes bureau", "Activar alertas de escritorio", "Emeza imenyesha kuri mudasobwa"],
  "You're all caught up": ["Vous êtes à jour", "Estás al día", "Nta makuru mashya ahari"],
  "View all notifications →": ["Voir toutes les notifications →", "Ver todas las notificaciones →", "Reba amakuru yose →"],
  "View all": ["Voir tout", "Ver todo", "Reba byose"],
  "Open": ["Ouvrir", "Abrir", "Fungura"],
  "Pay now": ["Payer maintenant", "Pagar ahora", "Ishyura nonaha"],
  "Pay Now": ["Payer maintenant", "Pagar ahora", "Ishyura nonaha"],
  "KYC verification rejected": ["Vérification KYC rejetée", "Verificación KYC rechazada", "Igenzura rya KYC ryanzwe"],
  "Your submission needs corrections. Resubmit to continue.": [
    "Votre soumission nécessite des corrections. Soumettez à nouveau pour continuer.",
    "Tu envío necesita correcciones. Vuelve a enviarlo para continuar.",
    "Ibyo wohereje bikeneye gukosorwa. Ongera wohereze kugira ngo ukomeze.",
  ],
  "KYC under review": ["KYC en cours d'examen", "KYC en revisión", "KYC irimo gusuzumwa"],
  "We’re verifying your details. This typically takes a few hours.": [
    "Nous vérifions vos informations. Cela prend généralement quelques heures.",
    "Estamos verificando tus datos. Esto suele tardar unas horas.",
    "Turimo kugenzura amakuru yawe. Ibi bitwara amasaha make.",
  ],
  "Verify your identity": ["Vérifiez votre identité", "Verifica tu identidad", "Emeza umwirondoro wawe"],
  "Complete KYC to unlock withdrawals and full platform features.": [
    "Complétez le KYC pour débloquer les retraits et toutes les fonctionnalités.",
    "Completa el KYC para desbloquear retiros y todas las funciones.",
    "Uzuza KYC kugira ngo ufungure kubikuza n'ibindi byose ku rubuga.",
  ],
  "Resubmit": ["Soumettre à nouveau", "Reenviar", "Ongera wohereze"],
  "Complete KYC": ["Compléter le KYC", "Completar KYC", "Uzuza KYC"],
  "Availability": ["Disponibilité", "Disponibilidad", "Kuboneka"],
  "Switch to light mode": ["Passer en mode clair", "Cambiar a modo claro", "Hindura mu rumuri"],
  "Switch to dark mode": ["Passer en mode sombre", "Cambiar a modo oscuro", "Hindura mu mwijima"],

  // Preferences Page
  "Customize your dashboard experience and manage payment settings.": [
    "Personnalisez votre tableau de bord et gérez vos paramètres de paiement.",
    "Personaliza tu experiencia en el panel y administra la configuración de pagos.",
    "Gena uko imbonerahamwe yawe igaragara kandi ucunge uburyo bwo kwishyura.",
  ],
  "Appearance": ["Apparence", "Apariencia", "Imigaragarire"],
  "APPEARANCE": ["APPARENCE", "APARIENCIA", "IMIGARAGARIRE"],
  "Payment Accounts": ["Comptes de paiement", "Cuentas de pago", "Konti zo kwishyura"],
  "PAYMENT ACCOUNTS": ["COMPTES DE PAIEMENT", "CUENTAS DE PAGO", "KONTI ZO KWISHYURA"],
  "NOTIFICATIONS": ["NOTIFICATIONS", "NOTIFICACIONES", "IMENYESHA"],
  "Security": ["Sécurité", "Seguridad", "Umutekano"],
  "SECURITY": ["SÉCURITÉ", "SEGURIDAD", "UMUTEKANO"],
  "Theme mode": ["Mode du thème", "Modo de tema", "Uburyo bw'insanganyamatsiko"],
  "Choose how the dashboard looks to you. Pick a single theme or sync with your device.": [
    "Choisissez l'apparence du tableau de bord. Sélectionnez un thème ou synchronisez avec votre appareil.",
    "Elige cómo se ve el panel. Selecciona un tema o sincroniza con tu dispositivo.",
    "Hitamo uko imbonerahamwe yawe igaragara. Hitamo uburyo bumwe cyangwa ihuze n'igikoresho cyawe.",
  ],
  "Light": ["Clair", "Claro", "Urumuri"],
  "Dark": ["Sombre", "Oscuro", "Umwijima"],
  "System": ["Système", "Sistema", "Sisitemu"],
  "Clean and bright interface": ["Interface claire et lumineuse", "Interfaz limpia y brillante", "Imigaragarire isukuye kandi yaka"],
  "Easy on the eyes in low light": ["Doux pour les yeux en faible luminosité", "Cómodo para la vista con poca luz", "Byoroshye ku maso mu rumuri ruke"],
  "Matches your device settings": ["Suit les paramètres de votre appareil", "Coincide con la configuración de tu dispositivo", "Bihura n'igenamiterere ry'igikoresho cyawe"],
  "Language": ["Langue", "Idioma", "Ururimi"],
  "LANGUAGE": ["LANGUE", "IDIOMA", "URURIMI"],
  "App language": ["Langue de l'application", "Idioma de la aplicación", "Ururimi rw'urubuga"],
  "Choose your preferred language across the web and mobile experience.": [
    "Choisissez votre langue préférée sur le web et l'application mobile.",
    "Elige tu idioma preferido en la experiencia web y móvil.",
    "Hitamo ururimi ukunda gukoresha ku rubuga no muri telefoni.",
  ],
  "Notification settings": ["Paramètres de notification", "Configuración de notificaciones", "Igenamiterere ry'amakuru"],
  "Choose which notifications you want to receive and where you want them delivered.": [
    "Choisissez les notifications que vous souhaitez recevoir et comment les recevoir.",
    "Elige qué notificaciones deseas recibir y dónde quieres recibirlas.",
    "Hitamo amakuru ushaka kwakira n'aho ushaka ko akugeraho.",
  ],
  "Email Notifications": ["Notifications par e-mail", "Notificaciones por correo", "Amakuru kuri Imeyili"],
  "Receive email alerts for important notifications": [
    "Recevez des alertes par e-mail pour les notifications importantes",
    "Recibe alertas por correo para notificaciones importantes",
    "Akira ubutumwa kuri imeyili ku makuru y'ingenzi",
  ],
  "Push Notifications": ["Notifications push", "Notificaciones push", "Amakuru ya Push"],
  "Get instant push notifications on your device": [
    "Recevez des notifications push instantanées sur votre appareil",
    "Recibe notificaciones push instantáneas en tu dispositivo",
    "Akira amakuru ako kanya ku gikoresho cyawe",
  ],
  "Notification categories": ["Catégories de notifications", "Categorías de notificaciones", "Ibyiciro by'amakuru"],
  "Payment Notifications": ["Notifications de paiement", "Notificaciones de pago", "Amakuru yo kwishyurwa"],
  "Notify me when I receive payments": [
    "M'avertir lorsque je reçois des paiements",
    "Notificarme cuando reciba pagos",
    "Ntumira igihe nakiriye ubwishyu",
  ],
  "Tips & Bonuses": ["Pourboires et bonus", "Propinas y bonos", "Ishimwe n'inyongera"],
  "Notify me when I receive tips or bonuses": [
    "M'avertir lorsque je reçois des pourboires ou des bonus",
    "Notificarme cuando reciba propinas o bonos",
    "Ntumira igihe nakiriye ishimwe cyangwa inyongera",
  ],
  "Album Notifications": ["Notifications d'albums", "Notificaciones de álbumes", "Amakuru ya Alubumu"],
  "Notify me when new albums are shared or updated": [
    "M'avertir lorsque de nouveaux albums sont partagés ou mis à jour",
    "Notificarme cuando se compartan o actualicen nuevos álbumes",
    "Ntumira igihe alubumu nshya zisangiwe cyangwa zivuguruwe",
  ],
  "Booking Notifications": ["Notifications de réservation", "Notificaciones de reservas", "Amakuru yo gufata igihe"],
  "Gift Notifications": ["Notifications de cadeaux", "Notificaciones de regalos", "Amakuru y'impano"],
  "Stream Fee Notifications": ["Notifications de frais de diffusion", "Notificaciones de tarifas de transmisión", "Amakuru y'ikiguzi cy'imbonankubone"],
  "Security Alerts": ["Alertes de sécurité", "Alertas de seguridad", "Impuruza z'umutekano"],
  "Two-Factor Authentication": ["Authentification à deux facteurs", "Autenticación de dos factores", "Kwemeza mu buryo bubiri (2FA)"],
  "Add Payment Method": ["Ajouter un moyen de paiement", "Agregar método de pago", "Ongeraho uburyo bwo kwishyura"],
  "Add Account": ["Ajouter un compte", "Agregar cuenta", "Ongeraho konti"],
  "Withdrawal Verification": ["Vérification des retraits", "Verificación de retiros", "Kwemeza kubikuza"],
  "Default": ["Par défaut", "Predeterminado", "Bisanzwe"],
  "Set as Default": ["Définir par défaut", "Establecer como predeterminado", "Gira ibisanzwe"],

  // Common Buttons & Labels
  "Save": ["Enregistrer", "Guardar", "Bika"],
  "Save Changes": ["Enregistrer les modifications", "Guardar cambios", "Bika impinduka"],
  "Saving...": ["Enregistrement...", "Guardando...", "Kubika..."],
  "Cancel": ["Annuler", "Cancelar", "Hagarika"],
  "Close": ["Fermer", "Cerrar", "Funga"],
  "Delete": ["Supprimer", "Eliminar", "Siba"],
  "Edit": ["Modifier", "Editar", "Hindura"],
  "Update": ["Mettre à jour", "Actualizar", "Vugurura"],
  "Confirm": ["Confirmer", "Confirmar", "Emeza"],
  "Continue": ["Continuer", "Continuar", "Komeza"],
  "Back": ["Retour", "Atrás", "Subira inyuma"],
  "Next": ["Suivant", "Siguiente", "Ikurikira"],
  "Previous": ["Précédent", "Anterior", "Ibanziriza"],
  "Submit": ["Soumettre", "Enviar", "Ohereza"],
  "Search": ["Rechercher", "Buscar", "Shakisha"],
  "Filter": ["Filtrer", "Filtrar", "Shungura"],
  "Clear": ["Effacer", "Limpiar", "Siba"],
  "Refresh": ["Actualiser", "Actualizar", "Ongera utangize"],
  "Retry": ["Réessayer", "Reintentar", "Ongera ugerageze"],
  "Loading...": ["Chargement...", "Cargando...", "Gutegura..."],
  "View": ["Voir", "Ver", "Reba"],
  "View Details": ["Voir les détails", "Ver detalles", "Reba birambuye"],
  "View All": ["Voir tout", "Ver todo", "Reba byose"],
  "See all": ["Voir tout", "Ver todo", "Reba byose"],
  "See All": ["Voir tout", "Ver todo", "Reba byose"],
  "Download": ["Télécharger", "Descargar", "Kuramo"],
  "Upload": ["Téléverser", "Subir", "Ohereza"],
  "Share": ["Partager", "Compartir", "Sangiza"],
  "Copy": ["Copier", "Copiar", "Koporora"],
  "Copied": ["Copié", "Copiado", "Byakoporowe"],
  "Copied!": ["Copié !", "¡Copiado!", "Byakoporowe!"],
  "Send": ["Envoyer", "Enviar", "Ohereza"],
  "Accept": ["Accepter", "Aceptar", "Emeza"],
  "Decline": ["Refuser", "Rechazar", "Anga"],
  "Approve": ["Approuver", "Aprobar", "Emeza"],
  "Reject": ["Rejeter", "Rechazar", "Anga"],
  "Withdraw": ["Retirer", "Retirar", "Bikuza"],
  "Request Withdrawal": ["Demander un retrait", "Solicitar retiro", "Saba kubikuza"],
  "Create Event": ["Créer un événement", "Crear evento", "Tegura ibirori"],
  "New Event": ["Nouvel événement", "Nuevo evento", "Ibirori bishya"],
  "Create Album": ["Créer un album", "Crear álbum", "Kora alubumu"],
  "New Album": ["Nouvel album", "Nuevo álbum", "Alubumu nshya"],
  "Book a Photographer": ["Réserver un photographe", "Reservar un fotógrafo", "Fata umufotozi"],
  "Find a Photographer": ["Trouver un photographe", "Encontrar un fotógrafo", "Shaka umufotozi"],
  "Find My Photos": ["Trouver mes photos", "Encontrar mis fotos", "Shaka amafoto yanjye"],
  "Browse Photos": ["Parcourir les photos", "Explorar fotos", "Shakisha amafoto"],

  // Statuses
  "All": ["Tout", "Todo", "Byose"],
  "Active": ["Actif", "Activo", "Birakora"],
  "ACTIVE": ["ACTIF", "ACTIVO", "BIRAKORA"],
  "Pending": ["En attente", "Pendiente", "Gutegereza"],
  "PENDING": ["EN ATTENTE", "PENDIENTE", "GUTEGEREZA"],
  "Completed": ["Terminé", "Completado", "Byarangiye"],
  "COMPLETED": ["TERMINÉ", "COMPLETADO", "BYARANGIYE"],
  "Confirmed": ["Confirmé", "Confirmado", "Byemejwe"],
  "CONFIRMED": ["CONFIRMÉ", "CONFIRMADO", "BYEMEJWE"],
  "Accepted": ["Accepté", "Aceptado", "Byemewe"],
  "ACCEPTED": ["ACCEPTÉ", "ACEPTADO", "BYEMEWE"],
  "Cancelled": ["Annulé", "Cancelado", "Byahagaritswe"],
  "CANCELLED": ["ANNULÉ", "CANCELADO", "BYAHAGARITSWE"],
  "Rejected": ["Rejeté", "Rechazado", "Byanzwe"],
  "REJECTED": ["REJETÉ", "RECHAZADO", "BYANZWE"],
  "Approved": ["Approuvé", "Aprobado", "Byemejwe"],
  "APPROVED": ["APPROUVÉ", "APROBADO", "BYEMEJWE"],
  "Upcoming": ["À venir", "Próximo", "Biteganyijwe"],
  "UPCOMING": ["À VENIR", "PRÓXIMO", "BITEGANYIJWE"],
  "Ongoing": ["En cours", "En curso", "Birimo kuba"],
  "ONGOING": ["EN COURS", "EN CURSO", "BIRIMO KUBA"],
  "Live": ["En direct", "En vivo", "Imbonankubone"],
  "LIVE": ["EN DIRECT", "EN VIVO", "IMBONANKUBONE"],
  "Ended": ["Terminé", "Finalizado", "Byarangiye"],
  "ENDED": ["TERMINÉ", "FINALIZADO", "BYARANGIYE"],
  "Paid": ["Payé", "Pagado", "Byishyuwe"],
  "PAID": ["PAYÉ", "PAGADO", "BYISHYUWE"],
  "Unpaid": ["Non payé", "No pagado", "Ntibyishyuwe"],
  "UNPAID": ["NON PAYÉ", "NO PAGADO", "NTIBYISHYUWE"],
  "Failed": ["Échoué", "Fallido", "Byanze"],
  "FAILED": ["ÉCHOUÉ", "FALLIDO", "BYANZE"],
  "Suspended": ["Suspendu", "Suspendido", "Byahagaritswe"],
  "SUSPENDED": ["SUSPENDU", "SUSPENDIDO", "BYAHAGARITSWE"],
  "Published": ["Publié", "Publicado", "Byatangajwe"],
  "Unpublished": ["Non publié", "No publicado", "Ntibyatangajwe"],
  "Draft": ["Brouillon", "Borrador", "Inyandiko y'agateganyo"],

  // Dashboard Home / Analytics / Wallet / Bookings / Events
  "Welcome back": ["Bon retour", "Bienvenido de nuevo", "Murakaza neza nanone"],
  "Good morning": ["Bonjour", "Buenos días", "Mwaramutse"],
  "Good afternoon": ["Bon après-midi", "Buenas tardes", "Mwiriwe"],
  "Good evening": ["Bonsoir", "Buenas noches", "Mwiriwe"],
  "Total Earnings": ["Revenus totaux", "Ingresos totales", "Inyungu zose"],
  "Available Balance": ["Solde disponible", "Saldo disponible", "Amafaranga aboneka"],
  "Pending Balance": ["Solde en attente", "Saldo pendiente", "Amafaranga ategerejwe"],
  "Pending Clearance": ["En attente de compensation", "Pendiente de liberación", "Ategereje kwemezwa"],
  "Total Spent": ["Total dépensé", "Total gastado", "Ayakoreshejwe yose"],
  "Recent Activity": ["Activité récente", "Actividad reciente", "Ibikorwa biheruka"],
  "Recent Transactions": ["Transactions récentes", "Transacciones recientes", "Ihererekanya riheruka"],
  "Upcoming Events": ["Événements à venir", "Próximos eventos", "Ibirori biri imbere"],
  "Quick Actions": ["Actions rapides", "Acciones rápidas", "Ibikorwa byihuse"],
  "Bookings": ["Réservations", "Reservas", "Gufata igihe"],
  "My Bookings": ["Mes réservations", "Mis reservas", "Igihe cyanjye nafafashe"],
  "Incoming Requests": ["Demandes entrantes", "Solicitudes entrantes", "Ubusabe bushya"],
  "Booking Requests": ["Demandes de réservation", "Solicitudes de reserva", "Ubusabe bwo gufata igihe"],
  "Albums": ["Albums", "Álbumes", "Alubumu"],
  "Photo Albums": ["Albums photo", "Álbumes de fotos", "Alubumu z'amafoto"],
  "Content Albums": ["Albums de contenu", "Álbumes de contenido", "Alubumu z'ibikubiyemo"],
  "Photobooks": ["Livres photo", "Fotolibros", "Ibitabo by'amafoto"],
  "Reviews": ["Avis", "Reseñas", "Ibitekerezo"],
  "Portfolio": ["Portfolio", "Portafolio", "Ibikorwa (Portfolio)"],
  "Packages": ["Forfaits", "Paquetes", "Amapaki"],
  "Specialties": ["Spécialités", "Especialidades", "Imyuga yihariye"],
  "Equipment": ["Équipement", "Equipo", "Ibikoresho"],
  "Location": ["Lieu", "Ubicación", "Ahantu"],
  "Date": ["Date", "Fecha", "Itariki"],
  "Time": ["Heure", "Hora", "Isaha"],
  "Amount": ["Montant", "Monto", "Umubare w'amafaranga"],
  "Status": ["Statut", "Estado", "Imiterere"],
  "Type": ["Type", "Tipo", "Ubwoko"],
  "Actions": ["Actions", "Acciones", "Ibikorwa"],
  "Description": ["Description", "Descripción", "Ibisobanuro"],
  "Category": ["Catégorie", "Categoría", "Icyiciro"],
  "All Categories": ["Toutes les catégories", "Todas las categorías", "Ibyiciro byose"],
  "All Statuses": ["Tous les statuts", "Todos los estados", "Imiterere yose"],
  "No results found": ["Aucun résultat trouvé", "No se encontraron resultados", "Nta bisubizo byabonetse"],
  "No events found": ["Aucun événement trouvé", "No se encontraron eventos", "Nta birori byabonetse"],
  "No transactions yet": ["Aucune transaction pour le moment", "Aún no hay transacciones", "Nta hererekanya rirahari"],
  "No notifications yet": ["Aucune notification pour le moment", "Aún no hay notificaciones", "Nta makuru arahari"],
  "No messages yet": ["Aucun message pour le moment", "Aún no hay mensajes", "Nta butumwa burahari"],
  "Type a message...": ["Écrire un message...", "Escribe un mensaje...", "Andika ubutumwa..."],
  "Search messages...": ["Rechercher des messages...", "Buscar mensajes...", "Shakisha ubutumwa..."],

  // Additional common UI labels
  "Search...": ["Rechercher...", "Buscar...", "Shakisha..."],
  "Filters": ["Filtres", "Filtros", "Imiyungururo"],
  "Clear all": ["Tout effacer", "Borrar todo", "Siba byose"],
  "Save changes": ["Enregistrer les modifications", "Guardar cambios", "Bika ibyahinduwe"],
  "Loading": ["Chargement", "Cargando", "Biri gupakira"],
  "Copy Link": ["Copier le lien", "Copiar enlace", "Koporora umurongo"],
  "Link copied!": ["Lien copié !", "¡Enlace copiado!", "Umurongo wakoporowe!"],
  "Success": ["Succès", "Éxito", "Byagenze neza"],
  "Error": ["Erreur", "Error", "Ikosa ryabaye"],
  "Total Balance": ["Solde total", "Saldo total", "Amafaranga yose hamwe"],
  "Withdraw Funds": ["Retirer des fonds", "Retirar fondos", "Bikuza amafaranga"],
  "Deposit": ["Déposer", "Depositar", "Shyiraho amafaranga"],
  "Deposit Funds": ["Déposer des fonds", "Depositar fondos", "Shyiraho amafaranga"],
};

const LANG_INDEX: Record<Exclude<LanguageCode, "en">, 0 | 1 | 2> = {
  fr: 0,
  es: 1,
  rw: 2,
};

// Normalized and reverse dictionaries for seamless multi-directional translation
const normalizedDict = new Map<string, [string, string, string]>();
const reverseDict = new Map<string, string>(); // any FR, ES, RW string (lowercase trimmed) -> canonical EN

for (const [enKey, trans] of Object.entries(EXACT_DICT)) {
  const normEn = enKey.trim().toLowerCase();
  normalizedDict.set(normEn, trans);

  for (const t of trans) {
    if (t && typeof t === "string") {
      const normTrans = t.trim().toLowerCase();
      if (normTrans && normTrans !== normEn) {
        reverseDict.set(normTrans, enKey);
      }
    }
  }
}

export function translateDashboardText(raw: string, lang: LanguageCode): string {
  if (!raw) return raw;
  const leading = raw.match(/^\s*/)?.[0] ?? "";
  const trailing = raw.match(/\s*$/)?.[0] ?? "";
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // Check for trailing punctuation
  const punctMatch = trimmed.match(/^([^:!?.]+)([:!?.]+)$/);
  const baseTrimmed = punctMatch ? punctMatch[1].trim() : trimmed;
  const suffix = punctMatch ? punctMatch[2] : "";

  // 1. Find canonical English representation
  let enCanonical: string | null = null;
  if (EXACT_DICT[baseTrimmed]) {
    enCanonical = baseTrimmed;
  } else {
    const lower = baseTrimmed.toLowerCase();
    for (const key of Object.keys(EXACT_DICT)) {
      if (key.toLowerCase() === lower) {
        enCanonical = key;
        break;
      }
    }
    if (!enCanonical) {
      enCanonical = reverseDict.get(lower) ?? null;
    }
  }

  if (enCanonical) {
    if (lang === "en") {
      return `${leading}${enCanonical}${suffix}${trailing}`;
    }
    const match = EXACT_DICT[enCanonical] || normalizedDict.get(enCanonical.toLowerCase());
    if (match) {
      return `${leading}${match[LANG_INDEX[lang]]}${suffix}${trailing}`;
    }
  }

  if (lang === "en") return raw;
  const idx = LANG_INDEX[lang];

  // Dynamic patterns
  let m = trimmed.match(/^Currently using (Dark|Light) mode$/i);
  if (m) {
    const isDark = m[1].toLowerCase() === "dark";
    if (lang === "fr") return `${leading}Mode ${isDark ? "sombre" : "clair"} actuellement utilisé${trailing}`;
    if (lang === "es") return `${leading}Usando actualmente el modo ${isDark ? "oscuro" : "claro"}${trailing}`;
    return `${leading}Ubu urimo gukoresha uburyo bw'${isDark ? "umwijima" : "urumuri"}${trailing}`;
  }

  m = trimmed.match(/^(\d+)\s+new$/i);
  if (m) {
    if (lang === "fr") return `${leading}${m[1]} nouveau${Number(m[1]) > 1 ? "x" : ""}${trailing}`;
    if (lang === "es") return `${leading}${m[1]} nuevo${Number(m[1]) > 1 ? "s" : ""}${trailing}`;
    return `${leading}${m[1]} bishya${trailing}`;
  }

  m = trimmed.match(/^Payment required\s*·\s*(.+)$/i);
  if (m) {
    if (lang === "fr") return `${leading}Paiement requis · ${m[1]}${trailing}`;
    if (lang === "es") return `${leading}Pago requerido · ${m[1]}${trailing}`;
    return `${leading}Ubwishyu burakenewe · ${m[1]}${trailing}`;
  }

  m = trimmed.match(/^(Good morning|Good afternoon|Good evening|Welcome back)(,\s*.+)?$/i);
  if (m) {
    const greetEn = m[1];
    const rest = m[2] ?? "";
    const gKey = Object.keys(EXACT_DICT).find((k) => k.toLowerCase() === greetEn.toLowerCase());
    if (gKey) {
      return `${leading}${EXACT_DICT[gKey][idx]}${rest}${trailing}`;
    }
  }

  m = trimmed.match(/^Page\s+(\d+)\s+of\s+(\d+)$/i);
  if (m) {
    if (lang === "fr") return `${leading}Page ${m[1]} sur ${m[2]}${trailing}`;
    if (lang === "es") return `${leading}Página ${m[1]} de ${m[2]}${trailing}`;
    return `${leading}Urupapuro rwa ${m[1]} kuri ${m[2]}${trailing}`;
  }

  return raw;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  languages: LanguageOption[];
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA", "NOSCRIPT", "SVG"]);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const { isAuthenticated, user } = useDashboardAuth();
  const originalTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const originalPlaceholderMapRef = useRef<WeakMap<Element, string>>(new WeakMap());
  const trackedTextNodesRef = useRef<Set<Text>>(new Set());
  const trackedElementsRef = useRef<Set<Element>>(new Set());

  // 1. Initial load from URL param (?lang=), shared cookie, or localStorage
  useEffect(() => {
    let initial: LanguageCode | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = (params.get("lang") || params.get("locale"))?.trim().toLowerCase();
      if (isValidLang(q)) {
        initial = q;
      }
    }
    if (!initial) {
      const cookieLang = readCookieLocale();
      if (cookieLang) initial = cookieLang;
    }
    if (!initial && typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (isValidLang(stored)) initial = stored.trim().toLowerCase() as LanguageCode;
    }
    if (initial) {
      setLanguageState(initial);
      localStorage.setItem(STORAGE_KEY, initial);
      localStorage.setItem(LEGACY_KEY, initial);
      writeCookieLocale(initial);
      document.documentElement.lang = initial;
    }
  }, []);

  const getPreferencesBasePath = useCallback(() => {
    const ct = (user?.customerType || "").toUpperCase();
    if (ct === "EVENT_COORDINATOR" || ct === "COORDINATOR") return "/api/remote/coordinator/preferences";
    if (ct === "PHOTOGRAPHER" || ct === "VIDEOGRAPHER") return "/api/remote/photographer/preferences";
    return "/api/remote/customer/preferences";
  }, [user?.customerType]);

  // 2. Sync with backend preferences when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}${getPreferencesBasePath()}`);
        if (!res.ok) return;
        const result = await res.json();
        const remoteLang = result?.data?.language?.trim()?.toLowerCase();
        // Only apply remoteLang if user didn't already pick one in cookie/localStorage on this session
        const cookieLang = readCookieLocale();
        const localLang = localStorage.getItem(STORAGE_KEY);
        if (!cookieLang && !localLang && isValidLang(remoteLang)) {
          setLanguageState(remoteLang);
          localStorage.setItem(STORAGE_KEY, remoteLang);
          localStorage.setItem(LEGACY_KEY, remoteLang);
          writeCookieLocale(remoteLang);
          document.documentElement.lang = remoteLang;
        }
      } catch {
        // Ignore network errors
      }
    })();
  }, [isAuthenticated, user, getPreferencesBasePath]);

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      if (!isValidLang(code)) return;
      setLanguageState(code);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, code);
        localStorage.setItem(LEGACY_KEY, code);
        writeCookieLocale(code);
        document.documentElement.lang = code;
      }
      if (isAuthenticated && user) {
        dashboardAuthFetch(`${getApiUrl()}${getPreferencesBasePath()}/language`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: code }),
        }).catch(() => {});
      }
    },
    [isAuthenticated, user, getPreferencesBasePath]
  );

  // 3. Automatic non-destructive DOM translator for all dashboard pages
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;

    const origTextMap = originalTextMapRef.current;
    const origPlaceholderMap = originalPlaceholderMapRef.current;
    const trackedNodes = trackedTextNodesRef.current;
    const trackedEls = trackedElementsRef.current;

    const processTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("[data-no-translate]")) return;
      const current = node.nodeValue ?? "";
      if (!current.trim()) return;

      let orig = origTextMap.get(node);
      if (orig === undefined) {
        const candidateRw = translateDashboardText(current, "rw");
        if (candidateRw !== current) {
          orig = translateDashboardText(current, "en");
          origTextMap.set(node, orig);
          trackedNodes.add(node);
        } else {
          return;
        }
      }

      const nextVal = translateDashboardText(orig, language);
      if (node.nodeValue !== nextVal) {
        node.nodeValue = nextVal;
      }
    };

    const processElementAttrs = (el: Element) => {
      if (SKIP_TAGS.has(el.tagName) || el.closest("[data-no-translate]")) return;
      const ph = el.getAttribute("placeholder");
      if (ph && ph.trim()) {
        let orig = origPlaceholderMap.get(el);
        if (orig === undefined) {
          if (translateDashboardText(ph, "rw") !== ph) {
            orig = translateDashboardText(ph, "en");
            origPlaceholderMap.set(el, orig);
            trackedEls.add(el);
          }
        }
        if (orig !== undefined) {
          const nextPh = translateDashboardText(orig, language);
          if (el.getAttribute("placeholder") !== nextPh) {
            el.setAttribute("placeholder", nextPh);
          }
        }
      }
    };

    const walk = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let curr: Node | null = walker.currentNode;
      while (curr) {
        if (curr.nodeType === Node.TEXT_NODE) {
          processTextNode(curr as Text);
        } else if (curr.nodeType === Node.ELEMENT_NODE) {
          processElementAttrs(curr as Element);
        }
        curr = walker.nextNode();
      }
    };

    // First re-translate all previously tracked nodes (important when switching back to 'en' or between languages)
    trackedNodes.forEach((node) => {
      if (!node.isConnected) {
        trackedNodes.delete(node);
        return;
      }
      const orig = origTextMap.get(node);
      if (orig !== undefined) {
        const nextVal = language === "en" ? orig : translateDashboardText(orig, language);
        if (node.nodeValue !== nextVal) {
          node.nodeValue = nextVal;
        }
      }
    });
    trackedEls.forEach((el) => {
      if (!el.isConnected) {
        trackedEls.delete(el);
        return;
      }
      const orig = origPlaceholderMap.get(el);
      if (orig !== undefined) {
        const nextPh = language === "en" ? orig : translateDashboardText(orig, language);
        if (el.getAttribute("placeholder") !== nextPh) {
          el.setAttribute("placeholder", nextPh);
        }
      }
    });

    // Walk full document body
    walk(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          processTextNode(m.target as Text);
        } else if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
              processTextNode(n as Text);
            } else if (n.nodeType === Node.ELEMENT_NODE) {
              processElementAttrs(n as Element);
              walk(n);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  const t = useCallback(
    (text: string) => translateDashboardText(text, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: SUPPORTED_LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
