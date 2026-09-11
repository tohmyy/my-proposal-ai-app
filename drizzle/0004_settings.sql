-- Global singleton settings row: sender identity used in the proposal
-- document header/footer and outgoing client emails.
create table if not exists settings (
  id text primary key default 'default',
  sender_company_name text not null default 'Koya Talent',
  sender_designation text not null default '',
  sender_logo_url text,
  from_email text not null default '',
  email_salutation_template text not null default 'Hi {{client_name}},',
  updated_at timestamptz not null default now()
);
