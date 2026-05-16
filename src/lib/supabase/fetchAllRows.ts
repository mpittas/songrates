type PagedSupabaseCall<T> = (
  from: number,
  to: number,
) => PromiseLike<{ data: T[] | null; error: unknown }> | unknown;

interface FetchAllRowsResult<T> {
  rows: T[];
  error: unknown | null;
}

/**
 * Fetches all rows from a paginated Supabase query callback.
 */
export async function fetchAllRows<T>(
  runPage: PagedSupabaseCall<T>,
  pageSize: number = 1000,
): Promise<FetchAllRowsResult<T>> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = (await runPage(from, to)) as {
      data: T[] | null;
      error: unknown;
    };

    if (error) {
      return { rows, error };
    }

    const chunk = data || [];
    rows.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return { rows, error: null };
}
