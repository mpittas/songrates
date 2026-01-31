import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import HeaderSearchBar from "@/components/HeaderSearchBar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock SearchResults component
jest.mock("@/components/SearchResults", () => {
  return function MockSearchResults({ query }: { query: string }) {
    return <div data-testid="search-results">Results for: {query}</div>;
  };
});

// Mock useSearchInput hook
jest.mock("@/hooks/useSearchInput", () => ({
  useSearchInput: jest.fn(() => ({
    query: "",
    setQuery: jest.fn(),
    debouncedQuery: "",
    isFocused: false,
    setIsFocused: jest.fn(),
    clearQuery: jest.fn(),
  })),
}));

describe("HeaderSearchBar", () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("should render search input", () => {
    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText("Search artists...");
    expect(input).toBeInTheDocument();
  });

  it("should navigate to homepage with query on form submit", () => {
    const { useSearchInput } = require("@/hooks/useSearchInput");
    useSearchInput.mockReturnValue({
      query: "test query",
      setQuery: jest.fn(),
      debouncedQuery: "",
      isFocused: false,
      setIsFocused: jest.fn(),
      clearQuery: jest.fn(),
    });

    render(<HeaderSearchBar />);

    const form =
      screen.getByRole("form") ||
      screen.getByPlaceholderText("Search artists...").closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockPush).toHaveBeenCalledWith("/?q=test%20query");
  });

  it("should not navigate if query is empty", () => {
    const { useSearchInput } = require("@/hooks/useSearchInput");
    useSearchInput.mockReturnValue({
      query: "",
      setQuery: jest.fn(),
      debouncedQuery: "",
      isFocused: false,
      setIsFocused: jest.fn(),
      clearQuery: jest.fn(),
    });

    render(<HeaderSearchBar />);

    const form = screen
      .getByPlaceholderText("Search artists...")
      .closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should show search results when debounced query exists and input is focused", async () => {
    const { useSearchInput } = require("@/hooks/useSearchInput");
    useSearchInput.mockReturnValue({
      query: "test",
      setQuery: jest.fn(),
      debouncedQuery: "test",
      isFocused: true,
      setIsFocused: jest.fn(),
      clearQuery: jest.fn(),
    });

    render(<HeaderSearchBar />);

    await waitFor(() => {
      expect(screen.getByTestId("search-results")).toBeInTheDocument();
    });
  });

  it("should not show search results when not focused", () => {
    const { useSearchInput } = require("@/hooks/useSearchInput");
    useSearchInput.mockReturnValue({
      query: "test",
      setQuery: jest.fn(),
      debouncedQuery: "test",
      isFocused: false,
      setIsFocused: jest.fn(),
      clearQuery: jest.fn(),
    });

    render(<HeaderSearchBar />);

    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  });

  it("should not show search results when query is empty", () => {
    const { useSearchInput } = require("@/hooks/useSearchInput");
    useSearchInput.mockReturnValue({
      query: "",
      setQuery: jest.fn(),
      debouncedQuery: "",
      isFocused: true,
      setIsFocused: jest.fn(),
      clearQuery: jest.fn(),
    });

    render(<HeaderSearchBar />);

    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  });

  it("should hide results when clicking outside", async () => {
    const setIsFocused = jest.fn();
    const { useSearchInput } = require("@/hooks/useSearchInput");
    useSearchInput.mockReturnValue({
      query: "test",
      setQuery: jest.fn(),
      debouncedQuery: "test",
      isFocused: true,
      setIsFocused,
      clearQuery: jest.fn(),
    });

    render(<HeaderSearchBar />);

    // Click outside the component
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(setIsFocused).toHaveBeenCalledWith(false);
    });
  });

  it("should use small size variant for SearchInput", () => {
    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText("Search artists...");
    // Small variant has specific classes
    expect(input).toHaveClass("py-2", "text-sm");
  });
});
