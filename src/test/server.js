import { setupServer } from "msw/node";
import { rest } from "msw";

export function createServer(handlersConfig) {
  const handlers = handlersConfig.map((config) => {
    return rest[config?.method || "get"](config?.path, (req, res, ctx) => {
      return res(ctx.json(config?.handler(req, res, ctx)));
    });
  });

  const server = setupServer(...handlers);

  // before executing any tests inside this file

  beforeAll(() => {
    server.listen();
    // console.log("server is listhening");
  });

  // after each test inside this file regardless it passes or fails
  afterEach(() => {
    server.resetHandlers();
  });

  // after all different files inside this test are executed
  afterAll(() => {
    server.close();
    // console.log("server is closed");
  });
}

// this is inital example how we make fakerequests reusable
// const handlers = [
//   rest.get("/api/repositories", (req, res, ctx) => {
//     const language = req.url.searchParams.get("q")?.split("language:")[1]; // Extract query parameter from URL
//     console.log("language:", language);

//     // Return mock response with JSON data
//     return res(
//       ctx.json({
//         items: [
//           {
//             id: 1,
//             full_name: `${language}_one`,
//           },
//           {
//             id: 2,
//             full_name: `${language}_two`,
//           },
//         ],
//       })
//     );
//   }),
// ];

// const server = setupServer(...handlers);
// // before executing any tests inside this file

// beforeAll(() => {
//   server.listen();
// });

// // after each test inside this file regardless it passes or fails
// afterEach(() => {
//   server.resetHandlers();
// });

// // after all different files inside this test are executed
// afterAll(() => {
//   server.close();
// });
