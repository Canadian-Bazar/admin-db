import express from 'express';
import trimRequest from 'trim-request';
import { setSeoHeadController, listSeoSettingsController, getSeoHeadController, updateSeoByIdController, deleteSeoByIdController } from '../controllers/seo.controller.js';

const router = express.Router();
router.use(trimRequest.all);

// List all SEO entries with optional search/pagination
router.get('/', listSeoSettingsController);

// Get SEO for a specific path via query (?path=/some)
router.get('/by-path', getSeoHeadController);

// Admin/editor endpoint to upsert SEO head snippet for a path
router.post('/', setSeoHeadController);

// Update SEO by id
router.put('/:id', updateSeoByIdController);

// Delete SEO by id
router.delete('/:id', deleteSeoByIdController);


export default router;
