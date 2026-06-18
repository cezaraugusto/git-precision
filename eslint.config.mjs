import auditorTs from 'eslint-config-auditor/ts'
import auditorStylistic from 'eslint-config-auditor/stylistic'
import auditorVitest from 'eslint-config-auditor/vitest'

export default [
  {ignores: ['dist/**', 'coverage/**', '**/*.json']},
  ...auditorTs,
  ...auditorStylistic,
  ...auditorVitest.map((c) => ({
    ...c,
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}']
  }))
]
