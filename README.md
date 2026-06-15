[version-image]: https://img.shields.io/badge/version-1.0.0-31C254
[version-url]: https://github.com/cezaraugusto/git-precision/releases/tag/v1.0.0
[action-image]: https://github.com/cezaraugusto/git-precision/actions/workflows/ci.yml/badge.svg?branch=main
[action-url]: https://github.com/cezaraugusto/git-precision/actions

# git-precision 🎯 [![version][version-image]][version-url] [![CI][action-image]][action-url]

> Download any file, folder, or repository from GitHub into your workflow.

Built for CI pipelines and developers who need **just the right part** of a GitHub repository, without the overhead of cloning the entire thing. With `git-precision` you can:

- Fetch **shared configs**, **templates**, or **workflows** during CI
- Pull specific **folders from monorepos** to reuse in other workflows
- Extract **starter files** or **framework examples** at runtime
- Lightweight alternative to cloning when you only need a specific folder/file

## Get started immediately

### 📄 Pull a single file

```yaml
- name: Download a file from a GitHub repository
  uses: cezaraugusto/git-precision@v1
  with:
    url: https://github.com/username/repository/blob/main/.github/workflows/deploy.yml
    output: .github/workflows/deploy.yml
```

### 🧱 Pull a folder

```yaml
- name: Download a subfolder from a GitHub repository
  uses: cezaraugusto/git-precision@v1
  with:
    url: https://github.com/username/repository/tree/main/templates/react
    output: ./templates/react
```

### 📦 Pull the whole repo

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

This design gives you full control of where each resource goes, which is especially useful in CI pipelines.

> **Note:** If the `output` path already exists, it will be overwritten. The `output` must resolve to a path **inside** the workspace — values that resolve to the workspace root (`.`) or escape it (`../`) are rejected to avoid destructive deletes.

## Limitations

- **Public repositories only.** Content is fetched over unauthenticated HTTPS, so private or internal repositories are not supported.
- **Git is required** on the runner (present by default on GitHub-hosted runners).

## License

MIT (c) Cezar Augusto
