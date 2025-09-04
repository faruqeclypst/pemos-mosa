import PocketBase from 'pocketbase';

// TODO: This will be replaced at the end with your actual API URL / config
const POCKETBASE_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL);

export default pb;


