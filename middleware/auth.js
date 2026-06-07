const JWT_SECRET = process.env.JWT_SECRET || 'ydl-dev-secret';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return res.status(401).json({ error: 'Token expired' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.split(' ')[1];
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      req.user = null;
      return next();
    }
    req.user = payload;
  } catch {
    req.user = null;
  }
  next();
}
