# ScribeMesh

ScribeMesh is an AI-driven documentation platform developed for hardware engineers, technicians, and system administrators. By processing video recordings of physical systems, devices, or network infrastructure, ScribeMesh utilizes Google's Gemini 2.5 Flash model to automatically identify key components, interfaces, and mechanical parts, rendering a comprehensive and interactive documentation interface.

## Core Features

- **Video Processing**: Native support for uploading and processing `.mp4`, `.mov`, and `.webm` video files (maximum file size: 50MB).
- **Automated Hardware Analysis**: Integrates with the Gemini 2.5 Flash model to detect hardware components autonomously and generate detailed operational descriptions, maintenance protocols, and troubleshooting diagnostics.
- **Interactive Documentation**: Generated component data is synchronized with specific video timestamps. Selecting a component automatically seeks the media player to the precise moment the part is visible.
- **Data Exportation**: Facilitates the export of generated hardware documentation into standard JSON format, enabling seamless integration with external knowledge bases and enterprise tools.
- **Modern User Interface**: Responsive architecture featuring a polished aesthetic, micro-animations, and comprehensive support for Dark, Light, and System preference themes.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) 15 (App Router Architecture)
- **Frontend**: React 19, TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **AI Integration**: `@google/generative-ai` (Gemini 2.5 Flash API)

## Getting Started

Follow the instructions below to configure the project in a local development environment.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd scribemesh
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory of the project and supply your Google Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

An API key can be procured from [Google AI Studio](https://aistudio.google.com/).

### 4. Initialize the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your web browser to access the application interface.

## Architecture Workflow

1. **Media Ingestion**: The client uploads a supported hardware video file. The application converts the media into a base64 encoded format.
2. **Analysis Routing**: The encoded video is transmitted to the internal `/api/analyze` Next.js API endpoint.
3. **Generative Model Processing**: The endpoint interfaces with the `gemini-2.5-flash` model, utilizing a strict system prompt tailored for hardware engineering analysis. The model returns structured JSON data containing chronological timestamps, component classifications, technical descriptions, and maintenance tips.
4. **Interactive Rendering**: The frontend application parses the resulting JSON and constructs a synchronized, side-by-side view comprising the media player and the interactive component catalog.
