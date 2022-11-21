CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE names (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE quotes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name_id uuid NOT NULL,
    quote TEXT NOT NULL,
    receiveDate TIMESTAMP NOT NULL,
    CONSTRAINT fk_name
        FOREIGN KEY(name_id)
            REFERENCES names(id)
);