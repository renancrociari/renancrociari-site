import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const webpack = require('next/dist/compiled/webpack/webpack-lib');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const nodeModules = path.join(repoRoot, 'node_modules');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.resolve.modules = [
      path.join(repoRoot, 'node_modules'),
      ...(config.resolve.modules || ['node_modules']),
    ];
    const portfolioAliases = {
      '@': path.join(repoRoot, 'src/editor-ui'),
      app: path.join(repoRoot, 'src/editor-ui/app'),
      '@portfolio-os/blocks': path.join(nodeModules, '@portfolio-os/blocks/src/index.ts'),
      '@portfolio-os/core': path.join(nodeModules, '@portfolio-os/core/src/index.ts'),
      '@portfolio-os/core/content-utils': path.join(
        nodeModules,
        '@portfolio-os/core/src/content-utils.ts'
      ),
      '@portfolio-os/core/slugify': path.join(nodeModules, '@portfolio-os/core/src/slugify.ts'),
      '@portfolio-os/editor': path.join(nodeModules, '@portfolio-os/editor/src/index.ts'),
      '@portfolio-os/ui': path.join(nodeModules, '@portfolio-os/ui/src/index.ts'),
    };
    config.resolve.alias = { ...(config.resolve.alias || {}), ...portfolioAliases };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@portfolio-os\/core\/content-utils$/,
        path.join(nodeModules, '@portfolio-os/core/src/content-utils.ts')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^@portfolio-os\/core\/slugify$/,
        path.join(nodeModules, '@portfolio-os/core/src/slugify.ts')
      )
    );
    return config;
  },
};

export default nextConfig;
