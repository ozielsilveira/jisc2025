#!/usr/bin/env node

/**
 * Commit Message Helper
 *
 * This script helps developers create properly formatted commit messages
 * following the Conventional Commits specification.
 */

import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const types = {
  feat: 'A new feature',
  fix: 'A bug fix',
  docs: 'Documentation only changes',
  style: 'Changes that do not affect the meaning of the code',
  refactor: 'A code change that neither fixes a bug nor adds a feature',
  perf: 'A code change that improves performance',
  test: 'Adding missing tests or correcting existing tests',
  build: 'Changes that affect the build system or external dependencies',
  ci: 'Changes to CI configuration files and scripts',
  chore: "Other changes that don't modify src or test files",
  revert: 'Reverts a previous commit'
}

const scopes = [
  'api',
  'auth',
  'database',
  'docs',
  'tests',
  'ci',
  'config',
  'deps',
  'components',
  'hooks',
  'pages',
  'public',
  'styles',
  'utils'
]

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

function displayTypes() {
  console.log('\n📋 Available commit types:')
  Object.entries(types).forEach(([type, description]) => {
    console.log(`  ${type.padEnd(10)} - ${description}`)
  })
  console.log('')
}

function displayScopes() {
  console.log('\n🎯 Common scopes (optional):')
  scopes.forEach((scope) => {
    console.log(`  - ${scope}`)
  })
  console.log('')
}

async function main() {
  console.log('🚀 Conventional Commit Message Helper\n')

  displayTypes()
  const type = await askQuestion('Enter commit type: ')

  if (!types[type]) {
    console.log('❌ Invalid commit type. Please use one of the listed types.')
    process.exit(1)
  }

  displayScopes()
  const scope = await askQuestion('Enter scope (optional): ')

  const description = await askQuestion('Enter description: ')

  if (!description) {
    console.log('❌ Description is required.')
    process.exit(1)
  }

  const body = await askQuestion('Enter body (optional): ')
  const footer = await askQuestion('Enter footer (optional): ')
  const isBreaking = await askQuestion('Is this a breaking change? (y/N): ')

  // Build commit message
  let commitMessage = type

  if (scope) {
    commitMessage += `(${scope})`
  }

  if (isBreaking.toLowerCase() === 'y' || isBreaking.toLowerCase() === 'yes') {
    commitMessage += '!'
  }

  commitMessage += `: ${description}`

  if (body) {
    commitMessage += `\n\n${body}`
  }

  if (footer) {
    commitMessage += `\n\n${footer}`
  }

  if (isBreaking.toLowerCase() === 'y' || isBreaking.toLowerCase() === 'yes') {
    if (!footer.includes('BREAKING CHANGE:')) {
      commitMessage += `\n\nBREAKING CHANGE: ${description}`
    }
  }

  console.log('\n✅ Generated commit message:')
  console.log('─'.repeat(50))
  console.log(commitMessage)
  console.log('─'.repeat(50))

  const confirm = await askQuestion('\nUse this commit message? (Y/n): ')

  if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
    console.log('❌ Commit cancelled.')
    process.exit(0)
  }

  console.log('\n📋 Copy and paste this command:')
  console.log(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`)

  rl.close()
}

main().catch(console.error)
