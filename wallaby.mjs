// Configuration for Wallaby.js: https://wallabyjs.com/
export default function () {
  return {
    env: {
      params: {
        runner: "pnpm exec node",
      },
    },
  };
}
