/* ============================================================
   CONFIG DU SALON — Salon Pro
   ------------------------------------------------------------
   👉 C'est LE SEUL fichier à remplir pour installer un nouveau salon.
   Les 3 pages (app, réservation, site) le lisent.
   Le reste (prestations, horaires, photos…) se règle depuis l'app.
   ============================================================ */
window.APP_CONFIG = {

  /* --- 1) Base en ligne (réservations) --------------------
     Depuis Supabase → Settings → API. Laisser vide = mode démo
     (réservations par WhatsApp seulement, pas de synchro). */
  supabaseUrl:     "https://uzwbkjpjznduyftkwyrs.supabase.co",
  supabaseAnonKey: "sb_publishable_fjvm2tQu1smKQT84-HltqQ_RJ0jW19G",

  /* --- 2) Identité du salon -------------------------------
     Affichée au démarrage et sur les pages publiques
     (le coiffeur peut ensuite tout modifier depuis l'app). */
  salonName:  "Barber Birkhadem",
  tagline:    "Rapidité · Propreté · Perfection · Qualité",
  location:   "Birkhadem — Alger",
  address:    "Birkhadem, Alger",
  whatsapp:   "213563856484",          // sans + ni espaces. Vide = démo.
  instagram:  "gt_barber_birkhadem",   // juste le @ (sans @). Vide = masqué.
};
