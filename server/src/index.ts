import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); app.use(express.json());
const notConfigured = (res: express.Response) => res.status(503).json({ error: 'Backend provider credentials are not configured yet.', code: 'PROVIDER_NOT_CONFIGURED' });
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'study4all-api' }));
app.post('/api/auth/login', (_req, res) => notConfigured(res));
app.post('/api/auth/forgot', (_req, res) => notConfigured(res));
app.post('/api/learn/explain', (_req, res) => notConfigured(res));
app.post('/api/audio/transcript', (_req, res) => notConfigured(res));
app.post('/api/audio/generate', (_req, res) => notConfigured(res));
app.listen(Number(process.env.PORT ?? 3000), () => console.log('Study4All API listening'));
