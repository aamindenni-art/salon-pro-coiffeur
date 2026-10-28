-- ============================================================
--  Réservation en ligne — Salon Pro (base de données Supabase)
--  À coller dans Supabase → SQL Editor → RUN (une seule fois).
--  AVANT de lancer : remplacez 'CHANGEZ-MOI-CODE-SECRET' (2 endroits
--  plus bas) par un code secret long à vous — il protège la lecture
--  de vos réservations. Gardez-le, je le mettrai dans votre app.
-- ============================================================

-- 1) Table des rendez-vous ------------------------------------
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  date          date not null,
  "time"        text not null,              -- heure de début "HH:MM"
  duration      int  not null default 30,   -- durée en minutes
  service_name  text not null,
  price         int  not null default 0,
  place         text not null default 'salon',   -- salon | home
  address       text,                            -- adresse si à domicile
  client_name   text not null,
  client_phone  text not null,
  status        text not null default 'pending'  -- pending | confirmed | cancelled
);

create index if not exists appointments_date_idx on public.appointments(date);

-- 2) Vue publique des créneaux occupés (SANS données personnelles) --
--    C'est la seule chose que le public peut lire : date, heure, durée.
create or replace view public.busy_slots as
  select date, "time", duration
  from public.appointments
  where status <> 'cancelled';

-- 3) Sécurité : on verrouille la table, on ouvre juste ce qu'il faut --
alter table public.appointments enable row level security;

-- Le public (clé "anon") peut UNIQUEMENT créer une demande (statut 'pending').
drop policy if exists "public_can_book" on public.appointments;
create policy "public_can_book"
  on public.appointments for insert
  to anon
  with check (status = 'pending');

-- (Aucun SELECT/UPDATE/DELETE pour le public → noms et téléphones protégés.)

-- Le public peut lire la vue des créneaux occupés (pour griser ce qui est pris).
grant select on public.busy_slots to anon;

-- 4) Lecture des réservations par le coiffeur (protégée par code secret) --
create or replace function public.get_bookings(secret text, from_date date default current_date)
returns setof public.appointments
language plpgsql
security definer
set search_path = public
as $$
begin
  if secret <> 'CHANGEZ-MOI-CODE-SECRET' then
    raise exception 'non autorisé';
  end if;
  return query
    select * from public.appointments
    where date >= from_date and status <> 'cancelled'
    order by date, "time";
end;
$$;

-- 5) Confirmer / annuler une réservation (protégé par le même code) --
create or replace function public.set_booking_status(secret text, booking_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if secret <> 'CHANGEZ-MOI-CODE-SECRET' then
    raise exception 'non autorisé';
  end if;
  if new_status not in ('pending','confirmed','cancelled') then
    raise exception 'statut invalide';
  end if;
  update public.appointments set status = new_status where id = booking_id;
end;
$$;

grant execute on function public.get_bookings(text, date)             to anon;
grant execute on function public.set_booking_status(text, uuid, text) to anon;

-- ============================================================
--  Fin. Récupérez ensuite dans Supabase :
--   • Project URL   (Settings → API → Project URL)
--   • clé "anon public" (Settings → API → Project API keys → anon public)
--  …et donnez-les moi avec votre code secret.
-- ============================================================
