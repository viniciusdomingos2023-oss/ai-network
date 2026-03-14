-- Run this in your Supabase SQL editor after creating a project
-- at https://supabase.com

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  bio text,
  avatar_letter text,
  avatar_color text default '#7c3aed',
  banner_color text default '#0d0d1a',
  banner_url text,
  location text,
  website text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_letter, avatar_color)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || floor(random() * 9999)::text,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(substring(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1, 1)),
    (array['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#be185d'])[floor(random() * 7 + 1)::int]
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
