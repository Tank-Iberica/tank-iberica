/**
 * Service container — lightweight dependency injection.
 *
 * Register service implementations and retrieve them by name.
 * Tests can override implementations with mocks.
 *
 * Usage:
 *   import { getService, registerService } from '../services/container'
 *
 *   // In endpoint:
 *   const email = getService('email')
 *   await email.send({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' })
 *
 *   // In tests:
 *   registerService('email', mockEmailService)
 */

import type { ServiceContainer, ServiceName } from './interfaces'

const services: Partial<ServiceContainer> = {}

/**
 * Register a service implementation.
 */
export function registerService<K extends ServiceName>(
  name: K,
  implementation: ServiceContainer[K],
): void {
  services[name] = implementation
}

/**
 * Retrieve a registered service.
 * Throws if the service hasn't been registered.
 */
export function getService<K extends ServiceName>(name: K): ServiceContainer[K] {
  const service = services[name]
  if (!service) {
    throw new Error(`Service "${name}" not registered. Call registerService() first.`)
  }
  return service
}

/**
 * Check if a service is registered.
 */
export function hasService(name: ServiceName): boolean {
  return name in services
}

/**
 * Clear all registered services (for testing).
 */
export function clearServices(): void {
  for (const key of Object.keys(services) as ServiceName[]) {
    Reflect.deleteProperty(services, key)
  }
}
