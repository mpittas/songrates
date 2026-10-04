import { render, screen, fireEvent } from "@testing-library/react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/components/search/HeaderSearchBar", () => {
  return function MockHeaderSearchBar() {
    return <div data-testid="header-search-bar">Search Bar</div>;
  };
});

jest.mock("@/components/layout/UserMenu", () => ({ __esModule: true, default: () => null }));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    signOut: jest.fn(),
    loading: false,
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render header element", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("should render typography logo", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Header />);

    expect(screen.getByRole("link", { name: /songrates home/i })).toHaveTextContent(
      "songrates",
    );
  });

  it("should not show search bar on homepage", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Header />);

    expect(screen.queryByTestId("header-search-bar")).not.toBeInTheDocument();
  });

  it("should show search bar on artist page", () => {
    (usePathname as jest.Mock).mockReturnValue("/artist/123");

    render(<Header />);

    expect(screen.getByTestId("header-search-bar")).toBeInTheDocument();
  });

  it("should show search bar on album page", () => {
    (usePathname as jest.Mock).mockReturnValue("/album/456");

    render(<Header />);

    expect(screen.getByTestId("header-search-bar")).toBeInTheDocument();
  });

  it("should show search bar on any non-homepage route", () => {
    (usePathname as jest.Mock).mockReturnValue("/some-other-page");

    render(<Header />);

    expect(screen.getByTestId("header-search-bar")).toBeInTheDocument();
  });

  it("should keep navigation visible while scrolling", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toHaveClass("sticky");
  });

  it("should have proper z-index", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toHaveClass("z-50");
  });

  it("should link logo to homepage", () => {
    (usePathname as jest.Mock).mockReturnValue("/artist/123");

    render(<Header />);

    const logoLink = screen.getByRole("link", { name: /songrates home/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("opens mobile search and closes it with Escape", () => {
    (usePathname as jest.Mock).mockReturnValue("/explore");
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByRole("dialog", { name: "Search music" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes mobile search when navigating to another page", () => {
    (usePathname as jest.Mock).mockReturnValue("/explore");
    const { rerender } = render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    (usePathname as jest.Mock).mockReturnValue("/moods");
    rerender(<Header />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    (usePathname as jest.Mock).mockReturnValue("/explore");
    rerender(<Header />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(["/login", "/complete-profile"])("keeps account flow %s free of search", (path) => {
    (usePathname as jest.Mock).mockReturnValue(path);
    render(<Header />);
    expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-search-bar")).not.toBeInTheDocument();
  });
});
