import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import ITicketDetailPage from "./ITicketDetailPage";

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

function renderDetailPage(ticketId = "ig-101") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[`/i-tickets/${ticketId}`]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/i-tickets/:id" element={<ITicketDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("ITicketDetailPage", () => {
  it("should render email-ticket-style header, message, AI tools, replies, reply composer, and sidebar", async () => {
    renderDetailPage("ig-101");

    // Verify back link
    expect(screen.getByText("Back to i-Tickets")).toBeInTheDocument();

    // Verify conversation content and header details
    await waitFor(() => {
      expect(screen.getByText("What documents are required for admission?")).toBeInTheDocument();
      expect(screen.getByText(/For undergraduate admission, you will need/)).toBeInTheDocument();
      expect(screen.getAllByText("Rahul Sharma").length).toBeGreaterThan(0);
      expect(screen.getAllByText("@rahulsharma").length).toBeGreaterThan(0);
    });

    // Verify AI buttons
    expect(screen.getByRole("button", { name: /Summarize/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI Suggested Reply/i })).toBeInTheDocument();

    // Verify Replies section
    expect(screen.getByRole("heading", { name: "Replies" })).toBeInTheDocument();

    // Verify Add a Reply section
    expect(screen.getByRole("heading", { name: "Add a Reply" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your reply.../i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Polish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send Reply/i })).toBeInTheDocument();

    // Verify Sidebar: Status, Category, Assigned To, Customer details
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Assigned To")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Followers")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
  }, 15000);

  it("should allow sending an interactive reply in the thread with Polish and Send Reply buttons", async () => {
    const user = userEvent.setup();
    renderDetailPage("ig-102");

    await waitFor(() => {
      expect(screen.getAllByText("Priya Patel").length).toBeGreaterThan(0);
    });

    const textarea = screen.getByPlaceholderText(/Type your reply.../i);
    const polishBtn = screen.getByRole("button", { name: /Polish/i });
    const sendBtn = screen.getByRole("button", { name: /Send Reply/i });

    // Both buttons should initially be disabled when textarea is empty
    expect(polishBtn).toBeDisabled();
    expect(sendBtn).toBeDisabled();

    // Type a reply
    await user.type(textarea, "Hello Priya, we have verified your account.");
    expect(polishBtn).toBeEnabled();
    expect(sendBtn).toBeEnabled();

    // Submit reply
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Hello Priya, we have verified your account.")).toBeInTheDocument();
    });
  }, 15000);
});
