import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database';

const router = Router();

// Get all projects for user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const result = await db.query(
      'SELECT id, name, thumbnail, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    res.json({ projects: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, canvasState, imageId } = req.body;

    const result = await db.query(
      'INSERT INTO projects (user_id, name, canvas_state, image_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, JSON.stringify(canvasState), imageId]
    );

    res.status(201).json({ success: true, project: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, canvasState } = req.body;

    const result = await db.query(
      'UPDATE projects SET name = $1, canvas_state = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, JSON.stringify(canvasState), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
