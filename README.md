# Playing with Gherkin for codegen

I am perhaps perversely playing with the idea of using gherkin (cucumber) as a mechanism to *author* cross-platform tests. I *could* probably have each platform just implement its own gherkin bindings and test runner independently; but this approach might actually come with the benefit of keeping platform implementations *near* each other to facilitate easier cross-platform design.

## To use

```
yarn && yarn test
```

For now, this just assumes `js` is the `PLATFORM` and it outputs to `dist/`.

To really get this moving, we probably want a `build` command that generates code for each platform. And we may *then* want a `publish` command to:

1. publish platform artifacts as packages for consumption
1. publish docstrings and raw gherkin online for human consumption
