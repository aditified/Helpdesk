import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { renderWithQuery } from "@/test/render";
import HomePage from "./HomePage";
import * as authClient from "@/lib/auth-client";
import { Role } from "core/constants/role.ts";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

describe("HomePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render admin analytics when role is admin", async () => {
    vi.spyOn(authClient, "useSession").mockReturnValue({
      data: {
        user: {
          id: "admin-1",
          name: "Admin User",
          email: "admin@example.com",
          emailVerified: true,
          role: Role.admin,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "sess-1",
          userId: "admin-1",
          token: "token",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      isPending: false,
      error: null,
    } as any);

    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "/api/tickets/stats") {
        return Promise.resolve({
          data: {
            role: Role.admin,
            totalTickets: 120,
            openTickets: 15,
            resolvedByAI: 45,
            aiResolutionRate: 37.5,
            avgResolutionTime: 3600,
          },
        });
      }
      if (url === "/api/tickets/stats/daily-volume") {
        return Promise.resolve({
          data: { data: [{ date: "2026-03-01", tickets: 5 }] },
        });
      }
      return Promise.reject(new Error("not found"));
    });

    renderWithQuery(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Total Tickets")).toBeInTheDocument();
    });

    expect(screen.getByText("Resolved by AI")).toBeInTheDocument();
    expect(screen.getByText("AI Resolution Rate")).toBeInTheDocument();
    expect(screen.getByText("Tickets Per Day")).toBeInTheDocument();
  });

  it("should render agent personal work analytics when role is agent", async () => {
    vi.spyOn(authClient, "useSession").mockReturnValue({
      data: {
        user: {
          id: "agent-1",
          name: "Agent Smith",
          email: "agent@example.com",
          emailVerified: true,
          role: Role.agent,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "sess-2",
          userId: "agent-1",
          token: "token",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      isPending: false,
      error: null,
    } as any);

    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "/api/tickets/stats") {
        return Promise.resolve({
          data: {
            role: Role.agent,
            totalTickets: 25,
            openTickets: 4,
            resolvedTickets: 20,
            closedTickets: 1,
            resolutionRate: 80.0,
            avgResolutionTime: 1800,
            totalReplies: 42,
          },
        });
      }
      if (url === "/api/tickets/stats/daily-volume") {
        return Promise.resolve({
          data: { data: [{ date: "2026-03-01", tickets: 3 }] },
        });
      }
      return Promise.reject(new Error("not found"));
    });

    renderWithQuery(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    expect(screen.getByText("Assigned Tickets")).toBeInTheDocument();
    expect(screen.getByText("Resolved by Me")).toBeInTheDocument();
    expect(screen.getByText("Resolution Rate")).toBeInTheDocument();
    expect(screen.getByText("Your Daily Tickets")).toBeInTheDocument();
    expect(
      screen.getByText("Overview of your assigned tickets and personal performance")
    ).toBeInTheDocument();
  });
});
