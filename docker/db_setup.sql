CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE quotes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name_id uuid NOT NULL,
    quote TEXT NOT NULL,
    receiveDate DATE NOT NULL,
    CONSTRAINT fk_name
        FOREIGN KEY(name_id)
            REFERENCES names(id)
)

CREATE TABLE names (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    PRIMARY KEY(id)
)