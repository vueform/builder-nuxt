import { existsSync } from 'fs'
import { NuxtModule } from '@nuxt/schema'
import { resolve } from 'pathe'
import {
  defineNuxtModule,
  addPluginTemplate,
  createResolver,
} from '@nuxt/kit'

export interface ModuleOptions {
  configPath?: string,
  builderConfigPath?: string,
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'VueformBuilder',
    configKey: 'vueform-builder',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: {
    configPath: undefined,
    builderConfigPath: undefined,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.build.transpile.push('@vueform/builder')

    nuxt.options.vite.optimizeDeps = {
      ...(nuxt.options.vite.optimizeDeps || {}),
      include: [
        ...(nuxt.options.vite.optimizeDeps?.include || []),
        'wnumb',
        'nouislider',
        'trix',
        'lodash',
        'axios',
        'json5',
        'prismjs',
      ]
    }

    const configBase = resolve(
      nuxt.options.rootDir,
      options.configPath || 'vueform.config.js'
    )

    const builderConfigBase = resolve(
      nuxt.options.rootDir,
      options.builderConfigPath || 'builder.config.js'
    )

    addPluginTemplate({
      async getContents() {
        const configPath = await resolver.resolvePath(configBase)
        const configPathExists = existsSync(configPath)
        const builderConfigPath = await resolver.resolvePath(builderConfigBase)
        const builderConfigPathExists = existsSync(builderConfigPath)

        if (!configPathExists) {
          throw new Error(
            `Vueform configuration was not located at ${configPath}`
          )
        }

        if (!builderConfigPathExists) {
          throw new Error(
            `Vueform Builder configuration was not located at ${configPath}`
          )
        }

        return `import { defineNuxtPlugin } from '#app'

        export default defineNuxtPlugin(async (nuxtApp) => {
          if (process.client) {
            const Vueform = (await import('@vueform/vueform/plugin.js')).default
            const vueformConfig = (await import('${configPath}')).default
            const Builder = (await import('@vueform/builder')).default
            const builderConfig = (await import('${builderConfigPath}')).default
            
            nuxtApp.vueApp.use(Vueform, vueformConfig)
            nuxtApp.vueApp.use(Builder, builderConfig)
          }

        })
        `
      },
      filename: 'vueformBuilderPlugin.mjs',
    })
  },
})

export default module