SELECT n.name, q.quote FROM
quotes AS q
JOIN names AS n ON q.name_id = n.id
WHERE EXTRACT(MONTH FROM TIMESTAMP '2022-12-1 12:00:00') = EXTRACT(MONTH FROM q.receivedate);
-- JAAR-MAAND-DAG is het formaat