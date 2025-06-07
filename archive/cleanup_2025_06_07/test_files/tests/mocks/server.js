import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock server for testing
const server = setupServer();

// Setup handlers
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

export { server, rest };