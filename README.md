# Relu Consultancy - AI Company Research Assistant

An AI-powered Company Research Assistant that enables users to research any company by providing either the company name or its website URL. The application automatically gathers information from the company’s website and other publicly available online sources, analyzes the collected information using AI, identifies potential competitors, and generates a professional downloadable PDF report.

## Features

- **Company Research**: Search by Name or Website URL. Fallback mechanisms automatically identify official domains.
- **Intelligent Web Crawling**: Bypasses boilerplate and duplicates, prioritizing high-value pages (`/about`, `/products`, etc.).
- **OpenRouter AI Integration**: Highly flexible AI orchestration with support for top-tier models (Claude 3.5, GPT-4, Llama 3) via structured JSON outputs.
- **Serper.dev Search**: Enhances data retrieval for competitors and contact information when on-page data is scarce.
- **Client-Side PDF Generation**: Generates a world-class, styled PDF directly in the browser using `@react-pdf/renderer`.
- **Discord Integration (Bonus)**: Automatically sends the generated PDF and applicant details to a configured Discord channel upon generation.
- **Modern UI/UX**: Built with Next.js, TailwindCSS, and Lucide Icons, featuring a responsive, dark-mode glassmorphism design.

## Setup Instructions

### 1. Prerequisites
Ensure you have Node.js (v18+) installed on your machine.

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Variables
No `.env` file is required for the core application to run locally because API keys are injected client-side via the application's secure UI. 

However, to use the application, you must input the following keys into the app's settings sidebar:
- **OpenRouter API Key** (For AI generation)
- **Serper.dev API Key** (For web search integration)
- **Discord Bot Token & Channel ID** (Optional: For webhook reporting)

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend API Routes**: Next.js Edge / Node.js Serverless Functions
- **Crawling**: Custom Cheerio-based intelligent DOM parser
- **PDF Generation**: `@react-pdf/renderer` (Client-side bundle to avoid server dependency bottlenecks)
- **Deployment**: Configured for seamless deployment on Vercel.

## Deployment

This project is optimized for deployment on Vercel. 
Simply push the code to a GitHub repository and connect it to Vercel. The `next.config.js` and `vercel.json` are pre-configured.
