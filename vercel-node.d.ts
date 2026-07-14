declare module '@vercel/node' {
  export type VercelRequest = {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    body?: any;
    query?: Record<string, string | string[] | undefined>;
  };

  export type VercelResponse = {
    status: (code: number) => VercelResponse;
    json: (body: unknown) => VercelResponse;
    send: (body: unknown) => VercelResponse;
    end: () => VercelResponse;
    setHeader: (name: string, value: string | string[]) => void;
  };
}
