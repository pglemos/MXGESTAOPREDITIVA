import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const layoutPath = path.join(root, 'src/components/Layout.tsx')
let source = fs.readFileSync(layoutPath, 'utf8')

const scopedPageContent = `  const pageContent = (
    <MxRoleVisualScope manager={role !== 'vendedor'}>
      <MotionPage key={location.pathname} className="h-full">
        <Outlet />
      </MotionPage>
    </MxRoleVisualScope>
  )`

const plainPageContent = `  const pageContent = (
    <MotionPage key={location.pathname} className="h-full">
      <Outlet />
    </MotionPage>
  )`

if (source.includes(scopedPageContent)) {
  source = source.replace(scopedPageContent, plainPageContent)
}

if (!source.includes("<MxRoleVisualScope manager={role !== 'vendedor'}>\n      <MxSidebarShell")) {
  source = source.replace(
    `  return (\n    <MxSidebarShell`,
    `  return (\n    <MxRoleVisualScope manager={role !== 'vendedor'}>\n      <MxSidebarShell`,
  )
  source = source.replace(
    `    </MxSidebarShell>\n  )`,
    `      </MxSidebarShell>\n    </MxRoleVisualScope>\n  )`,
  )
}

fs.writeFileSync(layoutPath, source)
console.log('Management visual scope now wraps shell and routed content.')
