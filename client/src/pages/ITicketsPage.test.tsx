import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderWithQuery } from "@/test/render";
import ITicketsPage from "./ITicketsPage";

describe("ITicketsPage", () => {
  it("should render page header and table with the same columns as tickets except assignee", async () => {
    renderWithQuery(<ITicketsPage />);

    expect(screen.getByText("i-Ticket")).toBeInTheDocument();

    // Verify columns: Subject, Sender, Status, Category, Created (and no Assignee)
    expect(screen.getByRole("button", { name: /Subject/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sender/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Status/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Category/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Created/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assignee/i })).not.toBeInTheDocument();

    // Verify conversations from mock data render
    await waitFor(() => {
      expect(screen.getByText("Rahul Sharma")).toBeInTheDocument();
      expect(screen.getByText("@rahulsharma")).toBeInTheDocument();
      expect(screen.getByText("Priya Patel")).toBeInTheDocument();
      expect(screen.getByText("@priyapatel")).toBeInTheDocument();
      expect(screen.getByText("Aman Shah")).toBeInTheDocument();
      expect(screen.getByText("@amanshah")).toBeInTheDocument();
    });

    // Check subjects render as links
    expect(
      screen.getByText("Admission document requirements checklist")
    ).toBeInTheDocument();
    expect(screen.getByText("Unable to reset my password")).toBeInTheDocument();

    // Check status badges
    expect(screen.getAllByText("Resolved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
  }, 15000);

  it("should allow searching conversations by handle, name, or subject", async () => {
    const user = userEvent.setup();
    renderWithQuery(<ITicketsPage />);

    await waitFor(() => {
      expect(screen.getByText("Rahul Sharma")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search tickets/i);
    await user.type(searchInput, "priyapatel");

    await waitFor(() => {
      expect(screen.getByText("Priya Patel")).toBeInTheDocument();
      expect(screen.queryByText("Rahul Sharma")).not.toBeInTheDocument();
    });
  }, 15000);
});
