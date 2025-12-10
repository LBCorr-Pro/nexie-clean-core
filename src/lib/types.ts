// src/lib/types.ts
export interface PageProps {
  params: {
    locale: string;
    [key: string]: string | string[] | undefined;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}
