import { defineConfig } from 'prisma/config'

// Suppress the package.json#prisma deprecation warning.
// Connection URLs stay in schema.prisma for Prisma 6 compatibility.
// Prisma 7 will require moving them here — https://pris.ly/prisma-config
export default defineConfig({})
