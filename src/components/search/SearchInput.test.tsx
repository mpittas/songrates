import { render, screen, fireEvent } from "@testing-library/react";
import SearchInput from "@/components/search/SearchInput";

describe("SearchInput", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    onClear: jest.fn(),
    isFocused: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input", () => {
    render(<SearchInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Search artists...");
    expect(input).toBeInTheDocument();
  });

  it("should display custom placeholder", () => {
    render(<SearchInput {...defaultProps} placeholder="Custom placeholder" />);

    expect(
      screen.getByPlaceholderText("Custom placeholder"),
    ).toBeInTheDocument();
  });

  it("should display the provided value", () => {
    render(<SearchInput {...defaultProps} value="test query" />);

    const input = screen.getByDisplayValue("test query");
    expect(input).toBeInTheDocument();
  });

  it("should call onChange when input value changes", () => {
    const onChange = jest.fn();
    render(<SearchInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Search artists...");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(onChange).toHaveBeenCalledWith("new value");
  });

  it("should call onFocus when input is focused", () => {
    const onFocus = jest.fn();
    render(<SearchInput {...defaultProps} onFocus={onFocus} />);

    const input = screen.getByPlaceholderText("Search artists...");
    fireEvent.focus(input);

    expect(onFocus).toHaveBeenCalled();
  });

  it("should call onBlur when input loses focus", () => {
    const onBlur = jest.fn();
    render(<SearchInput {...defaultProps} onBlur={onBlur} />);

    const input = screen.getByPlaceholderText("Search artists...");
    fireEvent.blur(input);

    expect(onBlur).toHaveBeenCalled();
  });

  it("should show clear button when value is not empty", () => {
    render(<SearchInput {...defaultProps} value="test" />);

    const clearButton = screen.getByRole("button");
    expect(clearButton).toBeInTheDocument();
  });

  it("should not show clear button when value is empty", () => {
    render(<SearchInput {...defaultProps} value="" />);

    const buttons = screen.queryByRole("button");
    expect(buttons).not.toBeInTheDocument();
  });

  it("should call onClear when clear button is clicked", () => {
    const onClear = jest.fn();
    render(<SearchInput {...defaultProps} value="test" onClear={onClear} />);

    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect(onClear).toHaveBeenCalled();
  });

  it("should apply focus styles when isFocused is true", () => {
    const { container } = render(
      <SearchInput {...defaultProps} isFocused={true} />,
    );

    const searchContainer = container.querySelector("div");
    expect(searchContainer).toHaveClass(
      "shadow-[0_0_0px_5px_rgba(0,240,255,0.2)]",
    );
  });

  it("should render with small size variant", () => {
    render(<SearchInput {...defaultProps} size="small" />);

    const input = screen.getByPlaceholderText("Search artists...");
    expect(input).toHaveClass("py-2", "text-sm");
  });

  it("should render with large size variant", () => {
    render(<SearchInput {...defaultProps} size="large" />);

    const input = screen.getByPlaceholderText("Search artists...");
    expect(input).toHaveClass("py-3", "text-lg");
  });

  it("should render search icon", () => {
    const { container } = render(<SearchInput {...defaultProps} />);

    // IoSearch is rendered as an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should have no outline style on input", () => {
    render(<SearchInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Search artists...");
    expect(input).toHaveStyle({ outline: "none" });
  });
});
