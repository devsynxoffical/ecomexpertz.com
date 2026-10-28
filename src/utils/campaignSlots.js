import { INITIAL_TASKS } from '../data/mockData.js';

/**
 * Ensures exactly 25 sequential campaign slots (Slot #1 to Slot #25)
 * Aligns custom assigned user tasks or global catalogue tasks strictly by slot number.
 */
export const get25CampaignSlots = (tasksPool) => {
  const pool = Array.isArray(tasksPool) && tasksPool.length > 0 ? tasksPool : INITIAL_TASKS;
  const slots = [];

  for (let i = 1; i <= 25; i++) {
    let match = null;

    // 0. If pool is an assigned 25-task queue and candidate at index (i - 1) matches slot i, prioritize it
    if (pool.length === 25 && pool[i - 1]) {
      const directCandidate = pool[i - 1];
      const slotVal = Number(directCandidate.slotNumber ?? directCandidate.slot_number ?? directCandidate.learningStep ?? directCandidate.learning_step);
      if (slotVal === i || directCandidate.id === `task-${100 + i}` || directCandidate.id === `tsk-step-${i}`) {
        match = directCandidate;
      }
    }

    // 1. Prioritize canonical learning task ID (task-101 .. task-125)
    if (!match) {
      match = pool.find(t => t.id === `task-${100 + i}`);
    }

    // 2. Fallback step task ID (tsk-step-1 .. 25)
    if (!match) {
      match = pool.find(t => t.id === `tsk-step-${i}`);
    }

    // 3. Look for explicit step pattern in title (e.g., "Step 2: ...")
    if (!match) {
      match = pool.find(t => {
        const m = (t.title || '').match(/step\s*#?(\d+)/i);
        return m && parseInt(m[1], 10) === i;
      });
    }

    // 4. Look for explicit slot number / learning step match
    if (!match) {
      match = pool.find(t => Number(t.slotNumber ?? t.slot_number ?? t.learningStep ?? t.learning_step) === i);
    }

    // 5. Sequential positional fallback from provided pool (if 25 items provided)
    if (!match && pool.length === 25 && pool[i - 1]) {
      match = pool[i - 1];
    }

    // 5. Fallback from initial tasks defaults
    if (!match) {
      match = INITIAL_TASKS.find(it => Number(it.learningStep ?? it.learning_step) === i) || INITIAL_TASKS[i - 1];
    }

    // 6. Complete synthetic fallback
    if (!match) {
      match = {
        id: `task-${100 + i}`,
        title: `Step ${i}: Campaign Promotion Task #${i}`,
        platform: i <= 10 ? 'eBay' : (i <= 20 ? 'Walmart' : 'Temu'),
        category: 'Flash Deals',
        price: 15 + i * 5,
        commissionRate: 4.0,
        orders: 1200 + i * 150,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
        requiredDeposit: 0,
        isLearning: true,
        learningStep: i,
        active: true
      };
    }

    const priceNum = match.price !== undefined ? parseFloat(match.price) : 10;
    const commNum = parseFloat(match.commissionRate ?? match.commission_rate ?? 4) || 4;
    const reqDepNum = match.requiredDeposit !== undefined ? parseFloat(match.requiredDeposit) : (parseFloat(match.required_deposit) || 0);
    const yieldAmt = parseFloat(((priceNum * commNum) / 100).toFixed(2));

    slots.push({
      ...match,
      slotNumber: i,
      slot_number: i,
      learningStep: i,
      learning_step: i,
      price: priceNum,
      commissionRate: commNum,
      commission_rate: commNum,
      yieldRate: `${commNum}%`,
      yield_rate: `${commNum}%`,
      yieldAmount: yieldAmt,
      yield_amount: yieldAmt,
      requiredDeposit: reqDepNum,
      required_deposit: reqDepNum,
      adminCustomized: Boolean(match.adminCustomized || reqDepNum > 0)
    });
  }

  return slots;
};
