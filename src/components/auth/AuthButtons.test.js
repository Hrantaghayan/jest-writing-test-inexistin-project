import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { createServer } from "../../test/server";
import AuthButtons from "./AuthButtons";
import { SWRConfig } from "swr";

// need to create server do mock api call so the prompt is to understand form user object when user is empty it means user isn ot uathenticated and vice versa
// when we need to do some async operations like fetching data, we need to use async/await
// use describe to do server operations separately for signed in and signed out users
// describe only is used to run only this test suite, useful for debugging

async function renderComponent() {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthButtons />
      </MemoryRouter>
    </SWRConfig>
  );
  await screen.findAllByRole("link");
}

describe("when user is signed in", () => {
  createServer([
    {
      path: "/api/user",
      method: "get",
      handler: () => {
        console.log("LOGGED IN ");
        return {
          user: {
            id: 3,
            email: "asdasd@gmail.com",
          },
        };
      },
    },
  ]);

  test("Sign in and Sign up are not visible", async () => {
    await renderComponent();
    const signInButton = screen.queryByRole("link", {
      name: /sign in/i,
    });
    const signUpButton = screen.queryByRole("link", {
      name: /sign up/i,
    });
    expect(signInButton).toBeNull();
    expect(signUpButton).toBeNull();
    expect(signInButton).not.toBeInTheDocument();
    expect(signUpButton).not.toBeInTheDocument();
  });

  test("sign out is visible", async () => {
    await renderComponent();
    const signOutButton = screen.getByRole("link", {
      name: /sign out/i,
    });
    expect(signOutButton).toBeInTheDocument();
    expect(signOutButton).toHaveAttribute("href", "/signout");
  });
});

describe("when user is not signed in", () => {
  createServer([
    {
      path: "/api/user",
      method: "get",
      handler: () => {
        console.log("NOT LOGGED IN");
        return {
          user: null, // Simulating a user not signed in
        };
      },
    },
  ]);

  test("sign in and sign up are visible", async () => {
    await renderComponent();
    const signInButton = screen.getByRole("link", {
      name: /sign in/i,
    });
    const signUpButton = screen.getByRole("link", {
      name: /sign up/i,
    });
    expect(signInButton).toBeInTheDocument();
    expect(signUpButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute("href", "/signin");
    expect(signUpButton).toHaveAttribute("href", "/signup");
  });

  test("sign out is not visible", async () => {
    await renderComponent();
    const signOutButton = screen.queryByRole("link", {
      name: /sign out/i,
    });
    expect(signOutButton).toBeNull();
    expect(signOutButton).not.toBeInTheDocument();
  });
});
