import { render, screen } from "@testing-library/react";
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

jest.mock("@/components/ui/MySection", () => {
  return function MockMySection({ children, className }: any) {
    return <div className={className}>{children}</div>;
  };
});

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    signOut: jest.fn(),
    loading: false,
  }),
}));

jest.mock("@/components/layout/MobileMenu", () => {
  return function MockMobileMenu() {
    return null;
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ alt, src, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} {...props} />;
  },
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

  it("should render site logo image", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Header />);

    const logo = screen.getByRole("img", { name: /songrates/i });
    expect(logo).toHaveAttribute("src", "/songrates-lettering-logo.svg");
  });

  it("should render Rated navigation link", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Header />);

    const rated = screen.getByRole("link", { name: /^Rated$/i });
    expect(rated).toHaveAttribute("href", "/rated");
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

  it("should not use sticky positioning", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).not.toHaveClass("sticky");
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

    const logoLink = screen.getByRole("img", { name: /songrates/i }).closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("should center search bar on non-homepage", () => {
    (usePathname as jest.Mock).mockReturnValue("/artist/123");

    render(<Header />);

    const searchBarContainer =
      screen.getByTestId("header-search-bar").parentElement;
    expect(searchBarContainer).toHaveClass("justify-center");
  });
});
