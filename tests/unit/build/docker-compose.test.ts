import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(__dirname, '../../..')

describe('Docker-compose desarrollo local (#199)', () => {
  let compose: Record<string, any>
  let dockerfileLines: string[]

  beforeAll(() => {
    const composeRaw = readFileSync(resolve(ROOT, 'docker-compose.yml'), 'utf-8')
    compose = parseYaml(composeRaw)

    const dockerfile = readFileSync(resolve(ROOT, 'Dockerfile.dev'), 'utf-8')
    dockerfileLines = dockerfile.split('\n').map((l) => l.replace(/\r$/, ''))
  })

  describe('docker-compose.yml', () => {
    it('defines app service', () => {
      expect(compose.services.app).toBeDefined()
      expect(compose.services.app.container_name).toBe('tracciona-app')
    })

    it('uses Dockerfile.dev', () => {
      expect(compose.services.app.build.dockerfile).toBe('Dockerfile.dev')
    })

    it('maps port 3000', () => {
      const ports = compose.services.app.ports
      expect(ports.some((p: string) => p.includes('3000'))).toBeTruthy()
    })

    it('mounts source code for hot reload', () => {
      const volumes = compose.services.app.volumes
      expect(volumes.some((v: string) => v.includes('.:/app'))).toBeTruthy()
    })

    it('preserves node_modules from container', () => {
      const volumes = compose.services.app.volumes
      expect(volumes.some((v: string) => v.includes('/app/node_modules'))).toBeTruthy()
    })

    it('preserves .nuxt from container', () => {
      const volumes = compose.services.app.volumes
      expect(volumes.some((v: string) => v.includes('/app/.nuxt'))).toBeTruthy()
    })

    it('loads env from .env.local', () => {
      const envFile = compose.services.app.env_file
      const paths = Array.isArray(envFile) ? envFile.map((e: any) => e.path || e) : [envFile]
      expect(paths.some((p: string) => p.includes('.env.local'))).toBeTruthy()
    })

    it('sets NODE_ENV to development', () => {
      expect(compose.services.app.environment.NODE_ENV).toBe('development')
    })

    it('binds to 0.0.0.0 for container access', () => {
      expect(compose.services.app.environment.NUXT_HOST).toBe('0.0.0.0')
    })

    it('has healthcheck on /api/health', () => {
      expect(compose.services.app.healthcheck).toBeDefined()
      const test = compose.services.app.healthcheck.test
      expect(test.some((t: string) => t.includes('/api/health'))).toBeTruthy()
    })

    it('has restart policy', () => {
      expect(compose.services.app.restart).toBe('unless-stopped')
    })
  })

  describe('Dockerfile.dev', () => {
    it('uses Node 20 Alpine', () => {
      const fromLine = dockerfileLines.find((l) => l.startsWith('FROM'))
      expect(fromLine).toBeDefined()
      expect(fromLine).toMatch(/node:20-alpine/)
    })

    it('installs system dependencies for native modules', () => {
      const runLines = dockerfileLines.filter((l) => l.startsWith('RUN'))
      const installLine = runLines.find((l) => l.includes('apk add'))
      expect(installLine).toBeDefined()
      expect(installLine).toMatch(/libc6-compat/)
      expect(installLine).toMatch(/python3/)
    })

    it('copies package manifests first for layer caching', () => {
      const copyLines = dockerfileLines.filter((l) => l.startsWith('COPY'))
      const pkgCopy = copyLines.find(
        (l) => l.includes('package.json') && l.includes('package-lock.json'),
      )
      expect(pkgCopy).toBeDefined()
    })

    it('runs npm ci for deterministic installs', () => {
      const runLines = dockerfileLines.filter((l) => l.startsWith('RUN'))
      expect(runLines.some((l) => l.includes('npm ci'))).toBeTruthy()
    })

    it('exposes port 3000', () => {
      const exposeLine = dockerfileLines.find((l) => l.startsWith('EXPOSE'))
      expect(exposeLine).toBe('EXPOSE 3000')
    })

    it('starts nuxt dev', () => {
      const cmdLine = dockerfileLines.find((l) => l.startsWith('CMD'))
      expect(cmdLine).toBeDefined()
      expect(cmdLine).toMatch(/dev/)
    })

    it('sets workdir to /app', () => {
      const workdirLine = dockerfileLines.find((l) => l.startsWith('WORKDIR'))
      expect(workdirLine).toBe('WORKDIR /app')
    })
  })

  describe('SonarQube optional service', () => {
    it('has sonarqube service with quality profile', () => {
      expect(compose.services.sonarqube).toBeDefined()
      expect(compose.services.sonarqube.profiles).toEqual(expect.arrayContaining(['quality']))
    })

    it('uses sonarqube community image', () => {
      expect(compose.services.sonarqube.image).toBe('sonarqube:community')
    })

    it('maps SonarQube to port 9000', () => {
      const ports = compose.services.sonarqube.ports
      expect(ports.some((p: string) => p.includes('9000:9000'))).toBeTruthy()
    })

    it('has memory limit', () => {
      expect(compose.services.sonarqube.mem_limit).toBe('2g')
    })

    it('persists data with volumes', () => {
      const volumes = compose.services.sonarqube.volumes
      expect(volumes.some((v: string) => v.includes('sonar_data'))).toBeTruthy()
      expect(volumes.some((v: string) => v.includes('sonar_logs'))).toBeTruthy()
    })
  })

  describe('Required files exist', () => {
    it('docker-compose.yml exists', () => {
      expect(existsSync(resolve(ROOT, 'docker-compose.yml'))).toBeTruthy()
    })

    it('Dockerfile.dev exists', () => {
      expect(existsSync(resolve(ROOT, 'Dockerfile.dev'))).toBeTruthy()
    })
  })
})
