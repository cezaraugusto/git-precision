[version-image]: https://img.shields.io/github/v/release/cezaraugusto/git-precision.svg?color=0971fe
[version-url]: https://github.com/cezaraugusto/git-precision/releases
[action-image]: https://github.com/cezaraugusto/git-precision/actions/workflows/ci.yml/badge.svg?branch=main
[action-url]: https://github.com/cezaraugusto/git-precision/actions

> Target and extract any file, folder, or full repository from GitHub, directly into your workflow.

# git-precision [![Version][version-image]][version-url] [![workflow][action-image]][action-url]

Fetch just the part of a GitHub repository you need, without cloning the whole thing. With `git-precision` you can:

- Fetch shared configs, templates, or workflows during CI
- Pull specific folders from monorepos to reuse in other workflows
- Extract starter files or framework examples at runtime
- Use a lightweight alternative to cloning when you only need a specific folder or file

## Get started immediately

### Pull a single file

```yaml
- name: Download a file from a GitHub repository
  uses: cezaraugusto/git-precision@v1
  with:
    url: https://github.com/username/repository/blob/main/.github/workflows/deploy.yml
    output: .github/workflows/deploy.yml
```

### Pull a folder

```yaml
- name: Download a subfolder from a GitHub repository
  uses: cezaraugusto/git-precision@v1
  with:
    url: https://github.com/username/repository/tree/main/templates/react
    output: ./templates/react
```

### Pull the whole repo

```yaml
- name: Download full GitHub repository
  uses: cezaraugusto/git-precision@v1
  with:
    url: https://github.com/username/repository
```

## Inputs

| Name     | Required | Description                                         |
| -------- | -------- | --------------------------------------------------- |
| `url`    | yes      | Full GitHub URL (file, folder, or repo) to download |
| `output` | no       | Exact destination path (relative to the workspace) for the file or folder |
| `text`   | no       | Optional log message (replaces default CLI output)  |

## Outputs

| Name            | Description                                                       |
| --------------- | ---------------------------------------------------------------- |
| `resolved-path` | Absolute path where the downloaded file or folder was placed     |

```yaml
- uses: cezaraugusto/git-precision@v1
  id: fetch
  with:
    url: https://github.com/username/repository/tree/main/templates/react
    output: ./templates/react
- run: echo "Downloaded to ${{ steps.fetch.outputs.resolved-path }}"
```

## Output Behavior

The `output` input determines the **exact path** where the downloaded file or folder will be placed. No additional nesting is added.

| URL Example                                                                 | output                          | What Gets Created                            |
|------------------------------------------------------------------------------|----------------------------------|------------------------------------------------|
| `https://github.com/user/repo/blob/main/file.js`                       | `./file.js`                | A single file at `./file.js`             |
| `https://github.com/user/repo/tree/main/folder/123`                    | `./folder/123`             | The contents of the folder       |
| `https://github.com/user/repo`                                               | `./repo`             | The full repo |

This design gives you full control of where each resource goes.

If the `output` path already exists, it will be overwritten. The `output` must resolve to a path **inside** the workspace; values that resolve to the workspace root (`.`) or escape it (`../`) are rejected to avoid destructive deletes.

## Limitations

- **Public repositories only.** Content is fetched over unauthenticated HTTPS, so private or internal repositories are not supported.
- **Git is required** on the runner (present by default on GitHub-hosted runners).

## Related projects

* [pintor](https://github.com/cezaraugusto/pintor)
* [log-md](https://github.com/cezaraugusto/log-md)
* [mklicense](https://github.com/cezaraugusto/mklicense)
* [prefers-yarn](https://github.com/cezaraugusto/prefers-yarn)
* [go-git-it](https://github.com/cezaraugusto/go-git-it)
* [isolated-deps](https://github.com/cezaraugusto/isolated-deps)

## License

MIT (c) Cezar Augusto.
