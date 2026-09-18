import express from 'express'
import {
  getAllBusinessHackStep4,
} from '../controller/businessHackStep4Controller.js'
import uploadStep4 from '../middleware/uploadStep4.js'
import { verifyBusinessAccess } from '../middleware/BusinessAuthMiddleware.js'
import { mutateStep } from '../controller/campaignWorkflow.controller.js'

const router = express.Router()

router.post('/create', verifyBusinessAccess, uploadStep4, mutateStep(4, 'create'))
router.get('/', verifyBusinessAccess, getAllBusinessHackStep4)
router.put('/:id', verifyBusinessAccess, uploadStep4, mutateStep(4, 'update'))
router.delete('/:id', verifyBusinessAccess, mutateStep(4, 'delete'))

export default router
