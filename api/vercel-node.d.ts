declare module '@vercel/node' {
  export interface VercelRequest {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    body?: unknown;
    query?: Record<string, string | string[]>;
  }

  export interface VercelResponse {
    status(code: number): VercelResponse;
    json(body: unknown): VercelResponse;
    send?(body: unknown): VercelResponse;
    setHeader?(name: string, value: string | string[]): VercelResponse;
  }
}
