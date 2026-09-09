-- Add a currency code alongside the existing free-text pricing fields
alter table proposals add column if not exists currency text not null default 'USD';
