import { renderHook, act, waitFor } from "@testing-library/react";
import { useSearchInput } from "@/hooks/useSearchInput";

// Mock use-debounce
jest.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: Function, delay: number) => {
    const debouncedFn = Object.assign(fn, {
      cancel: jest.fn(),
    });
    return debouncedFn;
  },
}));

describe("useSearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useSearchInput());

    expect(result.current.query).toBe("");
    expect(result.current.debouncedQuery).toBe("");
    expect(result.current.isFocused).toBe(false);
  });

  it("should initialize with provided initial query", () => {
    const { result } = renderHook(() =>
      useSearchInput({ initialQuery: "test query" }),
    );

    expect(result.current.query).toBe("test query");
    expect(result.current.debouncedQuery).toBe("test query");
  });

  it("should update query when setQuery is called", () => {
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.setQuery("new query");
    });

    expect(result.current.query).toBe("new query");
  });

  it("should update focus state when setIsFocused is called", () => {
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.setIsFocused(true);
    });

    expect(result.current.isFocused).toBe(true);

    act(() => {
      result.current.setIsFocused(false);
    });

    expect(result.current.isFocused).toBe(false);
  });

  it("should clear query and debounced query when clearQuery is called", () => {
    const { result } = renderHook(() =>
      useSearchInput({ initialQuery: "test" }),
    );

    act(() => {
      result.current.clearQuery();
    });

    expect(result.current.query).toBe("");
    expect(result.current.debouncedQuery).toBe("");
  });

  it("should call onQueryChange callback when debounced query changes", async () => {
    const onQueryChange = jest.fn();
    const { result } = renderHook(() => useSearchInput({ onQueryChange }));

    act(() => {
      result.current.setQuery("test");
    });

    await waitFor(() => {
      expect(onQueryChange).toHaveBeenCalled();
    });
  });

  it("should use custom debounce delay", () => {
    const { result } = renderHook(() => useSearchInput({ debounceMs: 500 }));

    expect(result.current.query).toBe("");
    // The hook should be initialized with custom delay
    // Further testing would require mocking timers
  });

  it("should provide cancelDebounce function", () => {
    const { result } = renderHook(() => useSearchInput());

    expect(typeof result.current.cancelDebounce).toBe("function");

    act(() => {
      result.current.cancelDebounce();
    });
    // Should not throw
  });

  it("should update debounced query when query changes", async () => {
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.setQuery("test query");
    });

    // Since we mocked debounce to execute immediately
    await waitFor(() => {
      expect(result.current.debouncedQuery).toBe("test query");
    });
  });
});
