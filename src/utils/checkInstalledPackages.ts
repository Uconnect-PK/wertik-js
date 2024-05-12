const fs = require("fs")
const path = require("path")
import { errorMessage } from "../logger/consoleMessages"

export function isPackageInstalled(packageName) {
  try {
    const packageJsonPath = path.resolve(process.cwd(), "package.json")
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))
    return (
      packageName in packageJson.dependencies ||
      packageName in packageJson.devDependencies
    )
  } catch (error) {
    return false
  }
}

export function check(name: string) {
  const isInstalled = isPackageInstalled(name)
  if (isInstalled) {
    return true
  } else {
    errorMessage(name + " is not installed, Exiting wertik-js process.")
    process.exit()
  }
}
