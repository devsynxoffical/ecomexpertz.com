import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vvlbhihvmwxajrezqvsf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ucObdhcAJ-fI3xbkShPt1Q_hF6uXw0N';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const UPDATES = [
  {
    id: 'tsk-eb-01',
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'tsk-eb-02',
    image_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'tsk-eb-03',
    image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'tsk-wm-01',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'tsk-wm-02',
    image_url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'tsk-tm-01',
    image_url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'tsk-tm-02',
    image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'
  }
];

async function run() {
  console.log('Updating Supabase tasks image_url...');
  for (const item of UPDATES) {
    const { error } = await supabase.from('tasks').update({ image_url: item.image_url }).eq('id', item.id);
    if (error) {
      console.warn(`Failed for ${item.id}:`, error.message);
    } else {
      console.log(`Updated ${item.id}`);
    }
  }
  console.log('All done!');
}

run();
