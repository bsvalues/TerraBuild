import { Router } from 'express';
import { storytellingController } from '../controllers/storytelling-controller';

// Create a router for the storytelling feature
const router = Router();

/**
 * @swagger
 * /api/stories/types:
 *   get:
 *     summary: Get available story types
 *     description: Returns a list of all available story types with descriptions
 *     responses:
 *       200:
 *         description: A list of story types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 storyTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 */
router.get('/types', storytellingController.getStoryTypes.bind(storytellingController));

/**
 * @swagger
 * /api/stories/generate:
 *   post:
 *     summary: Generate a story
 *     description: Generates a narrative story based on the provided parameters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyType
 *             properties:
 *               storyType:
 *                 type: string
 *                 enum: [cost_trends, regional_comparison, building_type_analysis, property_insights, improvement_analysis, infrastructure_health, custom]
 *               buildingTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               regions:
 *                 type: array
 *                 items:
 *                   type: string
 *               propertyIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               timeframe:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date
 *                   end:
 *                     type: string
 *                     format: date
 *               customPrompt:
 *                 type: string
 *               includeCharts:
 *                 type: boolean
 *               includeTables:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Generated story
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 story:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     narrative:
 *                       type: string
 *                     charts:
 *                       type: array
 *                     tables:
 *                       type: array
 *                     metadata:
 *                       type: object
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/generate', storytellingController.generateStory.bind(storytellingController));

export default router;