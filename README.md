# Tools API

**Tools API** is the backend for my tools website. Developed with Node.js, Fastify, and PostgreSQL, it powers the Tools App by handling requests from the tools site and routing them to appropriate services.

## Technologies

- **Node.js**: JavaScript runtime for the backend.
- **Fastify**: Web framework for building the API.
- **PostgreSQL**: Database for storing shortened URLs.
- **Redis**

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/caiovictorpcb/tools-api.git
   ```
2. Navigate to the directory:
   ```bash
   cd tools-api
   ```
3. Install dependencies with Bun:
   ```bash
   bun install
   ```

## Usage

Start the server:
```bash
bun run start
```

The API will be available at `http://localhost:3000` (or your configured port). Use it with the Tools App frontend.

## License

Licensed under MIT. See [LICENSE](LICENSE).
