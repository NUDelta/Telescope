var activeNodeCollection = new ActiveNodeCollection([
  //Active
  // a 2 3 4
  // b 2 3 4 5
  // c 1

  {startLine: 2, endLine: 2, path: "a", hits: 1, type: "function"},
  {startLine: 3, endLine: 4, path: "a", hits: 2, type: "function"},
  {startLine: 2, endLine: 5, path: "b", hits: 3, type: "function"},
  {startLine: 1, endLine: 1, path: "c", hits: 4, type: "function"},
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