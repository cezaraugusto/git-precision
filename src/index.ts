import * as process from 'process'
import * as fs from 'fs'
import * as path from 'path'

import * as core from '@actions/core'
import goGitIt from 'go-git-it'

export interface FetchOptions {
  url: string;
  output?: string;
  text?: string;
}

/**
 * Move a file or directory, falling back to copy + remove when the source and
 * destination live on different filesystems (rename() raises EXDEV).
 */
function moveSync (source: string, destination: string): void {
  try {
    fs.renameSync(source, destination)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EXDEV') {
      fs.cpSync(source, destination, {recursive: true})
      fs.rmSync(source, {recursive: true, force: true})

      return
    }

    throw error
  }
}

/**
 * Download `url` and place it at the exact `output` path.
 *
 * `go-git-it` always writes content as `<dir>/<basename-of-target>`. To honor
 * `output` verbatim (for files and folders alike) we download into a temp dir
 * and move the single resulting entry to `output`, instead of letting the
 * basename get appended to a caller-provided directory.
 *
 * Returns the absolute path where the content was placed.
 */
export async function fetchToOutput (
  {url, output, text}: FetchOptions,
  cwd: string = process.cwd()
): Promise<string> {
  if (!output) {
    // No explicit destination: download into the workspace using go-git-it's
    // default naming (the basename of the URL target). Passing `cwd` is
    // equivalent to go-git-it's own default (process.cwd()).
    await goGitIt(url, cwd, text)

    return cwd
  }

  const destination = path.resolve(cwd, output)

  // Guard against destructive or escaping writes: the destination is removed
  // before download, so it must be strictly inside the workspace. This rejects
  // the workspace root itself ("."), parent directories, and "../"-style
  // path traversal alike.
  const relative = path.relative(cwd, destination)

  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `Refusing to use output "${output}": it must resolve to a path inside the workspace (got "${destination}").`
    )
  }

  const tempDir = fs.mkdtempSync(path.join(cwd, '.git-precision-'))

  try {
    await goGitIt(url, tempDir, text)

    const entries = fs.readdirSync(tempDir)

    if (entries.length !== 1) {
      throw new Error(
        `Expected exactly one downloaded entry but found ${entries.length}.`
      )
    }

    fs.rmSync(destination, {recursive: true, force: true})
    fs.mkdirSync(path.dirname(destination), {recursive: true})
    moveSync(path.join(tempDir, entries[0]), destination)

    return destination
  } finally {
    fs.rmSync(tempDir, {recursive: true, force: true})
  }
}

export async function run (): Promise<void> {
  try {
    const url = core.getInput('url', {required: true})
    const output = core.getInput('output')
    const text = core.getInput('text') || undefined

    const resolved = await fetchToOutput({url, output, text})

    core.info(`✅ Fetched: ${url} → ${output || resolved}`)
    core.setOutput('resolved-path', resolved)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

// Execute when invoked as the action entrypoint, but not when imported by tests.
if (process.env.NODE_ENV !== 'test') {
  run()
}
