create table if not exists cron_log (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  run_date date not null,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists cron_log_job_date_idx on cron_log(job, run_date);
