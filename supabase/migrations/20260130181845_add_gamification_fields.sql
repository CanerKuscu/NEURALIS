-- Add new columns to profiles if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'age') then
    alter table profiles add column age integer;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'target_level') then
    alter table profiles add column target_level text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'current_lives') then
    alter table profiles add column current_lives integer default 5;
  end if;
end $$;

-- RPC Function to decrement lives
create or replace function decrement_user_lives(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_lives integer;
begin
  update profiles
  set current_lives = greatest(0, current_lives - 1)
  where id = p_user_id
  returning current_lives into new_lives;
  
  return new_lives;
end;
$$;
