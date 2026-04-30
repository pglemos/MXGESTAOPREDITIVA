-- Recarrega o cache do PostgREST apos renomeacoes de tabelas da FUND-02.
NOTIFY pgrst, 'reload schema';
