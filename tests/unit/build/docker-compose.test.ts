import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const COMPOSE = readFileSync(resolve(ROOT, 'docker-compose.yml'), 'utf-8')
const DOCKERFILE = readFileSync(resolve(ROOT, 'Dockerfile.dev'), 'utf-8')

describe('Docker-compose desarrollo local (#199)', () => {
  describe('docker-compose.yml', () => {
    it('defines app service', () => {
      expect(COMPOSE).toContain('app:')
      expect(COMPOSE).toContain('container_name: tracciona-app')
    })

    it('uses Dockerfile.dev', () => {
      expect(COMPOSE).toContain('dockerfile: Dockerfile.dev')
    })

    it('maps port 3000', () => {
      expect(COMPOSE).toContain('3000')
    })

    it('mounts source code for hot reload', () => {
      expect(COMPOSE).toContain('.:/app')
    })

    it('preserves node_modules from container', () => {
      expect(COMPOSE).toContain('/app/node_modules')
    })

    it('preserves .nuxt from container', () => {
      expect(COMPOSE).toContain('/app/.nuxt')
    })

    it('loads env from .env.local', () => {
      expect(COMPOSE).toContain('.env.local')
    })

    it('sets NODE_ENV to development', () => {
      expect(COMPOSE).toContain('NODE_ENV: development')
    })

    it('binds to 0.0.0.0 for container access', () => {
      expect(COMPOSE).toContain('NUXT_HOST: 0.0.0.0')
    })

    it('has healthcheck on /api/health', () => {
      expect(COMPOSE).toContain('healthcheck')
      expect(COMPOSE).toContain('/api/health')
    })

    it('has restart policy', () => {
      expect(COMPOSE).toContain('restart: unless-stopped')
    })
  })

  describe('Dockerfile.dev', () => {
    it('uses Node 20 Alpine', () => {
      expect(DOCKERFILE).toContain('node:20-alpine')
    })

    it('installs system dependencies for native modules', () => {
      expect(DOCKERFILE).toContain('libc6-compat')
      expect(DOCKERFILE).toContain('python3')
    })

    it('copies package manifests first for layer caching', () => {
      expect(DOCKERFILE).toContain('COPY package.json package-lock.json')
    })

    it('runs npm ci for deterministic installs', () => {
      expect(DOCKERFILE).toContain('npm ci')
    })

    it('exposes port 3000', () => {
      expect(DOCKERFILE).toContain('EXPOSE 3000')
    })

    it('starts nuxt dev', () => {
      expect(DOCKERFILE).toContain('npm", "run", "dev"')
    })

    it('sets workdir to /app', () => {
      expect(DOCKERFILE).toContain('WORKDIR /app')
    })
  })

  describe('SonarQube optional service', () => {
    it('has sonarqube service with quality profile', () => {
      expect(COMPOSE).toContain('sonarqube:')
      expect(COMPOSE).toContain('quality')
    })

    it('uses sonarqube community image', () => {
      expect(COMPOSE).toContain('sonarqube:community')
    })

    it('maps SonarQube to port 9000', () => {
      expect(COMPOSE).toContain('9000:9000')
    })

    it('has memory limit', () => {
      expect(COMPOSE).toContain('mem_limit: 2g')
    })

    it('persists data with volumes', () => {
      expect(COMPOSE).toContain('sonar_data')
      expect(COMPOSE).toContain('sonar_logs')
    })
  })

  describe('Required files exist', () => {
    it('docker-compose.yml exists', () => {
      expect(existsSync(resolve(ROOT, 'docker-compose.yml'))).toBe(true)
    })

    it('Dockerfile.dev exists', () => {
      expect(existsSync(resolve(ROOT, 'Dockerfile.dev'))).toBe(true)
    })
  })
})
