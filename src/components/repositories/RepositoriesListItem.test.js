import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RepositoriesListItem from "./RepositoriesListItem";

// jest.mock("../tree/FileIcon", () => {
//   return () => "file-icon component";
// });

function renderComponent() {
  const repository = {
    full_name: "owner/repo",
    language: "JavaScript",
    description: "A sample repository",
    owner: { login: "facebook" },
    name: "repo",
    html_url: "https://github.com/facebook/react",
  };

  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RepositoriesListItem repository={repository} />
    </MemoryRouter>
  );

  return {
    repository,
  };
}

test("shows a link to the github home page for this repository", async () => {
  const { repository } = renderComponent();
  // use this function whan you dont use mock functions
  await screen.findByRole("img", {
    name: /javaScript/i,
  });

  const linkRepo = screen.getByRole("link", {
    name: /GitHub Repository/i,
  });

  expect(linkRepo).toHaveAttribute("href", repository.html_url);
  expect(linkRepo).toHaveAttribute("target", "_blank");
  expect(linkRepo).toHaveAttribute("aria-label", "GitHub Repository");
  expect(linkRepo).toBeInTheDocument();
  // await act(async () => {
  //   await pause();
  // });
});

test("shows file icon with an appropriate icon", async () => {
  renderComponent();
  const icon = await screen.findByRole("img", {
    name: /javaScript/i,
  });
  expect(icon).toHaveClass("js-icon"); // Assuming the class for JavaScript icon is 'js-icon'
});

test("shows the link to the code editor page", async () => {
  const { repository } = renderComponent();
  const link = await screen.findByRole("link", {
    name: new RegExp(repository.owner.login, "i"),
  });

  expect(link).toHaveAttribute("href", `/repositories/${repository.full_name}`);
});

// MemoryRouter is a special type of router provided by React Router that's specifically designed for testing and situations where you don't have a browser environment
