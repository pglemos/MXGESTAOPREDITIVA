declare module 'postgres' {
    type SqlRows = Array<Record<string, unknown>>
    type SqlClient = {
        <T extends SqlRows = SqlRows>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>
        unsafe<T extends SqlRows = SqlRows>(query: string, values?: unknown[]): Promise<T>
        end(): Promise<void>
    }

    function postgres(connectionString: string, options?: Record<string, unknown>): SqlClient
    export default postgres
}
