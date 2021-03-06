import path from 'path'
import execa from 'execa'
import { loadConfig } from '#/app/loadConfig'
import { serve } from '#/app/serve'

export async function serveCommand (
  configPath?: string,
  serverOptions?: {
    port: string
    watch: boolean
    setupDB: boolean
  },
) {
  const options = loadConfig({}, configPath)
  if (serverOptions?.setupDB) {
    console.log('setupDB=true')
    await execa(
      'node',
      [
        path.resolve(__dirname, '../../bin/iac'),
        'seed',
        ...(configPath ? ['--config', configPath] : []),
      ],
      {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        cwd: process.cwd(),
        env: {
          ...process.env,
        },
      },
    )
  }
  await serve(options, serverOptions)
}
