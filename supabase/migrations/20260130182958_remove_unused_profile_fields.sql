-- Remove unused columns from profiles table
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'first_name') then
    alter table profiles drop column first_name;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'merit_points') then
    alter table profiles drop column merit_points;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'rank') then
    alter table profiles drop column rank;
  end if;
end $$;
