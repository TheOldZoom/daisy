import * as fs from 'fs'
import * as path from 'path'

interface CodeStats {
  totalFiles: number
  totalLines: number
  totalChars: number
  averageLines: number
  averageChars: number
  fileExtensions: Record<string, number>
  largestFile: {
    path: string
    lines: number
    chars: number
  } | null
}

export async function analyzeCodeStats(dirPath: string): Promise<CodeStats> {
  const stats: CodeStats = {
    totalFiles: 0,
    totalLines: 0,
    totalChars: 0,
    averageLines: 0,
    averageChars: 0,
    fileExtensions: {},
    largestFile: null,
  }

  const excludePaths = ['node_modules', '.git', 'package-lock.json']

  await processDirectory(dirPath, stats, excludePaths)

  if (stats.totalFiles > 0) {
    stats.averageLines =
      Math.round((stats.totalLines / stats.totalFiles) * 100) / 100
    stats.averageChars =
      Math.round((stats.totalChars / stats.totalFiles) * 100) / 100
  }

  return stats
}

async function processDirectory(
  dirPath: string,
  stats: CodeStats,
  excludePaths: string[]
): Promise<void> {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (excludePaths.includes(entry.name)) {
        continue
      }

      if (entry.isDirectory()) {
        await processDirectory(fullPath, stats, excludePaths)
      } else if (entry.isFile()) {
        await processFile(fullPath, stats)
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }
}

async function processFile(filePath: string, stats: CodeStats): Promise<void> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8')

    const lines = content.split('\n').length
    const chars = content.length

    const ext = path.extname(filePath).toLowerCase()
    stats.fileExtensions[ext] = (stats.fileExtensions[ext] || 0) + 1

    stats.totalFiles++
    stats.totalLines += lines
    stats.totalChars += chars

    if (!stats.largestFile || lines > stats.largestFile.lines) {
      stats.largestFile = {
        path: filePath,
        lines,
        chars,
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
  }
}

export async function exportCodeStats(
  rootDir: string,
  outputFile: string = 'code-stats.json'
): Promise<void> {
  try {
    console.log(`Analyzing code in ${rootDir}...`)
    const stats = await analyzeCodeStats(rootDir)

    await fs.promises.writeFile(
      outputFile,
      JSON.stringify(stats, null, 2),
      'utf8'
    )

    console.log('Code statistics:')
    console.log(`Total files: ${stats.totalFiles}`)
    console.log(`Total lines: ${stats.totalLines}`)
    console.log(`Average lines per file: ${stats.averageLines}`)
    console.log(`Average characters per file: ${stats.averageChars}`)
    console.log(`File extensions: ${JSON.stringify(stats.fileExtensions)}`)
    if (stats.largestFile) {
      console.log(
        `Largest file: ${stats.largestFile.path} (${stats.largestFile.lines} lines)`
      )
    }
    console.log(`Full stats exported to ${outputFile}`)
  } catch (error) {
    console.error('Error exporting code stats:', error)
  }
}
