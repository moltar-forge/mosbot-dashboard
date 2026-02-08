import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MarkdownRenderer from "./MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders simple markdown content", () => {
    render(<MarkdownRenderer content="# Hello World" size="sm" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders markdown with bold text", () => {
    render(<MarkdownRenderer content="This is **bold** text" size="sm" />);
    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("renders markdown with lists", () => {
    const content = `
- Item 1
- Item 2
- Item 3
    `;
    render(<MarkdownRenderer content={content} size="sm" />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("renders markdown with code blocks", () => {
    const content = "Here is some `inline code` in text";
    render(<MarkdownRenderer content={content} size="sm" />);
    expect(screen.getByText("inline code")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MarkdownRenderer
        content="Test content"
        size="sm"
        className="custom-class"
      />
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
  });

  it("renders with xs size variant", () => {
    const { container } = render(
      <MarkdownRenderer content="Test content" size="xs" />
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("prose-xs");
  });

  it("renders with sm size variant by default", () => {
    const { container } = render(<MarkdownRenderer content="Test content" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("prose-sm");
  });

  it("renders markdown with links", () => {
    const content = "[Click here](https://example.com)";
    render(<MarkdownRenderer content={content} size="sm" />);
    const link = screen.getByText("Click here");
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
  });

  it("renders markdown with tables", () => {
    const content = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
    `;
    render(<MarkdownRenderer content={content} size="sm" />);
    expect(screen.getByText("Header 1")).toBeInTheDocument();
    expect(screen.getByText("Header 2")).toBeInTheDocument();
    expect(screen.getByText("Cell 1")).toBeInTheDocument();
    expect(screen.getByText("Cell 2")).toBeInTheDocument();
  });
});
