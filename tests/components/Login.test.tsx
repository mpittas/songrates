import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginPage from "@/app/login/page";

jest.mock("next/navigation", () => ({ useRouter: jest.fn(), useSearchParams: jest.fn() }));
jest.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: {} }) }));

describe("Account navigation", () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
  });

  it("preserves the album destination when switching to signup", () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("view=login&next=%2Falbum%2F123"));
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    const destination = new URL(replace.mock.calls[0][0], "https://songrates.com");
    expect(destination.searchParams.get("view")).toBe("signup");
    expect(destination.searchParams.get("next")).toBe("/album/123");
  });

  it("preserves the playlist destination when switching to signin", () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("view=signup&next=%2Fplaylist%2F123"));
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    const destination = new URL(replace.mock.calls[0][0], "https://songrates.com");
    expect(destination.searchParams.get("view")).toBe("login");
    expect(destination.searchParams.get("next")).toBe("/playlist/123");
  });
});
