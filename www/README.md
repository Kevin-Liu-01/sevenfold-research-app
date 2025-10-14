# Sevenfold Marketing Website

The landing and marketing website for Sevenfold, built with Next.js and deployed on the `www` subdomain.

This is a SEO-optimized application showcasing Sevenfold's value proposition. The site uses Next.js 15's App Router and features 3D graphics (React Three Fiber) and animations (Framer Motion) to create an engaging user experience.

## Structure

The landing page (`src/app/page.tsx`) is composed of modular sections:

- **Hero**: 3D shader gradient background with headline
- **Problem/Solution**: Articulates pain points and how Sevenfold addresses them
- **Product Showcase**: Visual walkthrough of features
- **Trusted By**: Social proof carousel
- **CTA**: Conversion paths to the app

Each section is a standalone component in `src/components/`, making it easy to reorder, modify, or A/B test different messaging.
