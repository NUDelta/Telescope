var activeNodeCollection = new ActiveNodeCollection([
  {startLine: 2, endLine: 2, path: "a"},
  {startLine: 3, endLine: 4, path: "a"},
  {startLine: 2, endLine: 5, path: "b"},
  {startLine: 1, endLine: 1, path: "c"}
]);

var sourceCollection = new SourceCollection(null, {
  scripts: [
    {
      builtIn: false,
      domPath: "a",
      inline: true,
      js: "a1\na2\na3\na4",
      order: 1,
      path: "a",
      url: "https://localhost:3001/"
    },
    {
      builtIn: false,
      domPath: "b",
      inline: true,
      js: "b1\nb2\nb3\nb4\nb5\nb6",
      order: 2,
      path: "b",
      url: "https://localhost:3001/"
    },
    {
      builtIn: false,
      domPath: "c",
      inline: true,
      js: "c1\nc2\nc3",
      order: 3,
      path: "c",
      url: "https://localhost:3001/"
    }
  ],
  activeNodeCollection: activeNodeCollection
});