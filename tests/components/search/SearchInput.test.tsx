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

  it("keeps search accessible in each size", () => {
    const { rerender } = render(<SearchInput {...defaultProps} size="small" />);
    expect(screen.getByRole("searchbox", { name: "Search artists..." })).toBeInTheDocument();
    rerender(<SearchInput {...defaultProps} size="large" />);
    expect(screen.getByRole("searchbox", { name: "Search artists..." })).toHaveAttribute("enterKeyHint", "search");
  });

  it("should render search icon", () => {
    const { container } = render(<SearchInput {...defaultProps} />);

    // IoSearch is rendered as an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

});
