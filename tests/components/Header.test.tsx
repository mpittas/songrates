import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock HeaderSearchBar
jest.mock("@/components/HeaderSearchBar", () => {
  return function MockHeaderSearchBar() {
    return <div data-testid="header-search-bar">Search Bar</div>;
  };
});

// Mock MySection
jest.mock("@/components/MySection", () => {
  return function MockMySection({ children, className }: any) {
    return <div className={className}>{children}</div>;
  };
});

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

  it("should render site logo/title", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Header />);

    const logo = screen.getByText("songrates_");
    expect(logo).toBeInTheDocument();
  });

  it("should render navigation links", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Header />);

    expect(screen.getByText("charts")).toBeInTheDocument();
    expect(screen.getByText("lists")).toBeInTheDocument();
    expect(screen.getByText("profile")).toBeInTheDocument();
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

  it("should have sticky positioning", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toHaveClass("sticky", "top-0");
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

    const logo = screen.getByText("songrates_");
    const link = logo.closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  it("should center search bar on non-homepage", () => {
    (usePathname as jest.Mock).mockReturnValue("/artist/123");

    const { container } = render(<Header />);

    const searchBarContainer =
      screen.getByTestId("header-search-bar").parentElement;
    expect(searchBarContainer).toHaveClass("justify-center");
  });
});
