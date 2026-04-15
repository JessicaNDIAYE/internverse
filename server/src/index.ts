import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import userRoutes from './routes/users';
import { setupSockets } from './sockets/index';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// REST routes
app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/users', userRoutes);

// Socket.io
setupSockets(io);

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`InternVerse server running on http://localhost:${PORT}`);
});
