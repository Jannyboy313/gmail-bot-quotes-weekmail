CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE quotes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    quote TEXT NOT NULL,
    name TEXT NOT NULL
)