import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { getPosts } from '@controllers/post.controller';
import { getPost } from '@controllers/post.controller';
import { createPost } from '@controllers/post.controller';
import { updatePost } from '@controllers/post.controller';
import { deletePost } from '@controllers/post.controller';
import { AuthRequest } from '@types';

const router = Router();

router.get('/', asyncHandler(getPosts));
router.get('/:id', asyncHandler(getPost));
router.post('/', asyncHandler(createPost));
router.patch('/:id', asyncHandler(updatePost));
router.delete('/:id', asyncHandler(deletePost));

export { router as postRouter };
