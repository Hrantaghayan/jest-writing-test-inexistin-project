import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import HomeRoute from "./HomeRoute";
import { createServer } from "../test/server";

createServer([
  {
    path: "/api/repositories",
    method: "get",
    handler: (req) => {
      const language = req.url.searchParams.get("q")?.split("language:")[1]; // Extract query parameter from URL
      return {
        items: [
          {
            id: 1,
            full_name: `${language}_one`,
          },
          {
            id: 2,
            full_name: `${language}_two`,
          },
        ],
      };
    },
  },
]);

test("renders two links for each language", async () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HomeRoute />
    </MemoryRouter>
  );

  const languages = [
    "javascript",
    "typescript",
    "rust",
    "go",
    "phyton",
    "java",
  ];

  for (const language of languages) {
    const links = await screen.findAllByRole("link", {
      name: new RegExp(`${language}_`, "i"),
    });
    // Finds links containing "javascript_"
    // Expects exactly 2 links per language
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent(`${language}_one`);
    expect(links[1]).toHaveTextContent(`${language}_two`);
    expect(links[0]).toHaveAttribute("href", `/repositories/${language}_one`);
    expect(links[1]).toHaveAttribute("href", `/repositories/${language}_two`);
  }

  // loopOver each language
  //for each language make sure there are two links
  //assert that the links have the appropriate full_name
});
