import express from 'express'
import {
  createInfluencer,
  getAllInfluencers,
  getInfluencerById,
  updateInfluencer,
  deleteInfluencerByPhone
} from '../controller/InfluencerUserController.js'

const router = express.Router()

router.post('/user-create', createInfluencer)
router.get('/', getAllInfluencers)
router.get('/:id', getInfluencerById)
router.put('/:id', updateInfluencer)
router.delete('/:phone', deleteInfluencerByPhone)
export default router
