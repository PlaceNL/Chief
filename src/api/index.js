import {application, Router} from 'express';
import {gatherStats} from '../ws/util/statsUtil.js';

const {chief} = application;
const router = new Router();

router.get('/stats', (req, res) => {
    res.json(gatherStats(chief, true));
});

export default router;
