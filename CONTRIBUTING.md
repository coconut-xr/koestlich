# Contributing

We are happy to accept contributions. This should help to get you started.
Feel free to reach out to us via a GH Issue, [Twitter](https://twitter.com/coconut_xr), or our [Discord](https://discord.gg/RbyaXJJaJM).

If you are new to contributing to git/github projects you can learn more about forking and making a Pull Request in this [tutorial](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).

## Kind of Contributions

### Bug Reports

We highly appreciate your help in identifying any bugs to enhance the project's quality. When reporting bugs, please add a Issue and provide detailed information including steps to reproduce the issue, your operating system, and environment. Attach screenshots or error logs if possible.

### New Features or Refactors

We appreciate work on new features and refactors. We recommend creating an issue to discuss your ideas with the community before starting any work. This can ensure that your proposals align with this project's goals.

### Improve Documentation and Adding Examples

Help make our documentation more comprehensive and user-friendly. We love to hear your criticism and love it even more if you contribute a fix such as, adding a example that helps users understand the library's functionality better.

### Improve CI and Testing

Enhance the efficiency and reliability of our Continuous Integration (CI) pipeline and testing suite. Propose and implement improvements to increase test coverage, optimize performance, and ensure the project's overall stability and quality.

## Development Setup

The source code of this library can be found under `/src`. Using the command `npm run dev` the source code is built into `/dist` and every subsequent change to the source code results in a new build.

*Required commands to built and watch the library:*
```
npm install
npm run dev
```

The library can be manually tested via `tests/manual` using `npm --prefix tests/manual run dev`. Feel free to test and showcase features by adding new  test cases / examples to the example app.

*Required commands to build and watch the example app:*
```
npm --prefix tests/manual install --legacy-peer-deps
npm --prefix tests/manual run dev
```