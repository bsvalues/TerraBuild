import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | {
    url: string,
    method: string,
    body?: any,
    headers?: Record<string, string>
  },
  data?: unknown | undefined,
): Promise<Response> {
  let url: string;
  let method: string = 'GET';
  let body: any = undefined;
  
  let headers: Record<string, string> = {};
  
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    method = data ? 'POST' : 'GET';
    body = data;
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method;
    body = urlOrOptions.body;
    headers = urlOrOptions.headers || {};
  }
  
  console.log(`API Request: ${method} ${url}`, body);
  
  const isFormData = body instanceof FormData;
  
  // Set up headers based on content type
  const defaultHeaders: Record<string, string> = {};
  
  // Add Content-Type header only for JSON requests
  if (body && !isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }
  
  // Merge with custom headers
  const mergedHeaders = { ...defaultHeaders, ...headers };
  
  const res = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    credentials: "include",
  });

  console.log(`API Response: ${method} ${url}`, {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    // Don't clone the response yet as it would consume the body
  });

  await throwIfResNotOk(res);
  const clonedRes = res.clone(); // Clone so the body can be read multiple times
  if (clonedRes.headers.get('content-type')?.includes('application/json')) {
    return await clonedRes.json();
  }
  return clonedRes;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
