-- ============================================
-- SCRASA — Compensations Trajets
-- Migration initiale
-- ============================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE : profils utilisateurs RH
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nom text not null,
  role text not null default 'rh' check (role in ('admin', 'rh')),
  actif boolean default true,
  created_at timestamptz default now()
);

-- Trigger : crée un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nom, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'rh')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TABLE : compagnons (employés)
-- ============================================
create table public.compagnons (
  id uuid default uuid_generate_v4() primary key,
  nom text not null,
  prenom text not null,
  email text,
  service text,
  transport text not null default 'driving-car'
    check (transport in ('driving-car', 'cycling-regular', 'foot-walking', 'driving-hgv')),
  jours_par_mois integer not null default 22,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLE : étapes du trajet par compagnon
-- ============================================
create table public.etapes (
  id uuid default uuid_generate_v4() primary key,
  compagnon_id uuid references public.compagnons(id) on delete cascade,
  ordre integer not null,
  label text not null,
  adresse text,
  lat numeric(10,7) not null,
  lng numeric(10,7) not null
);

-- ============================================
-- TABLE : mois de référence
-- ============================================
create table public.mois (
  id uuid default uuid_generate_v4() primary key,
  annee integer not null,
  mois integer not null check (mois between 1 and 12),
  statut text not null default 'ouvert' check (statut in ('ouvert', 'valide', 'archive')),
  taux_horaire numeric(6,2) not null default 8.50,
  taux_km numeric(5,3) not null default 0.700,
  valide_par uuid references public.profiles(id),
  valide_le timestamptz,
  created_at timestamptz default now(),
  unique(annee, mois)
);

-- ============================================
-- TABLE : compensations calculées
-- ============================================
create table public.compensations (
  id uuid default uuid_generate_v4() primary key,
  mois_id uuid references public.mois(id) on delete cascade,
  compagnon_id uuid references public.compagnons(id) on delete cascade,
  jours_travailles integer not null,
  distance_aller_km numeric(8,2) not null,
  duree_aller_min numeric(8,2) not null,
  distance_mois_km numeric(10,2) not null,
  duree_mois_min numeric(10,2) not null,
  indem_horaire numeric(10,2) not null,
  indem_km numeric(10,2) not null default 0,
  total_chf numeric(10,2) not null,
  calcule_le timestamptz default now(),
  unique(mois_id, compagnon_id)
);

-- ============================================
-- BAREME par défaut : insérer le mois courant
-- ============================================
insert into public.mois (annee, mois, taux_horaire, taux_km)
values (
  extract(year from now())::integer,
  extract(month from now())::integer,
  8.50,
  0.700
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.compagnons enable row level security;
alter table public.etapes enable row level security;
alter table public.mois enable row level security;
alter table public.compensations enable row level security;

-- Profiles : chacun voit le sien, admin voit tout
create policy "Voir son profil" on public.profiles
  for select using (auth.uid() = id);
create policy "Admin voit tout" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Compagnons, étapes, mois, compensations : tout RH connecté peut lire
create policy "RH lit compagnons" on public.compagnons
  for select using (auth.role() = 'authenticated');
create policy "RH écrit compagnons" on public.compagnons
  for all using (auth.role() = 'authenticated');

create policy "RH lit etapes" on public.etapes
  for select using (auth.role() = 'authenticated');
create policy "RH écrit etapes" on public.etapes
  for all using (auth.role() = 'authenticated');

create policy "RH lit mois" on public.mois
  for select using (auth.role() = 'authenticated');
create policy "Admin écrit mois" on public.mois
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "RH lit compensations" on public.compensations
  for select using (auth.role() = 'authenticated');
create policy "RH écrit compensations" on public.compensations
  for all using (auth.role() = 'authenticated');
